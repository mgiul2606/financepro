"""Initial database schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2025-11-19

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =====================================================
    # CREATE ALL ENUM TYPES
    # =====================================================

    # User & Profile ENUMs
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE profiletype AS ENUM ('personal', 'family', 'business');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE databasetype AS ENUM ('postgresql', 'mssql');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Account ENUMs
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE accounttype AS ENUM ('checking', 'savings', 'credit_card', 'investment', 'cash', 'loan', 'other');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Transaction ENUMs - CORRECTED to match Python models!
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE transactiontype AS ENUM ('bank_transfer', 'withdrawal', 'payment', 'purchase', 'internal_transfer', 'income', 'asset_purchase', 'asset_sale', 'other');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE transactionsource AS ENUM ('manual', 'import_csv', 'import_ocr', 'import_api', 'recurring');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Asset ENUMs
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE assettype AS ENUM ('real_estate', 'vehicle', 'investment', 'other');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE valuationmethod AS ENUM ('manual', 'market_price', 'formula', 'api');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Recurring Transaction ENUMs - CORRECTED!
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE amountmodel AS ENUM ('fixed', 'variable_within_range', 'progressive', 'seasonal');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE occurrencestatus AS ENUM ('pending', 'executed', 'skipped', 'overridden');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Budget & Goal ENUMs
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE periodtype AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly', 'custom');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE goaltype AS ENUM ('savings', 'debt_reduction', 'investment', 'emergency_fund', 'purchase', 'retirement', 'education', 'other');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE goalstatus AS ENUM ('active', 'completed', 'paused', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Import ENUMs
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE importtype AS ENUM ('csv', 'excel', 'qif', 'ofx', 'api', 'manual');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE importstatus AS ENUM ('pending', 'processing', 'completed', 'failed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Audit Log ENUMs
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE eventtype AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'other');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE severitylevel AS ENUM ('debug', 'info', 'warning', 'error', 'critical');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Chat ENUMs
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE messagerole AS ENUM ('user', 'assistant', 'system');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Tag ENUMs
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE tagtype AS ENUM ('custom', 'system', 'ml_generated');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # =====================================================
    # CREATE TABLES
    # =====================================================

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Create financial_profiles table
    op.create_table(
        'financial_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('profile_type', postgresql.ENUM('personal', 'family', 'business', name='profiletype', create_type=False), nullable=False, server_default='personal'),
        sa.Column('default_currency', sa.String(length=3), nullable=False, server_default='EUR'),
        sa.Column('database_connection_string', sa.Text(), nullable=True),
        sa.Column('database_type', postgresql.ENUM('postgresql', 'mssql', name='databasetype', create_type=False), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('ix_financial_profiles_id', 'financial_profiles', ['id'])
    op.create_index('ix_financial_profiles_user_id', 'financial_profiles', ['user_id'])

    # Add main_profile_id to users (after financial_profiles exists)
    op.add_column('users', sa.Column('main_profile_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_users_main_profile', 'users', 'financial_profiles', ['main_profile_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_users_main_profile_id', 'users', ['main_profile_id'])

    # Create user_profile_selection table
    op.create_table(
        'user_profile_selection',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('selected_profile_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['selected_profile_id'], ['financial_profiles.id'], ondelete='SET NULL')
    )
    op.create_index('ix_user_profile_selection_id', 'user_profile_selection', ['id'])
    op.create_index('ix_user_profile_selection_user_id', 'user_profile_selection', ['user_id'], unique=True)

    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parent_category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_category_id'], ['categories.id'], ondelete='SET NULL')
    )
    op.create_index('ix_categories_id', 'categories', ['id'])
    op.create_index('ix_categories_financial_profile_id', 'categories', ['financial_profile_id'])

    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('tag_type', postgresql.ENUM('custom', 'system', 'ml_generated', name='tagtype', create_type=False), nullable=False, server_default='custom'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], ondelete='CASCADE')
    )
    op.create_index('ix_tags_id', 'tags', ['id'])
    op.create_index('ix_tags_financial_profile_id', 'tags', ['financial_profile_id'])

    # Create accounts table
    op.create_table(
        'accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('account_type', postgresql.ENUM('checking', 'savings', 'credit_card', 'investment', 'cash', 'loan', 'other', name='accounttype', create_type=False), nullable=False, server_default='checking'),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='EUR'),
        sa.Column('initial_balance', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0.00'),
        sa.Column('institution_name', sa.String(length=255), nullable=True),
        sa.Column('account_number', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], ondelete='CASCADE')
    )
    op.create_index('ix_accounts_id', 'accounts', ['id'])
    op.create_index('ix_accounts_financial_profile_id', 'accounts', ['financial_profile_id'])

    # Create exchange_rates table (needed before transactions)
    op.create_table(
        'exchange_rates',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('from_currency', sa.String(length=3), nullable=False),
        sa.Column('to_currency', sa.String(length=3), nullable=False),
        sa.Column('rate', sa.Numeric(precision=15, scale=6), nullable=False),
        sa.Column('rate_date', sa.Date(), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_exchange_rates_id', 'exchange_rates', ['id'])
    op.create_index('ix_exchange_rates_currencies_date', 'exchange_rates', ['from_currency', 'to_currency', 'rate_date'], unique=True)

    # Create recurring_transactions table (needed before transactions)
    op.create_table(
        'recurring_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('amount_model', postgresql.ENUM('fixed', 'variable_within_range', 'progressive', 'seasonal', name='amountmodel', create_type=False), nullable=False, server_default='fixed'),
        sa.Column('base_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('min_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('max_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('frequency', postgresql.ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom', name='frequency', create_type=False), nullable=False, server_default='monthly'),
        sa.Column('custom_interval_days', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('next_occurrence_date', sa.Date(), nullable=False),
        sa.Column('calculation_formula', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notification_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notification_days_before', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('anomaly_threshold_percentage', sa.Numeric(precision=5, scale=2), nullable=False, server_default='20.00'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL')
    )
    op.create_index('ix_recurring_transactions_id', 'recurring_transactions', ['id'])
    op.create_index('ix_recurring_transactions_account_id', 'recurring_transactions', ['account_id'])
    op.create_index('ix_recurring_transactions_next_occurrence_date', 'recurring_transactions', ['next_occurrence_date'])

    # Create transactions table - CORRECTED!
    op.create_table(
        'transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('recurring_transaction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('transaction_type', postgresql.ENUM('bank_transfer', 'withdrawal', 'payment', 'purchase', 'internal_transfer', 'income', 'asset_purchase', 'asset_sale', 'other', name='transactiontype', create_type=False), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('exchange_rate_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('amount_in_profile_currency', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('merchant_name', sa.String(length=255), nullable=True),
        sa.Column('merchant_normalized', sa.String(length=255), nullable=True),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('value_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_reconciled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('receipt_url', sa.String(length=500), nullable=True),
        sa.Column('created_by', postgresql.ENUM('manual', 'import_csv', 'import_ocr', 'import_api', 'recurring', name='transactionsource', create_type=False), nullable=False, server_default='manual'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['recurring_transaction_id'], ['recurring_transactions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['exchange_rate_id'], ['exchange_rates.id'], ondelete='SET NULL')
    )
    op.create_index('ix_transactions_id', 'transactions', ['id'])
    op.create_index('ix_transactions_account_id', 'transactions', ['account_id'])
    op.create_index('ix_transactions_transaction_date', 'transactions', ['transaction_date'])
    op.create_index('ix_transactions_transaction_type', 'transactions', ['transaction_type'])
    op.create_index('ix_transactions_merchant_normalized', 'transactions', ['merchant_normalized'])

    # Create recurring_transaction_occurrences table
    op.create_table(
        'recurring_transaction_occurrences',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recurring_transaction_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('scheduled_date', sa.Date(), nullable=False),
        sa.Column('expected_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('actual_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('status', postgresql.ENUM('pending', 'executed', 'skipped', 'overridden', name='occurrencestatus', create_type=False), nullable=False, server_default='pending'),
        sa.Column('is_anomaly', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['recurring_transaction_id'], ['recurring_transactions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='SET NULL')
    )
    op.create_index('ix_recurring_transaction_occurrences_id', 'recurring_transaction_occurrences', ['id'])
    op.create_index('ix_recurring_transaction_occurrences_recurring_transaction_id', 'recurring_transaction_occurrences', ['recurring_transaction_id'])
    op.create_index('ix_recurring_transaction_occurrences_scheduled_date', 'recurring_transaction_occurrences', ['scheduled_date'])

    # Create transaction_tags association table
    op.create_table(
        'transaction_tags',
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('transaction_id', 'tag_id')
    )

    # Create budgets table
    op.create_table(
        'budgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='EUR'),
        sa.Column('period_type', postgresql.ENUM('weekly', 'monthly', 'quarterly', 'yearly', 'custom', name='periodtype', create_type=False), nullable=False, server_default='monthly'),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('alert_threshold', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL')
    )
    op.create_index('ix_budgets_id', 'budgets', ['id'])
    op.create_index('ix_budgets_financial_profile_id', 'budgets', ['financial_profile_id'])

    # Create financial_goals table
    op.create_table(
        'financial_goals',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('goal_type', postgresql.ENUM('savings', 'debt_reduction', 'investment', 'emergency_fund', 'purchase', 'retirement', 'education', 'other', name='goaltype', create_type=False), nullable=False, server_default='savings'),
        sa.Column('target_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('current_amount', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0.00'),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='EUR'),
        sa.Column('target_date', sa.Date(), nullable=True),
        sa.Column('status', postgresql.ENUM('active', 'completed', 'paused', 'cancelled', name='goalstatus', create_type=False), nullable=False, server_default='active'),
        sa.Column('is_achieved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], ondelete='CASCADE')
    )
    op.create_index('ix_financial_goals_id', 'financial_goals', ['id'])
    op.create_index('ix_financial_goals_financial_profile_id', 'financial_goals', ['financial_profile_id'])

    # Create assets table
    op.create_table(
        'assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('asset_type', postgresql.ENUM('real_estate', 'vehicle', 'investment', 'other', name='assettype', create_type=False), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('purchase_value', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('current_value', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='EUR'),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('valuation_method', postgresql.ENUM('manual', 'market_price', 'formula', 'api', name='valuationmethod', create_type=False), nullable=False, server_default='manual'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], ondelete='CASCADE')
    )
    op.create_index('ix_assets_id', 'assets', ['id'])
    op.create_index('ix_assets_financial_profile_id', 'assets', ['financial_profile_id'])

    # Create import_jobs table
    op.create_table(
        'import_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('import_type', postgresql.ENUM('csv', 'excel', 'qif', 'ofx', 'api', 'manual', name='importtype', create_type=False), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'processing', 'completed', 'failed', name='importstatus', create_type=False), nullable=False, server_default='pending'),
        sa.Column('total_rows', sa.Integer(), nullable=True),
        sa.Column('processed_rows', sa.Integer(), nullable=True),
        sa.Column('successful_imports', sa.Integer(), nullable=True),
        sa.Column('failed_imports', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='SET NULL')
    )
    op.create_index('ix_import_jobs_id', 'import_jobs', ['id'])
    op.create_index('ix_import_jobs_financial_profile_id', 'import_jobs', ['financial_profile_id'])

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('event_type', postgresql.ENUM('create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'other', name='eventtype', create_type=False), nullable=False),
        sa.Column('severity', postgresql.ENUM('debug', 'info', 'warning', 'error', 'critical', name='severitylevel', create_type=False), nullable=False, server_default='info'),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('old_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], ondelete='SET NULL')
    )
    op.create_index('ix_audit_logs_id', 'audit_logs', ['id'])
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])

    # Create ml_classification_logs table
    op.create_table(
        'ml_classification_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('original_description', sa.Text(), nullable=False),
        sa.Column('suggested_category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('confidence_score', sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column('was_accepted', sa.Boolean(), nullable=True),
        sa.Column('actual_category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('model_version', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['suggested_category_id'], ['categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['actual_category_id'], ['categories.id'], ondelete='SET NULL')
    )
    op.create_index('ix_ml_classification_logs_id', 'ml_classification_logs', ['id'])
    op.create_index('ix_ml_classification_logs_transaction_id', 'ml_classification_logs', ['transaction_id'])

    # Create chat_conversations table
    op.create_table(
        'chat_conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], ondelete='SET NULL')
    )
    op.create_index('ix_chat_conversations_id', 'chat_conversations', ['id'])
    op.create_index('ix_chat_conversations_user_id', 'chat_conversations', ['user_id'])

    # Create chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', postgresql.ENUM('user', 'assistant', 'system', name='messagerole', create_type=False), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['conversation_id'], ['chat_conversations.id'], ondelete='CASCADE')
    )
    op.create_index('ix_chat_messages_id', 'chat_messages', ['id'])
    op.create_index('ix_chat_messages_conversation_id', 'chat_messages', ['conversation_id'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('ix_chat_messages_conversation_id', 'chat_messages')
    op.drop_index('ix_chat_messages_id', 'chat_messages')
    op.drop_table('chat_messages')

    op.drop_index('ix_chat_conversations_user_id', 'chat_conversations')
    op.drop_index('ix_chat_conversations_id', 'chat_conversations')
    op.drop_table('chat_conversations')

    op.drop_index('ix_ml_classification_logs_transaction_id', 'ml_classification_logs')
    op.drop_index('ix_ml_classification_logs_id', 'ml_classification_logs')
    op.drop_table('ml_classification_logs')

    op.drop_index('ix_audit_logs_created_at', 'audit_logs')
    op.drop_index('ix_audit_logs_user_id', 'audit_logs')
    op.drop_index('ix_audit_logs_id', 'audit_logs')
    op.drop_table('audit_logs')

    op.drop_index('ix_import_jobs_financial_profile_id', 'import_jobs')
    op.drop_index('ix_import_jobs_id', 'import_jobs')
    op.drop_table('import_jobs')

    op.drop_index('ix_assets_financial_profile_id', 'assets')
    op.drop_index('ix_assets_id', 'assets')
    op.drop_table('assets')

    op.drop_index('ix_financial_goals_financial_profile_id', 'financial_goals')
    op.drop_index('ix_financial_goals_id', 'financial_goals')
    op.drop_table('financial_goals')

    op.drop_index('ix_budgets_financial_profile_id', 'budgets')
    op.drop_index('ix_budgets_id', 'budgets')
    op.drop_table('budgets')

    op.drop_table('transaction_tags')

    op.drop_index('ix_recurring_transaction_occurrences_scheduled_date', 'recurring_transaction_occurrences')
    op.drop_index('ix_recurring_transaction_occurrences_recurring_transaction_id', 'recurring_transaction_occurrences')
    op.drop_index('ix_recurring_transaction_occurrences_id', 'recurring_transaction_occurrences')
    op.drop_table('recurring_transaction_occurrences')

    op.drop_index('ix_transactions_merchant_normalized', 'transactions')
    op.drop_index('ix_transactions_transaction_type', 'transactions')
    op.drop_index('ix_transactions_transaction_date', 'transactions')
    op.drop_index('ix_transactions_account_id', 'transactions')
    op.drop_index('ix_transactions_id', 'transactions')
    op.drop_table('transactions')

    op.drop_index('ix_recurring_transactions_next_occurrence_date', 'recurring_transactions')
    op.drop_index('ix_recurring_transactions_account_id', 'recurring_transactions')
    op.drop_index('ix_recurring_transactions_id', 'recurring_transactions')
    op.drop_table('recurring_transactions')

    op.drop_index('ix_exchange_rates_currencies_date', 'exchange_rates')
    op.drop_index('ix_exchange_rates_id', 'exchange_rates')
    op.drop_table('exchange_rates')

    op.drop_index('ix_accounts_financial_profile_id', 'accounts')
    op.drop_index('ix_accounts_id', 'accounts')
    op.drop_table('accounts')

    op.drop_index('ix_tags_financial_profile_id', 'tags')
    op.drop_index('ix_tags_id', 'tags')
    op.drop_table('tags')

    op.drop_index('ix_categories_financial_profile_id', 'categories')
    op.drop_index('ix_categories_id', 'categories')
    op.drop_table('categories')

    op.drop_index('ix_user_profile_selection_user_id', 'user_profile_selection')
    op.drop_index('ix_user_profile_selection_id', 'user_profile_selection')
    op.drop_table('user_profile_selection')

    op.drop_index('ix_users_main_profile_id', 'users')
    op.drop_constraint('fk_users_main_profile', 'users', type_='foreignkey')
    op.drop_column('users', 'main_profile_id')

    op.drop_index('ix_financial_profiles_user_id', 'financial_profiles')
    op.drop_index('ix_financial_profiles_id', 'financial_profiles')
    op.drop_table('financial_profiles')

    op.drop_index('ix_users_email', 'users')
    op.drop_index('ix_users_id', 'users')
    op.drop_table('users')

    # Drop ENUM types
    op.execute('DROP TYPE IF EXISTS tagtype')
    op.execute('DROP TYPE IF EXISTS messagerole')
    op.execute('DROP TYPE IF EXISTS severitylevel')
    op.execute('DROP TYPE IF EXISTS eventtype')
    op.execute('DROP TYPE IF EXISTS importstatus')
    op.execute('DROP TYPE IF EXISTS importtype')
    op.execute('DROP TYPE IF EXISTS goalstatus')
    op.execute('DROP TYPE IF EXISTS goaltype')
    op.execute('DROP TYPE IF EXISTS periodtype')
    op.execute('DROP TYPE IF EXISTS occurrencestatus')
    op.execute('DROP TYPE IF EXISTS frequency')
    op.execute('DROP TYPE IF EXISTS amountmodel')
    op.execute('DROP TYPE IF EXISTS valuationmethod')
    op.execute('DROP TYPE IF EXISTS assettype')
    op.execute('DROP TYPE IF EXISTS transactionsource')
    op.execute('DROP TYPE IF EXISTS transactiontype')
    op.execute('DROP TYPE IF EXISTS accounttype')
    op.execute('DROP TYPE IF EXISTS databasetype')
    op.execute('DROP TYPE IF EXISTS profiletype')
