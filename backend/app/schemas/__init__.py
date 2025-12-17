# app/schemas/__init__.py

# Auth schemas
from app.schemas.auth import Token, TokenPayload

# User schemas
from app.schemas.user import UserCreate, UserUpdate, UserResponse

# Account schemas
from app.schemas.account import (
    AccountBase,
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    AccountBalance,
    AccountList,
)

# Financial Profile schemas
from app.schemas.financial_profile import (
    FinancialProfileBase,
    FinancialProfileCreate,
    FinancialProfileUpdate,
    FinancialProfileResponse,
    FinancialProfileListResponse,
)

# Transaction schemas
from app.schemas.transaction import (
    TransactionBase,
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse,
)

# Category schemas
from app.schemas.category import (
    CategoryBase,
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryListResponse,
)

# Budget schemas
from app.schemas.budget import (
    BudgetBase,
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetCategoryAllocation,
    BudgetListResponse,
    BudgetSummary,
)

# Financial Goal schemas
from app.schemas.goal import (
    FinancialGoalBase,
    FinancialGoalCreate,
    FinancialGoalUpdate,
    FinancialGoalResponse,
    FinancialGoalListResponse,
    GoalMilestoneResponse,
    GoalMilestoneCreate,
    GoalMilestoneUpdate,
    GoalSummary,
)

__all__ = [
    # Auth
    "Token",
    "TokenPayload",
    # User
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    # Account
    "AccountBase",
    "AccountCreate",
    "AccountUpdate",
    "AccountResponse",
    "AccountBalance",
    "AccountList",
    # Financial Profile
    "FinancialProfileBase",
    "FinancialProfileCreate",
    "FinancialProfileUpdate",
    "FinancialProfileResponse",
    "FinancialProfileListResponse",
    # Transaction
    "TransactionBase",
    "TransactionCreate",
    "TransactionUpdate",
    "TransactionResponse",
    "TransactionListResponse",
    # Category
    "CategoryBase",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    "CategoryListResponse",
    # Budget
    "BudgetBase",
    "BudgetCreate",
    "BudgetUpdate",
    "BudgetResponse",
    "BudgetCategoryAllocation",
    "BudgetListResponse",
    "BudgetSummary",
    # Financial Goal
    "FinancialGoalBase",
    "FinancialGoalCreate",
    "FinancialGoalUpdate",
    "FinancialGoalResponse",
    "FinancialGoalListResponse",
    "GoalMilestoneResponse",
    "GoalMilestoneCreate",
    "GoalMilestoneUpdate",
    "GoalSummary",
]
