# app/models/budget.py
"""Budget model with scope pattern - USER-level for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import PeriodType, ScopeType

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.user import User


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
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign key - USER level
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Budget information
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Scope pattern
    scope_type: Mapped[ScopeType] = mapped_column(
        StringEnum(ScopeType),
        default=ScopeType.USER,
        nullable=False
    )
    scope_profile_ids: Mapped[Optional[list[uuid.UUID]]] = mapped_column(
        ARRAY(UUID(as_uuid=True)),
        nullable=True
    )

    # Period
    period_type: Mapped[PeriodType] = mapped_column(
        StringEnum(PeriodType),
        default=PeriodType.MONTHLY,
        nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True
    )  # NULL for rolling budgets

    # Amount
    total_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    # Features
    rollover_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Alerts
    alert_threshold_percent: Mapped[int] = mapped_column(
        Integer,
        default=80,
        nullable=False
    )

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="budgets")
    budget_categories: Mapped[List["BudgetCategory"]] = relationship(
        back_populates="budget",
        cascade="all, delete-orphan"
    )

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
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign keys
    budget_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("budgets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Amounts
    allocated_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    spent_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        default=Decimal("0.00"),
        nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    budget: Mapped["Budget"] = relationship(back_populates="budget_categories")
    category: Mapped["Category"] = relationship(back_populates="budget_categories")

    @property
    def percentage_used(self) -> float:
        """Calculate percentage of budget used."""
        if self.allocated_amount == 0:
            return 0.0
        return float((self.spent_amount / self.allocated_amount) * 100)

    def __repr__(self) -> str:
        return f"<BudgetCategory(budget_id={self.budget_id}, category_id={self.category_id}, spent={self.percentage_used:.1f}%)>"
