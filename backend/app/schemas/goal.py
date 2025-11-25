# app/schemas/goal.py

from pydantic import BaseModel, Field, ConfigDict, computed_field, field_validator
from datetime import datetime, date
from typing import Optional
from uuid import UUID
from decimal import Decimal
from app.models import GoalType, GoalStatus


class FinancialGoalBase(BaseModel):
    """
    Base schema for FinancialGoal with common fields.
    Used as foundation for Create and Update schemas.
    """
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Goal name",
        examples=["New House Down Payment", "Dream Vacation", "Emergency Fund"]
    )
    description: Optional[str] = Field(
        None,
        description="Detailed description of the goal"
    )
    goal_type: GoalType = Field(
        ...,
        description="Type of goal (house, car, vacation, retirement, etc.)"
    )
    target_amount: Decimal = Field(
        ...,
        gt=0,
        decimal_places=2,
        description="Target amount to achieve (must be positive)",
        examples=[50000.00, 10000.00, 100000.00]
    )
    target_date: date = Field(
        ...,
        description="Target date to achieve the goal"
    )
    priority: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Priority level (1-10, where 10 is highest priority)"
    )

    @field_validator('priority')
    @classmethod
    def validate_priority(cls, v: int) -> int:
        """Ensure priority is between 1 and 10"""
        if v < 1 or v > 10:
            raise ValueError('Priority must be between 1 and 10')
        return v


class FinancialGoalCreate(FinancialGoalBase):
    """
    Schema for creating a new financial goal.
    User-level goal with scope support.
    """
    scope_type: str = Field(
        default="USER",
        description="Scope type: USER, PROFILE, or MULTI_PROFILE"
    )
    scope_profile_ids: Optional[list[UUID]] = Field(
        None,
        description="Profile IDs for PROFILE or MULTI_PROFILE scope"
    )
    linked_account_id: Optional[UUID] = Field(
        None,
        description="Optional linked account for this goal"
    )
    currency: str = Field(
        default="USD",
        pattern="^[A-Z]{3}$",
        description="ISO 4217 currency code"
    )
    start_date: Optional[date] = Field(
        None,
        description="Goal start date (defaults to today)"
    )
    current_amount: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        decimal_places=2,
        description="Initial amount already saved towards this goal"
    )
    auto_allocate: bool = Field(
        default=False,
        description="Enable automatic allocation"
    )
    milestones: Optional[list] = Field(
        None,
        description="Optional milestones for this goal"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "New House Down Payment",
                "description": "Save for 20% down payment on new house",
                "goal_type": "house",
                "scope_type": "USER",
                "target_amount": 50000.00,
                "current_amount": 5000.00,
                "currency": "USD",
                "target_date": "2026-12-31",
                "priority": 9
            }
        }
    )


class FinancialGoalUpdate(BaseModel):
    """
    Schema for updating an existing financial goal.
    All fields are optional (partial update).
    """
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Updated goal name"
    )
    description: Optional[str] = Field(
        None,
        description="Updated description"
    )
    goal_type: Optional[GoalType] = Field(
        None,
        description="Updated goal type"
    )
    target_amount: Optional[Decimal] = Field(
        None,
        gt=0,
        decimal_places=2,
        description="Updated target amount"
    )
    current_amount: Optional[Decimal] = Field(
        None,
        ge=0,
        decimal_places=2,
        description="Updated current saved amount (for manual updates)"
    )
    target_date: Optional[date] = Field(
        None,
        description="Updated target date"
    )
    priority: Optional[int] = Field(
        None,
        ge=1,
        le=10,
        description="Updated priority level"
    )
    status: Optional[GoalStatus] = Field(
        None,
        description="Updated goal status"
    )

    @field_validator('priority')
    @classmethod
    def validate_priority(cls, v: Optional[int]) -> Optional[int]:
        """Ensure priority is between 1 and 10 if provided"""
        if v is not None and (v < 1 or v > 10):
            raise ValueError('Priority must be between 1 and 10')
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "current_amount": 7500.00,
                "priority": 10,
                "status": "active"
            }
        }
    )


class GoalMilestoneResponse(BaseModel):
    """
    Schema for goal milestone.
    Represents a smaller achievable step towards the main goal.
    """
    id: UUID = Field(..., description="Unique milestone identifier")
    goal_id: UUID = Field(..., description="ID of the parent goal")
    name: str = Field(..., description="Milestone name")
    target_amount: Decimal = Field(..., description="Target amount for this milestone")
    target_date: date = Field(..., description="Target date for this milestone")
    is_completed: bool = Field(
        default=False,
        description="Whether the milestone has been completed"
    )
    completed_at: Optional[datetime] = Field(
        None,
        description="When the milestone was completed"
    )
    created_at: datetime = Field(..., description="Milestone creation timestamp (UTC)")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440041",
                "goal_id": "550e8400-e29b-41d4-a716-446655440040",
                "name": "First 10k saved",
                "target_amount": 10000.00,
                "target_date": "2025-06-30",
                "is_completed": True,
                "completed_at": "2025-06-15T14:30:00Z",
                "created_at": "2025-01-01T00:00:00Z"
            }
        }
    )


class FinancialGoalResponse(FinancialGoalBase):
    """
    Complete financial goal schema returned by API endpoints.
    Includes all fields, computed progress, and optional milestones.
    """
    id: UUID = Field(..., description="Unique goal identifier")
    user_id: UUID = Field(
        ...,
        description="ID of the user this goal belongs to"
    )
    scope_type: str = Field(
        ...,
        description="Scope type (user, profile, multi_profile)"
    )
    scope_profile_ids: Optional[list[UUID]] = Field(
        None,
        description="List of profile IDs when using profile or multi_profile scope"
    )
    linked_account_id: Optional[UUID] = Field(
        None,
        description="Optional linked account ID for this goal"
    )
    current_amount: Decimal = Field(
        ...,
        description="Current amount saved towards this goal"
    )
    currency: str = Field(
        ...,
        description="Currency code for the goal"
    )
    start_date: date = Field(
        ...,
        description="Goal start date"
    )
    auto_allocate: bool = Field(
        default=False,
        description="Whether to auto-allocate funds to this goal"
    )
    monthly_contribution: Optional[Decimal] = Field(
        None,
        description="Recommended monthly contribution to reach goal on time"
    )
    status: GoalStatus = Field(
        ...,
        description="Current goal status (active, paused, completed, cancelled)"
    )
    achievement_probability: Optional[Decimal] = Field(
        None,
        ge=0,
        le=100,
        description="ML-predicted probability of achieving goal (0-100%)"
    )
    gamification_points: int = Field(
        default=0,
        description="Points earned for progress on this goal"
    )
    milestones: Optional[list[GoalMilestoneResponse]] = Field(
        None,
        description="Milestones for this goal"
    )
    created_at: datetime = Field(..., description="Goal creation timestamp (UTC)")
    updated_at: datetime = Field(..., description="Last update timestamp (UTC)")

    progress_percentage: Decimal = Field(
        ...,
        description="Progress towards goal as percentage"
    )
    is_on_track: bool = Field(
        ...,
        description="Whether the goal is on track to be achieved"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440040",
                "user_id": "550e8400-e29b-41d4-a716-446655440001",
                "name": "New House Down Payment",
                "description": "Save for 20% down payment on new house",
                "goal_type": "house",
                "scope_type": "user",
                "scope_profile_ids": None,
                "linked_account_id": None,
                "target_amount": 50000.00,
                "current_amount": 15000.00,
                "currency": "USD",
                "start_date": "2025-01-01",
                "target_date": "2026-12-31",
                "auto_allocate": False,
                "monthly_contribution": 1750.00,
                "priority": 9,
                "status": "active",
                "achievement_probability": 85.50,
                "progress_percentage": 30.00,
                "is_on_track": True,
                "gamification_points": 150,
                "milestones": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440041",
                        "goal_id": "550e8400-e29b-41d4-a716-446655440040",
                        "name": "First 10k saved",
                        "target_amount": 10000.00,
                        "target_date": "2025-06-30",
                        "is_completed": True,
                        "completed_at": "2025-06-15T14:30:00Z",
                        "created_at": "2025-01-01T00:00:00Z"
                    }
                ],
                "created_at": "2025-01-01T00:00:00Z",
                "updated_at": "2025-01-15T10:30:00Z"
            }
        }
    )


class FinancialGoalListResponse(BaseModel):
    """
    Schema for list financial goals response with pagination support.
    """
    items: list[FinancialGoalResponse] = Field(
        ...,
        description="List of financial goals"
    )
    total: int = Field(..., description="Total number of goals")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440040",
                        "user_id": "550e8400-e29b-41d4-a716-446655440001",
                        "name": "New House Down Payment",
                        "description": "Save for 20% down payment",
                        "goal_type": "house",
                        "scope_type": "user",
                        "scope_profile_ids": None,
                        "linked_account_id": None,
                        "target_amount": 50000.00,
                        "current_amount": 15000.00,
                        "currency": "USD",
                        "start_date": "2025-01-01",
                        "target_date": "2026-12-31",
                        "auto_allocate": False,
                        "monthly_contribution": 1750.00,
                        "priority": 9,
                        "status": "active",
                        "achievement_probability": 85.50,
                        "progress_percentage": 30.00,
                        "is_on_track": True,
                        "gamification_points": 150,
                        "milestones": None,
                        "created_at": "2025-01-01T00:00:00Z",
                        "updated_at": "2025-01-15T10:30:00Z"
                    }
                ],
                "total": 1
            }
        }
    )


class GoalMilestoneCreate(BaseModel):
    """
    Schema for creating a new milestone for a goal.
    """
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Milestone name"
    )
    target_amount: Decimal = Field(
        ...,
        gt=0,
        decimal_places=2,
        description="Target amount for this milestone"
    )
    target_date: date = Field(
        ...,
        description="Target date for this milestone"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Reach 25k milestone",
                "target_amount": 25000.00,
                "target_date": "2025-12-31"
            }
        }
    )


class GoalMilestoneUpdate(BaseModel):
    """
    Schema for updating a milestone.
    All fields are optional (partial update).
    """
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Updated milestone name"
    )
    target_amount: Optional[Decimal] = Field(
        None,
        gt=0,
        decimal_places=2,
        description="Updated target amount"
    )
    target_date: Optional[date] = Field(
        None,
        description="Updated target date"
    )
    is_completed: Optional[bool] = Field(
        None,
        description="Mark milestone as completed or uncompleted"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "is_completed": True
            }
        }
    )


class GoalSummary(BaseModel):
    """
    Schema for goals summary and analytics.
    Provides overview of all goals for a financial profile.
    """
    total_goals: int = Field(..., description="Total number of goals")
    active_goals: int = Field(..., description="Number of active goals")
    completed_goals: int = Field(..., description="Number of completed goals")
    total_target_amount: Decimal = Field(
        ...,
        description="Total target amount across all active goals"
    )
    total_current_amount: Decimal = Field(
        ...,
        description="Total current amount saved across all active goals"
    )
    overall_progress_percentage: Decimal = Field(
        ...,
        description="Overall progress percentage across all active goals"
    )
    total_gamification_points: int = Field(
        ...,
        description="Total gamification points earned"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_goals": 5,
                "active_goals": 3,
                "completed_goals": 2,
                "total_target_amount": 100000.00,
                "total_current_amount": 35000.00,
                "overall_progress_percentage": 35.00,
                "total_gamification_points": 450
            }
        }
    )
