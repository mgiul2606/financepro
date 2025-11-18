# app/ml/optimization_service.py
"""
Optimization Service for financial analysis and recommendations.

This service implements AI-driven financial optimization including:
- Spending analysis and waste detection
- Subscription tracking and optimization
- Cash flow optimization
- Savings strategies
- Personalized recommendations
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from datetime import datetime, date, timedelta
from dataclasses import dataclass
from collections import defaultdict

from sqlalchemy.orm import Session
from sqlalchemy import and_, func, or_

from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
from app.models.account import Account
from app.models.recurring_transaction import RecurringTransaction
from app.models.budget import Budget
from app.models.financial_goal import FinancialGoal


@dataclass
class OptimizationInsight:
    """A single optimization insight or recommendation"""
    category: str  # waste, subscription, cashflow, savings
    priority: str  # high, medium, low
    title: str
    description: str
    potential_savings: float
    actionable: bool
    action_steps: List[str]
    impact_score: float  # 0-100


@dataclass
class SpendingPattern:
    """A detected spending pattern"""
    merchant: str
    category: str
    frequency: str  # daily, weekly, monthly
    average_amount: float
    total_amount: float
    transaction_count: int
    last_occurrence: date


@dataclass
class SubscriptionAlert:
    """An alert about a subscription or recurring expense"""
    name: str
    amount: float
    frequency: str
    last_used_days_ago: Optional[int]
    usage_ratio: Optional[float]
    recommendation: str
    potential_savings: float


class OptimizationService:
    """
    Financial Optimization Service.

    Analyzes spending patterns and provides actionable recommendations
    for improving financial health.
    """

    def __init__(self, db: Session):
        """
        Initialize the Optimization Service.

        Args:
            db: Database session
        """
        self.db = db

    async def get_optimization_insights(
        self,
        financial_profile_id: UUID,
        lookback_days: int = 90
    ) -> List[OptimizationInsight]:
        """
        Get comprehensive optimization insights.

        Args:
            financial_profile_id: Financial profile ID
            lookback_days: Days of history to analyze

        Returns:
            List of optimization insights
        """
        insights = []

        # 1. Detect wasteful spending
        waste_insights = await self._detect_waste(financial_profile_id, lookback_days)
        insights.extend(waste_insights)

        # 2. Analyze subscriptions
        subscription_insights = await self._analyze_subscriptions(financial_profile_id)
        insights.extend(subscription_insights)

        # 3. Optimize cash flow
        cashflow_insights = await self._optimize_cashflow(financial_profile_id)
        insights.extend(cashflow_insights)

        # 4. Generate savings strategies
        savings_insights = await self._generate_savings_strategies(financial_profile_id, lookback_days)
        insights.extend(savings_insights)

        # Sort by impact score
        insights.sort(key=lambda x: x.impact_score, reverse=True)

        return insights

    async def _detect_waste(
        self,
        financial_profile_id: UUID,
        lookback_days: int
    ) -> List[OptimizationInsight]:
        """Detect wasteful spending patterns."""
        insights = []
        start_date = date.today() - timedelta(days=lookback_days)

        # Get all expense transactions
        transactions = self.db.query(Transaction).join(Account).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                Transaction.transaction_date >= start_date,
                Transaction.amount < 0
            )
        ).all()

        if not transactions:
            return insights

        # Group by merchant
        merchant_spending = defaultdict(lambda: {"total": 0, "count": 0, "transactions": []})

        for txn in transactions:
            merchant = txn.merchant_normalized or txn.merchant_name or "Unknown"
            amount = abs(float(txn.amount or 0))
            merchant_spending[merchant]["total"] += amount
            merchant_spending[merchant]["count"] += 1
            merchant_spending[merchant]["transactions"].append(txn)

        # Detect high-frequency small purchases
        for merchant, data in merchant_spending.items():
            if data["count"] >= 15 and data["total"] / data["count"] < 10:
                # Frequent small purchases
                monthly_total = data["total"] * 30 / lookback_days

                insights.append(OptimizationInsight(
                    category="waste",
                    priority="medium",
                    title=f"Acquisti frequenti presso {merchant}",
                    description=(
                        f"Hai effettuato {data['count']} transazioni presso {merchant} "
                        f"per un totale di €{data['total']:.2f}. "
                        f"Considerando la frequenza, potresti risparmiare pianificando meglio gli acquisti."
                    ),
                    potential_savings=monthly_total * 0.2,  # Estimate 20% savings
                    actionable=True,
                    action_steps=[
                        f"Pianifica gli acquisti presso {merchant} su base settimanale invece che giornaliera",
                        "Crea una lista della spesa per evitare acquisti impulsivi",
                        "Considera alternative economiche o acquisti in maggiore quantità"
                    ],
                    impact_score=min(monthly_total * 0.2 * 2, 100)  # Impact based on potential savings
                ))

        # Detect duplicate/similar transactions on same day
        transactions_by_date = defaultdict(list)
        for txn in transactions:
            transactions_by_date[txn.transaction_date].append(txn)

        duplicate_spending = 0
        for date_key, day_txns in transactions_by_date.items():
            if len(day_txns) >= 3:
                # Multiple transactions same day
                same_category = defaultdict(list)
                for txn in day_txns:
                    if txn.category_id:
                        same_category[str(txn.category_id)].append(txn)

                for cat_id, cat_txns in same_category.items():
                    if len(cat_txns) >= 2:
                        duplicate_spending += sum(abs(float(txn.amount or 0)) for txn in cat_txns)

        if duplicate_spending > 100:
            insights.append(OptimizationInsight(
                category="waste",
                priority="medium",
                title="Transazioni duplicate rilevate",
                description=(
                    f"Hai effettuato molte transazioni multiple nello stesso giorno "
                    f"per categorie simili, per un totale di circa €{duplicate_spending:.2f}. "
                    "Consolidare questi acquisti potrebbe portare a risparmi."
                ),
                potential_savings=duplicate_spending * 0.1,
                actionable=True,
                action_steps=[
                    "Pianifica acquisti settimanali invece di giornalieri",
                    "Usa liste della spesa per evitare dimenticanze",
                    "Consolida acquisti simili in una singola visita"
                ],
                impact_score=min(duplicate_spending * 0.1, 50)
            ))

        return insights

    async def _analyze_subscriptions(
        self,
        financial_profile_id: UUID
    ) -> List[OptimizationInsight]:
        """Analyze subscription and recurring expenses."""
        insights = []

        # Get recurring transactions
        recurring_txns = self.db.query(RecurringTransaction).join(Account).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                RecurringTransaction.is_active == True
            )
        ).all()

        if not recurring_txns:
            return insights

        total_monthly_subscriptions = 0

        for rec_txn in recurring_txns:
            amount = float(rec_txn.base_amount or 0)

            # Convert to monthly equivalent
            if rec_txn.frequency == "MONTHLY":
                monthly_amount = amount
            elif rec_txn.frequency == "YEARLY":
                monthly_amount = amount / 12
            elif rec_txn.frequency == "WEEKLY":
                monthly_amount = amount * 4.33
            elif rec_txn.frequency == "DAILY":
                monthly_amount = amount * 30
            else:
                monthly_amount = amount

            total_monthly_subscriptions += abs(monthly_amount)

        if total_monthly_subscriptions > 100:
            insights.append(OptimizationInsight(
                category="subscription",
                priority="high",
                title="Costo elevato abbonamenti",
                description=(
                    f"Stai spendendo circa €{total_monthly_subscriptions:.2f} al mese "
                    f"in abbonamenti e spese ricorrenti. Rivedi quali sono veramente necessari."
                ),
                potential_savings=total_monthly_subscriptions * 0.25,  # Assume 25% can be saved
                actionable=True,
                action_steps=[
                    "Elenca tutti gli abbonamenti attivi",
                    "Valuta l'utilizzo effettivo di ciascun servizio",
                    "Cancella quelli non utilizzati o cerca alternative più economiche",
                    "Considera piani annuali per quelli che usi regolarmente (spesso scontati)"
                ],
                impact_score=min(total_monthly_subscriptions * 0.25 * 2, 100)
            ))

        # Detect potentially unused subscriptions
        # (those with no related transactions in last 60 days)
        for rec_txn in recurring_txns:
            if rec_txn.category_id:
                # Check for related transactions
                recent_txns = self.db.query(Transaction).join(Account).filter(
                    and_(
                        Account.financial_profile_id == financial_profile_id,
                        Transaction.category_id == rec_txn.category_id,
                        Transaction.transaction_date >= date.today() - timedelta(days=60)
                    )
                ).count()

                if recent_txns <= 2:  # Very few transactions
                    amount = float(rec_txn.base_amount or 0)
                    insights.append(OptimizationInsight(
                        category="subscription",
                        priority="high",
                        title=f"Abbonamento potenzialmente inutilizzato: {rec_txn.name}",
                        description=(
                            f"L'abbonamento '{rec_txn.name}' (€{amount:.2f}) "
                            f"sembra essere poco utilizzato. "
                            f"Considera di cancellarlo se non ti serve più."
                        ),
                        potential_savings=abs(amount) * 12 if rec_txn.frequency == "MONTHLY" else abs(amount),
                        actionable=True,
                        action_steps=[
                            f"Verifica se stai ancora utilizzando {rec_txn.name}",
                            "Se non lo usi, procedi con la cancellazione",
                            "Controlla se ci sono penali per la cancellazione anticipata"
                        ],
                        impact_score=min(abs(amount) * 5, 100)
                    ))

        return insights

    async def _optimize_cashflow(
        self,
        financial_profile_id: UUID
    ) -> List[OptimizationInsight]:
        """Provide cash flow optimization recommendations."""
        insights = []

        # Get all accounts
        accounts = self.db.query(Account).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                Account.is_active == True
            )
        ).all()

        if not accounts:
            return insights

        # Check for low balance accounts
        for account in accounts:
            balance = float(account.current_balance or 0)

            if 0 < balance < 500 and account.account_type.value in ["CHECKING", "SAVINGS"]:
                insights.append(OptimizationInsight(
                    category="cashflow",
                    priority="medium",
                    title=f"Saldo basso su {account.name}",
                    description=(
                        f"Il conto '{account.name}' ha un saldo di €{balance:.2f}. "
                        "Considera di mantenere un buffer di emergenza più alto."
                    ),
                    potential_savings=0,  # This is about risk management, not savings
                    actionable=True,
                    action_steps=[
                        "Imposta un obiettivo di risparmio di emergenza",
                        "Trasferisci fondi da altri conti se possibile",
                        "Riduci le spese non essenziali temporaneamente"
                    ],
                    impact_score=40
                ))

        # Get upcoming recurring expenses
        upcoming_expenses = self.db.query(RecurringTransaction).join(Account).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                RecurringTransaction.is_active == True,
                RecurringTransaction.next_occurrence_date <= date.today() + timedelta(days=7)
            )
        ).all()

        if upcoming_expenses:
            total_upcoming = sum(
                float(rec.base_amount or 0)
                for rec in upcoming_expenses
            )

            if total_upcoming > 0:
                # Check if current balance can cover
                total_balance = sum(float(acc.current_balance or 0) for acc in accounts)

                if total_balance < total_upcoming:
                    insights.append(OptimizationInsight(
                        category="cashflow",
                        priority="high",
                        title="Attenzione: Spese ricorrenti in arrivo",
                        description=(
                            f"Hai €{abs(total_upcoming):.2f} di spese ricorrenti "
                            f"previste nei prossimi 7 giorni, ma il tuo saldo totale "
                            f"è di €{total_balance:.2f}. "
                            "Potresti avere problemi di liquidità."
                        ),
                        potential_savings=0,
                        actionable=True,
                        action_steps=[
                            "Verifica quali spese sono essenziali",
                            "Considera di posticipare pagamenti non urgenti",
                            "Trasferisci fondi da altri conti o risparmi",
                            "Contatta i fornitori per eventuali piani di pagamento"
                        ],
                        impact_score=90
                    ))

        return insights

    async def _generate_savings_strategies(
        self,
        financial_profile_id: UUID,
        lookback_days: int
    ) -> List[OptimizationInsight]:
        """Generate personalized savings strategies."""
        insights = []
        start_date = date.today() - timedelta(days=lookback_days)

        # Get spending data
        transactions = self.db.query(Transaction).join(Account).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                Transaction.transaction_date >= start_date,
                Transaction.amount < 0
            )
        ).all()

        if not transactions:
            return insights

        # Calculate spending by category
        category_spending = defaultdict(float)
        for txn in transactions:
            if txn.category_id:
                category = self.db.query(Category).filter(
                    Category.id == txn.category_id
                ).first()
                if category:
                    category_spending[category.name] += abs(float(txn.amount or 0))

        # Find top spending categories
        if category_spending:
            sorted_categories = sorted(
                category_spending.items(),
                key=lambda x: x[1],
                reverse=True
            )

            # Suggest savings on top categories
            for i, (category_name, amount) in enumerate(sorted_categories[:3]):
                monthly_spending = amount * 30 / lookback_days
                potential_reduction = monthly_spending * 0.15  # 15% reduction goal

                insights.append(OptimizationInsight(
                    category="savings",
                    priority="medium" if i == 0 else "low",
                    title=f"Opportunità di risparmio: {category_name}",
                    description=(
                        f"Stai spendendo circa €{monthly_spending:.2f} al mese "
                        f"per {category_name}. "
                        f"Riducendo del 15%, potresti risparmiare €{potential_reduction:.2f}/mese."
                    ),
                    potential_savings=potential_reduction,
                    actionable=True,
                    action_steps=[
                        f"Rivedi le tue spese per {category_name}",
                        "Identifica acquisti non essenziali",
                        "Cerca alternative più economiche",
                        "Imposta un budget mensile per questa categoria"
                    ],
                    impact_score=min(potential_reduction * 3, 80)
                ))

        # Suggest micro-savings strategy
        total_spending = sum(category_spending.values())
        daily_spending = total_spending / lookback_days

        if daily_spending > 20:
            insights.append(OptimizationInsight(
                category="savings",
                priority="low",
                title="Strategia micro-risparmio",
                description=(
                    f"Spendi in media €{daily_spending:.2f} al giorno. "
                    "Anche solo risparmiare €5 al giorno ti farebbe accumulare "
                    "€150 al mese, €1,800 all'anno!"
                ),
                potential_savings=150,
                actionable=True,
                action_steps=[
                    "Porta il pranzo da casa invece di mangiare fuori",
                    "Prepara il caffè a casa invece di comprarlo al bar",
                    "Usa i mezzi pubblici invece dell'auto quando possibile",
                    "Evita acquisti impulsivi sotto €10"
                ],
                impact_score=60
            ))

        return insights

    async def get_spending_patterns(
        self,
        financial_profile_id: UUID,
        lookback_days: int = 90
    ) -> List[SpendingPattern]:
        """
        Detect spending patterns for better budgeting.

        Args:
            financial_profile_id: Financial profile ID
            lookback_days: Days of history to analyze

        Returns:
            List of detected spending patterns
        """
        start_date = date.today() - timedelta(days=lookback_days)

        transactions = self.db.query(Transaction).join(Account).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                Transaction.transaction_date >= start_date,
                Transaction.amount < 0
            )
        ).all()

        if not transactions:
            return []

        # Group by merchant
        merchant_patterns = defaultdict(lambda: {
            "transactions": [],
            "amounts": [],
            "dates": [],
            "category": None
        })

        for txn in transactions:
            merchant = txn.merchant_normalized or txn.merchant_name or "Unknown"
            merchant_patterns[merchant]["transactions"].append(txn)
            merchant_patterns[merchant]["amounts"].append(abs(float(txn.amount or 0)))
            merchant_patterns[merchant]["dates"].append(txn.transaction_date)

            if txn.category_id and not merchant_patterns[merchant]["category"]:
                category = self.db.query(Category).filter(
                    Category.id == txn.category_id
                ).first()
                merchant_patterns[merchant]["category"] = category.name if category else "Unknown"

        # Analyze patterns
        patterns = []

        for merchant, data in merchant_patterns.items():
            if len(data["transactions"]) < 3:
                continue  # Not enough data for pattern

            # Calculate frequency
            dates = sorted(data["dates"])
            intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates) - 1)]
            avg_interval = sum(intervals) / len(intervals) if intervals else 0

            if avg_interval <= 2:
                frequency = "daily"
            elif avg_interval <= 8:
                frequency = "weekly"
            elif avg_interval <= 35:
                frequency = "monthly"
            else:
                frequency = "occasional"

            pattern = SpendingPattern(
                merchant=merchant,
                category=data["category"] or "Unknown",
                frequency=frequency,
                average_amount=sum(data["amounts"]) / len(data["amounts"]),
                total_amount=sum(data["amounts"]),
                transaction_count=len(data["transactions"]),
                last_occurrence=max(dates)
            )

            patterns.append(pattern)

        # Sort by total amount
        patterns.sort(key=lambda x: x.total_amount, reverse=True)

        return patterns

    async def calculate_potential_savings(
        self,
        financial_profile_id: UUID
    ) -> Dict[str, Any]:
        """
        Calculate total potential savings from all insights.

        Returns:
            Dictionary with savings summary
        """
        insights = await self.get_optimization_insights(financial_profile_id)

        total_potential = sum(insight.potential_savings for insight in insights)

        by_category = defaultdict(float)
        for insight in insights:
            by_category[insight.category] += insight.potential_savings

        return {
            "total_monthly_savings": total_potential,
            "annual_savings": total_potential * 12,
            "by_category": dict(by_category),
            "insights_count": len(insights),
            "high_priority_count": sum(1 for i in insights if i.priority == "high"),
            "top_insights": [
                {
                    "title": i.title,
                    "savings": i.potential_savings,
                    "priority": i.priority
                }
                for i in insights[:5]
            ]
        }
