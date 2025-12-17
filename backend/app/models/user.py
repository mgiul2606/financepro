# app/models/user.py
"""User model - core entity for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.ai_recommendation import AIRecommendation
    from app.models.audit_log import AuditLog
    from app.models.budget import Budget
    from app.models.category import Category
    from app.models.chat import ChatConversation
    from app.models.financial_goal import FinancialGoal
    from app.models.financial_profile import FinancialProfile
    from app.models.notification import Notification
    from app.models.tag import Tag
    from app.models.user_preferences import UserPreferences


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
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Authentication
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # User information
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Status flags
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Two-Factor Authentication
    two_factor_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    two_factor_secret: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )  # Encrypted at app level

    # Localization
    preferred_language: Mapped[str] = mapped_column(
        String(10),
        default='it',
        nullable=False
    )  # ISO 639-1
    timezone: Mapped[str] = mapped_column(
        String(50),
        default='Europe/Rome',
        nullable=False
    )  # IANA timezone

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
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    last_login_ip: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True
    )  # IPv4/IPv6

    # Relationships
    financial_profiles: Mapped[List["FinancialProfile"]] = relationship(
        back_populates="user",
        foreign_keys="FinancialProfile.user_id",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    preferences: Mapped[Optional["UserPreferences"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
        lazy="noload"
    )
    # USER-level entities (shared across profiles)
    categories: Mapped[List["Category"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    tags: Mapped[List["Tag"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    budgets: Mapped[List["Budget"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    financial_goals: Mapped[List["FinancialGoal"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    ai_recommendations: Mapped[List["AIRecommendation"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )
    chat_conversations: Mapped[List["ChatConversation"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"
