# app/models/transaction.py
"""Transaction model - core financial data for FinancePro v2.1"""
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Text, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import TransactionType, TransactionSource


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    account_id = Column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    merchant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("merchants.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    recurring_transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("recurring_transactions.id", ondelete="SET NULL"),
        nullable=True
    )
    related_transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True
    )
    duplicate_of_id = Column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True
    )

    # Transaction details
    transaction_date = Column(Date, nullable=False, index=True)
    transaction_type = Column(StringEnum(TransactionType), nullable=False, index=True)
    source = Column(StringEnum(TransactionSource), default=TransactionSource.MANUAL, nullable=False)

    # Amount - encrypted for HS profiles
    amount = Column(Text, nullable=False)  # Encrypted as base64 for HS
    amount_clear = Column(Numeric(15, 2), nullable=False)  # Always cleartext
    currency = Column(String(3), nullable=False)
    exchange_rate = Column(Numeric(18, 8), nullable=True)
    amount_in_profile_currency = Column(Numeric(15, 2), nullable=False)

    # Description - encrypted for HS profiles
    description = Column(Text, nullable=True)
    description_clear = Column(String(255), nullable=True)
    merchant_name = Column(String(255), nullable=True)

    # Notes - encrypted for HS profiles
    notes = Column(Text, nullable=True)

    # Reconciliation
    is_reconciled = Column(Boolean, default=False, nullable=False)
    receipt_url = Column(String(500), nullable=True)

    # Duplicate detection
    is_duplicate = Column(Boolean, default=False, nullable=False)

    # Import tracking
    import_job_id = Column(UUID(as_uuid=True), nullable=True)
    external_id = Column(String(255), nullable=True)

    # Extensible metadata
    transaction_metadata = Column(JSONB, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    merchant = relationship("Merchant", back_populates="transactions")
    recurring_transaction = relationship("RecurringTransaction", back_populates="generated_transactions")
    related_transaction = relationship(
        "Transaction",
        remote_side=[id],
        foreign_keys=[related_transaction_id],
        uselist=False
    )
    duplicate_of = relationship(
        "Transaction",
        remote_side=[id],
        foreign_keys=[duplicate_of_id],
        uselist=False
    )
    tags = relationship(
        "Tag",
        secondary="transaction_tags",
        back_populates="transactions"
    )
    documents = relationship("Document", back_populates="transaction")
    ml_classification_logs = relationship(
        "MLClassificationLog",
        back_populates="transaction",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"<Transaction(id={self.id}, "
            f"amount={self.amount_clear} {self.currency}, "
            f"date={self.transaction_date})>"
        )
