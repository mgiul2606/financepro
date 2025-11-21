# app/models/document.py
"""Document model for OCR processing - FinancePro v2.1"""
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import DocumentType


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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True
    )

    # Document information
    document_type = Column(StringEnum(DocumentType), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)  # SHA256

    # OCR processing
    ocr_processed = Column(Boolean, default=False, nullable=False, index=True)
    ocr_text = Column(Text, nullable=True)
    extracted_data = Column(JSONB, nullable=True)
    confidence_score = Column(Numeric(5, 4), nullable=True)  # 0-1

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="documents")
    transaction = relationship("Transaction", back_populates="documents")

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, type={self.document_type.value}, ocr={self.ocr_processed})>"
