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
import re
from datetime import datetime, timedelta, timezone
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

# Pre-compiled patterns for detecting summary/balance rows
_SUMMARY_ROW_PATTERNS = [
    re.compile(p, re.IGNORECASE) for p in [
        r"saldo\s*(finale|iniziale|contabile|disponibile)",
        r"totale\s*(dare|avere|movimenti|periodo)",
        r"riepilogo",
        r"balance",
        r"total\b",
        r"n\.\s*movimenti",
        r"^\s*$",
    ]
]


def _round_money(v: Decimal) -> Decimal:
    from decimal import ROUND_HALF_UP
    return Decimal(str(v)).quantize(_TWO_PLACES, rounding=ROUND_HALF_UP)


def _is_summary_row(description: str) -> bool:
    """Detect summary/balance rows that are not real transactions."""
    desc_lower = description.lower().strip()
    return any(p.search(desc_lower) for p in _SUMMARY_ROW_PATTERNS)


def _batch_reconcile(
    transactions: List[ParsedTransaction],
    db: Session,
    profile_id: UUID,
    account_id: UUID,
) -> Dict[int, "ReconciliationResult"]:
    """Batch reconciliation: one query instead of N queries.

    Uses hash-based exact matching first (O(1) per row), only falls back
    to fuzzy SequenceMatcher for rows that have an amount+date near-match
    but no exact description match.
    """
    from app.services.reconciliation_service import ReconciliationResult

    results: Dict[int, ReconciliationResult] = {}

    if not transactions:
        return results

    # Find date range across all transactions
    min_date = min(t.date for t in transactions) - timedelta(days=3)
    max_date = max(t.date for t in transactions) + timedelta(days=3)

    # SINGLE QUERY: load all existing transactions in date range
    from sqlalchemy import and_
    existing = db.query(Transaction).filter(
        and_(
            Transaction.financial_profile_id == profile_id,
            Transaction.account_id == account_id,
            Transaction.transaction_date.between(min_date, max_date),
        )
    ).all()

    # Build hash index for fast exact-match lookups: (date, amount, desc) → tx
    exact_index: Dict[tuple, Transaction] = {}
    # Build secondary index: (date, amount) → [tx, ...] for near-matches
    date_amount_index: Dict[tuple, List[Transaction]] = {}
    for tx in existing:
        desc_norm = (tx.description_clear or "").lower().strip()
        key = (tx.transaction_date, tx.amount_clear, desc_norm)
        exact_index[key] = tx
        # Also index by (date, amount) for fast narrowing
        da_key = (tx.transaction_date, tx.amount_clear)
        date_amount_index.setdefault(da_key, []).append(tx)
        # Add ±1 day keys for broader matching
        for delta in (-1, 1):
            da_key2 = (tx.transaction_date + timedelta(days=delta), tx.amount_clear)
            date_amount_index.setdefault(da_key2, []).append(tx)

    for ptx in transactions:
        desc_lower = ptx.original_description.lower().strip()

        # Level 1 — exact hash match (instant, no string comparison)
        exact_key = (ptx.date, ptx.amount, desc_lower)
        if exact_key in exact_index:
            tx = exact_index[exact_key]
            results[ptx.row_number] = ReconciliationResult(
                action="skip", confidence=1.0,
                matched_transaction_id=str(tx.id),
                reason="exact_duplicate",
            )
            continue

        # Level 2 — same amount + date (±1 day), needs description check
        # Only do expensive SequenceMatcher on the small subset of candidates
        da_key = (ptx.date, ptx.amount)
        candidates = date_amount_index.get(da_key, [])
        best_result = None

        if candidates:
            from difflib import SequenceMatcher
            for tx in candidates:
                existing_desc = (tx.description_clear or "").lower().strip()
                date_diff = abs((tx.transaction_date - ptx.date).days)
                similarity = SequenceMatcher(None, desc_lower, existing_desc).ratio()
                if date_diff <= 1 and similarity >= 0.85:
                    best_result = ReconciliationResult(
                        action="skip", confidence=0.9,
                        matched_transaction_id=str(tx.id),
                        reason="likely_duplicate",
                    )
                    break

        # Level 3 — wider tolerance (amount ±1%, date ±3 days)
        if best_result is None and ptx.amount != 0:
            amount_low = ptx.amount * Decimal("0.99")
            amount_high = ptx.amount * Decimal("1.01")
            # Check nearby amounts in existing — but limit to a fast scan
            for tx in existing:
                if tx.amount_clear is None:
                    continue
                date_diff = abs((tx.transaction_date - ptx.date).days)
                if date_diff > 3:
                    continue
                if not (amount_low <= tx.amount_clear <= amount_high):
                    continue
                from difflib import SequenceMatcher
                existing_desc = (tx.description_clear or "").lower().strip()
                similarity = SequenceMatcher(None, desc_lower, existing_desc).ratio()
                if similarity >= 0.70:
                    confidence = 0.6 + (similarity - 0.70) * 0.67
                    if best_result is None or confidence > best_result.confidence:
                        best_result = ReconciliationResult(
                            action="flag", confidence=round(confidence, 2),
                            matched_transaction_id=str(tx.id),
                            reason="possible_match",
                        )

        if best_result is None:
            best_result = ReconciliationResult(
                action="import", confidence=0.0,
                matched_transaction_id=None, reason="new",
            )

        results[ptx.row_number] = best_result

    return results


def _batch_classify(
    transactions: List[ParsedTransaction],
    db: Session,
    profile_id: UUID,
) -> Dict[int, Any]:
    """Classify all transactions with minimal DB queries.

    Loads ALL user rules and ALL merchants upfront in 2 queries,
    then classifies purely in-memory.
    """
    from app.services.transaction_classifier import (
        ClassificationResult,
        TransactionClassifier,
    )

    results: Dict[int, Any] = {}
    if not transactions:
        return results

    # ---- 1 query: load ALL user category rules for this profile ----
    try:
        from app.models.user_category_rule import UserCategoryRule
        all_rules = db.query(UserCategoryRule).filter(
            UserCategoryRule.financial_profile_id == profile_id,
        ).all()
    except Exception:
        all_rules = []

    # Build in-memory lookup structures for rules
    exact_rules: Dict[str, UserCategoryRule] = {}  # normalized_desc → rule
    keyword_rules: List[UserCategoryRule] = []
    for rule in all_rules:
        if rule.match_type == "exact_description":
            exact_rules[rule.match_value] = rule  # already stored UPPER
        elif rule.match_type == "contains_keyword":
            keyword_rules.append(rule)

    # ---- 1 query: pre-load ALL categories for name resolution ----
    from app.models.category import Category
    from app.models.user import User as UserModel
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == profile_id
    ).first()
    cat_id_to_name: Dict[UUID, str] = {}
    if profile:
        all_cats = db.query(Category).filter(
            Category.user_id == profile.user_id
        ).all()
        cat_id_to_name = {c.id: c.name for c in all_cats}

    # ---- Create classifier (loads merchants once via its internal cache) ----
    classifier = TransactionClassifier()
    # Pre-warm the merchant cache with a single DB query
    classifier._merchant_cache = db.query(Merchant).all()

    # ---- Classify each transaction in-memory ----
    for ptx in transactions:
        normalized = ptx.description.strip().upper()

        # Priority 1: User exact rule (pure dict lookup, no DB)
        rule = exact_rules.get(normalized)
        if rule:
            cat_name = cat_id_to_name.get(rule.category_id, "Uncategorized")
            results[ptx.row_number] = ClassificationResult(
                category_name=cat_name,
                merchant_name=None,
                confidence_score=0.98,
                match_method="user_rule_exact",
                suggested_transaction_type=classifier._infer_transaction_type(
                    ptx.description.lower(), ptx.amount
                ),
            )
            continue

        # Priority 2: User keyword rule (in-memory scan, no DB)
        matched_rule = None
        for kr in keyword_rules:
            if kr.match_value.upper() in normalized:
                matched_rule = kr
                break
        if matched_rule:
            cat_name = cat_id_to_name.get(matched_rule.category_id, "Uncategorized")
            results[ptx.row_number] = ClassificationResult(
                category_name=cat_name,
                merchant_name=None,
                confidence_score=0.90,
                match_method="user_rule_keyword",
                suggested_transaction_type=classifier._infer_transaction_type(
                    ptx.description.lower(), ptx.amount
                ),
            )
            continue

        # Priority 3: Global classifier (uses pre-cached merchants, no DB)
        results[ptx.row_number] = classifier.classify(
            ptx.description, ptx.amount, db=None  # No DB — merchants already cached
        )

    return results


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

    # 2. Batch-classify all transactions (minimal DB queries)
    classifications = _batch_classify(
        parse_result.transactions, db, financial_profile_id,
    )

    # 3. Batch reconciliation (single DB query instead of N)
    reconciliations = _batch_reconcile(
        parse_result.transactions, db, financial_profile_id, account_id,
    )

    # 4. Build preview response
    preview_txs: List[PreviewTransaction] = []
    to_import = 0
    duplicates = 0
    needs_review = 0

    for ptx in parse_result.transactions:
        cl = classifications[ptx.row_number]
        rec = reconciliations[ptx.row_number]

        # Detect summary/balance rows
        is_summary = _is_summary_row(ptx.description)
        parse_warnings: List[str] = []
        is_parseable = True

        if is_summary:
            is_parseable = False
            parse_warnings.append("Riga di riepilogo/saldo rilevata automaticamente")

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
                is_parseable=is_parseable,
                parse_warnings=parse_warnings,
            )
        )

    # Create an ImportJob to track the import
    detected = parse_result.detected_format
    summary_data = PreviewSummary(
        total_rows=parse_result.total_rows,
        parsed_rows=parse_result.parsed_rows,
        to_import=to_import,
        duplicates=duplicates,
        needs_review=needs_review,
        parse_errors=parse_result.skipped_rows,
    )

    # Serialize preview data for persistence (enables resume)
    preview_data_serialized = []
    for ptx_schema in preview_txs:
        preview_data_serialized.append(ptx_schema.model_dump(mode="json"))

    job = ImportJob(
        financial_profile_id=financial_profile_id,
        account_id=account_id,
        file_name=file.filename or "import.csv",
        file_path="",
        import_type=ImportType.CSV,
        status=ImportStatus.PENDING,
        total_rows=parse_result.parsed_rows,
        mapping_config={
            "detected_format": {
                "encoding": detected.get("encoding", "utf-8"),
                "separator": detected.get("separator", ","),
                "date_format": detected.get("date_format", "dd/MM/yyyy"),
                "column_mapping": detected.get("column_mapping", {}),
                "header_row": detected.get("header_row", 0),
            },
            "preview_data": preview_data_serialized,
            "summary": summary_data.model_dump(mode="json"),
            "warnings": parse_result.warnings,
        },
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    job_id = str(job.id)

    # Cache preview data for the confirm step (in-memory for fast access)
    _preview_cache[job_id] = {
        "profile_id": str(financial_profile_id),
        "account_id": str(account_id),
        "transactions": parse_result.transactions,
        "classifications": classifications,
        "reconciliations": reconciliations,
    }

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
        summary=summary_data,
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

    # Pre-cache categories and merchants to avoid N per-row queries
    all_categories = db.query(Category).filter(Category.user_id == profile.user_id).all()
    category_lookup: Dict[str, UUID] = {cat.name.lower(): cat.id for cat in all_categories}
    all_merchants = db.query(Merchant).all()
    merchant_lookup: Dict[str, Merchant] = {m.canonical_name.lower(): m for m in all_merchants}

    transactions: List[ParsedTransaction] = cached["transactions"]
    classifications = cached["classifications"]
    reconciliations = cached["reconciliations"]
    overrides = body.user_overrides or {}
    excluded_rows = set(body.excluded_rows)

    imported = 0
    skipped = 0
    flagged = 0
    errors = 0
    transactions_to_insert: list = []

    for ptx in transactions:
        # Skip rows excluded by user
        if ptx.row_number in excluded_rows:
            skipped += 1
            continue

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

        # Invert amount if requested
        if body.invert_amounts:
            ptx = ParsedTransaction(
                date=ptx.date,
                description=ptx.description,
                amount=-ptx.amount,
                original_description=ptx.original_description,
                balance=ptx.balance,
                currency=ptx.currency,
                row_number=ptx.row_number,
                raw_data=ptx.raw_data,
            )

        # Build transaction object (without committing)
        try:
            tx = _build_transaction(
                db=db,
                job=job,
                ptx=ptx,
                classification=cl,
                account_id=account_id,
                category_lookup=category_lookup,
                merchant_lookup=merchant_lookup,
            )
            transactions_to_insert.append(tx)
            imported += 1
        except Exception as exc:
            logger.error(f"Error importing row {ptx.row_number}: {exc}")
            errors += 1

    # Learn from user category overrides
    if overrides:
        try:
            from app.services.category_learning_service import CategoryLearningService
            learning_svc = CategoryLearningService(db, profile_id)
            preview_data_map = {ptx.row_number: ptx for ptx in transactions}
            for row_key, override in overrides.items():
                if override.category:
                    row_num = int(row_key)
                    ptx = preview_data_map.get(row_num)
                    if ptx:
                        # Use cached category lookup
                        cat_id = category_lookup.get(override.category.lower())
                        if cat_id:
                            learning_svc.learn_from_correction(
                                original_description=ptx.original_description,
                                assigned_category_id=cat_id,
                                source="import_override",
                            )
        except ImportError:
            pass

    # BULK INSERT — single round-trip to DB
    if transactions_to_insert:
        db.add_all(transactions_to_insert)

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

    # SINGLE COMMIT for everything
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

def _build_transaction(
    db: Session,
    job: ImportJob,
    ptx: ParsedTransaction,
    classification: Any,
    account_id: UUID,
    category_lookup: Dict[str, UUID],
    merchant_lookup: Dict[str, Merchant],
) -> Transaction:
    """Build a Transaction object for bulk insert (does not commit or flush).

    Uses pre-cached category_lookup and merchant_lookup to avoid per-row DB queries.
    """
    amount = _round_money(ptx.amount)

    # Map transaction type string to enum
    try:
        tx_type = TransactionType(classification.suggested_transaction_type)
    except ValueError:
        tx_type = TransactionType.PURCHASE if amount < 0 else TransactionType.INCOME

    # Resolve category from cache
    category_id = None
    if classification.category_name and classification.category_name != "Uncategorized":
        category_id = category_lookup.get(classification.category_name.lower())

    # Resolve merchant from cache
    merchant_id = None
    if classification.merchant_name:
        merchant_key = classification.merchant_name.lower()
        merchant = merchant_lookup.get(merchant_key)
        if merchant:
            merchant.usage_count += 1
            merchant_id = merchant.id
        else:
            # Try partial match in cache
            for key, m in merchant_lookup.items():
                if merchant_key in key or key in merchant_key:
                    m.usage_count += 1
                    merchant_id = m.id
                    break
            if merchant_id is None:
                # Create new merchant
                merchant = Merchant(
                    canonical_name=classification.merchant_name,
                    usage_count=1,
                )
                db.add(merchant)
                db.flush()
                merchant_id = merchant.id
                # Add to cache for future rows
                merchant_lookup[merchant_key] = merchant

    tx = Transaction(
        financial_profile_id=job.financial_profile_id,
        account_id=account_id,
        category_id=category_id,
        merchant_id=merchant_id,
        transaction_date=ptx.date,
        transaction_type=tx_type,
        source=TransactionSource.IMPORT_CSV,
        amount=str(amount),
        amount_clear=amount,
        currency=ptx.currency,
        amount_in_profile_currency=_round_money(amount),
        description=ptx.description,
        description_clear=ptx.description[:255] if ptx.description else None,
        merchant_name=classification.merchant_name,
        import_job_id=job.id,
    )
    return tx


# ---------------------------------------------------------------------------
# Resume endpoint – restore a pending import job
# ---------------------------------------------------------------------------

@router.get(
    "/jobs/{job_id}/resume",
    response_model=SmartImportPreviewResponse,
    summary="Resume a pending import",
    description="Retrieve saved preview data for a pending import job.",
)
async def resume_import_job(
    job_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> SmartImportPreviewResponse:
    rls = get_rls_context(db, current_user.id)

    job = db.query(ImportJob).filter(ImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")

    rls.check_profile_access(job.financial_profile_id)

    if job.status != ImportStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot resume job with status '{job.status.value}'. Only 'pending' jobs can be resumed.",
        )

    mapping_config = job.mapping_config or {}
    if "preview_data" not in mapping_config:
        raise HTTPException(
            status_code=400,
            detail="Preview data not available. Please start a new import.",
        )

    detected_fmt = mapping_config.get("detected_format", {})
    preview_data = mapping_config["preview_data"]
    summary = mapping_config.get("summary", {})
    warnings = mapping_config.get("warnings", [])

    # Reconstruct preview transactions from saved data
    preview_txs = [PreviewTransaction(**row) for row in preview_data]

    # Rebuild the in-memory cache for the confirm step
    # Parse the saved preview data back into ParsedTransaction objects
    cached_transactions = []
    classifications_cache = {}
    reconciliations_cache = {}

    for row in preview_data:
        from datetime import date as date_type
        ptx = ParsedTransaction(
            date=date_type.fromisoformat(row["date"]) if isinstance(row["date"], str) else row["date"],
            description=row["description"],
            amount=Decimal(str(row["amount"])),
            original_description=row["original_description"],
            balance=Decimal(str(row["balance"])) if row.get("balance") is not None else None,
            currency=row.get("currency", "EUR"),
            row_number=row["row_number"],
            raw_data={},
        )
        cached_transactions.append(ptx)

        cl_data = row["classification"]
        from app.services.transaction_classifier import ClassificationResult
        classifications_cache[ptx.row_number] = ClassificationResult(
            category_name=cl_data["category"],
            merchant_name=cl_data.get("merchant"),
            confidence_score=cl_data["confidence"],
            match_method=cl_data["match_method"],
            suggested_transaction_type=cl_data["transaction_type"],
        )

        rec_data = row["reconciliation"]
        from app.services.reconciliation_service import ReconciliationResult
        reconciliations_cache[ptx.row_number] = ReconciliationResult(
            action=rec_data["action"],
            confidence=rec_data["confidence"],
            matched_transaction_id=rec_data.get("matched_transaction_id"),
            reason=rec_data["reason"],
        )

    _preview_cache[str(job.id)] = {
        "profile_id": str(job.financial_profile_id),
        "account_id": str(job.account_id),
        "transactions": cached_transactions,
        "classifications": classifications_cache,
        "reconciliations": reconciliations_cache,
    }

    return SmartImportPreviewResponse(
        job_id=str(job.id),
        detected_format=DetectedFormatResponse(
            encoding=detected_fmt.get("encoding", "utf-8"),
            separator=detected_fmt.get("separator", ","),
            date_format=detected_fmt.get("date_format", "dd/MM/yyyy"),
            column_mapping=detected_fmt.get("column_mapping", {}),
            header_row=detected_fmt.get("header_row", 0),
        ),
        preview_transactions=preview_txs,
        summary=PreviewSummary(**summary) if summary else PreviewSummary(
            total_rows=job.total_rows or 0,
            parsed_rows=len(preview_txs),
            to_import=len([t for t in preview_txs if t.reconciliation.action == "import"]),
            duplicates=len([t for t in preview_txs if t.reconciliation.action == "skip"]),
            needs_review=len([t for t in preview_txs if t.reconciliation.action == "flag"]),
            parse_errors=0,
        ),
        warnings=warnings,
    )
