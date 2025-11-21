# app/models/tag.py
"""Tag model - USER-level for FinancePro v2.1"""
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import TagType


# Association table for many-to-many relationship between Transaction and Tag
transaction_tags = Table(
    "transaction_tags",
    Base.metadata,
    Column("transaction_id", UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
)


class Tag(Base):
    """
    User-defined tags for multi-dimensional transaction classification.

    USER-level entity (shared across profiles).

    Based on FinancePro Database Technical Documentation v2.1

    Tag Types:
    - contextual: #work, #personal, #family
    - functional: #deductible, #reimbursable
    - temporal: #recurring, #seasonal
    - emotional: #urgent, #luxury
    - custom: User-defined

    Attributes:
        id: UUID primary key
        user_id: Tag owner (USER-LEVEL)
        name: Tag name (must start with #)
        tag_type: Type of tag
        color: HEX color for UI
        description: Optional description
    """
    __tablename__ = "tags"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key - USER level (shared across profiles)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Tag information
    name = Column(String(50), nullable=False)  # Must start with #
    tag_type = Column(StringEnum(TagType), default=TagType.CUSTOM, nullable=False)
    color = Column(String(7), nullable=True)  # HEX #RRGGBB
    description = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="tags")
    transactions = relationship(
        "Transaction",
        secondary=transaction_tags,
        back_populates="tags"
    )

    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name='{self.name}', type={self.tag_type.value})>"
