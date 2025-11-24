# app/models/notification.py
"""Notification model for user alerts - FinancePro v2.1"""
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import NotificationType, NotificationStatus


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="SET NULL"),
        nullable=True
    )

    # Notification details
    notification_type = Column(StringEnum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(StringEnum(NotificationStatus), default=NotificationStatus.UNREAD, nullable=False)
    priority = Column(Integer, default=5, nullable=False)  # 1-10

    # Action
    action_url = Column(String(500), nullable=True)

    # Related entity
    related_entity_type = Column(String(50), nullable=True)
    related_entity_id = Column(UUID(as_uuid=True), nullable=True)

    # Delivery tracking
    sent_via_email = Column(Boolean, default=False, nullable=False)
    sent_via_push = Column(Boolean, default=False, nullable=False)

    # Expiration and read tracking
    expires_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")
    financial_profile = relationship("FinancialProfile")

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, type={self.notification_type.value}, status={self.status.value})>"
