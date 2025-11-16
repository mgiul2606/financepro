# app/models/recurring_transaction.py
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Enum as SQLEnum, Text, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, date as date_type
from decimal import Decimal
import enum
import uuid
from app.db.database import Base


class AmountModel(str, enum.Enum):
    """Models for recurring transaction amount variation"""
    FIXED = "fixed"  # Fixed amount
    VARIABLE_WITHIN_RANGE = "variable_within_range"  # Variable with min/max
    PROGRESSIVE = "progressive"  # Progressive amounts (e.g., loan payments)
    SEASONAL = "seasonal"  # Seasonal variations


class Frequency(str, enum.Enum):
    """Frequency of recurring transactions"""
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"  # Custom interval in days


class OccurrenceStatus(str, enum.Enum):
    """Status of a recurring transaction occurrence"""
    PENDING = "pending"
    EXECUTED = "executed"
    SKIPPED = "skipped"
    OVERRIDDEN = "overridden"  # Manually modified


class RecurringTransaction(Base):
    """
    Recurring Transaction model for managing repeating transactions.

    Supports sophisticated amount variation models:
    - FIXED: Constant amount
    - VARIABLE_WITHIN_RANGE: Amount varies within min/max bounds
    - PROGRESSIVE: Amount changes according to a formula
    - SEASONAL: Amount varies by season

    Attributes:
        id: UUID primary key
        account_id: Foreign key to Account
        category_id: Foreign key to Category
        name: Name of the recurring transaction
        description: Detailed description
        amount_model: Model for amount variation
        base_amount: Base amount
        min_amount: Minimum amount (for VARIABLE)
        max_amount: Maximum amount (for VARIABLE)
        frequency: How often it recurs
        custom_interval_days: Custom interval in days (if frequency is CUSTOM)
        start_date: When recurring transactions start
        end_date: When they end (optional)
        next_occurrence_date: Next scheduled occurrence
        calculation_formula: Mathematical formula for PROGRESSIVE model
        is_active: Whether this recurring transaction is active
        notification_enabled: Whether to send notifications
        notification_days_before: Days before occurrence to send notification
        anomaly_threshold_percentage: Percentage deviation to flag as anomaly
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        account: Account this recurring transaction belongs to
        category: Category of transactions
        generated_transactions: Actual transactions generated from this recurring transaction
        occurrences: Scheduled and executed occurrences
    """
    __tablename__ = "recurring_transactions"

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
        nullable=True
    )

    # Basic information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Amount model
    amount_model = Column(SQLEnum(AmountModel), default=AmountModel.FIXED, nullable=False)
    base_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    min_amount = Column(Numeric(precision=15, scale=2), nullable=True)  # For VARIABLE_WITHIN_RANGE
    max_amount = Column(Numeric(precision=15, scale=2), nullable=True)  # For VARIABLE_WITHIN_RANGE

    # Frequency
    frequency = Column(SQLEnum(Frequency), default=Frequency.MONTHLY, nullable=False)
    custom_interval_days = Column(Integer, nullable=True)  # For CUSTOM frequency

    # Schedule
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    next_occurrence_date = Column(Date, nullable=False, index=True)

    # Advanced features
    calculation_formula = Column(Text, nullable=True)  # Mathematical formula for PROGRESSIVE

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Notifications
    notification_enabled = Column(Boolean, default=True, nullable=False)
    notification_days_before = Column(Integer, default=3, nullable=False)

    # Anomaly detection
    anomaly_threshold_percentage = Column(Numeric(precision=5, scale=2), default=Decimal("20.00"), nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
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
    status = Column(SQLEnum(OccurrenceStatus), default=OccurrenceStatus.PENDING, nullable=False)
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
