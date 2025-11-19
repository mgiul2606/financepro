# app/models/financial_goal.py
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Text, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from decimal import Decimal
import enum
import uuid
from app.db.database import Base
from app.db.types import StringEnum


class GoalType(str, enum.Enum):
    """Types of financial goals"""
    HOUSE = "house"
    CAR = "car"
    VACATION = "vacation"
    RETIREMENT = "retirement"
    EMERGENCY_FUND = "emergency_fund"
    EDUCATION = "education"
    INVESTMENT = "investment"
    CUSTOM = "custom"


class GoalStatus(str, enum.Enum):
    """Status of financial goals"""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class FinancialGoal(Base):
    """
    Financial Goal model for goal planning and tracking.

    Supports gamification features to encourage saving behavior.

    Attributes:
        id: UUID primary key
        financial_profile_id: Foreign key to FinancialProfile
        name: Goal name
        description: Detailed description
        goal_type: Type of goal
        target_amount: Target amount to reach
        current_amount: Current saved amount
        target_date: Target completion date
        monthly_contribution: Computed monthly contribution needed
        priority: Priority level (1-10)
        status: Current status
        achievement_probability: ML-predicted probability of achieving goal
        gamification_points: Points earned for this goal
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        financial_profile: Parent financial profile
        milestones: Milestones for this goal
    """
    __tablename__ = "financial_goals"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id"),
        nullable=False,
        index=True
    )

    # Goal information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    goal_type = Column(StringEnum(GoalType), nullable=False)

    # Amounts
    target_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    current_amount = Column(Numeric(precision=15, scale=2), default=Decimal("0.00"), nullable=False)

    # Dates
    target_date = Column(Date, nullable=False)

    # Computed contribution (can be recalculated)
    monthly_contribution = Column(Numeric(precision=15, scale=2), nullable=True)

    # Priority
    priority = Column(Integer, default=5, nullable=False)  # 1-10 scale

    # Status
    status = Column(StringEnum(GoalStatus), default=GoalStatus.ACTIVE, nullable=False)

    # ML predictions
    achievement_probability = Column(Numeric(precision=5, scale=2), nullable=True)  # 0-100%

    # Gamification
    gamification_points = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="goals")
    milestones = relationship(
        "GoalMilestone",
        back_populates="goal",
        cascade="all, delete-orphan",
        order_by="GoalMilestone.target_date"
    )

    @property
    def progress_percentage(self) -> Decimal:
        """Calculate progress as percentage"""
        if self.target_amount == 0:
            return Decimal("0.00")
        return (self.current_amount / self.target_amount) * 100

    def __repr__(self) -> str:
        return f"<FinancialGoal(id={self.id}, name='{self.name}', progress={self.progress_percentage:.1f}%)>"


class GoalMilestone(Base):
    """
    Milestone for a financial goal.

    Breaks down a goal into smaller, achievable milestones.

    Attributes:
        id: UUID primary key
        goal_id: Foreign key to FinancialGoal
        name: Milestone name
        target_amount: Target amount for this milestone
        target_date: Target date for this milestone
        is_completed: Whether the milestone has been completed
        completed_at: When the milestone was completed
        created_at: Creation timestamp

    Relationships:
        goal: Parent financial goal
    """
    __tablename__ = "goal_milestones"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key
    goal_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_goals.id"),
        nullable=False,
        index=True
    )

    # Milestone information
    name = Column(String(255), nullable=False)
    target_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    target_date = Column(Date, nullable=False)

    # Status
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    goal = relationship("FinancialGoal", back_populates="milestones")

    def __repr__(self) -> str:
        status = "✓" if self.is_completed else "○"
        return f"<GoalMilestone({status} {self.name}, target={self.target_amount})>"
