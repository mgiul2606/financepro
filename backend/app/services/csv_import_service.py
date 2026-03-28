# app/services/csv_import_service.py
"""
Smart CSV Import Service for FinancePro v2.1.

Auto-detects CSV format (encoding, separator, header row, column mapping)
from Italian and international bank statements without requiring the user
to specify a bank or format.
"""
from __future__ import annotations

import csv
import io
import logging
import re
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any, Dict, List, Optional, Tuple

import chardet

logger = logging.getLogger(__name__)

_TWO_PLACES = Decimal("0.01")


def _round_money(value: Decimal) -> Decimal:
    return Decimal(str(value)).quantize(_TWO_PLACES, rounding=ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# Column pattern dictionaries (case-insensitive)
# ---------------------------------------------------------------------------
COLUMN_PATTERNS: Dict[str, List[str]] = {
    "date": [
        "data", "data operazione", "data contabile", "data valuta", "date",
        "data movimento", "data registrazione", "booking date", "value date",
        "data_operazione", "data_contabile",
    ],
    "description": [
        "descrizione", "causale", "description", "dettagli", "movimento",
        "descrizione operazione", "causale/descrizione", "details",
        "descrizione_operazione", "oggetto", "esercente",
    ],
    "amount": [
        "importo", "amount", "ammontare", "valore", "importo eur",
        "importo in euro", "importo_eur", "importo eur",
    ],
    "debit": [
        "avere", "addebito", "uscite", "debit", "addebiti", "spese",
    ],
    "credit": [
        "dare", "accredito", "entrate", "credit", "accrediti", "incassi",
    ],
    "balance": [
        "saldo", "balance", "saldo contabile", "saldo disponibile",
    ],
    "currency": [
        "divisa", "valuta", "currency", "moneta",
    ],
    "category_hint": [
        "categoria", "category", "tipo operazione", "tipo movimento", "tipo",
    ],
    "city": [
        "città", "city", "località",
    ],
}

# Date formats to try, ordered by likelihood for Italian bank statements
DATE_FORMATS = [
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%d.%m.%Y",
    "%Y-%m-%d",
    "%m/%d/%Y",
    "%Y/%m/%d",
]


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------
@dataclass
class ParsedTransaction:
    date: date
    description: str
    amount: Decimal  # positive = income, negative = expense
    original_description: str
    balance: Optional[Decimal] = None
    currency: str = "EUR"
    row_number: int = 0
    raw_data: Dict[str, str] = field(default_factory=dict)


@dataclass
class CSVParseResult:
    transactions: List[ParsedTransaction]
    detected_format: Dict[str, Any]
    warnings: List[str]
    total_rows: int
    parsed_rows: int
    skipped_rows: int


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------
class CSVImportService:
    """Stateless service for smart CSV parsing."""

    # ----- public API -------------------------------------------------------

    def parse(self, raw_bytes: bytes) -> CSVParseResult:
        """
        Parse a raw CSV file (bytes) into structured transactions.
        Auto-detects encoding, separator, header row, and column mapping.
        """
        # 1. Detect encoding
        encoding = self._detect_encoding(raw_bytes)

        # 2. Decode
        text = raw_bytes.decode(encoding, errors="replace")

        # 3. Detect separator
        separator = self._detect_separator(text)

        # 4. Detect header row (skip metadata rows)
        header_row_idx, headers = self._detect_header_row(text, separator)

        # 5. Map columns
        column_mapping = self._map_columns(headers)

        # 6. Detect date format from sample rows
        date_format = self._detect_date_format(text, separator, header_row_idx, column_mapping)

        detected_format = {
            "encoding": encoding,
            "separator": separator,
            "date_format": date_format,
            "column_mapping": column_mapping,
            "header_row": header_row_idx,
        }

        # 7. Parse all rows
        transactions: List[ParsedTransaction] = []
        warnings: List[str] = []
        total_rows = 0
        skipped = 0

        lines = text.splitlines()
        data_lines = lines[header_row_idx + 1:]

        reader = csv.DictReader(
            data_lines,
            fieldnames=headers,
            delimiter=separator,
        )

        for i, row in enumerate(reader):
            row_num = header_row_idx + 2 + i  # 1-based, accounting for header
            total_rows += 1
            try:
                tx = self._parse_row(row, column_mapping, date_format, row_num)
                if tx is not None:
                    transactions.append(tx)
                else:
                    skipped += 1
            except Exception as exc:
                skipped += 1
                warnings.append(f"Riga {row_num}: {exc}")

        return CSVParseResult(
            transactions=transactions,
            detected_format=detected_format,
            warnings=warnings,
            total_rows=total_rows,
            parsed_rows=len(transactions),
            skipped_rows=skipped,
        )

    # ----- encoding detection ------------------------------------------------

    def _detect_encoding(self, raw_bytes: bytes) -> str:
        # Check BOM first
        if raw_bytes[:3] == b"\xef\xbb\xbf":
            return "utf-8-sig"
        if raw_bytes[:2] in (b"\xff\xfe", b"\xfe\xff"):
            return "utf-16"

        result = chardet.detect(raw_bytes[:8192])
        encoding = (result.get("encoding") or "utf-8").lower()

        # Normalize common Italian encodings
        encoding_map = {
            "iso-8859-1": "latin-1",
            "iso-8859-15": "latin-1",
            "windows-1252": "cp1252",
            "ascii": "utf-8",
        }
        return encoding_map.get(encoding, encoding)

    # ----- separator detection -----------------------------------------------

    def _detect_separator(self, text: str) -> str:
        # Use first 20 non-empty lines
        lines = [ln for ln in text.splitlines() if ln.strip()][:20]
        candidates = {";": 0, ",": 0, "\t": 0, "|": 0}
        for line in lines:
            for sep, _ in candidates.items():
                candidates[sep] += line.count(sep)

        # Semicolon wins ties (most common in Italian CSVs)
        best = max(candidates, key=lambda s: (candidates[s], s == ";"))
        if candidates[best] == 0:
            return ","
        return best

    # ----- header detection --------------------------------------------------

    def _detect_header_row(self, text: str, separator: str) -> Tuple[int, List[str]]:
        """Find the header row by scoring each of the first 15 lines."""
        lines = text.splitlines()
        best_score = -1
        best_idx = 0
        best_headers: List[str] = []

        all_patterns = []
        for patterns in COLUMN_PATTERNS.values():
            all_patterns.extend(patterns)

        for idx, line in enumerate(lines[:15]):
            if not line.strip():
                continue
            fields = [f.strip().strip('"').strip("'") for f in line.split(separator)]
            if len(fields) < 2:
                continue

            score = 0
            for fld in fields:
                fld_lower = fld.lower()
                for pat in all_patterns:
                    if pat in fld_lower or fld_lower in pat:
                        score += 1
                        break

            if score > best_score:
                best_score = score
                best_idx = idx
                best_headers = fields

        return best_idx, best_headers

    # ----- column mapping ----------------------------------------------------

    def _map_columns(self, headers: List[str]) -> Dict[str, str]:
        """Map logical field names to actual CSV column names."""
        mapping: Dict[str, str] = {}
        headers_lower = {h.lower().strip(): h for h in headers}

        for field_name, patterns in COLUMN_PATTERNS.items():
            for pat in patterns:
                for h_lower, h_orig in headers_lower.items():
                    if pat == h_lower or pat in h_lower:
                        if field_name not in mapping:
                            mapping[field_name] = h_orig
                        break
                if field_name in mapping:
                    break

        return mapping

    # ----- date format detection ---------------------------------------------

    def _detect_date_format(
        self, text: str, separator: str, header_row_idx: int, column_mapping: Dict[str, str]
    ) -> str:
        """Try to detect the date format from sample data rows."""
        date_col = column_mapping.get("date")
        if not date_col:
            return "%d/%m/%Y"

        lines = text.splitlines()
        data_lines = lines[header_row_idx + 1: header_row_idx + 11]

        # Get the index of the date column from the header
        header_fields = [f.strip().strip('"') for f in lines[header_row_idx].split(separator)]
        try:
            date_col_idx = next(
                i for i, h in enumerate(header_fields)
                if h.strip().strip('"').strip("'") == date_col
            )
        except StopIteration:
            return "%d/%m/%Y"

        for line in data_lines:
            if not line.strip():
                continue
            fields = [f.strip().strip('"') for f in line.split(separator)]
            if date_col_idx >= len(fields):
                continue
            date_str = fields[date_col_idx].strip()
            if not date_str:
                continue

            for fmt in DATE_FORMATS:
                try:
                    parsed = datetime.strptime(date_str, fmt)
                    # Heuristic: if using %m/%d/%Y and first part > 12, it's really dd/mm
                    if fmt == "%m/%d/%Y":
                        parts = re.split(r"[/\-.]", date_str)
                        if parts and int(parts[0]) > 12:
                            continue
                    return fmt
                except ValueError:
                    continue

        return "%d/%m/%Y"

    # ----- row parsing -------------------------------------------------------

    def _parse_row(
        self,
        row: Dict[str, str],
        mapping: Dict[str, str],
        date_format: str,
        row_number: int,
    ) -> Optional[ParsedTransaction]:
        """Parse a single CSV row into a ParsedTransaction."""

        # -- date --
        date_col = mapping.get("date")
        if not date_col or not row.get(date_col, "").strip():
            return None
        tx_date = datetime.strptime(row[date_col].strip().strip('"'), date_format).date()

        # -- description --
        desc_col = mapping.get("description")
        city_col = mapping.get("city")
        description = (row.get(desc_col, "") if desc_col else "").strip().strip('"')
        if city_col and row.get(city_col, "").strip():
            city_val = row[city_col].strip().strip('"')
            description = f"{description} {city_val}"
        original_description = description

        # -- amount --
        amount = self._resolve_amount(row, mapping)
        if amount is None:
            raise ValueError("Impossibile determinare l'importo")

        # -- balance --
        balance: Optional[Decimal] = None
        bal_col = mapping.get("balance")
        if bal_col and row.get(bal_col, "").strip():
            try:
                balance = self._parse_amount_str(row[bal_col].strip().strip('"'))
            except Exception:
                pass

        # -- currency --
        currency = "EUR"
        cur_col = mapping.get("currency")
        if cur_col and row.get(cur_col, "").strip():
            currency = row[cur_col].strip().strip('"').upper()

        raw_data = {k: (v or "") for k, v in row.items() if k}

        return ParsedTransaction(
            date=tx_date,
            description=description,
            amount=_round_money(amount),
            original_description=original_description,
            balance=balance,
            currency=currency,
            row_number=row_number,
            raw_data=raw_data,
        )

    # ----- amount helpers ----------------------------------------------------

    def _resolve_amount(self, row: Dict[str, str], mapping: Dict[str, str]) -> Optional[Decimal]:
        """Determine the transaction amount from the row.

        Handles:
        - Single amount column (with sign)
        - Separate debit/credit columns (Intesa Sanpaolo style)
        """
        amount_col = mapping.get("amount")
        debit_col = mapping.get("debit")
        credit_col = mapping.get("credit")

        # Separate debit/credit columns
        if debit_col or credit_col:
            debit_str = (row.get(debit_col, "") if debit_col else "").strip().strip('"')
            credit_str = (row.get(credit_col, "") if credit_col else "").strip().strip('"')

            if credit_str:
                return self._parse_amount_str(credit_str).copy_abs()
            if debit_str:
                return -self._parse_amount_str(debit_str).copy_abs()

            # Both empty — try the amount column as fallback
            if amount_col and row.get(amount_col, "").strip():
                return self._parse_amount_str(row[amount_col].strip().strip('"'))
            return None

        # Single amount column
        if amount_col and row.get(amount_col, "").strip():
            return self._parse_amount_str(row[amount_col].strip().strip('"'))

        return None

    def _parse_amount_str(self, raw: str) -> Decimal:
        """Parse an amount string handling Italian & international formats."""
        cleaned = raw.replace("€", "").replace("$", "").replace("£", "").replace("\xa0", "").strip()

        # Handle trailing minus: "45,30-"
        trailing_minus = cleaned.endswith("-")
        if trailing_minus:
            cleaned = cleaned[:-1].strip()

        # Handle leading +
        if cleaned.startswith("+"):
            cleaned = cleaned[1:]

        # Determine format
        if "," in cleaned and "." in cleaned:
            if cleaned.rfind(",") > cleaned.rfind("."):
                # European: 1.234,56
                cleaned = cleaned.replace(".", "").replace(",", ".")
            else:
                # US: 1,234.56
                cleaned = cleaned.replace(",", "")
        elif "," in cleaned:
            parts = cleaned.split(",")
            if len(parts) == 2 and len(parts[1]) <= 2:
                # European decimal: 123,45
                cleaned = cleaned.replace(",", ".")
            else:
                # US thousands: 1,234
                cleaned = cleaned.replace(",", "")

        try:
            result = Decimal(cleaned)
        except InvalidOperation:
            raise ValueError(f"Importo non valido: {raw}")

        if trailing_minus:
            result = -result.copy_abs()

        return result
