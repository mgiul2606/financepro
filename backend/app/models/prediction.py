# app/models/prediction.py
"""Prediction model for future spending/income forecasts - FinancePro v2.1"""
from sqlalchemy import Column, String, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


class Prediction(Base):
    """
    Future spending/income predictions from forecasting models.

    PROFILE-level entity.

    Attributes:
        id: UUID primary key
        financial_profile_id: Profile owner
        prediction_type: Type (expense, income, balance, category_expense)
        category_id: Category (if category-specific)
        prediction_date: Predicted date
        predicted_amount: Predicted amount
        confidence_interval_min: Lower CI bound
        confidence_interval_max: Upper CI bound
        confidence_level: Confidence level (e.g., 0.95)
        model_name: Model used
        model_version: Model version
        features_used: Features/parameters (JSONB)
        actual_amount: Actual amount (after date passes)
        error: Prediction error
    """
    __tablename__ = "predictions"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True
    )

    # Prediction details
    prediction_type = Column(String(50), nullable=False)  # expense, income, balance, category_expense
    prediction_date = Column(Date, nullable=False, index=True)
    predicted_amount = Column(Numeric(15, 2), nullable=False)

    # Confidence intervals
    confidence_interval_min = Column(Numeric(15, 2), nullable=True)
    confidence_interval_max = Column(Numeric(15, 2), nullable=True)
    confidence_level = Column(Numeric(5, 2), nullable=True)  # e.g., 0.95

    # Model information
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)
    features_used = Column(JSONB, nullable=True)

    # Actual results (populated after prediction_date)
    actual_amount = Column(Numeric(15, 2), nullable=True)
    error = Column(Numeric(15, 2), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="predictions")
    category = relationship("Category")

    def __repr__(self) -> str:
        return f"<Prediction(id={self.id}, type={self.prediction_type}, date={self.prediction_date})>"
