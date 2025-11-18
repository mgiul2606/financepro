#!/usr/bin/env python3
"""
Script per popolare il database con dati di esempio realistici.

Uso:
    python scripts/seed_database.py

    # Per pulire prima di inserire (raccomandato)
    python scripts/seed_database.py --clean
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, date
from decimal import Decimal
import uuid

# Aggiungi il percorso del backend al path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.db.database import Base

# Import dei modelli
from app.models.user import User
from app.models.financial_profile import FinancialProfile, ProfileType
from app.models.account import Account, AccountType
from app.models.category import Category
from app.models.tag import Tag
from app.models.transaction import Transaction, TransactionType, TransactionSource
from app.models.budget import Budget
from app.models.financial_goal import FinancialGoal
from app.models.asset import Asset, AssetType
from app.models.recurring_transaction import RecurringTransaction, AmountModel, Frequency
from app.core.security import get_password_hash


def clean_database(session):
    """Elimina tutti i dati esistenti (mantiene lo schema)."""
    print("🗑️  Pulizia database in corso...")

    # Elimina in ordine inverso per rispettare le foreign keys
    session.query(RecurringTransaction).delete()
    session.query(Asset).delete()
    session.query(FinancialGoal).delete()
    session.query(Budget).delete()
    session.query(Transaction).delete()
    session.query(Tag).delete()
    session.query(Category).delete()
    session.query(Account).delete()
    session.query(FinancialProfile).delete()
    session.query(User).delete()

    session.commit()
    print("✅ Database pulito")


def create_users(session):
    """Crea utenti di esempio."""
    print("\n👤 Creazione utenti...")

    users = [
        User(
            id=uuid.uuid4(),
            email="mario.rossi@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Mario Rossi",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        User(
            id=uuid.uuid4(),
            email="giulia.bianchi@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Giulia Bianchi",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
    ]

    session.add_all(users)
    session.commit()

    print(f"✅ Creati {len(users)} utenti")
    return users


def create_profiles(session, users):
    """Crea profili finanziari."""
    print("\n💼 Creazione profili finanziari...")

    profiles = []

    # Profilo personale per Mario
    profile_mario = FinancialProfile(
        id=uuid.uuid4(),
        user_id=users[0].id,
        name="Finanze Personali",
        description="Gestione delle mie finanze personali",
        profile_type=ProfileType.PERSONAL,
        default_currency="EUR",
        is_active=True,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    profiles.append(profile_mario)

    # Profilo famiglia per Mario
    profile_famiglia = FinancialProfile(
        id=uuid.uuid4(),
        user_id=users[0].id,
        name="Famiglia Rossi",
        description="Budget e spese familiari",
        profile_type=ProfileType.FAMILY,
        default_currency="EUR",
        is_active=True,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    profiles.append(profile_famiglia)

    # Profilo personale per Giulia
    profile_giulia = FinancialProfile(
        id=uuid.uuid4(),
        user_id=users[1].id,
        name="Le mie finanze",
        description="Gestione personale",
        profile_type=ProfileType.PERSONAL,
        default_currency="EUR",
        is_active=True,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    profiles.append(profile_giulia)

    session.add_all(profiles)
    session.commit()

    # Imposta il profilo principale per gli utenti
    users[0].main_profile_id = profile_mario.id
    users[1].main_profile_id = profile_giulia.id
    session.commit()

    print(f"✅ Creati {len(profiles)} profili finanziari")
    return profiles


def create_categories(session, profiles):
    """Crea categorie predefinite italiane."""
    print("\n📁 Creazione categorie...")

    categories_data = [
        # Categorie per spese
        {"name": "Alimentari", "description": "Spesa, supermercato, cibo", "color": "#FF6B6B", "icon": "🛒"},
        {"name": "Ristoranti", "description": "Ristoranti, bar, fast food", "color": "#FFA07A", "icon": "🍽️"},
        {"name": "Trasporti", "description": "Benzina, mezzi pubblici, taxi", "color": "#4ECDC4", "icon": "🚗"},
        {"name": "Casa", "description": "Affitto, mutuo, bollette, manutenzione", "color": "#95E1D3", "icon": "🏠"},
        {"name": "Salute", "description": "Farmacia, visite mediche, palestra", "color": "#FFB6C1", "icon": "💊"},
        {"name": "Intrattenimento", "description": "Cinema, concerti, hobby", "color": "#DDA0DD", "icon": "🎬"},
        {"name": "Shopping", "description": "Abbigliamento, accessori", "color": "#FFD700", "icon": "👕"},
        {"name": "Istruzione", "description": "Libri, corsi, scuola", "color": "#87CEEB", "icon": "📚"},
        {"name": "Viaggi", "description": "Vacanze, hotel, voli", "color": "#98D8C8", "icon": "✈️"},
        {"name": "Tecnologia", "description": "Elettronica, software, abbonamenti", "color": "#B19CD9", "icon": "💻"},

        # Categorie per entrate
        {"name": "Stipendio", "description": "Stipendio mensile", "color": "#90EE90", "icon": "💰"},
        {"name": "Freelance", "description": "Lavoro autonomo, consulenze", "color": "#98FB98", "icon": "💼"},
        {"name": "Investimenti", "description": "Dividendi, interessi", "color": "#3CB371", "icon": "📈"},
        {"name": "Altro", "description": "Altre entrate", "color": "#2E8B57", "icon": "💵"},
    ]

    categories = []

    # Crea categorie per ogni profilo
    for profile in profiles[:2]:  # Solo per i primi 2 profili
        for cat_data in categories_data:
            category = Category(
                id=uuid.uuid4(),
                financial_profile_id=profile.id,
                name=cat_data["name"],
                description=cat_data["description"],
                color=cat_data["color"],
                icon=cat_data["icon"],
                is_active=True,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            categories.append(category)

    session.add_all(categories)
    session.commit()

    print(f"✅ Create {len(categories)} categorie")
    return categories


def create_tags(session, profiles):
    """Crea tag di esempio."""
    print("\n🏷️  Creazione tag...")

    tags_data = [
        {"name": "Urgente", "color": "#FF0000"},
        {"name": "Ricorrente", "color": "#0000FF"},
        {"name": "Deducibile", "color": "#00FF00"},
        {"name": "Lavoro", "color": "#FFA500"},
        {"name": "Personale", "color": "#800080"},
    ]

    tags = []

    for profile in profiles[:2]:
        for tag_data in tags_data:
            tag = Tag(
                id=uuid.uuid4(),
                financial_profile_id=profile.id,
                name=tag_data["name"],
                color=tag_data["color"],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            tags.append(tag)

    session.add_all(tags)
    session.commit()

    print(f"✅ Creati {len(tags)} tag")
    return tags


def create_accounts(session, profiles):
    """Crea conti bancari di esempio."""
    print("\n🏦 Creazione conti...")

    accounts = [
        # Conti per Mario (profilo personale)
        Account(
            id=uuid.uuid4(),
            financial_profile_id=profiles[0].id,
            name="Conto Corrente Intesa",
            account_type=AccountType.CHECKING,
            currency="EUR",
            initial_balance=Decimal("5000.00"),
            institution_name="Intesa Sanpaolo",
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        Account(
            id=uuid.uuid4(),
            financial_profile_id=profiles[0].id,
            name="Conto Risparmio",
            account_type=AccountType.SAVINGS,
            currency="EUR",
            initial_balance=Decimal("15000.00"),
            institution_name="Intesa Sanpaolo",
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        Account(
            id=uuid.uuid4(),
            financial_profile_id=profiles[0].id,
            name="Carta di Credito",
            account_type=AccountType.CREDIT_CARD,
            currency="EUR",
            initial_balance=Decimal("0.00"),
            institution_name="American Express",
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),

        # Conti per famiglia
        Account(
            id=uuid.uuid4(),
            financial_profile_id=profiles[1].id,
            name="Conto Famiglia",
            account_type=AccountType.CHECKING,
            currency="EUR",
            initial_balance=Decimal("8000.00"),
            institution_name="UniCredit",
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
    ]

    session.add_all(accounts)
    session.commit()

    print(f"✅ Creati {len(accounts)} conti")
    return accounts


def create_transactions(session, accounts, categories):
    """Crea transazioni di esempio."""
    print("\n💸 Creazione transazioni...")

    transactions = []

    # Filtra categorie per profilo
    profile_id = accounts[0].financial_profile_id
    profile_categories = [c for c in categories if c.financial_profile_id == profile_id]

    # Categorie specifiche
    cat_alimentari = next((c for c in profile_categories if c.name == "Alimentari"), None)
    cat_ristoranti = next((c for c in profile_categories if c.name == "Ristoranti"), None)
    cat_trasporti = next((c for c in profile_categories if c.name == "Trasporti"), None)
    cat_casa = next((c for c in profile_categories if c.name == "Casa"), None)
    cat_stipendio = next((c for c in profile_categories if c.name == "Stipendio"), None)
    cat_shopping = next((c for c in profile_categories if c.name == "Shopping"), None)

    # Transazioni per il mese corrente
    today = date.today()

    transactions_data = [
        # Entrate
        {
            "account": accounts[0],
            "category": cat_stipendio,
            "type": TransactionType.INCOME,
            "amount": Decimal("2500.00"),
            "date": today.replace(day=1),
            "description": "Stipendio Gennaio 2025",
            "payee": "Azienda XYZ Srl"
        },

        # Spese alimentari
        {
            "account": accounts[0],
            "category": cat_alimentari,
            "type": TransactionType.PURCHASE,
            "amount": Decimal("85.50"),
            "date": today - timedelta(days=2),
            "description": "Spesa settimanale",
            "payee": "Esselunga"
        },
        {
            "account": accounts[0],
            "category": cat_alimentari,
            "type": TransactionType.PURCHASE,
            "amount": Decimal("45.20"),
            "date": today - timedelta(days=5),
            "description": "Spesa frutta e verdura",
            "payee": "Mercato locale"
        },

        # Ristoranti
        {
            "account": accounts[2],  # Carta di credito
            "category": cat_ristoranti,
            "type": TransactionType.PURCHASE,
            "amount": Decimal("65.00"),
            "date": today - timedelta(days=3),
            "description": "Cena con amici",
            "payee": "Ristorante La Pergola"
        },
        {
            "account": accounts[0],
            "category": cat_ristoranti,
            "type": TransactionType.PURCHASE,
            "amount": Decimal("8.50"),
            "date": today - timedelta(days=1),
            "description": "Caffè e brioche",
            "payee": "Bar Centrale"
        },

        # Trasporti
        {
            "account": accounts[0],
            "category": cat_trasporti,
            "type": TransactionType.PURCHASE,
            "amount": Decimal("60.00"),
            "date": today - timedelta(days=7),
            "description": "Rifornimento benzina",
            "payee": "Eni"
        },

        # Casa
        {
            "account": accounts[0],
            "category": cat_casa,
            "type": TransactionType.PURCHASE,
            "amount": Decimal("850.00"),
            "date": today.replace(day=5),
            "description": "Affitto mensile",
            "payee": "Immobiliare Roma"
        },
        {
            "account": accounts[0],
            "category": cat_casa,
            "type": TransactionType.PURCHASE,
            "amount": Decimal("120.00"),
            "date": today - timedelta(days=10),
            "description": "Bolletta elettricità",
            "payee": "Enel Energia"
        },

        # Shopping
        {
            "account": accounts[2],
            "category": cat_shopping,
            "type": TransactionType.PURCHASE,
            "amount": Decimal("89.99"),
            "date": today - timedelta(days=6),
            "description": "Scarpe sportive",
            "payee": "Decathlon"
        },
    ]

    for trans_data in transactions_data:
        transaction = Transaction(
            id=uuid.uuid4(),
            account_id=trans_data["account"].id,
            category_id=trans_data["category"].id if trans_data["category"] else None,
            transaction_type=trans_data["type"],
            amount=trans_data["amount"],
            currency="EUR",
            transaction_date=trans_data["date"],
            description=trans_data["description"],
            merchant_name=trans_data["payee"],
            is_reconciled=True,
            created_by=TransactionSource.MANUAL,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        transactions.append(transaction)

    session.add_all(transactions)
    session.commit()

    print(f"✅ Create {len(transactions)} transazioni")
    return transactions


def create_budgets(session, profiles, categories):
    """Crea budget di esempio."""
    print("\n📊 Creazione budget...")

    budgets = []

    # Budget per il profilo personale
    profile_id = profiles[0].id
    profile_categories = [c for c in categories if c.financial_profile_id == profile_id]

    cat_alimentari = next((c for c in profile_categories if c.name == "Alimentari"), None)
    cat_ristoranti = next((c for c in profile_categories if c.name == "Ristoranti"), None)
    cat_trasporti = next((c for c in profile_categories if c.name == "Trasporti"), None)

    today = date.today()
    first_day = today.replace(day=1)
    last_day = (first_day + timedelta(days=32)).replace(day=1) - timedelta(days=1)

    budgets_data = [
        {
            "profile_id": profile_id,
            "category": cat_alimentari,
            "name": "Budget Alimentari Mensile",
            "amount": Decimal("400.00"),
            "alert_threshold": Decimal("0.80")  # 80%
        },
        {
            "profile_id": profile_id,
            "category": cat_ristoranti,
            "name": "Budget Ristoranti Mensile",
            "amount": Decimal("200.00"),
            "alert_threshold": Decimal("0.90")
        },
        {
            "profile_id": profile_id,
            "category": cat_trasporti,
            "name": "Budget Trasporti Mensile",
            "amount": Decimal("250.00"),
            "alert_threshold": Decimal("0.85")
        },
    ]

    for budget_data in budgets_data:
        budget = Budget(
            id=uuid.uuid4(),
            financial_profile_id=budget_data["profile_id"],
            category_id=budget_data["category"].id if budget_data["category"] else None,
            name=budget_data["name"],
            amount=budget_data["amount"],
            currency="EUR",
            period_start=first_day,
            period_end=last_day,
            is_recurring=True,
            alert_threshold=budget_data["alert_threshold"],
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        budgets.append(budget)

    session.add_all(budgets)
    session.commit()

    print(f"✅ Creati {len(budgets)} budget")
    return budgets


def create_goals(session, profiles):
    """Crea obiettivi finanziari."""
    print("\n🎯 Creazione obiettivi finanziari...")

    goals = [
        FinancialGoal(
            id=uuid.uuid4(),
            financial_profile_id=profiles[0].id,
            name="Fondo Emergenza",
            description="Risparmiare 6 mesi di spese",
            target_amount=Decimal("10000.00"),
            current_amount=Decimal("3500.00"),
            currency="EUR",
            target_date=date.today() + timedelta(days=365),
            is_achieved=False,
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        FinancialGoal(
            id=uuid.uuid4(),
            financial_profile_id=profiles[0].id,
            name="Vacanza Estate 2025",
            description="Viaggio in Grecia",
            target_amount=Decimal("3000.00"),
            current_amount=Decimal("800.00"),
            currency="EUR",
            target_date=date(2025, 7, 1),
            is_achieved=False,
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        FinancialGoal(
            id=uuid.uuid4(),
            financial_profile_id=profiles[0].id,
            name="Nuovo Laptop",
            description="MacBook Pro per lavoro",
            target_amount=Decimal("2500.00"),
            current_amount=Decimal("1200.00"),
            currency="EUR",
            target_date=date.today() + timedelta(days=90),
            is_achieved=False,
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
    ]

    session.add_all(goals)
    session.commit()

    print(f"✅ Creati {len(goals)} obiettivi finanziari")
    return goals


def create_assets(session, profiles):
    """Crea asset/beni di esempio."""
    print("\n🏠 Creazione asset...")

    assets = [
        Asset(
            id=uuid.uuid4(),
            financial_profile_id=profiles[0].id,
            name="Automobile Fiat 500",
            asset_type=AssetType.VEHICLE,
            description="Fiat 500 2020, 50.000 km",
            purchase_value=Decimal("15000.00"),
            current_value=Decimal("12000.00"),
            currency="EUR",
            purchase_date=date(2020, 6, 15),
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        Asset(
            id=uuid.uuid4(),
            financial_profile_id=profiles[0].id,
            name="MacBook Pro 2022",
            asset_type=AssetType.OTHER,
            description="MacBook Pro 14'' M1 Pro",
            purchase_value=Decimal("2800.00"),
            current_value=Decimal("2000.00"),
            currency="EUR",
            purchase_date=date(2022, 3, 10),
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
    ]

    session.add_all(assets)
    session.commit()

    print(f"✅ Creati {len(assets)} asset")
    return assets


def create_recurring_transactions(session, accounts, categories):
    """Crea transazioni ricorrenti."""
    print("\n🔄 Creazione transazioni ricorrenti...")

    profile_id = accounts[0].financial_profile_id
    profile_categories = [c for c in categories if c.financial_profile_id == profile_id]

    cat_casa = next((c for c in profile_categories if c.name == "Casa"), None)
    cat_stipendio = next((c for c in profile_categories if c.name == "Stipendio"), None)

    today = date.today()

    recurring = [
        RecurringTransaction(
            id=uuid.uuid4(),
            account_id=accounts[0].id,
            category_id=cat_stipendio.id if cat_stipendio else None,
            name="Stipendio mensile",
            description="Stipendio da Azienda XYZ Srl",
            amount_model=AmountModel.FIXED,
            base_amount=Decimal("2500.00"),
            frequency=Frequency.MONTHLY,
            start_date=date(2024, 1, 1),
            next_occurrence_date=date(today.year, today.month, 1),
            is_active=True,
            notification_enabled=True,
            notification_days_before=3,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        RecurringTransaction(
            id=uuid.uuid4(),
            account_id=accounts[0].id,
            category_id=cat_casa.id if cat_casa else None,
            name="Affitto mensile",
            description="Pagamento affitto a Immobiliare Roma",
            amount_model=AmountModel.FIXED,
            base_amount=Decimal("850.00"),
            frequency=Frequency.MONTHLY,
            start_date=date(2024, 1, 5),
            next_occurrence_date=date(today.year, today.month, 5),
            is_active=True,
            notification_enabled=True,
            notification_days_before=3,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
    ]

    session.add_all(recurring)
    session.commit()

    print(f"✅ Create {len(recurring)} transazioni ricorrenti")
    return recurring


def seed_database(clean_first=False):
    """Popola il database con dati di esempio."""

    print("=" * 80)
    print("🌱 SEED DATABASE - FinancePro")
    print("=" * 80)

    # Connessione al database
    print(f"\n📡 Connessione al database...")
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Pulizia se richiesto
        if clean_first:
            clean_database(session)

        # Creazione dati
        users = create_users(session)
        profiles = create_profiles(session, users)
        categories = create_categories(session, profiles)
        tags = create_tags(session, profiles)
        accounts = create_accounts(session, profiles)
        transactions = create_transactions(session, accounts, categories)
        budgets = create_budgets(session, profiles, categories)
        goals = create_goals(session, profiles)
        assets = create_assets(session, profiles)
        recurring = create_recurring_transactions(session, accounts, categories)

        print("\n" + "=" * 80)
        print("✅ DATABASE POPOLATO CON SUCCESSO!")
        print("=" * 80)
        print("\n📊 Riepilogo:")
        print(f"   • Utenti: {len(users)}")
        print(f"   • Profili finanziari: {len(profiles)}")
        print(f"   • Categorie: {len(categories)}")
        print(f"   • Tag: {len(tags)}")
        print(f"   • Conti: {len(accounts)}")
        print(f"   • Transazioni: {len(transactions)}")
        print(f"   • Budget: {len(budgets)}")
        print(f"   • Obiettivi: {len(goals)}")
        print(f"   • Asset: {len(assets)}")
        print(f"   • Transazioni ricorrenti: {len(recurring)}")

        print("\n🔐 Credenziali di accesso:")
        print("   Email: mario.rossi@example.com")
        print("   Password: password123")
        print()
        print("   Email: giulia.bianchi@example.com")
        print("   Password: password123")

        return True

    except Exception as e:
        print(f"\n❌ Errore durante il seeding del database:")
        print(f"   {e}")
        session.rollback()
        return False

    finally:
        session.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Popola il database con dati di esempio")
    parser.add_argument("--clean", action="store_true", help="Pulisce i dati esistenti prima di inserire")
    args = parser.parse_args()

    success = seed_database(clean_first=args.clean)
    sys.exit(0 if success else 1)
