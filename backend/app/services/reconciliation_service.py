# app/services/reconciliation_service.py
"""
Reconciliation Service for FinancePro v2.1.

Multi-level duplicate detection for imported transactions:
  Level 1 – Exact match → SKIP
  Level 2 – Strong match → SKIP with warning
  Level 3 – Possible match → FLAG for review
  Level 4 – No match → IMPORT
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal
from difflib import SequenceMatcher
from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models import Transaction

logger = logging.getLogger(__name__)


@dataclass
class ReconciliationResult:
    action: str  # "skip", "flag", "import"
    confidence: float
    matched_transaction_id: Optional[str]  # UUID as string
    reason: str  # "exact_duplicate", "likely_duplicate", "possible_match", "new"


class ReconciliationService:
    """Detect duplicate / near-duplicate transactions."""

    def __init__(self, db: Session):
        self.db = db

    def check(
        self,
        profile_id: UUID,
        account_id: Optional[UUID],
        tx_date: "date",  # noqa: F821
        amount: Decimal,
        description: str,
    ) -> ReconciliationResult:
        """
        Check a single candidate transaction against the DB.
        """
        from datetime import date as date_type  # avoid shadowing

        # Widen the date window to ±3 days
        start = tx_date - timedelta(days=3)
        end = tx_date + timedelta(days=3)

        # Query candidates with matching amount in the date window
        filters = [
            Transaction.financial_profile_id == profile_id,
            Transaction.transaction_date.between(start, end),
            Transaction.amount_clear == amount,
        ]
        if account_id:
            filters.append(Transaction.account_id == account_id)

        candidates: List[Transaction] = (
            self.db.query(Transaction).filter(and_(*filters)).all()
        )

        desc_lower = description.lower().strip()

        for tx in candidates:
            existing_desc = (tx.description_clear or "").lower().strip()
            similarity = SequenceMatcher(None, desc_lower, existing_desc).ratio()

            # Level 1 – exact match
            if tx.transaction_date == tx_date and similarity >= 0.98:
                return ReconciliationResult(
                    action="skip",
                    confidence=1.0,
                    matched_transaction_id=str(tx.id),
                    reason="exact_duplicate",
                )

            # Level 2 – strong match (date ±1 day, same amount, description > 85%)
            date_diff = abs((tx.transaction_date - tx_date).days)
            if date_diff <= 1 and similarity >= 0.85:
                return ReconciliationResult(
                    action="skip",
                    confidence=0.9,
                    matched_transaction_id=str(tx.id),
                    reason="likely_duplicate",
                )

        # Second pass – possible matches (wider tolerance)
        # Re-query with ±1% amount tolerance
        amount_low = amount * Decimal("0.99")
        amount_high = amount * Decimal("1.01")

        wider_filters = [
            Transaction.financial_profile_id == profile_id,
            Transaction.transaction_date.between(start, end),
            Transaction.amount_clear.between(amount_low, amount_high),
        ]
        if account_id:
            wider_filters.append(Transaction.account_id == account_id)

        wider_candidates: List[Transaction] = (
            self.db.query(Transaction).filter(and_(*wider_filters)).all()
        )

        for tx in wider_candidates:
            existing_desc = (tx.description_clear or "").lower().strip()
            similarity = SequenceMatcher(None, desc_lower, existing_desc).ratio()
            date_diff = abs((tx.transaction_date - tx_date).days)

            # Level 3 – possible match
            if similarity >= 0.70 and date_diff <= 3:
                confidence = 0.6 + (similarity - 0.70) * 0.67  # 0.6-0.8 range
                return ReconciliationResult(
                    action="flag",
                    confidence=round(confidence, 2),
                    matched_transaction_id=str(tx.id),
                    reason="possible_match",
                )

        # Level 4 – no match
        return ReconciliationResult(
            action="import",
            confidence=0.0,
            matched_transaction_id=None,
            reason="new",
        )
