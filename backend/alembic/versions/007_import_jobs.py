"""Add manually_deleted counter to import_jobs

Revision ID: 007_import_jobs
Revises: 006_category_translations
Create Date: 2026-05-04

Tracks how many transactions belonging to an import job
have been manually deleted by the user after the import completed.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "007_import_jobs"
down_revision: Union[str, None] = "006_category_translations"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "import_jobs",
        sa.Column("manually_deleted", sa.Integer(), nullable=True, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("import_jobs", "manually_deleted")
