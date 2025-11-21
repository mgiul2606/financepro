# app/schemas/v2/transaction.py
"""Transaction Pydantic schemas for FinancePro v2.1"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from app.models.enums import TransactionType, TransactionSource


class TransactionBase(BaseModel):
    """Base schema for transaction data"""
    transaction_date: date
    transaction_type: TransactionType
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    currency: str = Field(..., min_length=3, max_length=3)
    description: Optional[str] = None
    merchant_name: Optional[str] = None
    notes: Optional[str] = None
    category_id: Optional[UUID] = None
    is_reconciled: bool = False


class TransactionCreate(TransactionBase):
    """Schema for creating a transaction"""
    account_id: UUID
    financial_profile_id: UUID
    tag_ids: Optional[List[UUID]] = None
    exchange_rate: Optional[Decimal] = None
    related_transaction_id: Optional[UUID] = None
    receipt_url: Optional[str] = None
    external_id: Optional[str] = None
    metadata: Optional[dict] = None
    # Password required for HS profiles
    user_password: Optional[str] = Field(None, exclude=True)

    model_config = ConfigDict(from_attributes=True)


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction"""
    transaction_date: Optional[date] = None
    transaction_type: Optional[TransactionType] = None
    amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    description: Optional[str] = None
    merchant_name: Optional[str] = None
    notes: Optional[str] = None
    category_id: Optional[UUID] = None
    is_reconciled: Optional[bool] = None
    tag_ids: Optional[List[UUID]] = None
    # Password required for HS profiles when updating encrypted fields
    user_password: Optional[str] = Field(None, exclude=True)

    model_config = ConfigDict(from_attributes=True)


class TransactionResponse(BaseModel):
    """Schema for transaction response"""
    id: UUID
    financial_profile_id: UUID
    account_id: UUID
    category_id: Optional[UUID] = None
    merchant_id: Optional[UUID] = None
    transaction_date: date
    transaction_type: TransactionType
    source: TransactionSource
    # Amount is always cleartext in response (decrypted or amount_clear)
    amount: Decimal
    currency: str
    exchange_rate: Optional[Decimal] = None
    amount_in_profile_currency: Decimal
    description: Optional[str] = None
    merchant_name: Optional[str] = None
    notes: Optional[str] = None
    is_reconciled: bool
    is_duplicate: bool
    receipt_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Related IDs
    recurring_transaction_id: Optional[UUID] = None
    related_transaction_id: Optional[UUID] = None
    # Tags as list of IDs
    tag_ids: List[UUID] = []

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_tags(cls, transaction, decrypted_data: Optional[dict] = None):
        """Create response from ORM object with tags"""
        data = {
            "id": transaction.id,
            "financial_profile_id": transaction.financial_profile_id,
            "account_id": transaction.account_id,
            "category_id": transaction.category_id,
            "merchant_id": transaction.merchant_id,
            "transaction_date": transaction.transaction_date,
            "transaction_type": transaction.transaction_type,
            "source": transaction.source,
            "amount": decrypted_data.get('amount') if decrypted_data else transaction.amount_clear,
            "currency": transaction.currency,
            "exchange_rate": transaction.exchange_rate,
            "amount_in_profile_currency": transaction.amount_in_profile_currency,
            "description": decrypted_data.get('description') if decrypted_data else transaction.description_clear,
            "merchant_name": transaction.merchant_name,
            "notes": decrypted_data.get('notes') if decrypted_data else None,
            "is_reconciled": transaction.is_reconciled,
            "is_duplicate": transaction.is_duplicate,
            "receipt_url": transaction.receipt_url,
            "created_at": transaction.created_at,
            "updated_at": transaction.updated_at,
            "recurring_transaction_id": transaction.recurring_transaction_id,
            "related_transaction_id": transaction.related_transaction_id,
            "tag_ids": [t.id for t in transaction.tags] if transaction.tags else []
        }
        return cls(**data)


class TransactionListResponse(BaseModel):
    """Schema for paginated transaction list"""
    items: List[TransactionResponse]
    total: int
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)
