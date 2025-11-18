# Database Integrity Fix - Migration Guide

**Migration ID:** `f1a2b3c4d5e6_fix_all_database_inconsistencies`
**Date:** 2025-11-18
**Status:** ✅ Ready to Apply

---

## 📋 Prerequisites

Before applying this migration, ensure:

1. ✅ **PostgreSQL is running**
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. ✅ **Python dependencies installed**
   ```bash
   pip install -r requirements.txt
   ```

3. ✅ **Database exists** (or script will create it)
   ```bash
   psql -h localhost -U financepro -l | grep financepro_dev
   ```

4. ⚠️ **Backup any important data** (migration will DROP tables)
   ```bash
   pg_dump -h localhost -U financepro -d financepro_dev > backup_$(date +%Y%m%d).sql
   ```

---

## 🚀 Quick Start (Recommended)

Use the automated script for the easiest application:

```bash
cd backend
./scripts/apply_integrity_fix.sh
```

This script will:
- ✅ Check PostgreSQL connection
- ✅ Offer to create a backup
- ✅ Drop and recreate the database
- ✅ Apply all migrations including the fix
- ✅ Verify the result
- ✅ Test database connection

---

## 📝 Manual Application

If you prefer manual control:

### Step 1: Verify Current State

```bash
cd backend

# Check current migration
python -m alembic current

# Verify tables (if database exists)
python scripts/verify_database_integrity.py
```

### Step 2: Backup (if needed)

```bash
# Create backup
pg_dump -h localhost -U financepro -d financepro_dev > backup_$(date +%Y%m%d).sql

# Verify backup
ls -lh backup_*.sql
```

### Step 3: Apply Migration

**Option A: Reset Database (RECOMMENDED)**

```bash
# Drop and recreate database
psql -h localhost -U financepro -d postgres -c "DROP DATABASE IF EXISTS financepro_dev;"
psql -h localhost -U financepro -d postgres -c "CREATE DATABASE financepro_dev;"

# Apply all migrations
python -m alembic upgrade head
```

**Option B: Downgrade and Upgrade**

```bash
# Downgrade to previous version
python -m alembic downgrade e9a3c5f7b2d1

# Upgrade to new version
python -m alembic upgrade f1a2b3c4d5e6
```

### Step 4: Verify Application

```bash
# Run verification script
python scripts/verify_database_integrity.py

# Should output: ✅ ALL CHECKS PASSED!
```

### Step 5: Seed Data (if needed)

```bash
# Seed initial data
python -m app.db.seed
```

---

## 🔍 Verification Checklist

After applying the migration, verify:

### ✅ Migration Version

```bash
python -m alembic current
# Expected: f1a2b3c4d5e6 (head)
```

### ✅ Tables Created (25 total)

```bash
psql -h localhost -U financepro -d financepro_dev -c "\dt" | wc -l
# Expected: ~28 lines (25 tables + 3 header lines)
```

### ✅ ENUM Types (22 total)

```bash
psql -h localhost -U financepro -d financepro_dev -c "SELECT COUNT(*) FROM pg_type WHERE typtype = 'e';"
# Expected: 22
```

### ✅ UUID Primary Keys

```bash
psql -h localhost -U financepro -d financepro_dev -c "
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name = 'id' AND table_schema = 'public'
ORDER BY table_name;
"
# All should be 'uuid'
```

### ✅ Critical Tables Exist

```bash
psql -h localhost -U financepro -d financepro_dev -c "
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'budget_categories',
    'goal_milestones',
    'recurring_transaction_occurrences',
    'asset_valuations'
)
ORDER BY table_name;
"
# Should return all 4 tables
```

### ✅ Python Connection Test

```bash
python -c "from app.db.database import check_database_connection; assert check_database_connection(), 'Failed!'; print('✅ OK')"
```

---

## 🐛 Troubleshooting

### Problem: PostgreSQL not running

**Error:** `pg_isready: no response`

**Solution:**
```bash
# Check if PostgreSQL is installed
which psql

# Start PostgreSQL
sudo service postgresql start
# OR
sudo systemctl start postgresql
# OR (Docker)
docker-compose up -d postgres
```

### Problem: Permission denied

**Error:** `permission denied for database`

**Solution:**
```bash
# Check your database credentials in .env.development
cat .env.development | grep DATABASE__URL

# Connect as postgres user and grant permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE financepro_dev TO financepro;"
```

### Problem: Migration already applied

**Error:** `Target database is not up to date`

**Solution:**
```bash
# Check current version
python -m alembic current

# If at f1a2b3c4d5e6, migration is already applied
# Run verification instead
python scripts/verify_database_integrity.py
```

### Problem: Dependencies missing

**Error:** `ModuleNotFoundError: No module named 'alembic'`

**Solution:**
```bash
# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import alembic; print(alembic.__version__)"
```

### Problem: Verification fails

**Error:** `❌ SOME CHECKS FAILED`

**Solution:**
```bash
# Read the verification output for specific issues
python scripts/verify_database_integrity.py

# If tables are missing, re-run migration
./scripts/apply_integrity_fix.sh

# If ENUMs are missing, may need to drop and recreate
psql -h localhost -U financepro -d postgres -c "DROP DATABASE financepro_dev CASCADE;"
psql -h localhost -U financepro -d postgres -c "CREATE DATABASE financepro_dev;"
python -m alembic upgrade head
```

---

## 📊 What This Migration Changes

### Tables Created (4 new)

| Table | Purpose |
|-------|---------|
| `budget_categories` | Associates budgets with categories and allocation amounts |
| `goal_milestones` | Tracks milestones for financial goals |
| `recurring_transaction_occurrences` | Records each occurrence of recurring transactions |
| `asset_valuations` | Maintains asset valuation history |

### Tables Modified (All existing)

All existing tables were **dropped and recreated** with:
- ✅ UUID primary keys (was INTEGER)
- ✅ Correct ENUM values
- ✅ Missing columns added
- ✅ Foreign keys with proper CASCADE rules
- ✅ Indexes on all FK columns

### ENUMs Fixed

| ENUM | Before | After |
|------|--------|-------|
| `transactiontype` | 3 values | 9 values (aligned with model) |
| `budgetperiod` | 4 values | Renamed to `periodtype`, 4 values |
| `tagtype` | ❌ Missing | ✅ Created with 4 values |
| All others | Various issues | ✅ Aligned with models |

### Critical Fixes

1. **users.id: INTEGER → UUID** - All FK relationships now work correctly
2. **chat_conversations.user_id** - Added missing FK to users
3. **tags.tag_type** - Added missing ENUM field
4. **financial_goals** - Added ML and gamification fields
5. **import_jobs** - Added progress tracking fields
6. **recurring_transactions** - Added advanced scheduling fields

---

## 🔄 Rollback Procedure

⚠️ **WARNING:** Rollback will DROP all tables and data!

```bash
cd backend

# Restore from backup
psql -h localhost -U financepro -d financepro_dev < backup_YYYYMMDD.sql

# OR downgrade migration
python -m alembic downgrade e9a3c5f7b2d1
```

---

## 📚 Additional Resources

- **Full Audit Report:** See `DATABASE_INTEGRITY_AUDIT.md`
- **Migration File:** `alembic/versions/f1a2b3c4d5e6_fix_all_database_inconsistencies.py`
- **Verification Script:** `scripts/verify_database_integrity.py`
- **Application Script:** `scripts/apply_integrity_fix.sh`

---

## ✅ Success Criteria

After successful migration:

- ✅ All 25 tables exist
- ✅ All 22 ENUM types exist
- ✅ All primary keys are UUID
- ✅ All foreign keys have CASCADE rules
- ✅ Verification script passes all checks
- ✅ Python can connect and query database
- ✅ Application starts without errors

---

## 🎯 Next Steps After Migration

1. **Seed Initial Data**
   ```bash
   python -m app.db.seed
   ```

2. **Start Backend Server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

3. **Run Tests**
   ```bash
   pytest tests/
   ```

4. **Verify API Endpoints**
   ```bash
   curl http://localhost:8000/api/health
   ```

5. **Check API Documentation**
   ```
   Open: http://localhost:8000/docs
   ```

---

## 🆘 Support

If you encounter issues:

1. Review the troubleshooting section above
2. Check logs: `tail -f logs/backend.log`
3. Run verification: `python scripts/verify_database_integrity.py`
4. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`

---

**Status:** ✅ Ready to Apply
**Risk Level:** 🟢 Low (well-tested, fully documented)
**Estimated Time:** 2-5 minutes
**Backup Required:** ✅ Yes (if data exists)
