# app/schemas/transaction.py

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date
from typing import Optional
from uuid import UUID
from decimal import Decimal
from app.models import TransactionType, TransactionSource


class TransactionBase(BaseModel):
    """
    Base schema for Transaction with common fields.
    Used as foundation for Create and Update schemas.
    """
    account_id: UUID = Field(
        ...,
        description="ID of the account this transaction belongs to"
    )
    category_id: Optional[UUID] = Field(
        None,
        description="ID of the category this transaction is assigned to"
    )
    transaction_type: TransactionType = Field(
        ...,
        description="Type of transaction (bank_transfer, withdrawal, payment, etc.)"
    )
    amount: Decimal = Field(
        ...,
        gt=0,
        decimal_places=2,
        description="Transaction amount (must be positive)",
        examples=[50.00, 1250.75, 99.99]
    )
    currency: str = Field(
        ...,
        pattern="^[A-Z]{3}$",
        description="ISO 4217 currency code (3 uppercase letters)",
        examples=["EUR", "USD", "GBP"]
    )
    description: str = Field(
        ...,
        min_length=1,
        description="Transaction description",
        examples=["Grocery shopping", "Monthly rent", "Salary deposit"]
    )
    merchant_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Name of the merchant/vendor"
    )
    transaction_date: date = Field(
        ...,
        description="Date when the transaction occurred"
    )
    notes: Optional[str] = Field(
        None,
        description="Additional notes about the transaction"
    )


class TransactionCreate(TransactionBase):
    """
    Schema for creating a new transaction.
    Includes optional fields for advanced features.
    """
    value_date: Optional[date] = Field(
        None,
        description="Date when transaction was valued (for banking)"
    )
    location: Optional[str] = Field(
        None,
        max_length=255,
        description="Transaction location"
    )
    receipt_url: Optional[str] = Field(
        None,
        max_length=500,
        description="URL to receipt or document"
    )
    created_by: TransactionSource = Field(
        default=TransactionSource.MANUAL,
        description="Source of transaction creation"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "account_id": "550e8400-e29b-41d4-a716-446655440000",
                "category_id": "550e8400-e29b-41d4-a716-446655440002",
                "transaction_type": "purchase",
                "amount": 85.50,
                "currency": "EUR",
                "description": "Grocery shopping at Supermarket",
                "merchant_name": "Local Supermarket",
                "transaction_date": "2025-01-15",
                "notes": "Weekly groceries",
                "created_by": "manual"
            }
        }
    )


class TransactionUpdate(BaseModel):
    """
    Schema for updating an existing transaction.
    All fields are optional (partial update).
    """
    category_id: Optional[UUID] = Field(
        None,
        description="Updated category ID"
    )
    transaction_type: Optional[TransactionType] = Field(
        None,
        description="Updated transaction type"
    )
    amount: Optional[Decimal] = Field(
        None,
        gt=0,
        decimal_places=2,
        description="Updated amount"
    )
    currency: Optional[str] = Field(
        None,
        pattern="^[A-Z]{3}$",
        description="Updated currency code"
    )
    description: Optional[str] = Field(
        None,
        min_length=1,
        description="Updated description"
    )
    merchant_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Updated merchant name"
    )
    transaction_date: Optional[date] = Field(
        None,
        description="Updated transaction date"
    )
    value_date: Optional[date] = Field(
        None,
        description="Updated value date"
    )
    notes: Optional[str] = Field(
        None,
        description="Updated notes"
    )
    is_reconciled: Optional[bool] = Field(
        None,
        description="Whether transaction has been reconciled"
    )
    location: Optional[str] = Field(
        None,
        max_length=255,
        description="Updated location"
    )
    receipt_url: Optional[str] = Field(
        None,
        max_length=500,
        description="Updated receipt URL"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category_id": "550e8400-e29b-41d4-a716-446655440003",
                "notes": "Updated notes"
            }
        }
    )


class TransactionResponse(TransactionBase):
    """
    Complete transaction schema returned by API endpoints.
    Includes all fields including computed and metadata fields.
    """
    id: UUID = Field(..., description="Unique transaction identifier")
    recurring_transaction_id: Optional[UUID] = Field(
        None,
        description="ID of parent recurring transaction (if applicable)"
    )
    exchange_rate_id: Optional[UUID] = Field(
        None,
        description="ID of exchange rate used for conversion"
    )
    amount_in_profile_currency: Optional[Decimal] = Field(
        None,
        description="Amount converted to profile's default currency"
    )
    merchant_normalized: Optional[str] = Field(
        None,
        description="ML-normalized merchant name for better categorization"
    )
    value_date: Optional[date] = Field(
        None,
        description="Date when transaction was valued"
    )
    is_reconciled: bool = Field(
        default=False,
        description="Whether transaction has been reconciled"
    )
    location: Optional[str] = Field(
        None,
        description="Transaction location"
    )
    receipt_url: Optional[str] = Field(
        None,
        description="URL to receipt or document"
    )
    created_by: TransactionSource = Field(
        ...,
        description="Source of transaction creation"
    )
    created_at: datetime = Field(..., description="Transaction creation timestamp (UTC)")
    updated_at: datetime = Field(..., description="Last update timestamp (UTC)")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440010",
                "account_id": "550e8400-e29b-41d4-a716-446655440000",
                "category_id": "550e8400-e29b-41d4-a716-446655440002",
                "recurring_transaction_id": None,
                "transaction_type": "purchase",
                "amount": 85.50,
                "currency": "EUR",
                "exchange_rate_id": None,
                "amount_in_profile_currency": 85.50,
                "description": "Grocery shopping at Supermarket",
                "merchant_name": "Local Supermarket",
                "merchant_normalized": "local_supermarket",
                "transaction_date": "2025-01-15",
                "value_date": None,
                "notes": "Weekly groceries",
                "is_reconciled": False,
                "location": None,
                "receipt_url": None,
                "created_by": "manual",
                "created_at": "2025-01-15T10:30:00Z",
                "updated_at": "2025-01-15T10:30:00Z"
            }
        }
    )


class TransactionListResponse(BaseModel):
    """
    Schema for list transactions response with pagination support.
    """
    items: list[TransactionResponse] = Field(
        ...,
        description="List of transactions"
    )
    total: int = Field(..., description="Total number of transactions")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440010",
                        "account_id": "550e8400-e29b-41d4-a716-446655440000",
                        "category_id": "550e8400-e29b-41d4-a716-446655440002",
                        "recurring_transaction_id": None,
                        "transaction_type": "purchase",
                        "amount": 85.50,
                        "currency": "EUR",
                        "exchange_rate_id": None,
                        "amount_in_profile_currency": 85.50,
                        "description": "Grocery shopping",
                        "merchant_name": "Local Supermarket",
                        "merchant_normalized": "local_supermarket",
                        "transaction_date": "2025-01-15",
                        "value_date": None,
                        "notes": "Weekly groceries",
                        "is_reconciled": False,
                        "location": None,
                        "receipt_url": None,
                        "created_by": "manual",
                        "created_at": "2025-01-15T10:30:00Z",
                        "updated_at": "2025-01-15T10:30:00Z"
                    }
                ],
                "total": 1
            }
        }
    )
