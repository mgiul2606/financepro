# app/services/category_learning_service.py
"""
Adaptive category learning service for FinancePro.

Learns from user corrections and manual assignments to improve
automatic categorization over time. User rules take priority
over global keyword/merchant matching.
"""
from __future__ import annotations

import re
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_category_rule import UserCategoryRule

logger = logging.getLogger(__name__)


@dataclass
class ClassificationResult:
    """Result compatible with TransactionClassifier's ClassificationResult."""
    category_name: str
    merchant_name: Optional[str]
    confidence_score: float
    match_method: str
    suggested_transaction_type: str


class CategoryLearningService:
    """Learn and apply user-specific categorization rules."""

    def __init__(self, db: Session, financial_profile_id: UUID):
        self.db = db
        self.profile_id = financial_profile_id

    def learn_from_correction(
        self,
        original_description: str,
        assigned_category_id: UUID,
        source: str = "user_correction",
    ) -> None:
        """
        When the user assigns/corrects a category, extract reusable rules.
        """
        rules_to_create = []

        # Rule 1: Exact match on the full normalized description
        normalized = original_description.strip().upper()
        if normalized:
            rules_to_create.append({
                "match_type": "exact_description",
                "match_value": normalized,
                "category_id": assigned_category_id,
                "source": source,
            })

        # Rule 2: Extract stable keywords from the description
        keywords = self._extract_stable_keywords(original_description)
        if keywords:
            rules_to_create.append({
                "match_type": "contains_keyword",
                "match_value": keywords,
                "category_id": assigned_category_id,
                "source": source,
            })

        # Upsert: if the rule already exists, update the count and category
        for rule_data in rules_to_create:
            existing = self.db.scalars(
                select(UserCategoryRule).where(
                    UserCategoryRule.financial_profile_id == self.profile_id,
                    UserCategoryRule.match_type == rule_data["match_type"],
                    UserCategoryRule.match_value == rule_data["match_value"],
                )
            ).first()

            if existing:
                existing.category_id = assigned_category_id
                existing.times_applied += 1
                existing.last_applied_at = datetime.now(timezone.utc)
                existing.updated_at = datetime.now(timezone.utc)
            else:
                self.db.add(UserCategoryRule(
                    financial_profile_id=self.profile_id,
                    **rule_data,
                ))

        self.db.flush()  # Don't commit — let the caller handle it

    def classify_with_user_rules(
        self, original_description: str
    ) -> Optional[ClassificationResult]:
        """
        Look for a user rule matching the description.
        Returns None if no rule matches.
        User rules have HIGHEST PRIORITY over global rules.
        """
        normalized = original_description.strip().upper()

        # 1. Exact match (highest confidence)
        exact_match = self.db.scalars(
            select(UserCategoryRule).where(
                UserCategoryRule.financial_profile_id == self.profile_id,
                UserCategoryRule.match_type == "exact_description",
                UserCategoryRule.match_value == normalized,
            )
        ).first()

        if exact_match:
            # Resolve category name
            from app.models.category import Category
            cat = self.db.get(Category, exact_match.category_id)
            cat_name = cat.name if cat else "Uncategorized"
            return ClassificationResult(
                category_name=cat_name,
                merchant_name=None,
                confidence_score=0.98,
                match_method="user_rule_exact",
                suggested_transaction_type="purchase",  # Will be overridden by type inference
            )

        # 2. Keyword match (high confidence)
        keyword_rules = self.db.scalars(
            select(UserCategoryRule).where(
                UserCategoryRule.financial_profile_id == self.profile_id,
                UserCategoryRule.match_type == "contains_keyword",
            )
        ).all()

        for rule in keyword_rules:
            if rule.match_value.upper() in normalized:
                from app.models.category import Category
                cat = self.db.get(Category, rule.category_id)
                cat_name = cat.name if cat else "Uncategorized"
                return ClassificationResult(
                    category_name=cat_name,
                    merchant_name=None,
                    confidence_score=0.90,
                    match_method="user_rule_keyword",
                    suggested_transaction_type="purchase",
                )

        return None  # No user rule matched

    def _extract_stable_keywords(self, description: str) -> Optional[str]:
        """
        Extract the 'stable' part of a description — remove dates,
        card numbers, references that change between similar transactions.

        "PAGAMENTO POS ESSELUNGA VIA ROMA 1234 DEL 15/01/2024"
        → "ESSELUNGA VIA ROMA"

        "ADDEBITO SDD ENEL ENERGIA - BOLLETTA DIC 2023"
        → "ENEL ENERGIA"
        """
        text = description.upper()

        # Remove common banking prefixes
        prefixes_to_remove = [
            r"PAGAMENTO\s+(POS|CARTA)\s+",
            r"ADDEBITO\s+(SDD|RID|SEPA)\s+",
            r"BONIFICO\s+(DA|A|PER|SEPA)\s+",
            r"PRELIEVO\s+(BANCOMAT|ATM)\s+",
            r"CARTA\s+N\.\s*\*+\d+\s+",
        ]
        for prefix in prefixes_to_remove:
            text = re.sub(prefix, "", text)

        # Remove dates in various formats
        text = re.sub(r"\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}", "", text)

        # Remove card/terminal numbers
        text = re.sub(r"\*{2,}\d+", "", text)
        text = re.sub(r"\b\d{4,}\b", "", text)

        # Remove times
        text = re.sub(r"ORE\s+\d{1,2}[.:]\d{2}", "", text)

        # Remove month references
        text = re.sub(
            r"\b(GEN|FEB|MAR|APR|MAG|GIU|LUG|AGO|SET|OTT|NOV|DIC)\w*\s+\d{2,4}\b",
            "", text,
        )

        # Remove common suffixes
        text = re.sub(r"\bDEL\s*$", "", text)

        # Clean up multiple spaces
        text = re.sub(r"\s+", " ", text).strip()

        # Only return if we have something meaningful (at least 3 chars)
        if len(text) >= 3:
            return text
        return None
