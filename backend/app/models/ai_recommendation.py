# app/models/ai_recommendation.py
"""AI recommendations model for optimization suggestions - FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Optional
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import ScopeType

if TYPE_CHECKING:
    from app.models.user import User


class AIRecommendation(Base):
    """
    AI optimization recommendations.

    USER-level entity with SCOPE pattern.

    Attributes:
        id: UUID primary key
        user_id: Recommendation owner
        scope_type: Scope (user/profile/multi_profile)
        scope_profile_ids: Array of profile IDs for scope
        recommendation_type: Type of recommendation
        title: Recommendation title
        description: Detailed description
        potential_savings: Estimated savings
        priority: Priority (1-10)
        confidence_score: AI confidence (0-1)
        related_entity_type: Related entity type
        related_entity_id: Related entity ID
        action_items: Suggested actions (JSONB)
        is_dismissed: User dismissed flag
        is_implemented: User implemented flag
        user_feedback: User feedback
        expires_at: Recommendation expiration
    """

    __tablename__ = "ai_recommendations"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign key - USER level
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Scope pattern
    scope_type: Mapped[ScopeType] = mapped_column(
        StringEnum(ScopeType),
        default=ScopeType.USER,
        nullable=False
    )
    scope_profile_ids: Mapped[Optional[list[uuid.UUID]]] = mapped_column(
        ARRAY(UUID(as_uuid=True)),
        nullable=True
    )

    # Recommendation details
    recommendation_type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    potential_savings: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(15, 2),
        nullable=True
    )  # €/month or €/year
    priority: Mapped[int] = mapped_column(Integer, default=5, nullable=False)  # 1-10
    confidence_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 4),
        nullable=False
    )  # 0-1

    # Related entity
    related_entity_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    related_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )

    # Action items
    action_items: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )

    # User actions
    is_dismissed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True
    )
    is_implemented: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True
    )
    user_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Expiration
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

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
    user: Mapped["User"] = relationship(back_populates="ai_recommendations")

    def __repr__(self) -> str:
        return f"<AIRecommendation(id={self.id}, type='{self.recommendation_type}')>"
