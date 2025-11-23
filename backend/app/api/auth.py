# app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.db.database import get_db
from app.models.user import User
from app.models.financial_profile import FinancialProfile, ProfileType
from app.schemas.auth import UserRegister, UserLogin, Token
from app.schemas.user import UserResponse
from app.services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token
)
from app.config import settings
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Registra nuovo utente e crea profilo finanziario di default"""

    # Check se email già esiste
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Crea user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password
    )

    db.add(db_user)
    db.flush()  # Flush to get user.id without committing

    # Crea profilo finanziario di default
    default_profile = FinancialProfile(
        user_id=db_user.id,
        name="Default Profile",
        description="Your default financial profile",
        profile_type=ProfileType.PERSONAL,
        default_currency="EUR",
        is_active=True,
        is_default=True  # Mark as default profile
    )

    db.add(default_profile)
    db.commit()
    db.refresh(db_user)

    return db_user

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login e ottieni JWT token"""
    
    # Trova user
    user = db.query(User).filter(User.email == credentials.email).first()
    
    # Verifica user e password
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Crea token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Ottieni info utente corrente (test endpoint protetto)"""
    return current_user