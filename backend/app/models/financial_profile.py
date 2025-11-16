# app/models/financial_profile.py
from sqlalchemy import Column, Integer, String, Enum as SQLEnum, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
import uuid
from app.db.database import Base


class ProfileType(str, enum.Enum):
    """Types of financial profiles"""
    PERSONAL = "personal"
    FAMILY = "family"
    BUSINESS = "business"


class DatabaseType(str, enum.Enum):
    """Supported database types for distributed storage"""
    POSTGRESQL = "postgresql"
    MSSQL = "mssql"


class FinancialProfile(Base):
    """
    Financial Profile model representing a separate financial entity.

    A user can have multiple financial profiles (personal, family, business).
    Each profile can have its own database for data isolation.

    Attributes:
        id: UUID primary key
        user_id: Owner of the profile
        name: Profile name
        description: Optional description
        profile_type: Type of profile (personal, family, business)
        default_currency: ISO 4217 currency code (3 letters, default EUR)
        database_connection_string: Encrypted connection string for distributed DB
        database_type: Type of database (PostgreSQL, MS SQL Server)
        is_active: Whether the profile is active
        is_available: Computed based on database connection availability
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        user: Owner of the profile
        accounts: All accounts in this profile
        categories: Custom categories for this profile
        tags: Custom tags for this profile
        budgets: Budgets defined for this profile
        goals: Financial goals for this profile
        assets: Assets owned in this profile
        import_jobs: Import jobs for this profile
        audit_logs: Audit logs for this profile
    """
    __tablename__ = "financial_profiles"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key to User
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Profile information
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    profile_type = Column(SQLEnum(ProfileType), default=ProfileType.PERSONAL, nullable=False)

    # Currency settings
    default_currency = Column(String(3), default="EUR", nullable=False)

    # Distributed database configuration
    # NOTE: This field should be encrypted in production using app.core.encryption
    database_connection_string = Column(Text, nullable=True)
    database_type = Column(SQLEnum(DatabaseType), default=DatabaseType.POSTGRESQL, nullable=True)

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
    user = relationship("User", back_populates="financial_profiles")
    accounts = relationship("Account", back_populates="financial_profile", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="financial_profile", cascade="all, delete-orphan")
    tags = relationship("Tag", back_populates="financial_profile", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="financial_profile", cascade="all, delete-orphan")
    goals = relationship("FinancialGoal", back_populates="financial_profile", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="financial_profile", cascade="all, delete-orphan")
    import_jobs = relationship("ImportJob", back_populates="financial_profile", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="financial_profile", cascade="all, delete-orphan")
    chat_conversations = relationship("ChatConversation", back_populates="financial_profile", cascade="all, delete-orphan")

    @property
    def is_available(self) -> bool:
        """
        Check if the profile's database is currently available.

        Returns:
            bool: True if database is accessible, False otherwise
        """
        # TODO: Implement actual database connectivity check
        # For now, profiles without custom DB are always available
        if not self.database_connection_string:
            return True

        # Placeholder for actual connectivity check
        return True

    def __repr__(self) -> str:
        return f"<FinancialProfile(id={self.id}, name='{self.name}', type={self.profile_type.value})>"
