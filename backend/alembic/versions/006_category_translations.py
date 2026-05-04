"""Add name_translations to categories for localization

Revision ID: 006_category_translations
Revises: 005_add_user_category_rules
Create Date: 2026-05-03

Adds a JSONB column to store category name translations by language code.
Example: {"it": "Spesa", "en": "Groceries"}
Existing rows get an empty JSON object as default.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "006_category_translations"
down_revision: Union[str, None] = "005_add_user_category_rules"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "categories",
        sa.Column(
            "name_translations",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            comment="Category name translations by language code, e.g. {'it': 'Spesa', 'en': 'Groceries'}",
        ),
    )


def downgrade() -> None:
    op.drop_column("categories", "name_translations")
