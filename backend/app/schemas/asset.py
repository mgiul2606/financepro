# app/schemas/asset.py

from app.schemas.base import CamelCaseModel
from pydantic import Field, ConfigDict
from datetime import datetime, date
from typing import Optional
from uuid import UUID
from decimal import Decimal
from app.models.enums import AssetType, ValuationMethod


class AssetCreate(CamelCaseModel):
    """Schema for creating a new asset."""
    financial_profile_id: UUID = Field(
        ...,
        description="ID of the financial profile this asset belongs to"
    )
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Asset name"
    )
    asset_type: AssetType = Field(
        ...,
        description="Type of asset"
    )
    purchase_date: Optional[date] = Field(
        None,
        description="Date when the asset was purchased"
    )
    purchase_price: Optional[Decimal] = Field(
        None,
        decimal_places=2,
        description="Original purchase price"
    )
    current_value: Decimal = Field(
        ...,
        decimal_places=2,
        description="Current estimated value"
    )
    current_value_min: Optional[Decimal] = Field(
        None,
        decimal_places=2,
        description="Minimum estimated value (for range valuation)"
    )
    current_value_max: Optional[Decimal] = Field(
        None,
        decimal_places=2,
        description="Maximum estimated value (for range valuation)"
    )
    valuation_method: ValuationMethod = Field(
        default=ValuationMethod.MANUAL,
        description="Method used for valuation"
    )
    currency: str = Field(
        ...,
        pattern="^[A-Z]{3}$",
        description="ISO 4217 currency code"
    )
    is_liquid: bool = Field(
        default=False,
        description="Whether this asset is easily liquidated"
    )
    quantity: Optional[Decimal] = Field(
        None,
        description="Quantity (for fractional assets like stocks, crypto)"
    )
    ticker_symbol: Optional[str] = Field(
        None,
        max_length=20,
        description="Ticker symbol for quoted assets"
    )
    notes: Optional[str] = Field(
        None,
        description="Additional notes about the asset"
    )


class AssetUpdate(CamelCaseModel):
    """Schema for updating an existing asset. All fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    asset_type: Optional[AssetType] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[Decimal] = Field(None, decimal_places=2)
    current_value: Optional[Decimal] = Field(None, decimal_places=2)
    current_value_min: Optional[Decimal] = Field(None, decimal_places=2)
    current_value_max: Optional[Decimal] = Field(None, decimal_places=2)
    valuation_method: Optional[ValuationMethod] = None
    currency: Optional[str] = Field(None, pattern="^[A-Z]{3}$")
    is_liquid: Optional[bool] = None
    quantity: Optional[Decimal] = None
    ticker_symbol: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None


class AssetResponse(CamelCaseModel):
    """Complete asset schema returned by API endpoints."""
    id: UUID
    financial_profile_id: UUID
    name: str
    asset_type: AssetType
    purchase_date: Optional[date] = None
    purchase_price: Optional[Decimal] = None
    current_value: Decimal
    current_value_min: Optional[Decimal] = None
    current_value_max: Optional[Decimal] = None
    valuation_method: ValuationMethod
    last_valuation_date: Optional[date] = None
    currency: str
    is_liquid: bool
    quantity: Optional[Decimal] = None
    ticker_symbol: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssetListResponse(CamelCaseModel):
    """Schema for list assets response."""
    items: list[AssetResponse] = Field(..., description="List of assets")
    total: int = Field(..., description="Total number of assets")
