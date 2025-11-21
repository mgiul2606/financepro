# app/models/budget.py
"""Budget model with scope pattern - USER-level for FinancePro v2.1"""
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Date, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from decimal import Decimal
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import PeriodType, ScopeType


class Budget(Base):
    """
    Spending budgets with flexible scope (user/profile/multi-profile aggregation).

    USER-level entity with SCOPE pattern.

    Based on FinancePro Database Technical Documentation v2.1

    Scope Types:
    - user: Aggregates from all profiles
    - profile: Single profile only
    - multi_profile: Selected profiles

    Attributes:
        id: UUID primary key
        user_id: Budget owner (USER-LEVEL)
        name: Budget name
        scope_type: Scope (user/profile/multi_profile)
        scope_profile_ids: Array of profile IDs
        period_type: Period type
        start_date: Period start
        end_date: Period end (NULL for rolling)
        total_amount: Total budget amount
        currency: Budget currency
        rollover_enabled: Transfer unspent to next period
        alert_threshold_percent: Alert threshold %
        is_active: Budget status
    """
    __tablename__ = "budgets"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key - USER level
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Budget information
    name = Column(String(255), nullable=False)

    # Scope pattern
    scope_type = Column(StringEnum(ScopeType), default=ScopeType.USER, nullable=False)
    scope_profile_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True)

    # Period
    period_type = Column(StringEnum(PeriodType), default=PeriodType.MONTHLY, nullable=False)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=True)  # NULL for rolling budgets

    # Amount
    total_amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), nullable=False)

    # Features
    rollover_enabled = Column(Boolean, default=False, nullable=False)

    # Alerts
    alert_threshold_percent = Column(Integer, default=80, nullable=False)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="budgets")
    budget_categories = relationship("BudgetCategory", back_populates="budget", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Budget(id={self.id}, name='{self.name}', scope={self.scope_type.value})>"


class BudgetCategory(Base):
    """
    Budget allocation per category with spending tracking.

    Attributes:
        id: UUID primary key
        budget_id: Parent budget
        category_id: Allocated category
        allocated_amount: Allocated amount
        spent_amount: Spent amount (calculated/denormalized)
    """
    __tablename__ = "budget_categories"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    budget_id = Column(
        UUID(as_uuid=True),
        ForeignKey("budgets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Amounts
    allocated_amount = Column(Numeric(15, 2), nullable=False)
    spent_amount = Column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    budget = relationship("Budget", back_populates="budget_categories")
    category = relationship("Category", back_populates="budget_categories")

    @property
    def percentage_used(self) -> float:
        """Calculate percentage of budget used."""
        if self.allocated_amount == 0:
            return 0.0
        return float((self.spent_amount / self.allocated_amount) * 100)

    def __repr__(self) -> str:
        return f"<BudgetCategory(budget_id={self.budget_id}, category_id={self.category_id}, spent={self.percentage_used:.1f}%)>"
