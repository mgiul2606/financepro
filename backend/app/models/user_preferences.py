# app/models/user_preferences.py
"""User preferences model for FinancePro v2.1"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key - 1:1 with user
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )

    # UI Preferences
    theme = Column(String(20), default='light', nullable=False)  # light, dark, auto

    # Notification Preferences
    notification_email = Column(Boolean, default=True, nullable=False)
    notification_push = Column(Boolean, default=True, nullable=False)
    notification_in_app = Column(Boolean, default=True, nullable=False)

    # AI Preferences
    ai_proactivity_level = Column(String(20), default='moderate', nullable=False)  # minimal, moderate, high

    # Privacy Consents
    ml_training_consent = Column(Boolean, default=False, nullable=False)
    data_sharing_consent = Column(Boolean, default=False, nullable=False)

    # Custom Settings (JSONB)
    dashboard_layout = Column(JSONB, nullable=True)
    custom_settings = Column(JSONB, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationship
    user = relationship("User", back_populates="preferences")

    def __repr__(self) -> str:
        return f"<UserPreferences(user_id={self.user_id}, theme='{self.theme}')>"
