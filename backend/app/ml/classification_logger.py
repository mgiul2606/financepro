# app/ml/classification_logger.py
"""
Enhanced ML Classification Logging for FinancePro v2.1.

Provides comprehensive logging for ML classifications with all v2.1 schema fields:
- features_used
- explanation
- processing_time_ms
- suggested_merchant_id
- suggested_tags
- model_name
- model_version
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from decimal import Decimal
import time
import logging

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models import (
    MLClassificationLog,
    Transaction,
    Category,
    Merchant,
    FinancialProfile
)

logger = logging.getLogger(__name__)


class ClassificationLogger:
    """
    Enhanced classification logging for v2.1 schema.

    Usage:
        logger = ClassificationLogger(db)
        log = logger.log_classification(
            transaction_id=tx_id,
            financial_profile_id=profile_id,
            original_description="Payment to AMZN",
            suggested_category_id=category_id,
            confidence_score=0.92,
            model_name="gradient_boosting_v2",
            features_used={"merchant_match": 0.98},
            explanation="Classified as Shopping because merchant matches Amazon"
        )
    """

    def __init__(self, db: Session):
        """Initialize classification logger."""
        self.db = db

    def log_classification(
        self,
        transaction_id: UUID,
        financial_profile_id: UUID,
        original_description: str,
        suggested_category_id: Optional[UUID],
        confidence_score: float,
        model_name: str = "gradient_boosting_v2",
        model_version: str = "2.1.0",
        suggested_merchant_id: Optional[UUID] = None,
        suggested_tags: Optional[List[str]] = None,
        features_used: Optional[Dict[str, Any]] = None,
        explanation: Optional[str] = None,
        processing_time_ms: Optional[int] = None,
        was_accepted: Optional[bool] = None,
        actual_category_id: Optional[UUID] = None,
        user_feedback: Optional[str] = None
    ) -> MLClassificationLog:
        """
        Create a comprehensive ML classification log entry.

        Args:
            transaction_id: Transaction being classified
            financial_profile_id: Profile ID (for RLS)
            original_description: Original transaction description
            suggested_category_id: ML suggested category
            confidence_score: Classification confidence (0-1)
            model_name: Name of the model used
            model_version: Version of the model
            suggested_merchant_id: Suggested merchant
            suggested_tags: List of suggested tag names
            features_used: Features used for classification
            explanation: Human-readable explanation
            processing_time_ms: Classification latency
            was_accepted: User acceptance (set later)
            actual_category_id: User's final choice
            user_feedback: Text feedback from user

        Returns:
            MLClassificationLog: Created log entry
        """
        log = MLClassificationLog(
            transaction_id=transaction_id,
            financial_profile_id=financial_profile_id,
            original_description=original_description,
            suggested_category_id=suggested_category_id,
            suggested_merchant_id=suggested_merchant_id,
            suggested_tags=suggested_tags,
            confidence_score=Decimal(str(confidence_score)),
            model_name=model_name,
            model_version=model_version,
            features_used=features_used,
            explanation=explanation,
            was_accepted=was_accepted,
            actual_category_id=actual_category_id,
            user_feedback=user_feedback,
            processing_time_ms=processing_time_ms
        )

        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)

        return log

    def update_feedback(
        self,
        log_id: UUID,
        was_accepted: bool,
        actual_category_id: Optional[UUID] = None,
        user_feedback: Optional[str] = None
    ) -> MLClassificationLog:
        """
        Update a classification log with user feedback.

        Args:
            log_id: Log ID to update
            was_accepted: Whether user accepted
            actual_category_id: User's final category
            user_feedback: Text feedback

        Returns:
            Updated log entry
        """
        log = self.db.query(MLClassificationLog).filter(
            MLClassificationLog.id == log_id
        ).first()

        if not log:
            raise ValueError(f"Classification log not found: {log_id}")

        log.was_accepted = was_accepted
        log.actual_category_id = actual_category_id
        log.user_feedback = user_feedback

        self.db.commit()
        self.db.refresh(log)

        return log

    def get_performance_metrics(
        self,
        financial_profile_id: UUID,
        model_name: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get classification performance metrics.

        Args:
            financial_profile_id: Profile ID
            model_name: Filter by model
            days: Number of days to analyze

        Returns:
            Dict with performance metrics
        """
        from datetime import timedelta

        cutoff = datetime.utcnow() - timedelta(days=days)

        query = self.db.query(MLClassificationLog).filter(
            MLClassificationLog.financial_profile_id == financial_profile_id,
            MLClassificationLog.created_at >= cutoff
        )

        if model_name:
            query = query.filter(MLClassificationLog.model_name == model_name)

        logs = query.all()

        if not logs:
            return {
                'total_classifications': 0,
                'acceptance_rate': 0.0,
                'average_confidence': 0.0,
                'average_latency_ms': 0,
                'feedback_count': 0
            }

        total = len(logs)
        with_feedback = [l for l in logs if l.was_accepted is not None]
        accepted = sum(1 for l in with_feedback if l.was_accepted)
        avg_confidence = sum(float(l.confidence_score) for l in logs) / total

        latencies = [l.processing_time_ms for l in logs if l.processing_time_ms]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0

        return {
            'total_classifications': total,
            'acceptance_rate': accepted / len(with_feedback) if with_feedback else 0.0,
            'average_confidence': avg_confidence,
            'average_latency_ms': int(avg_latency),
            'feedback_count': len(with_feedback),
            'period_days': days
        }


class ClassificationTimer:
    """Context manager for timing classification operations."""

    def __init__(self):
        self.start_time = None
        self.elapsed_ms = 0

    def __enter__(self):
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed_ms = int((time.perf_counter() - self.start_time) * 1000)


def generate_explanation(
    predicted_category: Category,
    confidence: float,
    features: Dict[str, Any],
    merchant_match: Optional[str] = None
) -> str:
    """
    Generate human-readable explanation for classification.

    Args:
        predicted_category: Predicted category
        confidence: Confidence score
        features: Features used
        merchant_match: Matched merchant name

    Returns:
        Explanation string
    """
    category_name = predicted_category.name if predicted_category else "Unknown"

    parts = [f"Classified as '{category_name}'"]

    if merchant_match:
        parts.append(f"because the merchant '{merchant_match}' is commonly associated with this category")
    elif 'merchant_normalized' in features and features['merchant_normalized']:
        parts.append(f"based on merchant name '{features['merchant_normalized']}'")
    elif 'text' in features and features['text']:
        parts.append(f"based on description patterns")

    if confidence >= 0.9:
        parts.append(f"(very high confidence: {confidence:.0%})")
    elif confidence >= 0.7:
        parts.append(f"(high confidence: {confidence:.0%})")
    else:
        parts.append(f"(moderate confidence: {confidence:.0%})")

    return " ".join(parts)


def match_merchant_from_aliases(
    db: Session,
    description: str
) -> Optional[Merchant]:
    """
    Match merchant from description using aliases.

    Args:
        db: Database session
        description: Transaction description

    Returns:
        Matched merchant or None
    """
    from sqlalchemy import func

    if not description:
        return None

    description_lower = description.lower()

    # Query merchants with matching aliases
    merchants = db.query(Merchant).filter(
        Merchant.aliases.isnot(None)
    ).all()

    for merchant in merchants:
        if merchant.aliases:
            for alias in merchant.aliases:
                if alias.lower() in description_lower:
                    return merchant

    # Also check canonical name
    for merchant in merchants:
        if merchant.canonical_name.lower() in description_lower:
            return merchant

    return None
