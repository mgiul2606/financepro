# app/models/goal_contribution.py
"""Goal contribution model for tracking savings - FinancePro v2.1"""
from sqlalchemy import Column, String, DateTime, Date, Text, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    goal_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_goals.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True
    )

    # Contribution details
    amount = Column(Numeric(15, 2), nullable=False)  # Always positive
    contribution_date = Column(Date, nullable=False, index=True)
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    goal = relationship("FinancialGoal", back_populates="contributions")
    transaction = relationship("Transaction")

    def __repr__(self) -> str:
        return f"<GoalContribution(id={self.id}, goal_id={self.goal_id}, amount={self.amount})>"
