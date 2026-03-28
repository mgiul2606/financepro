# app/models/user_category_rule.py
"""User Category Rule model for adaptive categorization in FinancePro."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.financial_profile import FinancialProfile


class UserCategoryRule(Base):
    """
    User-specific categorization rules learned from corrections.

    When a user corrects or assigns a category to a transaction,
    the system learns the association and proposes it automatically
    for future similar transactions.

    Attributes:
        id: UUID primary key
        financial_profile_id: Profile owning this rule (for RLS)
        match_type: Type of match ('exact_description', 'contains_keyword', 'merchant_name')
        match_value: The value to match against (normalized)
        category_id: The category to assign when matched
        times_applied: How many times this rule has been applied
        last_applied_at: Last time the rule was applied
        source: Origin of the rule ('user_correction', 'manual_assignment', 'import_override')
    """

    __tablename__ = "user_category_rules"

    __table_args__ = (
        UniqueConstraint(
            "financial_profile_id", "match_type", "match_value",
            name="ix_user_category_rules_profile_match",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    financial_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    match_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    match_value: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
    )

    times_applied: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )

    last_applied_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="user_correction",
        server_default="user_correction",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    financial_profile: Mapped["FinancialProfile"] = relationship()
    category: Mapped["Category"] = relationship()

    def __repr__(self) -> str:
        return (
            f"<UserCategoryRule(id={self.id}, "
            f"match_type={self.match_type}, "
            f"match_value={self.match_value!r})>"
        )
