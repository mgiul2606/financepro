# app/jobs/__init__.py
"""
Scheduled Jobs for FinancePro v2.1.

This module contains standalone job functions that can be executed
by schedulers like APScheduler, Celery, or cron.
"""
from app.jobs.scheduled_jobs import (
    process_recurring_transactions,
    update_exchange_rates,
    update_budget_spent,
    update_goal_probabilities,
    cleanup_old_notifications,
    run_all_daily_jobs
)

__all__ = [
    "process_recurring_transactions",
    "update_exchange_rates",
    "update_budget_spent",
    "update_goal_probabilities",
    "cleanup_old_notifications",
    "run_all_daily_jobs",
]
