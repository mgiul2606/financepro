#!/usr/bin/env python3
"""
Script to manually apply the database migration for financial_profiles and other missing tables.
Run this after starting PostgreSQL.
"""
import psycopg2
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.development')

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE__URL', 'postgresql://financepro:financepro@localhost:5432/financepro_dev')

# Parse database URL
# Format: postgresql://user:password@host:port/database
parts = DATABASE_URL.replace('postgresql://', '').split('@')
user_pass = parts[0].split(':')
host_port_db = parts[1].split('/')
host_port = host_port_db[0].split(':')

db_config = {
    'user': user_pass[0],
    'password': user_pass[1],
    'host': host_port[0],
    'port': host_port[1] if len(host_port) > 1 else '5432',
    'database': host_port_db[1]
}

print(f"🔗 Connecting to database: {db_config['host']}:{db_config['port']}/{db_config['database']}")

try:
    # Connect to database
    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()

    print("✅ Connected successfully!")

    # Check if financial_profiles table already exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'financial_profiles'
        );
    """)

    if cursor.fetchone()[0]:
        print("⚠️  financial_profiles table already exists. Skipping migration.")
        sys.exit(0)

    print("📋 Creating missing tables...")

    # Create ENUM types first
    print("  - Creating ENUM types...")
    cursor.execute("""
        DO $$ BEGIN
            CREATE TYPE profiletype AS ENUM ('personal', 'family', 'business');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
            CREATE TYPE databasetype AS ENUM ('postgresql', 'mssql');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
            CREATE TYPE categorytype AS ENUM ('income', 'expense');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
            CREATE TYPE transactiontype AS ENUM ('income', 'expense', 'transfer');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
            CREATE TYPE budgetperiod AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
            CREATE TYPE goalpriority AS ENUM ('low', 'medium', 'high');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
            CREATE TYPE importstatus AS ENUM ('pending', 'processing', 'completed', 'failed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
            CREATE TYPE recurrencefrequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
            CREATE TYPE messagerole AS ENUM ('user', 'assistant');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
            CREATE TYPE accounttype AS ENUM ('checking', 'savings', 'credit_card', 'investment', 'cash', 'loan', 'other');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create financial_profiles table
    print("  - Creating financial_profiles table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS financial_profiles (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            profile_type profiletype NOT NULL DEFAULT 'personal',
            default_currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
            database_connection_string TEXT,
            database_type databasetype,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_financial_profiles_id ON financial_profiles(id);
        CREATE INDEX IF NOT EXISTS ix_financial_profiles_user_id ON financial_profiles(user_id);
    """)

    # Create categories table
    print("  - Creating categories table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id UUID PRIMARY KEY,
            financial_profile_id UUID NOT NULL REFERENCES financial_profiles(id),
            name VARCHAR(100) NOT NULL,
            category_type categorytype NOT NULL,
            color VARCHAR(7),
            icon VARCHAR(50),
            description TEXT,
            parent_id UUID REFERENCES categories(id),
            is_system BOOLEAN NOT NULL DEFAULT false,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_categories_id ON categories(id);
        CREATE INDEX IF NOT EXISTS ix_categories_financial_profile_id ON categories(financial_profile_id);
        CREATE INDEX IF NOT EXISTS ix_categories_parent_id ON categories(parent_id);
    """)

    # Create tags table
    print("  - Creating tags table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tags (
            id UUID PRIMARY KEY,
            financial_profile_id UUID NOT NULL REFERENCES financial_profiles(id),
            name VARCHAR(50) NOT NULL,
            color VARCHAR(7),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_tags_id ON tags(id);
        CREATE INDEX IF NOT EXISTS ix_tags_financial_profile_id ON tags(financial_profile_id);
    """)

    # Create accounts table
    print("  - Creating accounts table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS accounts (
            id UUID PRIMARY KEY,
            financial_profile_id UUID NOT NULL REFERENCES financial_profiles(id),
            name VARCHAR(100) NOT NULL,
            account_type accounttype NOT NULL DEFAULT 'checking',
            currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
            initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
            institution_name VARCHAR(255),
            account_number VARCHAR(255),
            notes TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_accounts_id ON accounts(id);
        CREATE INDEX IF NOT EXISTS ix_accounts_financial_profile_id ON accounts(financial_profile_id);
    """)

    # Create transactions table
    print("  - Creating transactions table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id UUID PRIMARY KEY,
            account_id UUID NOT NULL REFERENCES accounts(id),
            category_id UUID REFERENCES categories(id),
            amount NUMERIC(15, 2) NOT NULL,
            currency VARCHAR(3) NOT NULL,
            transaction_type transactiontype NOT NULL,
            description VARCHAR(500),
            merchant VARCHAR(200),
            transaction_date TIMESTAMP NOT NULL,
            is_recurring BOOLEAN NOT NULL DEFAULT false,
            notes TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_transactions_id ON transactions(id);
        CREATE INDEX IF NOT EXISTS ix_transactions_account_id ON transactions(account_id);
        CREATE INDEX IF NOT EXISTS ix_transactions_category_id ON transactions(category_id);
        CREATE INDEX IF NOT EXISTS ix_transactions_transaction_date ON transactions(transaction_date);
    """)

    # Create budgets table
    print("  - Creating budgets table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            id UUID PRIMARY KEY,
            financial_profile_id UUID NOT NULL REFERENCES financial_profiles(id),
            category_id UUID REFERENCES categories(id),
            name VARCHAR(100) NOT NULL,
            amount NUMERIC(15, 2) NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
            period budgetperiod NOT NULL,
            start_date TIMESTAMP NOT NULL,
            end_date TIMESTAMP,
            alert_threshold INTEGER,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_budgets_id ON budgets(id);
        CREATE INDEX IF NOT EXISTS ix_budgets_financial_profile_id ON budgets(financial_profile_id);
        CREATE INDEX IF NOT EXISTS ix_budgets_category_id ON budgets(category_id);
    """)

    # Create financial_goals table
    print("  - Creating financial_goals table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS financial_goals (
            id UUID PRIMARY KEY,
            financial_profile_id UUID NOT NULL REFERENCES financial_profiles(id),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            target_amount NUMERIC(15, 2) NOT NULL,
            current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
            currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
            target_date TIMESTAMP,
            priority goalpriority NOT NULL DEFAULT 'medium',
            is_completed BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_financial_goals_id ON financial_goals(id);
        CREATE INDEX IF NOT EXISTS ix_financial_goals_financial_profile_id ON financial_goals(financial_profile_id);
    """)

    # Create assets table
    print("  - Creating assets table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assets (
            id UUID PRIMARY KEY,
            financial_profile_id UUID NOT NULL REFERENCES financial_profiles(id),
            name VARCHAR(100) NOT NULL,
            asset_type VARCHAR(50) NOT NULL,
            value NUMERIC(15, 2) NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
            purchase_date TIMESTAMP,
            description TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_assets_id ON assets(id);
        CREATE INDEX IF NOT EXISTS ix_assets_financial_profile_id ON assets(financial_profile_id);
    """)

    # Create recurring_transactions table
    print("  - Creating recurring_transactions table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recurring_transactions (
            id UUID PRIMARY KEY,
            account_id UUID NOT NULL REFERENCES accounts(id),
            category_id UUID REFERENCES categories(id),
            amount NUMERIC(15, 2) NOT NULL,
            currency VARCHAR(3) NOT NULL,
            transaction_type transactiontype NOT NULL,
            description VARCHAR(500),
            frequency recurrencefrequency NOT NULL,
            start_date TIMESTAMP NOT NULL,
            end_date TIMESTAMP,
            next_occurrence TIMESTAMP,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_recurring_transactions_id ON recurring_transactions(id);
        CREATE INDEX IF NOT EXISTS ix_recurring_transactions_account_id ON recurring_transactions(account_id);
        CREATE INDEX IF NOT EXISTS ix_recurring_transactions_category_id ON recurring_transactions(category_id);
    """)

    # Create import_jobs table
    print("  - Creating import_jobs table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS import_jobs (
            id UUID PRIMARY KEY,
            financial_profile_id UUID NOT NULL REFERENCES financial_profiles(id),
            file_name VARCHAR(255) NOT NULL,
            file_type VARCHAR(50) NOT NULL,
            status importstatus NOT NULL,
            total_rows INTEGER,
            processed_rows INTEGER,
            error_message TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS ix_import_jobs_id ON import_jobs(id);
        CREATE INDEX IF NOT EXISTS ix_import_jobs_financial_profile_id ON import_jobs(financial_profile_id);
    """)

    # Create audit_logs table
    print("  - Creating audit_logs table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY,
            financial_profile_id UUID NOT NULL REFERENCES financial_profiles(id),
            user_id UUID NOT NULL REFERENCES users(id),
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id UUID,
            changes JSONB,
            ip_address VARCHAR(45),
            user_agent VARCHAR(500),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_audit_logs_id ON audit_logs(id);
        CREATE INDEX IF NOT EXISTS ix_audit_logs_financial_profile_id ON audit_logs(financial_profile_id);
        CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id ON audit_logs(user_id);
    """)

    # Create exchange_rates table
    print("  - Creating exchange_rates table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS exchange_rates (
            id UUID PRIMARY KEY,
            from_currency VARCHAR(3) NOT NULL,
            to_currency VARCHAR(3) NOT NULL,
            rate NUMERIC(15, 6) NOT NULL,
            date TIMESTAMP NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_exchange_rates_id ON exchange_rates(id);
        CREATE INDEX IF NOT EXISTS ix_exchange_rates_currencies ON exchange_rates(from_currency, to_currency, date);
    """)

    # Create ml_classification_logs table
    print("  - Creating ml_classification_logs table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ml_classification_logs (
            id UUID PRIMARY KEY,
            transaction_id UUID NOT NULL REFERENCES transactions(id),
            predicted_category_id UUID REFERENCES categories(id),
            confidence FLOAT,
            model_version VARCHAR(50),
            was_correct BOOLEAN,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_ml_classification_logs_id ON ml_classification_logs(id);
        CREATE INDEX IF NOT EXISTS ix_ml_classification_logs_transaction_id ON ml_classification_logs(transaction_id);
    """)

    # Create chat_conversations table
    print("  - Creating chat_conversations table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_conversations (
            id UUID PRIMARY KEY,
            financial_profile_id UUID NOT NULL REFERENCES financial_profiles(id),
            title VARCHAR(200),
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_chat_conversations_id ON chat_conversations(id);
        CREATE INDEX IF NOT EXISTS ix_chat_conversations_financial_profile_id ON chat_conversations(financial_profile_id);
    """)

    # Create chat_messages table
    print("  - Creating chat_messages table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id UUID PRIMARY KEY,
            conversation_id UUID NOT NULL REFERENCES chat_conversations(id),
            role messagerole NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_chat_messages_id ON chat_messages(id);
        CREATE INDEX IF NOT EXISTS ix_chat_messages_conversation_id ON chat_messages(conversation_id);
    """)

    # Create transaction_tags association table
    print("  - Creating transaction_tags table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transaction_tags (
            transaction_id UUID NOT NULL REFERENCES transactions(id),
            tag_id UUID NOT NULL REFERENCES tags(id),
            PRIMARY KEY (transaction_id, tag_id)
        );
    """)

    # Update alembic_version to reflect the new migration
    print("  - Updating alembic_version...")
    cursor.execute("""
        INSERT INTO alembic_version (version_num)
        VALUES ('d8f2a1c9e3b4')
        ON CONFLICT (version_num) DO NOTHING;
    """)

    # Commit all changes
    conn.commit()

    print("\n✅ Migration completed successfully!")
    print("🎉 All tables created. You can now create accounts!")

except psycopg2.Error as e:
    print(f"\n❌ Database error: {e}")
    print("\n💡 Make sure PostgreSQL is running:")
    print("   - Check if the service is running")
    print("   - Verify connection details in .env.development")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ Error: {e}")
    sys.exit(1)
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
