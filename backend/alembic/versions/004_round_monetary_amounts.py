"""Round all monetary amount columns to 2 decimal places

Revision ID: 004_round_monetary_amounts
Revises: 003_fix_schema_inconsistencies
Create Date: 2026-03-25

Cleans up existing data where monetary fields (amount_clear,
amount_in_profile_currency, etc.) have more than 2 decimal places
due to unrounded arithmetic (currency conversion, division, etc.).

For the transactions.amount TEXT column (non-encrypted rows), the string
representation is also updated to match the rounded value.
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '004_round_monetary_amounts'
down_revision: Union[str, None] = '003_fix_schema_inconsistencies'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -- transactions --
    # Round amount_clear and amount_in_profile_currency to 2 decimal places
    op.execute("""
        UPDATE transactions
        SET amount_clear = ROUND(amount_clear, 2),
            amount_in_profile_currency = ROUND(amount_in_profile_currency, 2)
        WHERE amount_clear != ROUND(amount_clear, 2)
           OR amount_in_profile_currency != ROUND(amount_in_profile_currency, 2);
    """)

    # For non-encrypted rows, the TEXT 'amount' column stores a plain decimal
    # string. Update it to match the rounded amount_clear.
    # Encrypted rows contain base64 data (always contains letters/+/=), skip them.
    op.execute("""
        UPDATE transactions
        SET amount = CAST(ROUND(amount_clear, 2) AS TEXT)
        WHERE amount !~ '[a-zA-Z+/=]'
          AND amount::numeric != ROUND(amount_clear, 2);
    """)

    # -- accounts --
    op.execute("""
        UPDATE accounts
        SET initial_balance = ROUND(initial_balance, 2),
            current_balance = ROUND(current_balance, 2)
        WHERE initial_balance != ROUND(initial_balance, 2)
           OR current_balance != ROUND(current_balance, 2);
    """)

    # -- budgets --
    op.execute("""
        UPDATE budgets
        SET total_amount = ROUND(total_amount, 2)
        WHERE total_amount != ROUND(total_amount, 2);
    """)

    # -- budget_categories --
    op.execute("""
        UPDATE budget_categories
        SET allocated_amount = ROUND(allocated_amount, 2)
        WHERE allocated_amount != ROUND(allocated_amount, 2);
    """)

    # -- financial_goals --
    op.execute("""
        UPDATE financial_goals
        SET target_amount = ROUND(target_amount, 2),
            current_amount = ROUND(current_amount, 2)
        WHERE target_amount != ROUND(target_amount, 2)
           OR current_amount != ROUND(current_amount, 2);
    """)

    # -- goal_contributions --
    op.execute("""
        UPDATE goal_contributions
        SET amount = ROUND(amount, 2)
        WHERE amount != ROUND(amount, 2);
    """)

    # -- goal_milestones --
    op.execute("""
        UPDATE goal_milestones
        SET target_amount = ROUND(target_amount, 2)
        WHERE target_amount != ROUND(target_amount, 2);
    """)

    # -- assets --
    op.execute("""
        UPDATE assets
        SET purchase_price = ROUND(purchase_price, 2),
            current_value = ROUND(current_value, 2)
        WHERE (purchase_price IS NOT NULL AND purchase_price != ROUND(purchase_price, 2))
           OR current_value != ROUND(current_value, 2);
    """)

    # -- recurring_transactions --
    op.execute("""
        UPDATE recurring_transactions
        SET base_amount = ROUND(base_amount, 2)
        WHERE base_amount != ROUND(base_amount, 2);
    """)


def downgrade() -> None:
    # Data rounding is not reversible — original precision is lost.
    pass
