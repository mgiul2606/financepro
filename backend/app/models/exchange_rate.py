# app/models/exchange_rate.py
from sqlalchemy import Column, String, Numeric, Date, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone, date as date_type
import uuid
from app.db.database import Base


class ExchangeRate(Base):
    """
    Exchange Rate model for multi-currency support.

    Stores historical exchange rates for currency conversion.
    Rates are fetched from external sources (ECB, etc.) or entered manually.

    Attributes:
        id: UUID primary key
        from_currency: Source currency (ISO 4217 code)
        to_currency: Target currency (ISO 4217 code)
        rate: Exchange rate (how much 1 unit of from_currency equals in to_currency)
        date: Date for which this rate is valid
        source: Source of the rate (e.g., "ECB", "Manual", "Yahoo Finance")
        created_at: Creation timestamp

    Indexes:
        - Composite index on (from_currency, to_currency, date DESC) for fast lookups
    """
    __tablename__ = "exchange_rates"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Currency pair
    from_currency = Column(String(3), nullable=False)  # ISO 4217 code
    to_currency = Column(String(3), nullable=False)  # ISO 4217 code

    # Exchange rate with high precision
    rate = Column(Numeric(precision=18, scale=8), nullable=False)

    # Date for which this rate is valid
    date = Column(Date, nullable=False, index=True)

    # Source of the rate
    source = Column(String(100), default="Manual", nullable=False)

    # Timestamp
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Composite index for efficient lookups
    __table_args__ = (
        Index(
            "ix_exchange_rates_currency_date",
            "from_currency",
            "to_currency",
            "date",
            postgresql_using="btree"
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<ExchangeRate("
            f"1 {self.from_currency} = {self.rate} {self.to_currency}, "
            f"date={self.date})>"
        )
