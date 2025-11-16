# app/models/account.py
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from decimal import Decimal
import enum
import uuid
from app.db.database import Base


class AccountType(str, enum.Enum):
    """Types of financial accounts"""
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    INVESTMENT = "investment"
    CASH = "cash"
    LOAN = "loan"
    OTHER = "other"


class Account(Base):
    """
    Account model representing a financial account within a financial profile.

    Attributes:
        id: UUID primary key
        financial_profile_id: Foreign key to FinancialProfile
        name: Account name
        account_type: Type of account (checking, savings, etc.)
        currency: ISO 4217 currency code (3 letters)
        initial_balance: Starting balance when account was created
        institution_name: Name of the financial institution
        account_number: Encrypted account number
        is_active: Whether the account is active
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        financial_profile: Parent financial profile
        transactions: All transactions for this account
        recurring_transactions: Recurring transactions linked to this account
        import_jobs: Import jobs for this account

    Properties:
        current_balance: Computed balance (initial + sum of transactions)
    """
    __tablename__ = "accounts"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key to FinancialProfile
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id"),
        nullable=False,
        index=True
    )

    # Account information
    name = Column(String(100), nullable=False)
    account_type = Column(SQLEnum(AccountType), default=AccountType.CHECKING, nullable=False)

    # Currency
    currency = Column(String(3), default="EUR", nullable=False)

    # Balance - Usa Numeric invece di Float per precisione finanziaria
    initial_balance = Column(
        Numeric(precision=15, scale=2),
        default=Decimal("0.00"),
        nullable=False
    )

    # Institution details
    institution_name = Column(String(255), nullable=True)
    # NOTE: This field should be encrypted in production using app.core.encryption
    account_number = Column(String(255), nullable=True)

    # Notes
    notes = Column(Text, nullable=True)

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
    financial_profile = relationship("FinancialProfile", back_populates="accounts")
    transactions = relationship(
        "Transaction",
        back_populates="account",
        cascade="all, delete-orphan",
        lazy="dynamic"  # Use dynamic for better performance with large datasets
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

    @property
    def current_balance(self) -> Decimal:
        """
        Calcola il saldo corrente sommando initial_balance e tutte le transazioni.

        Returns:
            Decimal: Saldo corrente con precisione a 2 decimali
        """
        from app.models.transaction import TransactionType

        # Calculate sum of transactions
        transaction_sum = Decimal("0.00")
        for t in self.transactions:
            if t.transaction_type == TransactionType.INCOME:
                transaction_sum += Decimal(str(t.amount))
            else:
                transaction_sum -= Decimal(str(t.amount))

        return self.initial_balance + transaction_sum

    def __repr__(self) -> str:
        return f"<Account(id={self.id}, name='{self.name}', type={self.account_type.value})>"