# app/models/budget.py
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from decimal import Decimal
import enum
import uuid
from app.db.database import Base
from app.db.types import StringEnum


class PeriodType(str, enum.Enum):
    """Budget period types"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class Budget(Base):
    """
    Budget model for financial planning.

    Budgets can be defined for specific time periods and assigned to categories.

    Attributes:
        id: UUID primary key
        financial_profile_id: Foreign key to FinancialProfile
        name: Budget name
        period_type: Type of period (monthly, quarterly, yearly, custom)
        start_date: Start date of budget period
        end_date: End date of budget period
        amount: Total budget amount
        currency: ISO 4217 currency code
        is_active: Whether the budget is active
        alert_threshold_percentage: Percentage of budget to trigger alerts
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        financial_profile: Parent financial profile
        budget_categories: Categories and their allocated amounts
    """
    __tablename__ = "budgets"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id"),
        nullable=False,
        index=True
    )

    # Budget information
    name = Column(String(255), nullable=False)

    # Period
    period_type = Column(StringEnum(PeriodType), nullable=False)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False)

    # Amount
    amount = Column(Numeric(precision=15, scale=2), nullable=False)
    currency = Column(String(3), nullable=False)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Alerts
    alert_threshold_percentage = Column(
        Numeric(precision=5, scale=2),
        default=Decimal("80.00"),
        nullable=False
    )  # Alert when 80% of budget is used

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="budgets")
    budget_categories = relationship("BudgetCategory", back_populates="budget", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Budget(id={self.id}, name='{self.name}', amount={self.amount} {self.currency})>"


class BudgetCategory(Base):
    """
    Budget-Category association with allocated amount.

    This allows splitting a budget across multiple categories.

    Attributes:
        id: UUID primary key
        budget_id: Foreign key to Budget
        category_id: Foreign key to Category
        allocated_amount: Amount allocated to this category
    """
    __tablename__ = "budget_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.id"), nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False, index=True)
    allocated_amount = Column(Numeric(precision=15, scale=2), nullable=False)

    # Relationships
    budget = relationship("Budget", back_populates="budget_categories")
    category = relationship("Category", back_populates="budget_categories")

    def __repr__(self) -> str:
        return f"<BudgetCategory(budget_id={self.budget_id}, category_id={self.category_id}, amount={self.allocated_amount})>"