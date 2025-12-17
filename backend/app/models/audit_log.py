# app/models/audit_log.py
"""Audit Log model for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Optional
import uuid

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import EventType, SeverityLevel

if TYPE_CHECKING:
    from app.models.financial_profile import FinancialProfile
    from app.models.user import User


class AuditLog(Base):
    """
    Immutable audit log for security and compliance. Append-only.

    Based on FinancePro Database Technical Documentation v2.1

    Event types:
    - access: Login, logout, password change
    - security: Failed logins, password resets, 2FA changes
    - financial_op: Create/update/delete transactions, accounts
    - ai_interaction: Chat queries, recommendations
    - system: Scheduled jobs, imports, exports
    - user_action: Profile changes, settings
    - data_export: Data exports

    Attributes:
        id: UUID primary key
        user_id: Actor (NULL for system events)
        financial_profile_id: Profile context
        event_type: Event type
        severity: Severity level
        action: Action performed
        entity_type: Entity type affected
        entity_id: Entity ID affected
        old_values: Previous state
        new_values: New state
        ip_address: Client IP
        user_agent: Client user agent
        device_info: Parsed device info
        geolocation: Location from IP
        session_id: Session correlation
        request_id: Request correlation
        created_at: Event timestamp

    Relationships:
        user: User who triggered the event (if applicable)
        financial_profile: Financial profile context (if applicable)
    """

    __tablename__ = "audit_logs"

    # Primary key - UUID for security
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign keys
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    financial_profile_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Event information
    event_type: Mapped[EventType] = mapped_column(
        StringEnum(EventType),
        nullable=False,
        index=True
    )
    severity: Mapped[SeverityLevel] = mapped_column(
        StringEnum(SeverityLevel),
        default=SeverityLevel.INFO,
        nullable=False,
        index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True
    )
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )

    # State tracking
    old_values: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    new_values: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Request context
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True
    )  # IPv6 max length is 45
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    device_info: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )  # Parsed device info as JSON
    geolocation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Correlation IDs
    session_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )
    request_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="audit_logs")
    financial_profile: Mapped[Optional["FinancialProfile"]] = relationship(
        back_populates="audit_logs"
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog(id={self.id}, "
            f"event_type={self.event_type.value}, "
            f"action='{self.action}', "
            f"severity={self.severity.value})>"
        )
