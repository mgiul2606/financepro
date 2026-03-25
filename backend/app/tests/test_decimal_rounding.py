# tests/test_decimal_rounding.py
"""
Tests for monetary amount rounding.

Verifies that amounts with excess decimal places (from division,
currency conversion, etc.) are correctly rounded to 2 decimal places
both at serialization (Pydantic response model) and at write time
(service/API layer).
"""
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

import pytest

from app.schemas.transaction import TransactionResponse, TransactionListResponse
from app.models.transaction import Transaction
from app.models.enums import TransactionType, TransactionSource


def _make_orm_transaction(**overrides) -> Transaction:
    """Create a minimal Transaction ORM-like object for testing."""
    now = datetime.now(timezone.utc)
    defaults = dict(
        id=uuid.uuid4(),
        financial_profile_id=uuid.uuid4(),
        account_id=uuid.uuid4(),
        category_id=None,
        merchant_id=None,
        recurring_transaction_id=None,
        related_transaction_id=None,
        duplicate_of_id=None,
        transaction_date=date(2025, 6, 15),
        transaction_type=TransactionType.PURCHASE,
        source=TransactionSource.MANUAL,
        amount="-646.3101416509385",  # TEXT column with many decimals
        amount_clear=Decimal("-646.3101416509385"),  # Numeric column
        currency="EUR",
        exchange_rate=None,
        amount_in_profile_currency=Decimal("-646.3101416509385"),
        description="Test transaction",
        description_clear="Test transaction",
        merchant_name=None,
        notes=None,
        is_reconciled=False,
        is_duplicate=False,
        receipt_url=None,
        import_job_id=None,
        external_id=None,
        transaction_metadata=None,
        created_at=now,
        updated_at=now,
    )
    defaults.update(overrides)

    # Build a simple namespace object that behaves like an ORM instance
    class FakeORM:
        pass

    obj = FakeORM()
    for k, v in defaults.items():
        setattr(obj, k, v)
    return obj


class TestTransactionResponseRounding:
    """Tests that TransactionResponse rounds monetary fields from ORM objects."""

    def test_amount_rounded_from_orm(self):
        """A transaction with many decimal places should be rounded to 2."""
        orm_tx = _make_orm_transaction(
            amount="-646.3101416509385",
            amount_clear=Decimal("-646.3101416509385"),
            amount_in_profile_currency=Decimal("-646.3101416509385"),
        )
        resp = TransactionResponse.model_validate(orm_tx, from_attributes=True)
        assert resp.amount == Decimal("-646.31")
        assert resp.amount_in_profile_currency == Decimal("-646.31")

    def test_amount_rounded_half_up(self):
        """ROUND_HALF_UP: 0.125 -> 0.13, 0.1249 -> 0.12."""
        orm_tx = _make_orm_transaction(
            amount="100.125",
            amount_clear=Decimal("100.125"),
            amount_in_profile_currency=Decimal("100.125"),
        )
        resp = TransactionResponse.model_validate(orm_tx, from_attributes=True)
        assert resp.amount == Decimal("100.13")  # ROUND_HALF_UP

    def test_clean_amount_passes_through(self):
        """An amount already at 2dp should pass through unchanged."""
        orm_tx = _make_orm_transaction(
            amount="50.00",
            amount_clear=Decimal("50.00"),
            amount_in_profile_currency=Decimal("50.00"),
        )
        resp = TransactionResponse.model_validate(orm_tx, from_attributes=True)
        assert resp.amount == Decimal("50.00")

    def test_list_response_with_dirty_amounts(self):
        """TransactionListResponse should not raise ValidationError for dirty data."""
        items = [
            _make_orm_transaction(
                amount=str(Decimal("999.999")),
                amount_clear=Decimal("999.999"),
                amount_in_profile_currency=Decimal("999.999"),
            )
            for _ in range(5)
        ]
        # This would previously raise:
        # pydantic_core._pydantic_core.ValidationError: ... Decimal input should
        # have no more than 2 decimal places
        resp = TransactionListResponse(items=items, total=5)
        assert resp.total == 5
        for item in resp.items:
            assert item.amount == Decimal("1000.00")

    def test_division_result_rounded(self):
        """Simulates a split transaction: 100 / 3 = 33.3333..."""
        raw = Decimal("100") / Decimal("3")  # 33.33333...
        orm_tx = _make_orm_transaction(
            amount=str(raw),
            amount_clear=raw,
            amount_in_profile_currency=raw,
        )
        resp = TransactionResponse.model_validate(orm_tx, from_attributes=True)
        assert resp.amount == Decimal("33.33")

    def test_currency_conversion_rounded(self):
        """Simulates EUR->USD conversion: 100 * 1.08765 = 108.765."""
        base = Decimal("100.00")
        rate = Decimal("1.08765")
        converted = base * rate  # 108.76500
        orm_tx = _make_orm_transaction(
            amount=str(base),
            amount_clear=base,
            exchange_rate=rate,
            amount_in_profile_currency=converted,
        )
        resp = TransactionResponse.model_validate(orm_tx, from_attributes=True)
        assert resp.amount == Decimal("100.00")
        assert resp.amount_in_profile_currency == Decimal("108.77")  # ROUND_HALF_UP

    def test_dict_input_rounded(self):
        """When building from a dict, amounts are also rounded."""
        data = dict(
            id=str(uuid.uuid4()),
            financial_profile_id=str(uuid.uuid4()),
            account_id=str(uuid.uuid4()),
            transaction_type="purchase",
            amount="123.456",
            currency="EUR",
            description="Test",
            transaction_date="2025-06-15",
            amount_in_profile_currency="123.456",
            is_reconciled=False,
            is_duplicate=False,
            source="manual",
            created_at="2025-06-15T10:00:00Z",
            updated_at="2025-06-15T10:00:00Z",
        )
        resp = TransactionResponse.model_validate(data)
        assert resp.amount == Decimal("123.46")
        assert resp.amount_in_profile_currency == Decimal("123.46")


class TestWriteLayerRounding:
    """Tests that the write-side helpers round correctly."""

    def test_import_parse_amount_rounds(self):
        """ImportService._parse_amount should round to 2dp."""
        from app.services.import_service import ImportService
        # Monkey-patch to test static-like method
        svc = object.__new__(ImportService)
        assert svc._parse_amount("123.456") == Decimal("123.46")
        assert svc._parse_amount("100.125") == Decimal("100.13")
        assert svc._parse_amount("-50.999") == Decimal("-51.00")
        assert svc._parse_amount("1.234,56") == Decimal("1234.56")  # European format

    def test_transaction_service_round_money(self):
        """round_money helper should quantize correctly."""
        from app.services.transaction_service import round_money
        assert round_money(Decimal("100.125")) == Decimal("100.13")
        assert round_money(Decimal("-646.3101416509385")) == Decimal("-646.31")
        assert round_money(Decimal("0.001")) == Decimal("0.00")
        assert round_money(Decimal("999.999")) == Decimal("1000.00")
