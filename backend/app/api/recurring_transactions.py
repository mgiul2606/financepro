# app/api/recurring_transactions.py
"""
Recurring Transactions Router for FinancePro API v1.

PROFILE-level entity. Uses direct DB queries following the assets.py pattern.
"""
from app.api.utils import children_for, get_by_id
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Annotated, Optional
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.models.financial_profile import FinancialProfile
from app.models.recurring_transaction import RecurringTransaction
from app.schemas.recurring_transaction import (
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
    RecurringTransactionResponse,
    RecurringTransactionListResponse,
)
from app.api.dependencies import get_current_user


def validate_profile_ids(db: Session, current_user: User, profile_ids: list[UUID] | None) -> list[UUID]:
    return children_for(db, User, FinancialProfile, current_user.id, profile_ids, transform=lambda o: o.id)


def validate_profile_id(db: Session, current_user: User, profile_id: UUID) -> UUID:
    return children_for(db, User, FinancialProfile, current_user.id, profile_id, transform=lambda o: o.id)


router = APIRouter()


@router.get(
    "/",
    response_model=RecurringTransactionListResponse,
    summary="List recurring transactions",
    description="Retrieve all recurring transactions for the authenticated user",
)
async def list_recurring_transactions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    profile_id: Annotated[Optional[UUID], Query(description="Filter by financial profile ID")] = None,
) -> RecurringTransactionListResponse:
    """List all recurring transactions for the current user."""
    if profile_id:
        validate_profile_id(db, current_user, profile_id)
        items = db.query(RecurringTransaction).filter(
            RecurringTransaction.financial_profile_id == profile_id
        ).all()
    else:
        profile_ids = validate_profile_ids(db, current_user, None)
        items = db.query(RecurringTransaction).filter(
            RecurringTransaction.financial_profile_id.in_(profile_ids)
        ).all()

    return RecurringTransactionListResponse(items=items, total=len(items))


@router.post(
    "/",
    response_model=RecurringTransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create recurring transaction",
)
async def create_recurring_transaction(
    data_in: RecurringTransactionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> RecurringTransactionResponse:
    """Create a new recurring transaction."""
    validate_profile_id(db, current_user, data_in.financial_profile_id)

    item_data = data_in.model_dump()
    # Set next_occurrence_date to start_date initially
    item_data["next_occurrence_date"] = item_data["start_date"]
    item = RecurringTransaction(**item_data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get(
    "/{recurring_id}",
    response_model=RecurringTransactionResponse,
    summary="Get recurring transaction by ID",
)
async def get_recurring_transaction(
    recurring_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> RecurringTransactionResponse:
    """Get a recurring transaction by ID."""
    item: RecurringTransaction = get_by_id(db, RecurringTransaction, recurring_id)
    validate_profile_id(db, current_user, item.financial_profile_id)
    return item


@router.patch(
    "/{recurring_id}",
    response_model=RecurringTransactionResponse,
    summary="Update recurring transaction",
)
async def update_recurring_transaction(
    recurring_id: UUID,
    data_in: RecurringTransactionUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> RecurringTransactionResponse:
    """Update an existing recurring transaction."""
    item: RecurringTransaction = get_by_id(db, RecurringTransaction, recurring_id)
    validate_profile_id(db, current_user, item.financial_profile_id)

    update_data = data_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete(
    "/{recurring_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete recurring transaction",
)
async def delete_recurring_transaction(
    recurring_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """Delete a recurring transaction."""
    item: RecurringTransaction = get_by_id(db, RecurringTransaction, recurring_id)
    validate_profile_id(db, current_user, item.financial_profile_id)

    db.delete(item)
    db.commit()
