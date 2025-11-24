# app/models/merchant.py
"""Global merchant database model for FinancePro v2.1"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Merchant information
    canonical_name = Column(String(255), unique=True, nullable=False, index=True)
    aliases = Column(ARRAY(String(255)), nullable=True)  # Name variations
    website = Column(String(255), nullable=True)
    logo_url = Column(String(500), nullable=True)
    vat_number = Column(String(50), nullable=True)

    # Verification status
    is_verified = Column(Boolean, default=False, nullable=False)

    # Usage statistics
    usage_count = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    transactions = relationship("Transaction", back_populates="merchant")

    def __repr__(self) -> str:
        return f"<Merchant(id={self.id}, name='{self.canonical_name}')>"
