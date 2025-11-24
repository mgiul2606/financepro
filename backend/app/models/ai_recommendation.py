# app/models/ai_recommendation.py
"""AI recommendations model for optimization suggestions - FinancePro v2.1"""
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import ScopeType


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign key - USER level
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Scope pattern
    scope_type = Column(StringEnum(ScopeType), default=ScopeType.USER, nullable=False)
    scope_profile_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True)

    # Recommendation details
    recommendation_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    potential_savings = Column(Numeric(15, 2), nullable=True)  # €/month or €/year
    priority = Column(Integer, default=5, nullable=False)  # 1-10
    confidence_score = Column(Numeric(5, 4), nullable=False)  # 0-1

    # Related entity
    related_entity_type = Column(String(50), nullable=True)
    related_entity_id = Column(UUID(as_uuid=True), nullable=True)

    # Action items
    action_items = Column(JSONB, nullable=True)

    # User actions
    is_dismissed = Column(Boolean, default=False, nullable=False, index=True)
    is_implemented = Column(Boolean, default=False, nullable=False, index=True)
    user_feedback = Column(Text, nullable=True)

    # Expiration
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="ai_recommendations")

    def __repr__(self) -> str:
        return f"<AIRecommendation(id={self.id}, type='{self.recommendation_type}')>"
