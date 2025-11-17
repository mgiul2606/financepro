# app/schemas/account.py

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from uuid import UUID
from decimal import Decimal
from app.models import AccountType


class AccountBase(BaseModel):
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
    account_type: AccountType = Field(
        default=AccountType.CHECKING,
        description="Type of account (checking, savings, credit_card, etc.)"
    )
    currency: str = Field(
        default="EUR",
        pattern="^[A-Z]{3}$",
        description="ISO 4217 currency code (3 uppercase letters)",
        examples=["EUR", "USD", "GBP"]
    )
    institution_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Name of the financial institution"
    )
    notes: Optional[str] = Field(
        None,
        description="Additional notes about the account"
    )


class AccountCreate(AccountBase):
    """
    Schema for creating a new account.
    financial_profile_id is optional - if not provided, the user's default profile will be used.
    """
    financial_profile_id: Optional[UUID] = Field(
        None,
        description="ID of the financial profile this account belongs to (optional, defaults to user's default profile)"
    )
    initial_balance: Decimal = Field(
        default=Decimal("0.00"),
        decimal_places=2,
        description="Initial account balance",
        examples=[0, 1000.50, 5000]
    )
    account_number: Optional[str] = Field(
        None,
        max_length=255,
        description="Account number (will be encrypted in production)"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "financial_profile_id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Savings Account",
                "account_type": "savings",
                "initial_balance": 1000.00,
                "currency": "EUR",
                "institution_name": "My Bank",
                "notes": "Primary savings account"
            }
        }
    )


class AccountUpdate(BaseModel):
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
    account_type: Optional[AccountType] = Field(
        None,
        description="Updated account type"
    )
    currency: Optional[str] = Field(
        None,
        pattern="^[A-Z]{3}$",
        description="Updated currency code"
    )
    institution_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Updated institution name"
    )
    account_number: Optional[str] = Field(
        None,
        max_length=255,
        description="Updated account number"
    )
    notes: Optional[str] = Field(
        None,
        description="Updated notes"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Whether the account is active"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Updated Account Name",
                "institution_name": "New Bank"
            }
        }
    )


class AccountResponse(AccountBase):
    """
    Complete account schema returned by API endpoints.
    Includes all fields including computed current_balance.
    """
    id: UUID = Field(..., description="Unique account identifier")
    financial_profile_id: UUID = Field(
        ...,
        description="ID of the financial profile this account belongs to"
    )
    initial_balance: Decimal = Field(..., description="Initial balance when account was created")
    current_balance: Decimal = Field(..., description="Current balance (initial + transactions)")
    account_number: Optional[str] = Field(
        None,
        description="Account number (encrypted)"
    )
    is_active: bool = Field(
        default=True,
        description="Whether the account is currently active"
    )
    created_at: datetime = Field(..., description="Account creation timestamp (UTC)")
    updated_at: datetime = Field(..., description="Last update timestamp (UTC)")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440050",
                "financial_profile_id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Main Checking Account",
                "account_type": "checking",
                "currency": "EUR",
                "initial_balance": 1000.00,
                "current_balance": 1250.50,
                "institution_name": "My Bank",
                "account_number": None,
                "notes": "Primary checking account",
                "is_active": True,
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
    account_id: UUID = Field(..., description="Account ID")
    balance: Decimal = Field(..., description="Current account balance")
    currency: str = Field(..., description="Account currency")
    last_updated: datetime = Field(..., description="Last transaction timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "account_id": "550e8400-e29b-41d4-a716-446655440050",
                "balance": 1250.50,
                "currency": "EUR",
                "last_updated": "2025-01-20T14:22:00Z"
            }
        }
    )


class AccountList(BaseModel):
    """
    Schema for list accounts response with pagination.
    """
    accounts: list[AccountResponse] = Field(
        ...,
        description="List of accounts"
    )
    total: int = Field(..., description="Total number of accounts")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "accounts": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440050",
                        "financial_profile_id": "550e8400-e29b-41d4-a716-446655440000",
                        "name": "Main Checking",
                        "account_type": "checking",
                        "currency": "EUR",
                        "initial_balance": 1000.00,
                        "current_balance": 1250.50,
                        "institution_name": "My Bank",
                        "account_number": None,
                        "notes": None,
                        "is_active": True,
                        "created_at": "2025-01-15T10:30:00Z",
                        "updated_at": "2025-01-20T14:22:00Z"
                    }
                ],
                "total": 1
            }
        }
    )