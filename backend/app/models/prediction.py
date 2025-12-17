# app/models/prediction.py
"""Prediction model for future spending/income forecasts - FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Optional
import uuid

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.financial_profile import FinancialProfile


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
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign keys
    financial_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True
    )

    # Prediction details
    prediction_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )  # expense, income, balance, category_expense
    prediction_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    predicted_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    # Confidence intervals
    confidence_interval_min: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(15, 2),
        nullable=True
    )
    confidence_interval_max: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(15, 2),
        nullable=True
    )
    confidence_level: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2),
        nullable=True
    )  # e.g., 0.95

    # Model information
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    features_used: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )

    # Actual results (populated after prediction_date)
    actual_amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(15, 2),
        nullable=True
    )
    error: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    financial_profile: Mapped["FinancialProfile"] = relationship(
        back_populates="predictions"
    )
    category: Mapped[Optional["Category"]] = relationship()

    def __repr__(self) -> str:
        return f"<Prediction(id={self.id}, type={self.prediction_type}, date={self.prediction_date})>"
