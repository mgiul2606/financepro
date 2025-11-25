# app/api/transactions.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Annotated, Optional, List
from uuid import UUID
from datetime import date
from decimal import Decimal

from app.db.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.financial_profile import FinancialProfile
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse,
)
from app.api.dependencies import get_current_user

router = APIRouter()


async def verify_account_ownership(
    account_id: UUID,
    db: Session,
    current_user: User
) -> Account:
    """
    Helper function to verify that the current user owns the account
    through the financial profile.

    Args:
        account_id: ID of the account to verify
        db: Database session
        current_user: Current authenticated user

    Returns:
        Account object if authorized

    Raises:
        HTTPException 404: If account doesn't exist
        HTTPException 403: If user doesn't own the account
    """
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {account_id} not found"
        )

    # Check if user owns the financial profile that owns the account
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == account.financial_profile_id
    ).first()

    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this account"
        )

    return account


@router.get(
    "/",
    response_model=TransactionListResponse,
    summary="List transactions",
    description="Retrieve transactions with optional filters (profile_id, account_id, category_id, date range)",
    responses={
        200: {"description": "Transactions retrieved successfully"},
    },
    tags=["Transactions"]
)
async def list_transactions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    profile_id: Optional[UUID] = Query(None, description="Filter by financial profile ID"),
    account_id: Optional[UUID] = Query(None, description="Filter by account ID"),
    category_id: Optional[UUID] = Query(None, description="Filter by category ID"),
    date_from: Optional[date] = Query(None, description="Filter transactions from this date (inclusive)"),
    date_to: Optional[date] = Query(None, description="Filter transactions to this date (inclusive)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
) -> TransactionListResponse:
    """
    List transactions with optional filters.

    Filters are applied cumulatively. User can only see transactions from accounts
    they own through their financial profiles.

    Args:
        profile_id: Filter by financial profile ID
        account_id: Filter by account ID
        category_id: Filter by category ID
        date_from: Start date filter
        date_to: End date filter
        skip: Pagination offset
        limit: Maximum results to return

    Returns:
        TransactionListResponse with transactions and total count
    """
    # Build query with joins to ensure user ownership
    query = db.query(Transaction).join(
        Account, Transaction.account_id == Account.id
    ).join(
        FinancialProfile, Account.financial_profile_id == FinancialProfile.id
    ).filter(
        FinancialProfile.user_id == current_user.id
    )

    # Apply filters
    if profile_id:
        query = query.filter(FinancialProfile.id == profile_id)

    if account_id:
        query = query.filter(Transaction.account_id == account_id)

    if category_id:
        query = query.filter(Transaction.category_id == category_id)

    if date_from:
        query = query.filter(Transaction.transaction_date >= date_from)

    if date_to:
        query = query.filter(Transaction.transaction_date <= date_to)

    # Get total count
    total = query.count()

    # Apply pagination and ordering
    transactions = query.order_by(
        Transaction.transaction_date.desc(),
        Transaction.created_at.desc()
    ).offset(skip).limit(limit).all()

    return TransactionListResponse(items=transactions, total=total)


@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create transaction",
    description="Create a new transaction for a specific account",
    responses={
        201: {"description": "Transaction created successfully"},
        403: {"description": "Not authorized to create transaction for this account"},
        404: {"description": "Account not found"}
    },
    tags=["Transactions"]
)
async def create_transaction(
    transaction_in: TransactionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TransactionResponse:
    """
    Create a new transaction.

    Verifies that the user owns the account before creating the transaction.

    Args:
        transaction_in: Transaction creation data

    Returns:
        Created transaction with generated ID

    Raises:
        HTTPException 404: If account doesn't exist
        HTTPException 403: If user doesn't own the account
    """
    # Verify account ownership
    await verify_account_ownership(transaction_in.account_id, db, current_user)

    # Create transaction
    transaction = Transaction(**transaction_in.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@router.get(
    "/stats",
    summary="Get transaction statistics",
    description="Get spending statistics for transactions (total spent, total income, by category)",
    responses={
        200: {"description": "Statistics retrieved successfully"},
    },
    tags=["Transactions"]
)
async def get_transaction_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    profile_id: Optional[UUID] = Query(None, description="Filter by financial profile ID"),
    account_id: Optional[UUID] = Query(None, description="Filter by account ID"),
    date_from: Optional[date] = Query(None, description="Statistics from this date (inclusive)"),
    date_to: Optional[date] = Query(None, description="Statistics to this date (inclusive)"),
):
    """
    Get transaction statistics.

    Provides aggregated statistics about transactions including:
    - Total amount spent (expenses)
    - Total amount received (income)
    - Net amount
    - Transaction count
    - Breakdown by category (if applicable)

    Args:
        profile_id: Filter by financial profile ID
        account_id: Filter by account ID
        date_from: Start date filter
        date_to: End date filter

    Returns:
        Dictionary with transaction statistics
    """
    # Build base query
    query = db.query(Transaction).join(
        Account, Transaction.account_id == Account.id
    ).join(
        FinancialProfile, Account.financial_profile_id == FinancialProfile.id
    ).filter(
        FinancialProfile.user_id == current_user.id
    )

    # Apply filters
    if profile_id:
        query = query.filter(FinancialProfile.id == profile_id)

    if account_id:
        query = query.filter(Transaction.account_id == account_id)

    if date_from:
        query = query.filter(Transaction.transaction_date >= date_from)

    if date_to:
        query = query.filter(Transaction.transaction_date <= date_to)

    # Calculate statistics
    from app.models.transaction import TransactionType

    transactions = query.all()

    total_income = Decimal("0.00")
    total_expenses = Decimal("0.00")

    for t in transactions:
        if t.amount_clear > 0:
            total_income += Decimal(str(t.amount_clear))
        else:
            total_expenses += Decimal(str(t.amount_clear))

    net_amount = total_income - total_expenses

    # Category breakdown
    category_stats = db.query(
        Transaction.category_id,
        func.count(Transaction.id).label("count"),
        func.sum(Transaction.amount_clear).label("total_amount")
    ).select_from(Transaction).join(
        Account, Transaction.account_id == Account.id
    ).join(
        FinancialProfile, Account.financial_profile_id == FinancialProfile.id
    ).filter(
        FinancialProfile.user_id == current_user.id
    )

    # Apply same filters to category stats
    if profile_id:
        category_stats = category_stats.filter(FinancialProfile.id == profile_id)
    if account_id:
        category_stats = category_stats.filter(Transaction.account_id == account_id)
    if date_from:
        category_stats = category_stats.filter(Transaction.transaction_date >= date_from)
    if date_to:
        category_stats = category_stats.filter(Transaction.transaction_date <= date_to)

    category_stats = category_stats.group_by(Transaction.category_id).all()

    return {
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "net_amount": float(net_amount),
        "transaction_count": len(transactions),
        "category_breakdown": [
            {
                "category_id": str(stat.category_id) if stat.category_id else None,
                "count": stat.count,
                "total_amount": float(stat.total_amount) if stat.total_amount else 0.0
            }
            for stat in category_stats
        ]
    }

@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Get transaction by ID",
    description="Retrieve a specific transaction by its ID",
    responses={
        200: {"description": "Transaction retrieved successfully"},
        404: {"description": "Transaction not found"},
        403: {"description": "Not authorized to access this transaction"}
    },
    tags=["Transactions"]
)
async def get_transaction(
    transaction_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TransactionResponse:
    """
    Get transaction by ID.

    Args:
        transaction_id: The transaction ID to retrieve

    Returns:
        Transaction details

    Raises:
        HTTPException 404: If transaction doesn't exist
        HTTPException 403: If user doesn't own the transaction
    """
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id {transaction_id} not found"
        )

    # Verify ownership through account -> profile
    account = db.query(Account).filter(Account.id == transaction.account_id).first()
    if account:
        profile = db.query(FinancialProfile).filter(
            FinancialProfile.id == account.financial_profile_id
        ).first()
        if not profile or profile.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this transaction"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated account not found"
        )

    return transaction


@router.patch(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Update transaction",
    description="Update an existing transaction (partial update supported)",
    responses={
        200: {"description": "Transaction updated successfully"},
        404: {"description": "Transaction not found"},
        403: {"description": "Not authorized to update this transaction"}
    },
    tags=["Transactions"]
)
async def update_transaction(
    transaction_id: UUID,
    transaction_in: TransactionUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TransactionResponse:
    """
    Update transaction.

    Args:
        transaction_id: The transaction ID to update
        transaction_in: Fields to update (partial update supported)

    Returns:
        Updated transaction

    Raises:
        HTTPException 404: If transaction doesn't exist
        HTTPException 403: If user doesn't own the transaction
    """
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id {transaction_id} not found"
        )

    # Verify ownership
    account = db.query(Account).filter(Account.id == transaction.account_id).first()
    if account:
        profile = db.query(FinancialProfile).filter(
            FinancialProfile.id == account.financial_profile_id
        ).first()
        if not profile or profile.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this transaction"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated account not found"
        )

    # Update only provided fields
    update_data = transaction_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete transaction",
    description="Permanently delete a transaction",
    responses={
        204: {"description": "Transaction deleted successfully"},
        404: {"description": "Transaction not found"},
        403: {"description": "Not authorized to delete this transaction"}
    },
    tags=["Transactions"]
)
async def delete_transaction(
    transaction_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """
    Delete transaction.

    Args:
        transaction_id: The transaction ID to delete

    Returns:
        No content (204)

    Raises:
        HTTPException 404: If transaction doesn't exist
        HTTPException 403: If user doesn't own the transaction
    """
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id {transaction_id} not found"
        )

    # Verify ownership
    account = db.query(Account).filter(Account.id == transaction.account_id).first()
    if account:
        profile = db.query(FinancialProfile).filter(
            FinancialProfile.id == account.financial_profile_id
        ).first()
        if not profile or profile.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this transaction"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated account not found"
        )

    db.delete(transaction)
    db.commit()


@router.post(
    "/bulk",
    response_model=TransactionListResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Bulk create transactions",
    description="Create multiple transactions at once (useful for imports)",
    responses={
        201: {"description": "Transactions created successfully"},
        403: {"description": "Not authorized to create transactions for one or more accounts"},
        404: {"description": "One or more accounts not found"}
    },
    tags=["Transactions"]
)
async def bulk_create_transactions(
    transactions_in: List[TransactionCreate],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TransactionListResponse:
    """
    Bulk create transactions.

    Creates multiple transactions in a single request. All transactions must
    belong to accounts owned by the current user.

    Args:
        transactions_in: List of transaction creation data

    Returns:
        TransactionListResponse with created transactions

    Raises:
        HTTPException 404: If any account doesn't exist
        HTTPException 403: If user doesn't own any of the accounts
    """
    if not transactions_in:
        return TransactionListResponse(items=[], total=0)

    # Verify ownership of all accounts
    unique_account_ids = set(t.account_id for t in transactions_in)
    for account_id in unique_account_ids:
        await verify_account_ownership(account_id, db, current_user)

    # Create all transactions
    transactions = []
    for transaction_in in transactions_in:
        transaction = Transaction(**transaction_in.model_dump())
        db.add(transaction)
        transactions.append(transaction)

    db.commit()

    # Refresh all transactions
    for transaction in transactions:
        db.refresh(transaction)

    return TransactionListResponse(items=transactions, total=len(transactions))
