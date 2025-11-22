# app/models/account.py
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from decimal import Decimal
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import AccountType


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key to FinancialProfile
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Account information
    name = Column(String(255), nullable=False)
    account_type = Column(StringEnum(AccountType), nullable=False)

    # Currency
    currency = Column(String(3), nullable=False)

    # Balance - Numeric for financial precision
    initial_balance = Column(
        Numeric(precision=15, scale=2),
        default=Decimal("0.00"),
        nullable=False
    )
    current_balance = Column(
        Numeric(precision=15, scale=2),
        default=Decimal("0.00"),
        nullable=False
    )

    # Credit card specific
    credit_limit = Column(Numeric(precision=15, scale=2), nullable=True)

    # Interest rate for loans/savings
    interest_rate = Column(Numeric(precision=5, scale=2), nullable=True)

    # Institution details
    institution_name = Column(String(255), nullable=True)
    account_number_last4 = Column(String(4), nullable=True)
    # Full IBAN - encrypted for high-security profiles
    iban = Column(String(34), nullable=True)

    # Notes
    notes = Column(Text, nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_included_in_totals = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="accounts")
    transactions = relationship(
        "Transaction",
        back_populates="account",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    recurring_transactions = relationship(
        "RecurringTransaction",
        back_populates="account",
        cascade="all, delete-orphan"
    )
    import_jobs = relationship(
        "ImportJob",
        back_populates="account",
        cascade="all, delete-orphan"
    )
    bank_conditions = relationship(
        "BankCondition",
        back_populates="account",
        cascade="all, delete-orphan"
    )
    financial_goals = relationship(
        "FinancialGoal",
        back_populates="linked_account"
    )

    def __repr__(self) -> str:
        return f"<Account(id={self.id}, name='{self.name}', type={self.account_type.value})>"
