# app/models/account.py
"""Account model for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, WriteOnlyMapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import AccountType

if TYPE_CHECKING:
    from app.models.bank_condition import BankCondition
    from app.models.financial_goal import FinancialGoal
    from app.models.financial_profile import FinancialProfile
    from app.models.import_job import ImportJob
    from app.models.recurring_transaction import RecurringTransaction
    from app.models.transaction import Transaction


class Account(Base):
    """
    Account model representing a financial account within a financial profile.

    Based on FinancePro Database Technical Documentation v2.1

    Attributes:
        id: UUID primary key
        financial_profile_id: Foreign key to FinancialProfile
        name: Account name
        account_type: Type of account (checking, savings, credit_card, etc.)
        currency: ISO 4217 currency code (3 letters)
        initial_balance: Starting balance when account was created (immutable)
        current_balance: Current balance (updated by transactions)
        credit_limit: Credit limit (credit_card only)
        interest_rate: Annual interest rate % (loans/savings)
        institution_name: Name of the financial institution
        account_number_last4: Last 4 digits of account number
        iban: Full IBAN (encrypted for HS profiles)
        is_active: Whether the account is active
        is_included_in_totals: Include in net worth calculation
        notes: Free-form notes
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        financial_profile: Parent financial profile
        transactions: All transactions for this account
        recurring_transactions: Recurring transactions linked to this account
        import_jobs: Import jobs for this account
        bank_conditions: Bank conditions for this account
        financial_goals: Goals linked to this account
    """

    __tablename__ = "accounts"

    # Primary key - UUID for security
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign key to FinancialProfile
    financial_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Account information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_type: Mapped[AccountType] = mapped_column(
        StringEnum(AccountType),
        nullable=False
    )

    # Currency
    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    # Balance - Numeric for financial precision
    initial_balance: Mapped[Decimal] = mapped_column(
        Numeric(precision=15, scale=2),
        default=Decimal("0.00"),
        nullable=False
    )
    current_balance: Mapped[Decimal] = mapped_column(
        Numeric(precision=15, scale=2),
        default=Decimal("0.00"),
        nullable=False
    )

    # Credit card specific
    credit_limit: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=15, scale=2),
        nullable=True
    )

    # Interest rate for loans/savings
    interest_rate: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=5, scale=2),
        nullable=True
    )

    # Institution details
    institution_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    account_number_last4: Mapped[Optional[str]] = mapped_column(
        String(4),
        nullable=True
    )
    # Full IBAN - encrypted for high-security profiles
    iban: Mapped[Optional[str]] = mapped_column(String(34), nullable=True)

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_included_in_totals: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
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
        back_populates="accounts"
    )

    transactions: WriteOnlyMapped["Transaction"] = relationship(
        back_populates="account",
        cascade="all, delete-orphan"
    )

    recurring_transactions: Mapped[List["RecurringTransaction"]] = relationship(
        back_populates="account",
        cascade="all, delete-orphan"
    )

    import_jobs: Mapped[List["ImportJob"]] = relationship(
        back_populates="account",
        cascade="all, delete-orphan"
    )

    bank_conditions: Mapped[List["BankCondition"]] = relationship(
        back_populates="account",
        cascade="all, delete-orphan"
    )

    financial_goals: Mapped[List["FinancialGoal"]] = relationship(
        back_populates="linked_account"
    )

    def __repr__(self) -> str:
        return f"<Account(id={self.id}, name='{self.name}', type={self.account_type.value})>"
