#!/bin/bash
# Script to apply the database integrity fix migration
# This script will reset the database and apply all migrations including the fix

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     FinancePro Database Integrity Fix - Application Script   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is running
print_status "Checking PostgreSQL connection..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    print_error "PostgreSQL is not running or not accessible"
    print_status "Please start PostgreSQL and try again"
    echo ""
    echo "To start PostgreSQL, you can use:"
    echo "  - Docker: docker-compose up -d postgres"
    echo "  - Service: sudo service postgresql start"
    echo "  - systemctl: sudo systemctl start postgresql"
    exit 1
fi
print_success "PostgreSQL is running"
echo ""

# Load environment variables
if [ -f .env.development ]; then
    export $(cat .env.development | grep -v '^#' | xargs)
    print_success "Environment variables loaded from .env.development"
else
    print_warning ".env.development not found, using default values"
fi
echo ""

# Extract database credentials
DB_URL=${DATABASE__URL:-postgresql://financepro:financepro@localhost:5432/financepro_dev}
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\(.*\)/\1/p')

print_status "Database: $DB_NAME"
print_status "Host: $DB_HOST:$DB_PORT"
print_status "User: $DB_USER"
echo ""

# Set PGPASSWORD for passwordless operations
export PGPASSWORD=$DB_PASS

# Ask for confirmation
print_warning "⚠️  This operation will DROP and RECREATE all database tables!"
print_warning "⚠️  All existing data will be LOST!"
echo ""
read -p "$(echo -e ${YELLOW}Do you want to continue? \(yes/no\): ${NC})" -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_status "Operation cancelled by user"
    exit 0
fi

# Optional: Create backup
read -p "$(echo -e ${BLUE}Do you want to create a backup first? \(yes/no\): ${NC})" -r
echo ""
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    print_status "Creating backup: $BACKUP_FILE"

    if pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE 2>/dev/null; then
        print_success "Backup created: $BACKUP_FILE"
    else
        print_warning "Backup failed (database might not exist yet)"
    fi
    echo ""
fi

# Check current migration state
print_status "Checking current migration state..."
if python -m alembic current 2>/dev/null; then
    echo ""
else
    print_warning "Could not determine current migration state"
    echo ""
fi

# Drop and recreate database
print_status "Dropping database $DB_NAME..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>&1 | grep -v "NOTICE" || true
print_success "Database dropped"
echo ""

print_status "Creating database $DB_NAME..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1 | grep -v "NOTICE" || true
print_success "Database created"
echo ""

# Apply all migrations
print_status "Applying all migrations (including integrity fix)..."
if python -m alembic upgrade head; then
    print_success "All migrations applied successfully!"
else
    print_error "Migration failed!"
    exit 1
fi
echo ""

# Verify migration state
print_status "Verifying migration state..."
python -m alembic current
echo ""

# Verify tables created
print_status "Verifying tables..."
TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
print_success "Created $TABLE_COUNT tables"
echo ""

# List all tables
print_status "Database tables:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt" 2>/dev/null
echo ""

# Verify ENUMs
print_status "Database ENUMs:"
ENUM_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_type WHERE typtype = 'e';" 2>/dev/null | tr -d ' ')
print_success "Created $ENUM_COUNT ENUM types"
echo ""

# Test database connection using Python
print_status "Testing database connection..."
if python -c "from app.db.database import check_database_connection; assert check_database_connection(), 'Connection failed'" 2>/dev/null; then
    print_success "Database connection test passed!"
else
    print_error "Database connection test failed!"
    exit 1
fi
echo ""

# Show summary
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                   Migration Applied Successfully!             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
print_success "Database is ready for use!"
print_status "Tables: $TABLE_COUNT"
print_status "ENUMs: $ENUM_COUNT"
echo ""
print_status "Next steps:"
echo "  1. Run database seed: python -m app.db.seed"
echo "  2. Start backend: uvicorn app.main:app --reload"
echo "  3. Run tests: pytest"
echo ""
print_success "All done! 🎉"
