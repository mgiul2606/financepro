# app/models/exchange_rate.py
"""Exchange Rate model for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import date, datetime, timezone
from decimal import Decimal
import uuid

from sqlalchemy import Date, DateTime, Index, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class ExchangeRate(Base):
    """
    Historical currency exchange rates for multi-currency transaction conversion.

    GLOBAL level - shared across ALL users (no RLS).

    Based on FinancePro Database Technical Documentation v2.1

    Attributes:
        id: UUID primary key
        base_currency: Base currency (ISO 4217)
        target_currency: Target currency (ISO 4217)
        rate: Exchange rate with high precision (8 decimals). 1 base = rate target.
        rate_date: Date of validity
        source: Data source ('ECB', 'OpenExchangeRates', 'Manual')
        created_at: Record creation timestamp

    Constraints:
        - UNIQUE (base_currency, target_currency, rate_date)

    Indexes:
        - Composite index on (base_currency, target_currency, rate_date) for fast lookups
    """

    __tablename__ = "exchange_rates"

    # Primary key - UUID for security
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Currency pair
    base_currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False
    )  # ISO 4217 code
    target_currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False
    )  # ISO 4217 code

    # Exchange rate with high precision
    rate: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=8),
        nullable=False
    )

    # Date for which this rate is valid
    rate_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Source of the rate
    source: Mapped[str] = mapped_column(String(50), nullable=False)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint(
            'base_currency',
            'target_currency',
            'rate_date',
            name='uq_exchange_rates_currencies_date'
        ),
        Index(
            "ix_exchange_rates_currency_date",
            "base_currency",
            "target_currency",
            "rate_date",
            postgresql_using="btree"
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<ExchangeRate("
            f"1 {self.base_currency} = {self.rate} {self.target_currency}, "
            f"date={self.rate_date})>"
        )
