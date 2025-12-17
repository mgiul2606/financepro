# app/models/asset.py
"""Asset model for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, List, Optional
import uuid

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import AssetType, ValuationMethod

if TYPE_CHECKING:
    from app.models.financial_profile import FinancialProfile
    from app.models.transaction import Transaction


class Asset(Base):
    """
    Physical and financial assets (real estate, vehicles, investments, collectibles).

    PROFILE-level entity (legal ownership).

    Based on FinancePro Database Technical Documentation v2.1

    Valuation Methods:
    - market_quote: Market quotation (stocks, crypto). Auto-updated from API.
    - range: Range valuation (real estate). current_value = midpoint.
    - comparative: Market comparison (vehicles, collectibles).
    - manual: User manual estimate.
    - appraisal: Professional appraisal.

    Attributes:
        id: UUID primary key
        financial_profile_id: Profile owner
        name: Asset name
        asset_type: Type of asset
        purchase_date: Purchase date
        purchase_price: Original purchase price
        purchase_transaction_id: Purchase transaction
        current_value: Current value (best estimate)
        current_value_min: Minimum estimated value
        current_value_max: Maximum estimated value
        valuation_method: Method used for valuation
        last_valuation_date: Last valuation date
        currency: Currency
        is_liquid: Liquid asset flag
        quantity: Quantity (for fractional assets)
        ticker_symbol: Ticker symbol (for quoted assets)
        notes: Notes
        metadata: Extensible metadata
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        financial_profile: Parent financial profile
        purchase_transaction: Purchase transaction
        valuations: Historical valuations for this asset
    """

    __tablename__ = "assets"

    # Primary key - UUID for security
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign keys
    financial_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    purchase_transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True
    )

    # Asset information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    asset_type: Mapped[AssetType] = mapped_column(
        StringEnum(AssetType),
        nullable=False,
        index=True
    )

    # Purchase information
    purchase_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    purchase_price: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=15, scale=2),
        nullable=True
    )

    # Current valuation
    current_value: Mapped[Decimal] = mapped_column(
        Numeric(precision=15, scale=2),
        nullable=False
    )
    current_value_min: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=15, scale=2),
        nullable=True
    )
    current_value_max: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=15, scale=2),
        nullable=True
    )

    # Valuation method and date
    valuation_method: Mapped[ValuationMethod] = mapped_column(
        StringEnum(ValuationMethod),
        default=ValuationMethod.MANUAL,
        nullable=False
    )
    last_valuation_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Currency
    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    # Liquidity
    is_liquid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # For fractional assets (stocks, crypto)
    quantity: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=8),
        nullable=True
    )
    ticker_symbol: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        index=True
    )

    # Additional information
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    asset_metadata: Mapped[Optional[dict[str, Any]]] = mapped_column(
        'metadata',
        JSONB,
        nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    financial_profile: Mapped["FinancialProfile"] = relationship(back_populates="assets")
    purchase_transaction: Mapped[Optional["Transaction"]] = relationship()
    valuations: Mapped[List["AssetValuation"]] = relationship(
        back_populates="asset",
        cascade="all, delete-orphan",
        order_by="AssetValuation.valuation_date.desc()"
    )

    def __repr__(self) -> str:
        return f"<Asset(id={self.id}, name='{self.name}', value={self.current_value} {self.currency})>"


class AssetValuation(Base):
    """
    Historical asset valuations. Time series for performance analysis.

    Child of assets.

    Based on FinancePro Database Technical Documentation v2.1

    Attributes:
        id: UUID primary key
        asset_id: Parent asset
        valuation_date: Valuation date
        value: Value (best estimate)
        value_min: Minimum value (if range)
        value_max: Maximum value (if range)
        valuation_method: Method used
        source: Valuation source
        notes: Valuation notes
        created_at: Record creation timestamp

    Relationships:
        asset: Parent asset
    """

    __tablename__ = "asset_valuations"

    # Primary key - UUID for security
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign key
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Valuation information
    valuation_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    value: Mapped[Decimal] = mapped_column(
        Numeric(precision=15, scale=2),
        nullable=False
    )
    value_min: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=15, scale=2),
        nullable=True
    )
    value_max: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=15, scale=2),
        nullable=True
    )

    # Valuation method
    valuation_method: Mapped[ValuationMethod] = mapped_column(
        StringEnum(ValuationMethod),
        nullable=False
    )

    # Source
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationship
    asset: Mapped["Asset"] = relationship(back_populates="valuations")

    def __repr__(self) -> str:
        return f"<AssetValuation(asset_id={self.asset_id}, date={self.valuation_date}, value={self.value})>"
