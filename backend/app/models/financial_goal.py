# app/models/financial_goal.py
"""Financial Goal model with scope pattern - USER-level for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, List, Optional
import uuid

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import GoalStatus, GoalType, ScopeType

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.goal_contribution import GoalContribution
    from app.models.user import User


class FinancialGoal(Base):
    """
    Financial goals with gamification and scope pattern.

    USER-level entity with SCOPE pattern.

    Based on FinancePro Database Technical Documentation v2.1

    Scope Types:
    - user: Aggregates from all profiles
    - profile: Single profile only
    - multi_profile: Selected profiles

    Attributes:
        id: UUID primary key
        user_id: Goal owner (USER-LEVEL)
        name: Goal name
        goal_type: Type of goal
        scope_type: Scope pattern
        scope_profile_ids: Array of profile IDs
        target_amount: Target amount
        current_amount: Current saved (denormalized)
        currency: Goal currency
        target_date: Target completion date
        priority: Priority (1-10)
        status: Goal status
        milestones: Milestones (JSONB)
        gamification_points: Points earned
        achievement_probability: ML probability
        monthly_contribution: Calculated monthly need
        notes: Optional notes
    """

    __tablename__ = "financial_goals"

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

    # Linked account (optional dedicated account for goal)
    linked_account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="SET NULL"),
        nullable=True
    )

    # Goal information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    goal_type: Mapped[GoalType] = mapped_column(StringEnum(GoalType), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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

    # Amounts
    target_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    current_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        default=Decimal("0.00"),
        nullable=False
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    # Dates
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    target_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # Auto-allocation
    auto_allocate: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Priority and status
    priority: Mapped[int] = mapped_column(Integer, default=5, nullable=False)  # 1-10
    status: Mapped[GoalStatus] = mapped_column(
        StringEnum(GoalStatus),
        default=GoalStatus.ACTIVE,
        nullable=False
    )

    # Milestones as JSONB (simpler than separate table for v2.1)
    milestones: Mapped[Optional[list[dict[str, Any]]]] = mapped_column(JSONB, nullable=True)
    # Format: [{"name": "First 1000", "target_amount": 1000, "completed": false, "completed_at": null}]

    # Gamification
    gamification_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # ML predictions
    achievement_probability: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 4),
        nullable=True
    )  # 0-1

    # Calculated values
    monthly_contribution: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(15, 2),
        nullable=True
    )

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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
    user: Mapped["User"] = relationship(back_populates="financial_goals")
    linked_account: Mapped[Optional["Account"]] = relationship(
        back_populates="financial_goals"
    )
    contributions: Mapped[List["GoalContribution"]] = relationship(
        back_populates="goal",
        cascade="all, delete-orphan",
        order_by="GoalContribution.contribution_date.desc()"
    )

    @property
    def progress_percentage(self) -> float:
        """Calculate progress as percentage."""
        if self.target_amount == 0:
            return 0.0
        return float((self.current_amount / self.target_amount) * 100)

    @property
    def remaining_amount(self) -> Decimal:
        """Calculate remaining amount to reach goal."""
        return max(Decimal("0.00"), self.target_amount - self.current_amount)

    def __repr__(self) -> str:
        return f"<FinancialGoal(id={self.id}, name='{self.name}', progress={self.progress_percentage:.1f}%)>"


class GoalMilestone(Base):
    """
    Legacy milestone model - kept for backward compatibility.
    v2.1 uses JSONB milestones field in FinancialGoal.
    """

    __tablename__ = "goal_milestones"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign key
    goal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_goals.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Milestone information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    target_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Status
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    def __repr__(self) -> str:
        status = "completed" if self.is_completed else "pending"
        return f"<GoalMilestone({status}: {self.name}, target={self.target_amount})>"
