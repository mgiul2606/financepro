# app/api/v2/__init__.py
"""
v2.1 API Routers for FinancePro.

These routers use the v2.1 schemas and services with:
- User-level entities with scope support
- Enhanced encryption handling
- Comprehensive validation
"""
from fastapi import APIRouter

from app.api.v2.budgets import router as budgets_router
from app.api.v2.goals import router as goals_router
from app.api.v2.imports import router as imports_router

# Create v2 router
v2_router = APIRouter(prefix="/v2")

# Include all v2 routers
v2_router.include_router(budgets_router, prefix="/budgets", tags=["Budgets v2"])
v2_router.include_router(goals_router, prefix="/goals", tags=["Goals v2"])
v2_router.include_router(imports_router, prefix="/imports", tags=["Imports v2"])

__all__ = ["v2_router"]
