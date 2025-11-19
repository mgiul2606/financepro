# app/models/audit_log.py
from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
import uuid
from app.db.database import Base
from app.db.types import StringEnum


class EventType(str, enum.Enum):
    """Types of audit events"""
    ACCESS = "access"
    SECURITY = "security"
    FINANCIAL_OP = "financial_op"
    AI_INTERACTION = "ai_interaction"
    SYSTEM = "system"


class SeverityLevel(str, enum.Enum):
    """Severity levels for audit events"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AuditLog(Base):
    """
    Audit Log model for tracking all system events.

    This model provides comprehensive audit trail for security, compliance,
    and debugging purposes. All significant events in the system are logged here.

    Attributes:
        id: UUID primary key
        user_id: Foreign key to User (nullable for system events)
        financial_profile_id: Foreign key to FinancialProfile (nullable)
        event_type: Type of event (ACCESS, SECURITY, FINANCIAL_OP, AI_INTERACTION, SYSTEM)
        entity_type: Type of entity affected (e.g., "Transaction", "Account")
        entity_id: UUID of the affected entity
        action: Action performed (e.g., "create", "update", "delete", "view")
        details: Additional data in JSONB format
        ip_address: IP address of the client
        user_agent: User agent string from the client
        device_info: Device information (parsed from user agent)
        timestamp: When the event occurred
        severity: Severity level of the event

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
    entity_type = Column(String(100), nullable=True, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)

    # Details and metadata
    details = Column(JSONB, nullable=True)

    # Request context
    ip_address = Column(String(45), nullable=True)  # IPv6 max length is 45
    user_agent = Column(Text, nullable=True)
    device_info = Column(String(255), nullable=True)

    # Timestamp and severity
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    severity = Column(StringEnum(SeverityLevel), default=SeverityLevel.INFO, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    financial_profile = relationship("FinancialProfile", back_populates="audit_logs")

    def __repr__(self) -> str:
        return (
            f"<AuditLog(id={self.id}, "
            f"event_type={self.event_type.value}, "
            f"action='{self.action}', "
            f"timestamp={self.timestamp})>"
        )
