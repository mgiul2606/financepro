# Model Relationships & Architecture Diagram

## Complete Data Model Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                           USER                                   │
│  (id, email, hashed_password, full_name, is_active, is_verified) │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ 1:Many (back_populates="user")
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FINANCIAL PROFILE                             │
│  (id, user_id, name, profile_type, default_currency, is_active)  │
│  Types: PERSONAL, FAMILY, BUSINESS                               │
└────────┬──────────────┬──────────┬──────────┬──────────┬─────────┘
         │              │          │          │          │
         │              │          │          │          │
    ┌────▼───┐    ┌─────▼────┐ ┌──▼─────┐ ┌─▼──────┐ ┌─▼─────┐
    │ACCOUNT │    │CATEGORY  │ │  TAG   │ │BUDGET  │ │ GOAL  │
    │1:Many  │    │1:Many    │ │1:Many  │ │1:Many  │ │1:Many │
    └────┬───┘    └─────┬────┘ └──┬─────┘ └─┬──────┘ └─┬─────┘
         │              │          │         │         │
         │              │          │         │         │
    ┌────▼─────────┐    │    ┌─────▼──────┐ │    ┌─────▼──────┐
    │TRANSACTION   │    │    │  BUDGET    │ │    │MILESTONE   │
    │(via Account) │    │    │  CATEGORY  │ │    │ (via Goal) │
    └──────────────┘    │    └────────────┘ │    └────────────┘
                        │                    │
    ┌───────────────────▼────┐   ┌──────────▼─────────┐
    │ RECURRING TRANSACTION  │   │  ASSET             │
    │ (via Account)          │   │  1:Many            │
    └────────────────────────┘   └──────┬─────────────┘
                                        │
                                   ┌────▼──────────┐
                                   │ASSET VALUATION│
                                   │(via Asset)     │
                                   └────────────────┘

┌──────────────────────────────────────────────────────┐
│ Additional Profile-Linked Resources                  │
├──────────────────────────────────────────────────────┤
│ IMPORT JOB         (1:Many) - Data import tracking  │
│ AUDIT LOG          (1:Many) - Activity logging      │
│ CHAT CONVERSATION  (1:Many) - AI chat context       │
│ CHAT MESSAGE       (1:Many via Conversation)        │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Global Resources (Not Profile-Specific)             │
├──────────────────────────────────────────────────────┤
│ EXCHANGE RATE      - Shared currency conversion    │
│ ML CLASSIFICATION LOG - Transaction categorization  │
└──────────────────────────────────────────────────────┘
```

---

## Detailed Relationship Mapping

### Level 1: Profile Ownership
```
USER (1) ──────────────────────── (Many) FINANCIAL_PROFILE
         back_populates="user"
```

### Level 2: Core Financial Entities
```
FINANCIAL_PROFILE (1) ──────────────────────── (Many) ACCOUNT
                     back_populates="financial_profile"

FINANCIAL_PROFILE (1) ──────────────────────── (Many) CATEGORY
                     back_populates="financial_profile"

FINANCIAL_PROFILE (1) ──────────────────────── (Many) TAG
                     back_populates="financial_profile"

FINANCIAL_PROFILE (1) ──────────────────────── (Many) BUDGET
                     back_populates="financial_profile"

FINANCIAL_PROFILE (1) ──────────────────────── (Many) FINANCIAL_GOAL
                     back_populates="financial_profile"

FINANCIAL_PROFILE (1) ──────────────────────── (Many) ASSET
                     back_populates="financial_profile"
```

### Level 3: Transactional Data
```
ACCOUNT (1) ─────────────────────────────────── (Many) TRANSACTION
           back_populates="account"

ACCOUNT (1) ─────────────────────────────────── (Many) RECURRING_TRANSACTION
           back_populates="account"

CATEGORY (1) ────────────────────────────────── (Many) TRANSACTION
            back_populates="category"

CATEGORY (1) ────────────────────────────────── (Many) RECURRING_TRANSACTION
            back_populates="category"

TRANSACTION (Many) ───────────────────────────── (Many) TAG
           via transaction_tags association table
```

### Level 4: Supporting Data
```
BUDGET (1) ─────────────────────────────────── (Many) BUDGET_CATEGORY
          back_populates="budget"

BUDGET_CATEGORY (Many) ────────────────────── (1) CATEGORY
                back_populates="budget_categories"

FINANCIAL_GOAL (1) ────────────────────────── (Many) GOAL_MILESTONE
                back_populates="goal"

ASSET (1) ──────────────────────────────────── (Many) ASSET_VALUATION
        back_populates="asset"
```

### Level 5: Metadata & Auditing
```
FINANCIAL_PROFILE (1) ─────────────────────── (Many) IMPORT_JOB
                    back_populates="financial_profile"

FINANCIAL_PROFILE (1) ─────────────────────── (Many) AUDIT_LOG
                    back_populates="financial_profile"

FINANCIAL_PROFILE (1) ─────────────────────── (Many) CHAT_CONVERSATION
                    back_populates="financial_profile"

CHAT_CONVERSATION (1) ────────────────────── (Many) CHAT_MESSAGE
                     back_populates="conversation"
```

### Global Resources (Cross-Profile)
```
TRANSACTION ────────────────────────────────── EXCHANGE_RATE
           (Many-to-One, for currency conversion)

TRANSACTION (1) ────────────────────────────── (Many) ML_CLASSIFICATION_LOG
            back_populates="transaction"
```

---

## Profile Data Isolation Layers

### Layer 1: Direct Profile Reference (13 models)
These models have `financial_profile_id` foreign key:
- Account
- Category
- Tag
- Budget
- BudgetCategory (via Budget)
- FinancialGoal
- GoalMilestone (via Goal)
- Asset
- AssetValuation (via Asset)
- ImportJob
- AuditLog
- ChatConversation
- ChatMessage (via ChatConversation)

**Isolation**: Query filtering by `financial_profile_id`

### Layer 2: Indirect Profile Reference (3 models)
These models reference profile through parent:
- Transaction (via Account.financial_profile_id)
- RecurringTransaction (via Account.financial_profile_id)
- MLClassificationLog (via Transaction.account.financial_profile_id)

**Isolation**: Join queries through parent

### Layer 3: Global Resources (1 model)
- ExchangeRate

**Isolation**: None (shared across all profiles)

---

## Data Flow Diagram

### Creating a Transaction
```
1. User selects Profile
         ↓
2. User selects Account from Profile.accounts
         ↓
3. User creates Transaction in Account
         ↓
4. Transaction.account_id → Account.financial_profile_id
         ↓
5. Transaction implicitly belongs to Profile
         ↓
6. Query: Profile → Account → Transaction
```

### Creating a Budget
```
1. User selects Profile
         ↓
2. User creates Budget with profile_id
         ↓
3. Budget.financial_profile_id is set
         ↓
4. User adds categories to budget (BudgetCategory)
         ↓
5. Categories must belong to same Profile
         ↓
6. Query: Profile → Budget → Categories
```

### Querying User's Data
```
GET /api/v1/profiles (List all profiles for user)
    ↓
User selects profile_id
    ↓
GET /api/v1/accounts?profile_id=X (Get accounts in profile)
GET /api/v1/transactions?profile_id=X (Get transactions in profile)
GET /api/v1/budgets?profile_id=X (Get budgets in profile)
GET /api/v1/goals?profile_id=X (Get goals in profile)
    ↓
All queries filtered by:
  - Profile ownership (Profile.user_id == current_user.id)
  - Resource profile (Resource.financial_profile_id == profile_id)
```

---

## Cascade Delete Behavior

When a profile is deleted (soft delete via is_active=False):
```
Profile (soft delete: is_active = False)
    ↓
All child resources remain but are orphaned
(Hard delete would cascade to ALL children)

Cascade relationships defined:
- cascade="all, delete-orphan" on all 1:Many relationships
- Deleting profile would delete: Accounts, Categories, Tags, Budgets,
  Goals, Assets, ImportJobs, AuditLogs, ChatConversations
```

---

## Multi-Currency Support

Each Profile can have different default currency:
```
Profile 1 (EUR)
  ├─ Account 1 (EUR) → Transactions (EUR)
  ├─ Account 2 (USD) → Transactions (USD)
  │                → ExchangeRate (EUR↔USD lookup)
  └─ Budget (EUR)

Profile 2 (USD)
  ├─ Account 1 (USD) → Transactions (USD)
  ├─ Account 2 (GBP) → Transactions (GBP)
  │                → ExchangeRate (USD↔GBP lookup)
  └─ Budget (USD)

ExchangeRate (Global - shared)
  ├─ EUR→USD
  ├─ USD→GBP
  ├─ EUR→GBP
  └─ ... (any pair)
```

---

## Profile Types & Their Purpose

```
PERSONAL
├─ Individual financial tracking
├─ Personal accounts & goals
├─ Own categories & budgets
└─ Privacy: Only accessible by owner

FAMILY
├─ Shared family finances
├─ Joint accounts
├─ Shared budgets & goals
└─ Future: Could support shared access

BUSINESS
├─ Business finances separate from personal
├─ Business accounts
├─ Business expenses & budgets
├─ Cost centers & profit centers
└─ Future: Could support team access
```

---

## Query Complexity by Operation

### Simple Operations (Direct Access)
```
List all profiles for user:
SELECT * FROM financial_profiles 
WHERE user_id = ?

Get specific profile:
SELECT * FROM financial_profiles 
WHERE id = ? AND user_id = ?

List budgets in profile:
SELECT * FROM budgets 
WHERE financial_profile_id = ?
```

### Complex Operations (Multiple Joins)
```
Get all transactions in profile:
SELECT t.* FROM transactions t
JOIN accounts a ON t.account_id = a.id
JOIN financial_profiles fp ON a.financial_profile_id = fp.id
WHERE fp.id = ? AND fp.user_id = ?

Get transaction summary by category:
SELECT c.name, SUM(t.amount) FROM transactions t
JOIN accounts a ON t.account_id = a.id
JOIN categories c ON t.category_id = c.id
WHERE a.financial_profile_id = ?
GROUP BY c.id

Get budget vs actual spending:
SELECT b.name, b.amount, SUM(t.amount) FROM budgets b
JOIN budget_categories bc ON b.id = bc.budget_id
JOIN categories c ON bc.category_id = c.id
LEFT JOIN transactions t ON t.category_id = c.id
  AND t.transaction_date BETWEEN b.start_date AND b.end_date
WHERE b.financial_profile_id = ?
GROUP BY b.id
```

---

## Indexes for Performance

```
financial_profiles
  - PRIMARY: id
  - INDEX: user_id (for listing user's profiles)

accounts, categories, tags, budgets, goals, assets, import_jobs, audit_logs
  - PRIMARY: id
  - INDEX: financial_profile_id (for filtering by profile)
  - Additional indexes on frequently queried fields

transactions
  - PRIMARY: id
  - INDEX: account_id
  - INDEX: category_id
  - INDEX: transaction_date (for date range queries)
  - INDEX: (account_id, transaction_date) (composite for common queries)

exchange_rates
  - PRIMARY: id
  - INDEX: (from_currency, to_currency, date)
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Models | 16 |
| Models with direct profile_id | 13 |
| Models with indirect profile_id | 3 |
| Global resources | 1 |
| One-to-many relationships | 15+ |
| Many-to-many relationships | 2 (Transaction-Tag, Budget-Category) |
| Enum types | 12+ |
| Cascade delete relationships | 15+ |

