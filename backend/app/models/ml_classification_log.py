# app/models/ml_classification_log.py
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Numeric, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    suggested_category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    suggested_merchant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("merchants.id", ondelete="SET NULL"),
        nullable=True
    )
    actual_category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True
    )

    # Original input
    original_description = Column(String(500), nullable=False)

    # ML suggestions
    suggested_tags = Column(ARRAY(String), nullable=True)

    # Classification results
    confidence_score = Column(Numeric(precision=5, scale=4), nullable=False)

    # Model information
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)

    # Features and explanation
    features_used = Column(JSONB, nullable=True)
    explanation = Column(Text, nullable=True)

    # User feedback
    was_accepted = Column(Boolean, nullable=True)
    user_feedback = Column(Text, nullable=True)

    # Performance
    processing_time_ms = Column(Integer, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    transaction = relationship("Transaction", back_populates="ml_classification_logs")
    financial_profile = relationship("FinancialProfile", back_populates="ml_classification_logs")
    suggested_category = relationship(
        "Category",
        foreign_keys=[suggested_category_id],
        back_populates="ml_classification_logs_suggested"
    )
    suggested_merchant = relationship(
        "Merchant",
        foreign_keys=[suggested_merchant_id]
    )
    actual_category = relationship(
        "Category",
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
