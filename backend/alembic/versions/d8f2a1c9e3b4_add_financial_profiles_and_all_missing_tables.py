"""add_financial_profiles_and_all_missing_tables

Revision ID: d8f2a1c9e3b4
Revises: b4bc8b67e15d
Create Date: 2025-11-17 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd8f2a1c9e3b4'
down_revision: Union[str, None] = 'b4bc8b67e15d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create financial_profiles table
    op.create_table(
        'financial_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('profile_type', sa.Enum('personal', 'family', 'business', name='profiletype'), nullable=False, server_default='personal'),
        sa.Column('default_currency', sa.String(3), nullable=False, server_default='EUR'),
        sa.Column('database_connection_string', sa.Text(), nullable=True),
        sa.Column('database_type', sa.Enum('postgresql', 'mssql', name='databasetype'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_financial_profiles_id', 'financial_profiles', ['id'])
    op.create_index('ix_financial_profiles_user_id', 'financial_profiles', ['user_id'])

    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('category_type', sa.Enum('income', 'expense', name='categorytype'), nullable=False),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id'), nullable=True, index=True),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_categories_id', 'categories', ['id'])

    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id'), nullable=False, index=True),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_tags_id', 'tags', ['id'])

    # Create accounttype enum
    op.execute("CREATE TYPE accounttype AS ENUM ('checking', 'savings', 'credit_card', 'investment', 'cash', 'loan', 'other')")

    # Create accounts table
    op.create_table(
        'accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('account_type', sa.Enum('checking', 'savings', 'credit_card', 'investment', 'cash', 'loan', 'other', name='accounttype'), nullable=False, server_default='checking'),
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

    # Create transactions table
    op.create_table(
        'transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id'), nullable=False, index=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id'), nullable=True, index=True),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False),
        sa.Column('transaction_type', sa.Enum('income', 'expense', 'transfer', name='transactiontype'), nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('merchant', sa.String(200), nullable=True),
        sa.Column('transaction_date', sa.DateTime(), nullable=False),
        sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_transactions_id', 'transactions', ['id'])
    op.create_index('ix_transactions_transaction_date', 'transactions', ['transaction_date'])

    # Create budgets table
    op.create_table(
        'budgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id'), nullable=False, index=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id'), nullable=True, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='EUR'),
        sa.Column('period', sa.Enum('daily', 'weekly', 'monthly', 'yearly', name='budgetperiod'), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('alert_threshold', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_budgets_id', 'budgets', ['id'])

    # Create financial_goals table
    op.create_table(
        'financial_goals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('target_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('current_amount', sa.Numeric(15, 2), nullable=False, server_default='0.00'),
        sa.Column('currency', sa.String(3), nullable=False, server_default='EUR'),
        sa.Column('target_date', sa.DateTime(), nullable=True),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', name='goalpriority'), nullable=False, server_default='medium'),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_financial_goals_id', 'financial_goals', ['id'])

    # Create assets table
    op.create_table(
        'assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('asset_type', sa.String(50), nullable=False),
        sa.Column('value', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='EUR'),
        sa.Column('purchase_date', sa.DateTime(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_assets_id', 'assets', ['id'])

    # Create recurring_transactions table
    op.create_table(
        'recurring_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id'), nullable=False, index=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id'), nullable=True, index=True),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False),
        sa.Column('transaction_type', sa.Enum('income', 'expense', 'transfer', name='transactiontype'), nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('frequency', sa.Enum('daily', 'weekly', 'monthly', 'yearly', name='recurrencefrequency'), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('next_occurrence', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_recurring_transactions_id', 'recurring_transactions', ['id'])

    # Create import_jobs table
    op.create_table(
        'import_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id'), nullable=False, index=True),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_type', sa.String(50), nullable=False),
        sa.Column('status', sa.Enum('pending', 'processing', 'completed', 'failed', name='importstatus'), nullable=False),
        sa.Column('total_rows', sa.Integer(), nullable=True),
        sa.Column('processed_rows', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_import_jobs_id', 'import_jobs', ['id'])

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id'), nullable=False, index=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('changes', postgresql.JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_audit_logs_id', 'audit_logs', ['id'])

    # Create exchange_rates table
    op.create_table(
        'exchange_rates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('from_currency', sa.String(3), nullable=False),
        sa.Column('to_currency', sa.String(3), nullable=False),
        sa.Column('rate', sa.Numeric(15, 6), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_exchange_rates_id', 'exchange_rates', ['id'])
    op.create_index('ix_exchange_rates_currencies', 'exchange_rates', ['from_currency', 'to_currency', 'date'])

    # Create ml_classification_logs table
    op.create_table(
        'ml_classification_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('transactions.id'), nullable=False, index=True),
        sa.Column('predicted_category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id'), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('model_version', sa.String(50), nullable=True),
        sa.Column('was_correct', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_ml_classification_logs_id', 'ml_classification_logs', ['id'])

    # Create chat_conversations table
    op.create_table(
        'chat_conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('financial_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('financial_profiles.id'), nullable=False, index=True),
        sa.Column('title', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_chat_conversations_id', 'chat_conversations', ['id'])

    # Create chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chat_conversations.id'), nullable=False, index=True),
        sa.Column('role', sa.Enum('user', 'assistant', name='messagerole'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_chat_messages_id', 'chat_messages', ['id'])

    # Create transaction_tags association table (many-to-many)
    op.create_table(
        'transaction_tags',
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('transactions.id'), nullable=False),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tags.id'), nullable=False),
        sa.PrimaryKeyConstraint('transaction_id', 'tag_id')
    )


def downgrade() -> None:
    # Drop tables in reverse order (respecting foreign keys)
    op.drop_table('transaction_tags')
    op.drop_table('chat_messages')
    op.drop_table('chat_conversations')
    op.drop_table('ml_classification_logs')
    op.drop_table('exchange_rates')
    op.drop_table('audit_logs')
    op.drop_table('import_jobs')
    op.drop_table('recurring_transactions')
    op.drop_table('assets')
    op.drop_table('financial_goals')
    op.drop_table('budgets')
    op.drop_table('transactions')
    op.drop_table('accounts')
    op.drop_table('tags')
    op.drop_table('categories')
    op.drop_table('financial_profiles')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS messagerole')
    op.execute('DROP TYPE IF EXISTS recurrencefrequency')
    op.execute('DROP TYPE IF EXISTS importstatus')
    op.execute('DROP TYPE IF EXISTS goalpriority')
    op.execute('DROP TYPE IF EXISTS budgetperiod')
    op.execute('DROP TYPE IF EXISTS transactiontype')
    op.execute('DROP TYPE IF EXISTS categorytype')
    op.execute('DROP TYPE IF EXISTS accounttype')
    op.execute('DROP TYPE IF EXISTS databasetype')
    op.execute('DROP TYPE IF EXISTS profiletype')
