# app/models/document.py
"""Document model for OCR processing - FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Optional
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import DocumentType

if TYPE_CHECKING:
    from app.models.financial_profile import FinancialProfile
    from app.models.transaction import Transaction


class Document(Base):
    """
    Scanned/uploaded documents (receipts, invoices, contracts) with OCR processing.

    PROFILE-level entity.

    Attributes:
        id: UUID primary key
        financial_profile_id: Profile owner
        transaction_id: Associated transaction
        document_type: Type of document
        file_name: Original filename
        file_path: Storage path (S3/local)
        file_size: File size in bytes
        mime_type: MIME type
        file_hash: SHA256 hash
        ocr_processed: OCR completion flag
        ocr_text: Full extracted text
        extracted_data: Structured extracted data (JSONB)
        confidence_score: OCR confidence (0-1)
    """

    __tablename__ = "documents"

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
    transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True
    )

    # Document information
    document_type: Mapped[DocumentType] = mapped_column(
        StringEnum(DocumentType),
        nullable=False
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True
    )  # SHA256

    # OCR processing
    ocr_processed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True
    )
    ocr_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extracted_data: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )
    confidence_score: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 4),
        nullable=True
    )  # 0-1

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
        back_populates="documents"
    )
    transaction: Mapped[Optional["Transaction"]] = relationship(
        back_populates="documents"
    )

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, type={self.document_type.value}, ocr={self.ocr_processed})>"
