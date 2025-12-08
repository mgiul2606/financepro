# app/schemas/category.py

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from uuid import UUID


class CategoryBase(BaseModel):
    """
    Base schema for Category with common fields.
    Used as foundation for Create and Update schemas.

    Categories are USER-level (shared across all user's profiles)
    and single-level (no hierarchy).
    """
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Category name",
        examples=["Groceries", "Utilities", "Entertainment", "Salary", "Freelance"]
    )
    description: Optional[str] = Field(
        None,
        description="Optional description of the category"
    )
    icon: Optional[str] = Field(
        None,
        max_length=50,
        description="Icon identifier (emoji or icon name)",
        examples=["🛒", "💡", "🎬", "💰"]
    )
    color: Optional[str] = Field(
        None,
        pattern="^#[0-9A-Fa-f]{6}$",
        description="Hex color code for UI display",
        examples=["#FF5733", "#3498DB", "#2ECC71"]
    )
    is_income: bool = Field(
        default=False,
        description="True for income categories (salary, invoices), False for expense categories"
    )
    sort_order: int = Field(
        default=0,
        description="Custom sort order for category display"
    )


class CategoryCreate(CategoryBase):
    """
    Schema for creating a new category.
    Categories are USER-level and shared across all user's profiles.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Groceries",
                "description": "Food and household items",
                "icon": "🛒",
                "color": "#FF5733",
                "is_income": False,
                "sort_order": 0
            }
        }
    )


class CategoryUpdate(BaseModel):
    """
    Schema for updating an existing category.
    All fields are optional (partial update).
    """
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Updated category name"
    )
    description: Optional[str] = Field(
        None,
        description="Updated description"
    )
    icon: Optional[str] = Field(
        None,
        max_length=50,
        description="Updated icon"
    )
    color: Optional[str] = Field(
        None,
        pattern="^#[0-9A-Fa-f]{6}$",
        description="Updated color"
    )
    is_income: Optional[bool] = Field(
        None,
        description="Whether the category is for income"
    )
    sort_order: Optional[int] = Field(
        None,
        description="Updated sort order"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Whether the category is active"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Updated Category Name",
                "color": "#3498DB",
                "is_active": True
            }
        }
    )


class CategoryResponse(CategoryBase):
    """
    Complete category schema returned by API endpoints.
    Categories are USER-level (shared across all user's profiles).
    """
    id: UUID = Field(..., description="Unique category identifier")
    user_id: UUID = Field(
        ...,
        description="ID of the user this category belongs to"
    )
    is_system: bool = Field(
        default=False,
        description="System categories cannot be deleted by users"
    )
    is_active: bool = Field(
        default=True,
        description="Whether the category is currently active"
    )
    created_at: datetime = Field(..., description="Category creation timestamp (UTC)")
    updated_at: datetime = Field(..., description="Last update timestamp (UTC)")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440020",
                "user_id": "550e8400-e29b-41d4-a716-446655440001",
                "name": "Groceries",
                "description": "Food and household items",
                "icon": "🛒",
                "color": "#FF5733",
                "is_income": False,
                "sort_order": 0,
                "is_system": False,
                "is_active": True,
                "created_at": "2025-01-15T10:30:00Z",
                "updated_at": "2025-01-15T10:30:00Z"
            }
        }
    )


class CategoryListResponse(BaseModel):
    """
    Schema for list categories response with pagination support.
    """
    items: list[CategoryResponse] = Field(
        ...,
        description="List of categories"
    )
    total: int = Field(..., description="Total number of categories")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440020",
                        "user_id": "550e8400-e29b-41d4-a716-446655440001",
                        "name": "Groceries",
                        "description": "Food and household items",
                        "icon": "🛒",
                        "color": "#FF5733",
                        "is_income": False,
                        "sort_order": 0,
                        "is_system": False,
                        "is_active": True,
                        "created_at": "2025-01-15T10:30:00Z",
                        "updated_at": "2025-01-15T10:30:00Z"
                    }
                ],
                "total": 1
            }
        }
    )
