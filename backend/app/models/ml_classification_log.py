# app/models/ml_classification_log.py
"""ML Classification Log model for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Optional
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.financial_profile import FinancialProfile
    from app.models.merchant import Merchant
    from app.models.transaction import Transaction


class MLClassificationLog(Base):
    """
    ML classification log for audit, performance analysis, and retraining.

    Tracks ML predictions for categorization and merchant detection.

    Based on FinancePro Database Technical Documentation v2.1

    Attributes:
        id: UUID primary key
        transaction_id: Classified transaction
        financial_profile_id: Profile (for RLS)
        original_description: Original transaction description
        suggested_category_id: ML-suggested category
        suggested_merchant_id: ML-suggested merchant
        suggested_tags: ML-suggested tags
        confidence_score: Model confidence (0-1)
        model_name: Model name
        model_version: Model version
        features_used: Features used for prediction
        explanation: Human-readable explanation
        was_accepted: User accepted suggestion
        actual_category_id: Actual category (if different)
        user_feedback: User feedback
        processing_time_ms: Prediction time in ms
        created_at: Log creation timestamp

    Relationships:
        transaction: Transaction that was classified
        financial_profile: Profile for RLS
        suggested_category: Category predicted by ML model
        suggested_merchant: Merchant predicted by ML model
        actual_category: Actual category (if corrected)
    """

    __tablename__ = "ml_classification_logs"

    # Primary key - UUID for security
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign keys
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    financial_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    suggested_category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    suggested_merchant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("merchants.id", ondelete="SET NULL"),
        nullable=True
    )
    actual_category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True
    )

    # Original input
    original_description: Mapped[str] = mapped_column(Text, nullable=False)

    # ML suggestions
    suggested_tags: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String),
        nullable=True
    )

    # Classification results
    confidence_score: Mapped[Decimal] = mapped_column(
        Numeric(precision=5, scale=4),
        nullable=False
    )

    # Model information
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)

    # Features and explanation
    features_used: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # User feedback
    was_accepted: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    user_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Performance
    processing_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    # Relationships
    transaction: Mapped["Transaction"] = relationship(
        back_populates="ml_classification_logs"
    )
    financial_profile: Mapped["FinancialProfile"] = relationship(
        back_populates="ml_classification_logs"
    )
    suggested_category: Mapped[Optional["Category"]] = relationship(
        foreign_keys=[suggested_category_id],
        back_populates="ml_classification_logs_suggested"
    )
    suggested_merchant: Mapped[Optional["Merchant"]] = relationship(
        foreign_keys=[suggested_merchant_id]
    )
    actual_category: Mapped[Optional["Category"]] = relationship(
        foreign_keys=[actual_category_id],
        back_populates="ml_classification_logs_actual"
    )

    def __repr__(self) -> str:
        return (
            f"<MLClassificationLog(id={self.id}, "
            f"transaction_id={self.transaction_id}, "
            f"confidence={self.confidence_score}, "
            f"accepted={self.was_accepted})>"
        )
