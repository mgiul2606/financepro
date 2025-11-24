"""Fix schema inconsistencies between migrations and SQLAlchemy models

Revision ID: 003_fix_schema_inconsistencies
Revises: 002_add_missing_constraints
Create Date: 2025-11-24

This migration fixes the following inconsistencies:
1. Create goal_milestones table (missing from initial migration)
2. Make ml_classification_logs.transaction_id NOT NULL
3. Change audit_logs.session_id from VARCHAR to UUID
4. Change audit_logs.request_id from VARCHAR to UUID
5. Add financial_goals.notes column
6. Change audit_logs.user_agent from VARCHAR(500) to TEXT
7. Change import_jobs FK ondelete to CASCADE
8. Change bank_conditions FK ondelete to CASCADE
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003_fix_schema_inconsistencies'
down_revision: Union[str, None] = '002_add_missing_constraints'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =====================================================
    # 1. CREATE GOAL_MILESTONES TABLE
    # =====================================================
    op.create_table(
        'goal_milestones',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('goal_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('target_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('target_date', sa.Date(), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['goal_id'], ['financial_goals.id'],
                                name='fk_goal_milestones_goal_id', ondelete='CASCADE')
    )

    # =====================================================
    # 2. MAKE ml_classification_logs.transaction_id NOT NULL
    # =====================================================
    # First, delete any rows where transaction_id is NULL (if any exist)
    op.execute("""
        DELETE FROM ml_classification_logs WHERE transaction_id IS NULL;
    """)

    # Then alter the column to NOT NULL
    op.alter_column(
        'ml_classification_logs',
        'transaction_id',
        existing_type=postgresql.UUID(),
        nullable=False
    )

    # =====================================================
    # 3. CHANGE audit_logs.session_id FROM VARCHAR TO UUID
    # =====================================================
    # Drop the existing column and recreate with UUID type
    op.execute("""
        ALTER TABLE audit_logs
        DROP COLUMN IF EXISTS session_id;
    """)
    op.add_column(
        'audit_logs',
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=True, index=True)
    )

    # =====================================================
    # 4. CHANGE audit_logs.request_id FROM VARCHAR TO UUID
    # =====================================================
    op.execute("""
        ALTER TABLE audit_logs
        DROP COLUMN IF EXISTS request_id;
    """)
    op.add_column(
        'audit_logs',
        sa.Column('request_id', postgresql.UUID(as_uuid=True), nullable=True)
    )

    # =====================================================
    # 5. ADD financial_goals.notes COLUMN
    # =====================================================
    op.add_column(
        'financial_goals',
        sa.Column('notes', sa.Text(), nullable=True)
    )

    # =====================================================
    # 6. CHANGE audit_logs.user_agent FROM VARCHAR(500) TO TEXT
    # =====================================================
    op.alter_column(
        'audit_logs',
        'user_agent',
        existing_type=sa.String(length=500),
        type_=sa.Text(),
        existing_nullable=True
    )

    # =====================================================
    # 7. CHANGE import_jobs.account_id FK TO CASCADE DELETE
    # =====================================================
    # Drop existing FK constraint
    op.drop_constraint('fk_import_jobs_account_id', 'import_jobs', type_='foreignkey')

    # Recreate with CASCADE
    op.create_foreign_key(
        'fk_import_jobs_account_id',
        'import_jobs',
        'accounts',
        ['account_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # =====================================================
    # 8. CHANGE bank_conditions.account_id FK TO CASCADE DELETE
    # =====================================================
    # Drop existing FK constraint
    op.drop_constraint('fk_bank_conditions_account_id', 'bank_conditions', type_='foreignkey')

    # Recreate with CASCADE
    op.create_foreign_key(
        'fk_bank_conditions_account_id',
        'bank_conditions',
        'accounts',
        ['account_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # =====================================================
    # 8. REVERT bank_conditions.account_id FK TO SET NULL
    # =====================================================
    op.drop_constraint('fk_bank_conditions_account_id', 'bank_conditions', type_='foreignkey')
    op.create_foreign_key(
        'fk_bank_conditions_account_id',
        'bank_conditions',
        'accounts',
        ['account_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # =====================================================
    # 7. REVERT import_jobs.account_id FK TO SET NULL
    # =====================================================
    op.drop_constraint('fk_import_jobs_account_id', 'import_jobs', type_='foreignkey')
    op.create_foreign_key(
        'fk_import_jobs_account_id',
        'import_jobs',
        'accounts',
        ['account_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # =====================================================
    # 6. REVERT audit_logs.user_agent TO VARCHAR(500)
    # =====================================================
    op.alter_column(
        'audit_logs',
        'user_agent',
        existing_type=sa.Text(),
        type_=sa.String(length=500),
        existing_nullable=True
    )

    # =====================================================
    # 5. DROP financial_goals.notes COLUMN
    # =====================================================
    op.drop_column('financial_goals', 'notes')

    # =====================================================
    # 4. REVERT audit_logs.request_id TO VARCHAR
    # =====================================================
    op.drop_column('audit_logs', 'request_id')
    op.add_column(
        'audit_logs',
        sa.Column('request_id', sa.String(length=255), nullable=True)
    )

    # =====================================================
    # 3. REVERT audit_logs.session_id TO VARCHAR
    # =====================================================
    op.drop_column('audit_logs', 'session_id')
    op.add_column(
        'audit_logs',
        sa.Column('session_id', sa.String(length=255), nullable=True)
    )

    # =====================================================
    # 2. REVERT ml_classification_logs.transaction_id TO NULLABLE
    # =====================================================
    op.alter_column(
        'ml_classification_logs',
        'transaction_id',
        existing_type=postgresql.UUID(),
        nullable=True
    )

    # =====================================================
    # 1. DROP GOAL_MILESTONES TABLE
    # =====================================================
    op.drop_table('goal_milestones')
