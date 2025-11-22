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
    Audit Log model for tracking all system events.

    Based on FinancePro Database Technical Documentation v2.1

    This model provides comprehensive audit trail for security, compliance,
    and debugging purposes. All significant events in the system are logged here.

    Attributes:
        id: UUID primary key
        user_id: Foreign key to User (nullable for system events)
        financial_profile_id: Foreign key to FinancialProfile (nullable)
        event_type: Type of event
        severity: Severity level (info, warning, error, critical)
        action: Action performed
        entity_type: Type of entity affected
        entity_id: UUID of the affected entity
        old_values: Previous values (for UPDATE)
        new_values: New values (for INSERT/UPDATE)
        ip_address: Client IP address
        user_agent: User agent string
        device_info: Device information (JSONB)
        geolocation: Approximate geolocation
        session_id: Session ID for correlation
        request_id: Request ID for distributed tracing
        created_at: When the event occurred (immutable)

    Relationships:
        user: User who triggered the event
        financial_profile: Financial profile context
    """
    __tablename__ = "audit_logs"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id"),
        nullable=True,
        index=True
    )

    # Event information
    event_type = Column(StringEnum(EventType), nullable=False, index=True)
    severity = Column(StringEnum(SeverityLevel), default=SeverityLevel.INFO, nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=True, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    # Change tracking
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)

    # Request context
    ip_address = Column(String(45), nullable=True)  # IPv6 max length is 45
    user_agent = Column(String(500), nullable=True)
    device_info = Column(JSONB, nullable=True)
    geolocation = Column(String(100), nullable=True)
    session_id = Column(String(255), nullable=True)
    request_id = Column(String(255), nullable=True)

    # Timestamp (immutable)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    financial_profile = relationship("FinancialProfile", back_populates="audit_logs")

    def __repr__(self) -> str:
        return (
            f"<AuditLog(id={self.id}, "
            f"event_type={self.event_type.value}, "
            f"action='{self.action}', "
            f"created_at={self.created_at})>"
        )
