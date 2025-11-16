# app/models/ml_classification_log.py
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


class MLClassificationLog(Base):
    """
    ML Classification Log model for tracking machine learning classification results.

    This model logs all ML-based transaction categorization attempts, including
    model predictions, confidence scores, and user corrections for model retraining.

    Attributes:
        id: UUID primary key
        transaction_id: Foreign key to Transaction
        model_version: Version of the ML model used (e.g., "v1.2.3")
        predicted_category_id: Foreign key to Category (ML prediction)
        confidence_score: Confidence score between 0 and 1 (Decimal(5,4))
        was_accepted: Whether user accepted the ML prediction
        corrected_category_id: Foreign key to Category (user correction, nullable)
        features_used: JSONB containing features used for prediction
        explanation: Human-readable explanation of the prediction
        timestamp: When the classification occurred

    Relationships:
        transaction: Transaction that was classified
        predicted_category: Category predicted by ML model
        corrected_category: Category corrected by user (if not accepted)
    """
    __tablename__ = "ml_classification_logs"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id"),
        nullable=False,
        index=True
    )
    predicted_category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id"),
        nullable=False,
        index=True
    )
    corrected_category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id"),
        nullable=True,
        index=True
    )

    # ML model information
    model_version = Column(String(50), nullable=False, index=True)

    # Classification results
    confidence_score = Column(Numeric(precision=5, scale=4), nullable=False)  # 0.0000 to 1.0000
    was_accepted = Column(Boolean, default=False, nullable=False, index=True)

    # Features and explanation
    features_used = Column(JSONB, nullable=True)
    explanation = Column(Text, nullable=True)

    # Timestamp
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    transaction = relationship("Transaction", back_populates="ml_classification_logs")
    predicted_category = relationship(
        "Category",
        foreign_keys=[predicted_category_id],
        back_populates="ml_classification_logs_predicted"
    )
    corrected_category = relationship(
        "Category",
        foreign_keys=[corrected_category_id],
        back_populates="ml_classification_logs_corrected"
    )

    def __repr__(self) -> str:
        return (
            f"<MLClassificationLog(id={self.id}, "
            f"transaction_id={self.transaction_id}, "
            f"confidence={self.confidence_score}, "
            f"accepted={self.was_accepted})>"
        )
