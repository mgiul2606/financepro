# app/services/v2/goal_service.py
"""
Goal Service for FinancePro v2.1.

Handles financial goals with:
- Scope support (user, profile, multi_profile)
- Contributions tracking
- Progress calculation
- Milestone management
- Achievement probability calculation
- Gamification points
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
import logging
import math

from app.models import (
    FinancialGoal,
    GoalContribution,
    GoalMilestone,
    Transaction,
    Notification,
    ScopeType,
    GoalType,
    GoalStatus,
    NotificationType,
    NotificationStatus
)
from app.core.rls import RLSService

logger = logging.getLogger(__name__)


class GoalService:
    """
    Service for financial goal operations with scope support.

    Usage:
        service = GoalService(db, rls)
        goal = service.create_goal(
            user_id=user_id,
            name="House Down Payment",
            goal_type=GoalType.HOUSE,
            target_amount=Decimal("50000.00"),
            target_date=date(2027, 1, 1),
            currency="EUR"
        )
    """

    def __init__(self, db: Session, rls: RLSService):
        """Initialize goal service."""
        self.db = db
        self.rls = rls

    def create_goal(
        self,
        user_id: UUID,
        name: str,
        goal_type: GoalType,
        target_amount: Decimal,
        target_date: date,
        currency: str,
        scope_type: ScopeType = ScopeType.USER,
        scope_profile_ids: Optional[List[UUID]] = None,
        linked_account_id: Optional[UUID] = None,
        description: Optional[str] = None,
        start_date: Optional[date] = None,
        priority: int = 5,
        auto_allocate: bool = False,
        milestones: Optional[List[Dict[str, Any]]] = None
    ) -> FinancialGoal:
        """
        Create a new financial goal.

        Args:
            user_id: User ID (owner)
            name: Goal name
            goal_type: Type of goal
            target_amount: Target amount to save
            target_date: Target completion date
            currency: Currency code
            scope_type: Scope type
            scope_profile_ids: Profile IDs for scope
            linked_account_id: Dedicated account for goal
            description: Goal description
            start_date: Goal start date (defaults to today)
            priority: Priority (1-10)
            auto_allocate: Auto-allocate funds
            milestones: List of milestone definitions

        Returns:
            FinancialGoal: Created goal
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

        # Set default start date
        if not start_date:
            start_date = date.today()

        # Calculate initial monthly contribution
        months_remaining = self._calculate_months_remaining(start_date, target_date)
        monthly_contribution = target_amount / months_remaining if months_remaining > 0 else target_amount

        # Create goal
        goal = FinancialGoal(
            user_id=user_id,
            name=name,
            scope_type=scope_type,
            scope_profile_ids=scope_profile_ids,
            linked_account_id=linked_account_id,
            goal_type=goal_type,
            description=description,
            target_amount=target_amount,
            current_amount=Decimal("0.00"),
            currency=currency,
            start_date=start_date,
            target_date=target_date,
            monthly_contribution=monthly_contribution,
            auto_allocate=auto_allocate,
            priority=priority,
            status=GoalStatus.ACTIVE,
            achievement_probability=None,
            gamification_points=0
        )

        self.db.add(goal)
        self.db.flush()

        # Create milestones
        if milestones:
            for ms in milestones:
                milestone = GoalMilestone(
                    goal_id=goal.id,
                    name=ms.get('name', f"{ms['percentage']}% milestone"),
                    target_amount=target_amount * Decimal(str(ms['percentage'])) / 100,
                    target_percentage=ms['percentage'],
                    is_achieved=False
                )
                self.db.add(milestone)
        else:
            # Create default milestones at 25%, 50%, 75%
            for pct in [25, 50, 75]:
                milestone = GoalMilestone(
                    goal_id=goal.id,
                    name=f"{pct}% milestone",
                    target_amount=target_amount * Decimal(str(pct)) / 100,
                    target_percentage=pct,
                    is_achieved=False
                )
                self.db.add(milestone)

        self.db.commit()
        self.db.refresh(goal)

        logger.info(f"Created goal {goal.id} for user {user_id}")
        return goal

    def get_goal(self, goal_id: UUID) -> FinancialGoal:
        """
        Get a goal by ID.

        Args:
            goal_id: Goal UUID

        Returns:
            FinancialGoal: Goal object

        Raises:
            ValueError: If goal not found or not owned by user
        """
        goal = self.db.query(FinancialGoal).filter(FinancialGoal.id == goal_id).first()

        if not goal:
            raise ValueError(f"Goal not found: {goal_id}")

        # Verify ownership
        self.rls.check_user_owns_resource(goal.user_id)

        return goal

    def list_goals(
        self,
        user_id: Optional[UUID] = None,
        status_filter: Optional[GoalStatus] = None,
        goal_type: Optional[GoalType] = None,
        include_completed: bool = False,
        limit: int = 100,
        offset: int = 0
    ) -> List[FinancialGoal]:
        """
        List goals for user.

        Args:
            user_id: Filter by user (None = current user)
            status_filter: Filter by status
            goal_type: Filter by type
            include_completed: Include completed goals
            limit: Max results
            offset: Results offset

        Returns:
            List[FinancialGoal]: List of goals
        """
        query = self.db.query(FinancialGoal)

        # Apply user filter
        if user_id:
            self.rls.check_user_owns_resource(user_id)
            query = query.filter(FinancialGoal.user_id == user_id)
        else:
            query = self.rls.filter_by_user(query, FinancialGoal)

        # Apply filters
        if status_filter:
            query = query.filter(FinancialGoal.status == status_filter)
        elif not include_completed:
            query = query.filter(FinancialGoal.status != GoalStatus.COMPLETED)

        if goal_type:
            query = query.filter(FinancialGoal.goal_type == goal_type)

        # Order by priority and target date
        query = query.order_by(
            FinancialGoal.priority.desc(),
            FinancialGoal.target_date.asc()
        )
        query = query.limit(limit).offset(offset)

        return query.all()

    def update_goal(
        self,
        goal_id: UUID,
        **updates
    ) -> FinancialGoal:
        """
        Update a goal.

        Args:
            goal_id: Goal UUID
            **updates: Fields to update

        Returns:
            FinancialGoal: Updated goal
        """
        goal = self.get_goal(goal_id)

        # Update fields
        for key, value in updates.items():
            if hasattr(goal, key):
                setattr(goal, key, value)

        # Recalculate monthly contribution if target changed
        if 'target_amount' in updates or 'target_date' in updates:
            months = self._calculate_months_remaining(goal.start_date, goal.target_date)
            remaining = goal.target_amount - goal.current_amount
            goal.monthly_contribution = remaining / months if months > 0 else remaining

        self.db.commit()
        self.db.refresh(goal)

        return goal

    def delete_goal(self, goal_id: UUID) -> bool:
        """
        Delete a goal.

        Args:
            goal_id: Goal UUID

        Returns:
            bool: True if deleted
        """
        goal = self.get_goal(goal_id)
        self.db.delete(goal)
        self.db.commit()
        return True

    def add_contribution(
        self,
        goal_id: UUID,
        amount: Decimal,
        contribution_date: Optional[date] = None,
        transaction_id: Optional[UUID] = None,
        notes: Optional[str] = None
    ) -> GoalContribution:
        """
        Add a contribution to a goal.

        Args:
            goal_id: Goal UUID
            amount: Contribution amount (positive)
            contribution_date: Date of contribution
            transaction_id: Associated transaction
            notes: Contribution notes

        Returns:
            GoalContribution: Created contribution
        """
        goal = self.get_goal(goal_id)

        if amount <= 0:
            raise ValueError("Contribution amount must be positive")

        if not contribution_date:
            contribution_date = date.today()

        # Create contribution
        contribution = GoalContribution(
            goal_id=goal_id,
            transaction_id=transaction_id,
            amount=amount,
            contribution_date=contribution_date,
            notes=notes
        )

        self.db.add(contribution)

        # Update goal current amount
        goal.current_amount += amount

        # Award gamification points
        goal.gamification_points += 10

        # Check for goal completion
        if goal.current_amount >= goal.target_amount:
            goal.status = GoalStatus.COMPLETED
            goal.gamification_points += 500  # Completion bonus

            # Create completion notification
            self._create_notification(
                user_id=goal.user_id,
                notification_type=NotificationType.GOAL_MILESTONE,
                title=f"Goal '{goal.name}' completed!",
                message=f"Congratulations! You've reached your goal of {goal.target_amount} {goal.currency}.",
                priority=9
            )

        # Check milestones
        self._check_milestones(goal)

        # Recalculate monthly contribution
        months = self._calculate_months_remaining(date.today(), goal.target_date)
        remaining = goal.target_amount - goal.current_amount
        goal.monthly_contribution = remaining / months if months > 0 else remaining

        # Update achievement probability
        goal.achievement_probability = self._calculate_achievement_probability(goal)

        self.db.commit()
        self.db.refresh(contribution)

        logger.info(f"Added contribution {contribution.id} to goal {goal_id}")
        return contribution

    def get_contributions(
        self,
        goal_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[GoalContribution]:
        """
        Get contributions for a goal.

        Args:
            goal_id: Goal UUID
            start_date: Filter by start date
            end_date: Filter by end date
            limit: Max results
            offset: Results offset

        Returns:
            List[GoalContribution]: Contributions
        """
        # Verify goal ownership
        self.get_goal(goal_id)

        query = self.db.query(GoalContribution).filter(
            GoalContribution.goal_id == goal_id
        )

        if start_date:
            query = query.filter(GoalContribution.contribution_date >= start_date)
        if end_date:
            query = query.filter(GoalContribution.contribution_date <= end_date)

        query = query.order_by(GoalContribution.contribution_date.desc())
        query = query.limit(limit).offset(offset)

        return query.all()

    def calculate_progress(self, goal: FinancialGoal) -> Dict[str, Any]:
        """
        Calculate goal progress and statistics.

        Args:
            goal: Goal object

        Returns:
            Dict with progress information
        """
        progress_percentage = (
            (goal.current_amount / goal.target_amount * 100)
            if goal.target_amount > 0 else Decimal("0.00")
        )

        remaining = goal.target_amount - goal.current_amount
        months = self._calculate_months_remaining(date.today(), goal.target_date)
        days_remaining = (goal.target_date - date.today()).days

        # Get contribution stats
        contributions = self.db.query(GoalContribution).filter(
            GoalContribution.goal_id == goal.id
        ).all()

        total_contributions = len(contributions)
        avg_contribution = (
            goal.current_amount / total_contributions
            if total_contributions > 0 else Decimal("0.00")
        )

        # Calculate on-track status
        expected_progress = self._calculate_expected_progress(goal)
        is_on_track = float(progress_percentage) >= expected_progress

        return {
            'goal_id': str(goal.id),
            'progress_percentage': float(progress_percentage),
            'current_amount': float(goal.current_amount),
            'target_amount': float(goal.target_amount),
            'remaining_amount': float(remaining),
            'monthly_contribution_needed': float(goal.monthly_contribution),
            'months_remaining': months,
            'days_remaining': days_remaining,
            'total_contributions': total_contributions,
            'average_contribution': float(avg_contribution),
            'is_on_track': is_on_track,
            'expected_progress': expected_progress,
            'achievement_probability': float(goal.achievement_probability or 0),
            'gamification_points': goal.gamification_points
        }

    def get_milestones(self, goal_id: UUID) -> List[GoalMilestone]:
        """
        Get milestones for a goal.

        Args:
            goal_id: Goal UUID

        Returns:
            List[GoalMilestone]: Milestones
        """
        # Verify goal ownership
        self.get_goal(goal_id)

        return self.db.query(GoalMilestone).filter(
            GoalMilestone.goal_id == goal_id
        ).order_by(GoalMilestone.target_percentage.asc()).all()

    def update_milestone(
        self,
        goal_id: UUID,
        milestone_id: UUID,
        **updates
    ) -> GoalMilestone:
        """
        Update a milestone.

        Args:
            goal_id: Goal UUID
            milestone_id: Milestone UUID
            **updates: Fields to update

        Returns:
            GoalMilestone: Updated milestone
        """
        # Verify goal ownership
        self.get_goal(goal_id)

        milestone = self.db.query(GoalMilestone).filter(
            GoalMilestone.id == milestone_id,
            GoalMilestone.goal_id == goal_id
        ).first()

        if not milestone:
            raise ValueError(f"Milestone not found: {milestone_id}")

        for key, value in updates.items():
            if hasattr(milestone, key):
                setattr(milestone, key, value)

        self.db.commit()
        self.db.refresh(milestone)

        return milestone

    def _check_milestones(self, goal: FinancialGoal) -> None:
        """Check and update milestone achievements."""
        milestones = self.db.query(GoalMilestone).filter(
            GoalMilestone.goal_id == goal.id,
            GoalMilestone.is_achieved == False
        ).all()

        for milestone in milestones:
            if goal.current_amount >= milestone.target_amount:
                milestone.is_achieved = True
                milestone.achieved_date = date.today()

                # Award milestone points
                goal.gamification_points += 100

                # Create notification
                self._create_notification(
                    user_id=goal.user_id,
                    notification_type=NotificationType.GOAL_MILESTONE,
                    title=f"Milestone reached for '{goal.name}'!",
                    message=f"You've reached {milestone.target_percentage}% of your goal.",
                    priority=7
                )

    def _calculate_months_remaining(self, start: date, end: date) -> int:
        """Calculate months between two dates."""
        delta = end - start
        return max(1, math.ceil(delta.days / 30))

    def _calculate_expected_progress(self, goal: FinancialGoal) -> float:
        """Calculate expected progress based on elapsed time."""
        total_days = (goal.target_date - goal.start_date).days
        elapsed_days = (date.today() - goal.start_date).days

        if total_days <= 0:
            return 100.0

        return min(100.0, (elapsed_days / total_days) * 100)

    def _calculate_achievement_probability(self, goal: FinancialGoal) -> Decimal:
        """
        Calculate probability of achieving goal on time.

        Based on:
        - Current progress vs expected progress
        - Contribution consistency
        - Time remaining
        """
        if goal.status == GoalStatus.COMPLETED:
            return Decimal("100.00")

        current_progress = float(goal.current_amount / goal.target_amount * 100)
        expected_progress = self._calculate_expected_progress(goal)

        # Base probability from progress ratio
        if expected_progress > 0:
            progress_ratio = current_progress / expected_progress
        else:
            progress_ratio = 1.0

        # Calculate probability (simplified model)
        if progress_ratio >= 1.0:
            probability = min(95.0, 70.0 + (progress_ratio - 1.0) * 50)
        else:
            probability = max(5.0, progress_ratio * 70)

        # Adjust for time pressure
        days_remaining = (goal.target_date - date.today()).days
        if days_remaining < 30 and current_progress < 90:
            probability *= 0.8  # Reduce probability if little time left

        return Decimal(str(round(probability, 2)))

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
        return notification

    def update_all_goals_probability(self, user_id: Optional[UUID] = None) -> int:
        """
        Update achievement probability for all active goals.

        Used by scheduled jobs.

        Args:
            user_id: Specific user (None = all users)

        Returns:
            int: Number of goals updated
        """
        query = self.db.query(FinancialGoal).filter(
            FinancialGoal.status == GoalStatus.ACTIVE
        )

        if user_id:
            query = query.filter(FinancialGoal.user_id == user_id)

        goals = query.all()
        count = 0

        for goal in goals:
            try:
                goal.achievement_probability = self._calculate_achievement_probability(goal)

                # Recalculate monthly contribution
                months = self._calculate_months_remaining(date.today(), goal.target_date)
                remaining = goal.target_amount - goal.current_amount
                goal.monthly_contribution = remaining / months if months > 0 else remaining

                count += 1
            except Exception as e:
                logger.error(f"Error updating goal {goal.id}: {e}")

        self.db.commit()
        return count
