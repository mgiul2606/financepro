"""Add user_category_rules table for adaptive categorization

Revision ID: 005_add_user_category_rules
Revises: 004_round_monetary_amounts
Create Date: 2026-03-28

Stores user-specific categorization rules learned from corrections.
When a user corrects or assigns a category, the system remembers
and auto-suggests the same category for similar future transactions.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "005_add_user_category_rules"
down_revision: Union[str, None] = "004_round_monetary_amounts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_category_rules",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "financial_profile_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            index=True,
        ),
        sa.Column("match_type", sa.String(50), nullable=False),
        sa.Column("match_value", sa.String(500), nullable=False),
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "times_applied",
            sa.Integer,
            nullable=False,
            server_default=sa.text("1"),
        ),
        sa.Column("last_applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "source",
            sa.String(50),
            nullable=False,
            server_default="user_correction",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.ForeignKeyConstraint(
            ["financial_profile_id"],
            ["financial_profiles.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["categories.id"],
            ondelete="CASCADE",
        ),
    )

    op.create_index(
        "ix_user_category_rules_profile_match",
        "user_category_rules",
        ["financial_profile_id", "match_type", "match_value"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_user_category_rules_profile_match", table_name="user_category_rules")
    op.drop_table("user_category_rules")
