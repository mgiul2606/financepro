# app/api/smart_import.py
"""
Smart Import API endpoints for FinancePro v1.

Two-step flow:
  1. POST /api/v1/import/csv/preview  → parse, classify, reconcile, return preview
  2. POST /api/v1/import/csv/confirm  → create transactions from accepted rows
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated, Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.encryption import ProfileEncryptionContext, get_encryption_service
from app.core.rls import get_rls_context
from app.db.database import get_db
from app.models import (
    Account,
    Category,
    FinancialProfile,
    ImportJob,
    ImportStatus,
    ImportType,
    Merchant,
    Transaction,
    TransactionSource,
    TransactionType,
)
from app.models.user import User
from app.schemas.smart_import import (
    ClassificationInfo,
    DetectedFormatResponse,
    PreviewSummary,
    PreviewTransaction,
    ReconciliationInfo,
    SmartImportConfirmRequest,
    SmartImportConfirmResponse,
    SmartImportPreviewResponse,
)
from app.services.csv_import_service import CSVImportService, ParsedTransaction
from app.services.reconciliation_service import ReconciliationService
from app.services.transaction_classifier import TransactionClassifier

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory store for preview data (keyed by job_id).
# In production this would use Redis or the database.
_preview_cache: Dict[str, Dict[str, Any]] = {}

_TWO_PLACES = Decimal("0.01")


def _round_money(v: Decimal) -> Decimal:
    from decimal import ROUND_HALF_UP
    return Decimal(str(v)).quantize(_TWO_PLACES, rounding=ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# Step 1 – Preview
# ---------------------------------------------------------------------------

@router.post(
    "/csv/preview",
    response_model=SmartImportPreviewResponse,
    summary="Smart CSV preview",
    description="Upload a CSV, auto-detect format, classify, and reconcile. Returns a preview.",
)
async def smart_csv_preview(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(..., description="CSV file"),
    account_id: UUID = Form(..., description="Target account UUID"),
    financial_profile_id: UUID = Form(..., description="Financial profile UUID"),
) -> SmartImportPreviewResponse:
    rls = get_rls_context(db, current_user.id)
    rls.check_profile_access(financial_profile_id)

    # Read file bytes
    raw_bytes = await file.read()

    # 1. Parse CSV
    csv_svc = CSVImportService()
    parse_result = csv_svc.parse(raw_bytes)

    # 2. Classify + Reconcile each parsed transaction
    classifier = TransactionClassifier()
    reconciler = ReconciliationService(db)

    preview_txs: List[PreviewTransaction] = []
    to_import = 0
    duplicates = 0
    needs_review = 0

    for ptx in parse_result.transactions:
        # classification
        cl = classifier.classify(ptx.description, ptx.amount, db=db)
        # reconciliation
        rec = reconciler.check(
            profile_id=financial_profile_id,
            account_id=account_id,
            tx_date=ptx.date,
            amount=ptx.amount,
            description=ptx.original_description,
        )

        if rec.action == "skip":
            duplicates += 1
        elif rec.action == "flag":
            needs_review += 1
        else:
            to_import += 1

        preview_txs.append(
            PreviewTransaction(
                row_number=ptx.row_number,
                date=ptx.date,
                description=ptx.description,
                original_description=ptx.original_description,
                amount=float(ptx.amount),
                balance=float(ptx.balance) if ptx.balance is not None else None,
                currency=ptx.currency,
                classification=ClassificationInfo(
                    category=cl.category_name,
                    merchant=cl.merchant_name,
                    confidence=cl.confidence_score,
                    transaction_type=cl.suggested_transaction_type,
                    match_method=cl.match_method,
                ),
                reconciliation=ReconciliationInfo(
                    action=rec.action,
                    reason=rec.reason,
                    confidence=rec.confidence,
                    matched_transaction_id=rec.matched_transaction_id,
                ),
            )
        )

    # Create an ImportJob to track the import
    job = ImportJob(
        financial_profile_id=financial_profile_id,
        account_id=account_id,
        file_name=file.filename or "import.csv",
        file_path="",
        import_type=ImportType.CSV,
        status=ImportStatus.PENDING,
        total_rows=parse_result.total_rows,
        mapping_config=parse_result.detected_format.get("column_mapping"),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    job_id = str(job.id)

    # Cache preview data for the confirm step
    _preview_cache[job_id] = {
        "profile_id": str(financial_profile_id),
        "account_id": str(account_id),
        "transactions": parse_result.transactions,
        "classifications": {
            ptx.row_number: classifier.classify(ptx.description, ptx.amount, db=db)
            for ptx in parse_result.transactions
        },
        "reconciliations": {
            ptx.row_number: reconciler.check(
                profile_id=financial_profile_id,
                account_id=account_id,
                tx_date=ptx.date,
                amount=ptx.amount,
                description=ptx.original_description,
            )
            for ptx in parse_result.transactions
        },
    }

    detected = parse_result.detected_format
    return SmartImportPreviewResponse(
        job_id=job_id,
        detected_format=DetectedFormatResponse(
            encoding=detected.get("encoding", "utf-8"),
            separator=detected.get("separator", ","),
            date_format=detected.get("date_format", "dd/MM/yyyy"),
            column_mapping=detected.get("column_mapping", {}),
            header_row=detected.get("header_row", 0),
        ),
        preview_transactions=preview_txs,
        summary=PreviewSummary(
            total_rows=parse_result.total_rows,
            parsed_rows=parse_result.parsed_rows,
            to_import=to_import,
            duplicates=duplicates,
            needs_review=needs_review,
            parse_errors=parse_result.skipped_rows,
        ),
        warnings=parse_result.warnings,
    )


# ---------------------------------------------------------------------------
# Step 2 – Confirm
# ---------------------------------------------------------------------------

@router.post(
    "/csv/confirm",
    response_model=SmartImportConfirmResponse,
    summary="Confirm smart CSV import",
    description="Create transactions from the previously previewed CSV data.",
)
async def smart_csv_confirm(
    body: SmartImportConfirmRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> SmartImportConfirmResponse:
    rls = get_rls_context(db, current_user.id)

    job_id = body.job_id
    cached = _preview_cache.get(job_id)
    if cached is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preview session not found. Please re-upload the CSV.",
        )

    profile_id = UUID(cached["profile_id"])
    account_id = UUID(cached["account_id"])
    rls.check_profile_access(profile_id)

    # Retrieve the import job
    job = db.query(ImportJob).filter(ImportJob.id == UUID(job_id)).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")

    job.status = ImportStatus.PROCESSING
    job.started_at = datetime.now(timezone.utc)
    db.commit()

    profile = db.query(FinancialProfile).filter(FinancialProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Financial profile not found")

    encryption_svc = get_encryption_service()

    transactions: List[ParsedTransaction] = cached["transactions"]
    classifications = cached["classifications"]
    reconciliations = cached["reconciliations"]
    overrides = body.user_overrides or {}

    imported = 0
    skipped = 0
    flagged = 0
    errors = 0

    for ptx in transactions:
        row_key = str(ptx.row_number)
        cl = classifications[ptx.row_number]
        rec = reconciliations[ptx.row_number]

        # Apply user overrides
        override = overrides.get(row_key)
        if override:
            if override.category:
                cl = type(cl)(
                    category_name=override.category,
                    merchant_name=cl.merchant_name,
                    confidence_score=1.0,
                    match_method="user_override",
                    suggested_transaction_type=cl.suggested_transaction_type,
                )
            if override.action == "import":
                rec = type(rec)(
                    action="import", confidence=1.0,
                    matched_transaction_id=None, reason="user_override",
                )
            elif override.action == "skip":
                rec = type(rec)(
                    action="skip", confidence=1.0,
                    matched_transaction_id=rec.matched_transaction_id,
                    reason="user_override",
                )

        # Decide action
        if rec.action == "skip":
            skipped += 1
            continue

        if rec.action == "flag" and not body.import_flagged:
            # Keep flagged unless user chose to import all flagged
            if not (override and override.action == "import"):
                flagged += 1
                continue

        # Create the transaction
        try:
            _create_transaction(
                db=db,
                job=job,
                ptx=ptx,
                classification=cl,
                profile=profile,
                account_id=account_id,
                encryption_svc=encryption_svc,
            )
            imported += 1
        except Exception as exc:
            logger.error(f"Error importing row {ptx.row_number}: {exc}")
            errors += 1

    # Finalise the import job
    job.processed_rows = len(transactions)
    job.successful_imports = imported
    job.failed_imports = errors
    job.skipped_duplicates = skipped
    job.completed_at = datetime.now(timezone.utc)
    job.status = (
        ImportStatus.COMPLETED if errors == 0
        else ImportStatus.PARTIAL if imported > 0
        else ImportStatus.FAILED
    )
    db.commit()

    # Clean up cache
    _preview_cache.pop(job_id, None)

    return SmartImportConfirmResponse(
        job_id=job_id,
        status=job.status.value,
        imported=imported,
        skipped_duplicates=skipped,
        flagged_for_review=flagged,
        errors=errors,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_transaction(
    db: Session,
    job: ImportJob,
    ptx: ParsedTransaction,
    classification: Any,
    profile: FinancialProfile,
    account_id: UUID,
    encryption_svc: Any,
) -> Transaction:
    """Persist a single transaction row."""
    amount = _round_money(ptx.amount)

    # Map transaction type string to enum
    try:
        tx_type = TransactionType(classification.suggested_transaction_type)
    except ValueError:
        tx_type = TransactionType.PURCHASE if amount < 0 else TransactionType.INCOME

    # Resolve category
    category_id = None
    if classification.category_name and classification.category_name != "Uncategorized":
        cat = db.query(Category).filter(
            Category.user_id == profile.user_id,
            Category.name.ilike(classification.category_name),
        ).first()
        if cat:
            category_id = cat.id

    # Resolve merchant
    merchant_id = None
    if classification.merchant_name:
        from sqlalchemy import or_
        merchant = db.query(Merchant).filter(
            or_(
                Merchant.canonical_name.ilike(f"%{classification.merchant_name}%"),
                Merchant.aliases.contains([classification.merchant_name]),
            )
        ).first()
        if merchant:
            merchant.usage_count += 1
            merchant_id = merchant.id
        else:
            merchant = Merchant(
                canonical_name=classification.merchant_name,
                usage_count=1,
            )
            db.add(merchant)
            db.flush()
            merchant_id = merchant.id

    # Encryption for high-security profiles
    if profile.is_high_security:
        # For HS profiles without a password, store cleartext (the user
        # didn't provide a password in this flow).
        encrypted_amount = str(amount)
        encrypted_description = ptx.description
        encrypted_notes = None
    else:
        encrypted_amount = str(amount)
        encrypted_description = ptx.description
        encrypted_notes = None

    tx = Transaction(
        financial_profile_id=job.financial_profile_id,
        account_id=account_id,
        category_id=category_id,
        merchant_id=merchant_id,
        transaction_date=ptx.date,
        transaction_type=tx_type,
        source=TransactionSource.IMPORT_CSV,
        amount=encrypted_amount,
        amount_clear=amount,
        currency=ptx.currency,
        amount_in_profile_currency=_round_money(amount),
        description=encrypted_description,
        description_clear=ptx.description[:255] if ptx.description else None,
        original_description=ptx.original_description[:500] if ptx.original_description else None,
        merchant_name=classification.merchant_name,
        confidence_score=classification.confidence_score,
        is_verified=False,
        import_job_id=job.id,
    )
    db.add(tx)
    db.flush()
    return tx
