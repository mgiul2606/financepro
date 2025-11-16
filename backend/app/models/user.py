# app/models/user.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base


class User(Base):
    """
    User model representing the main application user.

    Attributes:
        id: Integer primary key (auto-increment)
        email: Unique email address
        hashed_password: Bcrypt hashed password
        is_active: Whether the user account is active
        created_at: Account creation timestamp

    Relationships:
        financial_profiles: All financial profiles owned by this user
        audit_logs: Audit logs related to this user
        chat_conversations: Chat conversations initiated by this user
    """
    __tablename__ = "users"

    # Primary key - Integer auto-increment
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Authentication
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # Status flags
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

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