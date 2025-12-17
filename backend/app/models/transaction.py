# app/models/transaction.py
"""Transaction model - core financial data for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, List, Optional
import uuid

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import TransactionSource, TransactionType

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.category import Category
    from app.models.document import Document
    from app.models.financial_profile import FinancialProfile
    from app.models.merchant import Merchant
    from app.models.ml_classification_log import MLClassificationLog
    from app.models.recurring_transaction import RecurringTransaction
    from app.models.tag import Tag


class Transaction(Base):
    """
    All financial transactions - core table for tracking money movements.

    PROFILE-level entity with encryption support for High-Security profiles.

    Based on FinancePro Database Technical Documentation v2.1

    Encryption (High-Security Profiles):
    - amount: Encrypted (AES-256-GCM), stored as base64 TEXT
    - description: Encrypted
    - notes: Encrypted
    - amount_clear, description_clear: Always cleartext for queries
    """

    __tablename__ = "transactions"

    # Primary key
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
    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    merchant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("merchants.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    recurring_transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recurring_transactions.id", ondelete="SET NULL"),
        nullable=True
    )
    related_transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True
    )
    duplicate_of_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True
    )

    # Transaction details
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    transaction_type: Mapped[TransactionType] = mapped_column(
        StringEnum(TransactionType),
        nullable=False,
        index=True
    )
    source: Mapped[TransactionSource] = mapped_column(
        StringEnum(TransactionSource),
        default=TransactionSource.MANUAL,
        nullable=False
    )

    # Amount - encrypted for HS profiles
    amount: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )  # Encrypted as base64 for HS
    amount_clear: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False
    )  # Always cleartext
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    exchange_rate: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(18, 8),
        nullable=True
    )
    amount_in_profile_currency: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False
    )

    # Description - encrypted for HS profiles
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description_clear: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    merchant_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Notes - encrypted for HS profiles
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Reconciliation
    is_reconciled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    receipt_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Duplicate detection
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Import tracking
    import_job_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )
    external_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Extensible metadata - note: 'metadata' is reserved in SQLAlchemy
    transaction_metadata: Mapped[Optional[dict[str, Any]]] = mapped_column(
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
    financial_profile: Mapped["FinancialProfile"] = relationship(
        back_populates="transactions"
    )
    account: Mapped["Account"] = relationship(back_populates="transactions")
    category: Mapped[Optional["Category"]] = relationship(
        back_populates="transactions"
    )
    merchant: Mapped[Optional["Merchant"]] = relationship(
        back_populates="transactions"
    )
    recurring_transaction: Mapped[Optional["RecurringTransaction"]] = relationship(
        back_populates="generated_transactions"
    )
    related_transaction: Mapped[Optional["Transaction"]] = relationship(
        remote_side=[id],
        foreign_keys=[related_transaction_id],
        uselist=False
    )
    duplicate_of: Mapped[Optional["Transaction"]] = relationship(
        remote_side=[id],
        foreign_keys=[duplicate_of_id],
        uselist=False
    )
    tags: Mapped[List["Tag"]] = relationship(
        secondary="transaction_tags",
        back_populates="transactions"
    )
    documents: Mapped[List["Document"]] = relationship(back_populates="transaction")
    ml_classification_logs: Mapped[List["MLClassificationLog"]] = relationship(
        back_populates="transaction",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"<Transaction(id={self.id}, "
            f"amount={self.amount_clear} {self.currency}, "
            f"date={self.transaction_date})>"
        )
