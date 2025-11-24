# app/models/recurring_transaction.py
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Text, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import AmountModel, Frequency, OccurrenceStatus, TransactionType


class RecurringTransaction(Base):
    """
    Templates for recurring transactions (subscriptions, salaries, bills).

    PROFILE-level entity.

    Based on FinancePro Database Technical Documentation v2.1

    Amount Models:
    - fixed: Constant amount (rent, subscriptions)
    - variable_within_range: Varies between min/max (utilities)
    - progressive: Programmed increase (mortgage with rising payments)
    - seasonal: Seasonal variation (heating in winter)
    - formula: Custom calculation

    Attributes:
        id: UUID primary key
        financial_profile_id: Profile owner
        account_id: Associated account
        category_id: Default category
        name: Template name
        description: Detailed description
        transaction_type: Type of transaction
        amount_model: Amount variation model
        base_amount: Base amount (negative=expense, positive=income)
        amount_min: Minimum amount (for variable model)
        amount_max: Maximum amount (for variable model)
        formula: Calculation formula (for formula model)
        currency: Currency
        frequency: Recurrence frequency
        interval: Frequency multiplier
        start_date: Start date
        end_date: End date (optional, NULL = indefinite)
        next_occurrence_date: Next calculated occurrence
        auto_create: Auto-create transaction at due date
        notification_days_before: Days before due date to notify
        is_active: Template status
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        financial_profile: Profile owner
        account: Account for transactions
        category: Default category
        generated_transactions: Actual transactions generated
        occurrences: Scheduled and executed occurrences
    """
    __tablename__ = "recurring_transactions"

    # Primary key - UUID for security
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
        nullable=True
    )

    # Basic information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Transaction type
    transaction_type = Column(StringEnum(TransactionType), nullable=False)

    # Amount model
    amount_model = Column(StringEnum(AmountModel), default=AmountModel.FIXED, nullable=False)
    base_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    amount_min = Column(Numeric(precision=15, scale=2), nullable=True)
    amount_max = Column(Numeric(precision=15, scale=2), nullable=True)
    formula = Column(Text, nullable=True)

    # Currency
    currency = Column(String(3), nullable=False)

    # Frequency
    frequency = Column(StringEnum(Frequency), nullable=False)
    interval = Column(Integer, default=1, nullable=False)

    # Schedule
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    next_occurrence_date = Column(Date, nullable=True, index=True)

    # Automation
    auto_create = Column(Boolean, default=False, nullable=False)

    # Notifications
    notification_days_before = Column(Integer, default=3, nullable=False)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
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
    Individual occurrences generated from recurring templates.

    Tracks execution status of each scheduled occurrence.

    Based on FinancePro Database Technical Documentation v2.1

    Statuses:
    - pending: Not yet executed, waiting
    - executed: Transaction created successfully
    - skipped: Deliberately skipped
    - overridden: Manually modified
    - failed: Creation attempt failed

    Attributes:
        id: UUID primary key
        recurring_transaction_id: Parent template
        transaction_id: Actual transaction created (if executed)
        scheduled_date: Scheduled date
        expected_amount: Expected amount (calculated from amount_model)
        actual_amount: Actual amount (if different from expected)
        status: Occurrence status
        notes: Notes (e.g., skip reason)
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
        ForeignKey("recurring_transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True
    )

    # Occurrence details
    scheduled_date = Column(Date, nullable=False, index=True)
    expected_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    actual_amount = Column(Numeric(precision=15, scale=2), nullable=True)

    # Status
    status = Column(StringEnum(OccurrenceStatus), default=OccurrenceStatus.PENDING, nullable=False)

    # Notes
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
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
