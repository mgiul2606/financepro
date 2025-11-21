# app/api/analysis.py
"""
Analysis Router for FinancePro API v1.

Provides comprehensive financial analysis endpoints:
- Expense analysis (by category, period, profile, multi-profile)
- Income analysis
- Spending trends vs budget
- Multi-currency aggregations with automatic conversion
- Advanced reporting (period comparison, cross-profile aggregates)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from typing import Annotated, Optional, List
from uuid import UUID
from datetime import date, datetime, timedelta
from decimal import Decimal

from app.db.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.category import Category
from app.models.financial_profile import FinancialProfile
from app.models.budget import Budget, BudgetCategory
from app.models.exchange_rate import ExchangeRate
from app.models.enums import TransactionType, ScopeType
from app.core.rls import get_rls_context
from app.api.dependencies import get_current_user
from app.services.v2 import ExchangeRateService
from pydantic import BaseModel

router = APIRouter()


# Response models
class CategorySpending(BaseModel):
    category_id: str
    category_name: str
    total_amount: float
    percentage: float
    transaction_count: int
    currency: str


class PeriodSummary(BaseModel):
    period: str
    total_income: float
    total_expenses: float
    net_flow: float
    transaction_count: int
    currency: str


class SpendingTrend(BaseModel):
    period: str
    amount: float
    change_from_previous: float
    change_percentage: float


class BudgetVsActual(BaseModel):
    budget_id: str
    budget_name: str
    budget_amount: float
    actual_spent: float
    variance: float
    variance_percentage: float
    is_over_budget: bool


class ProfileSummary(BaseModel):
    profile_id: str
    profile_name: str
    total_income: float
    total_expenses: float
    net_worth: float
    currency: str


class ExpenseAnalysisResponse(BaseModel):
    total_expenses: float
    currency: str
    by_category: List[CategorySpending]
    period_start: date
    period_end: date
    transaction_count: int


class IncomeAnalysisResponse(BaseModel):
    total_income: float
    currency: str
    by_category: List[CategorySpending]
    period_start: date
    period_end: date
    transaction_count: int


class TrendAnalysisResponse(BaseModel):
    trends: List[SpendingTrend]
    average: float
    min_amount: float
    max_amount: float
    currency: str
    trend_direction: str  # "increasing", "decreasing", "stable"


class BudgetComparisonResponse(BaseModel):
    comparisons: List[BudgetVsActual]
    total_budget: float
    total_actual: float
    overall_variance: float
    currency: str


class MultiProfileAnalysisResponse(BaseModel):
    profiles: List[ProfileSummary]
    total_income: float
    total_expenses: float
    total_net_worth: float
    currency: str


class PeriodComparisonResponse(BaseModel):
    period1: PeriodSummary
    period2: PeriodSummary
    income_change: float
    income_change_percentage: float
    expense_change: float
    expense_change_percentage: float


class CashFlowResponse(BaseModel):
    period_summaries: List[PeriodSummary]
    total_income: float
    total_expenses: float
    net_cash_flow: float
    average_monthly_income: float
    average_monthly_expenses: float
    currency: str


def get_user_profiles(db: Session, user_id: UUID) -> List[FinancialProfile]:
    """Get all profiles for a user."""
    return db.query(FinancialProfile).filter(
        FinancialProfile.user_id == user_id,
        FinancialProfile.is_active == True
    ).all()


def convert_amount(amount: Decimal, from_currency: str, to_currency: str,
                   rate_date: date, db: Session) -> Decimal:
    """Convert amount between currencies using exchange rate."""
    if from_currency == to_currency:
        return amount

    rate = db.query(ExchangeRate).filter(
        ExchangeRate.base_currency == from_currency,
        ExchangeRate.target_currency == to_currency,
        ExchangeRate.rate_date <= rate_date
    ).order_by(ExchangeRate.rate_date.desc()).first()

    if rate:
        return amount * rate.rate

    # Try reverse rate
    rate = db.query(ExchangeRate).filter(
        ExchangeRate.base_currency == to_currency,
        ExchangeRate.target_currency == from_currency,
        ExchangeRate.rate_date <= rate_date
    ).order_by(ExchangeRate.rate_date.desc()).first()

    if rate and rate.rate != 0:
        return amount / rate.rate

    return amount  # Fallback: no conversion


@router.get(
    "/expenses",
    response_model=ExpenseAnalysisResponse,
    summary="Analyze expenses",
    description="Get expense analysis by category for a period"
)
async def analyze_expenses(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    start_date: date = Query(..., description="Start date"),
    end_date: date = Query(..., description="End date"),
    profile_ids: Optional[List[UUID]] = Query(None, description="Profile IDs to include"),
    currency: str = Query("EUR", description="Target currency for conversion")
) -> ExpenseAnalysisResponse:
    """Analyze expenses by category."""
    # Get user's profiles
    profiles = get_user_profiles(db, current_user.id)
    profile_id_list = [p.id for p in profiles]

    if profile_ids:
        profile_id_list = [pid for pid in profile_ids if pid in profile_id_list]

    # Query transactions
    transactions = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(profile_id_list),
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.amount_clear < 0  # Expenses are negative
    ).all()

    # Aggregate by category
    category_totals = {}
    total_expenses = Decimal("0.00")

    for txn in transactions:
        # Convert to target currency
        amount = abs(convert_amount(
            txn.amount_clear, txn.currency, currency,
            txn.transaction_date, db
        ))
        total_expenses += amount

        cat_id = str(txn.category_id) if txn.category_id else "uncategorized"
        if cat_id not in category_totals:
            category = db.query(Category).filter(Category.id == txn.category_id).first() if txn.category_id else None
            category_totals[cat_id] = {
                "category_name": category.name if category else "Uncategorized",
                "total_amount": Decimal("0.00"),
                "transaction_count": 0
            }

        category_totals[cat_id]["total_amount"] += amount
        category_totals[cat_id]["transaction_count"] += 1

    # Build response
    by_category = []
    for cat_id, data in category_totals.items():
        percentage = (data["total_amount"] / total_expenses * 100) if total_expenses > 0 else 0
        by_category.append(CategorySpending(
            category_id=cat_id,
            category_name=data["category_name"],
            total_amount=float(data["total_amount"]),
            percentage=float(percentage),
            transaction_count=data["transaction_count"],
            currency=currency
        ))

    # Sort by amount descending
    by_category.sort(key=lambda x: x.total_amount, reverse=True)

    return ExpenseAnalysisResponse(
        total_expenses=float(total_expenses),
        currency=currency,
        by_category=by_category,
        period_start=start_date,
        period_end=end_date,
        transaction_count=len(transactions)
    )


@router.get(
    "/income",
    response_model=IncomeAnalysisResponse,
    summary="Analyze income",
    description="Get income analysis by category for a period"
)
async def analyze_income(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    start_date: date = Query(..., description="Start date"),
    end_date: date = Query(..., description="End date"),
    profile_ids: Optional[List[UUID]] = Query(None, description="Profile IDs to include"),
    currency: str = Query("EUR", description="Target currency for conversion")
) -> IncomeAnalysisResponse:
    """Analyze income by category."""
    # Get user's profiles
    profiles = get_user_profiles(db, current_user.id)
    profile_id_list = [p.id for p in profiles]

    if profile_ids:
        profile_id_list = [pid for pid in profile_ids if pid in profile_id_list]

    # Query transactions
    transactions = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(profile_id_list),
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.amount_clear > 0  # Income is positive
    ).all()

    # Aggregate by category
    category_totals = {}
    total_income = Decimal("0.00")

    for txn in transactions:
        amount = convert_amount(
            txn.amount_clear, txn.currency, currency,
            txn.transaction_date, db
        )
        total_income += amount

        cat_id = str(txn.category_id) if txn.category_id else "uncategorized"
        if cat_id not in category_totals:
            category = db.query(Category).filter(Category.id == txn.category_id).first() if txn.category_id else None
            category_totals[cat_id] = {
                "category_name": category.name if category else "Uncategorized",
                "total_amount": Decimal("0.00"),
                "transaction_count": 0
            }

        category_totals[cat_id]["total_amount"] += amount
        category_totals[cat_id]["transaction_count"] += 1

    # Build response
    by_category = []
    for cat_id, data in category_totals.items():
        percentage = (data["total_amount"] / total_income * 100) if total_income > 0 else 0
        by_category.append(CategorySpending(
            category_id=cat_id,
            category_name=data["category_name"],
            total_amount=float(data["total_amount"]),
            percentage=float(percentage),
            transaction_count=data["transaction_count"],
            currency=currency
        ))

    by_category.sort(key=lambda x: x.total_amount, reverse=True)

    return IncomeAnalysisResponse(
        total_income=float(total_income),
        currency=currency,
        by_category=by_category,
        period_start=start_date,
        period_end=end_date,
        transaction_count=len(transactions)
    )


@router.get(
    "/trends",
    response_model=TrendAnalysisResponse,
    summary="Get spending trends",
    description="Get monthly spending trends over time"
)
async def get_spending_trends(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    months: int = Query(6, ge=1, le=24, description="Number of months to analyze"),
    profile_ids: Optional[List[UUID]] = Query(None, description="Profile IDs to include"),
    category_id: Optional[UUID] = Query(None, description="Filter by category"),
    currency: str = Query("EUR", description="Target currency")
) -> TrendAnalysisResponse:
    """Get spending trends by month."""
    # Get user's profiles
    profiles = get_user_profiles(db, current_user.id)
    profile_id_list = [p.id for p in profiles]

    if profile_ids:
        profile_id_list = [pid for pid in profile_ids if pid in profile_id_list]

    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=months * 30)

    # Query transactions
    query = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(profile_id_list),
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.amount_clear < 0
    )

    if category_id:
        query = query.filter(Transaction.category_id == category_id)

    transactions = query.all()

    # Aggregate by month
    monthly_totals = {}
    for txn in transactions:
        month_key = txn.transaction_date.strftime("%Y-%m")
        amount = abs(convert_amount(
            txn.amount_clear, txn.currency, currency,
            txn.transaction_date, db
        ))

        if month_key not in monthly_totals:
            monthly_totals[month_key] = Decimal("0.00")
        monthly_totals[month_key] += amount

    # Build trends
    sorted_months = sorted(monthly_totals.keys())
    trends = []
    prev_amount = None

    for month in sorted_months:
        amount = monthly_totals[month]
        change = float(amount - prev_amount) if prev_amount else 0
        change_pct = (change / float(prev_amount) * 100) if prev_amount and prev_amount != 0 else 0

        trends.append(SpendingTrend(
            period=month,
            amount=float(amount),
            change_from_previous=change,
            change_percentage=change_pct
        ))
        prev_amount = amount

    # Calculate statistics
    amounts = [t.amount for t in trends] if trends else [0]
    avg = sum(amounts) / len(amounts)

    # Determine trend direction
    if len(trends) >= 2:
        first_half = sum(t.amount for t in trends[:len(trends)//2]) / (len(trends)//2)
        second_half = sum(t.amount for t in trends[len(trends)//2:]) / (len(trends) - len(trends)//2)
        if second_half > first_half * 1.1:
            direction = "increasing"
        elif second_half < first_half * 0.9:
            direction = "decreasing"
        else:
            direction = "stable"
    else:
        direction = "stable"

    return TrendAnalysisResponse(
        trends=trends,
        average=avg,
        min_amount=min(amounts),
        max_amount=max(amounts),
        currency=currency,
        trend_direction=direction
    )


@router.get(
    "/budget-comparison",
    response_model=BudgetComparisonResponse,
    summary="Compare budget vs actual",
    description="Compare budget allocations with actual spending"
)
async def compare_budget_vs_actual(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    currency: str = Query("EUR", description="Target currency")
) -> BudgetComparisonResponse:
    """Compare budgets with actual spending."""
    # Get active budgets for user
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.is_active == True
    ).all()

    comparisons = []
    total_budget = Decimal("0.00")
    total_actual = Decimal("0.00")

    for budget in budgets:
        # Get profile IDs for this budget
        if budget.scope_type == ScopeType.USER:
            profiles = get_user_profiles(db, current_user.id)
            profile_ids = [p.id for p in profiles]
        else:
            profile_ids = budget.scope_profile_ids or []

        # Get category IDs for this budget
        category_ids = [bc.category_id for bc in budget.budget_categories]

        if not category_ids or not profile_ids:
            continue

        # Calculate actual spending
        actual = db.query(func.sum(func.abs(Transaction.amount_clear))).join(Account).filter(
            Account.financial_profile_id.in_(profile_ids),
            Transaction.category_id.in_(category_ids),
            Transaction.transaction_date >= budget.start_date,
            Transaction.transaction_date <= (budget.end_date or date.today()),
            Transaction.amount_clear < 0
        ).scalar() or Decimal("0.00")

        variance = budget.total_amount - actual
        variance_pct = (variance / budget.total_amount * 100) if budget.total_amount > 0 else 0

        comparisons.append(BudgetVsActual(
            budget_id=str(budget.id),
            budget_name=budget.name,
            budget_amount=float(budget.total_amount),
            actual_spent=float(actual),
            variance=float(variance),
            variance_percentage=float(variance_pct),
            is_over_budget=actual > budget.total_amount
        ))

        total_budget += budget.total_amount
        total_actual += actual

    return BudgetComparisonResponse(
        comparisons=comparisons,
        total_budget=float(total_budget),
        total_actual=float(total_actual),
        overall_variance=float(total_budget - total_actual),
        currency=currency
    )


@router.get(
    "/cash-flow",
    response_model=CashFlowResponse,
    summary="Get cash flow analysis",
    description="Get monthly cash flow analysis"
)
async def get_cash_flow(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    months: int = Query(6, ge=1, le=24, description="Number of months"),
    profile_ids: Optional[List[UUID]] = Query(None, description="Profile IDs"),
    currency: str = Query("EUR", description="Target currency")
) -> CashFlowResponse:
    """Get cash flow by month."""
    profiles = get_user_profiles(db, current_user.id)
    profile_id_list = [p.id for p in profiles]

    if profile_ids:
        profile_id_list = [pid for pid in profile_ids if pid in profile_id_list]

    end_date = date.today()
    start_date = end_date - timedelta(days=months * 30)

    transactions = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(profile_id_list),
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).all()

    # Aggregate by month
    monthly_data = {}
    for txn in transactions:
        month_key = txn.transaction_date.strftime("%Y-%m")
        amount = convert_amount(
            txn.amount_clear, txn.currency, currency,
            txn.transaction_date, db
        )

        if month_key not in monthly_data:
            monthly_data[month_key] = {"income": Decimal("0"), "expenses": Decimal("0"), "count": 0}

        if amount > 0:
            monthly_data[month_key]["income"] += amount
        else:
            monthly_data[month_key]["expenses"] += abs(amount)
        monthly_data[month_key]["count"] += 1

    # Build summaries
    summaries = []
    total_income = Decimal("0")
    total_expenses = Decimal("0")

    for month in sorted(monthly_data.keys()):
        data = monthly_data[month]
        net = data["income"] - data["expenses"]

        summaries.append(PeriodSummary(
            period=month,
            total_income=float(data["income"]),
            total_expenses=float(data["expenses"]),
            net_flow=float(net),
            transaction_count=data["count"],
            currency=currency
        ))

        total_income += data["income"]
        total_expenses += data["expenses"]

    num_months = len(summaries) or 1

    return CashFlowResponse(
        period_summaries=summaries,
        total_income=float(total_income),
        total_expenses=float(total_expenses),
        net_cash_flow=float(total_income - total_expenses),
        average_monthly_income=float(total_income / num_months),
        average_monthly_expenses=float(total_expenses / num_months),
        currency=currency
    )


@router.get(
    "/multi-profile",
    response_model=MultiProfileAnalysisResponse,
    summary="Multi-profile analysis",
    description="Get aggregated analysis across multiple profiles"
)
async def analyze_multi_profile(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    start_date: date = Query(..., description="Start date"),
    end_date: date = Query(..., description="End date"),
    currency: str = Query("EUR", description="Target currency")
) -> MultiProfileAnalysisResponse:
    """Analyze across all user profiles."""
    profiles = get_user_profiles(db, current_user.id)

    profile_summaries = []
    total_income = Decimal("0")
    total_expenses = Decimal("0")
    total_net_worth = Decimal("0")

    for profile in profiles:
        # Get transactions for profile
        transactions = db.query(Transaction).join(Account).filter(
            Account.financial_profile_id == profile.id,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        ).all()

        income = Decimal("0")
        expenses = Decimal("0")

        for txn in transactions:
            amount = convert_amount(
                txn.amount_clear, txn.currency, currency,
                txn.transaction_date, db
            )
            if amount > 0:
                income += amount
            else:
                expenses += abs(amount)

        # Get account balances for net worth
        accounts = db.query(Account).filter(
            Account.financial_profile_id == profile.id,
            Account.is_active == True,
            Account.is_included_in_totals == True
        ).all()

        net_worth = sum(convert_amount(
            a.current_balance, a.currency, currency, date.today(), db
        ) for a in accounts)

        profile_summaries.append(ProfileSummary(
            profile_id=str(profile.id),
            profile_name=profile.name,
            total_income=float(income),
            total_expenses=float(expenses),
            net_worth=float(net_worth),
            currency=currency
        ))

        total_income += income
        total_expenses += expenses
        total_net_worth += net_worth

    return MultiProfileAnalysisResponse(
        profiles=profile_summaries,
        total_income=float(total_income),
        total_expenses=float(total_expenses),
        total_net_worth=float(total_net_worth),
        currency=currency
    )


@router.get(
    "/period-comparison",
    response_model=PeriodComparisonResponse,
    summary="Compare periods",
    description="Compare financial performance between two periods"
)
async def compare_periods(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    period1_start: date = Query(..., description="Period 1 start"),
    period1_end: date = Query(..., description="Period 1 end"),
    period2_start: date = Query(..., description="Period 2 start"),
    period2_end: date = Query(..., description="Period 2 end"),
    profile_ids: Optional[List[UUID]] = Query(None, description="Profile IDs"),
    currency: str = Query("EUR", description="Target currency")
) -> PeriodComparisonResponse:
    """Compare two time periods."""
    profiles = get_user_profiles(db, current_user.id)
    profile_id_list = [p.id for p in profiles]

    if profile_ids:
        profile_id_list = [pid for pid in profile_ids if pid in profile_id_list]

    def get_period_summary(start: date, end: date) -> PeriodSummary:
        transactions = db.query(Transaction).join(Account).filter(
            Account.financial_profile_id.in_(profile_id_list),
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end
        ).all()

        income = Decimal("0")
        expenses = Decimal("0")

        for txn in transactions:
            amount = convert_amount(
                txn.amount_clear, txn.currency, currency,
                txn.transaction_date, db
            )
            if amount > 0:
                income += amount
            else:
                expenses += abs(amount)

        return PeriodSummary(
            period=f"{start} to {end}",
            total_income=float(income),
            total_expenses=float(expenses),
            net_flow=float(income - expenses),
            transaction_count=len(transactions),
            currency=currency
        )

    period1 = get_period_summary(period1_start, period1_end)
    period2 = get_period_summary(period2_start, period2_end)

    income_change = period2.total_income - period1.total_income
    income_pct = (income_change / period1.total_income * 100) if period1.total_income > 0 else 0

    expense_change = period2.total_expenses - period1.total_expenses
    expense_pct = (expense_change / period1.total_expenses * 100) if period1.total_expenses > 0 else 0

    return PeriodComparisonResponse(
        period1=period1,
        period2=period2,
        income_change=income_change,
        income_change_percentage=income_pct,
        expense_change=expense_change,
        expense_change_percentage=expense_pct
    )
