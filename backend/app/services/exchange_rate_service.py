# app/services/v2/exchange_rate_service.py
"""
Exchange Rate Service for FinancePro v2.1.

Handles exchange rate operations:
- Fetch rates from external sources (ECB, mock)
- Upsert rates in database
- Get historical rates
- Currency conversion
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import logging
import random  # For mock data

from app.models import ExchangeRate

logger = logging.getLogger(__name__)


class ExchangeRateService:
    """
    Service for managing exchange rates.

    Usage:
        service = ExchangeRateService(db)
        rate = service.get_rate("USD", "EUR", date.today())
        converted = service.convert(100, "USD", "EUR", date.today())
    """

    # Supported currencies
    SUPPORTED_CURRENCIES = [
        'EUR', 'USD', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD', 'CNY',
        'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN',
        'HRK', 'RUB', 'TRY', 'BRL', 'MXN', 'INR', 'KRW', 'SGD',
        'HKD', 'NZD', 'ZAR', 'THB', 'MYR', 'IDR', 'PHP'
    ]

    def __init__(self, db: Session):
        """Initialize exchange rate service."""
        self.db = db

    def get_rate(
        self,
        base_currency: str,
        target_currency: str,
        rate_date: date
    ) -> Optional[Decimal]:
        """
        Get exchange rate for a specific date.

        Args:
            base_currency: Base currency code
            target_currency: Target currency code
            rate_date: Date for the rate

        Returns:
            Decimal: Exchange rate or None
        """
        if base_currency == target_currency:
            return Decimal("1.0")

        rate = self.db.query(ExchangeRate).filter(
            ExchangeRate.base_currency == base_currency,
            ExchangeRate.target_currency == target_currency,
            ExchangeRate.rate_date == rate_date
        ).first()

        if rate:
            return rate.rate

        # Try reverse rate
        reverse = self.db.query(ExchangeRate).filter(
            ExchangeRate.base_currency == target_currency,
            ExchangeRate.target_currency == base_currency,
            ExchangeRate.rate_date == rate_date
        ).first()

        if reverse:
            return Decimal("1") / reverse.rate

        # Fallback to most recent rate
        return self._get_nearest_rate(base_currency, target_currency, rate_date)

    def _get_nearest_rate(
        self,
        base_currency: str,
        target_currency: str,
        rate_date: date
    ) -> Optional[Decimal]:
        """Get nearest available rate if exact date not found."""
        rate = self.db.query(ExchangeRate).filter(
            ExchangeRate.base_currency == base_currency,
            ExchangeRate.target_currency == target_currency,
            ExchangeRate.rate_date <= rate_date
        ).order_by(ExchangeRate.rate_date.desc()).first()

        return rate.rate if rate else None

    def convert(
        self,
        amount: Decimal,
        from_currency: str,
        to_currency: str,
        conversion_date: Optional[date] = None
    ) -> Optional[Decimal]:
        """
        Convert amount between currencies.

        Args:
            amount: Amount to convert
            from_currency: Source currency
            to_currency: Target currency
            conversion_date: Date for rate (defaults to today)

        Returns:
            Decimal: Converted amount or None if rate not found
        """
        if from_currency == to_currency:
            return amount

        if not conversion_date:
            conversion_date = date.today()

        rate = self.get_rate(from_currency, to_currency, conversion_date)

        if rate is None:
            return None

        return amount * rate

    def upsert_rate(
        self,
        base_currency: str,
        target_currency: str,
        rate: Decimal,
        rate_date: date,
        source: str = "Manual"
    ) -> ExchangeRate:
        """
        Insert or update an exchange rate.

        Args:
            base_currency: Base currency code
            target_currency: Target currency code
            rate: Exchange rate
            rate_date: Date of the rate
            source: Data source

        Returns:
            ExchangeRate: Created or updated rate
        """
        existing = self.db.query(ExchangeRate).filter(
            ExchangeRate.base_currency == base_currency,
            ExchangeRate.target_currency == target_currency,
            ExchangeRate.rate_date == rate_date
        ).first()

        if existing:
            existing.rate = rate
            existing.source = source
            exchange_rate = existing
        else:
            exchange_rate = ExchangeRate(
                base_currency=base_currency,
                target_currency=target_currency,
                rate=rate,
                rate_date=rate_date,
                source=source
            )
            self.db.add(exchange_rate)

        self.db.commit()
        self.db.refresh(exchange_rate)

        return exchange_rate

    def fetch_and_update_rates(
        self,
        base_currency: str = "EUR",
        rate_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Fetch rates from external source and update database.

        This is a mock implementation. In production, use ECB or OpenExchangeRates API.

        Args:
            base_currency: Base currency for rates
            rate_date: Date to fetch (defaults to today)

        Returns:
            Dict with update results
        """
        if not rate_date:
            rate_date = date.today()

        results = {
            'base_currency': base_currency,
            'rate_date': str(rate_date),
            'updated': 0,
            'errors': []
        }

        # Mock rates (in production, fetch from ECB/OpenExchangeRates API)
        mock_rates = self._get_mock_rates(base_currency)

        for target_currency, rate in mock_rates.items():
            try:
                self.upsert_rate(
                    base_currency=base_currency,
                    target_currency=target_currency,
                    rate=Decimal(str(rate)),
                    rate_date=rate_date,
                    source="MockAPI"
                )
                results['updated'] += 1
            except Exception as e:
                results['errors'].append({
                    'currency': target_currency,
                    'error': str(e)
                })
                logger.error(f"Error updating rate {base_currency}/{target_currency}: {e}")

        logger.info(f"Updated {results['updated']} exchange rates for {base_currency}")
        return results

    def _get_mock_rates(self, base_currency: str) -> Dict[str, float]:
        """
        Get mock exchange rates.

        In production, replace with actual API calls to ECB or OpenExchangeRates.
        """
        # Base rates (EUR as reference)
        eur_rates = {
            'USD': 1.08,
            'GBP': 0.86,
            'CHF': 0.96,
            'JPY': 162.5,
            'AUD': 1.65,
            'CAD': 1.47,
            'CNY': 7.85,
            'SEK': 11.2,
            'NOK': 11.5,
            'DKK': 7.46,
            'PLN': 4.35,
            'CZK': 25.2,
            'HUF': 390.5,
        }

        if base_currency == 'EUR':
            return eur_rates

        # Convert to different base
        if base_currency in eur_rates:
            eur_to_base = eur_rates[base_currency]
            rates = {'EUR': 1 / eur_to_base}
            for curr, eur_rate in eur_rates.items():
                if curr != base_currency:
                    rates[curr] = eur_rate / eur_to_base
            return rates

        return {}

    def get_historical_rates(
        self,
        base_currency: str,
        target_currency: str,
        start_date: date,
        end_date: date
    ) -> List[ExchangeRate]:
        """
        Get historical exchange rates for a date range.

        Args:
            base_currency: Base currency
            target_currency: Target currency
            start_date: Start date
            end_date: End date

        Returns:
            List[ExchangeRate]: Historical rates
        """
        return self.db.query(ExchangeRate).filter(
            ExchangeRate.base_currency == base_currency,
            ExchangeRate.target_currency == target_currency,
            ExchangeRate.rate_date.between(start_date, end_date)
        ).order_by(ExchangeRate.rate_date.asc()).all()

    def get_available_currencies(self) -> List[str]:
        """Get list of currencies with available rates."""
        # Get unique currencies from database
        currencies = set()

        bases = self.db.query(ExchangeRate.base_currency).distinct().all()
        targets = self.db.query(ExchangeRate.target_currency).distinct().all()

        for (curr,) in bases:
            currencies.add(curr)
        for (curr,) in targets:
            currencies.add(curr)

        return sorted(list(currencies)) if currencies else self.SUPPORTED_CURRENCIES

    def fill_missing_rates(
        self,
        base_currency: str = "EUR",
        start_date: date = None,
        end_date: date = None
    ) -> int:
        """
        Fill missing rates by interpolation or fetching.

        Args:
            base_currency: Base currency
            start_date: Start date
            end_date: End date

        Returns:
            int: Number of rates filled
        """
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()

        filled = 0
        current = start_date

        while current <= end_date:
            # Check if rates exist for this date
            existing = self.db.query(ExchangeRate).filter(
                ExchangeRate.base_currency == base_currency,
                ExchangeRate.rate_date == current
            ).count()

            if existing == 0:
                # Fetch rates for this date
                result = self.fetch_and_update_rates(base_currency, current)
                filled += result['updated']

            current += timedelta(days=1)

        return filled
