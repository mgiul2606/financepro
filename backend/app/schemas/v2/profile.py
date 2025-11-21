# app/schemas/v2/profile.py
"""Financial Profile Pydantic schemas for FinancePro v2.1"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.enums import ProfileType, SecurityLevel


class ProfileBase(BaseModel):
    """Base schema for profile data"""
    name: str = Field(..., min_length=1, max_length=255)
    profile_type: ProfileType = ProfileType.PERSONAL
    default_currency: str = Field("EUR", min_length=3, max_length=3)
    description: Optional[str] = None
    color_code: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = None


class ProfileCreate(ProfileBase):
    """Schema for creating a profile"""
    security_level: SecurityLevel = SecurityLevel.STANDARD
    is_default: bool = False
    # Password required for HS profiles (to generate encryption salt)
    user_password: Optional[str] = Field(None, exclude=True)

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    """Schema for updating a profile"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    profile_type: Optional[ProfileType] = None
    default_currency: Optional[str] = Field(None, min_length=3, max_length=3)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    color_code: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProfileResponse(BaseModel):
    """Schema for profile response"""
    id: UUID
    user_id: UUID
    name: str
    profile_type: ProfileType
    security_level: SecurityLevel
    default_currency: str
    description: Optional[str] = None
    is_active: bool
    is_default: bool
    color_code: Optional[str] = None
    icon: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Computed fields
    is_high_security: bool
    account_count: int = 0
    total_balance: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_stats(cls, profile, account_count: int = 0, total_balance: float = None):
        """Create response with account statistics"""
        return cls(
            id=profile.id,
            user_id=profile.user_id,
            name=profile.name,
            profile_type=profile.profile_type,
            security_level=profile.security_level,
            default_currency=profile.default_currency,
            description=profile.description,
            is_active=profile.is_active,
            is_default=profile.is_default,
            color_code=profile.color_code,
            icon=profile.icon,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
            is_high_security=profile.is_high_security,
            account_count=account_count,
            total_balance=total_balance
        )
