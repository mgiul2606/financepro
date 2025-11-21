# app/services/v2/budget_service.py
"""
Budget Service for FinancePro v2.1.

Handles budget operations with:
- Scope support (user, profile, multi_profile)
- Spent amount calculation
- Alert threshold monitoring
- Notification creation
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
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
    NotificationType,
    NotificationStatus
)
from app.core.rls import RLSService

logger = logging.getLogger(__name__)


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
                budget_category = BudgetCategory(
                    budget_id=budget.id,
                    category_id=alloc['category_id'],
                    allocated_amount=alloc['allocated_amount'],
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

    def calculate_spent(
        self,
        budget: Budget,
        recalculate: bool = True
    ) -> Dict[str, Any]:
        """
        Calculate spent amount for a budget.

        Considers:
        - Scope type (user/profile/multi_profile)
        - Category allocations
        - Date range

        Args:
            budget: Budget object
            recalculate: Whether to recalculate from transactions

        Returns:
            Dict with spent amounts and percentages
        """
        # Get category IDs
        category_ids = [bc.category_id for bc in budget.budget_categories]

        if not category_ids:
            return {
                'total_spent': Decimal("0.00"),
                'total_allocated': budget.total_amount,
                'remaining': budget.total_amount,
                'usage_percentage': Decimal("0.00"),
                'category_breakdown': []
            }

        # Determine profile filter based on scope
        profile_filter = self._get_scope_profile_filter(budget)

        # Calculate spent per category
        category_breakdown = []
        total_spent = Decimal("0.00")

        for bc in budget.budget_categories:
            # Query transactions for this category
            query = self.db.query(
                func.coalesce(func.sum(func.abs(Transaction.amount_clear)), 0)
            ).filter(
                Transaction.category_id == bc.category_id,
                Transaction.transaction_date >= budget.start_date,
                Transaction.amount_clear < 0  # Only expenses
            )

            # Apply end date filter
            if budget.end_date:
                query = query.filter(Transaction.transaction_date <= budget.end_date)

            # Apply profile filter
            if profile_filter:
                query = query.filter(Transaction.financial_profile_id.in_(profile_filter))

            spent = Decimal(str(query.scalar() or 0))

            # Update spent_amount in BudgetCategory
            if recalculate:
                bc.spent_amount = spent

            category_breakdown.append({
                'category_id': bc.category_id,
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
