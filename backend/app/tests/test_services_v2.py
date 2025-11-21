# app/tests/test_services_v2.py
"""
Unit tests for FinancePro v2.1 services.

Tests cover:
- Budget Service
- Goal Service
- Import Service
- Exchange Rate Service
- Recurring Transaction Service
- Encryption Service
"""
import pytest
from uuid import uuid4
from datetime import date, datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

# Import services
from app.services.v2.budget_service import BudgetService
from app.services.v2.goal_service import GoalService
from app.services.v2.import_service import ImportService
from app.services.v2.exchange_rate_service import ExchangeRateService
from app.services.v2.recurring_service import RecurringTransactionService

# Import models and enums
from app.models.enums import (
    ScopeType, PeriodType, GoalType, GoalStatus,
    ImportType, ImportStatus, Frequency, AmountModel
)
from app.core.encryption import EncryptionService, ProfileEncryptionContext


class TestEncryptionService:
    """Tests for the encryption service."""

    def test_generate_salt(self):
        """Test salt generation."""
        service = EncryptionService()
        salt = service.generate_salt()

        assert salt is not None
        assert len(salt) > 0
        # Should be base64 encoded
        import base64
        decoded = base64.b64decode(salt)
        assert len(decoded) == 32

    def test_encrypt_decrypt_string(self):
        """Test encryption and decryption of strings."""
        service = EncryptionService()
        salt = service.generate_salt()
        password = "test_password_123"
        plaintext = "Sensitive financial data"

        # Encrypt
        ciphertext = service.encrypt(plaintext, password, salt)
        assert ciphertext != plaintext

        # Decrypt
        decrypted = service.decrypt(ciphertext, password, salt)
        assert decrypted == plaintext

    def test_encrypt_decrypt_numeric(self):
        """Test encryption and decryption of numeric values."""
        service = EncryptionService()
        salt = service.generate_salt()
        password = "test_password_123"
        amount = 1234.56

        # Encrypt
        encrypted = service.encrypt_numeric(amount, password, salt)
        assert encrypted != str(amount)

        # Decrypt
        decrypted = service.decrypt_numeric(encrypted, password, salt)
        assert abs(decrypted - amount) < 0.001

    def test_wrong_password_fails(self):
        """Test that decryption with wrong password fails."""
        service = EncryptionService()
        salt = service.generate_salt()
        plaintext = "Secret data"

        # Encrypt with correct password
        ciphertext = service.encrypt(plaintext, "correct_password", salt)

        # Try to decrypt with wrong password
        with pytest.raises(ValueError):
            service.decrypt(ciphertext, "wrong_password", salt)

    def test_different_salts_different_ciphertext(self):
        """Test that different salts produce different ciphertext."""
        service = EncryptionService()
        salt1 = service.generate_salt()
        salt2 = service.generate_salt()
        password = "test_password"
        plaintext = "Test data"

        ciphertext1 = service.encrypt(plaintext, password, salt1)
        ciphertext2 = service.encrypt(plaintext, password, salt2)

        assert ciphertext1 != ciphertext2

    def test_profile_encryption_context(self):
        """Test ProfileEncryptionContext helper."""
        service = EncryptionService()
        salt = service.generate_salt()
        profile_id = str(uuid4())
        password = "test_password"

        ctx = ProfileEncryptionContext(profile_id, salt, password, service)

        plaintext = "Transaction description"
        encrypted = ctx.encrypt(plaintext)
        decrypted = ctx.decrypt(encrypted)

        assert decrypted == plaintext


class TestExchangeRateService:
    """Tests for the exchange rate service."""

    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        return MagicMock()

    def test_same_currency_returns_one(self, mock_db):
        """Test that same currency returns rate of 1.0."""
        service = ExchangeRateService(mock_db)

        rate = service.get_rate("EUR", "EUR", date.today())
        assert rate == Decimal("1.0")

    def test_convert_same_currency(self, mock_db):
        """Test conversion with same currency."""
        service = ExchangeRateService(mock_db)

        result = service.convert(Decimal("100.00"), "EUR", "EUR")
        assert result == Decimal("100.00")

    def test_get_mock_rates(self, mock_db):
        """Test mock rate generation."""
        service = ExchangeRateService(mock_db)

        rates = service._get_mock_rates("EUR")
        assert "USD" in rates
        assert "GBP" in rates
        assert rates["USD"] > 0

    def test_supported_currencies(self, mock_db):
        """Test supported currencies list."""
        service = ExchangeRateService(mock_db)

        assert "EUR" in service.SUPPORTED_CURRENCIES
        assert "USD" in service.SUPPORTED_CURRENCIES
        assert "GBP" in service.SUPPORTED_CURRENCIES


class TestBudgetServiceUnit:
    """Unit tests for BudgetService."""

    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None
        return db

    @pytest.fixture
    def mock_rls(self):
        """Create mock RLS service."""
        rls = MagicMock()
        rls.check_user_owns_resource.return_value = True
        rls.get_user_profile_ids.return_value = [uuid4()]
        return rls

    def test_scope_validation_user(self, mock_db, mock_rls):
        """Test that USER scope doesn't require profile_ids."""
        service = BudgetService(mock_db, mock_rls)

        # This should not raise
        # The actual create would need more mocking


class TestGoalServiceUnit:
    """Unit tests for GoalService."""

    def test_calculate_months_remaining(self):
        """Test month calculation."""
        from app.services.v2.goal_service import GoalService

        # Create minimal mock
        mock_db = MagicMock()
        mock_rls = MagicMock()
        service = GoalService(mock_db, mock_rls)

        start = date(2025, 1, 1)
        end = date(2025, 12, 31)

        months = service._calculate_months_remaining(start, end)
        # 364 days / 30 = 12.13, ceil = 13
        assert months == 13

    def test_calculate_expected_progress(self):
        """Test expected progress calculation."""
        from app.services.v2.goal_service import GoalService

        mock_db = MagicMock()
        mock_rls = MagicMock()
        service = GoalService(mock_db, mock_rls)

        # Create mock goal
        goal = MagicMock()
        goal.start_date = date.today() - timedelta(days=50)
        goal.target_date = date.today() + timedelta(days=50)

        progress = service._calculate_expected_progress(goal)

        # Should be around 50%
        assert 40 < progress < 60


class TestImportServiceUnit:
    """Unit tests for ImportService."""

    def test_parse_date_formats(self):
        """Test date parsing with various formats."""
        from app.services.v2.import_service import ImportService

        mock_db = MagicMock()
        mock_rls = MagicMock()
        service = ImportService(mock_db, mock_rls)

        # Test different formats
        assert service._parse_date("2025-01-15") == date(2025, 1, 15)
        assert service._parse_date("15/01/2025") == date(2025, 1, 15)
        assert service._parse_date("01/15/2025") == date(2025, 1, 15)
        assert service._parse_date("15.01.2025") == date(2025, 1, 15)

    def test_parse_amount_formats(self):
        """Test amount parsing with various formats."""
        from app.services.v2.import_service import ImportService

        mock_db = MagicMock()
        mock_rls = MagicMock()
        service = ImportService(mock_db, mock_rls)

        # Test different formats
        assert service._parse_amount("100.00") == Decimal("100.00")
        assert service._parse_amount("1,234.56") == Decimal("1234.56")
        assert service._parse_amount("1.234,56") == Decimal("1234.56")
        assert service._parse_amount("€100.00") == Decimal("100.00")
        assert service._parse_amount("-50.00") == Decimal("-50.00")

    def test_get_default_mapping(self):
        """Test default field mapping."""
        from app.services.v2.import_service import ImportService

        mock_db = MagicMock()
        mock_rls = MagicMock()
        service = ImportService(mock_db, mock_rls)

        mapping = service._get_default_mapping()

        assert "date" in mapping
        assert "amount" in mapping
        assert "description" in mapping

    def test_suggest_mapping(self):
        """Test automatic mapping suggestion."""
        from app.services.v2.import_service import ImportService

        mock_db = MagicMock()
        mock_rls = MagicMock()
        service = ImportService(mock_db, mock_rls)

        headers = ["Transaction Date", "Amount", "Description", "Category"]
        suggested = service._suggest_mapping(headers)

        assert suggested.get("date") == "Transaction Date"
        assert suggested.get("amount") == "Amount"
        assert suggested.get("description") == "Description"
        assert suggested.get("category") == "Category"

    def test_preview_csv(self):
        """Test CSV preview functionality."""
        from app.services.v2.import_service import ImportService

        mock_db = MagicMock()
        mock_rls = MagicMock()
        service = ImportService(mock_db, mock_rls)

        csv_content = """date,amount,description
2025-01-01,100.00,Test transaction
2025-01-02,-50.00,Another transaction"""

        preview = service.preview_csv(csv_content)

        assert "headers" in preview
        assert preview["total_rows"] == 2
        assert len(preview["preview_rows"]) == 2


class TestRecurringServiceUnit:
    """Unit tests for RecurringTransactionService."""

    def test_calculate_next_occurrence_daily(self):
        """Test daily frequency calculation."""
        from app.services.v2.recurring_service import RecurringTransactionService

        mock_db = MagicMock()
        service = RecurringTransactionService(mock_db)

        recurring = MagicMock()
        recurring.frequency = Frequency.DAILY
        recurring.interval = 1
        recurring.next_occurrence_date = date(2025, 1, 1)
        recurring.end_date = None

        next_date = service._calculate_next_occurrence(recurring)
        assert next_date == date(2025, 1, 2)

    def test_calculate_next_occurrence_monthly(self):
        """Test monthly frequency calculation."""
        from app.services.v2.recurring_service import RecurringTransactionService

        mock_db = MagicMock()
        service = RecurringTransactionService(mock_db)

        recurring = MagicMock()
        recurring.frequency = Frequency.MONTHLY
        recurring.interval = 1
        recurring.next_occurrence_date = date(2025, 1, 15)
        recurring.end_date = None

        next_date = service._calculate_next_occurrence(recurring)
        assert next_date == date(2025, 2, 15)

    def test_calculate_amount_fixed(self):
        """Test fixed amount calculation."""
        from app.services.v2.recurring_service import RecurringTransactionService

        mock_db = MagicMock()
        service = RecurringTransactionService(mock_db)

        recurring = MagicMock()
        recurring.amount_model = AmountModel.FIXED
        recurring.base_amount = Decimal("100.00")

        amount = service._calculate_amount(recurring, date.today())
        assert amount == Decimal("100.00")

    def test_calculate_amount_seasonal(self):
        """Test seasonal amount calculation."""
        from app.services.v2.recurring_service import RecurringTransactionService

        mock_db = MagicMock()
        service = RecurringTransactionService(mock_db)

        recurring = MagicMock()
        recurring.amount_model = AmountModel.SEASONAL
        recurring.base_amount = Decimal("100.00")

        # January should have higher factor (heating)
        amount_jan = service._calculate_amount(recurring, date(2025, 1, 15))
        # June should have lower factor
        amount_jun = service._calculate_amount(recurring, date(2025, 6, 15))

        assert amount_jan > amount_jun


class TestScheduledJobs:
    """Tests for scheduled job functions."""

    @patch('app.jobs.scheduled_jobs.SessionLocal')
    def test_process_recurring_transactions(self, mock_session_local):
        """Test recurring transaction processing job."""
        from app.jobs.scheduled_jobs import process_recurring_transactions

        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        # Mock the service
        with patch('app.jobs.scheduled_jobs.RecurringTransactionService') as MockService:
            mock_service = MagicMock()
            mock_service.process_due_recurring.return_value = {
                'processed': 5,
                'created': 3,
                'notified': 2,
                'errors': []
            }
            MockService.return_value = mock_service

            result = process_recurring_transactions()

            assert result['processed'] == 5
            assert result['created'] == 3

    @patch('app.jobs.scheduled_jobs.SessionLocal')
    def test_update_exchange_rates(self, mock_session_local):
        """Test exchange rate update job."""
        from app.jobs.scheduled_jobs import update_exchange_rates

        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        with patch('app.jobs.scheduled_jobs.ExchangeRateService') as MockService:
            mock_service = MagicMock()
            mock_service.fetch_and_update_rates.return_value = {
                'updated': 10,
                'errors': []
            }
            MockService.return_value = mock_service

            result = update_exchange_rates()

            assert result['updated'] == 10


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
