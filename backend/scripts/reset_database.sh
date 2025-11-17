#!/bin/bash

# Script to reset the database and apply all migrations
# Usage: ./scripts/reset_database.sh

set -e

echo "🔄 Resetting FinancePro database..."

# Load environment variables
if [ -f .env.development ]; then
    export $(cat .env.development | grep -v '^#' | xargs)
fi

# Extract database credentials from DATABASE__URL
# Format: postgresql://user:password@host:port/database
DB_URL=${DATABASE__URL:-postgresql://financepro:financepro@localhost:5432/financepro_dev}

# Parse the URL
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\(.*\)/\1/p')

echo "📊 Database: $DB_NAME"
echo "🏠 Host: $DB_HOST:$DB_PORT"
echo "👤 User: $DB_USER"
echo ""

# Set PGPASSWORD for passwordless psql
export PGPASSWORD=$DB_PASS

# Drop database
echo "🗑️  Dropping database $DB_NAME..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "DROP DATABASE IF EXISTS $DB_NAME;"

# Create database
echo "📦 Creating database $DB_NAME..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME;"

# Apply migrations
echo "⚙️  Applying migrations..."
cd "$(dirname "$0")/.."
python -m alembic upgrade head

echo "✅ Database reset complete!"
echo ""
echo "You can now start the backend server with: uvicorn app.main:app --reload"
