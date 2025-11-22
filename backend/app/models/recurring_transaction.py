# app/models/recurring_transaction.py
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Text, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, date as date_type
from decimal import Decimal
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import AmountModel, Frequency, OccurrenceStatus, TransactionType


class RecurringTransaction(Base):
    """
    Recurring Transaction model for managing repeating transactions.

    Based on FinancePro Database Technical Documentation v2.1

    Supports sophisticated amount variation models:
    - FIXED: Constant amount
    - VARIABLE_WITHIN_RANGE: Amount varies within min/max bounds
    - PROGRESSIVE: Amount changes according to a formula
    - SEASONAL: Amount varies by season
    - FORMULA: Custom calculation formula

    Attributes:
        id: UUID primary key
        financial_profile_id: Foreign key to FinancialProfile
        account_id: Foreign key to Account
        category_id: Foreign key to Category
        name: Name of the recurring transaction
        description: Detailed description
        transaction_type: Type of transaction (bank_transfer, purchase, etc.)
        amount_model: Model for amount variation
        base_amount: Base amount (negative=expense, positive=income)
        amount_min: Minimum amount (for VARIABLE)
        amount_max: Maximum amount (for VARIABLE)
        formula: Calculation formula (for FORMULA model)
        currency: Currency code (ISO 4217)
        frequency: How often it recurs
        interval: Frequency multiplier (e.g., 2 for "every 2 months")
        start_date: When recurring transactions start
        end_date: When they end (optional)
        next_occurrence_date: Next scheduled occurrence
        auto_create: Automatically create transaction at due date
        notification_days_before: Days before occurrence to send notification
        is_active: Whether this recurring transaction is active
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        financial_profile: Parent financial profile
        account: Account this recurring transaction belongs to
        category: Category of transactions
        generated_transactions: Actual transactions generated from this
        occurrences: Scheduled and executed occurrences
    """
    __tablename__ = "recurring_transactions"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id"),
        nullable=False,
        index=True
    )
    account_id = Column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id"),
        nullable=False,
        index=True
    )
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id"),
        nullable=True
    )

    # Basic information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    transaction_type = Column(StringEnum(TransactionType), nullable=False)

    # Amount model
    amount_model = Column(StringEnum(AmountModel), default=AmountModel.FIXED, nullable=False)
    base_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    amount_min = Column(Numeric(precision=15, scale=2), nullable=True)  # For VARIABLE_WITHIN_RANGE
    amount_max = Column(Numeric(precision=15, scale=2), nullable=True)  # For VARIABLE_WITHIN_RANGE
    formula = Column(Text, nullable=True)  # Mathematical formula for FORMULA model
    currency = Column(String(3), nullable=False)

    # Frequency
    frequency = Column(StringEnum(Frequency), default=Frequency.MONTHLY, nullable=False)
    interval = Column(Integer, default=1, nullable=False)  # Frequency multiplier

    # Schedule
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    next_occurrence_date = Column(Date, nullable=True, index=True)

    # Automation
    auto_create = Column(Boolean, default=False, nullable=False)
    notification_days_before = Column(Integer, default=3, nullable=False)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="recurring_transactions")
    account = relationship("Account", back_populates="recurring_transactions")
    category = relationship("Category")
    generated_transactions = relationship(
        "Transaction",
        back_populates="recurring_transaction",
        cascade="all, delete-orphan"
    )
    occurrences = relationship(
        "RecurringTransactionOccurrence",
        back_populates="recurring_transaction",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<RecurringTransaction(id={self.id}, name='{self.name}', frequency={self.frequency.value})>"


class RecurringTransactionOccurrence(Base):
    """
    Occurrence of a recurring transaction.

    Tracks each scheduled and executed occurrence of a recurring transaction.

    Attributes:
        id: UUID primary key
        recurring_transaction_id: Foreign key to RecurringTransaction
        transaction_id: Foreign key to Transaction (once executed)
        scheduled_date: When this occurrence is scheduled
        expected_amount: Expected amount based on the model
        actual_amount: Actual amount (once executed)
        status: Status of this occurrence
        is_anomaly: Whether this occurrence was flagged as anomaly
        notes: Additional notes
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        recurring_transaction: Parent recurring transaction
        transaction: Generated transaction (if executed)
    """
    __tablename__ = "recurring_transaction_occurrences"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    recurring_transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("recurring_transactions.id"),
        nullable=False,
        index=True
    )
    transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id"),
        nullable=True
    )

    # Occurrence details
    scheduled_date = Column(Date, nullable=False, index=True)
    expected_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    actual_amount = Column(Numeric(precision=15, scale=2), nullable=True)

    # Status
    status = Column(StringEnum(OccurrenceStatus), default=OccurrenceStatus.PENDING, nullable=False)
    is_anomaly = Column(Boolean, default=False, nullable=False)

    # Notes
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
    recurring_transaction = relationship("RecurringTransaction", back_populates="occurrences")
    transaction = relationship("Transaction")

    def __repr__(self) -> str:
        return (
            f"<RecurringTransactionOccurrence("
            f"id={self.id}, "
            f"date={self.scheduled_date}, "
            f"status={self.status.value})>"
        )
