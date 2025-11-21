# app/models/enums.py
"""
All ENUMs for FinancePro v2.1 Database Schema.
Based on Database Technical Documentation v2.1 Final.
"""
import enum


# ============================================================================
# USER & PROFILE ENUMS
# ============================================================================

class ProfileType(str, enum.Enum):
    """Types of financial profiles"""
    PERSONAL = "personal"
    FAMILY = "family"
    BUSINESS = "business"


class SecurityLevel(str, enum.Enum):
    """Security level for profiles - determines encryption"""
    STANDARD = "standard"
    HIGH_SECURITY = "high_security"


class ScopeType(str, enum.Enum):
    """Scope type for budgets, goals, recommendations"""
    USER = "user"  # Aggregates from all profiles
    PROFILE = "profile"  # Single profile
    MULTI_PROFILE = "multi_profile"  # Selected profiles


# ============================================================================
# ACCOUNT ENUMS
# ============================================================================

class AccountType(str, enum.Enum):
    """Types of financial accounts"""
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    INVESTMENT = "investment"
    CASH = "cash"
    LOAN = "loan"
    MORTGAGE = "mortgage"
    OTHER = "other"


# ============================================================================
# TRANSACTION ENUMS
# ============================================================================

class TransactionType(str, enum.Enum):
    """Types of financial transactions"""
    BANK_TRANSFER = "bank_transfer"
    WITHDRAWAL = "withdrawal"
    PAYMENT = "payment"
    PURCHASE = "purchase"
    INTERNAL_TRANSFER = "internal_transfer"
    INCOME = "income"
    SALARY = "salary"
    INVOICE = "invoice"
    ASSET_PURCHASE = "asset_purchase"
    ASSET_SALE = "asset_sale"
    DIVIDEND = "dividend"
    INTEREST = "interest"
    LOAN_PAYMENT = "loan_payment"
    REFUND = "refund"
    FEE = "fee"
    TAX = "tax"
    OTHER = "other"


class TransactionSource(str, enum.Enum):
    """Source of transaction creation"""
    MANUAL = "manual"
    IMPORT_CSV = "import_csv"
    IMPORT_OCR = "import_ocr"
    IMPORT_API = "import_api"
    RECURRING = "recurring"
    BANK_SYNC = "bank_sync"


# ============================================================================
# ASSET ENUMS
# ============================================================================

class AssetType(str, enum.Enum):
    """Types of assets"""
    REAL_ESTATE = "real_estate"
    VEHICLE = "vehicle"
    PRECIOUS_METAL = "precious_metal"
    STOCK = "stock"
    BOND = "bond"
    FUND = "fund"
    ETF = "etf"
    CRYPTO = "crypto"
    ARTWORK = "artwork"
    JEWELRY = "jewelry"
    WATCH = "watch"
    OTHER = "other"


class ValuationMethod(str, enum.Enum):
    """Methods for asset valuation"""
    MARKET_QUOTE = "market_quote"
    RANGE = "range"
    COMPARATIVE = "comparative"
    MANUAL = "manual"
    APPRAISAL = "appraisal"


# ============================================================================
# RECURRING TRANSACTION ENUMS
# ============================================================================

class AmountModel(str, enum.Enum):
    """Models for recurring transaction amounts"""
    FIXED = "fixed"
    VARIABLE_WITHIN_RANGE = "variable_within_range"
    PROGRESSIVE = "progressive"
    SEASONAL = "seasonal"
    FORMULA = "formula"


class Frequency(str, enum.Enum):
    """Frequency of recurring transactions"""
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMIANNUALLY = "semiannually"
    YEARLY = "yearly"
    CUSTOM = "custom"


class OccurrenceStatus(str, enum.Enum):
    """Status of recurring transaction occurrences"""
    PENDING = "pending"
    EXECUTED = "executed"
    SKIPPED = "skipped"
    OVERRIDDEN = "overridden"
    FAILED = "failed"


# ============================================================================
# BUDGET & GOAL ENUMS
# ============================================================================

class PeriodType(str, enum.Enum):
    """Budget period types"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class GoalType(str, enum.Enum):
    """Types of financial goals"""
    HOUSE = "house"
    CAR = "car"
    VACATION = "vacation"
    RETIREMENT = "retirement"
    EMERGENCY_FUND = "emergency_fund"
    EDUCATION = "education"
    INVESTMENT = "investment"
    DEBT_PAYOFF = "debt_payoff"
    CUSTOM = "custom"


class GoalStatus(str, enum.Enum):
    """Status of financial goals"""
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    FAILED = "failed"


# ============================================================================
# IMPORT & DOCUMENT ENUMS
# ============================================================================

class ImportType(str, enum.Enum):
    """Types of import jobs"""
    CSV = "csv"
    EXCEL = "excel"
    OFX = "ofx"
    QIF = "qif"
    PDF = "pdf"
    OCR_RECEIPT = "ocr_receipt"
    OCR_INVOICE = "ocr_invoice"
    OCR_CONTRACT = "ocr_contract"
    BANK_API = "bank_api"


class ImportStatus(str, enum.Enum):
    """Status of import jobs"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


class DocumentType(str, enum.Enum):
    """Types of uploaded documents"""
    RECEIPT = "receipt"
    INVOICE = "invoice"
    CONTRACT = "contract"
    BANK_STATEMENT = "bank_statement"
    TAX_DOCUMENT = "tax_document"
    INSURANCE = "insurance"
    OTHER = "other"


# ============================================================================
# AUDIT & SECURITY ENUMS
# ============================================================================

class EventType(str, enum.Enum):
    """Types of audit events"""
    ACCESS = "access"
    SECURITY = "security"
    FINANCIAL_OP = "financial_op"
    AI_INTERACTION = "ai_interaction"
    SYSTEM = "system"
    USER_ACTION = "user_action"
    DATA_EXPORT = "data_export"


class SeverityLevel(str, enum.Enum):
    """Severity levels for audit logs"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


# ============================================================================
# COMMUNICATION ENUMS
# ============================================================================

class MessageRole(str, enum.Enum):
    """Roles in chat messages"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class TagType(str, enum.Enum):
    """Types of tags"""
    CONTEXTUAL = "contextual"  # #work, #personal, #family
    FUNCTIONAL = "functional"  # #deductible, #reimbursable
    TEMPORAL = "temporal"  # #recurring, #seasonal
    EMOTIONAL = "emotional"  # #urgent, #luxury
    CUSTOM = "custom"


class NotificationType(str, enum.Enum):
    """Types of notifications"""
    BUDGET_ALERT = "budget_alert"
    GOAL_MILESTONE = "goal_milestone"
    RECURRING_REMINDER = "recurring_reminder"
    ANOMALY_DETECTED = "anomaly_detected"
    OPTIMIZATION_SUGGESTION = "optimization_suggestion"
    SECURITY_ALERT = "security_alert"
    REPORT_READY = "report_ready"
    GENERAL = "general"


class NotificationStatus(str, enum.Enum):
    """Status of notifications"""
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"
    DISMISSED = "dismissed"


# ============================================================================
# LEGACY COMPATIBILITY - Remove after migration
# ============================================================================

# Keep for backward compatibility during migration
class DatabaseType(str, enum.Enum):
    """Deprecated: Supported database types for distributed storage"""
    POSTGRESQL = "postgresql"
    MSSQL = "mssql"
