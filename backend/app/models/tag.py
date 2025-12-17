# app/models/tag.py
"""Tag model - USER-level for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Table, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import TagType

if TYPE_CHECKING:
    from app.models.transaction import Transaction
    from app.models.user import User


# Association table for many-to-many relationship between Transaction and Tag
transaction_tags = Table(
    "transaction_tags",
    Base.metadata,
    Column(
        "transaction_id",
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        "tag_id",
        UUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        "created_at",
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
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
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign key - USER level (shared across profiles)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Tag information
    name: Mapped[str] = mapped_column(String(50), nullable=False)  # Must start with #
    tag_type: Mapped[TagType] = mapped_column(
        StringEnum(TagType),
        default=TagType.CUSTOM,
        nullable=False
    )
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)  # HEX #RRGGBB
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="tags")
    transactions: Mapped[List["Transaction"]] = relationship(
        secondary=transaction_tags,
        back_populates="tags"
    )

    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name='{self.name}', type={self.tag_type.value})>"
