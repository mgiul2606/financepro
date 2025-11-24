# FinancePro v2.1 - Complete Database Technical Documentation

**Version**: 2.1 Final | **Date**: 2025-11-20 | **Database**: PostgreSQL 14+

---

## 📚 Document Purpose

This document provides complete technical specifications for every table, column, and constraint in the FinancePro database, serving as the definitive reference for developers, DBAs, and architects.

---

## 🏗️ Architecture Overview

**Key Patterns**:
- **USER-level**: Entities shared across all user's profiles (categories, tags, budgets, goals)
- **PROFILE-level**: Entities specific to single profile (accounts, transactions, assets)  
- **GLOBAL**: Entities shared across all users (merchants, exchange_rates)
- **SCOPE**: Flexible cross-profile aggregation pattern

**Security**:
- Row Level Security (RLS) on all sensitive tables
- AES-256-GCM encryption for High-Security profiles
- Comprehensive audit logging

**Performance**:
- Strategic indexes (B-tree, GIN, composite, partial)
- Materialized views for heavy aggregations

---

## 📊 Tables by Category

### 1. Users & Authentication (3 tables)
- `users` - User accounts and authentication
- `financial_profiles` - Financial profiles per user
- `user_preferences` - User preferences and settings

### 2. Categorization & Tagging (4 tables)
- `categories` - Expense/income categories (USER-level)
- `category_profile_preferences` - Optional category customization per profile
- `merchants` - Global merchant database
- `tags` - User tags for transactions (USER-level)

### 3. Accounts & Financial Data (7 tables)
- `accounts` - Bank accounts, credit cards, etc.
- `exchange_rates` - Currency exchange rates history
- `recurring_transactions` - Recurring transaction templates
- `recurring_transaction_occurrences` - Individual occurrences
- `transactions` - All financial transactions
- `transaction_tags` - M:N junction table

### 4. Budgeting & Goals (5 tables)
- `budgets` - Budgets with scope (USER-level)
- `budget_categories` - Budget allocations per category
- `financial_goals` - Financial goals with scope (USER-level)
- `goal_contributions` - Contributions to goals
- `goal_milestones` - Individual goal milestones

### 5. Assets & Valuations (2 tables)
- `assets` - Physical/financial assets (PROFILE-level)
- `asset_valuations` - Asset value history

### 6. Documents & Imports (3 tables)
- `documents` - Scanned documents with OCR
- `import_jobs` - Batch import tracking
- `bank_conditions` - Bank contract terms history

### 7. ML & AI (3 tables)
- `ml_classification_logs` - ML classification logs
- `predictions` - Future spending/income predictions
- `ai_recommendations` - AI optimization suggestions (USER-level with scope)

### 8. Communication (3 tables)
- `chat_conversations` - AI assistant conversations
- `chat_messages` - Individual chat messages
- `notifications` - User notifications

### 9. Audit & Security (1 table)
- `audit_logs` - Complete audit trail

**Total: 35 Tables**

---

## 1. USERS & AUTHENTICATION

### Table: `users`

**Purpose**: Core user accounts with authentication credentials and profile settings.

**Level**: ROOT (owns all other entities)

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique user identifier. Non-sequential for security. |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login email. Must be valid format. |
| `hashed_password` | VARCHAR(255) | NOT NULL | Password hash (Argon2id/bcrypt). Never store plain text. |
| `full_name` | VARCHAR(255) | NULL | Display name for UI personalization. |
| `is_active` | BOOLEAN | DEFAULT true | Account status. `false` = soft delete. |
| `is_verified` | BOOLEAN | DEFAULT false | Email verification status. |
| `two_factor_enabled` | BOOLEAN | DEFAULT false | 2FA enabled flag. |
| `two_factor_secret` | VARCHAR(255) | NULL | TOTP secret (encrypted at app level). |
| `preferred_language` | VARCHAR(10) | DEFAULT 'it' | ISO 639-1 code (it, en, es, fr, de). |
| `timezone` | VARCHAR(50) | DEFAULT 'Europe/Rome' | IANA timezone for date formatting. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Account creation timestamp. Immutable. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp. Auto-updated by trigger. |
| `last_login_at` | TIMESTAMPTZ | NULL | Last successful login timestamp. |
| `last_login_ip` | VARCHAR(45) | NULL | Last login IP (IPv4/IPv6) for security audit. |

**Indexes**:
- PRIMARY KEY (`id`)
- UNIQUE (`email`)
- INDEX (`email`, `is_active`) - For login queries with active check

**Business Rules**:
- Email must be unique and valid
- Password must meet complexity requirements (min 8 chars, uppercase, numbers, symbols)
- `is_active=false` disables login but preserves data
- `two_factor_secret` encrypted with application master key
- Deletion cascades to all dependent entities

**Related Entities**:
```
users (1) → (N) financial_profiles
users (1) → (1) user_preferences
users (1) → (N) categories
users (1) → (N) tags
users (1) → (N) budgets
users (1) → (N) financial_goals
users (1) → (N) ai_recommendations
users (1) → (N) chat_conversations
users (1) → (N) notifications
users (1) → (N) audit_logs
```

---

### Table: `financial_profiles`

**Purpose**: Separate financial entities for one user (personal, family, business). Enables multi-profile management with different security levels.

**Level**: USER-owned

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique profile identifier. |
| `user_id` | UUID | FK→users, NOT NULL | Profile owner. |
| `name` | VARCHAR(255) | NOT NULL | Profile name (e.g., "Personal", "Family LLC", "Freelance"). |
| `profile_type` | profiletype | DEFAULT 'personal' | Type: 'personal', 'family', 'business'. For UI categorization. |
| `security_level` | securitylevel | DEFAULT 'standard' | Security: 'standard' or 'high_security'. HS = field encryption. |
| `encryption_salt` | VARCHAR(255) | NULL | Random salt for key derivation. Required if HS. Base64(32 bytes). |
| `default_currency` | VARCHAR(3) | DEFAULT 'EUR' | ISO 4217 code (EUR, USD, GBP). Reference currency for reports. |
| `description` | TEXT | NULL | Optional profile description. |
| `is_active` | BOOLEAN | DEFAULT true | Profile status. `false` = hidden but data preserved. |
| `is_default` | BOOLEAN | DEFAULT false | Default profile flag. Only one per user. |
| `color_code` | VARCHAR(7) | NULL | HEX color (#RRGGBB) for UI differentiation. |
| `icon` | VARCHAR(50) | NULL | Icon name for UI (home, briefcase, users, etc.). |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users`(id) ON DELETE CASCADE
- UNIQUE (`user_id`, `name`) - Profile name unique per user
- CHECK (`color_code` IS NULL OR `color_code` ~ '^#[0-9A-Fa-f]{6}$')

**Indexes**:
- INDEX (`user_id`)

**RLS Policy**:
```sql
ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY financial_profiles_isolation_policy ON financial_profiles
USING (user_id = current_setting('app.current_user_id')::uuid);
```

**Business Rules**:
- Max 10 profiles per user (application enforced)
- If `security_level='high_security'`:
  - `encryption_salt` must be populated
  - Sensitive fields in related tables encrypted
  - Key derivation: PBKDF2(user_password + salt, 100k iterations)
- Only one profile with `is_default=true` per user
- `color_code` must be valid HEX format

**Related Entities**:
```
financial_profiles (1) → (N) accounts
financial_profiles (1) → (N) transactions
financial_profiles (1) → (N) recurring_transactions
financial_profiles (1) → (N) assets
financial_profiles (1) → (N) documents
financial_profiles (1) → (N) import_jobs
financial_profiles (1) → (N) bank_conditions
financial_profiles (1) → (N) ml_classification_logs
financial_profiles (1) → (N) predictions
```

---

### Table: `user_preferences`

**Purpose**: User-specific UI, notification, and AI behavior settings. 1:1 relationship with users.

**Level**: USER-owned

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique record identifier. |
| `user_id` | UUID | FK→users, UNIQUE, NOT NULL | User owning these preferences. 1:1 relationship. |
| `theme` | VARCHAR(20) | DEFAULT 'light' | UI theme: 'light', 'dark', 'auto'. |
| `notification_email` | BOOLEAN | DEFAULT true | Enable email notifications. |
| `notification_push` | BOOLEAN | DEFAULT true | Enable push notifications (mobile/web). |
| `notification_in_app` | BOOLEAN | DEFAULT true | Enable in-app notifications. |
| `ai_proactivity_level` | VARCHAR(20) | DEFAULT 'moderate' | AI suggestion frequency: 'minimal', 'moderate', 'high'. |
| `ml_training_consent` | BOOLEAN | DEFAULT false | Consent to use anonymized data for ML training. |
| `data_sharing_consent` | BOOLEAN | DEFAULT false | Consent for aggregated anonymous benchmarks. |
| `dashboard_layout` | JSONB | NULL | Custom dashboard widget layout. JSON structure. |
| `custom_settings` | JSONB | NULL | Extensible settings without schema changes. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users`(id) ON DELETE CASCADE
- UNIQUE (`user_id`)

**Business Rules**:
- Created automatically on user registration with defaults
- `ml_training_consent` controls whether user data contributes to global models
- `dashboard_layout` validated by application for correct structure
- Notification preferences control delivery channels

---

## 2. CATEGORIZATION & TAGGING

### Table: `categories`

**Purpose**: Expense/income categories shared across ALL user's profiles. Single-level (no hierarchy) for simplicity and cross-profile consistency.

**Level**: USER-owned (shared across profiles)

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique category identifier. |
| `user_id` | UUID | FK→users, NOT NULL | Category owner. USER-LEVEL (shared). |
| `name` | VARCHAR(100) | NOT NULL | Category name (Groceries, Transport, Salary, etc.). |
| `description` | TEXT | NULL | Optional description. |
| `icon` | VARCHAR(50) | NULL | Icon name (shopping-cart, car, salary). |
| `color` | VARCHAR(7) | NULL | HEX color (#4CAF50) for UI. |
| `is_income` | BOOLEAN | DEFAULT false | Income flag. `true` for salary, invoices. `false` for expenses. |
| `is_active` | BOOLEAN | DEFAULT true | Active flag. `false` = hidden but historical txns preserved. |
| `is_system` | BOOLEAN | DEFAULT false | System category flag. `true` = cannot be deleted, predefined. |
| `sort_order` | INTEGER | DEFAULT 0 | Custom sort order. Lower = shown first. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users`(id) ON DELETE CASCADE
- UNIQUE (`user_id`, `name`)
- CHECK (`color` IS NULL OR `color` ~ '^#[0-9A-Fa-f]{6}$')

**Indexes**:
- INDEX (`user_id`)

**RLS Policy**:
```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY categories_user_isolation ON categories
USING (user_id = current_setting('app.current_user_id')::uuid);
```

**Business Rules**:
- **USER-LEVEL**: Shared across all profiles for consistency
- Single-level (no hierarchy) for simplicity
- System categories (`is_system=true`) cannot be deleted, only deactivated
- Max 100 custom categories per user (application limit)
- Name must be unique per user

**Use Cases**:
- Transaction categorization
- Budget allocation by category
- Spending analysis
- Filtering and reporting

**Related Entities**:
```
categories (1) → (N) transactions
categories (1) → (N) budget_categories
categories (1) → (N) category_profile_preferences
```

---

### Table: `category_profile_preferences`

**Purpose**: Optional per-profile customization of categories (visibility, custom naming). Enables hiding business categories in personal profile, etc.

**Level**: Profile-specific customization

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `category_id` | UUID | PK (composite), FK→categories | Category to customize. |
| `financial_profile_id` | UUID | PK (composite), FK→profiles | Target profile. |
| `is_visible` | BOOLEAN | DEFAULT true | Visibility in this profile. `false` = hidden. |
| `custom_name` | VARCHAR(100) | NULL | Override category name for this profile. |
| `custom_color` | VARCHAR(7) | NULL | Override color for this profile. |
| `custom_icon` | VARCHAR(50) | NULL | Override icon for this profile. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`category_id`, `financial_profile_id`)
- FOREIGN KEY (`category_id`) REFERENCES `categories`(id) ON DELETE CASCADE
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE CASCADE

**Business Rules**:
- **Optional**: If not present, category visible with original name/color/icon
- `is_visible=false`: Category hidden in UI for this profile (historical txns still visible)
- `custom_name`: Useful for renaming (e.g., "Alimentari" → "Grocery" in international profile)
- Validation: category owner must match profile owner

**Use Cases**:
- Hide business categories in personal profile
- Rename categories for specific context
- Customize colors for visual differentiation

---

### Table: `merchants`

**Purpose**: Global normalized merchant/vendor database for Smart Categorization. Shared across ALL users.

**Level**: GLOBAL (no RLS)

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique merchant identifier. |
| `canonical_name` | VARCHAR(255) | UNIQUE, NOT NULL | Normalized merchant name (e.g., "Amazon"). |
| `aliases` | VARCHAR(255)[] | NULL | Array of name variations (["AMZN*", "Amazon Mktplace", "Amazon.it"]). |
| `website` | VARCHAR(255) | NULL | Merchant website (https://amazon.it). |
| `logo_url` | VARCHAR(500) | NULL | Logo URL for UI. |
| `vat_number` | VARCHAR(50) | NULL | VAT number if available. |
| `is_verified` | BOOLEAN | DEFAULT false | Manually verified merchant. |
| `usage_count` | INTEGER | DEFAULT 0 | Usage counter. Incremented on match. For ranking. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- UNIQUE (`canonical_name`)

**Indexes**:
- INDEX (`canonical_name`)
- GIN INDEX (`aliases`) - For fuzzy array search

**Business Rules**:
- **GLOBAL**: Shared across all users (no RLS)
- `canonical_name` is clean standard name
- `aliases` contains all variations found (populated by ML/OCR)
- `usage_count` helps ranking in search
- Populated by:
  - Initial seed (top 10k merchants)
  - OCR automatic extraction
  - User corrections
  - ML pattern detection

**Use Cases**:
- Merchant name normalization in transactions
- Auto-categorization based on merchant
- Fuzzy merchant search
- Merchant spending statistics

---

### Table: `tags`

**Purpose**: User-defined tags for multi-dimensional transaction classification. Enables flexible filtering beyond categories.

**Level**: USER-owned (shared across profiles)

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique tag identifier. |
| `user_id` | UUID | FK→users, NOT NULL | Tag owner. USER-LEVEL. |
| `name` | VARCHAR(50) | NOT NULL | Tag name (must start with #). |
| `tag_type` | tagtype | DEFAULT 'custom' | Type: 'contextual', 'functional', 'temporal', 'emotional', 'custom'. |
| `color` | VARCHAR(7) | NULL | HEX color for UI. |
| `description` | TEXT | NULL | Optional description. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users`(id) ON DELETE CASCADE
- UNIQUE (`user_id`, `name`)

**Indexes**:
- INDEX (`user_id`)

**RLS Policy**:
```sql
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tags_user_isolation ON tags
USING (user_id = current_setting('app.current_user_id')::uuid);
```

**Tag Types**:
- **contextual**: #work, #personal, #family - Transaction context
- **functional**: #deductible, #reimbursable, #shared - Fiscal/accounting function
- **temporal**: #recurring, #seasonal, #one-time - Temporal pattern
- **emotional**: #urgent, #luxury, #necessary - Emotional priority
- **custom**: User-defined without predefined type

**Business Rules**:
- **USER-LEVEL**: Shared across profiles
- Name must start with '#' (application validated)
- Max 50 tags per user (application limit)
- Deleted tags maintain historical associations (soft delete preferred)

**Use Cases**:
- Multi-dimensional transaction tagging
- Advanced filtering (e.g., "expenses #deductible #work")
- Cross-category analysis (e.g., all #urgent expenses)
- ML features (tags as classification input)

---

## 3. ACCOUNTS & TRANSACTIONS

### Table: `accounts`

**Purpose**: Financial accounts (bank accounts, credit cards, investments, cash, loans). Core entity for balance tracking.

**Level**: PROFILE-owned

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique account identifier. |
| `financial_profile_id` | UUID | FK→profiles, NOT NULL | Profile owning this account. |
| `name` | VARCHAR(255) | NOT NULL | Account name ("Checking Intesa", "Amex Gold"). |
| `account_type` | accounttype | NOT NULL | Type: checking, savings, credit_card, investment, cash, loan, mortgage, other. |
| `currency` | VARCHAR(3) | NOT NULL | Account currency (ISO 4217). |
| `initial_balance` | NUMERIC(15,2) | DEFAULT 0 | Starting balance at account creation. Immutable. |
| `current_balance` | NUMERIC(15,2) | DEFAULT 0 | Current balance. Updated by transactions (trigger/application). |
| `credit_limit` | NUMERIC(15,2) | NULL | Credit limit (credit_card only). |
| `interest_rate` | NUMERIC(5,2) | NULL | Annual interest rate % (loans/savings). |
| `institution_name` | VARCHAR(255) | NULL | Bank name ("Intesa Sanpaolo", "Unicredit"). |
| `account_number_last4` | VARCHAR(4) | NULL | Last 4 digits of account number. For safe identification. |
| `iban` | VARCHAR(34) | NULL | Full IBAN. **ENCRYPTED** if high-security profile. |
| `is_active` | BOOLEAN | DEFAULT true | Account status. `false` = closed but history preserved. |
| `is_included_in_totals` | BOOLEAN | DEFAULT true | Include in net worth calculation. `false` to exclude (transit accounts). |
| `notes` | TEXT | NULL | Free-form notes. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE CASCADE
- UNIQUE (`financial_profile_id`, `name`)

**Indexes**:
- INDEX (`financial_profile_id`)

**RLS Policy**: Standard profile isolation

**Business Rules**:
- `current_balance` = `initial_balance` + SUM(transactions.amount_clear)
- For credit cards: negative balance = debt
- For loans/mortgages: negative balance = remaining debt
- `iban` encrypted if profile `security_level='high_security'`
- `account_number_last4` for UI identification without exposing full number
- Balance updated via trigger or application logic on transaction insert/update/delete

**Use Cases**:
- Multi-account management
- Balance tracking
- Bank reconciliation
- Net worth calculation

---

### Table: `exchange_rates`

**Purpose**: Historical currency exchange rates for multi-currency transaction conversion.

**Level**: GLOBAL (no RLS)

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique rate identifier. |
| `base_currency` | VARCHAR(3) | NOT NULL | Base currency (ISO 4217). |
| `target_currency` | VARCHAR(3) | NOT NULL | Target currency (ISO 4217). |
| `rate` | NUMERIC(18,8) | NOT NULL | Exchange rate. High precision (8 decimals). 1 base = rate target. |
| `rate_date` | DATE | NOT NULL | Date of validity. |
| `source` | VARCHAR(50) | NOT NULL | Data source ('ECB', 'OpenExchangeRates', 'Manual'). |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp. |

**Constraints**:
- PRIMARY KEY (`id`)
- UNIQUE (`base_currency`, `target_currency`, `rate_date`)

**Indexes**:
- INDEX (`base_currency`, `target_currency`, `rate_date`)

**Business Rules**:
- Populated automatically by scheduled job (daily)
- Preferred source: ECB (European Central Bank) for EUR
- Fallback: OpenExchangeRates API
- Complete historical data maintained (no deletes)
- For missing dates: interpolation or use most recent available rate

**Use Cases**:
- Multi-currency transaction conversion
- Calculate `amount_in_profile_currency`
- Reports in unified currency
- Historical analysis with correct rates

---

### Table: `recurring_transactions`

**Purpose**: Templates for recurring transactions (subscriptions, salaries, bills). Generates future occurrences.

**Level**: PROFILE-owned

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique template identifier. |
| `financial_profile_id` | UUID | FK→profiles, NOT NULL | Profile owner. |
| `account_id` | UUID | FK→accounts, NOT NULL | Associated account. |
| `category_id` | UUID | FK→categories, NULL | Default category. |
| `name` | VARCHAR(255) | NOT NULL | Template name ("Monthly Salary", "Netflix Subscription"). |
| `description` | TEXT | NULL | Detailed description. |
| `transaction_type` | transactiontype | NOT NULL | Transaction type enum. |
| `amount_model` | amountmodel | DEFAULT 'fixed' | Amount variation: fixed, variable_within_range, progressive, seasonal, formula. |
| `base_amount` | NUMERIC(15,2) | NOT NULL | Base amount. Negative=expense, positive=income. |
| `amount_min` | NUMERIC(15,2) | NULL | Minimum amount (for variable model). |
| `amount_max` | NUMERIC(15,2) | NULL | Maximum amount (for variable model). |
| `formula` | TEXT | NULL | Calculation formula (for formula model). |
| `currency` | VARCHAR(3) | NOT NULL | Currency. |
| `frequency` | frequency | NOT NULL | Frequency: daily, weekly, biweekly, monthly, quarterly, semiannually, yearly, custom. |
| `interval` | INTEGER | DEFAULT 1 | Frequency multiplier. frequency=monthly, interval=2 → every 2 months. |
| `start_date` | DATE | NOT NULL | Start date. |
| `end_date` | DATE | NULL | End date (optional). NULL = indefinite. |
| `next_occurrence_date` | DATE | NULL | Next calculated occurrence. Auto-updated. |
| `auto_create` | BOOLEAN | DEFAULT false | Auto-create transaction at due date. `true`=full automation. |
| `notification_days_before` | INTEGER | DEFAULT 3 | Days before due date to notify. |
| `is_active` | BOOLEAN | DEFAULT true | Template status. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE CASCADE
- FOREIGN KEY (`account_id`) REFERENCES `accounts`(id) ON DELETE CASCADE
- FOREIGN KEY (`category_id`) REFERENCES `categories`(id) ON DELETE SET NULL

**Indexes**:
- INDEX (`financial_profile_id`)
- INDEX (`next_occurrence_date`) - For scheduled job

**Amount Models**:
- **fixed**: Constant amount (rent, subscriptions)
- **variable_within_range**: Varies between min/max (utilities)
- **progressive**: Programmed increase (mortgage with rising payments)
- **seasonal**: Seasonal variation (heating in winter)
- **formula**: Custom calculation (e.g., `base * (1 + inflation)`)

**Business Rules**:
- `next_occurrence_date` calculated by scheduled job (daily)
- If `auto_create=true`: transaction auto-created at due date
- If `auto_create=false`: notification + user confirmation required
- `end_date` can be used for one-time future events (`start_date = end_date`)
- Holiday handling: if occurrence falls on holiday, moved to next business day (configurable)

**Use Cases**:
- Subscription management (Netflix, Spotify, gym)
- Recurring income (salaries)
- Bills (utilities, phone, insurance)
- Loan/mortgage payments
- Future estimated expenses (trips, large purchases)

---

### Table: `recurring_transaction_occurrences`

**Purpose**: Individual occurrences generated from recurring templates. Tracks execution status.

**Level**: Child of recurring_transactions

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique occurrence identifier. |
| `recurring_transaction_id` | UUID | FK→recurring_transactions, NOT NULL | Parent template. |
| `transaction_id` | UUID | FK→transactions, NULL | Actual transaction created (if executed). |
| `scheduled_date` | DATE | NOT NULL | Scheduled date. |
| `expected_amount` | NUMERIC(15,2) | NOT NULL | Expected amount (calculated from amount_model). |
| `actual_amount` | NUMERIC(15,2) | NULL | Actual amount (if different from expected). |
| `status` | occurrencestatus | DEFAULT 'pending' | Status: pending, executed, skipped, overridden, failed. |
| `notes` | TEXT | NULL | Notes (e.g., skip reason). |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`recurring_transaction_id`) REFERENCES `recurring_transactions`(id) ON DELETE CASCADE
- FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(id) ON DELETE SET NULL

**Indexes**:
- INDEX (`recurring_transaction_id`)
- INDEX (`scheduled_date`)

**Statuses**:
- **pending**: Not yet executed, waiting
- **executed**: Transaction created successfully (`transaction_id` populated)
- **skipped**: Deliberately skipped (vacation, suspended subscription)
- **overridden**: Manually modified (different amount or date)
- **failed**: Creation attempt failed (validation error)

**Business Rules**:
- Auto-created by scheduled job when `next_occurrence_date` reached
- If `auto_create=true` in parent: status → 'executed', transaction created
- If `auto_create=false`: status → 'pending', user notified
- `actual_amount` populated only if different from `expected_amount`
- Complete history maintained for analytics (anomaly detection, pattern analysis)

**Use Cases**:
- Future recurrence timeline
- Subscription execution tracking
- Anomaly detection (unusual amounts)
- Bank statement reconciliation

---

### Table: `transactions`

**Purpose**: All financial transactions. Core table for tracking all money movements.

**Level**: PROFILE-owned

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique transaction identifier. |
| `financial_profile_id` | UUID | FK→profiles, NOT NULL | Profile owner. |
| `account_id` | UUID | FK→accounts, NOT NULL | Source account. |
| `category_id` | UUID | FK→categories, NULL | Category (can be NULL if uncategorized). |
| `merchant_id` | UUID | FK→merchants, NULL | Normalized merchant. |
| `recurring_transaction_id` | UUID | FK→recurring_transactions, NULL | Parent recurrence if auto-generated. |
| `related_transaction_id` | UUID | FK→transactions (self), NULL | Related transaction (for internal transfers). |
| `transaction_date` | DATE | NOT NULL | Transaction date. |
| `transaction_type` | transactiontype | NOT NULL | Type enum (bank_transfer, purchase, income, salary, etc.). |
| `source` | transactionsource | DEFAULT 'manual' | Source: manual, import_csv, import_ocr, import_api, recurring, bank_sync. |
| `amount` | TEXT | NOT NULL | Amount **ENCRYPTED** (HS profiles). Base64 ciphertext. |
| `amount_clear` | NUMERIC(15,2) | NOT NULL | Amount cleartext. **Always populated** for queries. Negative=expense, positive=income. |
| `currency` | VARCHAR(3) | NOT NULL | Original transaction currency. |
| `exchange_rate` | NUMERIC(18,8) | NULL | Applied exchange rate (if currency ≠ profile currency). |
| `amount_in_profile_currency` | NUMERIC(15,2) | NOT NULL | Amount converted to profile currency. For aggregations. |
| `description` | TEXT | NULL | Description **ENCRYPTED** (HS profiles). |
| `description_clear` | VARCHAR(255) | NULL | Truncated cleartext description. Max 255 chars for preview/search. |
| `merchant_name` | VARCHAR(255) | NULL | Merchant name (denormalized). For queries without JOIN. |
| `notes` | TEXT | NULL | Private notes **ENCRYPTED** (HS profiles). |
| `is_reconciled` | BOOLEAN | DEFAULT false | Bank statement reconciliation flag. |
| `receipt_url` | VARCHAR(500) | NULL | Receipt/document URL (external storage). |
| `is_duplicate` | BOOLEAN | DEFAULT false | Duplicate detection flag. |
| `duplicate_of_id` | UUID | FK→transactions (self), NULL | Original transaction if this is duplicate. |
| `import_job_id` | UUID | NULL | Import job ID if from batch import. |
| `external_id` | VARCHAR(255) | NULL | External system ID (bank API). For deduplication. |
| `metadata` | JSONB | NULL | Extensible metadata. E.g., `{"geolocation": "...", "pos_id": "..."}`. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE CASCADE
- FOREIGN KEY (`account_id`) REFERENCES `accounts`(id) ON DELETE CASCADE
- FOREIGN KEY (`category_id`) REFERENCES `categories`(id) ON DELETE SET NULL
- FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(id) ON DELETE SET NULL
- FOREIGN KEY (`recurring_transaction_id`) REFERENCES `recurring_transactions`(id) ON DELETE SET NULL
- FOREIGN KEY (`related_transaction_id`) REFERENCES `transactions`(id) ON DELETE SET NULL
- FOREIGN KEY (`duplicate_of_id`) REFERENCES `transactions`(id) ON DELETE SET NULL

**Indexes**:
- INDEX (`financial_profile_id`, `transaction_date`)
- INDEX (`account_id`, `transaction_date`)
- INDEX (`category_id`)
- INDEX (`merchant_id`)
- INDEX (`transaction_date`)

**RLS Policy**: Standard profile isolation

**Encryption (High-Security Profiles)**:
- If `financial_profiles.security_level='high_security'`:
  - `amount`: Encrypted (AES-256-GCM), stored as base64 TEXT
  - `description`: Encrypted
  - `notes`: Encrypted
  - `amount_clear`, `description_clear`: **Always cleartext** for queries
  - Key: PBKDF2(user_password + profile_salt)

**Business Rules - Amount**:
- Negative = expense/outflow
- Positive = income/inflow
- `amount_in_profile_currency` = `amount_clear * exchange_rate`
- Updates `accounts.current_balance` (trigger or application)

**Business Rules - Duplicates**:
- Detected by fuzzy algorithm (same date, similar amount, similar merchant)
- `is_duplicate=true`: Marked but not deleted (user decides)
- `duplicate_of_id`: Points to original

**Business Rules - Internal Transfers**:
- `transaction_type='internal_transfer'`: Between accounts in same profile
- Created in pairs: one negative (source), one positive (target)
- `related_transaction_id`: Reciprocal link

**Use Cases**:
- All expense/income tracking
- Budgeting
- Reporting
- Bank reconciliation
- Tax reporting
- ML analytics

---

### Table: `transaction_tags`

**Purpose**: Many-to-Many junction table between transactions and tags.

**Level**: Junction table

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `transaction_id` | UUID | PK (composite), FK→transactions | Tagged transaction. |
| `tag_id` | UUID | PK (composite), FK→tags | Applied tag. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Association timestamp. |

**Constraints**:
- PRIMARY KEY (`transaction_id`, `tag_id`)
- FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(id) ON DELETE CASCADE
- FOREIGN KEY (`tag_id`) REFERENCES `tags`(id) ON DELETE CASCADE

**Business Rules**:
- One transaction can have N tags
- One tag can be applied to N transactions
- Transaction deletion → removes associations
- Tag deletion → removes associations (prefer soft delete on tags)

---
## 5. BUDGETING & GOALS

### Table: `budgets`

**Purpose**: Spending budgets with flexible scope (user/profile/multi-profile aggregation). USER-LEVEL entity with SCOPE pattern.

**Level**: USER-owned with SCOPE

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique budget identifier. |
| `user_id` | UUID | FK→users, NOT NULL | Budget owner. USER-LEVEL. |
| `name` | VARCHAR(255) | NOT NULL | Budget name ("November Budget", "Home Expenses"). |
| `scope_type` | scopetype | DEFAULT 'user' | Scope: 'user' (all profiles), 'profile' (one), 'multi_profile' (selected). |
| `scope_profile_ids` | UUID[] | NULL | Array of profile IDs. Required if scope='profile' or 'multi_profile'. NULL if 'user'. |
| `period_type` | periodtype | DEFAULT 'monthly' | Period: daily, weekly, monthly, quarterly, yearly, custom. |
| `start_date` | DATE | NOT NULL | Period start date. |
| `end_date` | DATE | NULL | Period end date. NULL for rolling budgets. |
| `total_amount` | NUMERIC(15,2) | NOT NULL | Total budget amount. Sum of category allocations. |
| `currency` | VARCHAR(3) | NOT NULL | Budget currency. |
| `rollover_enabled` | BOOLEAN | DEFAULT false | Rollover unspent to next period. `true` = accumulates. |
| `alert_threshold_percent` | INTEGER | DEFAULT 80 | Alert threshold %. Alert at 80% spent. |
| `is_active` | BOOLEAN | DEFAULT true | Budget status. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users`(id) ON DELETE CASCADE
- CHECK (`alert_threshold_percent` BETWEEN 0 AND 100)
- CHECK (`end_date` IS NULL OR `end_date` >= `start_date`)

**Indexes**:
- INDEX (`user_id`)
- INDEX (`start_date`, `end_date`)

**RLS Policy**:
```sql
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY budgets_user_isolation ON budgets
USING (user_id = current_setting('app.current_user_id')::uuid);
```

**Business Rules - Scope**:
- `scope_type='user'`: Aggregates expenses from **all** user's profiles. `scope_profile_ids=NULL`.
- `scope_type='profile'`: Budget for specific profile only. `scope_profile_ids=['{profile-uuid}']`.
- `scope_type='multi_profile'`: Aggregates selected profiles. `scope_profile_ids=['{prof1-uuid}', '{prof2-uuid}']`.

**Examples**:
```sql
-- User-wide budget (all profiles)
{scope_type: 'user', scope_profile_ids: null}

-- Single profile budget
{scope_type: 'profile', scope_profile_ids: ['aaaa-bbbb-cccc-dddd']}

-- Multi-profile budget (Personal + Family, exclude Business)
{scope_type: 'multi_profile', scope_profile_ids: ['personal-uuid', 'family-uuid']}
```

**Business Rules - Calculation**:
```sql
-- Spent amount considering scope
SELECT SUM(ABS(t.amount_clear))
FROM transactions t
JOIN budget_categories bc ON bc.category_id = t.category_id
WHERE bc.budget_id = :budget_id
  AND t.transaction_date BETWEEN :start_date AND :end_date
  AND (
      :scope_type = 'user' 
      OR t.financial_profile_id = ANY(:scope_profile_ids)
  )
  AND t.amount_clear < 0;  -- Only expenses
```

**Business Rules - Alerts**:
- Alert triggered when: `(spent / total_amount) * 100 >= alert_threshold_percent`
- Notification created in `notifications` table
- Delivery via email/push per `user_preferences`

**Use Cases**:
- Monthly personal budget
- Annual family budget
- Quarterly business budget
- Cross-profile budgets (e.g., "Total Groceries" from Personal + Family)

---

### Table: `budget_categories`

**Purpose**: Budget allocation per category. Junction table with spending tracking.

**Level**: Child of budgets

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique allocation identifier. |
| `budget_id` | UUID | FK→budgets, NOT NULL | Parent budget. |
| `category_id` | UUID | FK→categories, NOT NULL | Allocated category. |
| `allocated_amount` | NUMERIC(15,2) | NOT NULL | Allocated amount for this category. |
| `spent_amount` | NUMERIC(15,2) | DEFAULT 0 | Spent amount. Calculated from transactions. Denormalized for performance. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`budget_id`) REFERENCES `budgets`(id) ON DELETE CASCADE
- FOREIGN KEY (`category_id`) REFERENCES `categories`(id) ON DELETE CASCADE
- UNIQUE (`budget_id`, `category_id`)

**Indexes**:
- INDEX (`budget_id`)

**Business Rules**:
- `spent_amount` updated periodically (scheduled job or real-time trigger)
- Validation: `SUM(allocated_amount) = budgets.total_amount` (application enforced)
- Percentage used: `(spent_amount / allocated_amount) * 100`
- UI color coding: green (<70%), yellow (70-100%), red (>100%)

**Use Cases**:
- Budget allocation by category
- Spending vs allocated tracking
- Budget drill-down analysis

---

### Table: `financial_goals`

**Purpose**: Financial savings goals with flexible scope. Supports cross-profile accumulation.

**Level**: USER-owned with SCOPE

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique goal identifier. |
| `user_id` | UUID | FK→users, NOT NULL | Goal owner. USER-LEVEL. |
| `name` | VARCHAR(255) | NOT NULL | Goal name ("House Down Payment", "2026 Vacation"). |
| `scope_type` | scopetype | DEFAULT 'user' | Scope: 'user', 'profile', 'multi_profile'. |
| `scope_profile_ids` | UUID[] | NULL | Array of profile IDs for scope. |
| `linked_account_id` | UUID | FK→accounts, NULL | Dedicated account for goal (optional). |
| `goal_type` | goaltype | NOT NULL | Type: house, car, vacation, retirement, emergency_fund, education, investment, debt_payoff, custom. |
| `description` | TEXT | NULL | Goal description. |
| `target_amount` | NUMERIC(15,2) | NOT NULL | Target amount. |
| `current_amount` | NUMERIC(15,2) | DEFAULT 0 | Accumulated amount. Updated from `goal_contributions`. |
| `currency` | VARCHAR(3) | NOT NULL | Goal currency. |
| `start_date` | DATE | NOT NULL | Start date. |
| `target_date` | DATE | NOT NULL | Target completion date. |
| `notes` | TEXT | NULL | Optional notes about the goal. |
| `monthly_contribution` | NUMERIC(15,2) | NULL | Suggested monthly contribution. Calculated: `(target - current) / months_remaining`. |
| `auto_allocate` | BOOLEAN | DEFAULT false | Auto-allocate funds from transactions. |
| `priority` | INTEGER | DEFAULT 5 | Priority (1-10). For resource allocation if limited funds. |
| `status` | goalstatus | DEFAULT 'active' | Status: active, completed, paused, cancelled, failed. |
| `achievement_probability` | NUMERIC(5,2) | NULL | ML-calculated achievement probability %. E.g., 85.5 = 85.5%. |
| `gamification_points` | INTEGER | DEFAULT 0 | Gamification points. +10/contribution, +100/milestone, +500/completion. |
| `milestones` | JSONB | NULL | Intermediate milestones. Structure: `{"milestones": [{"amount": 15000, "label": "30%", "achieved": false}]}`. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users`(id) ON DELETE CASCADE
- FOREIGN KEY (`linked_account_id`) REFERENCES `accounts`(id) ON DELETE SET NULL
- CHECK (`target_date` >= `start_date`)
- CHECK (`priority` BETWEEN 1 AND 10)

**Indexes**:
- INDEX (`user_id`)
- INDEX (`target_date`)
- INDEX (`status`)

**RLS Policy**: Standard user isolation

**Business Rules - Scope**:
- `scope_type='user'`: Accumulates from all profiles
- `scope_type='profile'`: Accumulates only from specific profile
- `scope_type='multi_profile'`: Accumulates from selected profiles
- Example: "House Down Payment" accumulates savings from Personal + Family, excludes Business

**Business Rules - Progress**:
- Progress percentage: `(current_amount / target_amount) * 100`
- Months remaining: `(target_date - CURRENT_DATE) / 30`
- `monthly_contribution` recalculated periodically
- `achievement_probability` calculated by ML (considers contribution history, spending patterns)

**Business Rules - Gamification**:
- Contribution: +10 points
- Milestone reached: +100 points
- Goal completed: +500 points
- Points used for badges, leaderboards, motivation

**Use Cases**:
- House down payment savings
- Emergency fund building
- Vacation savings
- Retirement planning
- Debt payoff tracking

---

### Table: `goal_contributions`

**Purpose**: Individual contributions/deposits to goals. Complete historical tracking.

**Level**: Child of financial_goals

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique contribution identifier. |
| `goal_id` | UUID | FK→financial_goals, NOT NULL | Parent goal. |
| `transaction_id` | UUID | FK→transactions, NULL | Associated transaction (optional). |
| `amount` | NUMERIC(15,2) | NOT NULL | Contribution amount. Always positive. |
| `contribution_date` | DATE | NOT NULL | Contribution date. |
| `notes` | TEXT | NULL | Notes (e.g., "Christmas bonus"). |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`goal_id`) REFERENCES `financial_goals`(id) ON DELETE CASCADE
- FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(id) ON DELETE SET NULL

**Indexes**:
- INDEX (`goal_id`)
- INDEX (`contribution_date`)

**Business Rules**:
- `amount` always positive
- Updates `financial_goals.current_amount`: `current_amount += amount`
- Updates `gamification_points`: +10 per contribution
- Checks milestones: if threshold crossed, `achieved=true`, +100 points
- Can be linked to specific transaction or manual entry

**Use Cases**:
- Goal contribution tracking
- Contribution frequency analysis
- Complete savings history
- ML input for achievement_probability calculation

---

### Table: `goal_milestones`

**Purpose**: Individual milestones for tracking progress toward financial goals.

**Level**: Child of financial_goals

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique milestone identifier. |
| `goal_id` | UUID | FK→financial_goals, NOT NULL | Parent goal. |
| `name` | VARCHAR(255) | NOT NULL | Milestone name (e.g., "First 1000", "50%"). |
| `target_amount` | NUMERIC(15,2) | NOT NULL | Target amount for this milestone. |
| `target_date` | DATE | NOT NULL | Target date to reach milestone. |
| `is_completed` | BOOLEAN | DEFAULT false | Completion flag. |
| `completed_at` | TIMESTAMPTZ | NULL | Completion timestamp. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`goal_id`) REFERENCES `financial_goals`(id) ON DELETE CASCADE

**Indexes**:
- INDEX (`goal_id`)

**Business Rules**:
- Milestones help track intermediate progress toward goals
- `is_completed` set to true when `current_amount >= target_amount`
- `completed_at` populated when milestone achieved
- Used for gamification: +100 points per milestone reached

**Use Cases**:
- Breaking large goals into manageable steps
- Progress visualization
- Gamification and motivation
- Milestone-based notifications

---

## 6. ASSETS & VALUATIONS

### Table: `assets`

**Purpose**: Physical and financial assets (real estate, vehicles, investments, collectibles). Tracks net worth components.

**Level**: PROFILE-owned (legal ownership)

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique asset identifier. |
| `financial_profile_id` | UUID | FK→profiles, NOT NULL | Profile owner. PROFILE-LEVEL (legal ownership). |
| `name` | VARCHAR(255) | NOT NULL | Asset name ("Milan Apartment", "Tesla Model 3", "Apple Stock"). |
| `asset_type` | assettype | NOT NULL | Type: real_estate, vehicle, precious_metal, stock, bond, fund, etf, crypto, artwork, jewelry, watch, other. |
| `purchase_date` | DATE | NULL | Purchase date. |
| `purchase_price` | NUMERIC(15,2) | NULL | Original purchase price. |
| `purchase_transaction_id` | UUID | FK→transactions, NULL | Purchase transaction. |
| `current_value` | NUMERIC(15,2) | NOT NULL | Current value (best estimate). |
| `current_value_min` | NUMERIC(15,2) | NULL | Minimum estimated value (for range valuations). |
| `current_value_max` | NUMERIC(15,2) | NULL | Maximum estimated value. |
| `valuation_method` | valuationmethod | DEFAULT 'manual' | Method: market_quote, range, comparative, manual, appraisal. |
| `last_valuation_date` | DATE | NULL | Last valuation date. |
| `currency` | VARCHAR(3) | NOT NULL | Currency. |
| `is_liquid` | BOOLEAN | DEFAULT false | Liquid asset flag. `true` for easily convertible to cash (stocks). `false` for illiquid (real estate). |
| `quantity` | NUMERIC(18,8) | NULL | Quantity (for fractional assets: stocks, crypto). High precision (8 decimals). |
| `ticker_symbol` | VARCHAR(20) | NULL | Ticker symbol (for quoted assets: AAPL, BTC-USD). |
| `notes` | TEXT | NULL | Notes. |
| `metadata` | JSONB | NULL | Extensible metadata. E.g., `{"address": "...", "cadastral_id": "..."}` for real estate. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE CASCADE
- FOREIGN KEY (`purchase_transaction_id`) REFERENCES `transactions`(id) ON DELETE SET NULL
- CHECK (`current_value_min` IS NULL OR `current_value_max` IS NULL OR `current_value_min` <= `current_value_max`)

**Indexes**:
- INDEX (`financial_profile_id`)
- INDEX (`asset_type`)
- INDEX (`ticker_symbol`)

**RLS Policy**: Standard profile isolation

**Valuation Methods**:
- **market_quote**: Market quotation (stocks, crypto). Auto-updated from API.
- **range**: Range valuation (real estate). `current_value` = midpoint.
- **comparative**: Market comparison (vehicles, collectibles).
- **manual**: User manual estimate.
- **appraisal**: Professional appraisal.

**Business Rules - Updates**:
- For `valuation_method='market_quote'`: Scheduled job updates `current_value` from API (daily/hourly)
- Other methods: Manual user update
- Every update creates record in `asset_valuations` (history)

**Business Rules - Liquidity**:
- `is_liquid=true`: Counted in liquid assets for liquidity calculations
- `is_liquid=false`: Immobilized wealth

**Use Cases**:
- Total net worth tracking
- Net worth calculation
- Asset allocation analysis
- Investment performance tracking
- Estate planning

---

### Table: `asset_valuations`

**Purpose**: Historical asset valuations. Time series for performance analysis.

**Level**: Child of assets

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique valuation identifier. |
| `asset_id` | UUID | FK→assets, NOT NULL | Parent asset. |
| `valuation_date` | DATE | NOT NULL | Valuation date. |
| `value` | NUMERIC(15,2) | NOT NULL | Value (best estimate). |
| `value_min` | NUMERIC(15,2) | NULL | Minimum value (if range). |
| `value_max` | NUMERIC(15,2) | NULL | Maximum value (if range). |
| `valuation_method` | valuationmethod | NOT NULL | Method used. |
| `source` | VARCHAR(100) | NULL | Valuation source ("Yahoo Finance API", "Notary Appraisal", "Manual"). |
| `notes` | TEXT | NULL | Valuation notes. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`asset_id`) REFERENCES `assets`(id) ON DELETE CASCADE

**Indexes**:
- INDEX (`asset_id`, `valuation_date`)

**Business Rules**:
- Auto-created whenever `assets.current_value` updated
- Complete history maintained (no deletes for analytics)
- Used for performance calculations: `ROI = (current_value - purchase_price) / purchase_price * 100`

**Use Cases**:
- Asset value chart over time
- ROI calculation
- Performance comparison between assets
- Tax reporting (capital gains)

---

## 7. IMPORT & DOCUMENTS

### Table: `documents`

**Purpose**: Scanned/uploaded documents (receipts, invoices, contracts) with OCR processing.

**Level**: PROFILE-owned

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique document identifier. |
| `financial_profile_id` | UUID | FK→profiles, NOT NULL | Profile owner. |
| `transaction_id` | UUID | FK→transactions, NULL | Associated transaction (if applicable). |
| `document_type` | documenttype | NOT NULL | Type: receipt, invoice, contract, bank_statement, tax_document, insurance, other. |
| `file_name` | VARCHAR(255) | NOT NULL | Original filename. |
| `file_path` | VARCHAR(500) | NOT NULL | Storage path (S3/local). E.g., `"s3://bucket/docs/{profile_id}/{id}.pdf"`. |
| `file_size` | INTEGER | NOT NULL | File size in bytes. |
| `mime_type` | VARCHAR(100) | NOT NULL | MIME type (`application/pdf`, `image/jpeg`). |
| `file_hash` | VARCHAR(64) | NOT NULL | SHA256 hash for deduplication and integrity. |
| `ocr_processed` | BOOLEAN | DEFAULT false | OCR completion flag. |
| `ocr_text` | TEXT | NULL | Full text extracted by OCR. |
| `extracted_data` | JSONB | NULL | Structured extracted data. E.g., `{"vendor": "...", "total": 49.99, "items": [...]}`. |
| `confidence_score` | NUMERIC(5,4) | NULL | OCR confidence (0-1). E.g., 0.95 = 95% confidence. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE CASCADE
- FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(id) ON DELETE SET NULL

**Indexes**:
- INDEX (`financial_profile_id`)
- INDEX (`file_hash`)
- INDEX (`ocr_processed`) - For OCR job queue

**RLS Policy**: Standard profile isolation

**Business Rules**:
- Upload flow: Save file to storage → Create record with `ocr_processed=false`
- Async job: Process OCR → Populate `ocr_text`, `extracted_data`, `confidence_score` → `ocr_processed=true`
- `file_hash`: SHA256 for deduplication (identical file = same hash)
- `extracted_data` structure varies by `document_type`:
  - **receipt**: `{vendor, date, items: [{name, price}], subtotal, tax, total, payment_method}`
  - **invoice**: `{vendor, vat_number, date, invoice_number, items, total}`
  - **contract**: `{parties, start_date, end_date, amount, clauses: [...]}`

**Use Cases**:
- Receipt upload from mobile (photo of receipt)
- Tax document archival
- Auto-transaction creation from OCR
- Contract data extraction (mortgages, insurance)
- Compliance and audit trail

---

### Table: `import_jobs`

**Purpose**: Batch import job tracking (CSV, Excel, OFX, API). Progress and error monitoring.

**Level**: PROFILE-owned

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique job identifier. |
| `financial_profile_id` | UUID | FK→profiles, NOT NULL | Profile owner. |
| `account_id` | UUID | FK→accounts, NULL | Target account (if applicable). |
| `file_name` | VARCHAR(255) | NOT NULL | Imported filename. |
| `file_path` | VARCHAR(500) | NOT NULL | File storage path. |
| `import_type` | importtype | NOT NULL | Type: csv, excel, ofx, qif, pdf, ocr_receipt, ocr_invoice, ocr_contract, bank_api. |
| `status` | importstatus | DEFAULT 'pending' | Status: pending, processing, completed, failed, partial. |
| `total_rows` | INTEGER | NULL | Total rows/records to import. |
| `processed_rows` | INTEGER | NULL | Rows processed. |
| `successful_imports` | INTEGER | NULL | Successful imports. |
| `failed_imports` | INTEGER | NULL | Failed imports. |
| `skipped_duplicates` | INTEGER | NULL | Duplicates skipped. |
| `error_message` | TEXT | NULL | Error message (if `status='failed'`). |
| `error_details` | JSONB | NULL | Per-row error details. E.g., `{"row_5": "Invalid date format", ...}`. |
| `mapping_config` | JSONB | NULL | Column mapping configuration. E.g., `{"date": "Data", "amount": "Importo", ...}`. |
| `started_at` | TIMESTAMPTZ | NULL | Processing start timestamp. |
| `completed_at` | TIMESTAMPTZ | NULL | Completion timestamp. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Job creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE CASCADE
- FOREIGN KEY (`account_id`) REFERENCES `accounts`(id) ON DELETE SET NULL

**Indexes**:
- INDEX (`financial_profile_id`)
- INDEX (`status`)

**RLS Policy**: Standard profile isolation

**Business Rules**:
- Upload flow: Upload file → Create job `status='pending'`
- Async worker: `status='processing'` → Process rows → Update counters → `status='completed'|'failed'|'partial'`
- `partial`: Some records imported, others failed (details in `error_details`)
- `mapping_config`: User configures file column → DB field mapping
- Created transactions have `import_job_id` linked

**Use Cases**:
- Bank statement CSV import
- Transaction import from Excel
- Bulk import from bank API
- Import progress monitoring

---

### Table: `bank_conditions`

**Purpose**: Bank account contract terms (rates, fees) with historical tracking.

**Level**: PROFILE-owned

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique condition record identifier. |
| `financial_profile_id` | UUID | FK→profiles, NOT NULL | Profile owner. |
| `account_id` | UUID | FK→accounts, NULL | Associated account. |
| `institution_name` | VARCHAR(255) | NOT NULL | Bank name ("Intesa Sanpaolo"). |
| `document_id` | UUID | FK→documents, NULL | Contract document (if OCR). |
| `effective_date` | DATE | NOT NULL | Effective date of these conditions. |
| `interest_rate` | NUMERIC(5,2) | NULL | Annual interest rate %. |
| `annual_fee` | NUMERIC(10,2) | NULL | Annual account fee. |
| `transaction_fees` | JSONB | NULL | Transaction fees. E.g., `{"wire_transfer": 2.50, "atm_withdrawal": 1.00}`. |
| `conditions_summary` | TEXT | NULL | Human-readable summary. |
| `full_conditions` | JSONB | NULL | Complete structured conditions. E.g., `{"sections": [{...}]}`. |
| `changes_from_previous` | TEXT | NULL | Diff from previous version. |
| `annual_cost_estimate` | NUMERIC(10,2) | NULL | Estimated annual cost (fees + charges). |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE CASCADE
- FOREIGN KEY (`account_id`) REFERENCES `accounts`(id) ON DELETE SET NULL
- FOREIGN KEY (`document_id`) REFERENCES `documents`(id) ON DELETE SET NULL

**Indexes**:
- INDEX (`financial_profile_id`)
- INDEX (`account_id`, `effective_date`)

**RLS Policy**: Standard profile isolation

**Business Rules**:
- Created manually or auto-extracted from documents (OCR)
- When bank changes conditions: Create new record with new `effective_date`
- `changes_from_previous`: Automatic diff with previous version
- Auto-alert if `annual_cost_estimate` increases >10%

**Use Cases**:
- Bank condition tracking over time
- Bank offer comparison
- Unilateral change alerts
- Actual account cost calculation
- Optimization: Bank switching recommendations

---

## 8. ML & AI

### Table: `ml_classification_logs`

**Purpose**: ML transaction classification logs. Training data and performance tracking.

**Level**: PROFILE-owned

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique log identifier. |
| `transaction_id` | UUID | FK→transactions, NOT NULL | Classified transaction. |
| `financial_profile_id` | UUID | FK→profiles, NOT NULL | For RLS. |
| `original_description` | TEXT | NOT NULL | Original transaction description (ML input). |
| `suggested_category_id` | UUID | FK→categories, NULL | Suggested category. |
| `suggested_merchant_id` | UUID | FK→merchants, NULL | Suggested merchant. |
| `suggested_tags` | VARCHAR(50)[] | NULL | Suggested tags array. |
| `confidence_score` | NUMERIC(5,4) | NOT NULL | Confidence (0-1). E.g., 0.92 = 92% confidence. |
| `model_name` | VARCHAR(100) | NOT NULL | Model name ("gradient_boosting_v3"). |
| `model_version` | VARCHAR(50) | NOT NULL | Model version ("3.2.1"). |
| `features_used` | JSONB | NULL | ML input features. E.g., `{"merchant_match": 0.98, "historical_freq": 0.85}`. |
| `explanation` | TEXT | NULL | XAI human-readable explanation. E.g., "Categorized as Shopping because...". |
| `was_accepted` | BOOLEAN | NULL | User accepted suggestion? `true`/`false`/`null` (no feedback). |
| `actual_category_id` | UUID | FK→categories, NULL | User-chosen final category. |
| `user_feedback` | TEXT | NULL | User textual feedback. |
| `processing_time_ms` | INTEGER | NULL | Classification latency (ms). For performance monitoring. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Classification timestamp. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(id) ON DELETE SET NULL
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE CASCADE
- FOREIGN KEY (`suggested_category_id`) REFERENCES `categories`(id) ON DELETE SET NULL
- FOREIGN KEY (`suggested_merchant_id`) REFERENCES `merchants`(id) ON DELETE SET NULL
- FOREIGN KEY (`actual_category_id`) REFERENCES `categories`(id) ON DELETE SET NULL

**Indexes**:
- INDEX (`financial_profile_id`)
- INDEX (`transaction_id`)
- INDEX (`created_at`)

**RLS Policy**: Standard profile isolation

**Business Rules**:
- Created every time ML classifies transaction
- `was_accepted=true`: User accepts → positive training example
- `was_accepted=false`: User corrects → negative training → active learning
- `was_accepted=null`: User ignores suggestion
- `features_used`: For debugging and XAI
- `explanation`: Generated by SHAP/LIME or rule-based

**Use Cases**:
- ML model training (supervised learning)
- Performance metrics (accuracy, precision, recall)
- Active learning (focus on low confidence)
- XAI (explainability for user)
- A/B testing new models

---

### Table: `predictions`

**Purpose**: Future spending/income predictions. Forecasting model outputs.

**Level**: PROFILE-owned

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique prediction identifier. |
| `financial_profile_id` | UUID | FK→profiles, NOT NULL | Profile owner. |
| `prediction_type` | VARCHAR(50) | NOT NULL | Type ('expense', 'income', 'balance', 'category_expense'). |
| `category_id` | UUID | FK→categories, NULL | Category (if category-specific prediction). |
| `prediction_date` | DATE | NOT NULL | Predicted date. |
| `predicted_amount` | NUMERIC(15,2) | NOT NULL | Predicted amount. |
| `confidence_interval_min` | NUMERIC(15,2) | NULL | Lower CI bound (e.g., 95% CI). |
| `confidence_interval_max` | NUMERIC(15,2) | NULL | Upper CI bound. |
| `confidence_level` | NUMERIC(5,2) | NULL | Confidence level (e.g., 0.95 = 95%). |
| `model_name` | VARCHAR(100) | NOT NULL | Model used ("prophet_seasonal_v2", "arima"). |
| `model_version` | VARCHAR(50) | NOT NULL | Model version. |
| `features_used` | JSONB | NULL | Features/parameters. E.g., `{"seasonal_factor": 1.02, "trend": "stable"}`. |
| `actual_amount` | NUMERIC(15,2) | NULL | Actual amount (populated after prediction_date). |
| `error` | NUMERIC(15,2) | NULL | Prediction error. `actual_amount - predicted_amount`. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Prediction creation timestamp. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE CASCADE
- FOREIGN KEY (`category_id`) REFERENCES `categories`(id) ON DELETE SET NULL

**Indexes**:
- INDEX (`financial_profile_id`, `prediction_date`)

**RLS Policy**: Standard profile isolation

**Business Rules**:
- Generated by scheduled job (weekly)
- After `prediction_date`: Job populates `actual_amount` from transactions → Calculates `error`
- Errors used for model evaluation (MAPE, RMSE)
- CI (Confidence Interval): Represents uncertainty
- `prediction_type` examples: 'expense', 'income', 'net_cash_flow', 'category_expense'

**Use Cases**:
- Dashboard predictions (next 3-6 months)
- Future liquidity problem alerts
- Assisted budgeting (forecast-based suggestions)
- Model evaluation and improvement

---

### Table: `ai_recommendations`

**Purpose**: AI optimization recommendations. USER-LEVEL with SCOPE pattern.

**Level**: USER-owned with SCOPE

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique recommendation identifier. |
| `user_id` | UUID | FK→users, NOT NULL | Recommendation owner. USER-LEVEL. |
| `scope_type` | scopetype | DEFAULT 'user' | Scope: 'user', 'profile', 'multi_profile'. |
| `scope_profile_ids` | UUID[] | NULL | Array of profile IDs. |
| `recommendation_type` | VARCHAR(100) | NOT NULL | Type ('unused_subscription', 'budget_optimization', 'savings_opportunity', etc.). |
| `title` | VARCHAR(255) | NOT NULL | Recommendation title. E.g., "Unused Netflix Subscription". |
| `description` | TEXT | NOT NULL | Detailed description with rationale. |
| `potential_savings` | NUMERIC(15,2) | NULL | Estimated savings €/month or €/year. |
| `priority` | INTEGER | DEFAULT 5 | Priority (1-10). High priority shown first. |
| `confidence_score` | NUMERIC(5,4) | NOT NULL | AI confidence (0-1). |
| `related_entity_type` | VARCHAR(50) | NULL | Related entity type ('transaction', 'budget', 'subscription'). |
| `related_entity_id` | UUID | NULL | Related entity ID. |
| `action_items` | JSONB | NULL | Suggested actions. E.g., `[{"action": "cancel_subscription", "params": {...}}]`. |
| `is_dismissed` | BOOLEAN | DEFAULT false | User dismissed recommendation. |
| `is_implemented` | BOOLEAN | DEFAULT false | User implemented recommendation. |
| `user_feedback` | TEXT | NULL | User feedback (useful/not useful). |
| `expires_at` | TIMESTAMPTZ | NULL | Recommendation expiration (optional). |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users`(id) ON DELETE CASCADE
- CHECK (`priority` BETWEEN 1 AND 10)

**Indexes**:
- INDEX (`user_id`)
- INDEX (`is_dismissed`, `is_implemented`)

**RLS Policy**: Standard user isolation

**Business Rules - Scope**:
- `scope_type='user'`: Cross-profile recommendation (e.g., "Duplicate subscriptions between Personal and Business")
- `scope_type='profile'`: Profile-specific recommendation
- `scope_type='multi_profile'`: Multi-profile recommendation

**Recommendation Types**:
- **unused_subscription**: Subscription not used (freq < 1/month)
- **duplicate_subscription**: Duplicate subscriptions cross-profile
- **budget_overrun**: Budget repeatedly exceeded
- **savings_opportunity**: Savings opportunity (switch provider, etc.)
- **cash_flow_warning**: Future liquidity alert
- **tax_optimization**: Tax optimization
- **investment_suggestion**: Investment suggestion for excess liquidity

**Business Rules**:
- Generated by scheduled job (weekly/monthly)
- `expires_at`: Auto-dismiss if no longer relevant
- `is_dismissed=true`: Hidden from UI, kept for analytics
- `is_implemented=true`: ROI tracking for recommendations

**Use Cases**:
- AI insights dashboard
- Proactive notifications
- Onboarding suggestions
- Financial health score

---

## 9. COMMUNICATION

### Table: `chat_conversations`

**Purpose**: AI Chat Assistant conversations.

**Level**: USER-owned

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique conversation identifier. |
| `user_id` | UUID | FK→users, NOT NULL | Conversation owner. |
| `financial_profile_id` | UUID | FK→profiles, NULL | Context profile (optional). |
| `title` | VARCHAR(255) | NULL | Conversation title (auto-generated or user-defined). |
| `summary` | TEXT | NULL | Conversation summary (AI-generated). |
| `is_archived` | BOOLEAN | DEFAULT false | Archived flag. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last message timestamp. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users`(id) ON DELETE CASCADE
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE SET NULL

**Indexes**:
- INDEX (`user_id`)
- INDEX (`updated_at`)

**Business Rules**:
- `title` auto-generated from first user message or explicitly set
- `summary` AI-generated periodically (every 10 messages)
- `is_archived=true`: Hidden from main list, searchable
- `financial_profile_id`: If set, chat contextualized to that profile

**Use Cases**:
- Chat with AI Assistant
- Natural language financial queries
- Report generation via chat
- Guided operation support

---

### Table: `chat_messages`

**Purpose**: Individual messages in chat conversations.

**Level**: Child of chat_conversations

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique message identifier. |
| `conversation_id` | UUID | FK→chat_conversations, NOT NULL | Parent conversation. |
| `role` | messagerole | NOT NULL | Role: 'user', 'assistant', 'system'. |
| `content` | TEXT | NOT NULL | Message content. |
| `tokens_used` | INTEGER | NULL | Tokens consumed (for billing/usage tracking). |
| `model_name` | VARCHAR(100) | NULL | LLM model used ("gpt-4", "claude-3-opus"). |
| `processing_time_ms` | INTEGER | NULL | Response generation latency (ms). |
| `metadata` | JSONB | NULL | Metadata. E.g., `{"function_calls": [...], "attachments": [...]}`. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Message timestamp. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations`(id) ON DELETE CASCADE

**Indexes**:
- INDEX (`conversation_id`, `created_at`)

**Roles**:
- **user**: User message
- **assistant**: AI response
- **system**: System message ("Conversation started", context injection)

**Business Rules**:
- Retention: Messages kept 90 days (configurable in user_preferences)
- Privacy: If conversation includes HS profile data, messages encrypted
- Context window: Last N messages passed to LLM (N=10 default)

**Use Cases**:
- Chat history
- LLM context
- Usage tracking
- Performance monitoring

---

### Table: `notifications`

**Purpose**: User notifications (push/email/in-app).

**Level**: USER-owned

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique notification identifier. |
| `user_id` | UUID | FK→users, NOT NULL | Notification recipient. |
| `financial_profile_id` | UUID | FK→profiles, NULL | Related profile (optional). |
| `notification_type` | notificationtype | NOT NULL | Type: budget_alert, goal_milestone, recurring_reminder, anomaly_detected, optimization_suggestion, security_alert, report_ready, general. |
| `title` | VARCHAR(255) | NOT NULL | Notification title. |
| `message` | TEXT | NOT NULL | Message body. |
| `status` | notificationstatus | DEFAULT 'unread' | Status: unread, read, archived, dismissed. |
| `priority` | INTEGER | DEFAULT 5 | Priority (1-10). High priority highlighted. |
| `action_url` | VARCHAR(500) | NULL | Deep link action (e.g., "/budgets/123"). |
| `related_entity_type` | VARCHAR(50) | NULL | Related entity type ('budget', 'transaction'). |
| `related_entity_id` | UUID | NULL | Related entity ID. |
| `sent_via_email` | BOOLEAN | DEFAULT false | Email delivery flag. |
| `sent_via_push` | BOOLEAN | DEFAULT false | Push notification delivery flag. |
| `expires_at` | TIMESTAMPTZ | NULL | Expiration (auto-archive after). |
| `read_at` | TIMESTAMPTZ | NULL | Read timestamp. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users`(id) ON DELETE CASCADE
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE SET NULL

**Indexes**:
- INDEX (`user_id`, `status`)

**Notification Types**:
- **budget_alert**: Budget exceeded/near threshold
- **goal_milestone**: Goal milestone reached
- **recurring_reminder**: Recurring transaction reminder
- **anomaly_detected**: Unusual spending detected
- **optimization_suggestion**: Optimization suggestion
- **security_alert**: Security alert (suspicious login, etc.)
- **report_ready**: Scheduled report ready
- **general**: Generic notification

**Business Rules**:
- Created by various triggers:
  - Budget exceeded → `budget_alert`
  - Goal milestone → `goal_milestone`
  - Recurring transaction due → `recurring_reminder`
  - ML anomaly detection → `anomaly_detected`
  - AI recommendation → `optimization_suggestion`
  - Suspicious login → `security_alert`
- Delivery channels respect `user_preferences`:
  - `notification_email=true` → Send email
  - `notification_push=true` → Push notification
  - `notification_in_app=true` → In-app badge
- `expires_at`: Time-sensitive notifications auto-archived after expiration
- `read_at` populated when user opens notification
- Retention: `archived` notifications older than 30 days deleted (cleanup job)

**Use Cases**:
- Budget/goal alerts
- Due date reminders
- Security alerts
- Proactive AI engagement

---

## 10. AUDIT & SECURITY

### Table: `audit_logs`

**Purpose**: Complete audit trail for compliance, security, and debugging. Immutable append-only log.

**Level**: USER/SYSTEM

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique log identifier. |
| `user_id` | UUID | FK→users, NULL | User performing action (NULL for system actions). |
| `financial_profile_id` | UUID | FK→profiles, NULL | Related profile (if applicable). |
| `event_type` | eventtype | NOT NULL | Event type: access, security, financial_op, ai_interaction, system, user_action, data_export. |
| `severity` | severitylevel | DEFAULT 'info' | Severity: info, warning, error, critical. |
| `action` | VARCHAR(100) | NOT NULL | Action performed ("login", "transaction_created", "budget_updated"). |
| `entity_type` | VARCHAR(50) | NULL | Modified entity type ('transaction', 'budget'). |
| `entity_id` | UUID | NULL | Modified entity ID. |
| `old_values` | JSONB | NULL | Previous values (for UPDATE). E.g., `{"amount": 100.00, "category_id": "..."}`. |
| `new_values` | JSONB | NULL | New values (for INSERT/UPDATE). |
| `ip_address` | VARCHAR(45) | NULL | Client IP (IPv4/IPv6). |
| `user_agent` | VARCHAR(500) | NULL | Browser/app User-Agent. |
| `device_info` | JSONB | NULL | Device info. E.g., `{"os": "iOS 17", "device": "iPhone 14", "app_version": "2.1.0"}`. |
| `geolocation` | VARCHAR(100) | NULL | Approximate geolocation ("Milan, IT"). |
| `session_id` | UUID | NULL | Session ID. For correlating events in same session. |
| `request_id` | UUID | NULL | Request ID (for distributed tracing). |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Event timestamp. **IMMUTABLE**. |

**Constraints**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users`(id) ON DELETE SET NULL
- FOREIGN KEY (`financial_profile_id`) REFERENCES `financial_profiles`(id) ON DELETE SET NULL

**Indexes**:
- INDEX (`created_at`)
- INDEX (`user_id`, `created_at`)
- INDEX (`financial_profile_id`, `created_at`)
- INDEX (`event_type`, `created_at`)

**Event Types**:
- **access**: Login, logout, section access
- **security**: Password change, 2FA, suspicious activity
- **financial_op**: Transaction/account/budget/goal create/update/delete
- **ai_interaction**: Chat queries, ML classifications, recommendations
- **system**: Scheduled jobs, background tasks
- **user_action**: Generic UI actions
- **data_export**: Data exports, report generation

**Severity Levels**:
- **info**: Normal operations (login, view transaction)
- **warning**: Suspicious operations (login from new IP, multiple failed login)
- **error**: Application errors (failed import, validation error)
- **critical**: Security incidents (unauthorized access attempt, data breach)

**Business Rules**:
- **APPEND-ONLY**: Logs never deleted or modified (compliance)
- Retention: 7 years (configurable for compliance)
- `old_values` and `new_values`: Only changed fields (diff)
- `ip_address` and `geolocation`: For fraud detection
- High-security profiles: Extra detailed audit (every access tracked)

**Use Cases**:
- Compliance (GDPR audit trail)
- Security monitoring (SIEM integration)
- Fraud detection
- User activity timeline
- Debugging
- Forensics (incident response)

---

## APPENDIX: Constraints Summary

### A. Foreign Key Cascade Rules

| Parent | Child | ON DELETE | Rationale |
|--------|-------|-----------|-----------|
| users | financial_profiles | CASCADE | User deletion → delete all profiles |
| users | categories | CASCADE | USER-LEVEL → delete with user |
| users | tags | CASCADE | USER-LEVEL → delete with user |
| users | budgets | CASCADE | USER-LEVEL → delete with user |
| users | financial_goals | CASCADE | USER-LEVEL → delete with user |
| users | ai_recommendations | CASCADE | USER-LEVEL → delete with user |
| financial_profiles | accounts | CASCADE | Profile deletion → delete accounts |
| financial_profiles | transactions | CASCADE | Profile deletion → delete transactions |
| financial_profiles | assets | CASCADE | Profile deletion → delete assets |
| accounts | transactions | CASCADE | Account deletion → delete transactions |
| accounts | import_jobs | CASCADE | Account deletion → delete import jobs |
| accounts | bank_conditions | CASCADE | Account deletion → delete bank conditions |
| categories | transactions | SET NULL | Category deletion → preserve transactions, null category |
| merchants | transactions | SET NULL | Merchant deletion → denormalized name preserved |
| recurring_transactions | recurring_transaction_occurrences | CASCADE | Template deletion → delete occurrences |
| budgets | budget_categories | CASCADE | Budget deletion → delete allocations |
| financial_goals | goal_contributions | CASCADE | Goal deletion → delete contributions |
| financial_goals | goal_milestones | CASCADE | Goal deletion → delete milestones |
| assets | asset_valuations | CASCADE | Asset deletion → delete valuation history |

### B. Unique Constraints Summary

| Table | Constraint | Columns | Purpose |
|-------|------------|---------|---------|
| users | uq_users_email | email | One account per email |
| user_preferences | uq_user_preferences_user | user_id | 1:1 with user |
| financial_profiles | uq_financial_profiles_user_name | user_id, name | Profile name unique per user |
| categories | uq_categories_user_name | user_id, name | Category name unique per user |
| tags | uq_tags_user_name | user_id, name | Tag name unique per user |
| accounts | uq_accounts_profile_name | financial_profile_id, name | Account name unique per profile |
| merchants | uq_merchants_canonical_name | canonical_name | Global merchant uniqueness |
| exchange_rates | uq_exchange_rates_currencies_date | base_currency, target_currency, rate_date | One rate per pair per day |
| budget_categories | uq_budget_categories_budget_category | budget_id, category_id | One category per budget |

### C. Check Constraints

```sql
-- Amounts
ALTER TABLE transactions ADD CONSTRAINT chk_transactions_amount_clear 
CHECK (amount_clear != 0);

-- Percentages
ALTER TABLE budgets ADD CONSTRAINT chk_budgets_alert_threshold 
CHECK (alert_threshold_percent BETWEEN 0 AND 100);

-- Confidence scores
ALTER TABLE predictions ADD CONSTRAINT chk_predictions_confidence 
CHECK (confidence_level BETWEEN 0 AND 1);

-- Dates
ALTER TABLE financial_goals ADD CONSTRAINT chk_goals_dates 
CHECK (target_date >= start_date);

ALTER TABLE budgets ADD CONSTRAINT chk_budgets_dates 
CHECK (end_date IS NULL OR end_date >= start_date);

-- Ranges
ALTER TABLE assets ADD CONSTRAINT chk_assets_value_range 
CHECK (current_value_min IS NULL OR current_value_max IS NULL 
    OR current_value_min <= current_value_max);

-- Colors (HEX format)
ALTER TABLE categories ADD CONSTRAINT chk_categories_color 
CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');

-- Email format
ALTER TABLE users ADD CONSTRAINT chk_users_email 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Priorities
ALTER TABLE financial_goals ADD CONSTRAINT chk_goals_priority 
CHECK (priority BETWEEN 1 AND 10);

ALTER TABLE ai_recommendations ADD CONSTRAINT chk_recommendations_priority 
CHECK (priority BETWEEN 1 AND 10);
```

---

## APPENDIX: ENUM Definitions

All ENUM types with complete value lists:

```sql
-- User & Profile
CREATE TYPE profiletype AS ENUM ('personal', 'family', 'business');
CREATE TYPE securitylevel AS ENUM ('standard', 'high_security');
CREATE TYPE scopetype AS ENUM ('user', 'profile', 'multi_profile');

-- Accounts
CREATE TYPE accounttype AS ENUM (
    'checking', 'savings', 'credit_card', 'investment', 
    'cash', 'loan', 'mortgage', 'other'
);

-- Transactions
CREATE TYPE transactiontype AS ENUM (
    'bank_transfer', 'withdrawal', 'payment', 'purchase', 
    'internal_transfer', 'income', 'salary', 'invoice', 
    'asset_purchase', 'asset_sale', 'dividend', 'interest',
    'loan_payment', 'refund', 'fee', 'tax', 'other'
);

CREATE TYPE transactionsource AS ENUM (
    'manual', 'import_csv', 'import_ocr', 'import_api', 
    'recurring', 'bank_sync'
);

-- Assets
CREATE TYPE assettype AS ENUM (
    'real_estate', 'vehicle', 'precious_metal', 'stock', 'bond',
    'fund', 'etf', 'crypto', 'artwork', 'jewelry', 'watch', 'other'
);

CREATE TYPE valuationmethod AS ENUM (
    'market_quote', 'range', 'comparative', 'manual', 'appraisal'
);

-- Recurring Transactions
CREATE TYPE amountmodel AS ENUM (
    'fixed', 'variable_within_range', 'progressive', 'seasonal', 'formula'
);

CREATE TYPE frequency AS ENUM (
    'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 
    'semiannually', 'yearly', 'custom'
);

CREATE TYPE occurrencestatus AS ENUM (
    'pending', 'executed', 'skipped', 'overridden', 'failed'
);

-- Budgets & Goals
CREATE TYPE periodtype AS ENUM (
    'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
);

CREATE TYPE goaltype AS ENUM (
    'house', 'car', 'vacation', 'retirement', 'emergency_fund', 
    'education', 'investment', 'debt_payoff', 'custom'
);

CREATE TYPE goalstatus AS ENUM (
    'active', 'completed', 'paused', 'cancelled', 'failed'
);

-- Import & Documents
CREATE TYPE importtype AS ENUM (
    'csv', 'excel', 'ofx', 'qif', 'pdf', 'ocr_receipt', 
    'ocr_invoice', 'ocr_contract', 'bank_api'
);

CREATE TYPE importstatus AS ENUM (
    'pending', 'processing', 'completed', 'failed', 'partial'
);

CREATE TYPE documenttype AS ENUM (
    'receipt', 'invoice', 'contract', 'bank_statement', 
    'tax_document', 'insurance', 'other'
);

-- Audit & Security
CREATE TYPE eventtype AS ENUM (
    'access', 'security', 'financial_op', 'ai_interaction', 
    'system', 'user_action', 'data_export'
);

CREATE TYPE severitylevel AS ENUM (
    'info', 'warning', 'error', 'critical'
);

-- Communication
CREATE TYPE messagerole AS ENUM (
    'user', 'assistant', 'system'
);

CREATE TYPE tagtype AS ENUM (
    'contextual', 'functional', 'temporal', 'emotional', 'custom'
);

CREATE TYPE notificationtype AS ENUM (
    'budget_alert', 'goal_milestone', 'recurring_reminder', 
    'anomaly_detected', 'optimization_suggestion', 'security_alert',
    'report_ready', 'general'
);

CREATE TYPE notificationstatus AS ENUM (
    'unread', 'read', 'archived', 'dismissed'
);
```

---

## Document End

**Version**: 2.1.1
**Last Updated**: 2025-11-24
**Total Tables**: 35
**Total ENUMs**: 17
**Authors**: FinancePro Architecture Team
**Status**: ✅ PRODUCTION-READY COMPLETE SPECIFICATION

### Changelog v2.1.1 (2025-11-24)
- Added `goal_milestones` table
- Added `financial_goals.notes` column
- Changed `ml_classification_logs.transaction_id` to NOT NULL
- Changed `audit_logs.session_id` and `request_id` to UUID type
- Changed `audit_logs.user_agent` to TEXT type
- Changed `import_jobs` and `bank_conditions` account FK to CASCADE DELETE
- Fixed all DateTime columns to use timezone-aware timestamps
