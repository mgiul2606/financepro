# FinancePro v2.1 - Documentation Package

Complete technical documentation and seeding scripts for the FinancePro database.

---

## 📦 Package Contents

### 1. Database Technical Documentation
**File**: `Database_Technical_Documentation.md`

Covers:
- Overview and architecture patterns
- Users & Authentication (3 tables)
- Financial Structure (3 tables)
- Categorization & Tagging (4 tables)
- Accounts & Transactions (7 tables)
- Budgeting & Goals (4 tables)
- Assets & Valuations (2 tables)
- Import & Documents (3 tables)
- ML & AI (3 tables)
- Communication (3 tables)
- Audit & Security (1 table)
- Complete Constraints Reference
- All ENUM Definitions

---

### 2. Database Seeding Script
**File**: `database_seed.py`

**Purpose**: Populate database with realistic test data for development/testing.

**Features**:
- ✅ Creates 2 test users with different configurations
- ✅ Multiple profiles (personal, family, business)
- ✅ System categories + custom categories
- ✅ Global merchant database (100+ merchants)
- ✅ 12 months of realistic transactions
- ✅ Budgets with different scopes
- ✅ Financial goals with progress
- ✅ Recurring transactions
- ✅ Assets (real estate, vehicles)
- ✅ ML classification logs
- ✅ Predictions and AI recommendations
- ✅ Notifications and audit logs
- ✅ 365 days of exchange rate history

**Usage**:
```bash
# Install dependencies
pip install psycopg2-binary faker python-dateutil cryptography

# Seed development database
python database_seed.py --env dev

# Clean and reseed (⚠️ DELETES ALL DATA)
python database_seed.py --env dev --clean

# Seed staging
python database_seed.py --env staging
```

**Environment Variables**:
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=financepro_dev
export DB_USER=financepro
export DB_PASSWORD=dev_password
```

**Test Credentials** (password: `password123`):
- `mario.rossi@example.com` - Simple setup (1 personal profile)
- `giulia.bianchi@example.com` - Complex setup (3 profiles, 2FA enabled)

---

### 3. Additional Documentation Files

#### Schema Revision History
- `final_revised_schema.py` - Complete Alembic migration (62 KB)
- `Schema_Modifiche_v2.1.md` - Schema changes summary (22 KB)

#### Architectural Decisions
- `Decisioni_Architetturali_Finali.md` - Complete rationale (17 KB)
- `FinancePro_requisiti_v2.1.md` - Requirements v2.1 (41 KB)

#### Query Examples
- `SQL_Query_Examples.md` - Common queries and patterns (28 KB)

---

## 📊 Database Statistics

**Total Tables**: 34  
**Total ENUMs**: 17  
**Total Constraints**: 150+  
**Total Indexes**: 80+  

### Table Categories:
- Users & Auth: 3 tables
- Categorization: 4 tables
- Accounts & Transactions: 7 tables (1 partitioned)
- Budgeting & Goals: 4 tables
- Assets: 2 tables
- Documents & Import: 3 tables
- ML & AI: 3 tables
- Communication: 3 tables
- Audit: 1 table
- Global: 2 tables

---

## 🎯 Key Features

### Architecture
- ✅ **USER-level** entities: Shared across profiles (categories, tags, budgets, goals)
- ✅ **PROFILE-level** entities: Specific to single profile (accounts, transactions, assets)
- ✅ **SCOPE pattern**: Flexible cross-profile aggregation
- ✅ **Row Level Security (RLS)**: All sensitive tables
- ✅ **Encryption**: AES-256-GCM for High-Security profiles
- ✅ **Partitioning**: Transactions by year

### Security
- ✅ High-Security profile support with field encryption
- ✅ Complete audit trail (append-only)
- ✅ RLS policies on all sensitive data
- ✅ 2FA support
- ✅ Session tracking
- ✅ Geolocation logging

### Performance
- ✅ Strategic indexes (B-tree, GIN, composite, partial)
- ✅ Partitioned transactions table
- ✅ Denormalized fields where appropriate
- ✅ Materialized views for heavy aggregations

### ML & AI
- ✅ Classification logging for training
- ✅ Prediction storage and evaluation
- ✅ Recommendation engine with feedback loop
- ✅ XAI (explainability) support

---

## 📖 Documentation Structure

Each table documented with:
1. **Purpose**: What the table stores and why
2. **Level**: Ownership level (USER/PROFILE/GLOBAL)
3. **Columns**: Every column with type, constraints, and purpose
4. **Constraints**: All PKs, FKs, UNIQUEs, CHECKs with rationale
5. **Indexes**: All indexes with purpose
6. **RLS Policies**: Security policies if applicable
7. **Business Rules**: Application-level rules and validations
8. **Use Cases**: Real-world usage scenarios
9. **Related Entities**: Relationships with other tables

---

## 🚀 Quick Start

### 1. Setup Database
```bash
# Create database
createdb financepro_dev

# Run Alembic migrations
alembic upgrade head
```

### 2. Seed Test Data
```bash
python database_seed.py --env dev
```

### 3. Verify Setup
```sql
-- Check users
SELECT email, full_name, is_verified FROM users;

-- Check profiles
SELECT u.email, fp.name, fp.profile_type 
FROM financial_profiles fp 
JOIN users u ON u.id = fp.user_id;

-- Check transactions count
SELECT COUNT(*) FROM transactions;

-- Check budgets with scope
SELECT name, scope_type, total_amount FROM budgets;
```

---

## 📝 Notes

### Encryption
For High-Security profiles:
- **Encrypted fields**: `amount`, `description`, `notes` in transactions; `iban` in accounts
- **Always cleartext**: `amount_clear`, `description_clear` for queries
- **Key derivation**: PBKDF2(user_password + profile_salt, 100k iterations)

### Partitioning
Transactions partitioned by year:
- Auto-creates partitions via trigger
- Query performance: Only scans relevant partitions
- Easy archival: Detach old partitions

### Seeding Data
Generated data is:
- **Realistic**: Uses Faker library for names, addresses, etc.
- **Varied**: Random amounts, dates, categories
- **Relational**: All FKs properly linked
- **Historical**: 6-12 months of transaction history
- **Complete**: Covers all major entities

---

## 🛠️ Maintenance

### Regular Tasks
- **Partitions**: Auto-created, but monitor disk space
- **Audit logs**: Archive logs >7 years old
- **Exchange rates**: Daily update job
- **ML retraining**: Weekly with new classification logs
- **Cleanup**: Delete old notifications (>30 days archived)

### Backups
```bash
# Full backup
pg_dump financepro_dev > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump financepro_dev | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
psql financepro_dev < backup_20251120.sql
```

---

## 📧 Support

For questions or issues:
- Review `Decisioni_Architetturali_Finali.md` for design rationale
- Check `SQL_Query_Examples.md` for common query patterns
- Refer to table documentation for business rules

---

**Version**: 2.1 Final  
**Last Updated**: 2025-11-20  
**Status**: ✅ Production-Ready  
**Authors**: FinancePro Architecture Team
