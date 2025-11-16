# Database Migrations

This directory contains SQL migration scripts to update the database schema.

## How to Run Migrations

### Prerequisites
- Access to the PostgreSQL database
- `psql` command-line tool installed
- Database connection credentials

### Running a Migration

```bash
# Connect to your database and run the migration
psql -h <host> -U <username> -d <database> -f migrations/001_update_users_schema.sql
```

For Supabase:
```bash
# Get connection string from Supabase Dashboard > Settings > Database
psql "postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres" -f migrations/001_update_users_schema.sql
```

## Available Migrations

### 001_update_users_schema.sql
**Purpose**: Updates the `users` table schema to match the application models

**Changes**:
- Changes `id` column from `INTEGER` to `UUID`
- Adds `full_name` column (VARCHAR 255, nullable)
- Adds `is_verified` column (BOOLEAN, default FALSE)
- Adds `updated_at` column (TIMESTAMP, default CURRENT_TIMESTAMP)
- Adds `last_login_at` column (TIMESTAMP, nullable)
- Updates foreign key references in related tables

**Before Running**:
- ⚠️ **BACKUP YOUR DATABASE** before running this migration
- The migration will modify existing data
- Existing user IDs will be replaced with new UUIDs
- Foreign key relationships will be updated

**Rollback**: Not currently supported. Keep a database backup!

## Important Notes

1. **Always backup before running migrations**
2. Test migrations on a development/staging environment first
3. Migrations are designed to be run once
4. The migration uses transactions - if any step fails, all changes are rolled back
5. After running the migration, restart your backend application

## Migration Status Tracking

After running a migration, you can verify it with:

```sql
-- Check users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check sample data
SELECT id, email, is_verified, created_at, updated_at
FROM users
LIMIT 5;
```

## Future Migrations

When adding new migrations:
1. Number them sequentially (002_, 003_, etc.)
2. Add a description to this README
3. Include rollback instructions if possible
4. Test thoroughly before deploying to production
