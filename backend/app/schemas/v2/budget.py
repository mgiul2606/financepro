# app/schemas/v2/budget.py
"""Budget Pydantic schemas for FinancePro v2.1"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from app.models.enums import PeriodType, ScopeType


class BudgetCategoryCreate(BaseModel):
    """Schema for budget category allocation"""
    category_id: UUID
    allocated_amount: Decimal = Field(..., ge=0, decimal_places=2)

    model_config = ConfigDict(from_attributes=True)


class BudgetCategoryResponse(BaseModel):
    """Schema for budget category response"""
    id: UUID
    budget_id: UUID
    category_id: UUID
    allocated_amount: Decimal
    spent_amount: Decimal = Decimal("0.00")
    percentage_used: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class BudgetBase(BaseModel):
    """Base schema for budget data"""
    name: str = Field(..., min_length=1, max_length=255)
    period_type: PeriodType = PeriodType.MONTHLY
    start_date: date
    end_date: Optional[date] = None
    total_amount: Decimal = Field(..., ge=0, decimal_places=2)
    currency: str = Field(..., min_length=3, max_length=3)
    rollover_enabled: bool = False
    alert_threshold_percent: int = Field(80, ge=0, le=100)
    is_active: bool = True


class BudgetCreate(BudgetBase):
    """Schema for creating a budget"""
    scope_type: ScopeType = ScopeType.USER
    scope_profile_ids: Optional[List[UUID]] = None
    category_allocations: Optional[List[dict]] = None  # [{category_id, allocated_amount}]

    model_config = ConfigDict(from_attributes=True)


class BudgetUpdate(BaseModel):
    """Schema for updating a budget"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    period_type: Optional[PeriodType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    rollover_enabled: Optional[bool] = None
    alert_threshold_percent: Optional[int] = Field(None, ge=0, le=100)
    is_active: Optional[bool] = None
    scope_type: Optional[ScopeType] = None
    scope_profile_ids: Optional[List[UUID]] = None
    category_allocations: Optional[List[dict]] = None  # [{category_id, allocated_amount}]

    model_config = ConfigDict(from_attributes=True)


class BudgetResponse(BaseModel):
    """Schema for budget response"""
    id: UUID
    user_id: UUID
    name: str
    scope_type: ScopeType
    scope_profile_ids: Optional[List[UUID]] = None
    period_type: PeriodType
    start_date: date
    end_date: Optional[date] = None
    total_amount: Decimal
    currency: str
    rollover_enabled: bool
    alert_threshold_percent: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # Calculated fields
    total_spent: Decimal = Decimal("0.00")
    remaining: Decimal = Decimal("0.00")
    usage_percentage: Decimal = Decimal("0.00")
    # Categories
    categories: List[BudgetCategoryResponse] = []

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_calculations(cls, budget):
        """Create response with calculated totals"""
        categories = []
        total_spent = Decimal("0.00")

        for bc in budget.budget_categories:
            categories.append(BudgetCategoryResponse(
                id=bc.id,
                category_id=bc.category_id,
                allocated_amount=bc.allocated_amount,
                spent_amount=bc.spent_amount,
                percentage_used=bc.percentage_used
            ))
            total_spent += bc.spent_amount

        percentage_used = 0.0
        if budget.total_amount > 0:
            percentage_used = float((total_spent / budget.total_amount) * 100)

        return cls(
            id=budget.id,
            user_id=budget.user_id,
            name=budget.name,
            scope_type=budget.scope_type,
            scope_profile_ids=budget.scope_profile_ids,
            period_type=budget.period_type,
            start_date=budget.start_date,
            end_date=budget.end_date,
            total_amount=budget.total_amount,
            currency=budget.currency,
            rollover_enabled=budget.rollover_enabled,
            alert_threshold_percent=budget.alert_threshold_percent,
            is_active=budget.is_active,
            created_at=budget.created_at,
            updated_at=budget.updated_at,
            total_spent=total_spent,
            percentage_used=percentage_used,
            categories=categories
        )
