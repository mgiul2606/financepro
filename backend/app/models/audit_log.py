# app/models/audit_log.py
from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import EventType, SeverityLevel


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Event information
    event_type = Column(StringEnum(EventType), nullable=False, index=True)
    severity = Column(StringEnum(SeverityLevel), default=SeverityLevel.INFO, nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=True, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True)

    # State tracking
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)

    # Request context
    ip_address = Column(String(45), nullable=True)  # IPv6 max length is 45
    user_agent = Column(Text, nullable=True)
    device_info = Column(JSONB, nullable=True)  # Parsed device info as JSON
    geolocation = Column(String(100), nullable=True)

    # Correlation IDs
    session_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    request_id = Column(UUID(as_uuid=True), nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    financial_profile = relationship("FinancialProfile", back_populates="audit_logs")

    def __repr__(self) -> str:
        return (
            f"<AuditLog(id={self.id}, "
            f"event_type={self.event_type.value}, "
            f"action='{self.action}', "
            f"severity={self.severity.value})>"
        )
