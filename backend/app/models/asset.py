# app/models/asset.py
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Text, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import AssetType, ValuationMethod


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    purchase_transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True
    )

    # Asset information
    name = Column(String(255), nullable=False)
    asset_type = Column(StringEnum(AssetType), nullable=False, index=True)

    # Purchase information
    purchase_date = Column(Date, nullable=True)
    purchase_price = Column(Numeric(precision=15, scale=2), nullable=True)

    # Current valuation
    current_value = Column(Numeric(precision=15, scale=2), nullable=False)
    current_value_min = Column(Numeric(precision=15, scale=2), nullable=True)
    current_value_max = Column(Numeric(precision=15, scale=2), nullable=True)

    # Valuation method and date
    valuation_method = Column(StringEnum(ValuationMethod), default=ValuationMethod.MANUAL, nullable=False)
    last_valuation_date = Column(Date, nullable=True)

    # Currency
    currency = Column(String(3), nullable=False)

    # Liquidity
    is_liquid = Column(Boolean, default=False, nullable=False)

    # For fractional assets (stocks, crypto)
    quantity = Column(Numeric(precision=18, scale=8), nullable=True)
    ticker_symbol = Column(String(20), nullable=True, index=True)

    # Additional information
    notes = Column(Text, nullable=True)
    metadata = Column(JSONB, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="assets")
    purchase_transaction = relationship("Transaction")
    valuations = relationship(
        "AssetValuation",
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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key
    asset_id = Column(
        UUID(as_uuid=True),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Valuation information
    valuation_date = Column(Date, nullable=False, index=True)
    value = Column(Numeric(precision=15, scale=2), nullable=False)
    value_min = Column(Numeric(precision=15, scale=2), nullable=True)
    value_max = Column(Numeric(precision=15, scale=2), nullable=True)

    # Valuation method
    valuation_method = Column(StringEnum(ValuationMethod), nullable=False)

    # Source
    source = Column(String(100), nullable=True)

    # Notes
    notes = Column(Text, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    asset = relationship("Asset", back_populates="valuations")

    def __repr__(self) -> str:
        return f"<AssetValuation(asset_id={self.asset_id}, date={self.valuation_date}, value={self.value})>"
