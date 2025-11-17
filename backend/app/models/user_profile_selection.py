# app/models/user_profile_selection.py
from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


class UserProfileSelection(Base):
    """
    User Profile Selection model for storing active profile selections.

    Stores which profiles a user has currently selected for multi-profile operations.
    This allows users to view/analyze multiple profiles simultaneously.

    Attributes:
        id: UUID primary key
        user_id: Owner of the selection
        active_profile_ids: Array of profile IDs currently selected
        created_at: Selection creation timestamp
        updated_at: Last update timestamp

    Relationships:
        user: The user who owns this selection
    """
    __tablename__ = "user_profile_selections"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key to User (one-to-one relationship)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)

    # Array of active profile IDs (PostgreSQL ARRAY type)
    active_profile_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=False, default=list)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="profile_selection")

    def __repr__(self) -> str:
        return f"<UserProfileSelection(user_id={self.user_id}, active_profiles={len(self.active_profile_ids)})>"
