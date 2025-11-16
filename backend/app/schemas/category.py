# app/schemas/category.py

from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Optional
from uuid import UUID


class CategoryBase(BaseModel):
    """
    Base schema for Category with common fields.
    Used as foundation for Create and Update schemas.
    """
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Category name",
        examples=["Groceries", "Utilities", "Entertainment"]
    )
    description: Optional[str] = Field(
        None,
        description="Optional description of the category"
    )
    icon: Optional[str] = Field(
        None,
        max_length=50,
        description="Icon identifier (emoji or icon name)",
        examples=["🛒", "💡", "🎬"]
    )
    color: Optional[str] = Field(
        None,
        pattern="^#[0-9A-Fa-f]{6}$",
        description="Hex color code for UI display",
        examples=["#FF5733", "#3498DB", "#2ECC71"]
    )
    parent_category_id: Optional[UUID] = Field(
        None,
        description="ID of parent category (null for root categories)"
    )
    level: int = Field(
        ...,
        ge=1,
        le=3,
        description="Hierarchy level (1, 2, or 3)"
    )

    @field_validator('level')
    @classmethod
    def validate_level(cls, v: int) -> int:
        """Ensure level is between 1 and 3"""
        if v < 1 or v > 3:
            raise ValueError('Level must be between 1 and 3')
        return v


class CategoryCreate(CategoryBase):
    """
    Schema for creating a new category.
    Requires financial_profile_id to associate with a profile.
    """
    financial_profile_id: UUID = Field(
        ...,
        description="ID of the financial profile this category belongs to"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "financial_profile_id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Groceries",
                "description": "Food and household items",
                "icon": "🛒",
                "color": "#FF5733",
                "parent_category_id": None,
                "level": 1
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
    parent_category_id: Optional[UUID] = Field(
        None,
        description="Updated parent category ID"
    )
    level: Optional[int] = Field(
        None,
        ge=1,
        le=3,
        description="Updated level"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Whether the category is active"
    )

    @field_validator('level')
    @classmethod
    def validate_level(cls, v: Optional[int]) -> Optional[int]:
        """Ensure level is between 1 and 3 if provided"""
        if v is not None and (v < 1 or v > 3):
            raise ValueError('Level must be between 1 and 3')
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Updated Category Name",
                "color": "#3498DB"
            }
        }
    )


class CategoryResponse(CategoryBase):
    """
    Complete category schema returned by API endpoints.
    Includes all fields and optional subcategories for tree view.
    """
    id: UUID = Field(..., description="Unique category identifier")
    financial_profile_id: UUID = Field(
        ...,
        description="ID of the financial profile this category belongs to"
    )
    full_path: Optional[str] = Field(
        None,
        description="Full hierarchical path (e.g., 'Groceries > Fresh Food > Fruits')"
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
    subcategories: Optional[list["CategoryResponse"]] = Field(
        None,
        description="Child categories (for hierarchical display)"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440020",
                "financial_profile_id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Groceries",
                "description": "Food and household items",
                "icon": "🛒",
                "color": "#FF5733",
                "parent_category_id": None,
                "level": 1,
                "full_path": "Groceries",
                "is_system": False,
                "is_active": True,
                "created_at": "2025-01-15T10:30:00Z",
                "updated_at": "2025-01-15T10:30:00Z",
                "subcategories": []
            }
        }
    )


class CategoryTreeResponse(BaseModel):
    """
    Schema for hierarchical category tree display.
    Includes nested subcategories up to 3 levels.
    """
    id: UUID = Field(..., description="Category identifier")
    name: str = Field(..., description="Category name")
    icon: Optional[str] = Field(None, description="Category icon")
    color: Optional[str] = Field(None, description="Category color")
    level: int = Field(..., description="Hierarchy level")
    full_path: Optional[str] = Field(None, description="Full hierarchical path")
    is_active: bool = Field(..., description="Whether category is active")
    subcategories: list["CategoryTreeResponse"] = Field(
        default_factory=list,
        description="Child categories"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440020",
                "name": "Groceries",
                "icon": "🛒",
                "color": "#FF5733",
                "level": 1,
                "full_path": "Groceries",
                "is_active": True,
                "subcategories": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440021",
                        "name": "Fresh Food",
                        "icon": "🥬",
                        "color": "#2ECC71",
                        "level": 2,
                        "full_path": "Groceries > Fresh Food",
                        "is_active": True,
                        "subcategories": [
                            {
                                "id": "550e8400-e29b-41d4-a716-446655440022",
                                "name": "Fruits",
                                "icon": "🍎",
                                "color": "#E74C3C",
                                "level": 3,
                                "full_path": "Groceries > Fresh Food > Fruits",
                                "is_active": True,
                                "subcategories": []
                            }
                        ]
                    }
                ]
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
                        "financial_profile_id": "550e8400-e29b-41d4-a716-446655440000",
                        "name": "Groceries",
                        "description": "Food and household items",
                        "icon": "🛒",
                        "color": "#FF5733",
                        "parent_category_id": None,
                        "level": 1,
                        "full_path": "Groceries",
                        "is_system": False,
                        "is_active": True,
                        "created_at": "2025-01-15T10:30:00Z",
                        "updated_at": "2025-01-15T10:30:00Z",
                        "subcategories": None
                    }
                ],
                "total": 1
            }
        }
    )
