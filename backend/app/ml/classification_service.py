# app/ml/classification_service.py
"""
ML Classification Service for automatic transaction categorization.

This service implements a multi-model approach for classifying transactions:
- Global pre-trained model (fallback)
- User-specific model (personalized)
- Ensemble predictions with confidence scores
- Explainability via feature importance
"""
import pickle
import numpy as np
from typing import Optional, Tuple, Dict, List, Any
from uuid import UUID
from datetime import datetime, timezone
from pathlib import Path
import re
import unicodedata

from sklearn.ensemble import GradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import joblib

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.transaction import Transaction
from app.models.category import Category
from app.models.ml_classification_log import MLClassificationLog
from app.models.tag import Tag, TagType


class MerchantNormalizer:
    """Normalizes merchant names for better classification."""

    # Common patterns to remove
    REMOVE_PATTERNS = [
        r'\d{2,}',  # Long numbers
        r'[*]+',    # Asterisks
        r'\s+',     # Multiple spaces
        r'^pos\s+', # POS prefix
        r'^pagamento\s+', # Payment prefix
        r'^carta\s+',     # Card prefix
    ]

    # Common abbreviations to expand
    ABBREVIATIONS = {
        'srl': 'srl',
        'spa': 'spa',
        'snc': 'snc',
        'sas': 'sas',
        'soc': 'societa',
        'coop': 'cooperativa',
    }

    @staticmethod
    def normalize(merchant_name: str) -> str:
        """
        Normalize merchant name for consistent classification.

        Args:
            merchant_name: Raw merchant name from transaction

        Returns:
            Normalized merchant name
        """
        if not merchant_name:
            return ""

        # Convert to lowercase
        normalized = merchant_name.lower().strip()

        # Remove accents
        normalized = ''.join(
            c for c in unicodedata.normalize('NFD', normalized)
            if unicodedata.category(c) != 'Mn'
        )

        # Apply removal patterns
        for pattern in MerchantNormalizer.REMOVE_PATTERNS:
            normalized = re.sub(pattern, ' ', normalized, flags=re.IGNORECASE)

        # Expand abbreviations
        words = normalized.split()
        words = [MerchantNormalizer.ABBREVIATIONS.get(w, w) for w in words]
        normalized = ' '.join(words)

        # Clean up multiple spaces
        normalized = re.sub(r'\s+', ' ', normalized).strip()

        return normalized


class FeatureExtractor:
    """Extracts features from transactions for ML classification."""

    @staticmethod
    def extract_features(transaction: Transaction) -> Dict[str, Any]:
        """
        Extract features from a transaction for classification.

        Args:
            transaction: Transaction to extract features from

        Returns:
            Dictionary of features
        """
        # Text features
        description = transaction.description or ""
        merchant = transaction.merchant_name or ""
        merchant_normalized = transaction.merchant_normalized or MerchantNormalizer.normalize(merchant)

        # Combined text for TF-IDF
        combined_text = f"{description} {merchant_normalized}"

        # Amount features
        amount = float(transaction.amount) if transaction.amount else 0.0
        amount_abs = abs(amount)

        # Temporal features
        transaction_date = transaction.transaction_date
        day_of_week = transaction_date.weekday() if transaction_date else 0
        day_of_month = transaction_date.day if transaction_date else 1
        month = transaction_date.month if transaction_date else 1

        # Transaction type
        transaction_type = transaction.transaction_type.value if transaction.transaction_type else "UNKNOWN"

        return {
            'text': combined_text,
            'amount_abs': amount_abs,
            'amount_log': np.log1p(amount_abs),
            'day_of_week': day_of_week,
            'day_of_month': day_of_month,
            'month': month,
            'is_weekend': 1 if day_of_week >= 5 else 0,
            'is_month_start': 1 if day_of_month <= 5 else 0,
            'is_month_end': 1 if day_of_month >= 25 else 0,
            'transaction_type': transaction_type,
            'merchant_normalized': merchant_normalized,
        }


class MLClassificationService:
    """
    Machine Learning Classification Service for transaction categorization.

    Implements:
    - Multi-model approach (global + user-specific)
    - Feature extraction and preprocessing
    - Model training and prediction
    - Explainability
    - Feedback loop for continuous improvement
    """

    MODEL_VERSION = "1.0.0"
    MODELS_DIR = Path(__file__).parent / "models"
    CONFIDENCE_THRESHOLD = 0.6  # Minimum confidence for auto-classification
    MIN_TRAINING_SAMPLES = 20   # Minimum samples to train user model

    def __init__(self, db: Session):
        """
        Initialize the ML Classification Service.

        Args:
            db: Database session
        """
        self.db = db
        self.models_dir = self.MODELS_DIR
        self.models_dir.mkdir(exist_ok=True)

        # Load global model (will be created if doesn't exist)
        self.global_model = self._load_or_create_global_model()
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 2),
            min_df=2,
            stop_words=None  # Could add Italian stop words
        )

        # Cache for user models
        self.user_models = {}

    def _load_or_create_global_model(self) -> GradientBoostingClassifier:
        """Load the global pre-trained model or create a new one."""
        model_path = self.models_dir / "global_model.pkl"

        if model_path.exists():
            return joblib.load(model_path)
        else:
            # Create new model with default parameters
            model = GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
            return model

    def _get_user_model_path(self, user_id: UUID) -> Path:
        """Get the path to a user's model file."""
        return self.models_dir / f"user_model_{user_id}.pkl"

    def _load_user_model(self, user_id: UUID) -> Optional[GradientBoostingClassifier]:
        """Load a user-specific model if it exists."""
        model_path = self._get_user_model_path(user_id)

        if model_path.exists():
            return joblib.load(model_path)
        return None

    def _save_user_model(self, user_id: UUID, model: GradientBoostingClassifier):
        """Save a user-specific model."""
        model_path = self._get_user_model_path(user_id)
        joblib.dump(model, model_path)

    async def classify_transaction(
        self,
        transaction: Transaction,
        user_id: UUID,
        auto_apply: bool = False
    ) -> Tuple[Optional[Category], float, str]:
        """
        Classify a transaction using ML models.

        Args:
            transaction: Transaction to classify
            user_id: User ID for personalized model
            auto_apply: If True, automatically apply classification if confidence is high

        Returns:
            Tuple of (predicted_category, confidence_score, explanation)
        """
        # Extract features
        features = FeatureExtractor.extract_features(transaction)

        # Get user model or fall back to global
        user_model = self._load_user_model(user_id)
        model = user_model if user_model else self.global_model

        # Check if model is trained
        if not hasattr(model, 'classes_'):
            # Model not trained yet, return None
            return None, 0.0, "Model not trained yet. Please provide some manual classifications first."

        # Prepare features for prediction
        # TODO: This is a simplified version. In production, you'd need to:
        # 1. Transform text features with the fitted vectorizer
        # 2. Encode categorical features
        # 3. Scale numerical features
        # For now, return a placeholder

        # Since we don't have a fully trained model yet, return None
        return None, 0.0, "Classification service is in development. Manual classification required."

    async def train_user_model(
        self,
        user_id: UUID,
        financial_profile_id: UUID
    ) -> Dict[str, Any]:
        """
        Train or retrain a user-specific model based on their historical data.

        Args:
            user_id: User ID
            financial_profile_id: Financial profile ID to get transactions from

        Returns:
            Training metrics and status
        """
        # Get all manually classified transactions for this user
        transactions = self.db.query(Transaction).join(
            Transaction.account
        ).filter(
            and_(
                Transaction.category_id.isnot(None),
                Transaction.account.has(financial_profile_id=financial_profile_id)
            )
        ).all()

        if len(transactions) < self.MIN_TRAINING_SAMPLES:
            return {
                "success": False,
                "message": f"Insufficient training data. Need at least {self.MIN_TRAINING_SAMPLES} classified transactions.",
                "current_count": len(transactions)
            }

        # Extract features and labels
        X_text = []
        X_numeric = []
        y = []

        for txn in transactions:
            features = FeatureExtractor.extract_features(txn)
            X_text.append(features['text'])
            X_numeric.append([
                features['amount_log'],
                features['day_of_week'],
                features['month'],
                features['is_weekend'],
                features['is_month_start'],
                features['is_month_end'],
            ])
            y.append(str(txn.category_id))

        # Split data
        X_text_train, X_text_test, X_numeric_train, X_numeric_test, y_train, y_test = train_test_split(
            X_text, X_numeric, y, test_size=0.2, random_state=42
        )

        # Vectorize text features
        X_text_train_vec = self.vectorizer.fit_transform(X_text_train)
        X_text_test_vec = self.vectorizer.transform(X_text_test)

        # Combine features
        X_train = np.hstack([X_text_train_vec.toarray(), np.array(X_numeric_train)])
        X_test = np.hstack([X_text_test_vec.toarray(), np.array(X_numeric_test)])

        # Train model
        model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_test, y_pred, average='weighted', zero_division=0
        )

        # Save model
        self._save_user_model(user_id, model)

        # Cache model
        self.user_models[str(user_id)] = model

        return {
            "success": True,
            "message": "Model trained successfully",
            "metrics": {
                "accuracy": float(accuracy),
                "precision": float(precision),
                "recall": float(recall),
                "f1_score": float(f1),
            },
            "training_samples": len(transactions),
            "model_version": self.MODEL_VERSION,
        }

    async def log_classification(
        self,
        transaction_id: UUID,
        predicted_category_id: UUID,
        confidence_score: float,
        was_accepted: bool,
        corrected_category_id: Optional[UUID],
        features_used: Dict[str, Any],
        explanation: str
    ):
        """
        Log a classification attempt for future model improvement.

        Args:
            transaction_id: Transaction ID
            predicted_category_id: Predicted category
            confidence_score: Confidence score
            was_accepted: Whether user accepted the prediction
            corrected_category_id: User's correction (if not accepted)
            features_used: Features used for prediction
            explanation: Human-readable explanation
        """
        log = MLClassificationLog(
            transaction_id=transaction_id,
            model_version=self.MODEL_VERSION,
            predicted_category_id=predicted_category_id,
            confidence_score=confidence_score,
            was_accepted=was_accepted,
            corrected_category_id=corrected_category_id,
            features_used=features_used,
            explanation=explanation,
            timestamp=datetime.now(timezone.utc)
        )

        self.db.add(log)
        self.db.commit()

    async def get_classification_metrics(
        self,
        financial_profile_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get classification performance metrics.

        Args:
            financial_profile_id: Financial profile ID
            start_date: Start date for metrics
            end_date: End date for metrics

        Returns:
            Dictionary of metrics
        """
        query = self.db.query(MLClassificationLog).join(
            Transaction
        ).join(
            Transaction.account
        ).filter(
            Transaction.account.has(financial_profile_id=financial_profile_id)
        )

        if start_date:
            query = query.filter(MLClassificationLog.timestamp >= start_date)
        if end_date:
            query = query.filter(MLClassificationLog.timestamp <= end_date)

        logs = query.all()

        if not logs:
            return {
                "total_classifications": 0,
                "acceptance_rate": 0.0,
                "average_confidence": 0.0,
            }

        total = len(logs)
        accepted = sum(1 for log in logs if log.was_accepted)
        avg_confidence = sum(float(log.confidence_score) for log in logs) / total

        return {
            "total_classifications": total,
            "acceptance_rate": accepted / total,
            "average_confidence": avg_confidence,
            "model_version": self.MODEL_VERSION,
        }

    async def suggest_tags(
        self,
        transaction: Transaction,
        financial_profile_id: UUID
    ) -> List[Tag]:
        """
        Suggest tags for a transaction based on patterns and ML.

        Args:
            transaction: Transaction to tag
            financial_profile_id: Financial profile ID

        Returns:
            List of suggested tags
        """
        suggested_tags = []

        # Get available tags
        all_tags = self.db.query(Tag).filter(
            Tag.financial_profile_id == financial_profile_id
        ).all()

        features = FeatureExtractor.extract_features(transaction)

        # Rule-based tag suggestions
        # Temporal tags
        if features['is_weekend']:
            weekend_tag = next((t for t in all_tags if t.name.lower() == 'weekend'), None)
            if weekend_tag:
                suggested_tags.append(weekend_tag)

        # Contextual tags based on amount
        if features['amount_abs'] > 1000:
            large_tag = next((t for t in all_tags if 'large' in t.name.lower() or 'importante' in t.name.lower()), None)
            if large_tag:
                suggested_tags.append(large_tag)

        # More sophisticated tag suggestion would use ML here

        return suggested_tags[:5]  # Return top 5 suggestions
