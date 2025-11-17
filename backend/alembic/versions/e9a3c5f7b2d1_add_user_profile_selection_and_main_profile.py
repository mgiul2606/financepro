"""add_user_profile_selection_and_main_profile

Revision ID: e9a3c5f7b2d1
Revises: d8f2a1c9e3b4
Create Date: 2025-11-17 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e9a3c5f7b2d1'
down_revision: Union[str, None] = 'd8f2a1c9e3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add main_profile_id column to users table with ForeignKey
    op.add_column(
        'users',
        sa.Column('main_profile_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_index('ix_users_main_profile_id', 'users', ['main_profile_id'])
    op.create_foreign_key(
        'fk_users_main_profile_id',
        'users', 'financial_profiles',
        ['main_profile_id'], ['id'],
        ondelete='SET NULL'
    )

    # Create user_profile_selections table
    op.create_table(
        'user_profile_selections',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, unique=True, index=True),
        sa.Column('active_profile_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_user_profile_selections_id', 'user_profile_selections', ['id'])
    op.create_index('ix_user_profile_selections_user_id', 'user_profile_selections', ['user_id'])


def downgrade() -> None:
    # Drop user_profile_selections table
    op.drop_index('ix_user_profile_selections_user_id', 'user_profile_selections')
    op.drop_index('ix_user_profile_selections_id', 'user_profile_selections')
    op.drop_table('user_profile_selections')

    # Remove main_profile_id column from users table
    op.drop_constraint('fk_users_main_profile_id', 'users', type_='foreignkey')
    op.drop_index('ix_users_main_profile_id', 'users')
    op.drop_column('users', 'main_profile_id')
