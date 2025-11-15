# app/models/import_job.py
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
import uuid
from app.db.database import Base


class ImportType(str, enum.Enum):
    """Types of import sources"""
    CSV = "csv"
    OCR = "ocr"
    BANK_API = "bank_api"


class ImportStatus(str, enum.Enum):
    """Status of import job"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ImportJob(Base):
    """
    Import Job model for tracking data import operations.

    This model tracks the progress and status of bulk data imports from
    various sources (CSV files, OCR, bank APIs).

    Attributes:
        id: UUID primary key
        financial_profile_id: Foreign key to FinancialProfile
        account_id: Foreign key to Account (nullable, for account-specific imports)
        import_type: Type of import source (CSV, OCR, BANK_API)
        file_name: Original filename or identifier
        file_url: URL or path to the imported file
        status: Current status of the import job
        total_records: Total number of records to import
        processed_records: Number of records processed so far
        successful_records: Number of successfully imported records
        failed_records: Number of failed records
        error_details: JSONB containing error information
        mapping_config: JSONB containing field mapping configuration
        created_at: When the import job was created
        completed_at: When the import job finished (nullable)

    Relationships:
        financial_profile: Financial profile this import belongs to
        account: Account this import is for (if account-specific)
    """
    __tablename__ = "import_jobs"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id"),
        nullable=False,
        index=True
    )
    account_id = Column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id"),
        nullable=True,
        index=True
    )

    # Import information
    import_type = Column(SQLEnum(ImportType), nullable=False, index=True)
    file_name = Column(String(255), nullable=True)
    file_url = Column(String(500), nullable=True)

    # Status
    status = Column(SQLEnum(ImportStatus), default=ImportStatus.PENDING, nullable=False, index=True)

    # Progress tracking
    total_records = Column(Integer, default=0, nullable=False)
    processed_records = Column(Integer, default=0, nullable=False)
    successful_records = Column(Integer, default=0, nullable=False)
    failed_records = Column(Integer, default=0, nullable=False)

    # Error tracking and configuration
    error_details = Column(JSONB, nullable=True)
    mapping_config = Column(JSONB, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="import_jobs")
    account = relationship("Account", back_populates="import_jobs")

    @property
    def progress_percentage(self) -> float:
        """
        Calculate the progress percentage of the import job.

        Returns:
            float: Progress percentage (0-100)
        """
        if self.total_records == 0:
            return 0.0
        return (self.processed_records / self.total_records) * 100

    def __repr__(self) -> str:
        return (
            f"<ImportJob(id={self.id}, "
            f"type={self.import_type.value}, "
            f"status={self.status.value}, "
            f"progress={self.processed_records}/{self.total_records})>"
        )
