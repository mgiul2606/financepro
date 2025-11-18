# app/ml/forecasting_service.py
"""
Forecasting Service for financial predictions.

This service implements advanced forecasting algorithms for:
- Cash flow predictions
- Balance forecasting
- Spending pattern predictions
- Budget projection
- Multi-scenario analysis (optimistic, likely, pessimistic)
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from datetime import datetime, timedelta, date
from dataclasses import dataclass
from enum import Enum

from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.models.transaction import Transaction, TransactionType
from app.models.account import Account
from app.models.recurring_transaction import RecurringTransaction
from app.models.budget import Budget


class ScenarioType(str, Enum):
    """Forecast scenario types"""
    OPTIMISTIC = "optimistic"
    LIKELY = "likely"
    PESSIMISTIC = "pessimistic"


@dataclass
class ForecastPoint:
    """A single point in a forecast"""
    date: date
    value: float
    confidence_lower: float
    confidence_upper: float
    scenario: ScenarioType


@dataclass
class ForecastResult:
    """Complete forecast result with multiple scenarios"""
    start_date: date
    end_date: date
    current_balance: float
    optimistic_scenario: List[ForecastPoint]
    likely_scenario: List[ForecastPoint]
    pessimistic_scenario: List[ForecastPoint]
    insights: List[str]
    warnings: List[str]
    reliability_score: float


class ForecastingService:
    """
    Financial Forecasting Service.

    Implements multiple forecasting algorithms:
    - Time series analysis (moving averages, exponential smoothing)
    - Recurring transaction projection
    - Historical pattern analysis
    - External factors integration (calendar events, seasonality)
    """

    def __init__(self, db: Session):
        """
        Initialize the Forecasting Service.

        Args:
            db: Database session
        """
        self.db = db

    async def forecast_cashflow(
        self,
        financial_profile_id: UUID,
        account_id: Optional[UUID] = None,
        horizon_days: int = 90,
        include_recurring: bool = True,
        include_patterns: bool = True
    ) -> ForecastResult:
        """
        Forecast cash flow for a financial profile or specific account.

        Args:
            financial_profile_id: Financial profile ID
            account_id: Specific account ID (optional, if None forecast all accounts)
            horizon_days: Number of days to forecast
            include_recurring: Include recurring transactions
            include_patterns: Include historical pattern analysis

        Returns:
            ForecastResult with multiple scenarios
        """
        # Get current date and forecast period
        start_date = date.today()
        end_date = start_date + timedelta(days=horizon_days)

        # Get current balance
        current_balance = await self._get_current_balance(financial_profile_id, account_id)

        # Get historical data
        historical_data = await self._get_historical_data(
            financial_profile_id,
            account_id,
            lookback_days=180
        )

        # Generate base forecast from historical patterns
        base_forecast = self._analyze_historical_patterns(
            historical_data,
            start_date,
            end_date
        )

        # Add recurring transactions if requested
        if include_recurring:
            recurring_forecast = await self._forecast_recurring_transactions(
                financial_profile_id,
                account_id,
                start_date,
                end_date
            )
            base_forecast = self._merge_forecasts(base_forecast, recurring_forecast)

        # Generate multiple scenarios
        likely_scenario = self._generate_scenario(
            base_forecast,
            current_balance,
            ScenarioType.LIKELY,
            variation=0.0
        )

        optimistic_scenario = self._generate_scenario(
            base_forecast,
            current_balance,
            ScenarioType.OPTIMISTIC,
            variation=0.15  # 15% better
        )

        pessimistic_scenario = self._generate_scenario(
            base_forecast,
            current_balance,
            ScenarioType.PESSIMISTIC,
            variation=-0.15  # 15% worse
        )

        # Generate insights and warnings
        insights = self._generate_insights(likely_scenario, current_balance)
        warnings = self._generate_warnings(pessimistic_scenario, current_balance)

        # Calculate reliability score
        reliability_score = self._calculate_reliability_score(
            historical_data,
            len(base_forecast)
        )

        return ForecastResult(
            start_date=start_date,
            end_date=end_date,
            current_balance=current_balance,
            optimistic_scenario=optimistic_scenario,
            likely_scenario=likely_scenario,
            pessimistic_scenario=pessimistic_scenario,
            insights=insights,
            warnings=warnings,
            reliability_score=reliability_score
        )

    async def _get_current_balance(
        self,
        financial_profile_id: UUID,
        account_id: Optional[UUID] = None
    ) -> float:
        """Get current balance for profile or account."""
        query = self.db.query(func.sum(Account.current_balance)).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                Account.is_active == True
            )
        )

        if account_id:
            query = query.filter(Account.id == account_id)

        result = query.scalar()
        return float(result) if result else 0.0

    async def _get_historical_data(
        self,
        financial_profile_id: UUID,
        account_id: Optional[UUID] = None,
        lookback_days: int = 180
    ) -> pd.DataFrame:
        """
        Get historical transaction data.

        Returns:
            DataFrame with columns: date, amount, type, category
        """
        start_date = date.today() - timedelta(days=lookback_days)

        query = self.db.query(Transaction).join(
            Account
        ).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                Transaction.transaction_date >= start_date
            )
        )

        if account_id:
            query = query.filter(Transaction.account_id == account_id)

        transactions = query.all()

        # Convert to DataFrame
        data = []
        for txn in transactions:
            data.append({
                'date': txn.transaction_date,
                'amount': float(txn.amount) if txn.amount else 0.0,
                'type': txn.transaction_type.value if txn.transaction_type else 'UNKNOWN',
                'category': str(txn.category_id) if txn.category_id else None
            })

        return pd.DataFrame(data)

    def _analyze_historical_patterns(
        self,
        historical_data: pd.DataFrame,
        start_date: date,
        end_date: date
    ) -> Dict[date, float]:
        """
        Analyze historical patterns to generate base forecast.

        Uses:
        - Daily average calculations
        - Weekly patterns
        - Monthly patterns
        - Seasonal adjustments

        Returns:
            Dictionary of date -> predicted daily net flow
        """
        if historical_data.empty:
            # No historical data, return zero forecast
            forecast = {}
            current = start_date
            while current <= end_date:
                forecast[current] = 0.0
                current += timedelta(days=1)
            return forecast

        # Calculate daily average net flow
        daily_avg = historical_data.groupby('date')['amount'].sum().mean()

        # Calculate weekly pattern (day of week effect)
        historical_data['day_of_week'] = pd.to_datetime(historical_data['date']).dt.dayofweek
        weekly_pattern = historical_data.groupby('day_of_week')['amount'].mean().to_dict()

        # Generate forecast
        forecast = {}
        current = start_date

        while current <= end_date:
            day_of_week = current.weekday()
            # Use weekly pattern if available, otherwise use daily average
            daily_flow = weekly_pattern.get(day_of_week, daily_avg)
            forecast[current] = daily_flow
            current += timedelta(days=1)

        return forecast

    async def _forecast_recurring_transactions(
        self,
        financial_profile_id: UUID,
        account_id: Optional[UUID] = None,
        start_date: date = None,
        end_date: date = None
    ) -> Dict[date, float]:
        """
        Forecast recurring transactions.

        Returns:
            Dictionary of date -> predicted recurring amount
        """
        query = self.db.query(RecurringTransaction).join(
            Account
        ).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                RecurringTransaction.is_active == True
            )
        )

        if account_id:
            query = query.filter(RecurringTransaction.account_id == account_id)

        recurring_txns = query.all()

        forecast = {}

        for rec_txn in recurring_txns:
            # Calculate occurrences between start_date and end_date
            occurrences = self._calculate_recurring_occurrences(
                rec_txn,
                start_date,
                end_date
            )

            for occurrence_date, amount in occurrences:
                if occurrence_date not in forecast:
                    forecast[occurrence_date] = 0.0
                forecast[occurrence_date] += amount

        return forecast

    def _calculate_recurring_occurrences(
        self,
        recurring_txn: RecurringTransaction,
        start_date: date,
        end_date: date
    ) -> List[Tuple[date, float]]:
        """
        Calculate when a recurring transaction will occur and its amount.

        Returns:
            List of (date, amount) tuples
        """
        occurrences = []
        current_date = recurring_txn.next_occurrence_date

        if not current_date or current_date > end_date:
            return occurrences

        while current_date <= end_date:
            if current_date >= start_date:
                # Calculate amount based on amount model
                amount = float(recurring_txn.base_amount) if recurring_txn.base_amount else 0.0
                occurrences.append((current_date, amount))

            # Calculate next occurrence based on frequency
            if recurring_txn.frequency == "DAILY":
                current_date += timedelta(days=1)
            elif recurring_txn.frequency == "WEEKLY":
                current_date += timedelta(days=7)
            elif recurring_txn.frequency == "BIWEEKLY":
                current_date += timedelta(days=14)
            elif recurring_txn.frequency == "MONTHLY":
                # Add one month (approximate)
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
            elif recurring_txn.frequency == "QUARTERLY":
                # Add 3 months
                new_month = current_date.month + 3
                new_year = current_date.year
                if new_month > 12:
                    new_month -= 12
                    new_year += 1
                current_date = current_date.replace(year=new_year, month=new_month)
            elif recurring_txn.frequency == "YEARLY":
                current_date = current_date.replace(year=current_date.year + 1)
            else:
                break

            if recurring_txn.end_date and current_date > recurring_txn.end_date:
                break

        return occurrences

    def _merge_forecasts(
        self,
        forecast1: Dict[date, float],
        forecast2: Dict[date, float]
    ) -> Dict[date, float]:
        """Merge two forecast dictionaries."""
        merged = forecast1.copy()

        for date_key, value in forecast2.items():
            if date_key in merged:
                merged[date_key] += value
            else:
                merged[date_key] = value

        return merged

    def _generate_scenario(
        self,
        base_forecast: Dict[date, float],
        current_balance: float,
        scenario_type: ScenarioType,
        variation: float = 0.0
    ) -> List[ForecastPoint]:
        """
        Generate a scenario from base forecast with variation.

        Args:
            base_forecast: Base forecast dictionary
            current_balance: Starting balance
            scenario_type: Type of scenario
            variation: Percentage variation (e.g., 0.15 for +15%)

        Returns:
            List of ForecastPoint objects
        """
        scenario = []
        running_balance = current_balance

        # Sort dates
        sorted_dates = sorted(base_forecast.keys())

        for forecast_date in sorted_dates:
            daily_flow = base_forecast[forecast_date]

            # Apply variation
            adjusted_flow = daily_flow * (1 + variation)

            running_balance += adjusted_flow

            # Calculate confidence interval (wider for longer horizons)
            days_ahead = (forecast_date - date.today()).days
            confidence_width = abs(adjusted_flow) * 0.1 * (1 + days_ahead / 100)

            point = ForecastPoint(
                date=forecast_date,
                value=running_balance,
                confidence_lower=running_balance - confidence_width,
                confidence_upper=running_balance + confidence_width,
                scenario=scenario_type
            )

            scenario.append(point)

        return scenario

    def _generate_insights(
        self,
        likely_scenario: List[ForecastPoint],
        current_balance: float
    ) -> List[str]:
        """Generate insights from the forecast."""
        insights = []

        if not likely_scenario:
            return insights

        # Check trend
        final_balance = likely_scenario[-1].value
        balance_change = final_balance - current_balance

        if balance_change > 0:
            insights.append(
                f"Your balance is projected to increase by {abs(balance_change):.2f} "
                f"over the forecast period."
            )
        elif balance_change < 0:
            insights.append(
                f"Your balance is projected to decrease by {abs(balance_change):.2f} "
                f"over the forecast period."
            )
        else:
            insights.append("Your balance is projected to remain stable.")

        # Check for low balance periods
        min_balance = min(point.value for point in likely_scenario)
        if min_balance < current_balance * 0.2:
            min_date = next(p.date for p in likely_scenario if p.value == min_balance)
            insights.append(
                f"Warning: Low balance of {min_balance:.2f} expected around {min_date}."
            )

        return insights

    def _generate_warnings(
        self,
        pessimistic_scenario: List[ForecastPoint],
        current_balance: float
    ) -> List[str]:
        """Generate warnings from the pessimistic scenario."""
        warnings = []

        if not pessimistic_scenario:
            return warnings

        # Check for negative balance
        negative_points = [p for p in pessimistic_scenario if p.value < 0]
        if negative_points:
            first_negative = negative_points[0]
            warnings.append(
                f"Risk: In a pessimistic scenario, balance could go negative "
                f"around {first_negative.date}."
            )

        # Check for significant drops
        for point in pessimistic_scenario:
            drop_percentage = ((current_balance - point.value) / current_balance) * 100
            if drop_percentage > 50:
                warnings.append(
                    f"Risk: Balance could drop by more than 50% by {point.date} "
                    f"in worst-case scenario."
                )
                break

        return warnings

    def _calculate_reliability_score(
        self,
        historical_data: pd.DataFrame,
        forecast_length: int
    ) -> float:
        """
        Calculate forecast reliability score (0-1).

        Based on:
        - Amount of historical data
        - Consistency of historical patterns
        - Forecast horizon length
        """
        if historical_data.empty:
            return 0.1  # Very low reliability with no data

        # Factor 1: Data availability (0-0.4)
        data_points = len(historical_data)
        data_score = min(data_points / 180, 1.0) * 0.4  # 180 days = full score

        # Factor 2: Pattern consistency (0-0.3)
        if data_points > 7:
            daily_amounts = historical_data.groupby('date')['amount'].sum()
            std_dev = daily_amounts.std()
            mean = abs(daily_amounts.mean())
            cv = std_dev / mean if mean > 0 else 1.0  # Coefficient of variation
            consistency_score = max(0, (1 - cv)) * 0.3
        else:
            consistency_score = 0.1

        # Factor 3: Forecast horizon (0-0.3)
        # Shorter forecasts are more reliable
        horizon_score = max(0, (1 - forecast_length / 365)) * 0.3

        total_score = data_score + consistency_score + horizon_score

        return min(max(total_score, 0.1), 1.0)  # Clamp between 0.1 and 1.0
