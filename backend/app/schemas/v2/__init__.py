# app/schemas/v2/__init__.py
"""v2.1 Pydantic schemas for FinancePro"""
from app.schemas.v2.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse
)
from app.schemas.v2.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetCategoryCreate,
    BudgetCategoryResponse
)
from app.schemas.v2.goal import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    GoalContributionCreate,
    GoalContributionResponse
)
from app.schemas.v2.profile import (
    ProfileCreate,
    ProfileUpdate,
    ProfileResponse
)

__all__ = [
    # Transaction
    "TransactionCreate",
    "TransactionUpdate",
    "TransactionResponse",
    "TransactionListResponse",
    # Budget
    "BudgetCreate",
    "BudgetUpdate",
    "BudgetResponse",
    "BudgetCategoryCreate",
    "BudgetCategoryResponse",
    # Goal
    "GoalCreate",
    "GoalUpdate",
    "GoalResponse",
    "GoalContributionCreate",
    "GoalContributionResponse",
    # Profile
    "ProfileCreate",
    "ProfileUpdate",
    "ProfileResponse",
]
