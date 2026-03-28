# app/services/transaction_classifier.py
"""
Rule-based transaction classifier for FinancePro v2.1.

Assigns category, merchant, and transaction_type to imported transactions
using keyword matching and fuzzy string comparison. Designed to be
replaceable by an ML model later.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from decimal import Decimal
from functools import lru_cache
from typing import Dict, List, Optional, Tuple

# Pre-compiled regex cache for word boundary matching
@lru_cache(maxsize=512)
def _compile_word_pattern(needle: str) -> re.Pattern:
    return re.compile(r"(?<!\w)" + re.escape(needle) + r"(?!\w)", re.IGNORECASE)


def _word_match(needle: str, haystack: str) -> bool:
    """Check if needle appears in haystack as a whole word (or at word boundary)."""
    # For very short patterns (<=3 chars), require word boundaries
    if len(needle) <= 3:
        return bool(_compile_word_pattern(needle).search(haystack))
    return needle.lower() in haystack

from sqlalchemy.orm import Session

from app.models import Category, Merchant

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Classification result
# ---------------------------------------------------------------------------
@dataclass
class ClassificationResult:
    category_name: str
    merchant_name: Optional[str]
    confidence_score: float  # 0.0 – 1.0
    match_method: str  # "merchant_exact", "merchant_fuzzy", "keyword", "none"
    suggested_transaction_type: str


# ---------------------------------------------------------------------------
# Keyword dictionaries
# ---------------------------------------------------------------------------
CATEGORY_KEYWORDS: Dict[str, Dict[str, List[str]]] = {
    "Groceries": {
        "keywords": ["supermercato", "supermarket", "alimentari", "spesa", "market"],
        "merchants": [
            "esselunga", "conad", "coop", "lidl", "eurospin", "carrefour",
            "pam", "despar", "md discount", "aldi", "penny", "md spa",
        ],
    },
    "Restaurants": {
        "keywords": [
            "ristorante", "pizzeria", "trattoria", "bar ", "caffè", "cafe",
            "mcdonald", "burger", "sushi", "pub", "osteria",
        ],
        "merchants": ["deliveroo", "just eat", "glovo", "uber eats"],
    },
    "Transportation": {
        "keywords": [
            "benzina", "carburante", "autostrada", "pedaggio", "parcheggio",
            "parking", "taxi", "fuel", "station",
        ],
        "merchants": [
            "eni", "q8", "ip", "tamoil", "total", "shell", "telepass",
            "trenitalia", "italo", "atm milano", "atac",
        ],
    },
    "Utilities": {
        "keywords": [
            "bolletta", "utenza", "fornitura", "energia", "luce", "gas",
            "acqua", "telefono", "internet", "fibra",
        ],
        "merchants": [
            "enel", "eni gas", "a2a", "iren", "hera", "tim", "vodafone",
            "wind", "fastweb", "iliad", "sky",
        ],
    },
    "Healthcare": {
        "keywords": [
            "farmacia", "medico", "ospedale", "clinica", "dentista",
            "oculista", "fisioterapia", "analisi", "esame", "visita medica",
        ],
        "merchants": [],
    },
    "Insurance": {
        "keywords": ["assicurazione", "polizza", "premio", "insurance"],
        "merchants": ["generali", "allianz", "unipol", "axa", "zurich"],
    },
    "Subscriptions": {
        "keywords": ["abbonamento", "subscription", "mensile", "rinnovo"],
        "merchants": [
            "netflix", "spotify", "amazon prime", "disney+", "apple",
            "google", "microsoft", "adobe",
        ],
    },
    "Shopping": {
        "keywords": ["acquisto", "shopping", "negozio", "store"],
        "merchants": ["amazon", "ebay", "zalando", "zara", "h&m", "ikea", "mediaworld"],
    },
    "Entertainment": {
        "keywords": [
            "cinema", "teatro", "concerto", "museo", "biglietto",
            "intrattenimento", "evento", "stadio",
        ],
        "merchants": ["ticketone", "ticketmaster"],
    },
    "Education": {
        "keywords": [
            "università", "scuola", "corso", "formazione", "tasse universitarie",
            "libri", "iscrizione",
        ],
        "merchants": [],
    },
    "Travel": {
        "keywords": [
            "volo", "hotel", "albergo", "viaggio", "aereo",
            "prenotazione", "booking",
        ],
        "merchants": ["booking.com", "airbnb", "ryanair", "easyjet", "alitalia", "expedia"],
    },
    "Gifts": {
        "keywords": ["regalo", "gift", "donazione"],
        "merchants": [],
    },
    "Personal Care": {
        "keywords": ["parrucchiere", "barbiere", "estetista", "spa", "profumeria"],
        "merchants": [],
    },
    "Pets": {
        "keywords": ["veterinario", "pet", "animali"],
        "merchants": ["arcaplanet"],
    },
    "Home Improvement": {
        "keywords": [
            "ferramenta", "bricolage", "idraulico", "elettricista",
            "ristrutturazione", "mobili",
        ],
        "merchants": ["leroy merlin", "brico"],
    },
    "Salary": {
        "keywords": [
            "stipendio", "salary", "retribuzione", "compenso", "cedolino",
            "busta paga", "emolumento",
        ],
        "merchants": [],
    },
    "Freelance Income": {
        "keywords": ["fattura", "parcella", "onorario", "prestazione"],
        "merchants": [],
    },
    "Investment Income": {
        "keywords": ["dividendo", "cedola", "rendimento", "interessi attivi"],
        "merchants": [],
    },
    "Other Income": {
        "keywords": ["rimborso", "accredito", "refund", "cashback"],
        "merchants": [],
    },
    "Bank Fees": {
        "keywords": [
            "commissione", "canone", "spese conto", "imposta bollo",
            "fee", "spese bancarie", "costo servizio",
        ],
        "merchants": [],
    },
    "Rent": {
        "keywords": ["affitto", "canone locazione", "rent", "pigione"],
        "merchants": [],
    },
    "Taxes": {
        "keywords": [
            "f24", "tasse", "imposta", "iva", "irpef", "imu", "tari",
            "agenzia entrate", "tax",
        ],
        "merchants": [],
    },
}

# Income categories (to know when amount should be positive)
INCOME_CATEGORIES = {"Salary", "Freelance Income", "Investment Income", "Other Income"}


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------
class TransactionClassifier:
    """Classify a transaction description into category + merchant."""

    def __init__(self) -> None:
        self._merchant_cache: Optional[List] = None

    def classify(
        self,
        description: str,
        amount: Decimal,
        db: Optional[Session] = None,
    ) -> ClassificationResult:
        """
        Classify a single transaction.

        Args:
            description: Transaction description text.
            amount: Amount (positive = income, negative = expense).
            db: Optional SQLAlchemy session for DB merchant lookup.
        """
        desc_lower = description.lower()

        # 1. DB merchant matching (if session available or merchants pre-cached)
        if db is not None or self._merchant_cache is not None:
            result = self._match_db_merchant(desc_lower, db)
            if result:
                return result

        # 2. Keyword-based merchant matching
        result = self._match_keywords(desc_lower, amount)
        if result:
            return result

        # 3. Fallback
        tx_type = self._infer_transaction_type(desc_lower, amount)
        return ClassificationResult(
            category_name="Uncategorized",
            merchant_name=None,
            confidence_score=0.0,
            match_method="none",
            suggested_transaction_type=tx_type,
        )

    # ----- DB merchant lookup ------------------------------------------------

    def _match_db_merchant(
        self, desc_lower: str, db: Optional[Session] = None
    ) -> Optional[ClassificationResult]:
        """Check description against the merchants table (cached per instance)."""
        # Cache the merchant list to avoid N round-trips to DB
        if self._merchant_cache is None:
            if db is None:
                return None
            self._merchant_cache = db.query(Merchant).all()
        for merchant in self._merchant_cache:
            name_lower = merchant.canonical_name.lower()
            aliases = merchant.aliases or []
            all_names = [name_lower] + [a.lower() for a in aliases]
            for name in all_names:
                if _word_match(name, desc_lower):
                    # Determine category from keyword dict
                    cat = self._category_for_merchant(name)
                    return ClassificationResult(
                        category_name=cat,
                        merchant_name=merchant.canonical_name,
                        confidence_score=0.90,
                        match_method="merchant_exact",
                        suggested_transaction_type=self._infer_transaction_type(
                            desc_lower, Decimal("0")
                        ),
                    )
        return None

    # ----- keyword matching --------------------------------------------------

    def _match_keywords(
        self, desc_lower: str, amount: Decimal
    ) -> Optional[ClassificationResult]:
        best_score = 0.0
        best_result: Optional[ClassificationResult] = None

        for category, data in CATEGORY_KEYWORDS.items():
            # Merchant list match (high confidence)
            for merchant in data["merchants"]:
                if _word_match(merchant.lower(), desc_lower):
                    score = 0.95
                    if score > best_score:
                        best_score = score
                        best_result = ClassificationResult(
                            category_name=category,
                            merchant_name=merchant.title(),
                            confidence_score=score,
                            match_method="merchant_fuzzy",
                            suggested_transaction_type=self._infer_transaction_type(
                                desc_lower, amount
                            ),
                        )

            # Keyword match (medium confidence)
            for kw in data["keywords"]:
                if _word_match(kw, desc_lower):
                    score = 0.75
                    if score > best_score:
                        best_score = score
                        best_result = ClassificationResult(
                            category_name=category,
                            merchant_name=None,
                            confidence_score=score,
                            match_method="keyword",
                            suggested_transaction_type=self._infer_transaction_type(
                                desc_lower, amount
                            ),
                        )

        return best_result

    # ----- transaction type inference ----------------------------------------

    def _infer_transaction_type(self, desc_lower: str, amount: Decimal) -> str:
        """Infer TransactionType from description + sign."""
        # Salary keywords
        salary_kw = ["stipendio", "salary", "retribuzione", "cedolino", "busta paga"]
        if any(k in desc_lower for k in salary_kw):
            return "salary"

        # ATM withdrawal
        if any(k in desc_lower for k in ["prelievo", "atm", "bancomat", "withdrawal"]):
            return "withdrawal"

        # Bank transfer
        if any(k in desc_lower for k in ["bonifico", "bank transfer", "giroconto"]):
            return "bank_transfer"

        # Fee / tax
        if any(k in desc_lower for k in ["commissione", "canone", "imposta bollo", "spese conto"]):
            return "fee"

        # POS / purchase
        if any(k in desc_lower for k in ["pos", "carta", "pagamento", "acquisto"]):
            return "purchase"

        # SDD / direct debit
        if any(k in desc_lower for k in ["sdd", "addebito diretto", "domiciliazione", "rid"]):
            return "payment"

        # Default by sign
        if amount > 0:
            return "income"
        return "purchase"

    # ----- helpers -----------------------------------------------------------

    def _category_for_merchant(self, merchant_lower: str) -> str:
        """Find the category that lists this merchant."""
        for category, data in CATEGORY_KEYWORDS.items():
            for m in data["merchants"]:
                if m.lower() == merchant_lower or m.lower() in merchant_lower:
                    return category
        return "Uncategorized"
