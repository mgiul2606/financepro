# app/models/merchant.py
"""Global merchant database model for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.transaction import Transaction


class Merchant(Base):
    """
    Global normalized merchant/vendor database for Smart Categorization.

    GLOBAL level - shared across ALL users (no RLS).

    Attributes:
        id: UUID primary key
        canonical_name: Normalized merchant name (e.g., "Amazon")
        aliases: Array of name variations
        website: Merchant website
        logo_url: Logo URL for UI
        vat_number: VAT number if available
        is_verified: Manually verified merchant
        usage_count: Usage counter for ranking
    """

    __tablename__ = "merchants"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Merchant information
    canonical_name: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    aliases: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String(255)),
        nullable=True
    )  # Name variations
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    vat_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Verification status
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Usage statistics
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

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
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="merchant")

    def __repr__(self) -> str:
        return f"<Merchant(id={self.id}, name='{self.canonical_name}')>"
