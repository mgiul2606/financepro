# app/api/accounts.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated, List

from app.db.database import get_db
from app.models.user import User
from app.models.account import Account
from app.models.financial_profile import FinancialProfile, ProfileType
from app.schemas.account import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    AccountBalance,
    AccountList
)
from app.api.dependencies import get_current_user

router = APIRouter()


@router.get(
    "/",
    response_model=AccountList,
    summary="List all accounts",
    description="Retrieve all accounts for the authenticated user",
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
        }
    }
)
async def list_accounts(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AccountList:
    """
    List all accounts for the current user.

    Returns:
        AccountList with all user's accounts and total count
    """
    # Get all financial profiles for the user
    profiles = db.query(FinancialProfile).filter(
        FinancialProfile.user_id == current_user.id
    ).all()

    profile_ids = [p.id for p in profiles]

    # Get all accounts from user's financial profiles
    accounts = db.query(Account).filter(
        Account.financial_profile_id.in_(profile_ids)
    ).all()

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
    current_user: Annotated[User, Depends(get_current_user)],
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
    # Get or create the user's default financial profile
    financial_profile = db.query(FinancialProfile).filter(
        FinancialProfile.user_id == current_user.id
    ).first()

    if not financial_profile:
        # Create a default financial profile if none exists
        financial_profile = FinancialProfile(
            user_id=current_user.id,
            name="Personal Finance",
            profile_type=ProfileType.PERSONAL,
            default_currency="EUR",
            is_active=True
        )
        db.add(financial_profile)
        db.commit()
        db.refresh(financial_profile)

    # Create account with the financial_profile_id
    account_data = account_in.model_dump(exclude={'financial_profile_id'})
    account = Account(
        **account_data,
        financial_profile_id=financial_profile.id
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
    account_id: int,
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
    account = db.query(Account).filter(Account.id == account_id).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {account_id} not found"
        )

    # Check if account belongs to one of user's financial profiles
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == account.financial_profile_id,
        FinancialProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this account"
        )

    return account


@router.put(
    "/{account_id}",
    response_model=AccountResponse,
    summary="Update account",
    description="Update an existing account (partial update supported)",
)
async def update_account(
    account_id: int,
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
    account = db.query(Account).filter(Account.id == account_id).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {account_id} not found"
        )

    # Check if account belongs to one of user's financial profiles
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == account.financial_profile_id,
        FinancialProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this account"
        )

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
    account_id: int,
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
    account = db.query(Account).filter(Account.id == account_id).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {account_id} not found"
        )

    # Check if account belongs to one of user's financial profiles
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == account.financial_profile_id,
        FinancialProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this account"
        )

    db.delete(account)
    db.commit()


@router.get(
    "/{account_id}/balance",
    response_model=AccountBalance,
    summary="Get account balance",
    description="Get current balance for a specific account with metadata",
)
async def get_account_balance(
    account_id: int,
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
    account = db.query(Account).filter(Account.id == account_id).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {account_id} not found"
        )

    # Check if account belongs to one of user's financial profiles
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == account.financial_profile_id,
        FinancialProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this account"
        )
    
    return AccountBalance(
        account_id=account.id,
        balance=account.current_balance,
        currency=account.currency,
        last_updated=account.updated_at,
    )