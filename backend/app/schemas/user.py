# app/schemas/user.py
from backend.app.schemas.base import CamelCaseModel
from pydantic import EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class UserBase(CamelCaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(CamelCaseModel):
    """Schema for updating user information"""
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: UUID
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True