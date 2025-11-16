# app/models/asset.py
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Enum as SQLEnum, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from decimal import Decimal
import enum
import uuid
from app.db.database import Base


class AssetType(str, enum.Enum):
    """Types of assets"""
    REAL_ESTATE = "real_estate"
    VEHICLE = "vehicle"
    PRECIOUS_METAL = "precious_metal"
    INVESTMENT = "investment"
    ARTWORK = "artwork"
    JEWELRY = "jewelry"
    OTHER = "other"


class ValuationMethod(str, enum.Enum):
    """Methods for asset valuation"""
    MARKET_QUOTE = "market_quote"  # Objective market prices (e.g., gold)
    RANGE = "range"  # Range of values (e.g., real estate)
    COMPARATIVE = "comparative"  # Comparative valuation
    MANUAL = "manual"  # Manual estimation


class Asset(Base):
    """
    Asset model for patrimony management.

    Tracks movable and immovable assets with flexible valuation methods.

    Attributes:
        id: UUID primary key
        financial_profile_id: Foreign key to FinancialProfile
        name: Asset name
        asset_type: Type of asset
        purchase_date: When the asset was acquired
        purchase_price: Original purchase price
        current_value: Current estimated value
        current_value_min: Minimum value in range
        current_value_max: Maximum value in range
        valuation_method: Method used for valuation
        currency: ISO 4217 currency code
        is_liquid: Whether the asset is easily liquidable
        notes: Additional notes
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        financial_profile: Parent financial profile
        valuations: Historical valuations for this asset
    """
    __tablename__ = "assets"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id"),
        nullable=False,
        index=True
    )

    # Asset information
    name = Column(String(255), nullable=False)
    asset_type = Column(SQLEnum(AssetType), nullable=False, index=True)

    # Purchase information
    purchase_date = Column(Date, nullable=True)
    purchase_price = Column(Numeric(precision=15, scale=2), nullable=True)

    # Current valuation
    current_value = Column(Numeric(precision=15, scale=2), nullable=False)
    current_value_min = Column(Numeric(precision=15, scale=2), nullable=True)  # For range valuations
    current_value_max = Column(Numeric(precision=15, scale=2), nullable=True)  # For range valuations

    # Valuation method
    valuation_method = Column(SQLEnum(ValuationMethod), default=ValuationMethod.MANUAL, nullable=False)

    # Currency
    currency = Column(String(3), nullable=False)

    # Liquidity
    is_liquid = Column(Boolean, default=False, nullable=False)

    # Additional information
    notes = Column(Text, nullable=True)

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
    Historical valuation record for an asset.

    Tracks how asset values change over time.

    Attributes:
        id: UUID primary key
        asset_id: Foreign key to Asset
        valuation_date: Date of this valuation
        value: Estimated value
        value_min: Minimum value (for range valuations)
        value_max: Maximum value (for range valuations)
        source: Source of valuation
        notes: Additional notes
        created_at: Creation timestamp

    Relationships:
        asset: Parent asset
    """
    __tablename__ = "asset_valuations"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key
    asset_id = Column(
        UUID(as_uuid=True),
        ForeignKey("assets.id"),
        nullable=False,
        index=True
    )

    # Valuation information
    valuation_date = Column(Date, nullable=False, index=True)
    value = Column(Numeric(precision=15, scale=2), nullable=False)
    value_min = Column(Numeric(precision=15, scale=2), nullable=True)
    value_max = Column(Numeric(precision=15, scale=2), nullable=True)

    # Source
    source = Column(String(255), nullable=True)

    # Notes
    notes = Column(Text, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    asset = relationship("Asset", back_populates="valuations")

    def __repr__(self) -> str:
        return f"<AssetValuation(asset_id={self.asset_id}, date={self.valuation_date}, value={self.value})>"
