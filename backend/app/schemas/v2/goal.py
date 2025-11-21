# app/schemas/v2/goal.py
"""Financial Goal Pydantic schemas for FinancePro v2.1"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from app.models.enums import GoalType, GoalStatus, ScopeType


class GoalContributionCreate(BaseModel):
    """Schema for creating a goal contribution"""
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    contribution_date: date
    transaction_id: Optional[UUID] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class GoalContributionResponse(BaseModel):
    """Schema for goal contribution response"""
    id: UUID
    goal_id: UUID
    amount: Decimal
    contribution_date: date
    transaction_id: Optional[UUID] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MilestoneSchema(BaseModel):
    """Schema for goal milestone"""
    name: str
    target_amount: Decimal = Field(..., ge=0, decimal_places=2)
    completed: bool = False
    completed_at: Optional[datetime] = None


class GoalBase(BaseModel):
    """Base schema for goal data"""
    name: str = Field(..., min_length=1, max_length=255)
    goal_type: GoalType
    target_amount: Decimal = Field(..., gt=0, decimal_places=2)
    currency: str = Field(..., min_length=3, max_length=3)
    target_date: date
    priority: int = Field(5, ge=1, le=10)
    icon: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    image_url: Optional[str] = None
    notes: Optional[str] = None


class GoalCreate(GoalBase):
    """Schema for creating a goal"""
    scope_type: ScopeType = ScopeType.USER
    scope_profile_ids: Optional[List[UUID]] = None
    milestones: Optional[List[MilestoneSchema]] = None
    initial_amount: Decimal = Field(Decimal("0.00"), ge=0, decimal_places=2)

    model_config = ConfigDict(from_attributes=True)


class GoalUpdate(BaseModel):
    """Schema for updating a goal"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    goal_type: Optional[GoalType] = None
    target_amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    target_date: Optional[date] = None
    priority: Optional[int] = Field(None, ge=1, le=10)
    status: Optional[GoalStatus] = None
    icon: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    image_url: Optional[str] = None
    notes: Optional[str] = None
    scope_type: Optional[ScopeType] = None
    scope_profile_ids: Optional[List[UUID]] = None
    milestones: Optional[List[MilestoneSchema]] = None

    model_config = ConfigDict(from_attributes=True)


class GoalResponse(BaseModel):
    """Schema for goal response"""
    id: UUID
    user_id: UUID
    name: str
    goal_type: GoalType
    scope_type: ScopeType
    scope_profile_ids: Optional[List[UUID]] = None
    target_amount: Decimal
    current_amount: Decimal
    currency: str
    target_date: date
    priority: int
    status: GoalStatus
    icon: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    milestones: Optional[List[MilestoneSchema]] = None
    gamification_level: int
    gamification_points: int
    gamification_badges: Optional[List[str]] = None
    achievement_probability: Optional[float] = None
    monthly_contribution: Optional[Decimal] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Calculated fields
    progress_percentage: float
    remaining_amount: Decimal
    # Recent contributions
    recent_contributions: List[GoalContributionResponse] = []

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_calculations(cls, goal, include_contributions: bool = True):
        """Create response with calculated fields"""
        recent_contributions = []
        if include_contributions and goal.contributions:
            recent_contributions = [
                GoalContributionResponse(
                    id=c.id,
                    goal_id=c.goal_id,
                    amount=c.amount,
                    contribution_date=c.contribution_date,
                    transaction_id=c.transaction_id,
                    notes=c.notes,
                    created_at=c.created_at
                )
                for c in goal.contributions[:5]  # Last 5 contributions
            ]

        milestones = None
        if goal.milestones:
            milestones = [MilestoneSchema(**m) for m in goal.milestones]

        badges = None
        if goal.gamification_badges:
            badges = goal.gamification_badges

        return cls(
            id=goal.id,
            user_id=goal.user_id,
            name=goal.name,
            goal_type=goal.goal_type,
            scope_type=goal.scope_type,
            scope_profile_ids=goal.scope_profile_ids,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            currency=goal.currency,
            target_date=goal.target_date,
            priority=goal.priority,
            status=goal.status,
            icon=goal.icon,
            color=goal.color,
            image_url=goal.image_url,
            milestones=milestones,
            gamification_level=goal.gamification_level,
            gamification_points=goal.gamification_points,
            gamification_badges=badges,
            achievement_probability=float(goal.achievement_probability) if goal.achievement_probability else None,
            monthly_contribution=goal.monthly_contribution,
            notes=goal.notes,
            created_at=goal.created_at,
            updated_at=goal.updated_at,
            progress_percentage=goal.progress_percentage,
            remaining_amount=goal.remaining_amount,
            recent_contributions=recent_contributions
        )
