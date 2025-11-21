# app/api/v2/imports.py
"""
v2.1 Imports Router for FinancePro.

Uses ImportService with:
- CSV file import
- Duplicate detection
- Field mapping
- Batch import jobs
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Annotated, Optional, List
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.models.enums import ImportType, ImportStatus
from app.services.v2 import ImportService
from app.core.rls import get_rls_context
from app.api.dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter()


# Response models
class ImportJobResponse(BaseModel):
    id: str
    financial_profile_id: str
    account_id: Optional[str] = None
    file_name: str
    import_type: str
    status: str
    total_rows: Optional[int] = None
    processed_rows: Optional[int] = None
    successful_imports: Optional[int] = None
    failed_imports: Optional[int] = None
    skipped_duplicates: Optional[int] = None
    error_message: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None


class ImportResultResponse(BaseModel):
    total_rows: int
    successful: int
    failed: int
    duplicates: int
    errors: List[dict]


class ImportPreviewResponse(BaseModel):
    headers: List[str]
    total_rows: int
    preview_rows: List[dict]
    suggested_mapping: dict


class ImportJobListResponse(BaseModel):
    items: List[ImportJobResponse]
    total: int


def get_import_service(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
) -> ImportService:
    """Get import service with RLS context."""
    rls = get_rls_context(db, current_user.id)
    return ImportService(db, rls)


@router.get(
    "/",
    response_model=ImportJobListResponse,
    summary="List import jobs",
    description="List all import jobs for the user"
)
async def list_import_jobs(
    service: Annotated[ImportService, Depends(get_import_service)],
    profile_id: Optional[UUID] = Query(None, description="Filter by profile"),
    status: Optional[ImportStatus] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
) -> ImportJobListResponse:
    """List import jobs."""
    jobs = service.list_import_jobs(
        profile_id=profile_id,
        status=status,
        limit=limit,
        offset=offset
    )

    items = [
        ImportJobResponse(
            id=str(job.id),
            financial_profile_id=str(job.financial_profile_id),
            account_id=str(job.account_id) if job.account_id else None,
            file_name=job.file_name,
            import_type=job.import_type.value,
            status=job.status.value,
            total_rows=job.total_rows,
            processed_rows=job.processed_rows,
            successful_imports=job.successful_imports,
            failed_imports=job.failed_imports,
            skipped_duplicates=job.skipped_duplicates,
            error_message=job.error_message,
            created_at=job.created_at.isoformat(),
            completed_at=job.completed_at.isoformat() if job.completed_at else None
        )
        for job in jobs
    ]

    return ImportJobListResponse(items=items, total=len(items))


@router.post(
    "/preview",
    response_model=ImportPreviewResponse,
    summary="Preview CSV import",
    description="Preview CSV file before importing"
)
async def preview_import(
    service: Annotated[ImportService, Depends(get_import_service)],
    file: UploadFile = File(..., description="CSV file to preview"),
    mapping: Optional[str] = Form(None, description="JSON mapping config")
) -> ImportPreviewResponse:
    """Preview CSV import."""
    import json

    # Read file content
    content = await file.read()
    csv_content = content.decode('utf-8')

    # Parse mapping if provided
    mapping_config = json.loads(mapping) if mapping else None

    preview = service.preview_csv(
        csv_content=csv_content,
        mapping_config=mapping_config,
        max_rows=10
    )

    return ImportPreviewResponse(
        headers=preview['headers'],
        total_rows=preview['total_rows'],
        preview_rows=preview['preview_rows'],
        suggested_mapping=preview['suggested_mapping']
    )


@router.post(
    "/",
    response_model=ImportResultResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Import CSV file",
    description="Import transactions from CSV file"
)
async def import_csv(
    service: Annotated[ImportService, Depends(get_import_service)],
    file: UploadFile = File(..., description="CSV file to import"),
    profile_id: UUID = Form(..., description="Target financial profile ID"),
    account_id: Optional[UUID] = Form(None, description="Target account ID"),
    mapping: Optional[str] = Form(None, description="JSON mapping config"),
    skip_duplicates: bool = Form(True, description="Skip detected duplicates"),
    user_password: Optional[str] = Form(None, description="Password for HS profiles")
) -> ImportResultResponse:
    """Import CSV file."""
    import json

    # Read file content
    content = await file.read()
    csv_content = content.decode('utf-8')

    # Parse mapping if provided
    mapping_config = json.loads(mapping) if mapping else None

    # Create import job
    job = service.create_import_job(
        profile_id=profile_id,
        file_name=file.filename or "import.csv",
        file_path="",  # Not storing file
        import_type=ImportType.CSV,
        account_id=account_id,
        mapping_config=mapping_config
    )

    try:
        # Process import
        result = service.process_csv_import(
            job_id=job.id,
            csv_content=csv_content,
            user_password=user_password,
            skip_duplicates=skip_duplicates,
            auto_categorize=True
        )

        return ImportResultResponse(
            total_rows=result['total_rows'],
            successful=result['successful'],
            failed=result['failed'],
            duplicates=result['duplicates'],
            errors=result['errors']
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{job_id}",
    response_model=ImportJobResponse,
    summary="Get import job",
    description="Get import job by ID"
)
async def get_import_job(
    job_id: UUID,
    service: Annotated[ImportService, Depends(get_import_service)]
) -> ImportJobResponse:
    """Get import job by ID."""
    try:
        job = service.get_import_job(job_id)

        return ImportJobResponse(
            id=str(job.id),
            financial_profile_id=str(job.financial_profile_id),
            account_id=str(job.account_id) if job.account_id else None,
            file_name=job.file_name,
            import_type=job.import_type.value,
            status=job.status.value,
            total_rows=job.total_rows,
            processed_rows=job.processed_rows,
            successful_imports=job.successful_imports,
            failed_imports=job.failed_imports,
            skipped_duplicates=job.skipped_duplicates,
            error_message=job.error_message,
            created_at=job.created_at.isoformat(),
            completed_at=job.completed_at.isoformat() if job.completed_at else None
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete import job",
    description="Delete an import job"
)
async def delete_import_job(
    job_id: UUID,
    service: Annotated[ImportService, Depends(get_import_service)],
    delete_transactions: bool = Query(False, description="Also delete imported transactions")
) -> None:
    """Delete import job."""
    try:
        service.delete_import_job(job_id, delete_transactions=delete_transactions)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
