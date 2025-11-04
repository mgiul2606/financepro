# app/schemas/account.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    initial_balance: float = Field(default=0.0)
    currency: str = Field(default="EUR", max_length=3)

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    initial_balance: Optional[float] = None

class AccountResponse(AccountBase):
    id: int
    user_id: int
    current_balance: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True