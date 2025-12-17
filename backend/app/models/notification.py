# app/models/notification.py
"""Notification model for user alerts - FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import NotificationStatus, NotificationType

if TYPE_CHECKING:
    from app.models.financial_profile import FinancialProfile
    from app.models.user import User


class Notification(Base):
    """
    User notifications (push/email/in-app).

    USER-level entity.

    Attributes:
        id: UUID primary key
        user_id: Notification recipient
        financial_profile_id: Related profile (optional)
        notification_type: Type of notification
        title: Notification title
        message: Message body
        status: unread/read/archived/dismissed
        priority: Priority (1-10)
        action_url: Deep link action
        related_entity_type: Related entity type
        related_entity_id: Related entity ID
        sent_via_email: Email delivery flag
        sent_via_push: Push notification delivery flag
        expires_at: Expiration
        read_at: Read timestamp
    """

    __tablename__ = "notifications"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign keys
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    financial_profile_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="SET NULL"),
        nullable=True
    )

    # Notification details
    notification_type: Mapped[NotificationType] = mapped_column(
        StringEnum(NotificationType),
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[NotificationStatus] = mapped_column(
        StringEnum(NotificationStatus),
        default=NotificationStatus.UNREAD,
        nullable=False
    )
    priority: Mapped[int] = mapped_column(Integer, default=5, nullable=False)  # 1-10

    # Action
    action_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Related entity
    related_entity_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    related_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )

    # Delivery tracking
    sent_via_email: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sent_via_push: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Expiration and read tracking
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="notifications")
    financial_profile: Mapped[Optional["FinancialProfile"]] = relationship()

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, type={self.notification_type.value}, status={self.status.value})>"
