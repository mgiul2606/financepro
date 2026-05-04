# app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.db.database import get_db
from app.models.user import User
from app.models.financial_profile import FinancialProfile, ProfileType
from app.models.category import Category
from app.schemas.auth import UserRegister, UserLogin, Token
from app.schemas.user import UserResponse
from app.services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token
)
from app.config import settings
from app.api.dependencies import get_current_user

DEFAULT_CATEGORIES = [
    # Income
    {"name": "Stipendio",     "name_translations": {"it": "Stipendio",     "en": "Salary"},        "icon": "💼", "color": "#10b981", "is_income": True,  "sort_order": 0},
    {"name": "Freelance",     "name_translations": {"it": "Freelance",     "en": "Freelance"},      "icon": "💻", "color": "#3b82f6", "is_income": True,  "sort_order": 1},
    {"name": "Investimenti",  "name_translations": {"it": "Investimenti",  "en": "Investments"},    "icon": "📈", "color": "#8b5cf6", "is_income": True,  "sort_order": 2},
    {"name": "Altri Ricavi",  "name_translations": {"it": "Altri Ricavi",  "en": "Other Income"},   "icon": "💰", "color": "#06b6d4", "is_income": True,  "sort_order": 3},
    # Expenses - Essential
    {"name": "Spesa",         "name_translations": {"it": "Spesa",         "en": "Groceries"},      "icon": "🛒", "color": "#ef4444", "is_income": False, "sort_order": 10},
    {"name": "Affitto/Mutuo", "name_translations": {"it": "Affitto/Mutuo", "en": "Rent/Mortgage"},  "icon": "🏠", "color": "#f59e0b", "is_income": False, "sort_order": 11},
    {"name": "Utenze",        "name_translations": {"it": "Utenze",        "en": "Utilities"},      "icon": "⚡", "color": "#eab308", "is_income": False, "sort_order": 12},
    {"name": "Trasporti",     "name_translations": {"it": "Trasporti",     "en": "Transport"},      "icon": "🚗", "color": "#6366f1", "is_income": False, "sort_order": 13},
    {"name": "Salute",        "name_translations": {"it": "Salute",        "en": "Healthcare"},     "icon": "🏥", "color": "#ec4899", "is_income": False, "sort_order": 14},
    {"name": "Assicurazioni", "name_translations": {"it": "Assicurazioni", "en": "Insurance"},      "icon": "🛡️", "color": "#14b8a6", "is_income": False, "sort_order": 15},
    # Expenses - Lifestyle
    {"name": "Ristoranti",    "name_translations": {"it": "Ristoranti",    "en": "Restaurants"},    "icon": "🍽️", "color": "#f97316", "is_income": False, "sort_order": 20},
    {"name": "Shopping",      "name_translations": {"it": "Shopping",      "en": "Shopping"},       "icon": "🛍️", "color": "#a855f7", "is_income": False, "sort_order": 21},
    {"name": "Intrattenimento","name_translations": {"it": "Intrattenimento","en": "Entertainment"}, "icon": "🎬", "color": "#06b6d4", "is_income": False, "sort_order": 22},
    {"name": "Viaggi",        "name_translations": {"it": "Viaggi",        "en": "Travel"},         "icon": "✈️", "color": "#0ea5e9", "is_income": False, "sort_order": 23},
    {"name": "Formazione",    "name_translations": {"it": "Formazione",    "en": "Education"},      "icon": "📚", "color": "#8b5cf6", "is_income": False, "sort_order": 24},
    {"name": "Abbonamenti",   "name_translations": {"it": "Abbonamenti",   "en": "Subscriptions"},  "icon": "📱", "color": "#6366f1", "is_income": False, "sort_order": 25},
    # Other
    {"name": "Risparmi",      "name_translations": {"it": "Risparmi",      "en": "Savings"},        "icon": "💎", "color": "#10b981", "is_income": False, "sort_order": 30},
    {"name": "Regali",        "name_translations": {"it": "Regali",        "en": "Gifts"},          "icon": "🎁", "color": "#ec4899", "is_income": False, "sort_order": 31},
    {"name": "Animali",       "name_translations": {"it": "Animali",       "en": "Pets"},           "icon": "🐕", "color": "#f59e0b", "is_income": False, "sort_order": 32},
    {"name": "Altro",         "name_translations": {"it": "Altro",         "en": "Other"},          "icon": "📦", "color": "#6b7280", "is_income": False, "sort_order": 99},
]

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

    # Crea categorie di default per il nuovo utente
    for cat_data in DEFAULT_CATEGORIES:
        db.add(Category(user_id=db_user.id, is_system=True, **cat_data))

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