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
    notes: Optional[str] = None


class GoalCreate(GoalBase):
    """Schema for creating a goal"""
    scope_type: ScopeType = ScopeType.USER
    scope_profile_ids: Optional[List[UUID]] = None
    linked_account_id: Optional[UUID] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    auto_allocate: bool = False
    milestones: Optional[List[dict]] = None  # [{name, percentage}]
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
    linked_account_id: Optional[UUID] = None
    description: Optional[str] = None
    target_amount: Decimal
    current_amount: Decimal
    currency: str
    start_date: date
    target_date: date
    monthly_contribution: Decimal
    auto_allocate: bool
    priority: int
    status: GoalStatus
    achievement_probability: Optional[Decimal] = None
    gamification_points: int = 0
    # Calculated fields
    progress_percentage: Decimal = Decimal("0.00")
    is_on_track: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_calculations(cls, goal, include_contributions: bool = False):
        """Create response with calculated fields"""
        return cls(
            id=goal.id,
            user_id=goal.user_id,
            name=goal.name,
            goal_type=goal.goal_type,
            scope_type=goal.scope_type,
            scope_profile_ids=goal.scope_profile_ids,
            linked_account_id=goal.linked_account_id,
            description=goal.description,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            currency=goal.currency,
            start_date=goal.start_date,
            target_date=goal.target_date,
            monthly_contribution=goal.monthly_contribution or Decimal("0.00"),
            auto_allocate=goal.auto_allocate,
            priority=goal.priority,
            status=goal.status,
            achievement_probability=goal.achievement_probability,
            gamification_points=goal.gamification_points,
            progress_percentage=Decimal(str(goal.progress_percentage)),
            is_on_track=True,  # TODO: Calculate based on progress vs time
            created_at=goal.created_at,
            updated_at=goal.updated_at
        )
