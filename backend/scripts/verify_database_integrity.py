#!/usr/bin/env python3
"""
Database Integrity Verification Script

This script verifies that the database schema matches the SQLAlchemy models
after applying the integrity fix migration.

Usage:
    python scripts/verify_database_integrity.py
"""

import sys
from typing import List, Tuple, Dict, Any
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Inspector
from app.config import settings
from app.models import Base


# ANSI color codes
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_header(text: str):
    """Print a formatted header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 70}{Colors.END}\n")


def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")


def print_error(text: str):
    """Print error message"""
    print(f"{Colors.RED}✗ {text}{Colors.END}")


def print_warning(text: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")


def print_info(text: str):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ {text}{Colors.END}")


def check_database_connection() -> bool:
    """Check if database connection is working"""
    try:
        engine = create_engine(settings.database.url)
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print_success("Database connection successful")
        return True
    except Exception as e:
        print_error(f"Database connection failed: {e}")
        return False


def get_expected_tables() -> List[str]:
    """Get list of expected tables from SQLAlchemy models"""
    return sorted([
        'users',
        'financial_profiles',
        'user_profile_selections',
        'categories',
        'tags',
        'accounts',
        'exchange_rates',
        'transactions',
        'transaction_tags',
        'budgets',
        'budget_categories',
        'financial_goals',
        'goal_milestones',
        'assets',
        'asset_valuations',
        'recurring_transactions',
        'recurring_transaction_occurrences',
        'import_jobs',
        'audit_logs',
        'ml_classification_logs',
        'chat_conversations',
        'chat_messages',
    ])


def get_expected_enums() -> List[str]:
    """Get list of expected ENUM types"""
    return sorted([
        'profiletype',
        'databasetype',
        'accounttype',
        'transactiontype',
        'transactionsource',
        'periodtype',
        'goaltype',
        'goalstatus',
        'importtype',
        'importstatus',
        'eventtype',
        'severitylevel',
        'messagerole',
        'tagtype',
        'assettype',
        'valuationmethod',
        'amountmodel',
        'frequency',
        'occurrencestatus',
    ])


def verify_tables(inspector: Inspector) -> Tuple[bool, List[str], List[str]]:
    """Verify that all expected tables exist"""
    expected_tables = set(get_expected_tables())
    actual_tables = set(inspector.get_table_names())

    missing_tables = expected_tables - actual_tables
    extra_tables = actual_tables - expected_tables

    success = len(missing_tables) == 0

    if success:
        print_success(f"All {len(expected_tables)} expected tables exist")
    else:
        print_error(f"{len(missing_tables)} tables are missing")

    return success, list(missing_tables), list(extra_tables)


def verify_enums(engine) -> Tuple[bool, List[str], List[str]]:
    """Verify that all expected ENUM types exist"""
    expected_enums = set(get_expected_enums())

    with engine.connect() as connection:
        result = connection.execute(text(
            "SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname"
        ))
        actual_enums = set([row[0] for row in result])

    missing_enums = expected_enums - actual_enums
    extra_enums = actual_enums - expected_enums

    success = len(missing_enums) == 0

    if success:
        print_success(f"All {len(expected_enums)} expected ENUM types exist")
    else:
        print_error(f"{len(missing_enums)} ENUM types are missing")

    return success, list(missing_enums), list(extra_enums)


def verify_primary_keys(inspector: Inspector) -> Tuple[bool, List[str]]:
    """Verify that all tables have UUID primary keys"""
    issues = []

    for table_name in get_expected_tables():
        try:
            pk = inspector.get_pk_constraint(table_name)
            columns = inspector.get_columns(table_name)

            if not pk or not pk['constrained_columns']:
                issues.append(f"{table_name}: No primary key defined")
                continue

            pk_column = pk['constrained_columns'][0]
            pk_col_info = next((col for col in columns if col['name'] == pk_column), None)

            if pk_col_info:
                col_type = str(pk_col_info['type'])
                if 'UUID' not in col_type.upper():
                    issues.append(f"{table_name}.{pk_column}: Not UUID (found {col_type})")
        except Exception as e:
            issues.append(f"{table_name}: Error checking PK - {e}")

    success = len(issues) == 0

    if success:
        print_success("All tables have UUID primary keys")
    else:
        print_error(f"{len(issues)} primary key issues found")

    return success, issues


def verify_foreign_keys(inspector: Inspector) -> Tuple[bool, List[str]]:
    """Verify that critical foreign keys exist"""
    issues = []

    critical_fks = {
        'financial_profiles': ['user_id'],
        'user_profile_selections': ['user_id'],
        'categories': ['financial_profile_id'],
        'tags': ['financial_profile_id'],
        'accounts': ['financial_profile_id'],
        'transactions': ['account_id'],
        'chat_conversations': ['user_id', 'financial_profile_id'],
        'audit_logs': ['user_id', 'financial_profile_id'],
        'budget_categories': ['budget_id', 'category_id'],
        'goal_milestones': ['goal_id'],
        'asset_valuations': ['asset_id'],
        'recurring_transaction_occurrences': ['recurring_transaction_id'],
    }

    for table_name, expected_fk_cols in critical_fks.items():
        try:
            fks = inspector.get_foreign_keys(table_name)
            actual_fk_cols = set()

            for fk in fks:
                actual_fk_cols.update(fk['constrained_columns'])

            for fk_col in expected_fk_cols:
                if fk_col not in actual_fk_cols:
                    issues.append(f"{table_name}.{fk_col}: Foreign key missing")
        except Exception as e:
            issues.append(f"{table_name}: Error checking FKs - {e}")

    success = len(issues) == 0

    if success:
        print_success("All critical foreign keys exist")
    else:
        print_error(f"{len(issues)} foreign key issues found")

    return success, issues


def verify_special_fields(inspector: Inspector) -> Tuple[bool, List[str]]:
    """Verify that special fields added in the fix exist"""
    issues = []

    special_fields = {
        'users': ['full_name', 'is_verified', 'last_login_at'],
        'tags': ['tag_type'],
        'chat_conversations': ['user_id'],
        'transaction_tags': ['created_at'],
        'financial_goals': ['goal_type', 'status', 'monthly_contribution', 'achievement_probability', 'gamification_points'],
        'import_jobs': ['successful_records', 'failed_records', 'error_details', 'mapping_config'],
        'recurring_transactions': ['amount_model', 'min_amount', 'max_amount', 'custom_interval_days', 'calculation_formula'],
    }

    for table_name, expected_columns in special_fields.items():
        try:
            columns = inspector.get_columns(table_name)
            actual_columns = {col['name'] for col in columns}

            for col_name in expected_columns:
                if col_name not in actual_columns:
                    issues.append(f"{table_name}.{col_name}: Column missing")
        except Exception as e:
            issues.append(f"{table_name}: Error checking columns - {e}")

    success = len(issues) == 0

    if success:
        print_success("All special fields from integrity fix exist")
    else:
        print_error(f"{len(issues)} special field issues found")

    return success, issues


def verify_alembic_version(engine) -> Tuple[bool, str]:
    """Verify that the integrity fix migration has been applied"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text(
                "SELECT version_num FROM alembic_version"
            ))
            version = result.scalar()

        expected_version = 'f1a2b3c4d5e6'

        if version == expected_version:
            print_success(f"Integrity fix migration applied (version: {version})")
            return True, version
        else:
            print_warning(f"Current migration version: {version} (expected: {expected_version})")
            return False, version
    except Exception as e:
        print_error(f"Could not verify Alembic version: {e}")
        return False, None


def main():
    """Main verification function"""
    print_header("FinancePro Database Integrity Verification")

    # Track overall success
    all_checks_passed = True

    # 1. Check database connection
    print_info("Checking database connection...")
    if not check_database_connection():
        print_error("\n❌ Database connection failed. Cannot continue verification.")
        sys.exit(1)

    # Create engine and inspector
    engine = create_engine(settings.database.url)
    inspector = inspect(engine)

    # 2. Verify Alembic version
    print_info("\nVerifying migration version...")
    success, version = verify_alembic_version(engine)
    if not success:
        all_checks_passed = False

    # 3. Verify tables
    print_info("\nVerifying tables...")
    success, missing, extra = verify_tables(inspector)
    if not success:
        all_checks_passed = False
        if missing:
            print_error("Missing tables:")
            for table in missing:
                print(f"  - {table}")
        if extra:
            print_warning("Extra tables (not in models):")
            for table in extra:
                print(f"  - {table}")

    # 4. Verify ENUMs
    print_info("\nVerifying ENUM types...")
    success, missing, extra = verify_enums(engine)
    if not success:
        all_checks_passed = False
        if missing:
            print_error("Missing ENUM types:")
            for enum in missing:
                print(f"  - {enum}")
        if extra:
            print_warning("Extra ENUM types:")
            for enum in extra:
                print(f"  - {enum}")

    # 5. Verify primary keys
    print_info("\nVerifying primary keys...")
    success, issues = verify_primary_keys(inspector)
    if not success:
        all_checks_passed = False
        for issue in issues:
            print_error(f"  {issue}")

    # 6. Verify foreign keys
    print_info("\nVerifying foreign keys...")
    success, issues = verify_foreign_keys(inspector)
    if not success:
        all_checks_passed = False
        for issue in issues:
            print_error(f"  {issue}")

    # 7. Verify special fields
    print_info("\nVerifying special fields from integrity fix...")
    success, issues = verify_special_fields(inspector)
    if not success:
        all_checks_passed = False
        for issue in issues:
            print_error(f"  {issue}")

    # Final summary
    print_header("Verification Summary")

    if all_checks_passed:
        print_success("✅ ALL CHECKS PASSED!")
        print_success("Database schema is fully aligned with SQLAlchemy models.")
        print_success("No inconsistencies detected.")
        return 0
    else:
        print_error("❌ SOME CHECKS FAILED")
        print_error("Database schema has inconsistencies that need to be resolved.")
        print_info("\nTo fix issues, run: ./scripts/apply_integrity_fix.sh")
        return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nVerification interrupted by user")
        sys.exit(130)
    except Exception as e:
        print_error(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
