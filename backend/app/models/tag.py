# app/models/tag.py
from sqlalchemy import Column, String, ForeignKey, DateTime, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
import uuid
from app.db.database import Base
from app.db.types import StringEnum


class TagType(str, enum.Enum):
    """Types of tags for multi-dimensional classification"""
    CONTEXTUAL = "contextual"  # #lavoro, #personale, #famiglia
    FUNCTIONAL = "functional"  # #deducibile, #rimborsabile, #condiviso
    TEMPORAL = "temporal"  # #ricorrente, #stagionale, #una-tantum
    EMOTIONAL = "emotional"  # #urgente, #voluttuario, #necessario


# Association table for many-to-many relationship between Transaction and Tag
transaction_tags = Table(
    "transaction_tags",
    Base.metadata,
    Column("transaction_id", UUID(as_uuid=True), ForeignKey("transactions.id"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id"), primary_key=True),
    Column("created_at", DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
)


class Tag(Base):
    """
    Tag model for multi-dimensional transaction classification.

    Tags provide additional context beyond categories:
    - Contextual: #lavoro, #personale, #famiglia
    - Functional: #deducibile, #rimborsabile, #condiviso
    - Temporal: #ricorrente, #stagionale, #una-tantum
    - Emotional: #urgente, #voluttuario, #necessario

    Attributes:
        id: UUID primary key
        financial_profile_id: Foreign key to FinancialProfile
        name: Tag name (without #, will be added in UI)
        tag_type: Type of tag (contextual, functional, temporal, emotional)
        color: Hex color code for UI
        created_at: Creation timestamp

    Relationships:
        financial_profile: Parent financial profile
        transactions: Transactions with this tag
    """
    __tablename__ = "tags"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id"),
        nullable=False,
        index=True
    )

    # Tag information
    name = Column(String(50), nullable=False)  # e.g., "lavoro", "deducibile"
    tag_type = Column(StringEnum(TagType), nullable=False, index=True)
    color = Column(String(7), nullable=True)  # hex color code

    # Timestamp
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="tags")
    transactions = relationship(
        "Transaction",
        secondary=transaction_tags,
        back_populates="tags"
    )

    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name='#{self.name}', type={self.tag_type.value})>"
