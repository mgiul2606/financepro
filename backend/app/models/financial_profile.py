# app/models/financial_profile.py
"""Financial Profile model for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import ProfileType, SecurityLevel

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.asset import Asset
    from app.models.audit_log import AuditLog
    from app.models.bank_condition import BankCondition
    from app.models.chat import ChatConversation
    from app.models.document import Document
    from app.models.import_job import ImportJob
    from app.models.ml_classification_log import MLClassificationLog
    from app.models.prediction import Prediction
    from app.models.recurring_transaction import RecurringTransaction
    from app.models.transaction import Transaction
    from app.models.user import User


class FinancialProfile(Base):
    """
    Financial Profile model representing a separate financial entity.

    Based on FinancePro Database Technical Documentation v2.1

    A user can have multiple financial profiles (personal, family, business).
    v2.1 uses unified database with RLS instead of distributed DBs.

    Attributes:
        id: UUID primary key
        user_id: Owner of the profile
        name: Profile name
        profile_type: Type of profile (personal, family, business)
        security_level: standard or high_security (enables encryption)
        encryption_salt: Salt for key derivation (required for HS profiles)
        default_currency: ISO 4217 currency code
        description: Optional profile description
        is_active: Profile status (false = hidden but preserved)
        is_default: Default profile flag (only one per user)
        color_code: HEX color for UI differentiation
        icon: Icon name for UI

    Relationships:
        user: Owner of the profile
        accounts: All accounts in this profile
        transactions: All transactions in this profile
        recurring_transactions: Recurring transaction templates
        assets: Assets owned in this profile
        documents: Scanned documents
        import_jobs: Import jobs
        bank_conditions: Bank contract terms
        ml_classification_logs: ML classification logs
        predictions: Spending/income predictions
        audit_logs: Audit logs
        chat_conversations: Chat conversations (optional context)
    """

    __tablename__ = "financial_profiles"

    # Primary key - UUID for security
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign key to User
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Profile information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_type: Mapped[ProfileType] = mapped_column(
        StringEnum(ProfileType),
        default=ProfileType.PERSONAL,
        nullable=False
    )

    # Security settings for High-Security profiles
    security_level: Mapped[SecurityLevel] = mapped_column(
        StringEnum(SecurityLevel),
        default=SecurityLevel.STANDARD,
        nullable=False
    )
    encryption_salt: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )  # Base64(32 bytes), required if HS

    # Currency settings
    default_currency: Mapped[str] = mapped_column(
        String(3),
        default="EUR",
        nullable=False
    )

    # Description
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Status flags
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # UI customization
    color_code: Mapped[Optional[str]] = mapped_column(
        String(7),
        nullable=True
    )  # HEX #RRGGBB
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Icon name

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
    user: Mapped["User"] = relationship(
        back_populates="financial_profiles",
        foreign_keys=[user_id]
    )
    accounts: Mapped[List["Account"]] = relationship(
        back_populates="financial_profile",
        cascade="all, delete-orphan"
    )
    transactions: Mapped[List["Transaction"]] = relationship(
        back_populates="financial_profile",
        cascade="all, delete-orphan"
    )
    recurring_transactions: Mapped[List["RecurringTransaction"]] = relationship(
        back_populates="financial_profile",
        cascade="all, delete-orphan"
    )
    assets: Mapped[List["Asset"]] = relationship(
        back_populates="financial_profile",
        cascade="all, delete-orphan"
    )
    documents: Mapped[List["Document"]] = relationship(
        back_populates="financial_profile",
        cascade="all, delete-orphan"
    )
    import_jobs: Mapped[List["ImportJob"]] = relationship(
        back_populates="financial_profile",
        cascade="all, delete-orphan"
    )
    bank_conditions: Mapped[List["BankCondition"]] = relationship(
        back_populates="financial_profile",
        cascade="all, delete-orphan"
    )
    ml_classification_logs: Mapped[List["MLClassificationLog"]] = relationship(
        back_populates="financial_profile",
        cascade="all, delete-orphan"
    )
    predictions: Mapped[List["Prediction"]] = relationship(
        back_populates="financial_profile",
        cascade="all, delete-orphan"
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        back_populates="financial_profile",
        cascade="all, delete-orphan"
    )
    chat_conversations: Mapped[List["ChatConversation"]] = relationship(
        back_populates="financial_profile",
        cascade="all, delete-orphan"
    )

    @property
    def is_high_security(self) -> bool:
        """Check if this profile uses high-security encryption."""
        return self.security_level == SecurityLevel.HIGH_SECURITY

    @property
    def requires_encryption(self) -> bool:
        """Check if data for this profile should be encrypted."""
        return self.is_high_security and self.encryption_salt is not None

    def __repr__(self) -> str:
        return f"<FinancialProfile(id={self.id}, name='{self.name}', security={self.security_level.value})>"
