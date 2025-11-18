# app/api/categories.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Annotated, Optional
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.models.category import Category
from app.models.financial_profile import FinancialProfile
from app.schemas.category import CategoryResponse, CategoryListResponse
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


@router.get(
    "/",
    response_model=CategoryListResponse,
    summary="List categories",
    description="Retrieve all categories for a financial profile"
)
async def list_categories(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    profile_id: UUID = Query(..., description="Financial profile ID"),
    parent_id: Optional[UUID] = Query(None, description="Filter by parent category ID (null for root categories)"),
    level: Optional[int] = Query(None, ge=1, le=3, description="Filter by hierarchy level (1, 2, or 3)"),
    is_active: bool = Query(True, description="Filter by active status"),
) -> CategoryListResponse:
    """
    List all categories for a financial profile.

    Args:
        profile_id: Financial profile ID to filter categories
        parent_id: Optional filter by parent category ID
        level: Optional filter by hierarchy level
        is_active: Filter by active status (default: True)

    Returns:
        CategoryListResponse with categories and total count
    """
    # Verify profile ownership
    await verify_profile_ownership(profile_id, db, current_user)

    # Build query
    query = db.query(Category).filter(
        Category.financial_profile_id == profile_id,
        Category.is_active == is_active
    )

    # Apply optional filters
    if parent_id is not None:
        query = query.filter(Category.parent_category_id == parent_id)

    if level is not None:
        query = query.filter(Category.level == level)

    # Order by name
    categories = query.order_by(Category.name).all()

    return CategoryListResponse(items=categories, total=len(categories))