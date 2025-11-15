# app/schemas/account.py

from app.schemas.currencyMixin import CurrencyMixin
from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Optional
from decimal import Decimal


class AccountBase(CurrencyMixin):
    """
    Base schema for Account with common fields.
    Used as foundation for Create and Update schemas.
    """
    name: str = Field(
        ..., 
        min_length=1,
        max_length=100,
        description="Account name",
        examples=["Main Checking Account", "Savings", "Credit Card"]
    )
    currency: str = Field(
        default="EUR",
        pattern="^[A-Z]{3}$",
        description="ISO 4217 currency code (3 uppercase letters)",
        examples=["EUR", "USD", "GBP"]
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Main Checking Account",
                "currency": "EUR"
            }
        }
    )


class AccountCreate(AccountBase):
    """
    Schema for creating a new account.
    Requires name and optionally currency and initial balance.
    """
    initial_balance: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        decimal_places=2,
        description="Initial account balance (must be >= 0)",
        examples=[0, 1000.50, 5000]
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Savings Account",
                "initial_balance": 1000.00,
                "currency": "EUR"
            }
        }
    )


class AccountUpdate(CurrencyMixin):
    """
    Schema for updating an existing account.
    All fields are optional (partial update).
    """
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Updated account name"
    )
    initial_balance: Optional[Decimal] = Field(
        None,
        ge=0,
        decimal_places=2,
        description="Updated initial balance"
    )
    currency: Optional[str] = Field(
        None,
        pattern="^[A-Z]{3}$",
        description="Updated currency code"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Updated Account Name",
                "initial_balance": 1500.00
            }
        }
    )


class AccountResponse(AccountBase):
    """
    Complete account schema returned by API endpoints.
    Includes all fields including computed current_balance.
    """
    id: int = Field(..., description="Unique account identifier")
    user_id: int = Field(..., description="Owner user ID")
    initial_balance: Decimal = Field(..., description="Initial balance when account was created")
    current_balance: Decimal = Field(..., description="Current balance (initial + transactions)")
    created_at: datetime = Field(..., description="Account creation timestamp (UTC)")
    updated_at: datetime = Field(..., description="Last update timestamp (UTC)")
    
    model_config = ConfigDict(
        from_attributes=True,  # ✅ Abilita conversione da ORM models
        json_schema_extra={
            "example": {
                "id": 1,
                "user_id": 42,
                "name": "Main Checking Account",
                "initial_balance": 1000.00,
                "current_balance": 1250.50,
                "currency": "EUR",
                "created_at": "2025-01-15T10:30:00Z",
                "updated_at": "2025-01-20T14:22:00Z"
            }
        }
    )


class AccountBalance(BaseModel):
    """
    Schema for account balance endpoint response.
    Returns current balance with metadata.
    """
    account_id: int = Field(..., description="Account ID")
    balance: Decimal = Field(..., description="Current account balance")
    currency: str = Field(..., description="Account currency")
    last_updated: datetime = Field(..., description="Last transaction timestamp")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "account_id": 1,
                "balance": 1250.50,
                "currency": "EUR",
                "last_updated": "2025-01-20T14:22:00Z"
            }
        }
    )


class AccountList(BaseModel):
    """
    Schema for list accounts response (future: with pagination).
    """
    accounts: list[AccountResponse]
    total: int = Field(..., description="Total number of accounts")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "accounts": [
                    {
                        "id": 1,
                        "user_id": 42,
                        "name": "Main Checking",
                        "initial_balance": 1000.00,
                        "current_balance": 1250.50,
                        "currency": "EUR",
                        "created_at": "2025-01-15T10:30:00Z",
                        "updated_at": "2025-01-20T14:22:00Z"
                    }
                ],
                "total": 1
            }
        }
    )