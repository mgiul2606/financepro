# app/api/accounts.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_data: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea nuovo conto corrente"""
    
    account = Account(
        **account_data.model_dump(),
        user_id=current_user.id
    )
    
    db.add(account)
    db.commit()
    db.refresh(account)
    
    return account

@router.get("", response_model=List[AccountResponse])
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista tutti i conti dell'utente corrente"""
    
    accounts = db.query(Account)\
        .filter(Account.user_id == current_user.id)\
        .order_by(Account.created_at.desc())\
        .all()
    
    return accounts

@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottieni dettagli singolo conto"""
    
    account = db.query(Account)\
        .filter(Account.id == account_id, Account.user_id == current_user.id)\
        .first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    return account

@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: int,
    account_data: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modifica conto esistente"""
    
    account = db.query(Account)\
        .filter(Account.id == account_id, Account.user_id == current_user.id)\
        .first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Update solo campi forniti
    update_data = account_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)
    
    db.commit()
    db.refresh(account)
    
    return account

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Elimina conto (e tutte le sue transazioni - cascade)"""
    
    account = db.query(Account)\
        .filter(Account.id == account_id, Account.user_id == current_user.id)\
        .first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    db.delete(account)
    db.commit()
    
    return None