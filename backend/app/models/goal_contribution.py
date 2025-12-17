# app/models/goal_contribution.py
"""Goal contribution model for tracking savings - FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
import uuid

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.financial_goal import FinancialGoal
    from app.models.transaction import Transaction


class GoalContribution(Base):
    """
    Individual contributions/deposits to financial goals.

    Child of financial_goals.

    Attributes:
        id: UUID primary key
        goal_id: Parent goal
        transaction_id: Associated transaction (optional)
        amount: Contribution amount (always positive)
        contribution_date: Contribution date
        notes: Notes
    """

    __tablename__ = "goal_contributions"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign keys
    goal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_goals.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True
    )

    # Contribution details
    amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False
    )  # Always positive
    contribution_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    goal: Mapped["FinancialGoal"] = relationship(back_populates="contributions")
    transaction: Mapped[Optional["Transaction"]] = relationship()

    def __repr__(self) -> str:
        return f"<GoalContribution(id={self.id}, goal_id={self.goal_id}, amount={self.amount})>"
