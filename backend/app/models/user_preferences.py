# app/models/user_preferences.py
"""User preferences model for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Optional
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserPreferences(Base):
    """
    User-specific UI, notification, and AI behavior settings.

    1:1 relationship with users.

    Attributes:
        id: UUID primary key
        user_id: User owning these preferences
        theme: UI theme (light/dark/auto)
        notification_email: Enable email notifications
        notification_push: Enable push notifications
        notification_in_app: Enable in-app notifications
        ai_proactivity_level: AI suggestion frequency
        ml_training_consent: Consent for ML training
        data_sharing_consent: Consent for aggregated benchmarks
        dashboard_layout: Custom dashboard widget layout
        custom_settings: Extensible settings
    """

    __tablename__ = "user_preferences"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign key - 1:1 with user
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )

    # UI Preferences
    theme: Mapped[str] = mapped_column(
        String(20),
        default='light',
        nullable=False
    )  # light, dark, auto

    # Notification Preferences
    notification_email: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    notification_push: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    notification_in_app: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    # AI Preferences
    ai_proactivity_level: Mapped[str] = mapped_column(
        String(20),
        default='moderate',
        nullable=False
    )  # minimal, moderate, high

    # Privacy Consents
    ml_training_consent: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    data_sharing_consent: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    # Custom Settings (JSONB)
    dashboard_layout: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )
    custom_settings: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
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

    # Relationship
    user: Mapped["User"] = relationship(back_populates="preferences")

    def __repr__(self) -> str:
        return f"<UserPreferences(user_id={self.user_id}, theme='{self.theme}')>"
