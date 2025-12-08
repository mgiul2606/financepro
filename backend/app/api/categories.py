# app/api/categories.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Annotated, Optional
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryResponse, CategoryListResponse, CategoryCreate, CategoryUpdate
from app.api.dependencies import get_current_user

router = APIRouter()


@router.get(
    "/",
    response_model=CategoryListResponse,
    summary="List categories",
    description="Retrieve all categories for the current user (USER-level, shared across all profiles)"
)
async def list_categories(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    is_active: Optional[bool] = Query(None, description="Filter by active status (None = all, True = active only, False = inactive only)"),
    is_income: Optional[bool] = Query(None, description="Filter by category type (None = all, True = income, False = expense)"),
) -> CategoryListResponse:
    """
    List all categories for the current user.

    Categories are USER-level entities, shared across all user's profiles.

    Args:
        is_active: Optional filter by active status
        is_income: Optional filter by category type (income vs expense)

    Returns:
        CategoryListResponse with categories and total count
    """
    # Build query - filter by user_id (categories are USER-level)
    query = db.query(Category).filter(
        Category.user_id == current_user.id
    )

    # Apply optional filters
    if is_active is not None:
        query = query.filter(Category.is_active == is_active)

    if is_income is not None:
        query = query.filter(Category.is_income == is_income)

    # Order by sort_order, then by name
    categories = query.order_by(Category.sort_order, Category.name).all()

    return CategoryListResponse(items=categories, total=len(categories))


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create category",
    description="Create a new category for the current user"
)
async def create_category(
    category_data: CategoryCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> CategoryResponse:
    """
    Create a new category for the current user.

    Categories are USER-level entities, shared across all user's profiles.
    """
    # Create new category
    new_category = Category(
        user_id=current_user.id,
        name=category_data.name,
        description=category_data.description,
        icon=category_data.icon,
        color=category_data.color,
        is_income=category_data.is_income,
        sort_order=category_data.sort_order,
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Get category",
    description="Get a specific category by ID"
)
async def get_category(
    category_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> CategoryResponse:
    """
    Get a specific category by ID.

    Only the category owner can access it.
    """
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found"
        )

    return category


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Update category",
    description="Update an existing category"
)
async def update_category(
    category_id: UUID,
    category_data: CategoryUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> CategoryResponse:
    """
    Update an existing category.

    Only the category owner can update it.
    System categories cannot be deleted but can be updated.
    """
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found"
        )

    # Update fields
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)

    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete category",
    description="Delete a category"
)
async def delete_category(
    category_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Delete a category.

    Only the category owner can delete it.
    System categories cannot be deleted.
    """
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found"
        )

    if category.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System categories cannot be deleted"
        )

    db.delete(category)
    db.commit()

    return None