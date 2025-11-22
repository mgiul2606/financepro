"""Add missing FK and CHECK constraints to align with technical specs

Revision ID: 002_add_missing_constraints
Revises: 001_initial_schema
Create Date: 2025-11-22

This migration adds:
1. Missing Foreign Key constraints for transaction relationships
2. Missing CHECK constraints for data validation

Based on FinancePro Database Technical Documentation v2.1
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_missing_constraints'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =====================================================
    # ADD MISSING FOREIGN KEY CONSTRAINTS
    # =====================================================

    # 1. transaction_tags: Add FK for transaction_id
    op.create_foreign_key(
        'fk_transaction_tags_transaction_id',
        'transaction_tags',
        'transactions',
        ['transaction_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # 2. goal_contributions: Add FK for transaction_id
    op.create_foreign_key(
        'fk_goal_contributions_transaction_id',
        'goal_contributions',
        'transactions',
        ['transaction_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # 3. assets: Add FK for purchase_transaction_id
    op.create_foreign_key(
        'fk_assets_purchase_transaction_id',
        'assets',
        'transactions',
        ['purchase_transaction_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # 4. documents: Add FK for transaction_id
    op.create_foreign_key(
        'fk_documents_transaction_id',
        'documents',
        'transactions',
        ['transaction_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # 5. ml_classification_logs: Add FK for transaction_id
    op.create_foreign_key(
        'fk_ml_classification_logs_transaction_id',
        'ml_classification_logs',
        'transactions',
        ['transaction_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # =====================================================
    # ADD MISSING CHECK CONSTRAINTS
    # =====================================================

    # 1. transactions: amount_clear must not be zero
    op.execute("""
        ALTER TABLE transactions
        ADD CONSTRAINT chk_transactions_amount_clear
        CHECK (amount_clear != 0);
    """)

    # 2. budgets: alert_threshold_percent between 0 and 100
    op.execute("""
        ALTER TABLE budgets
        ADD CONSTRAINT chk_budgets_alert_threshold
        CHECK (alert_threshold_percent BETWEEN 0 AND 100);
    """)

    # 3. budgets: end_date must be >= start_date (if not null)
    op.execute("""
        ALTER TABLE budgets
        ADD CONSTRAINT chk_budgets_dates
        CHECK (end_date IS NULL OR end_date >= start_date);
    """)

    # 4. predictions: confidence_level between 0 and 1
    op.execute("""
        ALTER TABLE predictions
        ADD CONSTRAINT chk_predictions_confidence
        CHECK (confidence_level IS NULL OR confidence_level BETWEEN 0 AND 1);
    """)

    # 5. financial_goals: target_date must be >= start_date
    op.execute("""
        ALTER TABLE financial_goals
        ADD CONSTRAINT chk_goals_dates
        CHECK (target_date >= start_date);
    """)

    # 6. financial_goals: priority between 1 and 10
    op.execute("""
        ALTER TABLE financial_goals
        ADD CONSTRAINT chk_goals_priority
        CHECK (priority BETWEEN 1 AND 10);
    """)

    # 7. assets: value range validation
    op.execute("""
        ALTER TABLE assets
        ADD CONSTRAINT chk_assets_value_range
        CHECK (
            current_value_min IS NULL
            OR current_value_max IS NULL
            OR current_value_min <= current_value_max
        );
    """)

    # 8. categories: color must be valid HEX format
    op.execute("""
        ALTER TABLE categories
        ADD CONSTRAINT chk_categories_color
        CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');
    """)

    # 9. financial_profiles: color_code must be valid HEX format
    op.execute("""
        ALTER TABLE financial_profiles
        ADD CONSTRAINT chk_financial_profiles_color_code
        CHECK (color_code IS NULL OR color_code ~ '^#[0-9A-Fa-f]{6}$');
    """)

    # 10. users: email must be valid format
    op.execute("""
        ALTER TABLE users
        ADD CONSTRAINT chk_users_email
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');
    """)

    # 11. ai_recommendations: priority between 1 and 10
    op.execute("""
        ALTER TABLE ai_recommendations
        ADD CONSTRAINT chk_recommendations_priority
        CHECK (priority BETWEEN 1 AND 10);
    """)


def downgrade() -> None:
    # =====================================================
    # DROP CHECK CONSTRAINTS
    # =====================================================

    op.execute('ALTER TABLE ai_recommendations DROP CONSTRAINT IF EXISTS chk_recommendations_priority;')
    op.execute('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_email;')
    op.execute('ALTER TABLE financial_profiles DROP CONSTRAINT IF EXISTS chk_financial_profiles_color_code;')
    op.execute('ALTER TABLE categories DROP CONSTRAINT IF EXISTS chk_categories_color;')
    op.execute('ALTER TABLE assets DROP CONSTRAINT IF EXISTS chk_assets_value_range;')
    op.execute('ALTER TABLE financial_goals DROP CONSTRAINT IF EXISTS chk_goals_priority;')
    op.execute('ALTER TABLE financial_goals DROP CONSTRAINT IF EXISTS chk_goals_dates;')
    op.execute('ALTER TABLE predictions DROP CONSTRAINT IF EXISTS chk_predictions_confidence;')
    op.execute('ALTER TABLE budgets DROP CONSTRAINT IF EXISTS chk_budgets_dates;')
    op.execute('ALTER TABLE budgets DROP CONSTRAINT IF EXISTS chk_budgets_alert_threshold;')
    op.execute('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transactions_amount_clear;')

    # =====================================================
    # DROP FOREIGN KEY CONSTRAINTS
    # =====================================================

    op.drop_constraint('fk_ml_classification_logs_transaction_id', 'ml_classification_logs', type_='foreignkey')
    op.drop_constraint('fk_documents_transaction_id', 'documents', type_='foreignkey')
    op.drop_constraint('fk_assets_purchase_transaction_id', 'assets', type_='foreignkey')
    op.drop_constraint('fk_goal_contributions_transaction_id', 'goal_contributions', type_='foreignkey')
    op.drop_constraint('fk_transaction_tags_transaction_id', 'transaction_tags', type_='foreignkey')
