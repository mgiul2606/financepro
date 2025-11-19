# app/models/transaction.py
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, date as date_type
from decimal import Decimal
import enum
import uuid
from app.db.database import Base
from app.db.types import StringEnum


class TransactionType(str, enum.Enum):
    """Types of financial transactions"""
    BANK_TRANSFER = "bank_transfer"
    WITHDRAWAL = "withdrawal"
    PAYMENT = "payment"
    PURCHASE = "purchase"
    INTERNAL_TRANSFER = "internal_transfer"
    INCOME = "income"
    ASSET_PURCHASE = "asset_purchase"
    ASSET_SALE = "asset_sale"
    OTHER = "other"


class TransactionSource(str, enum.Enum):
    """Source of transaction creation"""
    MANUAL = "manual"
    IMPORT_CSV = "import_csv"
    IMPORT_OCR = "import_ocr"
    IMPORT_API = "import_api"
    RECURRING = "recurring"


class Transaction(Base):
    """
    Transaction model representing a financial transaction.

    Attributes:
        id: UUID primary key
        account_id: Foreign key to Account
        category_id: Foreign key to Category (optional)
        recurring_transaction_id: Foreign key to RecurringTransaction (if from recurring)
        transaction_type: Type of transaction
        amount: Amount in original currency
        currency: ISO 4217 currency code
        exchange_rate_id: Foreign key to ExchangeRate (if different currency)
        amount_in_profile_currency: Converted amount (computed)
        description: Transaction description
        merchant_name: Merchant/vendor name
        merchant_normalized: ML-normalized merchant name
        transaction_date: Date when transaction occurred
        value_date: Date when transaction was valued
        notes: Additional notes
        is_reconciled: Whether transaction has been reconciled
        location: Transaction location
        receipt_url: URL to receipt/document
        created_by: Source of transaction creation
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        account: Account this transaction belongs to
        category: Category of the transaction
        recurring_transaction: Parent recurring transaction (if applicable)
        exchange_rate: Exchange rate used for conversion
        tags: Tags associated with this transaction
        ml_classification_logs: ML classification history
    """
    __tablename__ = "transactions"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    account_id = Column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id"),
        nullable=False,
        index=True
    )
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id"),
        nullable=True,
        index=True
    )
    recurring_transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("recurring_transactions.id"),
        nullable=True
    )

    # Transaction details
    transaction_type = Column(StringEnum(TransactionType), nullable=False, index=True)

    # Amount and currency
    amount = Column(Numeric(precision=15, scale=2), nullable=False)
    currency = Column(String(3), nullable=False)

    # Multi-currency support
    exchange_rate_id = Column(
        UUID(as_uuid=True),
        ForeignKey("exchange_rates.id"),
        nullable=True
    )
    # This will be computed based on exchange_rate
    amount_in_profile_currency = Column(Numeric(precision=15, scale=2), nullable=True)

    # Description and merchant
    description = Column(Text, nullable=False)
    merchant_name = Column(String(255), nullable=True)
    merchant_normalized = Column(String(255), nullable=True, index=True)  # ML-normalized

    # Dates
    transaction_date = Column(Date, nullable=False, index=True)
    value_date = Column(Date, nullable=True)

    # Additional information
    notes = Column(Text, nullable=True)
    is_reconciled = Column(Boolean, default=False, nullable=False)
    location = Column(String(255), nullable=True)
    receipt_url = Column(String(500), nullable=True)

    # Metadata
    created_by = Column(StringEnum(TransactionSource), default=TransactionSource.MANUAL, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Future: Vector embedding for ML classification
    # description_embedding = Column(Vector(384))

    # Relationships
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    recurring_transaction = relationship("RecurringTransaction", back_populates="generated_transactions")
    exchange_rate = relationship("ExchangeRate")
    tags = relationship(
        "Tag",
        secondary="transaction_tags",
        back_populates="transactions"
    )
    ml_classification_logs = relationship(
        "MLClassificationLog",
        back_populates="transaction",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"<Transaction(id={self.id}, "
            f"amount={self.amount} {self.currency}, "
            f"date={self.transaction_date})>"
        )