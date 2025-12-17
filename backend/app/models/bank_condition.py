# app/models/bank_condition.py
"""Bank conditions model for tracking contract terms - FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Optional
import uuid

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.document import Document
    from app.models.financial_profile import FinancialProfile


class BankCondition(Base):
    """
    Bank account contract terms (rates, fees) with historical tracking.

    PROFILE-level entity.

    Attributes:
        id: UUID primary key
        financial_profile_id: Profile owner
        account_id: Associated account
        institution_name: Bank name
        document_id: Contract document (if OCR)
        effective_date: Effective date of conditions
        interest_rate: Annual interest rate %
        annual_fee: Annual account fee
        transaction_fees: Transaction fees (JSONB)
        conditions_summary: Human-readable summary
        full_conditions: Complete structured conditions
        changes_from_previous: Diff from previous version
        annual_cost_estimate: Estimated annual cost
    """

    __tablename__ = "bank_conditions"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign keys
    financial_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="SET NULL"),
        nullable=True
    )
    document_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True
    )

    # Bank information
    institution_name: Mapped[str] = mapped_column(String(255), nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Rates and fees
    interest_rate: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2),
        nullable=True
    )  # Annual %
    annual_fee: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2),
        nullable=True
    )
    transaction_fees: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )

    # Conditions
    conditions_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    full_conditions: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )
    changes_from_previous: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Cost analysis
    annual_cost_estimate: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2),
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
    financial_profile: Mapped["FinancialProfile"] = relationship(
        back_populates="bank_conditions"
    )
    account: Mapped[Optional["Account"]] = relationship(
        back_populates="bank_conditions"
    )
    document: Mapped[Optional["Document"]] = relationship()

    def __repr__(self) -> str:
        return f"<BankCondition(id={self.id}, bank='{self.institution_name}')>"
