# app/api/ai.py
"""
API endpoints for AI services (classification, forecasting, chat, optimization).
"""
from backend.app.api.utils import get_by_id, children_for
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.api.dependencies import get_current_user
from app.schemas.ai import (
    # Classification
    ClassificationRequest,
    ClassificationResponse,
    TrainModelRequest,
    TrainModelResponse,
    ClassificationMetrics,
    SuggestedTag,
    # Forecasting
    ForecastRequest,
    ForecastResponse,
    ForecastPointSchema,
    ScenarioTypeEnum,
    # Chat
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationListItem,
    ConversationDetail,
    # Optimization
    OptimizationRequest,
    OptimizationResponse,
    OptimizationInsightSchema,
    SpendingPatternsResponse,
    SavingsSummary,
    # Common
    AIServiceStatus,
)
from app.ml import (
    MLClassificationService,
    ForecastingService,
    ChatAssistantService,
    OptimizationService,
)
from app.models.chat import ChatConversation, ChatMessage


router = APIRouter(prefix="/ai", tags=["AI Services"])


# ============================================================================
# Classification Endpoints
# ============================================================================

@router.post(
    "/classify/transaction",
    response_model=ClassificationResponse,
    summary="Classify a transaction",
    description="Use ML to classify a transaction into a category"
)
async def classify_transaction(
    request: ClassificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Classify a transaction using machine learning.

    - **transaction_id**: ID of the transaction to classify
    - **auto_apply**: If True, automatically apply classification if confidence is high
    """
    from app.models.transaction import Transaction
    from app.models.account import Account
    from app.models.financial_profile import FinancialProfile

    # Get transaction
    transaction = get_by_id(db, Transaction, request.transaction_id)

    # Verify user has access to this transaction
    # (through account -> financial_profile -> user)
    account = get_by_id(db, Account, transaction.account_id)
    children_for(db, User, FinancialProfile, current_user.id, account.financial_profile_id)

    # Classify
    service = MLClassificationService(db)
    category, confidence, explanation = await service.classify_transaction(
        transaction,
        current_user.id,
        auto_apply=request.auto_apply
    )

    was_applied = False
    if request.auto_apply and category and confidence >= service.CONFIDENCE_THRESHOLD:
        transaction.category_id = category.id
        db.commit()
        was_applied = True

    return ClassificationResponse(
        transaction_id=transaction.id,
        predicted_category_id=category.id if category else None,
        predicted_category_name=category.name if category else None,
        confidence_score=confidence,
        explanation=explanation,
        was_applied=was_applied
    )


@router.post(
    "/classify/train",
    response_model=TrainModelResponse,
    summary="Train user classification model",
    description="Train or retrain the user's personalized classification model"
)
async def train_classification_model(
    request: TrainModelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Train a personalized classification model for the user.

    - **financial_profile_id**: Financial profile to train model for
    """
    from app.models.financial_profile import FinancialProfile

    # Verify user has access to this profile
    children_for(db, User, FinancialProfile, current_user.id, request.financial_profile_id)

    # Train model
    service = MLClassificationService(db)
    result = await service.train_user_model(
        current_user.id,
        request.financial_profile_id
    )

    return TrainModelResponse(**result)


@router.get(
    "/classify/metrics/{financial_profile_id}",
    response_model=ClassificationMetrics,
    summary="Get classification metrics",
    description="Get performance metrics for the classification model"
)
async def get_classification_metrics(
    financial_profile_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get classification performance metrics."""
    from app.models.financial_profile import FinancialProfile

    # Verify access
    children_for(db, User, FinancialProfile, current_user.id, financial_profile_id)

    service = MLClassificationService(db)
    metrics = await service.get_classification_metrics(financial_profile_id)

    return ClassificationMetrics(**metrics)


@router.get(
    "/classify/suggest-tags/{transaction_id}",
    response_model=List[SuggestedTag],
    summary="Suggest tags for transaction",
    description="Get AI-suggested tags for a transaction"
)
async def suggest_tags(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get suggested tags for a transaction."""
    from app.models.transaction import Transaction
    from app.models.account import Account
    from app.models.financial_profile import FinancialProfile

    # Get transaction
    transaction = get_by_id(db, Transaction, transaction_id)

    # Verify access
    account = get_by_id(db, Account, transaction.account_id)
    children_for(db, User, FinancialProfile, current_user.id, account.financial_profile_id)

    service = MLClassificationService(db)
    tags = await service.suggest_tags(
        transaction,
        transaction.account.financial_profile_id
    )

    return [
        SuggestedTag(
            tag_id=tag.id,
            tag_name=tag.name,
            tag_type=tag.tag_type.value,
            confidence=0.7  # Placeholder confidence
        )
        for tag in tags
    ]


# ============================================================================
# Forecasting Endpoints
# ============================================================================

@router.post(
    "/forecast/cashflow",
    response_model=ForecastResponse,
    summary="Forecast cash flow",
    description="Generate cash flow forecast with multiple scenarios"
)
async def forecast_cashflow(
    request: ForecastRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate cash flow forecast.

    - **financial_profile_id**: Financial profile to forecast for
    - **account_id**: Specific account (optional)
    - **horizon_days**: Number of days to forecast (7-365)
    - **include_recurring**: Include recurring transactions
    - **include_patterns**: Include historical pattern analysis
    """
    from app.models.financial_profile import FinancialProfile

    # Verify access
    children_for(db, User, FinancialProfile, current_user.id, request.financial_profile_id)

    # Generate forecast
    service = ForecastingService(db)
    result = await service.forecast_cashflow(
        financial_profile_id=request.financial_profile_id,
        account_id=request.account_id,
        horizon_days=request.horizon_days,
        include_recurring=request.include_recurring,
        include_patterns=request.include_patterns
    )

    # Convert to schema
    return ForecastResponse(
        start_date=result.start_date,
        end_date=result.end_date,
        current_balance=result.current_balance,
        optimistic_scenario=[
            ForecastPointSchema(
                date=point.date,
                value=point.value,
                confidence_lower=point.confidence_lower,
                confidence_upper=point.confidence_upper,
                scenario=ScenarioTypeEnum.OPTIMISTIC
            )
            for point in result.optimistic_scenario
        ],
        likely_scenario=[
            ForecastPointSchema(
                date=point.date,
                value=point.value,
                confidence_lower=point.confidence_lower,
                confidence_upper=point.confidence_upper,
                scenario=ScenarioTypeEnum.LIKELY
            )
            for point in result.likely_scenario
        ],
        pessimistic_scenario=[
            ForecastPointSchema(
                date=point.date,
                value=point.value,
                confidence_lower=point.confidence_lower,
                confidence_upper=point.confidence_upper,
                scenario=ScenarioTypeEnum.PESSIMISTIC
            )
            for point in result.pessimistic_scenario
        ],
        insights=result.insights,
        warnings=result.warnings,
        reliability_score=result.reliability_score
    )


# ============================================================================
# Chat Assistant Endpoints
# ============================================================================

@router.post(
    "/chat/message",
    response_model=ChatMessageResponse,
    summary="Send chat message",
    description="Send a message to the AI assistant and get a response"
)
async def send_chat_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to the AI chat assistant.

    - **message**: The message text
    - **financial_profile_id**: Financial profile context (optional)
    - **conversation_id**: Existing conversation ID (optional)
    """
    # If financial_profile_id provided, verify access
    if request.financial_profile_id:
        from app.models.financial_profile import FinancialProfile
        children_for(db, User, FinancialProfile, current_user.id, request.financial_profile_id)

    # If conversation_id provided, verify access
    if request.conversation_id:
        children_for(db, User, ChatConversation, current_user.id, request.conversation_id)

    # Process message
    service = ChatAssistantService(db)
    response = await service.process_message(
        user_id=current_user.id,
        financial_profile_id=request.financial_profile_id,
        message_content=request.message,
        conversation_id=request.conversation_id
    )

    return ChatMessageResponse(
        conversation_id=UUID(response["conversation_id"]),
        message_id=UUID(response["message_id"]),
        content=response["content"],
        metadata=response["metadata"],
        intent=response["intent"]
    )


@router.get(
    "/chat/conversations",
    response_model=List[ConversationListItem],
    summary="List conversations",
    description="Get list of user's chat conversations"
)
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of user's chat conversations."""
    conversations = db.query(ChatConversation).filter(
        ChatConversation.user_id == current_user.id
    ).order_by(ChatConversation.updated_at.desc()).all()

    return [
        ConversationListItem(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=len(conv.messages),
            financial_profile_id=conv.financial_profile_id
        )
        for conv in conversations
    ]


@router.get(
    "/chat/conversations/{conversation_id}",
    response_model=ConversationDetail,
    summary="Get conversation details",
    description="Get detailed conversation with all messages"
)
async def get_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed conversation with messages."""
    conversation = children_for(db, User, ChatConversation, current_user.id, conversation_id)

    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        financial_profile_id=conversation.financial_profile_id,
        messages=[
            {
                "id": str(msg.id),
                "role": msg.role.value,
                "content": msg.content,
                "metadata": msg.message_metadata or {},
                "timestamp": msg.timestamp.isoformat()
            }
            for msg in conversation.messages
        ]
    )


@router.delete(
    "/chat/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete conversation",
    description="Delete a chat conversation"
)
async def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat conversation."""
    conversation = children_for(db, User, ChatConversation, current_user.id, conversation_id)

    db.delete(conversation)
    db.commit()


# ============================================================================
# Optimization Endpoints
# ============================================================================

@router.post(
    "/optimize/insights",
    response_model=OptimizationResponse,
    summary="Get optimization insights",
    description="Get AI-powered financial optimization insights"
)
async def get_optimization_insights(
    request: OptimizationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get optimization insights and recommendations.

    - **financial_profile_id**: Financial profile to analyze
    - **lookback_days**: Days of history to analyze (30-365)
    """
    from app.models.financial_profile import FinancialProfile

    # Verify access
    children_for(db, User, FinancialProfile, current_user.id, request.financial_profile_id)

    # Get insights
    service = OptimizationService(db)
    insights = await service.get_optimization_insights(
        request.financial_profile_id,
        request.lookback_days
    )

    # Convert to schema
    insight_schemas = [
        OptimizationInsightSchema(
            category=insight.category,
            priority=insight.priority,
            title=insight.title,
            description=insight.description,
            potential_savings=insight.potential_savings,
            actionable=insight.actionable,
            action_steps=insight.action_steps,
            impact_score=insight.impact_score
        )
        for insight in insights
    ]

    total_savings = sum(i.potential_savings for i in insights)
    by_priority = {
        "high": sum(1 for i in insights if i.priority == "high"),
        "medium": sum(1 for i in insights if i.priority == "medium"),
        "low": sum(1 for i in insights if i.priority == "low"),
    }

    return OptimizationResponse(
        insights=insight_schemas,
        total_potential_savings=total_savings,
        insights_by_priority=by_priority
    )


@router.get(
    "/optimize/patterns/{financial_profile_id}",
    response_model=SpendingPatternsResponse,
    summary="Get spending patterns",
    description="Get detected spending patterns"
)
async def get_spending_patterns(
    financial_profile_id: UUID,
    lookback_days: int = 90,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detected spending patterns."""
    from app.models.financial_profile import FinancialProfile

    # Verify access
    children_for(db, User, FinancialProfile, current_user.id, financial_profile_id)

    service = OptimizationService(db)
    patterns = await service.get_spending_patterns(
        financial_profile_id,
        lookback_days
    )

    from app.schemas.ai import SpendingPatternSchema

    pattern_schemas = [
        SpendingPatternSchema(
            merchant=p.merchant,
            category=p.category,
            frequency=p.frequency,
            average_amount=p.average_amount,
            total_amount=p.total_amount,
            transaction_count=p.transaction_count,
            last_occurrence=p.last_occurrence
        )
        for p in patterns
    ]

    return SpendingPatternsResponse(
        patterns=pattern_schemas,
        total_patterns=len(pattern_schemas)
    )


@router.get(
    "/optimize/savings-summary/{financial_profile_id}",
    response_model=SavingsSummary,
    summary="Get savings summary",
    description="Get summary of potential savings"
)
async def get_savings_summary(
    financial_profile_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get summary of potential savings."""
    from app.models.financial_profile import FinancialProfile

    # Verify access
    children_for(db, User, FinancialProfile, current_user.id, financial_profile_id)

    service = OptimizationService(db)
    summary = await service.calculate_potential_savings(financial_profile_id)

    return SavingsSummary(**summary)


# ============================================================================
# Service Status
# ============================================================================

@router.get(
    "/status",
    response_model=AIServiceStatus,
    summary="Get AI services status",
    description="Get status of all AI services"
)
async def get_ai_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get status of AI services."""
    return AIServiceStatus(
        classification_available=True,
        forecasting_available=True,
        chat_available=True,
        optimization_available=True,
        model_version=MLClassificationService.MODEL_VERSION,
        last_updated=None
    )
