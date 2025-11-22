# app/models/ml_classification_log.py
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Numeric, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


class MLClassificationLog(Base):
    """
    ML Classification Log model for tracking machine learning classification results.

    Based on FinancePro Database Technical Documentation v2.1

    This model logs all ML-based transaction categorization attempts, including
    model predictions, confidence scores, and user corrections for model retraining.

    Attributes:
        id: UUID primary key
        transaction_id: Foreign key to Transaction (NULL if deleted)
        financial_profile_id: Foreign key to FinancialProfile (for RLS)
        original_description: Original transaction description (ML input)
        suggested_category_id: Foreign key to Category (ML suggestion)
        suggested_merchant_id: Foreign key to Merchant (ML suggestion)
        suggested_tags: Array of suggested tag names
        confidence_score: Confidence score between 0 and 1 (Decimal(5,4))
        model_name: Name of the ML model used
        model_version: Version of the ML model used
        features_used: JSONB containing features used for prediction
        explanation: Human-readable XAI explanation of the prediction
        was_accepted: Whether user accepted the ML suggestion
        actual_category_id: Foreign key to Category (user's final choice)
        user_feedback: User textual feedback
        processing_time_ms: Classification latency in milliseconds
        created_at: When the classification occurred

    Relationships:
        financial_profile: Financial profile this log belongs to
        transaction: Transaction that was classified
        suggested_category: Category suggested by ML model
        suggested_merchant: Merchant suggested by ML model
        actual_category: Category chosen by user (if different)
    """
    __tablename__ = "ml_classification_logs"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Original input
    original_description = Column(Text, nullable=False)

    # ML suggestions
    suggested_category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    suggested_merchant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("merchants.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    suggested_tags = Column(ARRAY(String(50)), nullable=True)

    # ML model information
    confidence_score = Column(Numeric(precision=5, scale=4), nullable=False)  # 0.0000 to 1.0000
    model_name = Column(String(100), nullable=False, index=True)
    model_version = Column(String(50), nullable=False, index=True)

    # Features and explanation
    features_used = Column(JSONB, nullable=True)
    explanation = Column(Text, nullable=True)

    # User feedback
    was_accepted = Column(Boolean, nullable=True, index=True)  # NULL = no feedback yet
    actual_category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    user_feedback = Column(Text, nullable=True)

    # Performance monitoring
    processing_time_ms = Column(Integer, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="ml_classification_logs")
    transaction = relationship("Transaction", back_populates="ml_classification_logs")
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
