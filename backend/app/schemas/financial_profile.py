# app/schemas/financial_profile.py

from backend.app.schemas.base import CamelCaseModel
from pydantic import Field, ConfigDict, computed_field
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from app.models import ProfileType, DatabaseType


class FinancialProfileBase(CamelCaseModel):
    """
    Base schema for FinancialProfile with common fields.
    Used as foundation for Create and Update schemas.
    """
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Financial profile name",
        examples=["Personal Finance", "Family Budget", "Business Expenses"]
    )
    description: Optional[str] = Field(
        None,
        description="Optional description of the financial profile"
    )
    profile_type: ProfileType = Field(
        default=ProfileType.PERSONAL,
        description="Type of financial profile (personal, family, business)"
    )
    default_currency: str = Field(
        default="EUR",
        pattern="^[A-Z]{3}$",
        description="ISO 4217 currency code (3 uppercase letters)",
        examples=["EUR", "USD", "GBP"]
    )


class FinancialProfileCreate(FinancialProfileBase):
    """
    Schema for creating a new financial profile.
    Optionally includes database connection settings for distributed storage.
    """
    database_connection_string: Optional[str] = Field(
        None,
        description="Connection string for distributed database (will be encrypted)"
    )
    database_type: Optional[DatabaseType] = Field(
        None,
        description="Type of database for distributed storage (PostgreSQL, MSSQL)"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Personal Finance",
                "description": "My personal financial tracking",
                "profile_type": "personal",
                "default_currency": "EUR",
                "database_connection_string": None,
                "database_type": None
            }
        }
    )


class FinancialProfileUpdate(CamelCaseModel):
    """
    Schema for updating an existing financial profile.
    All fields are optional (partial update).
    """
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Updated profile name"
    )
    description: Optional[str] = Field(
        None,
        description="Updated description"
    )
    profile_type: Optional[ProfileType] = Field(
        None,
        description="Updated profile type"
    )
    default_currency: Optional[str] = Field(
        None,
        pattern="^[A-Z]{3}$",
        description="Updated default currency"
    )
    database_connection_string: Optional[str] = Field(
        None,
        description="Updated database connection string"
    )
    database_type: Optional[DatabaseType] = Field(
        None,
        description="Updated database type"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Whether the profile is active"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Updated Profile Name",
                "default_currency": "USD"
            }
        }
    )


class FinancialProfileResponse(FinancialProfileBase):
    """
    Complete financial profile schema returned by API endpoints.
    Includes all fields including computed is_available field.
    """
    id: UUID = Field(..., description="Unique financial profile identifier")
    user_id: UUID = Field(..., description="Owner user ID")
    database_connection_string: Optional[str] = Field(
        None,
        description="Database connection string (encrypted)"
    )
    database_type: Optional[DatabaseType] = Field(
        None,
        description="Database type for distributed storage"
    )
    is_active: bool = Field(..., description="Whether the profile is currently active")
    created_at: datetime = Field(..., description="Profile creation timestamp (UTC)")
    updated_at: datetime = Field(..., description="Last update timestamp (UTC)")

    @computed_field
    @property
    def is_available(self) -> bool:
        """
        Check if the profile's database is currently available.
        Profiles without custom database are always available.
        """
        if not self.database_connection_string:
            return True
        # TODO: Implement actual database connectivity check
        return True

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "550e8400-e29b-41d4-a716-446655440001",
                "name": "Personal Finance",
                "description": "My personal financial tracking",
                "profile_type": "personal",
                "default_currency": "EUR",
                "database_connection_string": None,
                "database_type": None,
                "is_active": True,
                "created_at": "2025-01-15T10:30:00Z",
                "updated_at": "2025-01-20T14:22:00Z",
                "is_available": True
            }
        }
    )


class FinancialProfileListResponse(CamelCaseModel):
    """
    Schema for list financial profiles response with pagination support.
    """
    profiles: list[FinancialProfileResponse] = Field(
        ...,
        description="List of financial profiles"
    )
    total: int = Field(..., description="Total number of profiles")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "profiles": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "user_id": "550e8400-e29b-41d4-a716-446655440001",
                        "name": "Personal Finance",
                        "description": "My personal financial tracking",
                        "profile_type": "personal",
                        "default_currency": "EUR",
                        "database_connection_string": None,
                        "database_type": None,
                        "is_active": True,
                        "created_at": "2025-01-15T10:30:00Z",
                        "updated_at": "2025-01-20T14:22:00Z",
                        "is_available": True
                    }
                ],
                "total": 1
            }
        }
    )


class ProfileSelectionUpdate(CamelCaseModel):
    """
    Schema for updating user's active profile selection.
    """
    active_profile_ids: List[UUID] = Field(
        ...,
        description="List of profile IDs currently selected for multi-profile operations",
        min_length=0
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "active_profile_ids": [
                    "550e8400-e29b-41d4-a716-446655440000",
                    "550e8400-e29b-41d4-a716-446655440001"
                ]
            }
        }
    )


class ProfileSelectionResponse(CamelCaseModel):
    """
    Schema for profile selection response.
    """
    id: UUID = Field(..., description="Selection record ID")
    user_id: UUID = Field(..., description="User ID")
    active_profile_ids: List[UUID] = Field(
        ...,
        description="List of active profile IDs"
    )
    created_at: datetime = Field(..., description="Selection creation timestamp (UTC)")
    updated_at: datetime = Field(..., description="Last update timestamp (UTC)")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440002",
                "user_id": "550e8400-e29b-41d4-a716-446655440003",
                "active_profile_ids": [
                    "550e8400-e29b-41d4-a716-446655440000",
                    "550e8400-e29b-41d4-a716-446655440001"
                ],
                "created_at": "2025-01-15T10:30:00Z",
                "updated_at": "2025-01-20T14:22:00Z"
            }
        }
    )


class MainProfileUpdate(CamelCaseModel):
    """
    Schema for setting user's main profile.
    """
    main_profile_id: UUID = Field(
        ...,
        description="Profile ID to set as main profile"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "main_profile_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }
    )


class MainProfileResponse(CamelCaseModel):
    """
    Schema for main profile response.
    """
    user_id: UUID = Field(..., description="User ID")
    main_profile_id: Optional[UUID] = Field(None, description="Main profile ID")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440003",
                "main_profile_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }
    )
