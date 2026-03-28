# app/schemas/smart_import.py
"""
Pydantic schemas for the Smart CSV Import feature.
Covers the preview and confirm endpoints.
"""
from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import Field

from app.schemas.base import CamelCaseModel


# ---------------------------------------------------------------------------
# Nested models
# ---------------------------------------------------------------------------

class DetectedFormatResponse(CamelCaseModel):
    """Format auto-detected from the uploaded CSV."""
    encoding: str
    separator: str
    date_format: str
    column_mapping: Dict[str, str]
    header_row: int


class ClassificationInfo(CamelCaseModel):
    """Auto-classification result for a single transaction."""
    category: str
    merchant: Optional[str] = None
    confidence: float
    transaction_type: str
    match_method: str


class ReconciliationInfo(CamelCaseModel):
    """Reconciliation result for a single transaction."""
    action: str  # "skip" | "flag" | "import"
    reason: str
    confidence: float = 0.0
    matched_transaction_id: Optional[str] = None


class PreviewTransaction(CamelCaseModel):
    """A single parsed transaction shown in the preview step."""
    row_number: int
    date: date
    description: str
    original_description: str
    amount: float
    balance: Optional[float] = None
    currency: str = "EUR"
    classification: ClassificationInfo
    reconciliation: ReconciliationInfo
    is_parseable: bool = True
    parse_warnings: List[str] = Field(default_factory=list)


class PreviewSummary(CamelCaseModel):
    """Aggregate stats for the preview response."""
    total_rows: int
    parsed_rows: int
    to_import: int
    duplicates: int
    needs_review: int
    parse_errors: int


# ---------------------------------------------------------------------------
# Preview endpoint
# ---------------------------------------------------------------------------

class SmartImportPreviewResponse(CamelCaseModel):
    """Response from POST /api/v1/import/csv/preview."""
    job_id: str
    detected_format: DetectedFormatResponse
    preview_transactions: List[PreviewTransaction]
    summary: PreviewSummary
    warnings: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Confirm endpoint
# ---------------------------------------------------------------------------

class TransactionOverride(CamelCaseModel):
    """User override for a single row."""
    category: Optional[str] = None
    action: Optional[str] = None  # "import" | "skip"


class SmartImportConfirmRequest(CamelCaseModel):
    """Request body for POST /api/v1/import/csv/confirm."""
    job_id: str
    user_overrides: Optional[Dict[str, TransactionOverride]] = None
    import_flagged: bool = False
    excluded_rows: List[int] = Field(default_factory=list)
    invert_amounts: bool = False


class SmartImportConfirmResponse(CamelCaseModel):
    """Response from POST /api/v1/import/csv/confirm."""
    job_id: str
    status: str
    imported: int
    skipped_duplicates: int
    flagged_for_review: int
    errors: int
