# app/services/v2/budget_service.py
"""
Budget Service for FinancePro v2.1.

Handles budget operations with:
- Scope support (user, profile, multi_profile)
- Spent amount calculation
- Alert threshold monitoring
- Notification creation
"""
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from calendar import monthrange
import logging

from app.models import (
    Budget,
    BudgetCategory,
    Transaction,
    Category,
    FinancialProfile,
    Notification,
    ScopeType,
    PeriodType,
    TransactionType,
    NotificationType,
    NotificationStatus
)
from app.core.rls import RLSService

logger = logging.getLogger(__name__)

# Transaction types that represent money going out (expenses)
EXPENSE_TRANSACTION_TYPES = [
    TransactionType.PURCHASE,
    TransactionType.PAYMENT,
    TransactionType.WITHDRAWAL,
    TransactionType.LOAN_PAYMENT,
    TransactionType.ASSET_PURCHASE,
]


class BudgetService:
    """
    Service for budget operations with scope support.

    Usage:
        service = BudgetService(db, rls)
        budget = service.create_budget(
            user_id=user_id,
            name="Monthly Groceries",
            scope_type=ScopeType.USER,
            period_type=PeriodType.MONTHLY,
            start_date=date(2025, 1, 1),
            total_amount=Decimal("500.00"),
            currency="EUR"
        )
    """

    def __init__(self, db: Session, rls: RLSService):
        """Initialize budget service."""
        self.db = db
        self.rls = rls

    def create_budget(
        self,
        user_id: UUID,
        name: str,
        scope_type: ScopeType,
        period_type: PeriodType,
        start_date: date,
        total_amount: Decimal,
        currency: str,
        scope_profile_ids: Optional[List[UUID]] = None,
        end_date: Optional[date] = None,
        rollover_enabled: bool = False,
        alert_threshold_percent: int = 80,
        category_allocations: Optional[List[Dict[str, Any]]] = None
    ) -> Budget:
        """
        Create a new budget with scope support.

        Args:
            user_id: User ID (owner)
            name: Budget name
            scope_type: Scope type (user, profile, multi_profile)
            period_type: Period type (monthly, quarterly, etc.)
            start_date: Budget start date
            total_amount: Total budget amount
            currency: Currency code
            scope_profile_ids: Profile IDs for scope (required for profile/multi_profile)
            end_date: Budget end date (optional)
            rollover_enabled: Whether to rollover unused amount
            alert_threshold_percent: Alert threshold percentage
            category_allocations: List of {category_id, allocated_amount}

        Returns:
            Budget: Created budget

        Raises:
            ValueError: If scope configuration is invalid
        """
        # Verify user owns the context
        self.rls.check_user_owns_resource(user_id)

        # Validate scope configuration
        if scope_type == ScopeType.USER:
            scope_profile_ids = None
        elif scope_type in [ScopeType.PROFILE, ScopeType.MULTI_PROFILE]:
            if not scope_profile_ids:
                raise ValueError(f"scope_profile_ids required for scope_type={scope_type}")
            # Verify user owns all profiles
            user_profiles = self.rls.get_user_profile_ids()
            for pid in scope_profile_ids:
                if pid not in user_profiles:
                    raise ValueError(f"Profile {pid} not owned by user")

        # Create budget
        budget = Budget(
            user_id=user_id,
            name=name,
            scope_type=scope_type,
            scope_profile_ids=scope_profile_ids,
            period_type=period_type,
            start_date=start_date,
            end_date=end_date,
            total_amount=total_amount,
            currency=currency,
            rollover_enabled=rollover_enabled,
            alert_threshold_percent=alert_threshold_percent,
            is_active=True
        )

        self.db.add(budget)
        self.db.flush()

        # Create category allocations
        if category_allocations:
            for alloc in category_allocations:
                # Support both dict and Pydantic model access
                cat_id = alloc.category_id if hasattr(alloc, 'category_id') else alloc['category_id']
                alloc_amount = alloc.allocated_amount if hasattr(alloc, 'allocated_amount') else alloc['allocated_amount']
                budget_category = BudgetCategory(
                    budget_id=budget.id,
                    category_id=cat_id,
                    allocated_amount=alloc_amount,
                    spent_amount=Decimal("0.00")
                )
                self.db.add(budget_category)

        self.db.commit()
        self.db.refresh(budget)

        logger.info(f"Created budget {budget.id} for user {user_id}")
        return budget

    def get_budget(self, budget_id: UUID) -> Budget:
        """
        Get a budget by ID.

        Args:
            budget_id: Budget UUID

        Returns:
            Budget: Budget object

        Raises:
            ValueError: If budget not found or not owned by user
        """
        budget = self.db.query(Budget).filter(Budget.id == budget_id).first()

        if not budget:
            raise ValueError(f"Budget not found: {budget_id}")

        # Verify ownership
        self.rls.check_user_owns_resource(budget.user_id)

        return budget

    def list_budgets(
        self,
        user_id: Optional[UUID] = None,
        include_inactive: bool = False,
        period_type: Optional[PeriodType] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Budget]:
        """
        List budgets for user.

        Args:
            user_id: Filter by user (None = current user)
            include_inactive: Include inactive budgets
            period_type: Filter by period type
            limit: Max results
            offset: Results offset

        Returns:
            List[Budget]: List of budgets
        """
        query = self.db.query(Budget)

        # Apply user filter
        if user_id:
            self.rls.check_user_owns_resource(user_id)
            query = query.filter(Budget.user_id == user_id)
        else:
            query = self.rls.filter_by_user(query, Budget)

        # Apply filters
        if not include_inactive:
            query = query.filter(Budget.is_active == True)

        if period_type:
            query = query.filter(Budget.period_type == period_type)

        # Order and paginate
        query = query.order_by(Budget.start_date.desc())
        query = query.limit(limit).offset(offset)

        return query.all()

    def update_budget(
        self,
        budget_id: UUID,
        **updates
    ) -> Budget:
        """
        Update a budget.

        Args:
            budget_id: Budget UUID
            **updates: Fields to update

        Returns:
            Budget: Updated budget
        """
        budget = self.get_budget(budget_id)

        # Handle category allocations separately
        category_allocations = updates.pop('category_allocations', None)

        # Update fields
        for key, value in updates.items():
            if hasattr(budget, key):
                setattr(budget, key, value)

        # Update category allocations if provided
        if category_allocations is not None:
            # Remove existing
            self.db.query(BudgetCategory).filter(
                BudgetCategory.budget_id == budget_id
            ).delete()

            # Create new
            for alloc in category_allocations:
                budget_category = BudgetCategory(
                    budget_id=budget.id,
                    category_id=alloc['category_id'],
                    allocated_amount=alloc['allocated_amount'],
                    spent_amount=Decimal("0.00")
                )
                self.db.add(budget_category)

        self.db.commit()
        self.db.refresh(budget)

        return budget

    def delete_budget(self, budget_id: UUID) -> bool:
        """
        Delete a budget.

        Args:
            budget_id: Budget UUID

        Returns:
            bool: True if deleted
        """
        budget = self.get_budget(budget_id)
        self.db.delete(budget)
        self.db.commit()
        return True

    def _get_current_period(self, budget: Budget) -> Tuple[date, date]:
        """
        Calculate the current period's start and end dates.
        Delegates to compute_budget_period with offset=0.
        """
        return self.compute_budget_period(budget, offset=0)

    @staticmethod
    def _add_months(base_date: date, months: int) -> date:
        """Add months to a date, clamping day to last day of target month."""
        total_months = (base_date.year * 12 + base_date.month - 1) + months
        target_year = total_months // 12
        target_month = (total_months % 12) + 1
        target_day = min(base_date.day, monthrange(target_year, target_month)[1])
        return date(target_year, target_month, target_day)

    def compute_budget_period(self, budget: Budget, offset: int = 0) -> Tuple[date, date]:
        """
        Calculate a budget period's start and end dates given an offset.

        offset=0 means the current period (the one containing today).
        offset=-1 means the previous period, offset=+1 the next, etc.

        For custom budgets, only the fixed range is returned (offset ignored).

        Returns:
            Tuple of (period_start, period_end) where period_end is the last
            inclusive day of the period.
        """
        today = date.today()
        budget_start = budget.start_date

        if budget.period_type == PeriodType.CUSTOM:
            return (budget_start, budget.end_date or today)

        # Step 1: Find the current period number (the one containing today)
        if budget.period_type == PeriodType.DAILY:
            days_since = (today - budget_start).days
            current_num = max(0, days_since)
            period_num = current_num + offset
            ps = budget_start + timedelta(days=period_num)
            pe = ps
            return self._clamp_period(budget, ps, pe)

        if budget.period_type == PeriodType.WEEKLY:
            days_since = (today - budget_start).days
            if days_since < 0:
                current_num = 0
            else:
                current_num = days_since // 7
            period_num = current_num + offset
            if period_num < 0:
                period_num = 0
            ps = budget_start + timedelta(weeks=period_num)
            pe = ps + timedelta(days=6)
            return self._clamp_period(budget, ps, pe)

        if budget.period_type == PeriodType.MONTHLY:
            # Find which monthly period today falls into
            current_num = self._find_monthly_period_num(budget_start, today, 1)
            period_num = current_num + offset
            if period_num < 0:
                period_num = 0
            ps = self._add_months(budget_start, period_num)
            pe = self._add_months(budget_start, period_num + 1) - timedelta(days=1)
            return self._clamp_period(budget, ps, pe)

        if budget.period_type == PeriodType.QUARTERLY:
            current_num = self._find_monthly_period_num(budget_start, today, 3)
            period_num = current_num + offset
            if period_num < 0:
                period_num = 0
            ps = self._add_months(budget_start, period_num * 3)
            pe = self._add_months(budget_start, (period_num + 1) * 3) - timedelta(days=1)
            return self._clamp_period(budget, ps, pe)

        if budget.period_type == PeriodType.YEARLY:
            current_num = self._find_monthly_period_num(budget_start, today, 12)
            period_num = current_num + offset
            if period_num < 0:
                period_num = 0
            ps = self._add_months(budget_start, period_num * 12)
            pe = self._add_months(budget_start, (period_num + 1) * 12) - timedelta(days=1)
            return self._clamp_period(budget, ps, pe)

        # Fallback
        return (budget_start, budget.end_date or today)

    def _find_monthly_period_num(self, budget_start: date, target: date, months_per_period: int) -> int:
        """Find which period number (0-based) a target date falls into."""
        if target < budget_start:
            return 0
        # Approximate the period number from months elapsed
        months_since = (target.year - budget_start.year) * 12 + (target.month - budget_start.month)
        period_num = max(0, months_since // months_per_period)
        # Verify and adjust: target must be >= period_start
        ps = self._add_months(budget_start, period_num * months_per_period)
        if target < ps and period_num > 0:
            period_num -= 1
        else:
            # Check if we should be in the next period
            next_ps = self._add_months(budget_start, (period_num + 1) * months_per_period)
            if target >= next_ps:
                period_num += 1
        return period_num

    def _clamp_period(self, budget: Budget, ps: date, pe: date) -> Tuple[date, date]:
        """Ensure period doesn't exceed budget boundaries."""
        if ps < budget.start_date:
            ps = budget.start_date
        if budget.end_date and pe > budget.end_date:
            pe = budget.end_date
        return (ps, pe)

    def get_period_navigation_info(self, budget: Budget, offset: int = 0) -> Dict[str, Any]:
        """
        Get full period information including navigation flags.

        Returns dict with:
            start, end, offset, is_current, has_previous, has_next, label
        """
        today = date.today()
        period_start, period_end = self.compute_budget_period(budget, offset)

        # Check if this is the current period (contains today)
        current_start, current_end = self.compute_budget_period(budget, 0)
        is_current = (period_start == current_start)

        # Check has_previous: can we go back one more period?
        has_previous = True
        if budget.period_type == PeriodType.CUSTOM:
            has_previous = False
        else:
            prev_start, _ = self.compute_budget_period(budget, offset - 1)
            # If going back yields the same period, we're at the beginning
            if prev_start == period_start:
                has_previous = False
            # Don't go before budget start
            if prev_start < budget.start_date:
                has_previous = False

        # Check has_next: allow up to 1 period in the future beyond current
        has_next = True
        if budget.period_type == PeriodType.CUSTOM:
            has_next = False
        else:
            next_start, next_end = self.compute_budget_period(budget, offset + 1)
            if next_start == period_start:
                has_next = False
            # Don't go more than 1 period beyond current
            future_start, _ = self.compute_budget_period(budget, 0)
            future_next_start, _ = self.compute_budget_period(budget, 1)
            if next_start > future_next_start:
                has_next = False
            # Respect end_date
            if budget.end_date and next_start > budget.end_date:
                has_next = False

        return {
            'start': period_start,
            'end': period_end,
            'offset': offset,
            'is_current': is_current,
            'has_previous': has_previous,
            'has_next': has_next,
        }

    def calculate_spent(
        self,
        budget: Budget,
        recalculate: bool = True,
        period_start: Optional[date] = None,
        period_end: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Calculate spent amount for a budget in the given (or current) period.

        Args:
            budget: Budget object
            recalculate: Whether to update BudgetCategory.spent_amount
            period_start: Explicit period start (if None, uses current period)
            period_end: Explicit period end (if None, uses current period)

        Returns:
            Dict with total_spent, total_allocated, remaining, usage_percentage,
            category_breakdown (per-category details with category_name)
        """
        category_ids = [bc.category_id for bc in budget.budget_categories]

        if not category_ids:
            return {
                'total_spent': Decimal("0.00"),
                'total_allocated': budget.total_amount,
                'remaining': budget.total_amount,
                'usage_percentage': Decimal("0.00"),
                'category_breakdown': []
            }

        # Use explicit dates or calculate from current period
        if period_start is None or period_end is None:
            period_start, period_end = self._get_current_period(budget)

        # period_end is inclusive in our model, so for the query we use
        # transaction_date < (period_end + 1 day) to avoid overlap
        query_end_exclusive = period_end + timedelta(days=1)

        profile_filter = self._get_scope_profile_filter(budget)

        category_breakdown = []
        total_spent = Decimal("0.00")

        for bc in budget.budget_categories:
            query = self.db.query(
                func.coalesce(func.sum(Transaction.amount_clear), 0)
            ).filter(
                Transaction.category_id == bc.category_id,
                Transaction.transaction_date >= period_start,
                Transaction.transaction_date < query_end_exclusive,
                Transaction.transaction_type.in_(EXPENSE_TRANSACTION_TYPES),
            )

            if profile_filter:
                query = query.filter(Transaction.financial_profile_id.in_(profile_filter))

            spent = Decimal(str(query.scalar() or 0))

            if recalculate:
                bc.spent_amount = spent

            # Resolve category name
            cat_name = str(bc.category_id)
            if bc.category:
                cat_name = bc.category.name

            category_breakdown.append({
                'category_id': bc.category_id,
                'category_name': cat_name,
                'allocated': bc.allocated_amount,
                'spent': spent,
                'remaining': bc.allocated_amount - spent,
                'percentage': (spent / bc.allocated_amount * 100) if bc.allocated_amount > 0 else Decimal("0.00")
            })

            total_spent += spent

        if recalculate:
            self.db.commit()

        remaining = budget.total_amount - total_spent
        usage_percentage = (total_spent / budget.total_amount * 100) if budget.total_amount > 0 else Decimal("0.00")

        return {
            'total_spent': total_spent,
            'total_allocated': budget.total_amount,
            'remaining': remaining,
            'usage_percentage': usage_percentage,
            'category_breakdown': category_breakdown
        }

    def get_budget_detail(
        self,
        budget_id: UUID,
        period_offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get complete budget detail with period navigation and spending.

        This is the single source of truth for all budget display data.
        All spending is calculated on-the-fly from real transactions.

        Args:
            budget_id: Budget UUID
            period_offset: Period offset (0=current, -1=previous, +1=next)

        Returns:
            Dict with budget, period info, and spending breakdown
        """
        budget = self.get_budget(budget_id)

        # For custom budgets, ignore offset
        if budget.period_type == PeriodType.CUSTOM:
            period_offset = 0

        period_info = self.get_period_navigation_info(budget, period_offset)
        spending = self.calculate_spent(
            budget,
            recalculate=(period_offset == 0),
            period_start=period_info['start'],
            period_end=period_info['end']
        )

        return {
            'budget': budget,
            'period': period_info,
            'spending': spending,
        }

    def _get_scope_profile_filter(self, budget: Budget) -> Optional[List[UUID]]:
        """Get profile IDs based on budget scope."""
        if budget.scope_type == ScopeType.USER:
            # All user's profiles
            return self.rls.get_user_profile_ids()
        elif budget.scope_type in [ScopeType.PROFILE, ScopeType.MULTI_PROFILE]:
            return budget.scope_profile_ids
        return None

    def check_alerts(
        self,
        budget: Budget,
        create_notifications: bool = True
    ) -> Dict[str, Any]:
        """
        Check if budget has exceeded alert threshold.

        Args:
            budget: Budget to check
            create_notifications: Whether to create notifications

        Returns:
            Dict with alert status
        """
        spent_info = self.calculate_spent(budget, recalculate=False)

        usage_percentage = spent_info['usage_percentage']
        threshold = Decimal(str(budget.alert_threshold_percent))

        is_over_threshold = usage_percentage >= threshold
        is_over_budget = usage_percentage >= Decimal("100.00")

        alert_status = {
            'is_over_threshold': is_over_threshold,
            'is_over_budget': is_over_budget,
            'usage_percentage': float(usage_percentage),
            'threshold': float(threshold),
            'notifications_created': []
        }

        if create_notifications:
            # Get user from budget
            user_id = budget.user_id

            if is_over_budget:
                # Create over budget notification
                notification = self._create_notification(
                    user_id=user_id,
                    notification_type=NotificationType.BUDGET_ALERT,
                    title=f"Budget '{budget.name}' exceeded!",
                    message=f"You have spent {usage_percentage:.1f}% of your {budget.name} budget.",
                    priority=8
                )
                alert_status['notifications_created'].append(str(notification.id))
            elif is_over_threshold:
                # Create threshold warning
                notification = self._create_notification(
                    user_id=user_id,
                    notification_type=NotificationType.BUDGET_ALERT,
                    title=f"Budget '{budget.name}' warning",
                    message=f"You have used {usage_percentage:.1f}% of your {budget.name} budget (threshold: {threshold}%).",
                    priority=5
                )
                alert_status['notifications_created'].append(str(notification.id))

        return alert_status

    def _create_notification(
        self,
        user_id: UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        priority: int = 5
    ) -> Notification:
        """Create a notification."""
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            status=NotificationStatus.UNREAD,
            priority=priority
        )
        self.db.add(notification)
        self.db.commit()
        return notification

    def update_all_budgets_spent(self, user_id: Optional[UUID] = None) -> int:
        """
        Update spent amounts for all active budgets.

        Used by scheduled jobs.

        Args:
            user_id: Specific user (None = all users)

        Returns:
            int: Number of budgets updated
        """
        query = self.db.query(Budget).filter(Budget.is_active == True)

        if user_id:
            query = query.filter(Budget.user_id == user_id)

        budgets = query.all()
        count = 0

        for budget in budgets:
            try:
                self.calculate_spent(budget, recalculate=True)
                self.check_alerts(budget, create_notifications=True)
                count += 1
            except Exception as e:
                logger.error(f"Error updating budget {budget.id}: {e}")

        return count

    def add_category_to_budget(
        self,
        budget_id: UUID,
        category_id: UUID,
        allocated_amount: Decimal
    ) -> BudgetCategory:
        """
        Add a category allocation to a budget.

        Args:
            budget_id: Budget UUID
            category_id: Category UUID
            allocated_amount: Amount to allocate

        Returns:
            BudgetCategory: Created allocation
        """
        budget = self.get_budget(budget_id)

        # Check if category already exists
        existing = self.db.query(BudgetCategory).filter(
            BudgetCategory.budget_id == budget_id,
            BudgetCategory.category_id == category_id
        ).first()

        if existing:
            raise ValueError(f"Category {category_id} already in budget")

        budget_category = BudgetCategory(
            budget_id=budget_id,
            category_id=category_id,
            allocated_amount=allocated_amount,
            spent_amount=Decimal("0.00")
        )

        self.db.add(budget_category)
        self.db.commit()
        self.db.refresh(budget_category)

        return budget_category

    def remove_category_from_budget(
        self,
        budget_id: UUID,
        category_id: UUID
    ) -> bool:
        """
        Remove a category allocation from a budget.

        Args:
            budget_id: Budget UUID
            category_id: Category UUID

        Returns:
            bool: True if removed
        """
        # Verify budget ownership
        self.get_budget(budget_id)

        result = self.db.query(BudgetCategory).filter(
            BudgetCategory.budget_id == budget_id,
            BudgetCategory.category_id == category_id
        ).delete()

        self.db.commit()

        return result > 0
