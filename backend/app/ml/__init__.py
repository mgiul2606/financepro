# app/ml/__init__.py
"""
Machine Learning and AI services for FinancePro.

This package contains all ML/AI functionality including:
- Transaction classification
- Financial forecasting
- Chat assistant
- Spending optimization
"""

from app.ml.classification_service import (
    MLClassificationService,
    MerchantNormalizer,
    FeatureExtractor
)
from app.ml.forecasting_service import (
    ForecastingService,
    ForecastResult,
    ForecastPoint,
    ScenarioType
)
from app.ml.chat_assistant_service import (
    ChatAssistantService,
    QueryIntent
)
from app.ml.optimization_service import (
    OptimizationService,
    OptimizationInsight,
    SpendingPattern,
    SubscriptionAlert
)

__all__ = [
    # Classification
    "MLClassificationService",
    "MerchantNormalizer",
    "FeatureExtractor",

    # Forecasting
    "ForecastingService",
    "ForecastResult",
    "ForecastPoint",
    "ScenarioType",

    # Chat Assistant
    "ChatAssistantService",
    "QueryIntent",

    # Optimization
    "OptimizationService",
    "OptimizationInsight",
    "SpendingPattern",
    "SubscriptionAlert",
]
