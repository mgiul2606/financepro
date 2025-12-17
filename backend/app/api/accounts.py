# app/api/accounts.py
from backend.app.api.utils import get_by_id, get_children_from_list, get_children_ids
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Annotated
from uuid import UUID
from decimal import Decimal

from app.db.database import get_db
from app.models.user import User
from app.models.account import Account
from app.models.financial_profile import FinancialProfile
from app.schemas.account import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    AccountBalance,
    AccountList
)
from app.api.dependencies import get_current_user

def validate_profile_ids(db: Session, current_user: User, profile_ids: list[UUID]) -> list[UUID]:
    return get_children_ids(db, User, FinancialProfile, current_user, profile_ids)

def validate_profile_id(db: Session, current_user: User, profile_id: UUID) -> UUID:
    ids: list[UUID] = get_children_ids(db, User, FinancialProfile, current_user, [profile_id])
    return ids[0]

def get_accounts(db: Session, current_user: User, profile_ids: list[FinancialProfile]) -> list[Account]:
    valid_profile_ids: list[UUID] = validate_profile_ids(db, current_user, profile_ids)
    return get_children_from_list(db, FinancialProfile, Account, valid_profile_ids)

router = APIRouter()

@router.get(
    "/",
    response_model=AccountList,
    summary="List all accounts",
    description="Retrieve all accounts for the authenticated user, filtered by currently selected financial profiles",
    responses={
        200: {
            "description": "List of accounts retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "accounts": [
                            {
                                "id": 1,
                                "user_id": 42,
                                "name": "Main Checking",
                                "initial_balance": 1000.00,
                                "current_balance": 1250.50,
                                "currency": "EUR",
                                "created_at": "2025-01-15T10:30:00Z",
                                "updated_at": "2025-01-20T14:22:00Z"
                            }
                        ],
                        "total": 1
                    }
                }
            }
        },
        400: {
            "description": "Invalid or unauthorized profile IDs"
        }
    }
)
async def list_accounts(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    profile_ids: Annotated[list[UUID], Query(description="List of currently active financial profile IDs")],
) -> AccountList:
    """
    List all accounts for the current user's **selected** profiles.
    
    Args:
        profile_ids: List of currently active/selected financial profile IDs
        
    Returns:
        AccountList with accounts from selected profiles and total count
    """
    # Verify that all profile_ids belong to the current user and returns the correspondent accounts
    accounts: list[Account] = get_accounts(db, current_user, profile_ids)
    return AccountList(accounts=accounts, total=len(accounts))


@router.post(
    "/",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new account",
    description="Create a new financial account for the authenticated user",
)
async def create_account(
    account_in: AccountCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
) -> AccountResponse:
    """
    Create a new account.

    Args:
        account_in: Account creation data

    Returns:
        Created account with generated ID

    Raises:
        HTTPException 404: If user has no financial profile
    """
    # Checks if current_profile is a valid one and owned by current_user
    financial_profile_id = validate_profile_id(db, current_user, account_in.financial_profile_id)
    
    # Create account with the financial_profile_id
    account_data = account_in.model_dump(exclude={'financial_profile_id'})

    # Set current_balance to initial_balance on creation
    account = Account(
        **account_data,
        financial_profile_id=financial_profile_id,
        current_balance=account_data.get('initial_balance', Decimal("0.00"))
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get(
    "/{account_id}",
    response_model=AccountResponse,
    summary="Get account by ID",
    description="Retrieve a specific account by its ID",
    responses={
        404: {"description": "Account not found"},
        403: {"description": "Not authorized to access this account"}
    }
)
async def get_account(
    account_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AccountResponse:
    """
    Get account by ID.

    Args:
        account_id: The account ID to retrieve

    Returns:
        Account details

    Raises:
        HTTPException 404: If account doesn't exist
        HTTPException 403: If account doesn't belong to current user
    """
    
    account: Account = get_by_id(db, Account, account_id)

    # Check if account belongs to one of user's financial profiles
    validate_profile_id(db, current_user, account.financial_profile_id)

    return account


@router.put(
    "/{account_id}",
    response_model=AccountResponse,
    summary="Update account",
    description="Update an existing account (partial update supported)",
)
async def update_account(
    account_id: UUID,
    account_in: AccountUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AccountResponse:
    """
    Update account.

    Args:
        account_id: The account ID to update
        account_in: Fields to update (partial update supported)

    Returns:
        Updated account
    """

    account: Account = get_by_id(db, Account, account_id)
    # Check if account belongs to one of user's financial profiles
    validate_profile_id(db, current_user, account.financial_profile_id)

    # Update only provided fields
    update_data = account_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account


@router.delete(
    "/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete account",
    description="Delete an account and all its transactions (CASCADE)",
)
async def delete_account(
    account_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """
    Delete account.

    Args:
        account_id: The account ID to delete

    Returns:
        No content (204)

    Note:
        This will also delete all transactions associated with the account (CASCADE)
    """
    account: Account = get_by_id(db, Account, account_id)
    validate_profile_id(db, current_user, account.financial_profile_id)
    db.delete(account)
    db.commit()


@router.get(
    "/{account_id}/balance",
    response_model=AccountBalance,
    summary="Get account balance",
    description="Get current balance for a specific account with metadata",
)
async def get_account_balance(
    account_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AccountBalance:
    """
    Get account balance.

    Args:
        account_id: The account ID

    Returns:
        Current balance with currency and last update timestamp
    """
    account: Account = get_by_id(db, Account, account_id)
    validate_profile_id(db, current_user, account.financial_profile_id)
   
    return AccountBalance(
        account_id=account.id,
        balance=account.current_balance,
        currency=account.currency,
        last_updated=account.updated_at,
    )