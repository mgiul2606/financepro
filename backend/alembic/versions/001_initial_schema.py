"""Final Revised Database Schema for FinancePro v2.1

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-11-20

MAJOR CHANGES from v2.0:
1. Categories: USER-level, SINGLE-level (no hierarchy)
2. Tags: USER-level
3. Budgets: USER-level with scope (user/profile/multi_profile)
4. Financial Goals: USER-level with scope
5. AI Recommendations: USER-level with scope
6. Calendar Events: REMOVED (use recurring_transactions + future transactions)
7. Assets: Remain PROFILE-level (legal ownership)
8. Category Profile Preferences: ADDED (optional customization per profile)

ARCHITECTURE:
- Single PostgreSQL database
- Row Level Security (RLS) on all sensitive tables
- High-Security profiles with encrypted fields
- User-owned, Profile-scoped pattern for cross-profile analysis

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
    profiletype = postgresql.ENUM('personal', 'family', 'business', name='profiletype', create_type=False)
    profiletype.create(op.get_bind(), checkfirst=True)
    
    securitylevel = postgresql.ENUM('standard', 'high_security', name='securitylevel', create_type=False)
    securitylevel.create(op.get_bind(), checkfirst=True)
    
    # Scope type for user-owned entities
    scopetype = postgresql.ENUM('user', 'profile', 'multi_profile', name='scopetype', create_type=False)
    scopetype.create(op.get_bind(), checkfirst=True)

    # Account ENUMs
    accounttype = postgresql.ENUM(
        'checking', 'savings', 'credit_card', 'investment', 
        'cash', 'loan', 'mortgage', 'other', 
        name='accounttype',
        create_type=False
    )
    accounttype.create(op.get_bind(), checkfirst=True)

    # Transaction ENUMs
    transactiontype = postgresql.ENUM(
        'bank_transfer', 'withdrawal', 'payment', 'purchase', 
        'internal_transfer', 'income', 'salary', 'invoice', 
        'asset_purchase', 'asset_sale', 'dividend', 'interest',
        'loan_payment', 'refund', 'fee', 'tax', 'other',
        name='transactiontype', create_type=False
    )
    transactiontype.create(op.get_bind(), checkfirst=True)
    
    transactionsource = postgresql.ENUM(
        'manual', 'import_csv', 'import_ocr', 'import_api', 
        'recurring', 'bank_sync',
        name='transactionsource', create_type=False
    )
    transactionsource.create(op.get_bind(), checkfirst=True)

    # Asset ENUMs
    assettype = postgresql.ENUM(
        'real_estate', 'vehicle', 'precious_metal', 'stock', 'bond',
        'fund', 'etf', 'crypto', 'artwork', 'jewelry', 'watch', 'other',
        name='assettype', create_type=False
    )
    assettype.create(op.get_bind(), checkfirst=True)
    
    valuationmethod = postgresql.ENUM(
        'market_quote', 'range', 'comparative', 'manual', 'appraisal',
        name='valuationmethod', create_type=False
    )
    valuationmethod.create(op.get_bind(), checkfirst=True)

    # Recurring Transaction ENUMs
    amountmodel = postgresql.ENUM(
        'fixed', 'variable_within_range', 'progressive', 'seasonal', 'formula',
        name='amountmodel', create_type=False
    )
    amountmodel.create(op.get_bind(), checkfirst=True)
    
    frequency = postgresql.ENUM(
        'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 
        'semiannually', 'yearly', 'custom',
        name='frequency', create_type=False
    )
    frequency.create(op.get_bind(), checkfirst=True)
    
    occurrencestatus = postgresql.ENUM(
        'pending', 'executed', 'skipped', 'overridden', 'failed',
        name='occurrencestatus', create_type=False
    )
    occurrencestatus.create(op.get_bind(), checkfirst=True)

    # Budget & Goal ENUMs
    periodtype = postgresql.ENUM(
        'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom',
        name='periodtype', create_type=False
    )
    periodtype.create(op.get_bind(), checkfirst=True)
    
    goaltype = postgresql.ENUM(
        'house', 'car', 'vacation', 'retirement', 'emergency_fund', 
        'education', 'investment', 'debt_payoff', 'custom',
        name='goaltype', create_type=False
    )
    goaltype.create(op.get_bind(), checkfirst=True)
    
    goalstatus = postgresql.ENUM(
        'active', 'completed', 'paused', 'cancelled', 'failed',
        name='goalstatus', create_type=False
    )
    goalstatus.create(op.get_bind(), checkfirst=True)

    # Import ENUMs
    importtype = postgresql.ENUM(
        'csv', 'excel', 'ofx', 'qif', 'pdf', 'ocr_receipt', 
        'ocr_invoice', 'ocr_contract', 'bank_api',
        name='importtype', create_type=False
    )
    importtype.create(op.get_bind(), checkfirst=True)
    
    importstatus = postgresql.ENUM(
        'pending', 'processing', 'completed', 'failed', 'partial',
        name='importstatus', create_type=False
    )
    importstatus.create(op.get_bind(), checkfirst=True)
    
    documenttype = postgresql.ENUM(
        'receipt', 'invoice', 'contract', 'bank_statement', 
        'tax_document', 'insurance', 'other',
        name='documenttype', create_type=False
    )
    documenttype.create(op.get_bind(), checkfirst=True)

    # Audit Log ENUMs
    eventtype = postgresql.ENUM(
        'access', 'security', 'financial_op', 'ai_interaction', 
        'system', 'user_action', 'data_export',
        name='eventtype', create_type=False
    )
    eventtype.create(op.get_bind(), checkfirst=True)
    
    severitylevel = postgresql.ENUM(
        'info', 'warning', 'error', 'critical',
        name='severitylevel', create_type=False
    )
    severitylevel.create(op.get_bind(), checkfirst=True)

    # Chat ENUMs
    messagerole = postgresql.ENUM(
        'user', 'assistant', 'system',
        name='messagerole', create_type=False
    )
    messagerole.create(op.get_bind(), checkfirst=True)

    # Tag ENUMs
    tagtype = postgresql.ENUM(
        'contextual', 'functional', 'temporal', 'emotional', 'custom',
        name='tagtype', create_type=False
    )
    tagtype.create(op.get_bind(), checkfirst=True)
    
    # Notification ENUMs
    notificationtype = postgresql.ENUM(
        'budget_alert', 'goal_milestone', 'recurring_reminder', 
        'anomaly_detected', 'optimization_suggestion', 'security_alert',
        'report_ready', 'general',
        name='notificationtype', create_type=False
    )
    notificationtype.create(op.get_bind(), checkfirst=True)
    
    notificationstatus = postgresql.ENUM(
        'unread', 'read', 'archived', 'dismissed',
        name='notificationstatus', create_type=False
    )
    notificationstatus.create(op.get_bind(), checkfirst=True)

    # =====================================================
    # CREATE TABLES
    # =====================================================

    # ------------------------
    # USERS & PROFILES
    # ------------------------

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('two_factor_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('two_factor_secret', sa.String(length=255), nullable=True),
        sa.Column('preferred_language', sa.String(length=10), nullable=False, server_default='it'),
        sa.Column('timezone', sa.String(length=50), nullable=False, server_default='Europe/Rome'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login_ip', sa.String(length=45), nullable=True),
    )
    
    op.create_index('ix_users_email_active', 'users', ['email', 'is_active'])

    # Create financial_profiles table
    op.create_table(
        'financial_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('profile_type', profiletype, nullable=False, server_default='personal'),
        sa.Column('security_level', securitylevel, nullable=False, server_default='standard'),
        sa.Column('encryption_salt', sa.String(length=255), nullable=True),
        sa.Column('default_currency', sa.String(length=3), nullable=False, server_default='EUR'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('color_code', sa.String(length=7), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_financial_profiles_user_id', ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'name', name='uq_financial_profiles_user_name')
    )
    
    op.execute("""
        ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY financial_profiles_isolation_policy ON financial_profiles
        USING (user_id = current_setting('app.current_user_id')::uuid);
    """)

    # Create user_preferences table
    op.create_table(
        'user_preferences',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('theme', sa.String(length=20), nullable=False, server_default='light'),
        sa.Column('notification_email', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('notification_push', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('notification_in_app', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('ai_proactivity_level', sa.String(length=20), nullable=False, server_default='moderate'),
        sa.Column('ml_training_consent', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('data_sharing_consent', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('dashboard_layout', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('custom_settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_user_preferences_user_id', ondelete='CASCADE')
    )

    # ------------------------
    # CATEGORIES & MERCHANTS (USER-LEVEL)
    # ------------------------

    # Create categories table (USER-LEVEL, SINGLE-LEVEL)
    op.create_table(
        'categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('is_income', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_categories_user_id', ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'name', name='uq_categories_user_name')
    )
    
    op.execute("""
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY categories_user_isolation ON categories
        USING (user_id = current_setting('app.current_user_id')::uuid);
    """)

    # Create category_profile_preferences (optional customization per profile)
    op.create_table(
        'category_profile_preferences',
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_visible', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('custom_name', sa.String(length=100), nullable=True),
        sa.Column('custom_color', sa.String(length=7), nullable=True),
        sa.Column('custom_icon', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('category_id', 'financial_profile_id'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name='fk_category_profile_prefs_category_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], name='fk_category_profile_prefs_profile_id', ondelete='CASCADE')
    )

    # Create merchants table (GLOBAL)
    op.create_table(
        'merchants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('canonical_name', sa.String(length=255), nullable=False, unique=True),
        sa.Column('aliases', postgresql.ARRAY(sa.String(length=255)), nullable=True),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('logo_url', sa.String(length=500), nullable=True),
        sa.Column('vat_number', sa.String(length=50), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    
    op.create_index('ix_merchants_canonical_name', 'merchants', ['canonical_name'])
    op.create_index('ix_merchants_aliases', 'merchants', ['aliases'], postgresql_using='gin')

    # Create tags table (USER-LEVEL)
    op.create_table(
        'tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('tag_type', tagtype, nullable=False, server_default='custom'),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_tags_user_id', ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'name', name='uq_tags_user_name')
    )
    
    op.execute("""
        ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY tags_user_isolation ON tags
        USING (user_id = current_setting('app.current_user_id')::uuid);
    """)

    # ------------------------
    # ACCOUNTS (PROFILE-LEVEL)
    # ------------------------

    op.create_table(
        'accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('account_type', accounttype, nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('initial_balance', sa.Numeric(precision=15, scale=2), nullable=False, server_default=sa.text('0')),
        sa.Column('current_balance', sa.Numeric(precision=15, scale=2), nullable=False, server_default=sa.text('0')),
        sa.Column('credit_limit', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('interest_rate', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('institution_name', sa.String(length=255), nullable=True),
        sa.Column('account_number_last4', sa.String(length=4), nullable=True),
        sa.Column('iban', sa.String(length=34), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_included_in_totals', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], name='fk_accounts_financial_profile_id', ondelete='CASCADE'),
        sa.UniqueConstraint('financial_profile_id', 'name', name='uq_accounts_profile_name')
    )
    
    op.execute("""
        ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY accounts_isolation_policy ON accounts
        USING (financial_profile_id IN (
            SELECT id FROM financial_profiles WHERE user_id = current_setting('app.current_user_id')::uuid
        ));
    """)

    # ------------------------
    # EXCHANGE RATES
    # ------------------------

    op.create_table(
        'exchange_rates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('base_currency', sa.String(length=3), nullable=False),
        sa.Column('target_currency', sa.String(length=3), nullable=False),
        sa.Column('rate', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('rate_date', sa.Date(), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.UniqueConstraint('base_currency', 'target_currency', 'rate_date', name='uq_exchange_rates_currencies_date')
    )
    
    op.create_index('ix_exchange_rates_currencies_date', 'exchange_rates', ['base_currency', 'target_currency', 'rate_date'])

    # ------------------------
    # TRANSACTIONS (PROFILE-LEVEL)
    # ------------------------

    op.create_table(
        'recurring_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('transaction_type', transactiontype, nullable=False),
        sa.Column('amount_model', amountmodel, nullable=False, server_default='fixed'),
        sa.Column('base_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('amount_min', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('amount_max', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('formula', sa.Text(), nullable=True),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('frequency', frequency, nullable=False),
        sa.Column('interval', sa.Integer(), nullable=False, server_default=sa.text('1')),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('next_occurrence_date', sa.Date(), nullable=True),
        sa.Column('auto_create', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('notification_days_before', sa.Integer(), nullable=False, server_default=sa.text('3')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], name='fk_recurring_transactions_financial_profile_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], name='fk_recurring_transactions_account_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name='fk_recurring_transactions_category_id', ondelete='SET NULL')
    )
    
    op.execute("""
        ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY recurring_transactions_isolation_policy ON recurring_transactions
        USING (financial_profile_id IN (
            SELECT id FROM financial_profiles WHERE user_id = current_setting('app.current_user_id')::uuid
        ));
    """)

    # Create transactions table
    op.execute("""
        CREATE TABLE transactions (
            id UUID PRIMARY KEY,
            financial_profile_id UUID NOT NULL,
            account_id UUID NOT NULL,
            category_id UUID,
            merchant_id UUID,
            recurring_transaction_id UUID,
            related_transaction_id UUID,
            transaction_date DATE NOT NULL,
            transaction_type transactiontype NOT NULL,
            source transactionsource NOT NULL DEFAULT 'manual',
            amount TEXT NOT NULL,
            amount_clear NUMERIC(15,2) NOT NULL,
            currency VARCHAR(3) NOT NULL,
            exchange_rate NUMERIC(18,8),
            amount_in_profile_currency NUMERIC(15,2) NOT NULL,
            description TEXT,
            description_clear VARCHAR(255),
            merchant_name VARCHAR(255),
            notes TEXT,
            is_reconciled BOOLEAN NOT NULL DEFAULT false,
            receipt_url VARCHAR(500),
            is_duplicate BOOLEAN NOT NULL DEFAULT false,
            duplicate_of_id UUID,
            import_job_id UUID,
            external_id VARCHAR(255),
            metadata JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            FOREIGN KEY (financial_profile_id) REFERENCES financial_profiles(id) ON DELETE CASCADE,
            FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL,
            FOREIGN KEY (recurring_transaction_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL,
            FOREIGN KEY (related_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
            FOREIGN KEY (duplicate_of_id) REFERENCES transactions(id) ON DELETE SET NULL
        );
        
        CREATE INDEX ix_transactions_profile_date ON transactions(financial_profile_id, transaction_date);
        CREATE INDEX ix_transactions_account_date ON transactions(account_id, transaction_date);
        CREATE INDEX ix_transactions_category ON transactions(category_id);
        CREATE INDEX ix_transactions_merchant ON transactions(merchant_id);
        CREATE INDEX ix_transactions_date ON transactions(transaction_date);
    """)
    
    # RLS on transactions
    op.execute("""
        ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY transactions_isolation_policy ON transactions
        USING (financial_profile_id IN (
            SELECT id FROM financial_profiles WHERE user_id = current_setting('app.current_user_id')::uuid
        ));
    """)

    op.create_table(
        'recurring_transaction_occurrences',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('recurring_transaction_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('scheduled_date', sa.Date(), nullable=False),
        sa.Column('expected_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('actual_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('status', occurrencestatus, nullable=False, server_default='pending'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['recurring_transaction_id'], ['recurring_transactions.id'], name='fk_recurring_occurrences_recurring_transaction_id', ondelete='CASCADE')
    )

    op.create_table(
        'transaction_tags',
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('transaction_id', 'tag_id'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], name='fk_transaction_tags_tag_id', ondelete='CASCADE')
    )

    # ------------------------
    # BUDGETS (USER-LEVEL with SCOPE)
    # ------------------------

    op.create_table(
        'budgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('scope_type', scopetype, nullable=False, server_default='user'),
        sa.Column('scope_profile_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=True),
        sa.Column('period_type', periodtype, nullable=False, server_default='monthly'),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('total_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('rollover_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('alert_threshold_percent', sa.Integer(), nullable=False, server_default=sa.text('80')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_budgets_user_id', ondelete='CASCADE')
    )
    
    op.execute("""
        ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY budgets_user_isolation ON budgets
        USING (user_id = current_setting('app.current_user_id')::uuid);
    """)

    op.create_table(
        'budget_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('budget_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('allocated_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('spent_amount', sa.Numeric(precision=15, scale=2), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['budget_id'], ['budgets.id'], name='fk_budget_categories_budget_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name='fk_budget_categories_category_id', ondelete='CASCADE'),
        sa.UniqueConstraint('budget_id', 'category_id', name='uq_budget_categories_budget_category')
    )

    # ------------------------
    # GOALS (USER-LEVEL with SCOPE)
    # ------------------------

    op.create_table(
        'financial_goals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('scope_type', scopetype, nullable=False, server_default='user'),
        sa.Column('scope_profile_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=True),
        sa.Column('linked_account_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('goal_type', goaltype, nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('target_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('current_amount', sa.Numeric(precision=15, scale=2), nullable=False, server_default=sa.text('0')),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('target_date', sa.Date(), nullable=False),
        sa.Column('monthly_contribution', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('auto_allocate', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('priority', sa.Integer(), nullable=False, server_default=sa.text('5')),
        sa.Column('status', goalstatus, nullable=False, server_default='active'),
        sa.Column('achievement_probability', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('gamification_points', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('milestones', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_financial_goals_user_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['linked_account_id'], ['accounts.id'], name='fk_financial_goals_linked_account_id', ondelete='SET NULL')
    )
    
    op.execute("""
        ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY financial_goals_user_isolation ON financial_goals
        USING (user_id = current_setting('app.current_user_id')::uuid);
    """)

    op.create_table(
        'goal_contributions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('goal_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('contribution_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['goal_id'], ['financial_goals.id'], name='fk_goal_contributions_goal_id', ondelete='CASCADE')
    )

    # ------------------------
    # ASSETS (PROFILE-LEVEL)
    # ------------------------

    op.create_table(
        'assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('asset_type', assettype, nullable=False),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('purchase_price', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('purchase_transaction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('current_value', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('current_value_min', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('current_value_max', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('valuation_method', valuationmethod, nullable=False, server_default='manual'),
        sa.Column('last_valuation_date', sa.Date(), nullable=True),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('is_liquid', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('quantity', sa.Numeric(precision=18, scale=8), nullable=True),
        sa.Column('ticker_symbol', sa.String(length=20), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], name='fk_assets_financial_profile_id', ondelete='CASCADE')
    )
    
    op.execute("""
        ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY assets_isolation_policy ON assets
        USING (financial_profile_id IN (
            SELECT id FROM financial_profiles WHERE user_id = current_setting('app.current_user_id')::uuid
        ));
    """)

    op.create_table(
        'asset_valuations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('valuation_date', sa.Date(), nullable=False),
        sa.Column('value', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('value_min', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('value_max', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('valuation_method', valuationmethod, nullable=False),
        sa.Column('source', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], name='fk_asset_valuations_asset_id', ondelete='CASCADE')
    )

    # ------------------------
    # DOCUMENTS & IMPORTS (PROFILE-LEVEL)
    # ------------------------

    op.create_table(
        'documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('document_type', documenttype, nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('file_hash', sa.String(length=64), nullable=False),
        sa.Column('ocr_processed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('ocr_text', sa.Text(), nullable=True),
        sa.Column('extracted_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('confidence_score', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], name='fk_documents_financial_profile_id', ondelete='CASCADE')
    )
    
    op.execute("""
        ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY documents_isolation_policy ON documents
        USING (financial_profile_id IN (
            SELECT id FROM financial_profiles WHERE user_id = current_setting('app.current_user_id')::uuid
        ));
    """)

    op.create_table(
        'import_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('import_type', importtype, nullable=False),
        sa.Column('status', importstatus, nullable=False, server_default='pending'),
        sa.Column('total_rows', sa.Integer(), nullable=True),
        sa.Column('processed_rows', sa.Integer(), nullable=True),
        sa.Column('successful_imports', sa.Integer(), nullable=True),
        sa.Column('failed_imports', sa.Integer(), nullable=True),
        sa.Column('skipped_duplicates', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('mapping_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], name='fk_import_jobs_financial_profile_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], name='fk_import_jobs_account_id', ondelete='SET NULL')
    )
    
    op.execute("""
        ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY import_jobs_isolation_policy ON import_jobs
        USING (financial_profile_id IN (
            SELECT id FROM financial_profiles WHERE user_id = current_setting('app.current_user_id')::uuid
        ));
    """)

    # ------------------------
    # BANK CONDITIONS (PROFILE-LEVEL)
    # ------------------------

    op.create_table(
        'bank_conditions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('institution_name', sa.String(length=255), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('effective_date', sa.Date(), nullable=False),
        sa.Column('interest_rate', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('annual_fee', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('transaction_fees', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('conditions_summary', sa.Text(), nullable=True),
        sa.Column('full_conditions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('changes_from_previous', sa.Text(), nullable=True),
        sa.Column('annual_cost_estimate', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], name='fk_bank_conditions_financial_profile_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], name='fk_bank_conditions_account_id', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], name='fk_bank_conditions_document_id', ondelete='SET NULL')
    )
    
    op.execute("""
        ALTER TABLE bank_conditions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY bank_conditions_isolation_policy ON bank_conditions
        USING (financial_profile_id IN (
            SELECT id FROM financial_profiles WHERE user_id = current_setting('app.current_user_id')::uuid
        ));
    """)

    # ------------------------
    # ML & AI
    # ------------------------

    op.create_table(
        'ml_classification_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('original_description', sa.Text(), nullable=False),
        sa.Column('suggested_category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('suggested_merchant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('suggested_tags', postgresql.ARRAY(sa.String(length=50)), nullable=True),
        sa.Column('confidence_score', sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column('model_name', sa.String(length=100), nullable=False),
        sa.Column('model_version', sa.String(length=50), nullable=False),
        sa.Column('features_used', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('was_accepted', sa.Boolean(), nullable=True),
        sa.Column('actual_category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_feedback', sa.Text(), nullable=True),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], name='fk_ml_classification_logs_financial_profile_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['suggested_category_id'], ['categories.id'], name='fk_ml_classification_logs_suggested_category_id', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['suggested_merchant_id'], ['merchants.id'], name='fk_ml_classification_logs_suggested_merchant_id', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['actual_category_id'], ['categories.id'], name='fk_ml_classification_logs_actual_category_id', ondelete='SET NULL')
    )
    
    op.execute("""
        ALTER TABLE ml_classification_logs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY ml_classification_logs_isolation_policy ON ml_classification_logs
        USING (financial_profile_id IN (
            SELECT id FROM financial_profiles WHERE user_id = current_setting('app.current_user_id')::uuid
        ));
    """)

    op.create_table(
        'predictions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('prediction_type', sa.String(length=50), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('prediction_date', sa.Date(), nullable=False),
        sa.Column('predicted_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('confidence_interval_min', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('confidence_interval_max', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('confidence_level', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('model_name', sa.String(length=100), nullable=False),
        sa.Column('model_version', sa.String(length=50), nullable=False),
        sa.Column('features_used', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('actual_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('error', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], name='fk_predictions_financial_profile_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name='fk_predictions_category_id', ondelete='SET NULL')
    )
    
    op.create_index('ix_predictions_profile_date', 'predictions', ['financial_profile_id', 'prediction_date'])
    
    op.execute("""
        ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY predictions_isolation_policy ON predictions
        USING (financial_profile_id IN (
            SELECT id FROM financial_profiles WHERE user_id = current_setting('app.current_user_id')::uuid
        ));
    """)

    # Create ai_recommendations table (USER-LEVEL with SCOPE)
    op.create_table(
        'ai_recommendations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('scope_type', scopetype, nullable=False, server_default='user'),
        sa.Column('scope_profile_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=True),
        sa.Column('recommendation_type', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('potential_savings', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False, server_default=sa.text('5')),
        sa.Column('confidence_score', sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column('related_entity_type', sa.String(length=50), nullable=True),
        sa.Column('related_entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action_items', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_dismissed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_implemented', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('user_feedback', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_ai_recommendations_user_id', ondelete='CASCADE')
    )
    
    op.execute("""
        ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY ai_recommendations_user_isolation ON ai_recommendations
        USING (user_id = current_setting('app.current_user_id')::uuid);
    """)

    # ------------------------
    # CHAT
    # ------------------------

    op.create_table(
        'chat_conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_chat_conversations_user_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], name='fk_chat_conversations_financial_profile_id', ondelete='SET NULL')
    )

    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('role', messagerole, nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('model_name', sa.String(length=100), nullable=True),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['conversation_id'], ['chat_conversations.id'], name='fk_chat_messages_conversation_id', ondelete='CASCADE')
    )

    # ------------------------
    # NOTIFICATIONS
    # ------------------------

    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('notification_type', notificationtype, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', notificationstatus, nullable=False, server_default='unread'),
        sa.Column('priority', sa.Integer(), nullable=False, server_default=sa.text('5')),
        sa.Column('action_url', sa.String(length=500), nullable=True),
        sa.Column('related_entity_type', sa.String(length=50), nullable=True),
        sa.Column('related_entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('sent_via_email', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('sent_via_push', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_notifications_user_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], name='fk_notifications_financial_profile_id', ondelete='SET NULL')
    )
    
    op.create_index('ix_notifications_user_status', 'notifications', ['user_id', 'status'])

    # ------------------------
    # AUDIT LOGS
    # ------------------------

    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('event_type', eventtype, nullable=False, index=True),
        sa.Column('severity', severitylevel, nullable=False, server_default='info'),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('old_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('device_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('geolocation', sa.String(length=100), nullable=True),
        sa.Column('session_id', sa.String(length=255), nullable=True),
        sa.Column('request_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), index=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_audit_logs_user_id', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['financial_profile_id'], ['financial_profiles.id'], name='fk_audit_logs_financial_profile_id', ondelete='SET NULL')
    )
    
    op.create_index('ix_audit_logs_user_created', 'audit_logs', ['user_id', 'created_at'])
    op.create_index('ix_audit_logs_profile_created', 'audit_logs', ['financial_profile_id', 'created_at'])
    op.create_index('ix_audit_logs_event_type_created', 'audit_logs', ['event_type', 'created_at'])

    # ------------------------
    # TRIGGERS FOR UPDATED_AT
    # ------------------------
    
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    tables_with_updated_at = [
        'users', 'financial_profiles', 'user_preferences', 'categories', 
        'category_profile_preferences', 'merchants', 'tags', 'accounts', 
        'recurring_transactions', 'transactions', 'recurring_transaction_occurrences',
        'budgets', 'budget_categories', 'financial_goals', 'assets', 
        'documents', 'import_jobs', 'bank_conditions', 'chat_conversations',
        'ai_recommendations'
    ]
    
    for table in tables_with_updated_at:
        op.execute(f"""
            CREATE TRIGGER update_{table}_updated_at
            BEFORE UPDATE ON {table}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """)

    # ------------------------
    # HELPER FUNCTIONS & VIEWS
    # ------------------------
    
    op.execute("""
        CREATE OR REPLACE FUNCTION calculate_account_balance(account_uuid UUID)
        RETURNS NUMERIC AS $$
        DECLARE
            balance NUMERIC;
        BEGIN
            SELECT 
                a.initial_balance + COALESCE(SUM(t.amount_clear), 0)
            INTO balance
            FROM accounts a
            LEFT JOIN transactions t ON t.account_id = a.id
            WHERE a.id = account_uuid
            GROUP BY a.id, a.initial_balance;
            
            RETURN COALESCE(balance, 0);
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    op.execute("""
        CREATE OR REPLACE VIEW monthly_spending_summary AS
        SELECT 
            t.financial_profile_id,
            DATE_TRUNC('month', t.transaction_date) AS month,
            c.name AS category_name,
            c.id AS category_id,
            COUNT(t.id) AS transaction_count,
            SUM(t.amount_in_profile_currency) AS total_amount,
            AVG(t.amount_in_profile_currency) AS avg_amount
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.transaction_type NOT IN ('internal_transfer')
        GROUP BY t.financial_profile_id, DATE_TRUNC('month', t.transaction_date), c.id, c.name;
    """)

    op.execute("""
        CREATE OR REPLACE VIEW net_worth_summary AS
        SELECT 
            fp.id AS financial_profile_id,
            fp.user_id,
            fp.name AS profile_name,
            COALESCE(SUM(a.current_balance), 0) AS total_accounts_balance,
            COALESCE(SUM(CASE WHEN a.account_type IN ('loan', 'mortgage') 
                THEN a.current_balance ELSE 0 END), 0) AS total_liabilities,
            COALESCE(SUM(ast.current_value), 0) AS total_assets_value,
            COALESCE(SUM(a.current_balance), 0) + 
            COALESCE(SUM(ast.current_value), 0) -
            ABS(COALESCE(SUM(CASE WHEN a.account_type IN ('loan', 'mortgage') 
                THEN a.current_balance ELSE 0 END), 0)) AS net_worth
        FROM financial_profiles fp
        LEFT JOIN accounts a ON a.financial_profile_id = fp.id AND a.is_active = true
        LEFT JOIN assets ast ON ast.financial_profile_id = fp.id
        GROUP BY fp.id, fp.user_id, fp.name;
    """)


def downgrade() -> None:
    # Drop views
    op.execute('DROP VIEW IF EXISTS net_worth_summary CASCADE')
    op.execute('DROP VIEW IF EXISTS monthly_spending_summary CASCADE')
    
    # Drop functions
    op.execute('DROP FUNCTION IF EXISTS calculate_account_balance CASCADE')
    op.execute('DROP FUNCTION IF EXISTS update_updated_at_column CASCADE')
    
    # Drop tables
    op.drop_table('audit_logs')
    op.drop_table('notifications')
    op.drop_table('chat_messages')
    op.drop_table('chat_conversations')
    op.drop_table('ai_recommendations')
    op.drop_table('predictions')
    op.drop_table('ml_classification_logs')
    op.drop_table('bank_conditions')
    op.drop_table('import_jobs')
    op.drop_table('documents')
    op.drop_table('asset_valuations')
    op.drop_table('assets')
    op.drop_table('goal_contributions')
    op.drop_table('financial_goals')
    op.drop_table('budget_categories')
    op.drop_table('budgets')
    op.drop_table('transaction_tags')
    op.drop_table('recurring_transaction_occurrences')
    op.execute('DROP TABLE IF EXISTS transactions CASCADE')
    op.drop_table('recurring_transactions')
    op.drop_table('exchange_rates')
    op.drop_table('accounts')
    op.drop_table('tags')
    op.drop_table('merchants')
    op.drop_table('category_profile_preferences')
    op.drop_table('categories')
    op.drop_table('user_preferences')
    op.drop_table('financial_profiles')
    op.drop_table('users')

    # Drop ENUM types
    op.execute('DROP TYPE IF EXISTS notificationstatus CASCADE')
    op.execute('DROP TYPE IF EXISTS notificationtype CASCADE')
    op.execute('DROP TYPE IF EXISTS tagtype CASCADE')
    op.execute('DROP TYPE IF EXISTS messagerole CASCADE')
    op.execute('DROP TYPE IF EXISTS severitylevel CASCADE')
    op.execute('DROP TYPE IF EXISTS eventtype CASCADE')
    op.execute('DROP TYPE IF EXISTS documenttype CASCADE')
    op.execute('DROP TYPE IF EXISTS importstatus CASCADE')
    op.execute('DROP TYPE IF EXISTS importtype CASCADE')
    op.execute('DROP TYPE IF EXISTS goalstatus CASCADE')
    op.execute('DROP TYPE IF EXISTS goaltype CASCADE')
    op.execute('DROP TYPE IF EXISTS periodtype CASCADE')
    op.execute('DROP TYPE IF EXISTS occurrencestatus CASCADE')
    op.execute('DROP TYPE IF EXISTS frequency CASCADE')
    op.execute('DROP TYPE IF EXISTS amountmodel CASCADE')
    op.execute('DROP TYPE IF EXISTS valuationmethod CASCADE')
    op.execute('DROP TYPE IF EXISTS assettype CASCADE')
    op.execute('DROP TYPE IF EXISTS transactionsource CASCADE')
    op.execute('DROP TYPE IF EXISTS transactiontype CASCADE')
    op.execute('DROP TYPE IF EXISTS accounttype CASCADE')
    op.execute('DROP TYPE IF EXISTS scopetype CASCADE')
    op.execute('DROP TYPE IF EXISTS securitylevel CASCADE')
    op.execute('DROP TYPE IF EXISTS profiletype CASCADE')
