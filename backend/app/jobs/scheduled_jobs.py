# app/jobs/scheduled_jobs.py
"""
Scheduled Job Implementations for FinancePro v2.1.

These functions can be called by:
- APScheduler
- Celery tasks
- Cron jobs
- Manual invocation

Example with APScheduler:
    from apscheduler.schedulers.background import BackgroundScheduler
    from app.jobs import process_recurring_transactions, update_exchange_rates

    scheduler = BackgroundScheduler()
    scheduler.add_job(process_recurring_transactions, 'cron', hour=6)
    scheduler.add_job(update_exchange_rates, 'cron', hour=7)
    scheduler.start()
"""
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import logging

from app.db.database import SessionLocal
from app.services.v2 import (
    RecurringTransactionService,
    ExchangeRateService,
    BudgetService,
    GoalService
)
from app.core.rls import RLSService
from app.models import Notification, NotificationStatus

logger = logging.getLogger(__name__)


def get_db_session() -> Session:
    """Get a new database session for jobs."""
    return SessionLocal()


def process_recurring_transactions(
    process_date: Optional[date] = None,
    auto_create_only: bool = False
) -> Dict[str, Any]:
    """
    Process all due recurring transactions.

    Generates occurrences and creates transactions for auto_create=True.
    Sends notifications for auto_create=False.

    Args:
        process_date: Date to process (defaults to today)
        auto_create_only: Only process auto_create transactions

    Returns:
        Dict with processing results
    """
    logger.info("Starting recurring transaction processing job")

    db = get_db_session()
    try:
        service = RecurringTransactionService(db)
        result = service.process_due_recurring(
            process_date=process_date,
            auto_create_only=auto_create_only
        )

        logger.info(f"Recurring job completed: {result}")
        return result

    except Exception as e:
        logger.error(f"Recurring job failed: {e}")
        raise
    finally:
        db.close()


def update_exchange_rates(
    base_currency: str = "EUR",
    rate_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Fetch and update exchange rates from external sources.

    Args:
        base_currency: Base currency for rates
        rate_date: Date to fetch (defaults to today)

    Returns:
        Dict with update results
    """
    logger.info(f"Starting exchange rate update job for {base_currency}")

    db = get_db_session()
    try:
        service = ExchangeRateService(db)
        result = service.fetch_and_update_rates(
            base_currency=base_currency,
            rate_date=rate_date
        )

        logger.info(f"Exchange rate job completed: {result['updated']} rates updated")
        return result

    except Exception as e:
        logger.error(f"Exchange rate job failed: {e}")
        raise
    finally:
        db.close()


def update_budget_spent(user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Update spent amounts for all active budgets.

    Also checks alert thresholds and creates notifications.

    Args:
        user_id: Specific user UUID string (None = all users)

    Returns:
        Dict with update results
    """
    logger.info("Starting budget spent update job")

    db = get_db_session()
    try:
        # Need to set RLS context for all users if user_id not specified
        from uuid import UUID as UUIDType

        rls = RLSService(db)

        if user_id:
            # Set context for specific user
            user_uuid = UUIDType(user_id)
            rls.set_user_context(user_uuid)
            service = BudgetService(db, rls)
            count = service.update_all_budgets_spent(user_uuid)
        else:
            # Process all users
            from app.models import User
            users = db.query(User).filter(User.is_active == True).all()
            count = 0

            for user in users:
                try:
                    rls.set_user_context(user.id)
                    service = BudgetService(db, rls)
                    count += service.update_all_budgets_spent(user.id)
                except Exception as e:
                    logger.error(f"Error updating budgets for user {user.id}: {e}")

        result = {'budgets_updated': count}
        logger.info(f"Budget spent job completed: {count} budgets updated")
        return result

    except Exception as e:
        logger.error(f"Budget spent job failed: {e}")
        raise
    finally:
        db.close()


def update_goal_probabilities(user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Update achievement probabilities for all active goals.

    Also recalculates monthly contributions.

    Args:
        user_id: Specific user UUID string (None = all users)

    Returns:
        Dict with update results
    """
    logger.info("Starting goal probability update job")

    db = get_db_session()
    try:
        from uuid import UUID as UUIDType

        rls = RLSService(db)

        if user_id:
            user_uuid = UUIDType(user_id)
            rls.set_user_context(user_uuid)
            service = GoalService(db, rls)
            count = service.update_all_goals_probability(user_uuid)
        else:
            # Process all users
            from app.models import User
            users = db.query(User).filter(User.is_active == True).all()
            count = 0

            for user in users:
                try:
                    rls.set_user_context(user.id)
                    service = GoalService(db, rls)
                    count += service.update_all_goals_probability(user.id)
                except Exception as e:
                    logger.error(f"Error updating goals for user {user.id}: {e}")

        result = {'goals_updated': count}
        logger.info(f"Goal probability job completed: {count} goals updated")
        return result

    except Exception as e:
        logger.error(f"Goal probability job failed: {e}")
        raise
    finally:
        db.close()


def cleanup_old_notifications(
    days_old: int = 30,
    status: NotificationStatus = NotificationStatus.ARCHIVED
) -> Dict[str, Any]:
    """
    Delete old notifications.

    Args:
        days_old: Delete notifications older than this
        status: Only delete notifications with this status

    Returns:
        Dict with cleanup results
    """
    logger.info(f"Starting notification cleanup job (older than {days_old} days)")

    db = get_db_session()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        deleted = db.query(Notification).filter(
            Notification.status == status,
            Notification.created_at < cutoff_date
        ).delete()

        db.commit()

        result = {'deleted': deleted}
        logger.info(f"Notification cleanup completed: {deleted} deleted")
        return result

    except Exception as e:
        logger.error(f"Notification cleanup job failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def run_all_daily_jobs() -> Dict[str, Any]:
    """
    Run all daily maintenance jobs.

    This is a convenience function that runs:
    - Recurring transaction processing
    - Exchange rate updates
    - Budget spent updates
    - Goal probability updates
    - Notification cleanup

    Returns:
        Dict with all job results
    """
    logger.info("Starting all daily jobs")

    results = {}

    try:
        results['recurring'] = process_recurring_transactions()
    except Exception as e:
        results['recurring'] = {'error': str(e)}
        logger.error(f"Recurring job failed: {e}")

    try:
        results['exchange_rates'] = update_exchange_rates()
    except Exception as e:
        results['exchange_rates'] = {'error': str(e)}
        logger.error(f"Exchange rate job failed: {e}")

    try:
        results['budgets'] = update_budget_spent()
    except Exception as e:
        results['budgets'] = {'error': str(e)}
        logger.error(f"Budget job failed: {e}")

    try:
        results['goals'] = update_goal_probabilities()
    except Exception as e:
        results['goals'] = {'error': str(e)}
        logger.error(f"Goal job failed: {e}")

    try:
        results['cleanup'] = cleanup_old_notifications()
    except Exception as e:
        results['cleanup'] = {'error': str(e)}
        logger.error(f"Cleanup job failed: {e}")

    logger.info(f"All daily jobs completed: {results}")
    return results


# CLI entry points for cron/manual execution
if __name__ == "__main__":
    import sys
    import argparse

    parser = argparse.ArgumentParser(description="Run FinancePro scheduled jobs")
    parser.add_argument(
        'job',
        choices=['recurring', 'rates', 'budgets', 'goals', 'cleanup', 'all'],
        help='Job to run'
    )
    parser.add_argument('--user', help='User ID (optional)')
    parser.add_argument('--date', help='Date (YYYY-MM-DD)')

    args = parser.parse_args()

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    process_date = None
    if args.date:
        process_date = datetime.strptime(args.date, '%Y-%m-%d').date()

    if args.job == 'recurring':
        result = process_recurring_transactions(process_date)
    elif args.job == 'rates':
        result = update_exchange_rates(rate_date=process_date)
    elif args.job == 'budgets':
        result = update_budget_spent(args.user)
    elif args.job == 'goals':
        result = update_goal_probabilities(args.user)
    elif args.job == 'cleanup':
        result = cleanup_old_notifications()
    elif args.job == 'all':
        result = run_all_daily_jobs()

    print(f"Job result: {result}")
