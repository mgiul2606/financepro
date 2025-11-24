# app/models/bank_condition.py
"""Bank conditions model for tracking contract terms - FinancePro v2.1"""
from sqlalchemy import Column, String, DateTime, Text, Date, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    account_id = Column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="SET NULL"),
        nullable=True
    )
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True
    )

    # Bank information
    institution_name = Column(String(255), nullable=False)
    effective_date = Column(Date, nullable=False)

    # Rates and fees
    interest_rate = Column(Numeric(5, 2), nullable=True)  # Annual %
    annual_fee = Column(Numeric(10, 2), nullable=True)
    transaction_fees = Column(JSONB, nullable=True)

    # Conditions
    conditions_summary = Column(Text, nullable=True)
    full_conditions = Column(JSONB, nullable=True)
    changes_from_previous = Column(Text, nullable=True)

    # Cost analysis
    annual_cost_estimate = Column(Numeric(10, 2), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="bank_conditions")
    account = relationship("Account", back_populates="bank_conditions")
    document = relationship("Document")

    def __repr__(self) -> str:
        return f"<BankCondition(id={self.id}, bank='{self.institution_name}')>"
