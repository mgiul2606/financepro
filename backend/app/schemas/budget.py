# app/schemas/budget.py

from app.schemas.base import CamelCaseModel
from pydantic import Field, ConfigDict, field_validator
from datetime import datetime, date
from typing import Optional
from uuid import UUID
from decimal import Decimal
from app.models import PeriodType, ScopeType


class BudgetBase(CamelCaseModel):
    """
    Base schema for Budget with common fields.
    Used as foundation for Create and Update schemas.
    """
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Budget name",
        examples=["Monthly Expenses", "Q1 2025 Budget", "Annual Vacation Fund"]
    )
    period_type: PeriodType = Field(
        ...,
        description="Type of budget period (monthly, quarterly, yearly, custom)"
    )
    start_date: date = Field(
        ...,
        description="Start date of the budget period"
    )
    end_date: Optional[date] = Field(
        None,
        description="End date of the budget period (NULL for rolling budgets)"
    )
    total_amount: Decimal = Field(
        ...,
        gt=0,
        decimal_places=2,
        description="Total budget amount (must be positive)",
        examples=[1000.00, 5000.00, 50000.00]
    )
    currency: str = Field(
        ...,
        pattern="^[A-Z]{3}$",
        description="ISO 4217 currency code (3 uppercase letters)",
        examples=["EUR", "USD", "GBP"]
    )

    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v: Optional[date], info) -> Optional[date]:
        """Ensure end_date is after start_date if provided"""
        if v is not None and 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class BudgetCreate(BudgetBase):
    """
    Schema for creating a new budget.
    User-level budget with scope support.
    """
    scope_type: ScopeType = Field(
        default=ScopeType.USER,
        description="Scope type: USER, PROFILE, or MULTI_PROFILE"
    )
    scope_profile_ids: Optional[list[UUID]] = Field(
        None,
        description="Profile IDs for PROFILE or MULTI_PROFILE scope"
    )
    rollover_enabled: bool = Field(
        default=False,
        description="Enable rollover of unspent amounts to next period"
    )
    alert_threshold_percent: int = Field(
        default=80,
        ge=0,
        le=100,
        description="Percentage of budget to trigger alerts (0-100)"
    )
    category_allocations: Optional[list] = Field(
        None,
        description="Optional category allocations for this budget"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Monthly Expenses January 2025",
                "period_type": "monthly",
                "start_date": "2025-01-01",
                "end_date": "2025-01-31",
                "total_amount": 2000.00,
                "currency": "EUR",
                "scope_type": "user",
                "rollover_enabled": False,
                "alert_threshold_percent": 80
            }
        }
    )


class BudgetUpdate(CamelCaseModel):
    """
    Schema for updating an existing budget.
    All fields are optional (partial update).
    """
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Updated budget name"
    )
    period_type: Optional[PeriodType] = Field(
        None,
        description="Updated period type"
    )
    start_date: Optional[date] = Field(
        None,
        description="Updated start date"
    )
    end_date: Optional[date] = Field(
        None,
        description="Updated end date"
    )
    total_amount: Optional[Decimal] = Field(
        None,
        gt=0,
        decimal_places=2,
        description="Updated budget amount"
    )
    currency: Optional[str] = Field(
        None,
        pattern="^[A-Z]{3}$",
        description="Updated currency code"
    )
    scope_type: Optional[ScopeType] = Field(
        None,
        description="Updated scope type"
    )
    scope_profile_ids: Optional[list[UUID]] = Field(
        None,
        description="Updated profile IDs"
    )
    rollover_enabled: Optional[bool] = Field(
        None,
        description="Updated rollover setting"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Whether the budget is active"
    )
    alert_threshold_percent: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Updated alert threshold percentage"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Updated Budget Name",
                "total_amount": 2500.00,
                "alert_threshold_percent": 85
            }
        }
    )


class BudgetCategoryAllocation(CamelCaseModel):
    """
    Schema for category allocation within a budget.
    Shows how budget amount is distributed across categories.
    """
    category_id: UUID = Field(..., description="Category identifier")
    category_name: str = Field(..., description="Category name")
    allocated_amount: Decimal = Field(
        ...,
        description="Amount allocated to this category"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "category_id": "550e8400-e29b-41d4-a716-446655440020",
                "category_name": "Groceries",
                "allocated_amount": 500.00
            }
        }
    )


class BudgetResponse(BudgetBase):
    """
    Complete budget schema returned by API endpoints.
    Includes all fields, current usage, and category allocations.
    """
    id: UUID = Field(..., description="Unique budget identifier")
    user_id: UUID = Field(
        ...,
        description="ID of the user this budget belongs to"
    )
    scope_type: ScopeType = Field(
        ...,
        description="Scope type (user, profile, multi_profile)"
    )
    scope_profile_ids: Optional[list[UUID]] = Field(
        None,
        description="List of profile IDs when using profile or multi_profile scope"
    )
    rollover_enabled: bool = Field(
        default=False,
        description="Whether unspent amounts rollover to next period"
    )
    is_active: bool = Field(
        default=True,
        description="Whether the budget is currently active"
    )
    alert_threshold_percent: int = Field(
        ...,
        description="Percentage of budget to trigger alerts"
    )
    total_spent: Optional[Decimal] = Field(
        None,
        description="Total spent against this budget (computed)"
    )
    remaining: Optional[Decimal] = Field(
        None,
        description="Remaining budget amount (computed)"
    )
    usage_percentage: Optional[Decimal] = Field(
        None,
        description="Percentage of budget used (computed)"
    )
    category_allocations: Optional[list[BudgetCategoryAllocation]] = Field(
        None,
        description="Category allocations for this budget"
    )
    created_at: datetime = Field(..., description="Budget creation timestamp (UTC)")
    updated_at: datetime = Field(..., description="Last update timestamp (UTC)")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440030",
                "user_id": "550e8400-e29b-41d4-a716-446655440001",
                "name": "Monthly Expenses January 2025",
                "period_type": "monthly",
                "start_date": "2025-01-01",
                "end_date": "2025-01-31",
                "total_amount": 2000.00,
                "currency": "EUR",
                "scope_type": "user",
                "scope_profile_ids": None,
                "rollover_enabled": False,
                "is_active": True,
                "alert_threshold_percent": 80,
                "total_spent": 1250.00,
                "remaining": 750.00,
                "usage_percentage": 62.50,
                "category_allocations": [
                    {
                        "category_id": "550e8400-e29b-41d4-a716-446655440020",
                        "category_name": "Groceries",
                        "allocated_amount": 500.00
                    }
                ],
                "created_at": "2025-01-01T00:00:00Z",
                "updated_at": "2025-01-15T10:30:00Z"
            }
        }
    )


class BudgetListResponse(CamelCaseModel):
    """
    Schema for list budgets response with pagination support.
    """
    items: list[BudgetResponse] = Field(
        ...,
        description="List of budgets"
    )
    total: int = Field(..., description="Total number of budgets")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440030",
                        "user_id": "550e8400-e29b-41d4-a716-446655440001",
                        "name": "Monthly Expenses January 2025",
                        "period_type": "monthly",
                        "start_date": "2025-01-01",
                        "end_date": "2025-01-31",
                        "total_amount": 2000.00,
                        "currency": "EUR",
                        "scope_type": "user",
                        "scope_profile_ids": None,
                        "rollover_enabled": False,
                        "is_active": True,
                        "alert_threshold_percent": 80,
                        "total_spent": 1250.00,
                        "remaining": 750.00,
                        "usage_percentage": 62.50,
                        "category_allocations": None,
                        "created_at": "2025-01-01T00:00:00Z",
                        "updated_at": "2025-01-15T10:30:00Z"
                    }
                ],
                "total": 1
            }
        }
    )


class BudgetSummary(CamelCaseModel):
    """
    Schema for budget summary and analytics.
    Provides overview of all budgets for a financial profile.
    """
    total_budgeted: Decimal = Field(
        ...,
        description="Total amount budgeted across all active budgets"
    )
    total_spent: Decimal = Field(
        ...,
        description="Total amount spent across all active budgets"
    )
    total_remaining: Decimal = Field(
        ...,
        description="Total remaining across all active budgets"
    )
    overall_usage_percentage: Decimal = Field(
        ...,
        description="Overall usage percentage across all budgets"
    )
    active_budgets_count: int = Field(
        ...,
        description="Number of active budgets"
    )
    budgets_over_threshold: int = Field(
        ...,
        description="Number of budgets exceeding alert threshold"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_budgeted": 5000.00,
                "total_spent": 3250.00,
                "total_remaining": 1750.00,
                "overall_usage_percentage": 65.00,
                "active_budgets_count": 3,
                "budgets_over_threshold": 1
            }
        }
    )

class BudgetCategoryCreate(CamelCaseModel):
    """Schema for budget category allocation"""
    category_id: UUID
    allocated_amount: Decimal = Field(..., ge=0, decimal_places=2)

    model_config = ConfigDict(from_attributes=True)


class BudgetCategoryResponse(CamelCaseModel):
    """Schema for budget category response"""
    id: UUID
    budget_id: UUID
    category_id: UUID
    allocated_amount: Decimal
    spent_amount: Decimal = Decimal("0.00")
    percentage_used: float = 0.0

    model_config = ConfigDict(from_attributes=True)
