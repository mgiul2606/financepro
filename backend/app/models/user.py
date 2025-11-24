# app/models/user.py
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


class User(Base):
    """
    User model representing the main application user.

    Based on FinancePro Database Technical Documentation v2.1

    Attributes:
        id: UUID primary key (for security, not incremental)
        email: Unique email address
        hashed_password: Password hash (Argon2id/bcrypt)
        full_name: Display name for UI personalization
        is_active: Account status (false = soft delete)
        is_verified: Email verification status
        two_factor_enabled: 2FA enabled flag
        two_factor_secret: TOTP secret (encrypted)
        preferred_language: ISO 639-1 code
        timezone: IANA timezone
        created_at: Account creation timestamp
        updated_at: Last update timestamp
        last_login_at: Last successful login timestamp
        last_login_ip: Last login IP for security audit

    Relationships:
        financial_profiles: All financial profiles owned by this user
        preferences: User preferences and settings (1:1)
        categories: USER-level categories (shared across profiles)
        tags: USER-level tags (shared across profiles)
        budgets: USER-level budgets with scope
        financial_goals: USER-level goals with scope
        ai_recommendations: AI optimization suggestions
        chat_conversations: Chat conversations
        notifications: User notifications
        audit_logs: Audit logs
    """
    __tablename__ = "users"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Authentication
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # User information
    full_name = Column(String(255), nullable=True)

    # Status flags
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Two-Factor Authentication
    two_factor_enabled = Column(Boolean, default=False, nullable=False)
    two_factor_secret = Column(String(255), nullable=True)  # Encrypted at app level

    # Localization
    preferred_language = Column(String(10), default='it', nullable=False)  # ISO 639-1
    timezone = Column(String(50), default='Europe/Rome', nullable=False)  # IANA timezone

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_login_ip = Column(String(45), nullable=True)  # IPv4/IPv6

    # Relationships
    financial_profiles = relationship(
        "FinancialProfile",
        back_populates="user",
        foreign_keys="FinancialProfile.user_id",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    preferences = relationship(
        "UserPreferences",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
        lazy="noload"
    )
    # USER-level entities (shared across profiles)
    categories = relationship(
        "Category",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    tags = relationship(
        "Tag",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    budgets = relationship(
        "Budget",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    financial_goals = relationship(
        "FinancialGoal",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    ai_recommendations = relationship(
        "AIRecommendation",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    audit_logs = relationship(
        "AuditLog",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    chat_conversations = relationship(
        "ChatConversation",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"