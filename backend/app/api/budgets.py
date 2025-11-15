# app/api/budgets.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Annotated, Optional
from uuid import UUID
from decimal import Decimal

from app.db.database import get_db
from app.models.user import User
from app.models.budget import Budget, BudgetCategory
from app.models.financial_profile import FinancialProfile
from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetListResponse,
    BudgetCategoryAllocation,
)
from app.api.dependencies import get_current_user

router = APIRouter()


async def verify_profile_ownership(
    profile_id: UUID,
    db: Session,
    current_user: User
) -> FinancialProfile:
    """
    Helper function to verify that the current user owns the financial profile.

    Args:
        profile_id: ID of the profile to verify
        db: Database session
        current_user: Current authenticated user

    Returns:
        FinancialProfile object if authorized

    Raises:
        HTTPException 404: If profile doesn't exist
        HTTPException 403: If user doesn't own the profile
    """
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == profile_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial profile with id {profile_id} not found"
        )

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this financial profile"
        )

    return profile


async def get_budget_usage(budget: Budget, db: Session) -> dict:
    """
    Calculate budget usage based on transactions.

    Args:
        budget: Budget object
        db: Database session

    Returns:
        Dictionary with usage statistics
    """
    # Get all category IDs associated with this budget
    category_ids = [bc.category_id for bc in budget.budget_categories]

    if not category_ids:
        return {
            "current_usage": Decimal("0.00"),
            "usage_percentage": Decimal("0.00"),
            "remaining_amount": budget.amount,
        }

    # Get transactions in the budget period for these categories
    transactions = db.query(Transaction).join(
        Transaction.account
    ).filter(
        and_(
            Transaction.category_id.in_(category_ids),
            Transaction.transaction_date >= budget.start_date,
            Transaction.transaction_date <= budget.end_date,
            Transaction.account.has(financial_profile_id=budget.financial_profile_id)
        )
    ).all()

    # Calculate total spent (excluding income)
    from app.models.transaction import TransactionType
    total_spent = Decimal("0.00")
    for t in transactions:
        if t.transaction_type != TransactionType.INCOME:
            total_spent += Decimal(str(t.amount))

    usage_percentage = (total_spent / budget.amount * 100) if budget.amount > 0 else Decimal("0.00")
    remaining = budget.amount - total_spent

    return {
        "current_usage": total_spent,
        "usage_percentage": usage_percentage,
        "remaining_amount": remaining,
    }


@router.get(
    "/",
    response_model=BudgetListResponse,
    summary="List budgets",
    description="Retrieve all budgets for a financial profile",
    responses={
        200: {"description": "Budgets retrieved successfully"},
    },
    tags=["Budgets"]
)
async def list_budgets(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    profile_id: UUID = Query(..., description="Financial profile ID"),
    include_inactive: bool = Query(False, description="Include inactive budgets"),
) -> BudgetListResponse:
    """
    List all budgets for a financial profile.

    Args:
        profile_id: Financial profile ID to filter budgets
        include_inactive: Whether to include inactive budgets

    Returns:
        BudgetListResponse with budgets and total count
    """
    # Verify profile ownership
    await verify_profile_ownership(profile_id, db, current_user)

    # Build query
    query = db.query(Budget).filter(Budget.financial_profile_id == profile_id)

    if not include_inactive:
        query = query.filter(Budget.is_active == True)

    budgets = query.order_by(Budget.start_date.desc()).all()

    # Enhance budgets with usage data
    budget_responses = []
    for budget in budgets:
        usage = await get_budget_usage(budget, db)

        # Get category allocations
        allocations = []
        for bc in budget.budget_categories:
            category = db.query(Category).filter(Category.id == bc.category_id).first()
            if category:
                allocations.append(BudgetCategoryAllocation(
                    category_id=category.id,
                    category_name=category.name,
                    allocated_amount=bc.allocated_amount
                ))

        # Create response with computed fields
        budget_dict = {
            "id": budget.id,
            "financial_profile_id": budget.financial_profile_id,
            "name": budget.name,
            "period_type": budget.period_type,
            "start_date": budget.start_date,
            "end_date": budget.end_date,
            "amount": budget.amount,
            "currency": budget.currency,
            "is_active": budget.is_active,
            "alert_threshold_percentage": budget.alert_threshold_percentage,
            "created_at": budget.created_at,
            "updated_at": budget.updated_at,
            **usage,
            "category_allocations": allocations if allocations else None,
        }
        budget_responses.append(BudgetResponse(**budget_dict))

    return BudgetListResponse(items=budget_responses, total=len(budget_responses))


@router.post(
    "/",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create budget",
    description="Create a new budget for a financial profile",
    responses={
        201: {"description": "Budget created successfully"},
        403: {"description": "Not authorized to create budget for this profile"},
        404: {"description": "Financial profile not found"}
    },
    tags=["Budgets"]
)
async def create_budget(
    budget_in: BudgetCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> BudgetResponse:
    """
    Create a new budget.

    Verifies that the user owns the financial profile before creating the budget.

    Args:
        budget_in: Budget creation data

    Returns:
        Created budget with generated ID

    Raises:
        HTTPException 404: If financial profile doesn't exist
        HTTPException 403: If user doesn't own the financial profile
    """
    # Verify profile ownership
    await verify_profile_ownership(budget_in.financial_profile_id, db, current_user)

    # Create budget (excluding category_ids from model_dump)
    budget_data = budget_in.model_dump(exclude={"category_ids"})
    budget = Budget(**budget_data)
    db.add(budget)
    db.flush()  # Flush to get budget ID

    # Create budget-category associations
    # Distribute amount equally across categories (can be customized later)
    category_count = len(budget_in.category_ids)
    allocated_per_category = budget.amount / category_count if category_count > 0 else Decimal("0.00")

    for category_id in budget_in.category_ids:
        budget_category = BudgetCategory(
            budget_id=budget.id,
            category_id=category_id,
            allocated_amount=allocated_per_category
        )
        db.add(budget_category)

    db.commit()
    db.refresh(budget)

    # Get usage data
    usage = await get_budget_usage(budget, db)

    # Get category allocations
    allocations = []
    for bc in budget.budget_categories:
        category = db.query(Category).filter(Category.id == bc.category_id).first()
        if category:
            allocations.append(BudgetCategoryAllocation(
                category_id=category.id,
                category_name=category.name,
                allocated_amount=bc.allocated_amount
            ))

    # Create response
    budget_dict = {
        "id": budget.id,
        "financial_profile_id": budget.financial_profile_id,
        "name": budget.name,
        "period_type": budget.period_type,
        "start_date": budget.start_date,
        "end_date": budget.end_date,
        "amount": budget.amount,
        "currency": budget.currency,
        "is_active": budget.is_active,
        "alert_threshold_percentage": budget.alert_threshold_percentage,
        "created_at": budget.created_at,
        "updated_at": budget.updated_at,
        **usage,
        "category_allocations": allocations,
    }

    return BudgetResponse(**budget_dict)


@router.get(
    "/{budget_id}",
    response_model=BudgetResponse,
    summary="Get budget with usage",
    description="Retrieve a specific budget by its ID with current usage statistics",
    responses={
        200: {"description": "Budget retrieved successfully"},
        404: {"description": "Budget not found"},
        403: {"description": "Not authorized to access this budget"}
    },
    tags=["Budgets"]
)
async def get_budget(
    budget_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> BudgetResponse:
    """
    Get budget by ID with usage statistics.

    Args:
        budget_id: The budget ID to retrieve

    Returns:
        Budget details with current usage

    Raises:
        HTTPException 404: If budget doesn't exist
        HTTPException 403: If user doesn't own the budget
    """
    budget = db.query(Budget).filter(Budget.id == budget_id).first()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget with id {budget_id} not found"
        )

    # Verify ownership through profile
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == budget.financial_profile_id
    ).first()

    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this budget"
        )

    # Get usage data
    usage = await get_budget_usage(budget, db)

    # Get category allocations
    allocations = []
    for bc in budget.budget_categories:
        category = db.query(Category).filter(Category.id == bc.category_id).first()
        if category:
            allocations.append(BudgetCategoryAllocation(
                category_id=category.id,
                category_name=category.name,
                allocated_amount=bc.allocated_amount
            ))

    # Create response
    budget_dict = {
        "id": budget.id,
        "financial_profile_id": budget.financial_profile_id,
        "name": budget.name,
        "period_type": budget.period_type,
        "start_date": budget.start_date,
        "end_date": budget.end_date,
        "amount": budget.amount,
        "currency": budget.currency,
        "is_active": budget.is_active,
        "alert_threshold_percentage": budget.alert_threshold_percentage,
        "created_at": budget.created_at,
        "updated_at": budget.updated_at,
        **usage,
        "category_allocations": allocations,
    }

    return BudgetResponse(**budget_dict)


@router.patch(
    "/{budget_id}",
    response_model=BudgetResponse,
    summary="Update budget",
    description="Update an existing budget (partial update supported)",
    responses={
        200: {"description": "Budget updated successfully"},
        404: {"description": "Budget not found"},
        403: {"description": "Not authorized to update this budget"}
    },
    tags=["Budgets"]
)
async def update_budget(
    budget_id: UUID,
    budget_in: BudgetUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> BudgetResponse:
    """
    Update budget.

    Args:
        budget_id: The budget ID to update
        budget_in: Fields to update (partial update supported)

    Returns:
        Updated budget with current usage

    Raises:
        HTTPException 404: If budget doesn't exist
        HTTPException 403: If user doesn't own the budget
    """
    budget = db.query(Budget).filter(Budget.id == budget_id).first()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget with id {budget_id} not found"
        )

    # Verify ownership
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == budget.financial_profile_id
    ).first()

    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this budget"
        )

    # Update only provided fields (excluding category_ids)
    update_data = budget_in.model_dump(exclude_unset=True, exclude={"category_ids"})
    for field, value in update_data.items():
        setattr(budget, field, value)

    # Update category allocations if provided
    if budget_in.category_ids is not None:
        # Remove existing allocations
        db.query(BudgetCategory).filter(BudgetCategory.budget_id == budget_id).delete()

        # Create new allocations
        category_count = len(budget_in.category_ids)
        allocated_per_category = budget.amount / category_count if category_count > 0 else Decimal("0.00")

        for category_id in budget_in.category_ids:
            budget_category = BudgetCategory(
                budget_id=budget.id,
                category_id=category_id,
                allocated_amount=allocated_per_category
            )
            db.add(budget_category)

    db.commit()
    db.refresh(budget)

    # Get usage data
    usage = await get_budget_usage(budget, db)

    # Get category allocations
    allocations = []
    for bc in budget.budget_categories:
        category = db.query(Category).filter(Category.id == bc.category_id).first()
        if category:
            allocations.append(BudgetCategoryAllocation(
                category_id=category.id,
                category_name=category.name,
                allocated_amount=bc.allocated_amount
            ))

    # Create response
    budget_dict = {
        "id": budget.id,
        "financial_profile_id": budget.financial_profile_id,
        "name": budget.name,
        "period_type": budget.period_type,
        "start_date": budget.start_date,
        "end_date": budget.end_date,
        "amount": budget.amount,
        "currency": budget.currency,
        "is_active": budget.is_active,
        "alert_threshold_percentage": budget.alert_threshold_percentage,
        "created_at": budget.created_at,
        "updated_at": budget.updated_at,
        **usage,
        "category_allocations": allocations,
    }

    return BudgetResponse(**budget_dict)


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete budget",
    description="Delete a budget and all its category allocations",
    responses={
        204: {"description": "Budget deleted successfully"},
        404: {"description": "Budget not found"},
        403: {"description": "Not authorized to delete this budget"}
    },
    tags=["Budgets"]
)
async def delete_budget(
    budget_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """
    Delete budget.

    This will also delete all budget-category associations (CASCADE).

    Args:
        budget_id: The budget ID to delete

    Returns:
        No content (204)

    Raises:
        HTTPException 404: If budget doesn't exist
        HTTPException 403: If user doesn't own the budget
    """
    budget = db.query(Budget).filter(Budget.id == budget_id).first()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget with id {budget_id} not found"
        )

    # Verify ownership
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == budget.financial_profile_id
    ).first()

    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this budget"
        )

    db.delete(budget)
    db.commit()


@router.get(
    "/{budget_id}/usage",
    summary="Get budget usage stats",
    description="Get current usage statistics for a specific budget",
    responses={
        200: {"description": "Usage statistics retrieved successfully"},
        404: {"description": "Budget not found"},
        403: {"description": "Not authorized to access this budget"}
    },
    tags=["Budgets"]
)
async def get_budget_usage_stats(
    budget_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Get budget usage statistics.

    Provides detailed usage statistics including:
    - Current usage amount
    - Usage percentage
    - Remaining amount
    - Alert status (whether threshold has been exceeded)

    Args:
        budget_id: The budget ID

    Returns:
        Dictionary with usage statistics

    Raises:
        HTTPException 404: If budget doesn't exist
        HTTPException 403: If user doesn't own the budget
    """
    budget = db.query(Budget).filter(Budget.id == budget_id).first()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget with id {budget_id} not found"
        )

    # Verify ownership
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == budget.financial_profile_id
    ).first()

    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this budget"
        )

    # Get usage data
    usage = await get_budget_usage(budget, db)

    # Check if alert threshold exceeded
    is_over_threshold = usage["usage_percentage"] >= budget.alert_threshold_percentage

    return {
        "budget_id": str(budget.id),
        "budget_name": budget.name,
        "budget_amount": float(budget.amount),
        "currency": budget.currency,
        "period": {
            "start_date": str(budget.start_date),
            "end_date": str(budget.end_date),
            "type": budget.period_type.value
        },
        "current_usage": float(usage["current_usage"]),
        "usage_percentage": float(usage["usage_percentage"]),
        "remaining_amount": float(usage["remaining_amount"]),
        "alert_threshold_percentage": float(budget.alert_threshold_percentage),
        "is_over_threshold": is_over_threshold,
    }
