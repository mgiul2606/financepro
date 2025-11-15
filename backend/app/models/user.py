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

    Attributes:
        id: UUID primary key (for security, not incremental)
        email: Unique email address
        hashed_password: Bcrypt hashed password
        full_name: User's full name
        is_active: Whether the user account is active
        is_verified: Whether the email has been verified
        created_at: Account creation timestamp
        updated_at: Last update timestamp
        last_login_at: Last successful login timestamp

    Relationships:
        financial_profiles: All financial profiles owned by this user
        audit_logs: Audit logs related to this user
        chat_conversations: Chat conversations initiated by this user
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

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    last_login_at = Column(DateTime, nullable=True)

    # Relationships
    financial_profiles = relationship(
        "FinancialProfile",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    chat_conversations = relationship("ChatConversation", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"