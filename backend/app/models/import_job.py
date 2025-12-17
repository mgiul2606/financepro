# app/models/import_job.py
"""Import Job model for FinancePro v2.1 using SQLAlchemy 2.0 syntax."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Optional
import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import StringEnum
from app.models.enums import ImportStatus, ImportType

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.financial_profile import FinancialProfile


class ImportJob(Base):
    """
    Batch import job tracking (CSV, Excel, OFX, API).

    PROFILE-level entity.

    Based on FinancePro Database Technical Documentation v2.1

    Attributes:
        id: UUID primary key
        financial_profile_id: Profile owner
        account_id: Target account (if applicable)
        file_name: Imported filename
        file_path: File storage path
        import_type: Type of import
        status: Job status
        total_rows: Total rows/records to import
        processed_rows: Rows processed
        successful_imports: Successful imports
        failed_imports: Failed imports
        skipped_duplicates: Duplicates skipped
        error_message: Error message (if failed)
        error_details: Per-row error details
        mapping_config: Column mapping configuration
        started_at: Processing start timestamp
        completed_at: Completion timestamp
        created_at: Job creation timestamp
        updated_at: Last update timestamp

    Relationships:
        financial_profile: Financial profile this import belongs to
        account: Account this import is for (if account-specific)
    """

    __tablename__ = "import_jobs"

    # Primary key - UUID for security
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
        nullable=True,
        index=True
    )

    # Import information
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    import_type: Mapped[ImportType] = mapped_column(
        StringEnum(ImportType),
        nullable=False,
        index=True
    )

    # Status
    status: Mapped[ImportStatus] = mapped_column(
        StringEnum(ImportStatus),
        default=ImportStatus.PENDING,
        nullable=False,
        index=True
    )

    # Progress tracking
    total_rows: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    processed_rows: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    successful_imports: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    failed_imports: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    skipped_duplicates: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Error tracking
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_details: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )

    # Configuration
    mapping_config: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )

    # Timestamps
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
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
        back_populates="import_jobs"
    )
    account: Mapped[Optional["Account"]] = relationship(back_populates="import_jobs")

    @property
    def progress_percentage(self) -> float:
        """Calculate the progress percentage of the import job."""
        if not self.total_rows or self.total_rows == 0:
            return 0.0
        return ((self.processed_rows or 0) / self.total_rows) * 100

    def __repr__(self) -> str:
        return (
            f"<ImportJob(id={self.id}, "
            f"type={self.import_type.value}, "
            f"status={self.status.value}, "
            f"progress={self.processed_rows or 0}/{self.total_rows or 0})>"
        )
