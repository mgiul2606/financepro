# app/models/financial_profile.py
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import ProfileType, SecurityLevel


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key to User
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Profile information
    name = Column(String(255), nullable=False)
    profile_type = Column(StringEnum(ProfileType), default=ProfileType.PERSONAL, nullable=False)

    # Security settings for High-Security profiles
    security_level = Column(StringEnum(SecurityLevel), default=SecurityLevel.STANDARD, nullable=False)
    encryption_salt = Column(String(255), nullable=True)  # Base64(32 bytes), required if HS

    # Currency settings
    default_currency = Column(String(3), default="EUR", nullable=False)

    # Description
    description = Column(Text, nullable=True)

    # Status flags
    is_active = Column(Boolean, default=True, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)

    # UI customization
    color_code = Column(String(7), nullable=True)  # HEX #RRGGBB
    icon = Column(String(50), nullable=True)  # Icon name

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="financial_profiles", foreign_keys=[user_id])
    accounts = relationship("Account", back_populates="financial_profile", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="financial_profile", cascade="all, delete-orphan")
    recurring_transactions = relationship("RecurringTransaction", back_populates="financial_profile", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="financial_profile", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="financial_profile", cascade="all, delete-orphan")
    import_jobs = relationship("ImportJob", back_populates="financial_profile", cascade="all, delete-orphan")
    bank_conditions = relationship("BankCondition", back_populates="financial_profile", cascade="all, delete-orphan")
    ml_classification_logs = relationship("MLClassificationLog", back_populates="financial_profile", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="financial_profile", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="financial_profile", cascade="all, delete-orphan")
    chat_conversations = relationship("ChatConversation", back_populates="financial_profile", cascade="all, delete-orphan")

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
