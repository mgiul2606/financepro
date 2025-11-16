# app/api/__init__.py

from app.api.auth import router as auth_router
from app.api.accounts import router as accounts_router
from app.api.categories import router as categories_router
from app.api.financial_profiles import router as financial_profiles_router
from app.api.transactions import router as transactions_router
from app.api.budgets import router as budgets_router
from app.api.goals import router as goals_router

__all__ = [
    "auth_router",
    "accounts_router",
    "categories_router",
    "financial_profiles_router",
    "transactions_router",
    "budgets_router",
    "goals_router",
]
