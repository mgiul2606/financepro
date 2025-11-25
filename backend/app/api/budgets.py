# app/api/budgets.py
"""
Budget Router for FinancePro API v1.

Uses BudgetService with:
- User-level budgets with scope support (USER, PROFILE, MULTI_PROFILE)
- Spent calculation
- Alert threshold monitoring
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Annotated, Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import date

from app.db.database import get_db
from app.models.user import User
from app.models.enums import ScopeType, PeriodType
from app.services import BudgetService
from app.core.rls import get_rls_context
from app.api.dependencies import get_current_user
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetCategoryCreate,
    BudgetCategoryResponse
)
from pydantic import BaseModel

router = APIRouter()


# Response models
class BudgetListResponse(BaseModel):
    items: List[BudgetResponse]
    total: int


class BudgetUsageResponse(BaseModel):
    budget_id: str
    budget_name: str
    total_amount: float
    total_spent: float
    remaining: float
    usage_percentage: float
    alert_threshold_percent: int
    is_over_threshold: bool
    is_over_budget: bool
    category_breakdown: list


def get_budget_service(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
) -> BudgetService:
    """Get budget service with RLS context."""
    rls = get_rls_context(db, current_user.id)
    return BudgetService(db, rls)


@router.get(
    "/",
    response_model=BudgetListResponse,
    summary="List budgets",
    description="List all budgets for the current user with optional filters"
)
async def list_budgets(
    service: Annotated[BudgetService, Depends(get_budget_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    include_inactive: bool = Query(False, description="Include inactive budgets"),
    period_type: Optional[PeriodType] = Query(None, description="Filter by period type"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
) -> BudgetListResponse:
    """List all budgets for the current user."""
    budgets = service.list_budgets(
        user_id=current_user.id,
        include_inactive=include_inactive,
        period_type=period_type,
        limit=limit,
        offset=offset
    )

    items = []
    for budget in budgets:
        # Calculate spent
        spent_info = service.calculate_spent(budget, recalculate=False)

        items.append(BudgetResponse(
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
            total_spent=spent_info['total_spent'],
            remaining=spent_info['remaining'],
            usage_percentage=spent_info['usage_percentage'],
            created_at=budget.created_at,
            updated_at=budget.updated_at
        ))

    return BudgetListResponse(items=items, total=len(items))


@router.post(
    "/",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create budget",
    description="Create a new budget with scope support"
)
async def create_budget(
    budget_in: BudgetCreate,
    service: Annotated[BudgetService, Depends(get_budget_service)],
    current_user: Annotated[User, Depends(get_current_user)]
) -> BudgetResponse:
    """Create a new budget."""
    try:
        budget = service.create_budget(
            user_id=current_user.id,
            name=budget_in.name,
            scope_type=budget_in.scope_type,
            period_type=budget_in.period_type,
            start_date=budget_in.start_date,
            total_amount=budget_in.total_amount,
            currency=budget_in.currency,
            scope_profile_ids=budget_in.scope_profile_ids,
            end_date=budget_in.end_date,
            rollover_enabled=budget_in.rollover_enabled,
            alert_threshold_percent=budget_in.alert_threshold_percent,
            category_allocations=budget_in.category_allocations
        )

        # Calculate spent
        spent_info = service.calculate_spent(budget, recalculate=True)

        return BudgetResponse(
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
            total_spent=spent_info['total_spent'],
            remaining=spent_info['remaining'],
            usage_percentage=spent_info['usage_percentage'],
            created_at=budget.created_at,
            updated_at=budget.updated_at
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{budget_id}",
    response_model=BudgetResponse,
    summary="Get budget",
    description="Get a specific budget by ID"
)
async def get_budget(
    budget_id: UUID,
    service: Annotated[BudgetService, Depends(get_budget_service)]
) -> BudgetResponse:
    """Get budget by ID."""
    try:
        budget = service.get_budget(budget_id)
        spent_info = service.calculate_spent(budget, recalculate=False)

        return BudgetResponse(
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
            total_spent=spent_info['total_spent'],
            remaining=spent_info['remaining'],
            usage_percentage=spent_info['usage_percentage'],
            created_at=budget.created_at,
            updated_at=budget.updated_at
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch(
    "/{budget_id}",
    response_model=BudgetResponse,
    summary="Update budget",
    description="Update an existing budget"
)
async def update_budget(
    budget_id: UUID,
    budget_in: BudgetUpdate,
    service: Annotated[BudgetService, Depends(get_budget_service)]
) -> BudgetResponse:
    """Update budget."""
    try:
        updates = budget_in.model_dump(exclude_unset=True)
        budget = service.update_budget(budget_id, **updates)
        spent_info = service.calculate_spent(budget, recalculate=True)

        return BudgetResponse(
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
            total_spent=spent_info['total_spent'],
            remaining=spent_info['remaining'],
            usage_percentage=spent_info['usage_percentage'],
            created_at=budget.created_at,
            updated_at=budget.updated_at
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete budget",
    description="Delete a budget"
)
async def delete_budget(
    budget_id: UUID,
    service: Annotated[BudgetService, Depends(get_budget_service)]
) -> None:
    """Delete budget."""
    try:
        service.delete_budget(budget_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/{budget_id}/usage",
    response_model=BudgetUsageResponse,
    summary="Get budget usage",
    description="Get detailed usage statistics for a budget"
)
async def get_budget_usage(
    budget_id: UUID,
    service: Annotated[BudgetService, Depends(get_budget_service)]
) -> BudgetUsageResponse:
    """Get detailed budget usage."""
    try:
        budget = service.get_budget(budget_id)
        spent_info = service.calculate_spent(budget, recalculate=True)
        alert_info = service.check_alerts(budget, create_notifications=False)

        return BudgetUsageResponse(
            budget_id=str(budget.id),
            budget_name=budget.name,
            total_amount=float(budget.total_amount),
            total_spent=float(spent_info['total_spent']),
            remaining=float(spent_info['remaining']),
            usage_percentage=float(spent_info['usage_percentage']),
            alert_threshold_percent=budget.alert_threshold_percent,
            is_over_threshold=alert_info['is_over_threshold'],
            is_over_budget=alert_info['is_over_budget'],
            category_breakdown=spent_info['category_breakdown']
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/{budget_id}/categories",
    response_model=BudgetCategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add category to budget",
    description="Add a category allocation to a budget"
)
async def add_category_to_budget(
    budget_id: UUID,
    category_in: BudgetCategoryCreate,
    service: Annotated[BudgetService, Depends(get_budget_service)]
) -> BudgetCategoryResponse:
    """Add category to budget."""
    try:
        budget_category = service.add_category_to_budget(
            budget_id=budget_id,
            category_id=category_in.category_id,
            allocated_amount=category_in.allocated_amount
        )

        return BudgetCategoryResponse(
            id=budget_category.id,
            budget_id=budget_category.budget_id,
            category_id=budget_category.category_id,
            allocated_amount=budget_category.allocated_amount,
            spent_amount=budget_category.spent_amount
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/{budget_id}/categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove category from budget",
    description="Remove a category allocation from a budget"
)
async def remove_category_from_budget(
    budget_id: UUID,
    category_id: UUID,
    service: Annotated[BudgetService, Depends(get_budget_service)]
) -> None:
    """Remove category from budget."""
    try:
        if not service.remove_category_from_budget(budget_id, category_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found in budget"
            )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
