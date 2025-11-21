# app/models/financial_goal.py
"""Financial Goal model with scope pattern - USER-level for FinancePro v2.1"""
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Text, Date, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from decimal import Decimal
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import GoalType, GoalStatus, ScopeType


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
        icon: Goal icon
        color: HEX color
        image_url: Goal image
        milestones: Milestones (JSONB)
        gamification_level: Current level
        gamification_points: Points earned
        gamification_badges: Earned badges (JSONB)
        achievement_probability: ML probability
        monthly_contribution: Calculated monthly need
        notes: Optional notes
    """
    __tablename__ = "financial_goals"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key - USER level
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Goal information
    name = Column(String(255), nullable=False)
    goal_type = Column(StringEnum(GoalType), nullable=False)

    # Scope pattern
    scope_type = Column(StringEnum(ScopeType), default=ScopeType.USER, nullable=False)
    scope_profile_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True)

    # Amounts
    target_amount = Column(Numeric(15, 2), nullable=False)
    current_amount = Column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    currency = Column(String(3), nullable=False)

    # Dates
    target_date = Column(Date, nullable=False)

    # Priority and status
    priority = Column(Integer, default=5, nullable=False)  # 1-10
    status = Column(StringEnum(GoalStatus), default=GoalStatus.ACTIVE, nullable=False)

    # UI customization
    icon = Column(String(50), nullable=True)
    color = Column(String(7), nullable=True)  # HEX
    image_url = Column(String(500), nullable=True)

    # Milestones as JSONB (simpler than separate table for v2.1)
    milestones = Column(JSONB, nullable=True)
    # Format: [{"name": "First 1000", "target_amount": 1000, "completed": false, "completed_at": null}]

    # Gamification
    gamification_level = Column(Integer, default=1, nullable=False)
    gamification_points = Column(Integer, default=0, nullable=False)
    gamification_badges = Column(JSONB, nullable=True)  # ["first_deposit", "50_percent", etc.]

    # ML predictions
    achievement_probability = Column(Numeric(5, 4), nullable=True)  # 0-1

    # Calculated values
    monthly_contribution = Column(Numeric(15, 2), nullable=True)

    # Notes
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="financial_goals")
    contributions = relationship(
        "GoalContribution",
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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key
    goal_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_goals.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Milestone information
    name = Column(String(255), nullable=False)
    target_amount = Column(Numeric(15, 2), nullable=False)
    target_date = Column(Date, nullable=False)

    # Status
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self) -> str:
        status = "completed" if self.is_completed else "pending"
        return f"<GoalMilestone({status}: {self.name}, target={self.target_amount})>"
