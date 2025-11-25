# app/services/v2/transaction_service.py
"""
Transaction service with encryption support for FinancePro v2.1.

Handles transaction CRUD operations with:
- Automatic encryption for High-Security profiles
- Exchange rate conversion
- Duplicate detection
- Merchant matching
"""
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import logging

from app.models import (
    Transaction,
    FinancialProfile,
    Account,
    Merchant,
    TransactionType,
    TransactionSource,
    SecurityLevel
)
from app.core.encryption import get_encryption_service, ProfileEncryptionContext
from app.core.rls import RLSService

logger = logging.getLogger(__name__)


class TransactionService:
    """
    Service for transaction operations with encryption support.

    Usage:
        service = TransactionService(db, rls)
        tx = service.create_transaction(
            profile_id=profile_id,
            account_id=account_id,
            transaction_date=date.today(),
            transaction_type=TransactionType.PURCHASE,
            amount=Decimal("100.00"),
            currency="EUR",
            description="Coffee at Starbucks",
            user_password="user_password"  # Required for HS profiles
        )
    """

    def __init__(self, db: Session, rls: RLSService):
        """Initialize transaction service."""
        self.db = db
        self.rls = rls
        self.encryption = get_encryption_service()

    def create_transaction(
        self,
        profile_id: UUID,
        account_id: UUID,
        transaction_date: date,
        transaction_type: TransactionType,
        amount: Decimal,
        currency: str,
        description: str,
        user_password: Optional[str] = None,
        category_id: Optional[UUID] = None,
        merchant_name: Optional[str] = None,
        notes: Optional[str] = None,
        tags: Optional[List[UUID]] = None,
        source: TransactionSource = TransactionSource.MANUAL,
        is_reconciled: bool = False,
        **kwargs
    ) -> Transaction:
        """
        Create a new transaction with encryption for HS profiles.

        Args:
            profile_id: Financial profile ID
            account_id: Account ID
            transaction_date: Transaction date
            transaction_type: Type of transaction
            amount: Transaction amount
            currency: Currency code
            description: Transaction description
            user_password: User password (required for HS profiles)
            category_id: Category ID
            merchant_name: Merchant name
            notes: Additional notes
            tags: List of tag IDs
            source: Transaction source
            is_reconciled: Reconciliation status
            **kwargs: Additional fields

        Returns:
            Transaction: Created transaction

        Raises:
            PermissionError: If user doesn't own profile
            ValueError: If HS profile but no password provided
        """
        # Verify profile access
        self.rls.check_profile_access(profile_id)

        # Get profile for encryption settings
        profile = self.db.query(FinancialProfile).filter(
            FinancialProfile.id == profile_id
        ).first()

        if not profile:
            raise ValueError(f"Profile not found: {profile_id}")

        # Check if encryption is needed
        needs_encryption = profile.is_high_security

        if needs_encryption and not user_password:
            raise ValueError("Password required for High-Security profile transactions")

        # Calculate amount in profile currency
        exchange_rate = kwargs.get('exchange_rate')
        if currency == profile.default_currency:
            amount_in_profile_currency = amount
        elif exchange_rate:
            amount_in_profile_currency = amount * exchange_rate
        else:
            amount_in_profile_currency = amount  # Assume same currency

        # Prepare encrypted/clear values
        if needs_encryption:
            ctx = ProfileEncryptionContext(
                str(profile_id),
                profile.encryption_salt,
                user_password,
                self.encryption
            )
            encrypted_amount = ctx.encrypt_numeric(float(amount))
            encrypted_description = ctx.encrypt(description) if description else None
            encrypted_notes = ctx.encrypt(notes) if notes else None
        else:
            encrypted_amount = str(amount)
            encrypted_description = description
            encrypted_notes = notes

        # Find or create merchant
        merchant_id = None
        if merchant_name:
            merchant_id = self._find_or_create_merchant(merchant_name)

        # Create transaction
        transaction = Transaction(
            financial_profile_id=profile_id,
            account_id=account_id,
            category_id=category_id,
            merchant_id=merchant_id,
            transaction_date=transaction_date,
            transaction_type=transaction_type,
            source=source,
            amount=encrypted_amount,
            amount_clear=amount,
            currency=currency,
            exchange_rate=exchange_rate,
            amount_in_profile_currency=amount_in_profile_currency,
            description=encrypted_description,
            description_clear=description[:255] if description else None,
            merchant_name=merchant_name,
            notes=encrypted_notes,
            is_reconciled=is_reconciled,
            **{k: v for k, v in kwargs.items() if k in [
                'related_transaction_id', 'receipt_url', 'import_job_id',
                'external_id', 'transaction_metadata', 'recurring_transaction_id'
            ]}
        )

        self.db.add(transaction)
        self.db.flush()

        # Add tags
        if tags:
            from app.models import Tag
            tag_objects = self.db.query(Tag).filter(Tag.id.in_(tags)).all()
            transaction.tags.extend(tag_objects)

        self.db.commit()
        self.db.refresh(transaction)

        logger.info(f"Created transaction {transaction.id} for profile {profile_id}")
        return transaction

    def get_transaction(
        self,
        transaction_id: UUID,
        user_password: Optional[str] = None,
        decrypt: bool = False
    ) -> Tuple[Transaction, Optional[dict]]:
        """
        Get a transaction by ID with optional decryption.

        Args:
            transaction_id: Transaction UUID
            user_password: User password for decryption
            decrypt: Whether to decrypt sensitive fields

        Returns:
            Tuple[Transaction, Optional[dict]]: Transaction and decrypted data
        """
        # Get transaction with profile access check
        profile_ids = self.rls.get_user_profile_ids()

        transaction = self.db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.financial_profile_id.in_(profile_ids)
        ).first()

        if not transaction:
            raise ValueError(f"Transaction not found: {transaction_id}")

        decrypted_data = None

        # Decrypt if requested and profile is HS
        if decrypt and user_password:
            profile = self.db.query(FinancialProfile).filter(
                FinancialProfile.id == transaction.financial_profile_id
            ).first()

            if profile.is_high_security:
                ctx = ProfileEncryptionContext(
                    str(profile.id),
                    profile.encryption_salt,
                    user_password,
                    self.encryption
                )
                decrypted_data = {
                    'amount': ctx.decrypt_numeric(transaction.amount),
                    'description': ctx.decrypt(transaction.description) if transaction.description else None,
                    'notes': ctx.decrypt(transaction.notes) if transaction.notes else None,
                }

        return transaction, decrypted_data

    def list_transactions(
        self,
        profile_ids: Optional[List[UUID]] = None,
        account_id: Optional[UUID] = None,
        category_id: Optional[UUID] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        transaction_type: Optional[TransactionType] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Transaction]:
        """
        List transactions with filters.

        Args:
            profile_ids: Filter by profile IDs (None = all user's profiles)
            account_id: Filter by account
            category_id: Filter by category
            start_date: Filter by start date
            end_date: Filter by end date
            transaction_type: Filter by type
            search: Search in description_clear and merchant_name
            limit: Max results
            offset: Results offset

        Returns:
            List[Transaction]: Filtered transactions
        """
        query = self.db.query(Transaction)

        # Apply profile filter
        if profile_ids:
            # Verify access to all requested profiles
            user_profiles = self.rls.get_user_profile_ids()
            valid_profiles = [p for p in profile_ids if p in user_profiles]
            query = query.filter(Transaction.financial_profile_id.in_(valid_profiles))
        else:
            query = self.rls.filter_by_profile(query, Transaction)

        # Apply filters
        if account_id:
            query = query.filter(Transaction.account_id == account_id)
        if category_id:
            query = query.filter(Transaction.category_id == category_id)
        if start_date:
            query = query.filter(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.filter(Transaction.transaction_date <= end_date)
        if transaction_type:
            query = query.filter(Transaction.transaction_type == transaction_type)
        if search:
            query = query.filter(
                or_(
                    Transaction.description_clear.ilike(f"%{search}%"),
                    Transaction.merchant_name.ilike(f"%{search}%")
                )
            )

        # Order and paginate
        query = query.order_by(
            Transaction.transaction_date.desc(),
            Transaction.created_at.desc()
        )
        query = query.limit(limit).offset(offset)

        return query.all()

    def update_transaction(
        self,
        transaction_id: UUID,
        user_password: Optional[str] = None,
        **updates
    ) -> Transaction:
        """
        Update a transaction.

        Args:
            transaction_id: Transaction UUID
            user_password: User password for HS profiles
            **updates: Fields to update

        Returns:
            Transaction: Updated transaction
        """
        transaction, _ = self.get_transaction(transaction_id)

        # Get profile for encryption
        profile = self.db.query(FinancialProfile).filter(
            FinancialProfile.id == transaction.financial_profile_id
        ).first()

        needs_encryption = profile.is_high_security

        if needs_encryption and not user_password:
            # Only require password if updating encrypted fields
            encrypted_fields = {'amount', 'description', 'notes'}
            if encrypted_fields & set(updates.keys()):
                raise ValueError("Password required to update encrypted fields")

        # Handle encrypted field updates
        if needs_encryption and user_password:
            ctx = ProfileEncryptionContext(
                str(profile.id),
                profile.encryption_salt,
                user_password,
                self.encryption
            )

            if 'amount' in updates:
                updates['amount'] = ctx.encrypt_numeric(float(updates['amount']))
                updates['amount_clear'] = updates.get('amount_clear', Decimal(str(updates['amount'])))
            if 'description' in updates:
                desc = updates['description']
                updates['description'] = ctx.encrypt(desc) if desc else None
                updates['description_clear'] = desc[:255] if desc else None
            if 'notes' in updates:
                updates['notes'] = ctx.encrypt(updates['notes']) if updates['notes'] else None

        # Apply updates
        for key, value in updates.items():
            if hasattr(transaction, key):
                setattr(transaction, key, value)

        self.db.commit()
        self.db.refresh(transaction)

        return transaction

    def delete_transaction(self, transaction_id: UUID) -> bool:
        """
        Delete a transaction.

        Args:
            transaction_id: Transaction UUID

        Returns:
            bool: True if deleted
        """
        transaction, _ = self.get_transaction(transaction_id)
        self.db.delete(transaction)
        self.db.commit()
        return True

    def detect_duplicates(
        self,
        profile_id: UUID,
        transaction_date: date,
        amount: Decimal,
        description: str,
        threshold_days: int = 3
    ) -> List[Transaction]:
        """
        Detect potential duplicate transactions.

        Args:
            profile_id: Profile ID
            transaction_date: Transaction date
            amount: Amount
            description: Description
            threshold_days: Days window for duplicate check

        Returns:
            List[Transaction]: Potential duplicates
        """
        from datetime import timedelta

        start = transaction_date - timedelta(days=threshold_days)
        end = transaction_date + timedelta(days=threshold_days)

        return self.db.query(Transaction).filter(
            Transaction.financial_profile_id == profile_id,
            Transaction.transaction_date.between(start, end),
            Transaction.amount_clear == amount,
            Transaction.description_clear.ilike(f"%{description[:50]}%")
        ).all()

    def _find_or_create_merchant(self, merchant_name: str) -> Optional[UUID]:
        """Find existing merchant or create new one."""
        # Normalize name
        normalized = merchant_name.strip().lower()

        # Search by canonical name or alias
        merchant = self.db.query(Merchant).filter(
            or_(
                Merchant.canonical_name.ilike(normalized),
                Merchant.aliases.contains([merchant_name])
            )
        ).first()

        if merchant:
            # Update usage count
            merchant.usage_count += 1
            return merchant.id

        # Create new merchant
        merchant = Merchant(
            canonical_name=merchant_name.strip(),
            usage_count=1
        )
        self.db.add(merchant)
        self.db.flush()

        return merchant.id
