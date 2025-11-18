"""fix_all_database_inconsistencies

Revision ID: f1a2b3c4d5e6
Revises: e9a3c5f7b2d1
Create Date: 2025-11-18 00:00:00.000000

This migration fixes ALL database inconsistencies identified in the audit:
1. users.id: INTEGER -> UUID (CRITICAL)
2. TransactionType enum: Align values with model
3. CategoryType enum: Remove or align with model
4. BudgetPeriod enum: Add missing values
5. FinancialGoal: Add missing fields
6. ChatConversation: Add user_id field
7. Tag: Add tag_type field
8. transaction_tags: Add created_at field
9. Create missing tables: budget_categories, goal_milestones, recurring_transaction_occurrences, asset_valuations

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'e9a3c5f7b2d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    IMPORTANT: This migration will DROP and RECREATE all tables with correct schema.
    Backup your data before running!
    """

    # ========================================
    # STEP 1: DROP ALL TABLES (in reverse FK order)
    # ========================================
    op.execute("DROP TABLE IF EXISTS transaction_tags CASCADE")
    op.execute("DROP TABLE IF EXISTS chat_messages CASCADE")
    op.execute("DROP TABLE IF EXISTS chat_conversations CASCADE")
    op.execute("DROP TABLE IF EXISTS ml_classification_logs CASCADE")
    op.execute("DROP TABLE IF EXISTS exchange_rates CASCADE")
    op.execute("DROP TABLE IF EXISTS audit_logs CASCADE")
    op.execute("DROP TABLE IF EXISTS import_jobs CASCADE")
    op.execute("DROP TABLE IF EXISTS recurring_transactions CASCADE")
    op.execute("DROP TABLE IF EXISTS assets CASCADE")
    op.execute("DROP TABLE IF EXISTS financial_goals CASCADE")
    op.execute("DROP TABLE IF EXISTS budgets CASCADE")
    op.execute("DROP TABLE IF EXISTS transactions CASCADE")
    op.execute("DROP TABLE IF EXISTS accounts CASCADE")
    op.execute("DROP TABLE IF EXISTS tags CASCADE")
    op.execute("DROP TABLE IF EXISTS categories CASCADE")
    op.execute("DROP TABLE IF EXISTS user_profile_selections CASCADE")
    op.execute("DROP TABLE IF EXISTS financial_profiles CASCADE")
    op.execute("DROP TABLE IF EXISTS users CASCADE")

    # ========================================
    # STEP 2: DROP ALL ENUMS
    # ========================================
    op.execute("DROP TYPE IF EXISTS messagerole CASCADE")
    op.execute("DROP TYPE IF EXISTS recurrencefrequency CASCADE")
    op.execute("DROP TYPE IF EXISTS importstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS importtype CASCADE")
    op.execute("DROP TYPE IF EXISTS goalpriority CASCADE")
    op.execute("DROP TYPE IF EXISTS goalstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS goaltype CASCADE")
    op.execute("DROP TYPE IF EXISTS budgetperiod CASCADE")
    op.execute("DROP TYPE IF EXISTS periodtype CASCADE")
    op.execute("DROP TYPE IF EXISTS transactiontype CASCADE")
    op.execute("DROP TYPE IF EXISTS transactionsource CASCADE")
    op.execute("DROP TYPE IF EXISTS categorytype CASCADE")
    op.execute("DROP TYPE IF EXISTS accounttype CASCADE")
    op.execute("DROP TYPE IF EXISTS databasetype CASCADE")
    op.execute("DROP TYPE IF EXISTS profiletype CASCADE")
    op.execute("DROP TYPE IF EXISTS eventtype CASCADE")
    op.execute("DROP TYPE IF EXISTS severitylevel CASCADE")
    op.execute("DROP TYPE IF EXISTS tagtype CASCADE")
    op.execute("DROP TYPE IF EXISTS assettype CASCADE")
    op.execute("DROP TYPE IF EXISTS valuationmethod CASCADE")
    op.execute("DROP TYPE IF EXISTS amountmodel CASCADE")
    op.execute("DROP TYPE IF EXISTS frequency CASCADE")
    op.execute("DROP TYPE IF EXISTS occurrencestatus CASCADE")

    # ========================================
    # STEP 3: CREATE ALL ENUMS (with correct values)
    # ========================================

    # ProfileType
    op.execute("CREATE TYPE profiletype AS ENUM ('personal', 'family', 'business')")

    # DatabaseType
    op.execute("CREATE TYPE databasetype AS ENUM ('postgresql', 'mssql')")

    # AccountType
    op.execute("CREATE TYPE accounttype AS ENUM ('checking', 'savings', 'credit_card', 'investment', 'cash', 'loan', 'other')")

    # TransactionType - CORRECTED VALUES
    op.execute("CREATE TYPE transactiontype AS ENUM ('bank_transfer', 'withdrawal', 'payment', 'purchase', 'internal_transfer', 'income', 'asset_purchase', 'asset_sale', 'other')")

    # TransactionSource
    op.execute("CREATE TYPE transactionsource AS ENUM ('manual', 'import_csv', 'import_ocr', 'import_api', 'recurring')")

    # PeriodType - CORRECTED VALUES (was budgetperiod)
    op.execute("CREATE TYPE periodtype AS ENUM ('monthly', 'quarterly', 'yearly', 'custom')")

    # GoalType
    op.execute("CREATE TYPE goaltype AS ENUM ('house', 'car', 'vacation', 'retirement', 'emergency_fund', 'education', 'investment', 'custom')")

    # GoalStatus
    op.execute("CREATE TYPE goalstatus AS ENUM ('active', 'paused', 'completed', 'cancelled')")

    # ImportType
    op.execute("CREATE TYPE importtype AS ENUM ('csv', 'ocr', 'bank_api')")

    # ImportStatus
    op.execute("CREATE TYPE importstatus AS ENUM ('pending', 'processing', 'completed', 'failed')")

    # EventType
    op.execute("CREATE TYPE eventtype AS ENUM ('access', 'security', 'financial_op', 'ai_interaction', 'system')")

    # SeverityLevel
    op.execute("CREATE TYPE severitylevel AS ENUM ('info', 'warning', 'error', 'critical')")

    # MessageRole
    op.execute("CREATE TYPE messagerole AS ENUM ('user', 'assistant', 'system')")

    # TagType - NEW
    op.execute("CREATE TYPE tagtype AS ENUM ('contextual', 'functional', 'temporal', 'emotional')")

    # AssetType
    op.execute("CREATE TYPE assettype AS ENUM ('real_estate', 'vehicle', 'precious_metal', 'investment', 'artwork', 'jewelry', 'other')")

    # ValuationMethod
    op.execute("CREATE TYPE valuationmethod AS ENUM ('market_quote', 'range', 'comparative', 'manual')")

    # AmountModel
    op.execute("CREATE TYPE amountmodel AS ENUM ('fixed', 'variable_within_range', 'progressive', 'seasonal')")

    # Frequency
    op.execute("CREATE TYPE frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom')")

    # OccurrenceStatus
    op.execute("CREATE TYPE occurrencestatus AS ENUM ('pending', 'executed', 'skipped', 'overridden')")

    # ========================================
    # STEP 4: CREATE USERS TABLE (with UUID)
    # ========================================
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.Column('main_profile_id', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # ========================================
    # STEP 5: CREATE FINANCIAL_PROFILES TABLE
    # ========================================
    op.create_table(
        'financial_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('profile_type', postgresql.ENUM('personal', 'family', 'business', name='profiletype'), nullable=False, server_default='personal'),
        sa.Column('default_currency', sa.String(3), nullable=False, server_default='EUR'),
        sa.Column('database_connection_string', sa.Text(), nullable=True),
        sa.Column('database_type', postgresql.ENUM('postgresql', 'mssql', name='databasetype'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_financial_profiles_id', 'financial_profiles', ['id'])
    op.create_index('ix_financial_profiles_user_id', 'financial_profiles', ['user_id'])

    # Now add FK constraint to users.main_profile_id
    op.create_foreign_key(
        'fk_users_main_profile_id',
        'users', 'financial_profiles',
        ['main_profile_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_users_main_profile_id', 'users', ['main_profile_id'])

    # ========================================
    # STEP 6: CREATE USER_PROFILE_SELECTIONS TABLE
    # ========================================
    op.create_table(
        'user_profile_selections',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        sa.Column('active_profile_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_user_profile_selections_id', 'user_profile_selections', ['id'])

    # ========================================
    # STEP 7: CREATE CATEGORIES TABLE
    # ========================================
    op.create_table(
        'categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('parent_category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('full_path', sa.String(500), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_categories_id', 'categories', ['id'])

    # ========================================
    # STEP 8: CREATE TAGS TABLE (with tag_type)
    # ========================================
    op.create_table(
        'tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('tag_type', postgresql.ENUM('contextual', 'functional', 'temporal', 'emotional', name='tagtype'), nullable=False, index=True),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_tags_id', 'tags', ['id'])

    # ========================================
    # STEP 9: CREATE ACCOUNTS TABLE
    # ========================================
    op.create_table(
        'accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('account_type', postgresql.ENUM('checking', 'savings', 'credit_card', 'investment', 'cash', 'loan', 'other', name='accounttype'), nullable=False, server_default='checking'),
        sa.Column('currency', sa.String(3), nullable=False, server_default='EUR'),
        sa.Column('initial_balance', sa.Numeric(15, 2), nullable=False, server_default='0.00'),
        sa.Column('institution_name', sa.String(255), nullable=True),
        sa.Column('account_number', sa.String(255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_accounts_id', 'accounts', ['id'])

    # ========================================
    # STEP 10: CREATE EXCHANGE_RATES TABLE
    # ========================================
    op.create_table(
        'exchange_rates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('from_currency', sa.String(3), nullable=False),
        sa.Column('to_currency', sa.String(3), nullable=False),
        sa.Column('rate', sa.Numeric(18, 8), nullable=False),
        sa.Column('date', sa.Date(), nullable=False, index=True),
        sa.Column('source', sa.String(100), nullable=False, server_default='Manual'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_exchange_rates_id', 'exchange_rates', ['id'])
    op.create_index('ix_exchange_rates_currency_date', 'exchange_rates', ['from_currency', 'to_currency', 'date'])

    # ========================================
    # STEP 11: CREATE TRANSACTIONS TABLE
    # ========================================
    op.create_table(
        'transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('recurring_transaction_id', postgresql.UUID(as_uuid=True), nullable=True),  # FK added later
        sa.Column('transaction_type', postgresql.ENUM('bank_transfer', 'withdrawal', 'payment', 'purchase', 'internal_transfer', 'income', 'asset_purchase', 'asset_sale', 'other', name='transactiontype'), nullable=False, index=True),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False),
        sa.Column('exchange_rate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('exchange_rates.id', ondelete='SET NULL'), nullable=True),
        sa.Column('amount_in_profile_currency', sa.Numeric(15, 2), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('merchant_name', sa.String(255), nullable=True),
        sa.Column('merchant_normalized', sa.String(255), nullable=True, index=True),
        sa.Column('transaction_date', sa.Date(), nullable=False, index=True),
        sa.Column('value_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_reconciled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('receipt_url', sa.String(500), nullable=True),
        sa.Column('created_by', postgresql.ENUM('manual', 'import_csv', 'import_ocr', 'import_api', 'recurring', name='transactionsource'), nullable=False, server_default='manual'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_transactions_id', 'transactions', ['id'])
    op.create_index('ix_transactions_transaction_date', 'transactions', ['transaction_date'])

    # ========================================
    # STEP 12: CREATE TRANSACTION_TAGS TABLE (with created_at)
    # ========================================
    op.create_table(
        'transaction_tags',
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('transactions.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )

    # ========================================
    # STEP 13: CREATE BUDGETS TABLE
    # ========================================
    op.create_table(
        'budgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('period_type', postgresql.ENUM('monthly', 'quarterly', 'yearly', 'custom', name='periodtype'), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False, index=True),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='EUR'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('alert_threshold_percentage', sa.Numeric(5, 2), nullable=False, server_default='80.00'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_budgets_id', 'budgets', ['id'])

    # ========================================
    # STEP 14: CREATE BUDGET_CATEGORIES TABLE (NEW!)
    # ========================================
    op.create_table(
        'budget_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('budget_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('budgets.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('allocated_amount', sa.Numeric(15, 2), nullable=False),
    )
    op.create_index('ix_budget_categories_id', 'budget_categories', ['id'])

    # ========================================
    # STEP 15: CREATE FINANCIAL_GOALS TABLE (with all fields)
    # ========================================
    op.create_table(
        'financial_goals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('goal_type', postgresql.ENUM('house', 'car', 'vacation', 'retirement', 'emergency_fund', 'education', 'investment', 'custom', name='goaltype'), nullable=False),
        sa.Column('target_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('current_amount', sa.Numeric(15, 2), nullable=False, server_default='0.00'),
        sa.Column('target_date', sa.Date(), nullable=False),
        sa.Column('monthly_contribution', sa.Numeric(15, 2), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('status', postgresql.ENUM('active', 'paused', 'completed', 'cancelled', name='goalstatus'), nullable=False, server_default='active'),
        sa.Column('achievement_probability', sa.Numeric(5, 2), nullable=True),
        sa.Column('gamification_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_financial_goals_id', 'financial_goals', ['id'])

    # ========================================
    # STEP 16: CREATE GOAL_MILESTONES TABLE (NEW!)
    # ========================================
    op.create_table(
        'goal_milestones',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('goal_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_goals.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('target_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('target_date', sa.Date(), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_goal_milestones_id', 'goal_milestones', ['id'])

    # ========================================
    # STEP 17: CREATE ASSETS TABLE
    # ========================================
    op.create_table(
        'assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('asset_type', postgresql.ENUM('real_estate', 'vehicle', 'precious_metal', 'investment', 'artwork', 'jewelry', 'other', name='assettype'), nullable=False, index=True),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('purchase_price', sa.Numeric(15, 2), nullable=True),
        sa.Column('current_value', sa.Numeric(15, 2), nullable=False),
        sa.Column('current_value_min', sa.Numeric(15, 2), nullable=True),
        sa.Column('current_value_max', sa.Numeric(15, 2), nullable=True),
        sa.Column('valuation_method', postgresql.ENUM('market_quote', 'range', 'comparative', 'manual', name='valuationmethod'), nullable=False, server_default='manual'),
        sa.Column('currency', sa.String(3), nullable=False),
        sa.Column('is_liquid', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_assets_id', 'assets', ['id'])

    # ========================================
    # STEP 18: CREATE ASSET_VALUATIONS TABLE (NEW!)
    # ========================================
    op.create_table(
        'asset_valuations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assets.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('valuation_date', sa.Date(), nullable=False, index=True),
        sa.Column('value', sa.Numeric(15, 2), nullable=False),
        sa.Column('value_min', sa.Numeric(15, 2), nullable=True),
        sa.Column('value_max', sa.Numeric(15, 2), nullable=True),
        sa.Column('source', sa.String(255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_asset_valuations_id', 'asset_valuations', ['id'])

    # ========================================
    # STEP 19: CREATE RECURRING_TRANSACTIONS TABLE
    # ========================================
    op.create_table(
        'recurring_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('amount_model', postgresql.ENUM('fixed', 'variable_within_range', 'progressive', 'seasonal', name='amountmodel'), nullable=False, server_default='fixed'),
        sa.Column('base_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('min_amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('max_amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('frequency', postgresql.ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom', name='frequency'), nullable=False, server_default='monthly'),
        sa.Column('custom_interval_days', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('next_occurrence_date', sa.Date(), nullable=False, index=True),
        sa.Column('calculation_formula', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notification_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notification_days_before', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('anomaly_threshold_percentage', sa.Numeric(5, 2), nullable=False, server_default='20.00'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_recurring_transactions_id', 'recurring_transactions', ['id'])

    # Now add FK to transactions.recurring_transaction_id
    op.create_foreign_key(
        'fk_transactions_recurring_transaction_id',
        'transactions', 'recurring_transactions',
        ['recurring_transaction_id'], ['id'],
        ondelete='SET NULL'
    )

    # ========================================
    # STEP 20: CREATE RECURRING_TRANSACTION_OCCURRENCES TABLE (NEW!)
    # ========================================
    op.create_table(
        'recurring_transaction_occurrences',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('recurring_transaction_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('recurring_transactions.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('transactions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('scheduled_date', sa.Date(), nullable=False, index=True),
        sa.Column('expected_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('actual_amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('status', postgresql.ENUM('pending', 'executed', 'skipped', 'overridden', name='occurrencestatus'), nullable=False, server_default='pending'),
        sa.Column('is_anomaly', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_recurring_transaction_occurrences_id', 'recurring_transaction_occurrences', ['id'])

    # ========================================
    # STEP 21: CREATE IMPORT_JOBS TABLE
    # ========================================
    op.create_table(
        'import_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('import_type', postgresql.ENUM('csv', 'ocr', 'bank_api', name='importtype'), nullable=False, index=True),
        sa.Column('file_name', sa.String(255), nullable=True),
        sa.Column('file_url', sa.String(500), nullable=True),
        sa.Column('status', postgresql.ENUM('pending', 'processing', 'completed', 'failed', name='importstatus'), nullable=False, server_default='pending', index=True),
        sa.Column('total_records', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('processed_records', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('successful_records', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failed_records', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_details', postgresql.JSONB(), nullable=True),
        sa.Column('mapping_config', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_import_jobs_id', 'import_jobs', ['id'])

    # ========================================
    # STEP 22: CREATE AUDIT_LOGS TABLE
    # ========================================
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('event_type', postgresql.ENUM('access', 'security', 'financial_op', 'ai_interaction', 'system', name='eventtype'), nullable=False, index=True),
        sa.Column('entity_type', sa.String(100), nullable=True, index=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column('action', sa.String(50), nullable=False, index=True),
        sa.Column('details', postgresql.JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('device_info', sa.String(255), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), index=True),
        sa.Column('severity', postgresql.ENUM('info', 'warning', 'error', 'critical', name='severitylevel'), nullable=False, server_default='info', index=True),
    )
    op.create_index('ix_audit_logs_id', 'audit_logs', ['id'])

    # ========================================
    # STEP 23: CREATE ML_CLASSIFICATION_LOGS TABLE
    # ========================================
    op.create_table(
        'ml_classification_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('predicted_category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id', ondelete='SET NULL'), nullable=False, index=True),
        sa.Column('corrected_category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('model_version', sa.String(50), nullable=False, index=True),
        sa.Column('confidence_score', sa.Numeric(5, 4), nullable=False),
        sa.Column('was_accepted', sa.Boolean(), nullable=False, server_default='false', index=True),
        sa.Column('features_used', postgresql.JSONB(), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), index=True),
    )
    op.create_index('ix_ml_classification_logs_id', 'ml_classification_logs', ['id'])

    # ========================================
    # STEP 24: CREATE CHAT_CONVERSATIONS TABLE (with user_id)
    # ========================================
    op.create_table(
        'chat_conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), index=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_chat_conversations_id', 'chat_conversations', ['id'])

    # ========================================
    # STEP 25: CREATE CHAT_MESSAGES TABLE
    # ========================================
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chat_conversations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('role', postgresql.ENUM('user', 'assistant', 'system', name='messagerole'), nullable=False, index=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('message_metadata', postgresql.JSONB(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'), index=True),
    )
    op.create_index('ix_chat_messages_id', 'chat_messages', ['id'])


def downgrade() -> None:
    """
    Downgrade reverts to the previous schema.
    WARNING: This will drop all tables and data!
    """
    # Drop all tables in reverse order
    op.drop_table('chat_messages')
    op.drop_table('chat_conversations')
    op.drop_table('ml_classification_logs')
    op.drop_table('audit_logs')
    op.drop_table('import_jobs')
    op.drop_table('recurring_transaction_occurrences')
    op.drop_table('recurring_transactions')
    op.drop_table('asset_valuations')
    op.drop_table('assets')
    op.drop_table('goal_milestones')
    op.drop_table('financial_goals')
    op.drop_table('budget_categories')
    op.drop_table('budgets')
    op.drop_table('transaction_tags')
    op.drop_table('transactions')
    op.drop_table('accounts')
    op.drop_table('tags')
    op.drop_table('categories')
    op.drop_table('user_profile_selections')
    op.drop_table('financial_profiles')
    op.drop_table('users')

    # Drop all enums
    op.execute('DROP TYPE IF EXISTS messagerole')
    op.execute('DROP TYPE IF EXISTS severitylevel')
    op.execute('DROP TYPE IF EXISTS eventtype')
    op.execute('DROP TYPE IF EXISTS importstatus')
    op.execute('DROP TYPE IF EXISTS importtype')
    op.execute('DROP TYPE IF EXISTS occurrencestatus')
    op.execute('DROP TYPE IF EXISTS frequency')
    op.execute('DROP TYPE IF EXISTS amountmodel')
    op.execute('DROP TYPE IF EXISTS valuationmethod')
    op.execute('DROP TYPE IF EXISTS assettype')
    op.execute('DROP TYPE IF EXISTS goalstatus')
    op.execute('DROP TYPE IF EXISTS goaltype')
    op.execute('DROP TYPE IF EXISTS periodtype')
    op.execute('DROP TYPE IF EXISTS transactionsource')
    op.execute('DROP TYPE IF EXISTS transactiontype')
    op.execute('DROP TYPE IF EXISTS tagtype')
    op.execute('DROP TYPE IF EXISTS accounttype')
    op.execute('DROP TYPE IF EXISTS databasetype')
    op.execute('DROP TYPE IF EXISTS profiletype')
