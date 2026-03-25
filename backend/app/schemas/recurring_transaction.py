# app/schemas/recurring_transaction.py
"""
Pydantic schemas for Recurring Transactions.
Source of truth for OpenAPI spec and Orval-generated frontend types.
"""
from app.schemas.base import CamelCaseModel
from pydantic import Field, ConfigDict
from datetime import datetime, date
from typing import Optional
from uuid import UUID
from decimal import Decimal
from app.models.enums import Frequency, AmountModel, TransactionType, OccurrenceStatus


class RecurringTransactionCreate(CamelCaseModel):
    """Schema for creating a new recurring transaction."""
    financial_profile_id: UUID = Field(..., description="Profile ID")
    account_id: UUID = Field(..., description="Account ID")
    category_id: Optional[UUID] = Field(None, description="Default category ID")
    name: str = Field(..., min_length=1, max_length=255, description="Name")
    description: Optional[str] = Field(None, description="Description")
    transaction_type: TransactionType = Field(..., description="Transaction type")
    amount_model: AmountModel = Field(default=AmountModel.FIXED, description="Amount model")
    base_amount: Decimal = Field(..., gt=0, decimal_places=2, description="Base amount")
    amount_min: Optional[Decimal] = Field(None, decimal_places=2, description="Min amount (variable model)")
    amount_max: Optional[Decimal] = Field(None, decimal_places=2, description="Max amount (variable model)")
    formula: Optional[str] = Field(None, description="Formula (formula model)")
    currency: str = Field(..., pattern="^[A-Z]{3}$", description="ISO 4217 currency code")
    frequency: Frequency = Field(..., description="Recurrence frequency")
    interval: int = Field(default=1, ge=1, description="Frequency multiplier")
    start_date: date = Field(..., description="Start date")
    end_date: Optional[date] = Field(None, description="End date (null = indefinite)")
    auto_create: bool = Field(default=False, description="Auto-create transactions")
    notification_days_before: int = Field(default=3, ge=0, description="Notification days before")
    is_active: bool = Field(default=True, description="Active status")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "financial_profile_id": "550e8400-e29b-41d4-a716-446655440001",
                "account_id": "550e8400-e29b-41d4-a716-446655440002",
                "name": "Monthly Rent",
                "transaction_type": "purchase",
                "base_amount": 1200.00,
                "currency": "EUR",
                "frequency": "monthly",
                "start_date": "2026-01-01"
            }
        }
    )


class RecurringTransactionUpdate(CamelCaseModel):
    """Schema for updating a recurring transaction. All fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None)
    account_id: Optional[UUID] = Field(None)
    category_id: Optional[UUID] = Field(None)
    transaction_type: Optional[TransactionType] = Field(None)
    amount_model: Optional[AmountModel] = Field(None)
    base_amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    amount_min: Optional[Decimal] = Field(None, decimal_places=2)
    amount_max: Optional[Decimal] = Field(None, decimal_places=2)
    formula: Optional[str] = Field(None)
    currency: Optional[str] = Field(None, pattern="^[A-Z]{3}$")
    frequency: Optional[Frequency] = Field(None)
    interval: Optional[int] = Field(None, ge=1)
    start_date: Optional[date] = Field(None)
    end_date: Optional[date] = Field(None)
    auto_create: Optional[bool] = Field(None)
    notification_days_before: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = Field(None)


class RecurringTransactionResponse(CamelCaseModel):
    """Complete recurring transaction response."""
    id: UUID
    financial_profile_id: UUID
    account_id: UUID
    category_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    transaction_type: TransactionType
    amount_model: AmountModel
    base_amount: Decimal
    amount_min: Optional[Decimal] = None
    amount_max: Optional[Decimal] = None
    formula: Optional[str] = None
    currency: str
    frequency: Frequency
    interval: int
    start_date: date
    end_date: Optional[date] = None
    next_occurrence_date: Optional[date] = None
    auto_create: bool
    notification_days_before: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecurringTransactionListResponse(CamelCaseModel):
    """List response with pagination."""
    items: list[RecurringTransactionResponse]
    total: int
