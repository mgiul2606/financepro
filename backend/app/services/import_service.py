# app/services/v2/import_service.py
"""
Import Service for FinancePro v2.1.

Handles data import with:
- CSV file parsing
- Field mapping
- Duplicate detection (fuzzy matching)
- Batch import job management
- Merchant matching and classification
"""
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
import csv
import io
import hashlib
import logging
from difflib import SequenceMatcher

from app.models import (
    ImportJob,
    Transaction,
    Account,
    Category,
    Merchant,
    FinancialProfile,
    ImportType,
    ImportStatus,
    TransactionType,
    TransactionSource
)
from app.core.rls import RLSService
from app.core.encryption import get_encryption_service, ProfileEncryptionContext

logger = logging.getLogger(__name__)


class ImportService:
    """
    Service for importing financial data.

    Usage:
        service = ImportService(db, rls)
        job = service.create_import_job(
            profile_id=profile_id,
            file_name="bank_statement.csv",
            file_path="/uploads/...",
            import_type=ImportType.CSV,
            mapping_config={
                "date": "Transaction Date",
                "amount": "Amount",
                "description": "Description"
            }
        )
        result = service.process_csv_import(job.id, csv_content)
    """

    def __init__(self, db: Session, rls: RLSService):
        """Initialize import service."""
        self.db = db
        self.rls = rls
        self.encryption = get_encryption_service()

    def create_import_job(
        self,
        profile_id: UUID,
        file_name: str,
        file_path: str,
        import_type: ImportType,
        account_id: Optional[UUID] = None,
        mapping_config: Optional[Dict[str, str]] = None
    ) -> ImportJob:
        """
        Create a new import job.

        Args:
            profile_id: Financial profile ID
            file_name: Original file name
            file_path: Storage path
            import_type: Type of import
            account_id: Target account
            mapping_config: Column mapping configuration

        Returns:
            ImportJob: Created import job
        """
        # Verify profile access
        self.rls.check_profile_access(profile_id)

        job = ImportJob(
            financial_profile_id=profile_id,
            account_id=account_id,
            file_name=file_name,
            file_path=file_path,
            import_type=import_type,
            status=ImportStatus.PENDING,
            mapping_config=mapping_config
        )

        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        logger.info(f"Created import job {job.id} for profile {profile_id}")
        return job

    def get_import_job(self, job_id: UUID) -> ImportJob:
        """
        Get an import job by ID.

        Args:
            job_id: Import job UUID

        Returns:
            ImportJob: Import job object

        Raises:
            ValueError: If job not found or not accessible
        """
        profile_ids = self.rls.get_user_profile_ids()

        job = self.db.query(ImportJob).filter(
            ImportJob.id == job_id,
            ImportJob.financial_profile_id.in_(profile_ids)
        ).first()

        if not job:
            raise ValueError(f"Import job not found: {job_id}")

        return job

    def list_import_jobs(
        self,
        profile_id: Optional[UUID] = None,
        status: Optional[ImportStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[ImportJob]:
        """
        List import jobs.

        Args:
            profile_id: Filter by profile
            status: Filter by status
            limit: Max results
            offset: Results offset

        Returns:
            List[ImportJob]: Import jobs
        """
        query = self.db.query(ImportJob)

        # Apply profile filter
        if profile_id:
            self.rls.check_profile_access(profile_id)
            query = query.filter(ImportJob.financial_profile_id == profile_id)
        else:
            query = self.rls.filter_by_profile(query, ImportJob)

        if status:
            query = query.filter(ImportJob.status == status)

        query = query.order_by(ImportJob.created_at.desc())
        query = query.limit(limit).offset(offset)

        return query.all()

    def process_csv_import(
        self,
        job_id: UUID,
        csv_content: str,
        user_password: Optional[str] = None,
        skip_duplicates: bool = True,
        auto_categorize: bool = True
    ) -> Dict[str, Any]:
        """
        Process a CSV import job.

        Args:
            job_id: Import job UUID
            csv_content: CSV file content as string
            user_password: User password for HS profiles
            skip_duplicates: Skip detected duplicates
            auto_categorize: Auto-categorize using ML

        Returns:
            Dict with import results
        """
        job = self.get_import_job(job_id)

        # Update job status
        job.status = ImportStatus.PROCESSING
        job.started_at = datetime.utcnow()
        self.db.commit()

        # Get profile for encryption settings
        profile = self.db.query(FinancialProfile).filter(
            FinancialProfile.id == job.financial_profile_id
        ).first()

        needs_encryption = profile.is_high_security
        if needs_encryption and not user_password:
            job.status = ImportStatus.FAILED
            job.error_message = "Password required for High-Security profile"
            self.db.commit()
            raise ValueError("Password required for High-Security profile")

        results = {
            'total_rows': 0,
            'successful': 0,
            'failed': 0,
            'duplicates': 0,
            'errors': []
        }

        try:
            # Parse CSV
            reader = csv.DictReader(io.StringIO(csv_content))
            rows = list(reader)
            results['total_rows'] = len(rows)
            job.total_rows = len(rows)

            # Get mapping config
            mapping = job.mapping_config or self._get_default_mapping()

            for i, row in enumerate(rows):
                try:
                    # Parse row
                    parsed = self._parse_csv_row(row, mapping)

                    # Check for duplicates
                    if skip_duplicates:
                        duplicates = self._detect_duplicates(
                            profile_id=job.financial_profile_id,
                            transaction_date=parsed['date'],
                            amount=parsed['amount'],
                            description=parsed['description']
                        )
                        if duplicates:
                            results['duplicates'] += 1
                            continue

                    # Create transaction
                    tx = self._create_transaction_from_import(
                        job=job,
                        parsed_data=parsed,
                        profile=profile,
                        user_password=user_password,
                        auto_categorize=auto_categorize
                    )

                    results['successful'] += 1

                except Exception as e:
                    results['failed'] += 1
                    results['errors'].append({
                        'row': i + 1,
                        'error': str(e)
                    })
                    logger.error(f"Error processing row {i + 1}: {e}")

            # Update job
            job.processed_rows = results['total_rows']
            job.successful_imports = results['successful']
            job.failed_imports = results['failed']
            job.skipped_duplicates = results['duplicates']

            if results['failed'] == 0:
                job.status = ImportStatus.COMPLETED
            elif results['successful'] > 0:
                job.status = ImportStatus.PARTIAL
            else:
                job.status = ImportStatus.FAILED

            job.completed_at = datetime.utcnow()
            job.error_details = {'errors': results['errors']} if results['errors'] else None

        except Exception as e:
            job.status = ImportStatus.FAILED
            job.error_message = str(e)
            logger.error(f"Import job {job_id} failed: {e}")
            raise

        finally:
            self.db.commit()

        logger.info(f"Import job {job_id} completed: {results['successful']}/{results['total_rows']} successful")
        return results

    def _parse_csv_row(
        self,
        row: Dict[str, str],
        mapping: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Parse a CSV row using the mapping configuration.

        Args:
            row: CSV row data
            mapping: Field mapping

        Returns:
            Dict with parsed data
        """
        parsed = {}

        # Required fields
        date_col = mapping.get('date', 'date')
        amount_col = mapping.get('amount', 'amount')
        desc_col = mapping.get('description', 'description')

        # Parse date
        date_str = row.get(date_col, '').strip()
        if not date_str:
            raise ValueError(f"Missing date in column '{date_col}'")

        parsed['date'] = self._parse_date(date_str)

        # Parse amount
        amount_str = row.get(amount_col, '').strip()
        if not amount_str:
            raise ValueError(f"Missing amount in column '{amount_col}'")

        parsed['amount'] = self._parse_amount(amount_str)

        # Parse description
        parsed['description'] = row.get(desc_col, '').strip()

        # Optional fields
        if 'currency' in mapping:
            parsed['currency'] = row.get(mapping['currency'], 'EUR').strip() or 'EUR'
        else:
            parsed['currency'] = 'EUR'

        if 'category' in mapping:
            parsed['category_name'] = row.get(mapping['category'], '').strip()

        if 'merchant' in mapping:
            parsed['merchant_name'] = row.get(mapping['merchant'], '').strip()

        if 'notes' in mapping:
            parsed['notes'] = row.get(mapping['notes'], '').strip()

        if 'external_id' in mapping:
            parsed['external_id'] = row.get(mapping['external_id'], '').strip()

        return parsed

    def _parse_date(self, date_str: str) -> date:
        """Parse date string in various formats."""
        formats = [
            '%Y-%m-%d',
            '%d/%m/%Y',
            '%m/%d/%Y',
            '%d-%m-%Y',
            '%Y/%m/%d',
            '%d.%m.%Y',
        ]

        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue

        raise ValueError(f"Could not parse date: {date_str}")

    def _parse_amount(self, amount_str: str) -> Decimal:
        """Parse amount string with various formats."""
        # Remove currency symbols and spaces
        cleaned = amount_str.replace('€', '').replace('$', '').replace('£', '').strip()

        # Handle European format (1.234,56) vs US format (1,234.56)
        if ',' in cleaned and '.' in cleaned:
            if cleaned.rfind(',') > cleaned.rfind('.'):
                # European format: 1.234,56
                cleaned = cleaned.replace('.', '').replace(',', '.')
            else:
                # US format: 1,234.56
                cleaned = cleaned.replace(',', '')
        elif ',' in cleaned:
            # Could be European decimal or US thousands
            if cleaned.count(',') == 1 and len(cleaned.split(',')[1]) == 2:
                # European decimal: 123,45
                cleaned = cleaned.replace(',', '.')
            else:
                # US thousands: 1,234
                cleaned = cleaned.replace(',', '')

        try:
            return Decimal(cleaned)
        except InvalidOperation:
            raise ValueError(f"Could not parse amount: {amount_str}")

    def _get_default_mapping(self) -> Dict[str, str]:
        """Get default field mapping."""
        return {
            'date': 'date',
            'amount': 'amount',
            'description': 'description',
            'currency': 'currency',
            'category': 'category',
            'merchant': 'merchant',
            'notes': 'notes'
        }

    def _detect_duplicates(
        self,
        profile_id: UUID,
        transaction_date: date,
        amount: Decimal,
        description: str,
        threshold: float = 0.8
    ) -> List[Transaction]:
        """
        Detect potential duplicate transactions using fuzzy matching.

        Args:
            profile_id: Profile ID
            transaction_date: Transaction date
            amount: Amount
            description: Description
            threshold: Similarity threshold (0-1)

        Returns:
            List[Transaction]: Potential duplicates
        """
        from datetime import timedelta

        # Search window: +/- 3 days
        start = transaction_date - timedelta(days=3)
        end = transaction_date + timedelta(days=3)

        # Query potential matches by date and amount
        candidates = self.db.query(Transaction).filter(
            Transaction.financial_profile_id == profile_id,
            Transaction.transaction_date.between(start, end),
            Transaction.amount_clear == amount
        ).all()

        duplicates = []

        for tx in candidates:
            # Fuzzy match on description
            if tx.description_clear:
                similarity = SequenceMatcher(
                    None,
                    description.lower(),
                    tx.description_clear.lower()
                ).ratio()

                if similarity >= threshold:
                    duplicates.append(tx)

        return duplicates

    def _create_transaction_from_import(
        self,
        job: ImportJob,
        parsed_data: Dict[str, Any],
        profile: FinancialProfile,
        user_password: Optional[str],
        auto_categorize: bool
    ) -> Transaction:
        """
        Create a transaction from imported data.

        Args:
            job: Import job
            parsed_data: Parsed row data
            profile: Financial profile
            user_password: User password for encryption
            auto_categorize: Auto-categorize

        Returns:
            Transaction: Created transaction
        """
        # Determine transaction type from amount sign
        amount = parsed_data['amount']
        if amount >= 0:
            tx_type = TransactionType.INCOME
        else:
            tx_type = TransactionType.PURCHASE

        # Find category
        category_id = None
        if parsed_data.get('category_name'):
            category = self.db.query(Category).filter(
                Category.user_id == profile.user_id,
                Category.name.ilike(parsed_data['category_name'])
            ).first()
            if category:
                category_id = category.id

        # Find or create merchant
        merchant_id = None
        merchant_name = parsed_data.get('merchant_name')
        if merchant_name:
            merchant_id = self._find_or_create_merchant(merchant_name)

        # Handle encryption for HS profiles
        if profile.is_high_security:
            ctx = ProfileEncryptionContext(
                str(profile.id),
                profile.encryption_salt,
                user_password,
                self.encryption
            )
            encrypted_amount = ctx.encrypt_numeric(float(amount))
            encrypted_description = ctx.encrypt(parsed_data['description']) if parsed_data['description'] else None
            encrypted_notes = ctx.encrypt(parsed_data.get('notes', '')) if parsed_data.get('notes') else None
        else:
            encrypted_amount = str(amount)
            encrypted_description = parsed_data['description']
            encrypted_notes = parsed_data.get('notes')

        # Create transaction
        tx = Transaction(
            financial_profile_id=job.financial_profile_id,
            account_id=job.account_id,
            category_id=category_id,
            merchant_id=merchant_id,
            transaction_date=parsed_data['date'],
            transaction_type=tx_type,
            source=TransactionSource.IMPORT_CSV,
            amount=encrypted_amount,
            amount_clear=amount,
            currency=parsed_data.get('currency', profile.default_currency),
            amount_in_profile_currency=amount,  # TODO: Apply exchange rate if different currency
            description=encrypted_description,
            description_clear=parsed_data['description'][:255] if parsed_data['description'] else None,
            merchant_name=merchant_name,
            notes=encrypted_notes,
            import_job_id=job.id,
            external_id=parsed_data.get('external_id')
        )

        self.db.add(tx)
        self.db.flush()

        return tx

    def _find_or_create_merchant(self, merchant_name: str) -> Optional[UUID]:
        """Find existing merchant or create new one."""
        normalized = merchant_name.strip().lower()

        # Search by canonical name or alias
        merchant = self.db.query(Merchant).filter(
            or_(
                Merchant.canonical_name.ilike(f"%{normalized}%"),
                Merchant.aliases.contains([merchant_name])
            )
        ).first()

        if merchant:
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

    def preview_csv(
        self,
        csv_content: str,
        mapping_config: Optional[Dict[str, str]] = None,
        max_rows: int = 10
    ) -> Dict[str, Any]:
        """
        Preview CSV import without creating transactions.

        Args:
            csv_content: CSV content
            mapping_config: Field mapping
            max_rows: Max preview rows

        Returns:
            Dict with preview data
        """
        reader = csv.DictReader(io.StringIO(csv_content))

        # Get headers
        headers = reader.fieldnames or []

        # Parse sample rows
        rows = []
        mapping = mapping_config or self._get_default_mapping()

        for i, row in enumerate(reader):
            if i >= max_rows:
                break

            try:
                parsed = self._parse_csv_row(row, mapping)
                rows.append({
                    'raw': row,
                    'parsed': {
                        'date': str(parsed['date']),
                        'amount': float(parsed['amount']),
                        'description': parsed['description'],
                        'currency': parsed.get('currency', 'EUR')
                    },
                    'valid': True
                })
            except Exception as e:
                rows.append({
                    'raw': row,
                    'error': str(e),
                    'valid': False
                })

        return {
            'headers': headers,
            'total_rows': sum(1 for _ in csv.DictReader(io.StringIO(csv_content))),
            'preview_rows': rows,
            'suggested_mapping': self._suggest_mapping(headers)
        }

    def _suggest_mapping(self, headers: List[str]) -> Dict[str, str]:
        """Suggest field mapping based on headers."""
        mapping = {}

        # Common patterns for each field
        patterns = {
            'date': ['date', 'data', 'transaction date', 'booking date', 'value date'],
            'amount': ['amount', 'importo', 'sum', 'value', 'debit', 'credit'],
            'description': ['description', 'descrizione', 'details', 'memo', 'reference', 'narrative'],
            'currency': ['currency', 'valuta', 'curr'],
            'category': ['category', 'categoria', 'type'],
            'merchant': ['merchant', 'payee', 'beneficiary', 'recipient', 'counterparty']
        }

        headers_lower = {h.lower(): h for h in headers}

        for field, field_patterns in patterns.items():
            for pattern in field_patterns:
                for header_lower, header_original in headers_lower.items():
                    if pattern in header_lower:
                        mapping[field] = header_original
                        break
                if field in mapping:
                    break

        return mapping

    def delete_import_job(self, job_id: UUID, delete_transactions: bool = False) -> bool:
        """
        Delete an import job.

        Args:
            job_id: Import job UUID
            delete_transactions: Also delete imported transactions

        Returns:
            bool: True if deleted
        """
        job = self.get_import_job(job_id)

        if delete_transactions:
            # Delete all transactions from this import
            self.db.query(Transaction).filter(
                Transaction.import_job_id == job_id
            ).delete()

        self.db.delete(job)
        self.db.commit()

        return True
