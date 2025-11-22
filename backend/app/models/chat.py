# app/models/chat.py
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import MessageRole


class ChatConversation(Base):
    """
    AI assistant chat conversations.

    USER-level entity with optional profile context.

    Based on FinancePro Database Technical Documentation v2.1

    Attributes:
        id: UUID primary key
        user_id: Conversation owner
        financial_profile_id: Profile context (optional)
        title: Conversation title (auto from first message)
        summary: AI-generated summary
        is_archived: Archive flag
        created_at: Conversation creation timestamp
        updated_at: Last message timestamp

    Relationships:
        user: User who owns this conversation
        financial_profile: Financial profile context (if applicable)
        messages: All messages in this conversation
    """
    __tablename__ = "chat_conversations"

    # Primary key - UUID for security
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
        nullable=True,
        index=True
    )

    # Conversation information
    title = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)

    # Status
    is_archived = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="chat_conversations")
    financial_profile = relationship("FinancialProfile", back_populates="chat_conversations")
    messages = relationship(
        "ChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )

    def __repr__(self) -> str:
        return (
            f"<ChatConversation(id={self.id}, "
            f"title='{self.title}', "
            f"archived={self.is_archived})>"
        )


class ChatMessage(Base):
    """
    Individual chat messages.

    Child of chat_conversations.

    Based on FinancePro Database Technical Documentation v2.1

    Attributes:
        id: UUID primary key
        conversation_id: Parent conversation
        role: Message role (user/assistant/system)
        content: Message text
        tokens_used: Tokens used
        model_name: LLM model used
        processing_time_ms: Response generation time
        metadata: Charts, query results, etc.
        created_at: Message timestamp

    Relationships:
        conversation: Conversation this message belongs to
    """
    __tablename__ = "chat_messages"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Message information
    role = Column(StringEnum(MessageRole), nullable=False, index=True)
    content = Column(Text, nullable=False)

    # LLM tracking
    tokens_used = Column(Integer, nullable=True)
    model_name = Column(String(50), nullable=True)
    processing_time_ms = Column(Integer, nullable=True)

    # Additional data (charts, query results, etc.)
    metadata = Column(JSONB, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    conversation = relationship("ChatConversation", back_populates="messages")

    def __repr__(self) -> str:
        content_preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return (
            f"<ChatMessage(id={self.id}, "
            f"role={self.role.value}, "
            f"content='{content_preview}')>"
        )
