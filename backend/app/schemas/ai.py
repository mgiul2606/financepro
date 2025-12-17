# app/schemas/ai.py
"""
Pydantic schemas for AI services.
"""
from backend.app.schemas.base import CamelCaseModel
from pydantic import Field, field_validator
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date, datetime
from enum import Enum


# ============================================================================
# Classification Schemas
# ============================================================================

class ClassificationRequest(CamelCaseModel):
    """Request to classify a transaction"""
    transaction_id: UUID
    auto_apply: bool = Field(
        default=False,
        description="Automatically apply classification if confidence is high"
    )


class ClassificationResponse(CamelCaseModel):
    """Response from classification"""
    transaction_id: UUID
    predicted_category_id: Optional[UUID]
    predicted_category_name: Optional[str]
    confidence_score: float
    explanation: str
    was_applied: bool


class TrainModelRequest(CamelCaseModel):
    """Request to train user model"""
    financial_profile_id: UUID


class TrainModelResponse(CamelCaseModel):
    """Response from model training"""
    success: bool
    message: str
    metrics: Optional[Dict[str, float]] = None
    training_samples: Optional[int] = None
    model_version: Optional[str] = None


class ClassificationMetrics(CamelCaseModel):
    """Classification performance metrics"""
    total_classifications: int
    acceptance_rate: float
    average_confidence: float
    model_version: str


class SuggestedTag(CamelCaseModel):
    """A suggested tag for a transaction"""
    tag_id: UUID
    tag_name: str
    tag_type: str
    confidence: float


# ============================================================================
# Forecasting Schemas
# ============================================================================

class ScenarioTypeEnum(str, Enum):
    """Forecast scenario types"""
    OPTIMISTIC = "optimistic"
    LIKELY = "likely"
    PESSIMISTIC = "pessimistic"


class ForecastPointSchema(CamelCaseModel):
    """A single forecast point"""
    date: date
    value: float
    confidence_lower: float
    confidence_upper: float
    scenario: ScenarioTypeEnum


class ForecastRequest(CamelCaseModel):
    """Request for cash flow forecast"""
    financial_profile_id: UUID
    account_id: Optional[UUID] = None
    horizon_days: int = Field(
        default=90,
        ge=7,
        le=365,
        description="Number of days to forecast (7-365)"
    )
    include_recurring: bool = Field(
        default=True,
        description="Include recurring transactions in forecast"
    )
    include_patterns: bool = Field(
        default=True,
        description="Include historical pattern analysis"
    )


class ForecastResponse(CamelCaseModel):
    """Forecast response"""
    start_date: date
    end_date: date
    current_balance: float
    optimistic_scenario: List[ForecastPointSchema]
    likely_scenario: List[ForecastPointSchema]
    pessimistic_scenario: List[ForecastPointSchema]
    insights: List[str]
    warnings: List[str]
    reliability_score: float


# ============================================================================
# Chat Assistant Schemas
# ============================================================================

class QueryIntentEnum(str, Enum):
    """Query intent types"""
    BALANCE_QUERY = "balance_query"
    SPENDING_ANALYSIS = "spending_analysis"
    BUDGET_STATUS = "budget_status"
    TRANSACTION_SEARCH = "transaction_search"
    CATEGORY_BREAKDOWN = "category_breakdown"
    GOAL_STATUS = "goal_status"
    FORECAST_REQUEST = "forecast_request"
    RECOMMENDATION_REQUEST = "recommendation_request"
    COMPARISON = "comparison"
    GENERAL_QUESTION = "general_question"


class ChatMessageRequest(CamelCaseModel):
    """Request to send a chat message"""
    message: str = Field(..., min_length=1, max_length=2000)
    financial_profile_id: Optional[UUID] = None
    conversation_id: Optional[UUID] = None


class ChatMessageResponse(CamelCaseModel):
    """Response from chat assistant"""
    conversation_id: UUID
    message_id: UUID
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    intent: QueryIntentEnum


class ConversationListItem(CamelCaseModel):
    """A conversation in the list"""
    id: UUID
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    message_count: int
    financial_profile_id: Optional[UUID]


class ConversationDetail(CamelCaseModel):
    """Detailed conversation with messages"""
    id: UUID
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    financial_profile_id: Optional[UUID]
    messages: List[Dict[str, Any]]


# ============================================================================
# Optimization Schemas
# ============================================================================

class OptimizationCategory(str, Enum):
    """Optimization insight categories"""
    WASTE = "waste"
    SUBSCRIPTION = "subscription"
    CASHFLOW = "cashflow"
    SAVINGS = "savings"


class OptimizationPriority(str, Enum):
    """Optimization priority levels"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class OptimizationInsightSchema(CamelCaseModel):
    """An optimization insight"""
    category: OptimizationCategory
    priority: OptimizationPriority
    title: str
    description: str
    potential_savings: float
    actionable: bool
    action_steps: List[str]
    impact_score: float


class OptimizationRequest(CamelCaseModel):
    """Request for optimization insights"""
    financial_profile_id: UUID
    lookback_days: int = Field(
        default=90,
        ge=30,
        le=365,
        description="Days of history to analyze (30-365)"
    )


class OptimizationResponse(CamelCaseModel):
    """Optimization insights response"""
    insights: List[OptimizationInsightSchema]
    total_potential_savings: float
    insights_by_priority: Dict[str, int]


class SpendingPatternSchema(CamelCaseModel):
    """A detected spending pattern"""
    merchant: str
    category: str
    frequency: str
    average_amount: float
    total_amount: float
    transaction_count: int
    last_occurrence: date


class SpendingPatternsResponse(CamelCaseModel):
    """Spending patterns response"""
    patterns: List[SpendingPatternSchema]
    total_patterns: int


class SavingsSummary(CamelCaseModel):
    """Summary of potential savings"""
    total_monthly_savings: float
    annual_savings: float
    by_category: Dict[str, float]
    insights_count: int
    high_priority_count: int
    top_insights: List[Dict[str, Any]]


# ============================================================================
# Common Response Schemas
# ============================================================================

class AIServiceStatus(CamelCaseModel):
    """Status of AI services"""
    classification_available: bool
    forecasting_available: bool
    chat_available: bool
    optimization_available: bool
    model_version: str
    last_updated: Optional[datetime] = None


class ErrorResponse(CamelCaseModel):
    """Error response"""
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
