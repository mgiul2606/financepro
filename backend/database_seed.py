"""
FinancePro v2.1 - Database Seeding Script

This script seeds the FinancePro database with realistic test data for development and testing.

Features:
- Creates test users with different profile configurations
- Seeds system categories, merchants, and exchange rates
- Generates realistic transactions with ML classification logs
- Creates budgets, goals, and AI recommendations
- Adds recurring transactions and predictions
- Populates assets and documents
- Generates audit logs and notifications

Usage:
    python database_seed.py [--env <environment>] [--clean]
    
    --env: Environment (dev, staging, prod) - default: dev
    --clean: Drop and recreate database before seeding

Requirements:
    pip install psycopg2-binary faker python-dateutil cryptography
"""

import argparse
import os
import random
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any

import psycopg2
import psycopg2.extras
#from psycopg2.extras import execute_values
from faker import Faker
from dateutil.relativedelta import relativedelta

from sqlalchemy.engine import make_url
from app.config import settings

# Initialize Faker for realistic data
fake = Faker(['it_IT', 'en_US'])

# Database connection configuration
db_url = make_url(settings.database.url)
DB_CONFIG = {
    'dev': {
        'host': db_url.host,
        'port': db_url.port,
        'database': db_url.database,
        'user': db_url.username,
        'password': db_url.password
    },
    'staging': {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', 5432),
        'database': os.getenv('DB_NAME', 'financepro_staging'),
        'user': os.getenv('DB_USER', 'financepro'),
        'password': os.getenv('DB_PASSWORD', 'staging_password')
    }
}

# System categories (predefined, cannot be deleted)
SYSTEM_CATEGORIES = [
    # Income categories
    ('Salary', 'Monthly salary income', 'salary', '#4CAF50', True, True),
    ('Freelance Income', 'Freelance and consulting income', 'briefcase', '#66BB6A', True, True),
    ('Investments', 'Investment returns, dividends', 'trending-up', '#81C784', True, True),
    ('Other Income', 'Other sources of income', 'dollar-sign', '#A5D6A7', True, True),
    
    # Expense categories
    ('Groceries', 'Supermarket and food shopping', 'shopping-cart', '#FF9800', False, True),
    ('Restaurants', 'Dining out and food delivery', 'utensils', '#FFB74D', False, True),
    ('Transportation', 'Public transport, fuel, parking', 'car', '#F44336', False, True),
    ('Utilities', 'Electricity, gas, water, internet', 'zap', '#EF5350', False, True),
    ('Rent', 'Monthly rent or mortgage', 'home', '#E57373', False, True),
    ('Healthcare', 'Medical expenses, pharmacy', 'heart', '#EC407A', False, True),
    ('Entertainment', 'Movies, concerts, hobbies', 'film', '#AB47BC', False, True),
    ('Shopping', 'Clothing, electronics, misc shopping', 'shopping-bag', '#7E57C2', False, True),
    ('Education', 'Courses, books, training', 'book', '#5C6BC0', False, True),
    ('Insurance', 'All types of insurance', 'shield', '#42A5F5', False, True),
    ('Subscriptions', 'Streaming, software, memberships', 'refresh-cw', '#29B6F6', False, True),
    ('Travel', 'Flights, hotels, vacations', 'plane', '#26C6DA', False, True),
    ('Gifts', 'Presents and donations', 'gift', '#26A69A', False, True),
    ('Personal Care', 'Haircuts, spa, cosmetics', 'user', '#66BB6A', False, True),
    ('Pets', 'Pet food, vet, supplies', 'heart', '#9CCC65', False, True),
    ('Home Improvement', 'Furniture, repairs, maintenance', 'tool', '#D4E157', False, True),
    ('Taxes', 'Income tax, property tax', 'file-text', '#FFEE58', False, True),
    ('Bank Fees', 'Account fees, wire transfer fees', 'credit-card', '#FFA726', False, True),
    ('Uncategorized', 'Uncategorized expenses', 'help-circle', '#BDBDBD', False, True),
]

# Global merchants (top 100 most common)
GLOBAL_MERCHANTS = [
    ('Amazon', ['AMZN*', 'Amazon Mktplace', 'Amazon.it', 'AMAZON EU'], 'https://amazon.it', True),
    ('Netflix', ['NETFLIX', 'NETFLIX.COM'], 'https://netflix.com', True),
    ('Spotify', ['SPOTIFY'], 'https://spotify.com', True),
    ('Apple', ['APPLE.COM/BILL', 'APPLE STORE', 'APL*ITUNES'], 'https://apple.com', True),
    ('Google', ['GOOGLE *', 'GOOGLE STORAGE', 'GOOGLE PLAY'], 'https://google.com', True),
    ('PayPal', ['PAYPAL *'], 'https://paypal.com', True),
    ('Uber', ['UBER *', 'UBER EATS'], 'https://uber.com', True),
    ('Deliveroo', ['DELIVEROO'], 'https://deliveroo.it', True),
    ('Glovo', ['GLOVO'], 'https://glovoapp.com', True),
    ('Esselunga', ['ESSELUNGA', 'ESSELUNGA ONLINE'], 'https://esselunga.it', True),
    ('Coop', ['COOP', 'COOP ALLEANZA'], 'https://coop.it', True),
    ('Carrefour', ['CARREFOUR'], 'https://carrefour.it', True),
    ('Conad', ['CONAD'], 'https://conad.it', True),
    ('Lidl', ['LIDL'], 'https://lidl.it', True),
    ('Eurospin', ['EUROSPIN'], 'https://eurospin.it', True),
    ('Eni', ['ENI', 'ENI STATION'], 'https://eni.com', True),
    ('Enel', ['ENEL ENERGIA'], 'https://enel.it', True),
    ('TIM', ['TIM'], 'https://tim.it', True),
    ('Vodafone', ['VODAFONE'], 'https://vodafone.it', True),
    ('Trenitalia', ['TRENITALIA'], 'https://trenitalia.com', True),
    ('Autostrade', ['AUTOSTRADE'], 'https://autostrade.it', True),
    ('ATM Milano', ['ATM MILANO', 'ATM'], 'https://atm.it', True),
    ('Ikea', ['IKEA'], 'https://ikea.com', True),
    ('Zara', ['ZARA'], 'https://zara.com', True),
    ('H&M', ['H&M'], 'https://hm.com', True),
    ('Decathlon', ['DECATHLON'], 'https://decathlon.it', True),
    ('MediaWorld', ['MEDIAWORLD'], 'https://mediaworld.it', True),
    ('Booking.com', ['BOOKING.COM'], 'https://booking.com', True),
    ('Airbnb', ['AIRBNB'], 'https://airbnb.com', True),
    ('Ryanair', ['RYANAIR'], 'https://ryanair.com', True),
]


class DatabaseSeeder:
    """Main seeding orchestrator."""
    
    def __init__(self, env='dev', clean=False):
        """Initialize seeder with environment configuration."""
        self.env = env
        self.clean = clean
        self.config = DB_CONFIG[env]
        self.conn = None
        self.cursor = None
        
        # Track created entities for relationships
        self.users = []
        self.profiles = []
        self.categories = []
        self.tags = []
        self.merchants = []
        self.accounts = []
        
    def connect(self):
        """Establish database connection."""
        try:
            self.conn = psycopg2.connect(**self.config)
            self.cursor = self.conn.cursor()
            print(f"✅ Connected to database: {self.config['database']}")
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            raise
    
    def disconnect(self):
        """Close database connection."""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("✅ Disconnected from database")
    
    def clean_database(self):
        """Drop and recreate all tables (CAUTION: data loss!)."""
        if self.env == 'prod':
            print("❌ Cannot clean production database!")
            return
        
        print("⚠️  Cleaning database...")
        try:
            # Drop all tables
            self.cursor.execute("""
                DROP SCHEMA public CASCADE;
                CREATE SCHEMA public;
                GRANT ALL ON SCHEMA public TO public;
            """)
            self.conn.commit()
            print("✅ Database cleaned")
        except Exception as e:
            print(f"❌ Clean failed: {e}")
            self.conn.rollback()
            raise
    
    def seed_all(self):
        """Execute full seeding pipeline."""
        print("\n🌱 Starting database seeding...\n")
        
        try:
            if self.clean:
                self.clean_database()
                print("ℹ️  Run Alembic migrations before continuing")
                return

            psycopg2.extras.register_uuid()

            # Seeding order matters (dependencies)
            self.seed_users_and_profiles()
            self.seed_categories()
            self.seed_merchants()
            self.seed_tags()
            self.seed_accounts()
            self.seed_exchange_rates()
            self.seed_transactions()
            self.seed_recurring_transactions()
            self.seed_budgets()
            self.seed_goals()
            self.seed_assets()
            self.seed_documents()
            self.seed_ml_logs()
            self.seed_predictions()
            self.seed_ai_recommendations()
            self.seed_notifications()
            self.seed_audit_logs()
            
            self.conn.commit()
            print("\n✅ Seeding completed successfully!")
            self.print_summary()
            
        except Exception as e:
            print(f"\n❌ Seeding failed: {e}")
            self.conn.rollback()
            raise
    
    def seed_users_and_profiles(self):
        """Create test users with different profile configurations."""
        print("👤 Seeding users and profiles...")
        
        # User 1: Personal only
        user1_id = str(uuid.uuid4())
        self.cursor.execute("""
            INSERT INTO users (id, email, hashed_password, full_name, is_active, is_verified, 
                              preferred_language, timezone, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user1_id, 'mario.rossi@example.com', 
            '$argon2id$v=19$m=65536,t=3,p=4$hash',  # Hashed "password123"
            'Mario Rossi', True, True, 'it', 'Europe/Rome', datetime.now()
        ))
        
        # User 1 preferences
        self.cursor.execute("""
            INSERT INTO user_preferences (id, user_id)
            VALUES (%s, %s)
        """, (str(uuid.uuid4()), user1_id))
        
        # User 1 profiles
        profile1_1 = str(uuid.uuid4())
        self.cursor.execute("""
            INSERT INTO financial_profiles (id, user_id, name, profile_type, security_level, 
                                           default_currency, is_default, color_code, icon, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            profile1_1, user1_id, 'Personal', 'personal', 'standard',
            'EUR', True, '#4CAF50', 'user', datetime.now()
        ))
        
        self.users.append(user1_id)
        self.profiles.append({'id': profile1_1, 'user_id': user1_id, 'name': 'Personal', 'type': 'personal'})
        
        # User 2: Personal + Family + Business (with High-Security Business)
        user2_id = str(uuid.uuid4())
        self.cursor.execute("""
            INSERT INTO users (id, email, hashed_password, full_name, is_active, is_verified,
                              two_factor_enabled, preferred_language, timezone, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user2_id, 'giulia.bianchi@example.com',
            '$argon2id$v=19$m=65536,t=3,p=4$hash',
            'Giulia Bianchi', True, True, True, 'it', 'Europe/Rome', datetime.now()
        ))
        
        self.cursor.execute("""
            INSERT INTO user_preferences (id, user_id, ai_proactivity_level, ml_training_consent)
            VALUES (%s, %s, %s, %s)
        """, (str(uuid.uuid4()), user2_id, 'high', True))
        
        # User 2 profiles
        profile2_1 = str(uuid.uuid4())
        profile2_2 = str(uuid.uuid4())
        profile2_3 = str(uuid.uuid4())
        
        profiles_data = [
            (profile2_1, user2_id, 'Personal', 'personal', 'standard', 'EUR', True, '#2196F3', 'user'),
            (profile2_2, user2_id, 'Family', 'family', 'standard', 'EUR', False, '#FF9800', 'users'),
            (profile2_3, user2_id, 'Freelance Business', 'business', 'high_security', 'EUR', False, '#9C27B0', 'briefcase'),
        ]
        
        for profile_data in profiles_data:
            profile_id, user_id, name, ptype, sec_level, curr, is_def, color, icon = profile_data
            
            # Generate encryption salt for HS profile
            enc_salt = 'base64_encoded_salt_32bytes==' if sec_level == 'high_security' else None
            
            self.cursor.execute("""
                INSERT INTO financial_profiles (id, user_id, name, profile_type, security_level,
                                               encryption_salt, default_currency, is_default, 
                                               color_code, icon, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                profile_id, user_id, name, ptype, sec_level, enc_salt, curr, is_def, color, icon, datetime.now()
            ))
            
            self.profiles.append({
                'id': profile_id, 'user_id': user_id, 'name': name, 
                'type': ptype, 'security_level': sec_level
            })
        
        self.users.append(user2_id)
        
        self.conn.commit()
        print(f"  ✓ Created {len(self.users)} users with {len(self.profiles)} profiles")
    
    def seed_categories(self):
        """Create system categories and some user custom categories."""
        print("📁 Seeding categories...")
        
        # System categories (shared across all users)
        for user_id in self.users:
            for cat_data in SYSTEM_CATEGORIES:
                name, desc, icon, color, is_income, is_system = cat_data
                cat_id = str(uuid.uuid4())
                
                self.cursor.execute("""
                    INSERT INTO categories (id, user_id, name, description, icon, color, 
                                           is_income, is_system, is_active, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    cat_id, user_id, name, desc, icon, color, 
                    is_income, is_system, True, datetime.now()
                ))
                
                self.categories.append({
                    'id': cat_id, 'user_id': user_id, 'name': name, 'is_income': is_income
                })
        
        # Add some custom categories for user 2
        if len(self.users) > 1:
            custom_cats = [
                ('Consulting', 'Consulting projects', 'briefcase', '#00BCD4', True, False),
                ('Software Licenses', 'Development tools and licenses', 'code', '#3F51B5', False, False),
                ('Coworking', 'Coworking space rent', 'briefcase', '#795548', False, False),
            ]
            
            for cat_data in custom_cats:
                name, desc, icon, color, is_income, is_system = cat_data
                cat_id = str(uuid.uuid4())
                
                self.cursor.execute("""
                    INSERT INTO categories (id, user_id, name, description, icon, color,
                                           is_income, is_system, is_active, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    cat_id, self.users[1], name, desc, icon, color,
                    is_income, is_system, True, datetime.now()
                ))
                
                self.categories.append({
                    'id': cat_id, 'user_id': self.users[1], 'name': name, 'is_income': is_income
                })
        
        self.conn.commit()
        print(f"  ✓ Created {len(self.categories)} categories")
    
    def seed_merchants(self):
        """Create global merchant database."""
        print("🏪 Seeding merchants...")
        
        for merchant_data in GLOBAL_MERCHANTS:
            name, aliases, website, is_verified = merchant_data
            merchant_id = str(uuid.uuid4())
            
            self.cursor.execute("""
                INSERT INTO merchants (id, canonical_name, aliases, website, is_verified, 
                                      usage_count, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                merchant_id, name, aliases, website, is_verified,
                random.randint(100, 10000), datetime.now()
            ))
            
            self.merchants.append({'id': merchant_id, 'name': name})
        
        self.conn.commit()
        print(f"  ✓ Created {len(self.merchants)} merchants")
    
    def seed_tags(self):
        """Create user tags."""
        print("🏷️  Seeding tags...")
        
        tags_data = [
            ('#deductible', 'functional', '#4CAF50', 'Tax deductible expenses'),
            ('#work', 'contextual', '#2196F3', 'Work-related'),
            ('#personal', 'contextual', '#FF9800', 'Personal expenses'),
            ('#urgent', 'emotional', '#F44336', 'Urgent payments'),
            ('#recurring', 'temporal', '#9C27B0', 'Recurring expenses'),
            ('#shared', 'functional', '#00BCD4', 'Shared with partner'),
            ('#reimbursable', 'functional', '#8BC34A', 'Can be reimbursed'),
        ]
        
        for user_id in self.users:
            for tag_data in tags_data:
                name, tag_type, color, desc = tag_data
                tag_id = str(uuid.uuid4())
                
                self.cursor.execute("""
                    INSERT INTO tags (id, user_id, name, tag_type, color, description, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (tag_id, user_id, name, tag_type, color, desc, datetime.now()))
                
                self.tags.append({'id': tag_id, 'user_id': user_id, 'name': name})
        
        self.conn.commit()
        print(f"  ✓ Created {len(self.tags)} tags")
    
    def seed_accounts(self):
        """Create accounts for each profile."""
        print("💳 Seeding accounts...")
        
        account_templates = {
            'personal': [
                ('Checking Account', 'checking', 2500.00),
                ('Savings Account', 'savings', 15000.00),
                ('Credit Card', 'credit_card', -850.00, 5000.00),
            ],
            'family': [
                ('Family Checking', 'checking', 4200.00),
                ('Emergency Fund', 'savings', 20000.00),
            ],
            'business': [
                ('Business Checking', 'checking', 8500.00),
                ('Business Savings', 'savings', 30000.00),
                ('Business Credit Card', 'credit_card', -1200.00, 10000.00),
            ]
        }
        
        for profile in self.profiles:
            profile_type = profile['type']
            templates = account_templates.get(profile_type, account_templates['personal'])
            
            for acc_data in templates:
                name = acc_data[0]
                acc_type = acc_data[1]
                balance = Decimal(str(acc_data[2]))
                credit_limit = Decimal(str(acc_data[3])) if len(acc_data) > 3 else None
                
                acc_id = str(uuid.uuid4())
                
                self.cursor.execute("""
                    INSERT INTO accounts (id, financial_profile_id, name, account_type, currency,
                                         initial_balance, current_balance, credit_limit,
                                         institution_name, is_active, is_included_in_totals, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    acc_id, profile['id'], name, acc_type, 'EUR',
                    balance, balance, credit_limit,
                    random.choice(['Intesa Sanpaolo', 'Unicredit', 'BNL', 'Fineco']),
                    True, True, datetime.now()
                ))
                
                self.accounts.append({
                    'id': acc_id, 'profile_id': profile['id'], 'name': name, 
                    'type': acc_type, 'balance': balance
                })
        
        self.conn.commit()
        print(f"  ✓ Created {len(self.accounts)} accounts")
    
    def seed_exchange_rates(self):
        """Create exchange rate history for common currencies."""
        print("💱 Seeding exchange rates...")
        
        currency_pairs = [
            ('EUR', 'USD'), ('EUR', 'GBP'), ('EUR', 'CHF'),
            ('USD', 'EUR'), ('GBP', 'EUR'), ('CHF', 'EUR'),
        ]
        
        base_rates = {
            ('EUR', 'USD'): 1.08,
            ('EUR', 'GBP'): 0.86,
            ('EUR', 'CHF'): 0.95,
            ('USD', 'EUR'): 0.93,
            ('GBP', 'EUR'): 1.16,
            ('CHF', 'EUR'): 1.05,
        }
        
        # Generate 365 days of history
        start_date = datetime.now() - timedelta(days=365)
        
        for days in range(365):
            rate_date = start_date + timedelta(days=days)
            
            for pair in currency_pairs:
                base_currency, target_currency = pair
                base_rate = base_rates[pair]
                
                # Add some random variation (±5%)
                variation = random.uniform(0.95, 1.05)
                rate = Decimal(str(base_rate * variation))
                
                rate_id = str(uuid.uuid4())
                
                self.cursor.execute("""
                    INSERT INTO exchange_rates (id, base_currency, target_currency, rate, 
                                               rate_date, source, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    rate_id, base_currency, target_currency, rate,
                    rate_date.date(), 'ECB', datetime.now()
                ))
        
        self.conn.commit()
        print(f"  ✓ Created exchange rates for 365 days")
    
    def seed_transactions(self):
        """Generate realistic transactions for past 12 months."""
        print("💸 Seeding transactions...")
        
        transactions_created = 0
        
        for profile in self.profiles:
            # Get profile accounts
            profile_accounts = [acc for acc in self.accounts if acc['profile_id'] == profile['id']]
            if not profile_accounts:
                continue
            
            # Get user categories
            user_categories = [cat for cat in self.categories if cat['user_id'] == profile['user_id']]
            
            # Generate 6-12 months of transactions
            months = random.randint(6, 12)
            txns_per_month = random.randint(30, 80)
            
            for month_offset in range(months):
                for _ in range(txns_per_month):
                    # Random date in month
                    base_date = datetime.now() - relativedelta(months=month_offset)
                    txn_date = base_date - timedelta(days=random.randint(0, 28))
                    
                    # Random account
                    account = random.choice(profile_accounts)
                    
                    # Random category (mostly expenses, some income)
                    is_income_txn = random.random() < 0.15  # 15% income
                    category_pool = [c for c in user_categories if c['is_income'] == is_income_txn]
                    category = random.choice(category_pool) if category_pool else None
                    
                    # Random merchant
                    merchant = random.choice(self.merchants) if random.random() < 0.7 else None
                    
                    # Amount based on category
                    if is_income_txn:
                        # Income: 800-3000 EUR
                        amount = Decimal(str(random.uniform(800, 3000)))
                    else:
                        # Expense: 5-500 EUR mostly, rare large expenses
                        if random.random() < 0.9:
                            amount = Decimal(str(random.uniform(5, 500))) * -1
                        else:
                            amount = Decimal(str(random.uniform(500, 2000))) * -1
                    
                    # Generate transaction
                    txn_id = str(uuid.uuid4())
                    
                    self.cursor.execute("""
                        INSERT INTO transactions (
                            id, financial_profile_id, account_id, category_id, merchant_id,
                            transaction_date, transaction_type, source,
                            amount, amount_clear, currency, amount_in_profile_currency,
                            description, description_clear, merchant_name,
                            is_reconciled, created_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        txn_id, profile['id'], account['id'], 
                        category['id'] if category else None,
                        merchant['id'] if merchant else None,
                        txn_date.date(),
                        'income' if is_income_txn else 'purchase',
                        'manual',
                        str(amount),  # In reality would be encrypted for HS
                        amount, 'EUR', amount,
                        fake.sentence() if merchant is None else f"Payment to {merchant['name']}",
                        fake.sentence()[:100],
                        merchant['name'] if merchant else fake.company(),
                        random.random() < 0.8,  # 80% reconciled
                        datetime.now()
                    ))
                    
                    transactions_created += 1
        
        self.conn.commit()
        print(f"  ✓ Created {transactions_created} transactions")
    
    def seed_recurring_transactions(self):
        """Create recurring transaction templates."""
        print("🔄 Seeding recurring transactions...")
        
        recurring_templates = [
            ('Netflix Subscription', 'payment', -15.99, 'monthly', 'Subscriptions'),
            ('Spotify Premium', 'payment', -9.99, 'monthly', 'Subscriptions'),
            ('Gym Membership', 'payment', -45.00, 'monthly', 'Entertainment'),
            ('Monthly Salary', 'salary', 2800.00, 'monthly', 'Salary'),
            ('Electricity Bill', 'payment', -85.00, 'monthly', 'Utilities', 'variable_within_range', 60, 120),
            ('Internet Provider', 'payment', -29.90, 'monthly', 'Utilities'),
        ]
        
        for profile in self.profiles[:2]:  # Only for first 2 profiles
            profile_accounts = [acc for acc in self.accounts if acc['profile_id'] == profile['id']]
            if not profile_accounts:
                continue
            
            user_categories = [cat for cat in self.categories if cat['user_id'] == profile['user_id']]
            
            for template in recurring_templates:
                name = template[0]
                txn_type = template[1]
                amount = Decimal(str(template[2]))
                freq = template[3]
                cat_name = template[4]
                amount_model = template[5] if len(template) > 5 else 'fixed'
                amount_min = Decimal(str(template[6])) if len(template) > 6 else None
                amount_max = Decimal(str(template[7])) if len(template) > 7 else None
                
                # Find category
                category = next((c for c in user_categories if c['name'] == cat_name), None)
                account = random.choice(profile_accounts)
                
                rec_id = str(uuid.uuid4())
                start_date = datetime.now() - relativedelta(months=6)
                next_date = datetime.now() + timedelta(days=random.randint(1, 15))
                
                self.cursor.execute("""
                    INSERT INTO recurring_transactions (
                        id, financial_profile_id, account_id, category_id,
                        name, transaction_type, amount_model, base_amount,
                        amount_min, amount_max, currency, frequency, interval,
                        start_date, next_occurrence_date, auto_create,
                        notification_days_before, is_active, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    rec_id, profile['id'], account['id'], category['id'] if category else None,
                    name, txn_type, amount_model, amount,
                    amount_min, amount_max, 'EUR', freq, 1,
                    start_date.date(), next_date.date(), 
                    amount > 0,  # Auto-create for income only
                    3, True, datetime.now()
                ))
        
        self.conn.commit()
        print(f"  ✓ Created recurring transaction templates")
    
    def seed_budgets(self):
        """Create budgets with different scopes."""
        print("💰 Seeding budgets...")
        
        # User 2 budgets (has multiple profiles)
        if len(self.users) > 1:
            user2_id = self.users[1]
            user2_profiles = [p for p in self.profiles if p['user_id'] == user2_id]
            user2_categories = [c for c in self.categories if c['user_id'] == user2_id]
            
            # Budget 1: User-wide (all profiles)
            budget1_id = str(uuid.uuid4())
            self.cursor.execute("""
                INSERT INTO budgets (
                    id, user_id, name, scope_type, scope_profile_ids,
                    period_type, start_date, end_date, total_amount, currency,
                    rollover_enabled, alert_threshold_percent, is_active, created_at
                ) VALUES (%s, %s, %s, %s, NULL, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                budget1_id, user2_id, 'November 2025 Total Budget', 'user',
                'monthly', datetime(2025, 11, 1).date(), datetime(2025, 11, 30).date(),
                Decimal('3500.00'), 'EUR', False, 80, True, datetime.now()
            ))
            
            # Allocate to categories
            expense_cats = [c for c in user2_categories if not c['is_income']][:5]
            allocations = [700, 600, 500, 400, 1300]  # Sums to 3500
            
            for cat, amount in zip(expense_cats, allocations):
                self.cursor.execute("""
                    INSERT INTO budget_categories (id, budget_id, category_id, allocated_amount, spent_amount, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (str(uuid.uuid4()), budget1_id, cat['id'], Decimal(str(amount)), Decimal('0'), datetime.now()))
            
            # Budget 2: Multi-profile (Personal + Family)
            if len(user2_profiles) >= 2:
                budget2_id = str(uuid.uuid4())
                scope_ids = [user2_profiles[0]['id'], user2_profiles[1]['id']]
                scope_ids_uuid = [uuid.UUID(x) for x in scope_ids]
                
                self.cursor.execute("""
                    INSERT INTO budgets (
                        id, user_id, name, scope_type, scope_profile_ids,
                        period_type, start_date, end_date, total_amount, currency,
                        rollover_enabled, alert_threshold_percent, is_active, created_at
                    ) VALUES (%s, %s, %s, %s, %s::uuid[], %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    budget2_id, user2_id, 'Home & Family Expenses', 'multi_profile', scope_ids_uuid,
                    'monthly', datetime(2025, 11, 1).date(), datetime(2025, 11, 30).date(),
                    Decimal('2000.00'), 'EUR', True, 85, True, datetime.now()
                ))
        
        self.conn.commit()
        print(f"  ✓ Created budgets")
    
    def seed_goals(self):
        """Create financial goals."""
        print("🎯 Seeding financial goals...")
        
        for user_id in self.users:
            user_profiles = [p for p in self.profiles if p['user_id'] == user_id]
            
            # Goal 1: House Down Payment (user-wide)
            goal1_id = str(uuid.uuid4())
            self.cursor.execute("""
                INSERT INTO financial_goals (
                    id, user_id, name, scope_type, scope_profile_ids,
                    goal_type, description, target_amount, current_amount, currency,
                    start_date, target_date, monthly_contribution, priority,
                    status, achievement_probability, gamification_points, created_at
                ) VALUES (%s, %s, %s, %s, NULL, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                goal1_id, user_id, 'House Down Payment', 'user',
                'house', 'Save for 20% down payment on first home',
                Decimal('50000.00'), Decimal('12500.00'), 'EUR',
                datetime.now().date(), (datetime.now() + relativedelta(years=3)).date(),
                Decimal('1000.00'), 9, 'active', Decimal('78.5'), 250, datetime.now()
            ))
            
            # Goal 2: Emergency Fund
            goal2_id = str(uuid.uuid4())
            self.cursor.execute("""
                INSERT INTO financial_goals (
                    id, user_id, name, scope_type, scope_profile_ids,
                    goal_type, description, target_amount, current_amount, currency,
                    start_date, target_date, monthly_contribution, priority,
                    status, achievement_probability, gamification_points, created_at
                ) VALUES (%s, %s, %s, %s, NULL, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                goal2_id, user_id, 'Emergency Fund', 'user', 
                'emergency_fund', '6 months of expenses for emergencies',
                Decimal('15000.00'), Decimal('8200.00'), 'EUR',
                datetime.now().date(), (datetime.now() + relativedelta(years=1)).date(),
                Decimal('600.00'), 10, 'active', Decimal('92.3'), 150, datetime.now()
            ))
        
        self.conn.commit()
        print(f"  ✓ Created financial goals")
    
    def seed_assets(self):
        """Create assets for profiles."""
        print("🏠 Seeding assets...")
        
        for profile in self.profiles:
            if profile['type'] in ['personal', 'family']:
                # Real estate
                asset1_id = str(uuid.uuid4())
                self.cursor.execute("""
                    INSERT INTO assets (
                        id, financial_profile_id, name, asset_type,
                        purchase_date, purchase_price, current_value,
                        current_value_min, current_value_max,
                        valuation_method, last_valuation_date, currency,
                        is_liquid, metadata, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    asset1_id, profile['id'], 'Primary Residence', 'real_estate',
                    datetime(2018, 6, 15).date(), Decimal('250000.00'), Decimal('320000.00'),
                    Decimal('300000.00'), Decimal('340000.00'),
                    'range', datetime.now().date(), 'EUR',
                    False, '{"address": "Via Roma 123, Milano", "sqm": 85}', datetime.now()
                ))
                
                # Vehicle
                asset2_id = str(uuid.uuid4())
                self.cursor.execute("""
                    INSERT INTO assets (
                        id, financial_profile_id, name, asset_type,
                        purchase_date, purchase_price, current_value,
                        valuation_method, last_valuation_date, currency,
                        is_liquid, metadata, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    asset2_id, profile['id'], '2020 Volkswagen Golf', 'vehicle',
                    datetime(2020, 3, 10).date(), Decimal('22000.00'), Decimal('14500.00'),
                    'comparative', datetime.now().date(), 'EUR',
                    False, '{"model": "Golf 8 1.5 TSI", "km": 45000}', datetime.now()
                ))
        
        self.conn.commit()
        print(f"  ✓ Created assets")
    
    def seed_documents(self):
        """Create document records (without actual files)."""
        print("📄 Seeding documents...")
        
        for profile in self.profiles[:2]:
            for i in range(3):
                doc_id = str(uuid.uuid4())
                self.cursor.execute("""
                    INSERT INTO documents (
                        id, financial_profile_id, document_type,
                        file_name, file_path, file_size, mime_type, file_hash,
                        ocr_processed, confidence_score, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    doc_id, profile['id'], random.choice(['receipt', 'invoice', 'contract']),
                    f"document_{i+1}.pdf", f"/storage/docs/{profile['id']}/{doc_id}.pdf",
                    random.randint(50000, 500000), 'application/pdf',
                    fake.sha256(),
                    True, Decimal(str(random.uniform(0.85, 0.99))), datetime.now()
                ))
        
        self.conn.commit()
        print(f"  ✓ Created documents")
    
    def seed_ml_logs(self):
        """Create ML classification logs."""
        print("🤖 Seeding ML classification logs...")
        
        model_names = ['gradient_boosting_v3', 'neural_network_v2', 'random_forest_v4']
        
        for profile in self.profiles[:2]:
            for _ in range(20):
                log_id = str(uuid.uuid4())
                user_categories = [c for c in self.categories if c['user_id'] == profile['user_id']]
                
                self.cursor.execute("""
                    INSERT INTO ml_classification_logs (
                        id, financial_profile_id, original_description,
                        suggested_category_id, confidence_score,
                        model_name, model_version, was_accepted, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    log_id, profile['id'], fake.sentence(),
                    random.choice(user_categories)['id'],
                    Decimal(str(random.uniform(0.7, 0.99))),
                    random.choice(model_names), '1.0.0',
                    random.choice([True, False, None]), datetime.now()
                ))
        
        self.conn.commit()
        print(f"  ✓ Created ML classification logs")
    
    def seed_predictions(self):
        """Create future spending predictions."""
        print("🔮 Seeding predictions...")
        
        for profile in self.profiles:
            user_categories = [c for c in self.categories if c['user_id'] == profile['user_id'] and not c['is_income']]
            
            # Next 3 months predictions
            for month_offset in range(1, 4):
                pred_date = datetime.now() + relativedelta(months=month_offset)
                
                for category in random.sample(user_categories, min(5, len(user_categories))):
                    pred_id = str(uuid.uuid4())
                    predicted = Decimal(str(random.uniform(200, 800)))
                    
                    self.cursor.execute("""
                        INSERT INTO predictions (
                            id, financial_profile_id, prediction_type, category_id,
                            prediction_date, predicted_amount,
                            confidence_interval_min, confidence_interval_max,
                            confidence_level, model_name, model_version, created_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        pred_id, profile['id'], 'category_expense', category['id'],
                        pred_date.date(), predicted,
                        predicted * Decimal('0.85'), predicted * Decimal('1.15'),
                        Decimal('0.95'), 'prophet_seasonal_v2', '2.1.0', datetime.now()
                    ))
        
        self.conn.commit()
        print(f"  ✓ Created predictions")
    
    def seed_ai_recommendations(self):
        """Create AI recommendations."""
        print("💡 Seeding AI recommendations...")
        
        recommendations = [
            ('unused_subscription', 'Unused Netflix Subscription', 
             'Your Netflix subscription has not been used in the last 2 months. Consider cancelling to save €15.99/month.',
             Decimal('15.99'), 7),
            ('budget_optimization', 'Reduce Restaurant Spending',
             'You\'ve exceeded your restaurant budget by 40% this month. Consider meal planning to save money.',
             Decimal('200.00'), 8),
            ('savings_opportunity', 'High Savings Account Interest',
             'Current savings accounts offer up to 4% APY. You could earn €800/year more by switching.',
             Decimal('800.00'), 6),
        ]
        
        for user_id in self.users:
            for rec_data in recommendations:
                rec_type, title, desc, savings, priority = rec_data
                rec_id = str(uuid.uuid4())
                
                self.cursor.execute("""
                    INSERT INTO ai_recommendations (
                        id, user_id, scope_type, recommendation_type,
                        title, description, potential_savings, priority,
                        confidence_score, is_dismissed, is_implemented, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    rec_id, user_id, 'user', rec_type,
                    title, desc, savings, priority,
                    Decimal(str(random.uniform(0.7, 0.95))), False, False, datetime.now()
                ))
        
        self.conn.commit()
        print(f"  ✓ Created AI recommendations")
    
    def seed_notifications(self):
        """Create notifications."""
        print("🔔 Seeding notifications...")
        
        notifications = [
            ('budget_alert', 'Budget Alert: Groceries', 
             'You\'ve spent 85% of your Groceries budget for this month.', 7),
            ('goal_milestone', 'Goal Milestone Reached!',
             'Congratulations! You\'ve reached 25% of your House Down Payment goal.', 5),
            ('recurring_reminder', 'Upcoming Payment',
             'Your Netflix subscription of €15.99 will be charged in 3 days.', 5),
        ]
        
        for user_id in self.users:
            for notif_data in notifications:
                notif_type, title, message, priority = notif_data
                notif_id = str(uuid.uuid4())
                
                self.cursor.execute("""
                    INSERT INTO notifications (
                        id, user_id, notification_type, title, message,
                        status, priority, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    notif_id, user_id, notif_type, title, message,
                    'unread', priority, datetime.now()
                ))
        
        self.conn.commit()
        print(f"  ✓ Created notifications")
    
    def seed_audit_logs(self):
        """Create audit log entries."""
        print("📋 Seeding audit logs...")
        
        actions = [
            ('access', 'login', 'info'),
            ('financial_op', 'transaction_created', 'info'),
            ('financial_op', 'budget_updated', 'info'),
            ('security', 'password_changed', 'warning'),
            ('ai_interaction', 'chat_query', 'info'),
        ]
        
        for user_id in self.users:
            for _ in range(50):
                event_type, action, severity = random.choice(actions)
                log_id = str(uuid.uuid4())
                
                self.cursor.execute("""
                    INSERT INTO audit_logs (
                        id, user_id, event_type, severity, action,
                        ip_address, user_agent, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    log_id, user_id, event_type, severity, action,
                    fake.ipv4(), fake.user_agent(),
                    datetime.now() - timedelta(days=random.randint(0, 90))
                ))
        
        self.conn.commit()
        print(f"  ✓ Created audit logs")
    
    def print_summary(self):
        """Print seeding summary."""
        print("\n" + "="*60)
        print("SEEDING SUMMARY")
        print("="*60)
        print(f"Users created: {len(self.users)}")
        print(f"Profiles created: {len(self.profiles)}")
        print(f"Categories created: {len(self.categories)}")
        print(f"Merchants created: {len(self.merchants)}")
        print(f"Tags created: {len(self.tags)}")
        print(f"Accounts created: {len(self.accounts)}")
        print("\n💾 Database: {env} - {database}".format(
            env=self.env.upper(),
            database=self.config['database']
        ))
        print("\n🔐 Login Credentials (password: password123):")
        print("  • mario.rossi@example.com")
        print("  • giulia.bianchi@example.com (2FA enabled)")
        print("="*60)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Seed FinancePro database')
    parser.add_argument('--env', choices=['dev', 'staging'], default='dev',
                       help='Environment to seed (default: dev)')
    parser.add_argument('--clean', action='store_true',
                       help='Clean database before seeding (drops all data!)')
    
    args = parser.parse_args()
    
    if args.env not in DB_CONFIG:
        print(f"❌ Invalid environment: {args.env}")
        print(f"Available: {', '.join(DB_CONFIG.keys())}")
        return 1
    
    if args.clean:
        confirm = input(f"⚠️  WARNING: This will DELETE ALL DATA in {args.env} database. Continue? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Aborted.")
            return 0
    
    seeder = DatabaseSeeder(env=args.env, clean=args.clean)
    
    try:
        seeder.connect()
        seeder.seed_all()
        return 0
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        seeder.disconnect()


if __name__ == '__main__':
    exit(main())
