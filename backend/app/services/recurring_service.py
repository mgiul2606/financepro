# app/services/v2/recurring_service.py
"""
Recurring Transaction Service for FinancePro v2.1.

Handles recurring transaction operations:
- Generate occurrences
- Create transactions for due occurrences
- Update next_occurrence_date
- Handle variable amounts (formula, seasonal, etc.)
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime, timedelta
from decimal import Decimal
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
import logging
import math

from app.models import (
    RecurringTransaction,
    RecurringTransactionOccurrence,
    Transaction,
    FinancialProfile,
    Notification,
    Frequency,
    AmountModel,
    OccurrenceStatus,
    TransactionSource,
    NotificationType,
    NotificationStatus
)
from app.core.rls import RLSService
from app.core.encryption import get_encryption_service, ProfileEncryptionContext

logger = logging.getLogger(__name__)


class RecurringTransactionService:
    """
    Service for managing recurring transactions.

    Usage:
        service = RecurringTransactionService(db, rls)
        service.process_due_recurring()  # Process all due transactions
    """

    def __init__(self, db: Session, rls: Optional[RLSService] = None):
        """Initialize recurring transaction service."""
        self.db = db
        self.rls = rls
        self.encryption = get_encryption_service()

    def process_due_recurring(
        self,
        process_date: Optional[date] = None,
        auto_create_only: bool = False
    ) -> Dict[str, Any]:
        """
        Process all due recurring transactions.

        This is the main job entry point.

        Args:
            process_date: Date to process (defaults to today)
            auto_create_only: Only process auto_create=True transactions

        Returns:
            Dict with processing results
        """
        if not process_date:
            process_date = date.today()

        results = {
            'date': str(process_date),
            'processed': 0,
            'created': 0,
            'notified': 0,
            'errors': []
        }

        # Query due recurring transactions
        query = self.db.query(RecurringTransaction).filter(
            RecurringTransaction.is_active == True,
            RecurringTransaction.next_occurrence_date <= process_date
        )

        if auto_create_only:
            query = query.filter(RecurringTransaction.auto_create == True)

        recurring_txs = query.all()

        for recurring in recurring_txs:
            try:
                # Generate occurrence
                occurrence = self._create_occurrence(recurring, process_date)
                results['processed'] += 1

                if recurring.auto_create:
                    # Create actual transaction
                    tx = self._create_transaction_from_occurrence(recurring, occurrence)
                    occurrence.status = OccurrenceStatus.EXECUTED
                    occurrence.transaction_id = tx.id
                    results['created'] += 1
                else:
                    # Send notification
                    self._send_reminder_notification(recurring, occurrence)
                    results['notified'] += 1

                # Update next occurrence date
                recurring.next_occurrence_date = self._calculate_next_occurrence(recurring)

            except Exception as e:
                results['errors'].append({
                    'recurring_id': str(recurring.id),
                    'error': str(e)
                })
                logger.error(f"Error processing recurring {recurring.id}: {e}")

        self.db.commit()

        logger.info(f"Processed {results['processed']} recurring transactions")
        return results

    def _create_occurrence(
        self,
        recurring: RecurringTransaction,
        occurrence_date: date
    ) -> RecurringTransactionOccurrence:
        """Create a new occurrence for a recurring transaction."""
        expected_amount = self._calculate_amount(recurring, occurrence_date)

        occurrence = RecurringTransactionOccurrence(
            recurring_transaction_id=recurring.id,
            scheduled_date=occurrence_date,
            expected_amount=expected_amount,
            status=OccurrenceStatus.PENDING
        )

        self.db.add(occurrence)
        self.db.flush()

        return occurrence

    def _calculate_amount(
        self,
        recurring: RecurringTransaction,
        occurrence_date: date
    ) -> Decimal:
        """
        Calculate the amount for an occurrence based on the amount model.

        Supports:
        - fixed: Constant amount
        - variable_within_range: Random within min/max
        - progressive: Increasing amount
        - seasonal: Seasonal variation
        - formula: Custom formula
        """
        if recurring.amount_model == AmountModel.FIXED:
            return recurring.base_amount

        elif recurring.amount_model == AmountModel.VARIABLE_WITHIN_RANGE:
            if recurring.amount_min and recurring.amount_max:
                # Use average for expected, actual may vary
                return (recurring.amount_min + recurring.amount_max) / 2
            return recurring.base_amount

        elif recurring.amount_model == AmountModel.PROGRESSIVE:
            # Calculate progression based on occurrence count
            occurrences = self.db.query(RecurringTransactionOccurrence).filter(
                RecurringTransactionOccurrence.recurring_transaction_id == recurring.id
            ).count()

            # Simple 2% increase per occurrence (configurable via formula)
            multiplier = Decimal("1.02") ** occurrences
            return recurring.base_amount * multiplier

        elif recurring.amount_model == AmountModel.SEASONAL:
            # Seasonal adjustment based on month
            month = occurrence_date.month
            # Winter months (heating) higher, summer months lower
            seasonal_factors = {
                1: Decimal("1.3"), 2: Decimal("1.3"), 3: Decimal("1.1"),
                4: Decimal("0.9"), 5: Decimal("0.8"), 6: Decimal("0.7"),
                7: Decimal("0.8"), 8: Decimal("0.9"), 9: Decimal("0.9"),
                10: Decimal("1.0"), 11: Decimal("1.2"), 12: Decimal("1.3")
            }
            return recurring.base_amount * seasonal_factors.get(month, Decimal("1.0"))

        elif recurring.amount_model == AmountModel.FORMULA:
            if recurring.formula:
                return self._evaluate_formula(recurring.formula, recurring.base_amount, occurrence_date)
            return recurring.base_amount

        return recurring.base_amount

    def _evaluate_formula(
        self,
        formula: str,
        base_amount: Decimal,
        occurrence_date: date
    ) -> Decimal:
        """
        Evaluate a formula for amount calculation.

        Supports simple formulas like:
        - "base * 1.02"
        - "base + 10"
        """
        try:
            # Replace variables
            expr = formula.replace('base', str(float(base_amount)))
            expr = expr.replace('month', str(occurrence_date.month))
            expr = expr.replace('year', str(occurrence_date.year))

            # Safe evaluation (only math operations)
            allowed_chars = set('0123456789.+-*/() ')
            if not all(c in allowed_chars for c in expr):
                return base_amount

            result = eval(expr)  # nosec - we've sanitized the input
            return Decimal(str(result))

        except Exception:
            return base_amount

    def _calculate_next_occurrence(
        self,
        recurring: RecurringTransaction
    ) -> Optional[date]:
        """Calculate the next occurrence date based on frequency."""
        current = recurring.next_occurrence_date
        interval = recurring.interval or 1

        if recurring.frequency == Frequency.DAILY:
            next_date = current + timedelta(days=interval)

        elif recurring.frequency == Frequency.WEEKLY:
            next_date = current + timedelta(weeks=interval)

        elif recurring.frequency == Frequency.BIWEEKLY:
            next_date = current + timedelta(weeks=2 * interval)

        elif recurring.frequency == Frequency.MONTHLY:
            next_date = current + relativedelta(months=interval)

        elif recurring.frequency == Frequency.QUARTERLY:
            next_date = current + relativedelta(months=3 * interval)

        elif recurring.frequency == Frequency.SEMIANNUALLY:
            next_date = current + relativedelta(months=6 * interval)

        elif recurring.frequency == Frequency.YEARLY:
            next_date = current + relativedelta(years=interval)

        else:  # CUSTOM
            # Default to monthly
            next_date = current + relativedelta(months=interval)

        # Check if past end date
        if recurring.end_date and next_date > recurring.end_date:
            return None

        return next_date

    def _create_transaction_from_occurrence(
        self,
        recurring: RecurringTransaction,
        occurrence: RecurringTransactionOccurrence
    ) -> Transaction:
        """Create an actual transaction from an occurrence."""
        # Get profile for encryption
        profile = self.db.query(FinancialProfile).filter(
            FinancialProfile.id == recurring.financial_profile_id
        ).first()

        amount = occurrence.expected_amount

        # Handle encryption for HS profiles
        if profile.is_high_security:
            # For automated jobs, we need a different approach
            # In production, use stored encrypted key or skip encryption
            encrypted_amount = str(amount)  # Simplified for demo
            encrypted_description = recurring.description
            encrypted_notes = None
        else:
            encrypted_amount = str(amount)
            encrypted_description = recurring.description
            encrypted_notes = None

        tx = Transaction(
            financial_profile_id=recurring.financial_profile_id,
            account_id=recurring.account_id,
            category_id=recurring.category_id,
            recurring_transaction_id=recurring.id,
            transaction_date=occurrence.scheduled_date,
            transaction_type=recurring.transaction_type,
            source=TransactionSource.RECURRING,
            amount=encrypted_amount,
            amount_clear=amount,
            currency=recurring.currency,
            amount_in_profile_currency=amount,
            description=encrypted_description,
            description_clear=recurring.name[:255],
            notes=encrypted_notes
        )

        self.db.add(tx)
        self.db.flush()

        return tx

    def _send_reminder_notification(
        self,
        recurring: RecurringTransaction,
        occurrence: RecurringTransactionOccurrence
    ) -> None:
        """Send a reminder notification for a pending occurrence."""
        # Get user from profile
        profile = self.db.query(FinancialProfile).filter(
            FinancialProfile.id == recurring.financial_profile_id
        ).first()

        notification = Notification(
            user_id=profile.user_id,
            financial_profile_id=profile.id,
            notification_type=NotificationType.RECURRING_REMINDER,
            title=f"Recurring: {recurring.name}",
            message=f"You have a recurring transaction due on {occurrence.scheduled_date}: {recurring.name} ({occurrence.expected_amount} {recurring.currency})",
            status=NotificationStatus.UNREAD,
            priority=6
        )

        self.db.add(notification)

    def generate_upcoming_occurrences(
        self,
        recurring_id: UUID,
        months_ahead: int = 12
    ) -> List[Dict[str, Any]]:
        """
        Generate preview of upcoming occurrences.

        Args:
            recurring_id: Recurring transaction ID
            months_ahead: Months to generate

        Returns:
            List of upcoming occurrences
        """
        recurring = self.db.query(RecurringTransaction).filter(
            RecurringTransaction.id == recurring_id
        ).first()

        if not recurring:
            raise ValueError(f"Recurring transaction not found: {recurring_id}")

        occurrences = []
        current_date = recurring.next_occurrence_date or date.today()
        end_preview = date.today() + relativedelta(months=months_ahead)

        # Create a temp recurring for calculation
        temp_recurring = recurring

        while current_date and current_date <= end_preview:
            if recurring.end_date and current_date > recurring.end_date:
                break

            amount = self._calculate_amount(temp_recurring, current_date)

            occurrences.append({
                'date': str(current_date),
                'amount': float(amount),
                'currency': recurring.currency
            })

            # Calculate next
            temp_recurring.next_occurrence_date = current_date
            current_date = self._calculate_next_occurrence(temp_recurring)

        return occurrences

    def skip_occurrence(
        self,
        occurrence_id: UUID,
        reason: Optional[str] = None
    ) -> RecurringTransactionOccurrence:
        """Skip an occurrence."""
        occurrence = self.db.query(RecurringTransactionOccurrence).filter(
            RecurringTransactionOccurrence.id == occurrence_id
        ).first()

        if not occurrence:
            raise ValueError(f"Occurrence not found: {occurrence_id}")

        occurrence.status = OccurrenceStatus.SKIPPED
        occurrence.notes = reason

        self.db.commit()
        self.db.refresh(occurrence)

        return occurrence

    def override_occurrence(
        self,
        occurrence_id: UUID,
        actual_amount: Decimal,
        actual_date: Optional[date] = None
    ) -> RecurringTransactionOccurrence:
        """Override an occurrence with different values."""
        occurrence = self.db.query(RecurringTransactionOccurrence).filter(
            RecurringTransactionOccurrence.id == occurrence_id
        ).first()

        if not occurrence:
            raise ValueError(f"Occurrence not found: {occurrence_id}")

        occurrence.actual_amount = actual_amount
        if actual_date:
            occurrence.scheduled_date = actual_date
        occurrence.status = OccurrenceStatus.OVERRIDDEN

        self.db.commit()
        self.db.refresh(occurrence)

        return occurrence
