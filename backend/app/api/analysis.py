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
from app.api.utils import get_by_id, children_for
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
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
from app.models.merchant import Merchant
from app.models.recurring_transaction import RecurringTransaction
from app.models.enums import ScopeType, INCOME_TRANSACTION_TYPES, EXPENSE_TRANSACTION_TYPES
from app.api.dependencies import get_current_user
from app.schemas.base import CamelCaseModel

router = APIRouter()


# Response models
class CategorySpending(CamelCaseModel):
    category_id: str
    category_name: str
    total_amount: float
    percentage: float
    transaction_count: int
    currency: str


class PeriodSummary(CamelCaseModel):
    period: str
    total_income: float
    total_expenses: float
    net_flow: float
    transaction_count: int
    currency: str


class SpendingTrend(CamelCaseModel):
    period: str
    amount: float
    change_from_previous: float
    change_percentage: float


class BudgetVsActual(CamelCaseModel):
    budget_id: str
    budget_name: str
    budget_amount: float
    actual_spent: float
    variance: float
    variance_percentage: float
    is_over_budget: bool


class ProfileSummary(CamelCaseModel):
    profile_id: str
    profile_name: str
    total_income: float
    total_expenses: float
    net_worth: float
    currency: str


class ExpenseAnalysisResponse(CamelCaseModel):
    total_expenses: float
    currency: str
    by_category: List[CategorySpending]
    period_start: date
    period_end: date
    transaction_count: int


class IncomeAnalysisResponse(CamelCaseModel):
    total_income: float
    currency: str
    by_category: List[CategorySpending]
    period_start: date
    period_end: date
    transaction_count: int


class TrendAnalysisResponse(CamelCaseModel):
    trends: List[SpendingTrend]
    average: float
    min_amount: float
    max_amount: float
    currency: str
    trend_direction: str  # "increasing", "decreasing", "stable"


class BudgetComparisonResponse(CamelCaseModel):
    comparisons: List[BudgetVsActual]
    total_budget: float
    total_actual: float
    overall_variance: float
    currency: str


class MultiProfileAnalysisResponse(CamelCaseModel):
    profiles: List[ProfileSummary]
    total_income: float
    total_expenses: float
    total_net_worth: float
    currency: str


class PeriodComparisonResponse(CamelCaseModel):
    period1: PeriodSummary
    period2: PeriodSummary
    income_change: float
    income_change_percentage: float
    expense_change: float
    expense_change_percentage: float


class CashFlowResponse(CamelCaseModel):
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
    # Get and validate profile IDs
    if profile_ids:
        # Validate that all profile_ids belong to the user
        children_for(db, User, FinancialProfile, current_user.id, profile_ids)
        profile_id_list = profile_ids
    else:
        # Get all user's profiles
        profiles = get_user_profiles(db, current_user.id)
        profile_id_list = [p.id for p in profiles]

    # Query transactions
    transactions = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(profile_id_list),
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.transaction_type.in_(EXPENSE_TRANSACTION_TYPES)
    ).all()

    # Pre-fetch all categories for this user to avoid N+1 queries
    user_categories = {
        str(c.id): c.name
        for c in db.query(Category).filter(Category.user_id == current_user.id).all()
    }

    # Aggregate by category
    category_totals: dict = {}
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
            category_totals[cat_id] = {
                "category_name": user_categories.get(cat_id, "Uncategorized"),
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
    # Get and validate profile IDs
    if profile_ids:
        # Validate that all profile_ids belong to the user
        children_for(db, User, FinancialProfile, current_user.id, profile_ids)
        profile_id_list = profile_ids
    else:
        # Get all user's profiles
        profiles = get_user_profiles(db, current_user.id)
        profile_id_list = [p.id for p in profiles]

    # Query transactions
    transactions = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(profile_id_list),
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.transaction_type.in_(INCOME_TRANSACTION_TYPES)
    ).all()

    # Pre-fetch all categories for this user to avoid N+1 queries
    user_categories = {
        str(c.id): c.name
        for c in db.query(Category).filter(Category.user_id == current_user.id).all()
    }

    # Aggregate by category
    category_totals: dict = {}
    total_income = Decimal("0.00")

    for txn in transactions:
        amount = abs(convert_amount(
            txn.amount_clear, txn.currency, currency,
            txn.transaction_date, db
        ))
        total_income += amount

        cat_id = str(txn.category_id) if txn.category_id else "uncategorized"
        if cat_id not in category_totals:
            category_totals[cat_id] = {
                "category_name": user_categories.get(cat_id, "Uncategorized"),
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
    # Get and validate profile IDs
    if profile_ids:
        # Validate that all profile_ids belong to the user
        children_for(db, User, FinancialProfile, current_user.id, profile_ids)
        profile_id_list = profile_ids
    else:
        # Get all user's profiles
        profiles = get_user_profiles(db, current_user.id)
        profile_id_list = [p.id for p in profiles]

    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=months * 30)

    # Query transactions
    query = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(profile_id_list),
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.transaction_type.in_(EXPENSE_TRANSACTION_TYPES)
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
            Transaction.transaction_type.in_(EXPENSE_TRANSACTION_TYPES)
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
    # Get and validate profile IDs
    if profile_ids:
        # Validate that all profile_ids belong to the user
        children_for(db, User, FinancialProfile, current_user.id, profile_ids)
        profile_id_list = profile_ids
    else:
        # Get all user's profiles
        profiles = get_user_profiles(db, current_user.id)
        profile_id_list = [p.id for p in profiles]

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
    # Get and validate profile IDs
    if profile_ids:
        # Validate that all profile_ids belong to the user
        children_for(db, User, FinancialProfile, current_user.id, profile_ids)
        profile_id_list = profile_ids
    else:
        # Get all user's profiles
        profiles = get_user_profiles(db, current_user.id)
        profile_id_list = [p.id for p in profiles]

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


# ============================================================================
# New analytics endpoints: top-merchants, anomalies, patterns,
# category-breakdown, reports
# ============================================================================

def _get_profile_ids(db: Session, current_user: User,
                     profile_ids: Optional[List[UUID]]) -> List[UUID]:
    """Validate and return profile IDs for the current user."""
    if profile_ids:
        children_for(db, User, FinancialProfile, current_user.id, profile_ids)
        return profile_ids
    return [p.id for p in get_user_profiles(db, current_user.id)]


# --- Top Merchants ---

class TopMerchantItem(CamelCaseModel):
    merchant_name: str
    merchant_id: Optional[str] = None
    logo_url: Optional[str] = None
    category_name: Optional[str] = None
    total_amount: float
    transaction_count: int
    percentage: float
    avg_transaction: float


class TopMerchantsResponse(CamelCaseModel):
    merchants: List[TopMerchantItem]
    period_start: date
    period_end: date
    total_expenses: float


@router.get(
    "/top-merchants",
    response_model=TopMerchantsResponse,
    summary="Top merchants by spending",
)
async def get_top_merchants(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    start_date: date = Query(...),
    end_date: date = Query(...),
    limit: int = Query(10, ge=1, le=50),
    profile_ids: Optional[List[UUID]] = Query(None),
    currency: str = Query("EUR"),
) -> TopMerchantsResponse:
    pid_list = _get_profile_ids(db, current_user, profile_ids)

    transactions = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(pid_list),
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.transaction_type.in_(EXPENSE_TRANSACTION_TYPES),
    ).all()

    # Pre-fetch merchants and categories
    merchant_map: dict = {}
    for m in db.query(Merchant).all():
        merchant_map[str(m.id)] = m
    user_categories = {
        str(c.id): c.name
        for c in db.query(Category).filter(Category.user_id == current_user.id).all()
    }

    # Aggregate — prefer merchant_id, fallback to merchant_name / description_clear
    groups: dict = {}
    total_expenses = Decimal("0")

    for txn in transactions:
        amount = abs(convert_amount(
            txn.amount_clear, txn.currency, currency, txn.transaction_date, db
        ))
        total_expenses += amount

        if txn.merchant_id:
            key = f"mid:{txn.merchant_id}"
        else:
            raw = (txn.merchant_name or txn.description_clear or "Unknown").strip()
            key = f"name:{raw.lower()}"

        if key not in groups:
            if txn.merchant_id and str(txn.merchant_id) in merchant_map:
                m = merchant_map[str(txn.merchant_id)]
                groups[key] = {
                    "merchant_name": m.canonical_name,
                    "merchant_id": str(m.id),
                    "logo_url": m.logo_url,
                    "total": Decimal("0"), "count": 0, "cat_id": None,
                }
            else:
                groups[key] = {
                    "merchant_name": (txn.merchant_name or txn.description_clear or "Unknown").strip(),
                    "merchant_id": None, "logo_url": None,
                    "total": Decimal("0"), "count": 0, "cat_id": None,
                }

        groups[key]["total"] += amount
        groups[key]["count"] += 1
        if txn.category_id:
            groups[key]["cat_id"] = str(txn.category_id)

    sorted_groups = sorted(groups.values(), key=lambda g: g["total"], reverse=True)[:limit]

    items = []
    for g in sorted_groups:
        pct = float(g["total"] / total_expenses * 100) if total_expenses > 0 else 0
        items.append(TopMerchantItem(
            merchant_name=g["merchant_name"],
            merchant_id=g["merchant_id"],
            logo_url=g["logo_url"],
            category_name=user_categories.get(g["cat_id"]) if g["cat_id"] else None,
            total_amount=float(g["total"]),
            transaction_count=g["count"],
            percentage=pct,
            avg_transaction=float(g["total"] / g["count"]) if g["count"] else 0,
        ))

    return TopMerchantsResponse(
        merchants=items,
        period_start=start_date,
        period_end=end_date,
        total_expenses=float(total_expenses),
    )


# --- Anomaly Detection ---

class AnomalyItem(CamelCaseModel):
    transaction_id: str
    transaction_date: date
    description: str
    amount: float
    category_name: str
    category_avg: float
    category_stddev: float
    deviation_factor: float
    severity: str


class AnomaliesResponse(CamelCaseModel):
    anomalies: List[AnomalyItem]
    period_start: date
    period_end: date
    total_analyzed: int


@router.get(
    "/anomalies",
    response_model=AnomaliesResponse,
    summary="Detect spending anomalies",
)
async def detect_anomalies(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    start_date: date = Query(...),
    end_date: date = Query(...),
    sensitivity: str = Query("medium", pattern="^(low|medium|high)$"),
    profile_ids: Optional[List[UUID]] = Query(None),
    currency: str = Query("EUR"),
) -> AnomaliesResponse:
    pid_list = _get_profile_ids(db, current_user, profile_ids)
    thresholds = {"high": 1.5, "medium": 2.0, "low": 2.5}
    n_sigma = thresholds[sensitivity]

    # Baseline: 6 months before start_date
    baseline_start = start_date - timedelta(days=180)
    baseline_txns = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(pid_list),
        Transaction.transaction_date >= baseline_start,
        Transaction.transaction_date < start_date,
        Transaction.transaction_type.in_(EXPENSE_TRANSACTION_TYPES),
    ).all()

    # Build per-category stats from baseline
    cat_amounts: dict = {}
    for txn in baseline_txns:
        cid = str(txn.category_id) if txn.category_id else None
        if cid is None:
            continue
        amount = float(abs(convert_amount(
            txn.amount_clear, txn.currency, currency, txn.transaction_date, db
        )))
        cat_amounts.setdefault(cid, []).append(amount)

    # Compute mean/stddev per category (need >= 5 data points)
    import math
    cat_stats: dict = {}
    for cid, amounts in cat_amounts.items():
        if len(amounts) < 5:
            continue
        mean = sum(amounts) / len(amounts)
        variance = sum((a - mean) ** 2 for a in amounts) / len(amounts)
        stddev = math.sqrt(variance)
        cat_stats[cid] = {"mean": mean, "stddev": stddev}

    user_categories = {
        str(c.id): c.name
        for c in db.query(Category).filter(Category.user_id == current_user.id).all()
    }

    # Check period transactions for anomalies
    period_txns = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(pid_list),
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.transaction_type.in_(EXPENSE_TRANSACTION_TYPES),
    ).all()

    anomalies = []
    for txn in period_txns:
        cid = str(txn.category_id) if txn.category_id else None
        if cid is None or cid not in cat_stats:
            continue
        amount = float(abs(convert_amount(
            txn.amount_clear, txn.currency, currency, txn.transaction_date, db
        )))
        if amount < 5:
            continue
        stats = cat_stats[cid]
        if stats["stddev"] == 0:
            z = 10.0 if amount != stats["mean"] else 0
        else:
            z = (amount - stats["mean"]) / stats["stddev"]
        if z >= n_sigma:
            if z >= 3:
                sev = "high"
            elif z >= 2:
                sev = "medium"
            else:
                sev = "low"
            anomalies.append(AnomalyItem(
                transaction_id=str(txn.id),
                transaction_date=txn.transaction_date,
                description=txn.description_clear or txn.merchant_name or "—",
                amount=amount,
                category_name=user_categories.get(cid, "Unknown"),
                category_avg=round(stats["mean"], 2),
                category_stddev=round(stats["stddev"], 2),
                deviation_factor=round(z, 2),
                severity=sev,
            ))

    anomalies.sort(key=lambda a: a.deviation_factor, reverse=True)

    return AnomaliesResponse(
        anomalies=anomalies,
        period_start=start_date,
        period_end=end_date,
        total_analyzed=len(period_txns),
    )


# --- Spending Patterns ---

class DayOfWeekSpending(CamelCaseModel):
    day: int
    day_name: str
    total: float
    avg: float
    transaction_count: int


class WeekOfMonthSpending(CamelCaseModel):
    week: int
    label: str
    total: float
    avg: float


class CategoryTrend(CamelCaseModel):
    category_name: str
    category_id: str
    monthly_totals: List[dict]
    trend: str
    trend_pct: float


class DetectedRecurring(CamelCaseModel):
    description: str
    merchant_name: Optional[str] = None
    avg_amount: float
    occurrence_count: int
    estimated_frequency: str
    last_occurrence: date
    already_tracked: bool


class PatternsResponse(CamelCaseModel):
    day_of_week: List[DayOfWeekSpending]
    busiest_day: str
    quietest_day: str
    week_of_month: List[WeekOfMonthSpending]
    category_trends: List[CategoryTrend]
    detected_recurring: List[DetectedRecurring]
    period_start: date
    period_end: date


DAY_NAMES_IT = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]
WEEK_LABELS = ["1-7", "8-14", "15-21", "22-28", "29-31"]


@router.get(
    "/patterns",
    response_model=PatternsResponse,
    summary="Spending patterns analysis",
)
async def get_patterns(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    start_date: date = Query(...),
    end_date: date = Query(...),
    profile_ids: Optional[List[UUID]] = Query(None),
    currency: str = Query("EUR"),
) -> PatternsResponse:
    pid_list = _get_profile_ids(db, current_user, profile_ids)

    transactions = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(pid_list),
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.transaction_type.in_(EXPENSE_TRANSACTION_TYPES),
    ).all()

    user_categories = {
        str(c.id): c.name
        for c in db.query(Category).filter(Category.user_id == current_user.id).all()
    }

    # 1. Day of week (Python: Monday=0 .. Sunday=6)
    dow_totals: dict = {i: {"total": Decimal("0"), "count": 0} for i in range(7)}
    # 2. Week of month
    wom_totals: dict = {i: {"total": Decimal("0"), "count": 0} for i in range(5)}
    # 3. Category monthly
    cat_monthly: dict = {}

    num_months = max(1, ((end_date.year - start_date.year) * 12 +
                         end_date.month - start_date.month) or 1)

    for txn in transactions:
        amount = abs(convert_amount(
            txn.amount_clear, txn.currency, currency, txn.transaction_date, db
        ))
        # Day of week
        dow = txn.transaction_date.weekday()
        dow_totals[dow]["total"] += amount
        dow_totals[dow]["count"] += 1
        # Week of month
        day_num = txn.transaction_date.day
        wom_idx = min((day_num - 1) // 7, 4)
        wom_totals[wom_idx]["total"] += amount
        wom_totals[wom_idx]["count"] += 1
        # Category monthly
        cid = str(txn.category_id) if txn.category_id else None
        if cid:
            mk = txn.transaction_date.strftime("%Y-%m")
            cat_monthly.setdefault(cid, {}).setdefault(mk, Decimal("0"))
            cat_monthly[cid][mk] += amount

    # Build day_of_week
    dow_items = []
    for i in range(7):
        d = dow_totals[i]
        dow_items.append(DayOfWeekSpending(
            day=i, day_name=DAY_NAMES_IT[i],
            total=float(d["total"]),
            avg=float(d["total"] / num_months) if num_months else 0,
            transaction_count=d["count"],
        ))
    busiest = max(dow_items, key=lambda x: x.total)
    quietest = min(dow_items, key=lambda x: x.total)

    # Build week_of_month
    wom_items = []
    for i in range(5):
        d = wom_totals[i]
        wom_items.append(WeekOfMonthSpending(
            week=i + 1, label=WEEK_LABELS[i],
            total=float(d["total"]),
            avg=float(d["total"] / num_months) if num_months else 0,
        ))

    # Build category trends (top 5 by total)
    cat_totals_sorted = sorted(
        cat_monthly.items(),
        key=lambda kv: sum(kv[1].values()), reverse=True
    )[:5]

    cat_trends = []
    for cid, monthly in cat_totals_sorted:
        sorted_months = sorted(monthly.keys())
        amounts_list = [float(monthly[m]) for m in sorted_months]
        monthly_dicts = [{"month": m, "amount": float(monthly[m])} for m in sorted_months]
        # Simple trend: compare first half vs second half
        if len(amounts_list) >= 2:
            mid = len(amounts_list) // 2
            first = sum(amounts_list[:mid]) / mid
            second = sum(amounts_list[mid:]) / (len(amounts_list) - mid)
            avg_val = sum(amounts_list) / len(amounts_list)
            if avg_val > 0:
                pct = (second - first) / avg_val * 100
            else:
                pct = 0
            if pct > 5:
                trend_dir = "increasing"
            elif pct < -5:
                trend_dir = "decreasing"
            else:
                trend_dir = "stable"
        else:
            trend_dir = "stable"
            pct = 0

        cat_trends.append(CategoryTrend(
            category_name=user_categories.get(cid, "Unknown"),
            category_id=cid,
            monthly_totals=monthly_dicts,
            trend=trend_dir,
            trend_pct=round(pct, 1),
        ))

    # Detect recurring: group by description, find regular intervals
    desc_groups: dict = {}
    for txn in transactions:
        key = (txn.merchant_name or txn.description_clear or "").strip().lower()
        if not key or len(key) < 3:
            continue
        amt = float(abs(txn.amount_clear))
        desc_groups.setdefault(key, []).append({
            "date": txn.transaction_date,
            "amount": amt,
            "merchant_name": txn.merchant_name,
        })

    # Check existing recurring transactions for this user's profiles
    existing_recurring = set()
    recs = db.query(RecurringTransaction).filter(
        RecurringTransaction.financial_profile_id.in_(pid_list),
        RecurringTransaction.is_active == True,
    ).all()
    for r in recs:
        existing_recurring.add(r.name.strip().lower())

    detected = []
    for key, txn_list in desc_groups.items():
        if len(txn_list) < 3:
            continue
        amounts = [t["amount"] for t in txn_list]
        avg_amt = sum(amounts) / len(amounts)
        # Check amount consistency (within ±20%)
        if avg_amt > 0 and all(abs(a - avg_amt) / avg_amt < 0.20 for a in amounts):
            dates_sorted = sorted(t["date"] for t in txn_list)
            intervals = [(dates_sorted[i+1] - dates_sorted[i]).days
                        for i in range(len(dates_sorted) - 1)]
            avg_interval = sum(intervals) / len(intervals) if intervals else 0
            if 25 <= avg_interval <= 35:
                freq = "monthly"
            elif 12 <= avg_interval <= 16:
                freq = "biweekly"
            elif 5 <= avg_interval <= 9:
                freq = "weekly"
            else:
                continue
            display_name = txn_list[0].get("merchant_name") or key.title()
            detected.append(DetectedRecurring(
                description=display_name,
                merchant_name=txn_list[0].get("merchant_name"),
                avg_amount=round(avg_amt, 2),
                occurrence_count=len(txn_list),
                estimated_frequency=freq,
                last_occurrence=dates_sorted[-1],
                already_tracked=key in existing_recurring,
            ))

    detected.sort(key=lambda d: d.avg_amount, reverse=True)

    return PatternsResponse(
        day_of_week=dow_items,
        busiest_day=busiest.day_name,
        quietest_day=quietest.day_name,
        week_of_month=wom_items,
        category_trends=cat_trends,
        detected_recurring=detected,
        period_start=start_date,
        period_end=end_date,
    )


# --- Category Breakdown (drill-down by merchant/description) ---

class CategoryBreakdownItem(CamelCaseModel):
    label: str
    merchant_id: Optional[str] = None
    total_amount: float
    transaction_count: int
    percentage: float
    avg_amount: float


class CategoryBreakdownResponse(CamelCaseModel):
    category_id: str
    category_name: str
    total_category_spending: float
    breakdown: List[CategoryBreakdownItem]
    period_start: date
    period_end: date


@router.get(
    "/categories/{category_id}/breakdown",
    response_model=CategoryBreakdownResponse,
    summary="Category spending breakdown",
)
async def get_category_breakdown(
    category_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    start_date: date = Query(...),
    end_date: date = Query(...),
    profile_ids: Optional[List[UUID]] = Query(None),
    limit: int = Query(15, ge=1, le=50),
    currency: str = Query("EUR"),
) -> CategoryBreakdownResponse:
    pid_list = _get_profile_ids(db, current_user, profile_ids)

    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id,
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    transactions = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(pid_list),
        Transaction.category_id == category_id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.transaction_type.in_(EXPENSE_TRANSACTION_TYPES),
    ).all()

    merchant_map: dict = {}
    for m in db.query(Merchant).all():
        merchant_map[str(m.id)] = m

    groups: dict = {}
    total_cat = Decimal("0")

    for txn in transactions:
        amount = abs(convert_amount(
            txn.amount_clear, txn.currency, currency, txn.transaction_date, db
        ))
        total_cat += amount

        if txn.merchant_id and str(txn.merchant_id) in merchant_map:
            m = merchant_map[str(txn.merchant_id)]
            key = f"mid:{m.id}"
            label = m.canonical_name
            mid = str(m.id)
        else:
            raw = (txn.merchant_name or txn.description_clear or "Other").strip()
            key = f"name:{raw.lower()}"
            label = raw
            mid = None

        if key not in groups:
            groups[key] = {"label": label, "mid": mid, "total": Decimal("0"), "count": 0}
        groups[key]["total"] += amount
        groups[key]["count"] += 1

    sorted_groups = sorted(groups.values(), key=lambda g: g["total"], reverse=True)[:limit]

    items = []
    for g in sorted_groups:
        pct = float(g["total"] / total_cat * 100) if total_cat > 0 else 0
        items.append(CategoryBreakdownItem(
            label=g["label"],
            merchant_id=g["mid"],
            total_amount=float(g["total"]),
            transaction_count=g["count"],
            percentage=pct,
            avg_amount=float(g["total"] / g["count"]) if g["count"] else 0,
        ))

    return CategoryBreakdownResponse(
        category_id=str(category_id),
        category_name=category.name,
        total_category_spending=float(total_cat),
        breakdown=items,
        period_start=start_date,
        period_end=end_date,
    )


# --- Report Generation (CSV) ---

class ReportRequest(CamelCaseModel):
    report_type: str  # "monthly_summary", "category_breakdown", "full_report"
    start_date: date
    end_date: date
    profile_ids: Optional[List[UUID]] = None


class ReportMeta(CamelCaseModel):
    report_type: str
    period_start: date
    period_end: date
    row_count: int
    download_url: str


@router.post(
    "/reports/generate",
    response_model=ReportMeta,
    summary="Generate analytics report",
)
async def generate_report(
    body: ReportRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ReportMeta:
    import csv
    import io
    import os
    import uuid as uuid_mod

    pid_list = _get_profile_ids(db, current_user, body.profile_ids)
    user_categories = {
        str(c.id): c.name
        for c in db.query(Category).filter(Category.user_id == current_user.id).all()
    }

    transactions = db.query(Transaction).join(Account).filter(
        Account.financial_profile_id.in_(pid_list),
        Transaction.transaction_date >= body.start_date,
        Transaction.transaction_date <= body.end_date,
    ).order_by(Transaction.transaction_date).all()

    buf = io.StringIO()
    writer = csv.writer(buf)

    if body.report_type == "monthly_summary":
        writer.writerow(["Month", "Income", "Expenses", "Net", "SavingsRate", "TopCategory"])
        monthly: dict = {}
        cat_monthly: dict = {}
        for txn in transactions:
            mk = txn.transaction_date.strftime("%Y-%m")
            monthly.setdefault(mk, {"income": Decimal("0"), "expenses": Decimal("0")})
            cat_monthly.setdefault(mk, {})
            if txn.transaction_type in INCOME_TRANSACTION_TYPES:
                monthly[mk]["income"] += abs(txn.amount_clear)
            elif txn.transaction_type in EXPENSE_TRANSACTION_TYPES:
                monthly[mk]["expenses"] += abs(txn.amount_clear)
                cid = str(txn.category_id) if txn.category_id else "uncategorized"
                cat_monthly[mk].setdefault(cid, Decimal("0"))
                cat_monthly[mk][cid] += abs(txn.amount_clear)
        for mk in sorted(monthly.keys()):
            d = monthly[mk]
            net = d["income"] - d["expenses"]
            rate = float(net / d["income"] * 100) if d["income"] > 0 else 0
            top = max(cat_monthly.get(mk, {"?": Decimal("0")}).items(),
                      key=lambda kv: kv[1], default=("?", 0))
            top_name = user_categories.get(top[0], top[0])
            writer.writerow([mk, float(d["income"]), float(d["expenses"]),
                             float(net), round(rate, 1), top_name])
        row_count = len(monthly)

    elif body.report_type == "category_breakdown":
        writer.writerow(["Category", "Total", "Transactions", "Percentage", "Average"])
        cat_data: dict = {}
        total_exp = Decimal("0")
        for txn in transactions:
            if txn.amount_clear >= 0:
                continue
            amt = abs(txn.amount_clear)
            total_exp += amt
            cid = str(txn.category_id) if txn.category_id else "uncategorized"
            cat_data.setdefault(cid, {"total": Decimal("0"), "count": 0})
            cat_data[cid]["total"] += amt
            cat_data[cid]["count"] += 1
        for cid, d in sorted(cat_data.items(), key=lambda kv: kv[1]["total"], reverse=True):
            pct = float(d["total"] / total_exp * 100) if total_exp > 0 else 0
            avg = float(d["total"] / d["count"]) if d["count"] else 0
            writer.writerow([user_categories.get(cid, cid), float(d["total"]),
                             d["count"], round(pct, 1), round(avg, 2)])
        row_count = len(cat_data)

    else:  # full_report
        writer.writerow(["Date", "Description", "Category", "Amount", "Currency", "Account"])
        acct_map = {
            str(a.id): a.name for a in db.query(Account).filter(
                Account.financial_profile_id.in_(pid_list)
            ).all()
        }
        for txn in transactions:
            writer.writerow([
                txn.transaction_date.isoformat(),
                txn.description_clear or txn.merchant_name or "",
                user_categories.get(str(txn.category_id), "") if txn.category_id else "",
                float(txn.amount_clear),
                txn.currency,
                acct_map.get(str(txn.account_id), ""),
            ])
        row_count = len(transactions)

    # Save to /tmp
    report_id = str(uuid_mod.uuid4())
    tmp_path = f"/tmp/financepro_report_{report_id}.csv"
    with open(tmp_path, "w", encoding="utf-8") as f:
        f.write(buf.getvalue())

    return ReportMeta(
        report_type=body.report_type,
        period_start=body.start_date,
        period_end=body.end_date,
        row_count=row_count,
        download_url=f"/api/v1/analysis/reports/{report_id}/download",
    )


from fastapi.responses import FileResponse


@router.get(
    "/reports/{report_id}/download",
    summary="Download generated report",
)
async def download_report(
    report_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
):
    import os
    tmp_path = f"/tmp/financepro_report_{report_id}.csv"
    if not os.path.exists(tmp_path):
        raise HTTPException(status_code=404, detail="Report not found or expired")
    return FileResponse(
        tmp_path,
        media_type="text/csv",
        filename=f"financepro_report_{report_id}.csv",
    )
