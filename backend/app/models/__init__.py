# app/models/__init__.py
"""
FinancePro v2.1 Database Models

All SQLAlchemy models for the FinancePro application.
Based on Database Technical Documentation v2.1.
"""

# Enums - centralized enum definitions
from app.models.enums import (
    ProfileType,
    SecurityLevel,
    ScopeType,
    AccountType,
    TransactionType,
    TransactionSource,
    AssetType,
    ValuationMethod,
    AmountModel,
    Frequency,
    OccurrenceStatus,
    PeriodType,
    GoalType,
    GoalStatus,
    ImportType,
    ImportStatus,
    DocumentType,
    EventType,
    SeverityLevel,
    MessageRole,
    TagType,
    NotificationType,
    NotificationStatus,
)

# Core user models
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.models.user_profile_selection import UserProfileSelection
from app.models.financial_profile import FinancialProfile

# Categorization models
from app.models.category import Category, CategoryProfilePreference
from app.models.tag import Tag, transaction_tags
from app.models.merchant import Merchant

# Account and transaction models
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.exchange_rate import ExchangeRate

# Recurring transaction models
from app.models.recurring_transaction import (
    RecurringTransaction,
    RecurringTransactionOccurrence,
)

# Budget and goal models
from app.models.budget import Budget, BudgetCategory
from app.models.financial_goal import FinancialGoal, GoalMilestone
from app.models.goal_contribution import GoalContribution

# Asset models
from app.models.asset import Asset, AssetValuation

# Document and import models
from app.models.document import Document
from app.models.import_job import ImportJob
from app.models.bank_condition import BankCondition

# ML and AI models
from app.models.ml_classification_log import MLClassificationLog
from app.models.prediction import Prediction
from app.models.ai_recommendation import AIRecommendation

# Communication models
from app.models.chat import ChatConversation, ChatMessage
from app.models.notification import Notification

# Audit models
from app.models.audit_log import AuditLog

__all__ = [
    # Enums
    "ProfileType",
    "SecurityLevel",
    "ScopeType",
    "AccountType",
    "TransactionType",
    "TransactionSource",
    "AssetType",
    "ValuationMethod",
    "AmountModel",
    "Frequency",
    "OccurrenceStatus",
    "PeriodType",
    "GoalType",
    "GoalStatus",
    "ImportType",
    "ImportStatus",
    "DocumentType",
    "EventType",
    "SeverityLevel",
    "MessageRole",
    "TagType",
    "NotificationType",
    "NotificationStatus",
    # Core models
    "User",
    "UserPreferences",
    "UserProfileSelection",
    "FinancialProfile",
    # Categorization
    "Category",
    "CategoryProfilePreference",
    "Tag",
    "transaction_tags",
    "Merchant",
    # Accounts and transactions
    "Account",
    "Transaction",
    "ExchangeRate",
    # Recurring transactions
    "RecurringTransaction",
    "RecurringTransactionOccurrence",
    # Budget and goals
    "Budget",
    "BudgetCategory",
    "FinancialGoal",
    "GoalMilestone",
    "GoalContribution",
    # Assets
    "Asset",
    "AssetValuation",
    # Documents and imports
    "Document",
    "ImportJob",
    "BankCondition",
    # ML and AI
    "MLClassificationLog",
    "Prediction",
    "AIRecommendation",
    # Communication
    "ChatConversation",
    "ChatMessage",
    "Notification",
    # Audit
    "AuditLog",
]
