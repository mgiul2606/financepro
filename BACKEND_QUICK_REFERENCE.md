# Quick Reference: Profile Implementation Details

## File Locations Quick Map

### Core Profile Model
```
/backend/app/models/financial_profile.py
  - FinancialProfile class (ORM model)
  - ProfileType enum (PERSONAL, FAMILY, BUSINESS)
  - DatabaseType enum (POSTGRESQL, MSSQL)
```

### Profile API Endpoints
```
/backend/app/api/financial_profiles.py
  - GET    /api/v1/profiles              (list)
  - POST   /api/v1/profiles              (create)
  - GET    /api/v1/profiles/{profile_id} (retrieve)
  - PATCH  /api/v1/profiles/{profile_id} (update)
  - DELETE /api/v1/profiles/{profile_id} (soft delete)
```

### Profile Schemas (Request/Response)
```
/backend/app/schemas/financial_profile.py
  - FinancialProfileBase
  - FinancialProfileCreate
  - FinancialProfileUpdate
  - FinancialProfileResponse
  - FinancialProfileListResponse
```

### Database Migrations
```
/backend/alembic/versions/
  - d8f2a1c9e3b4_add_financial_profiles_and_all_missing_tables.py
```

---

## Model Structure Examples

### FinancialProfile Model (Simplified)
```python
class FinancialProfile(Base):
    __tablename__ = "financial_profiles"
    
    id: UUID (primary key)
    user_id: UUID (foreign key → users.id)
    name: str (max 100)
    description: str (optional)
    profile_type: ProfileType (PERSONAL|FAMILY|BUSINESS)
    default_currency: str (ISO 4217, e.g., "EUR")
    database_connection_string: str (optional, for distributed DB)
    database_type: DatabaseType (POSTGRESQL|MSSQL, optional)
    is_active: bool (default: True)
    created_at: datetime
    updated_at: datetime
    
    # Relationships (all with cascade delete-orphan)
    user: User
    accounts: List[Account]
    categories: List[Category]
    tags: List[Tag]
    budgets: List[Budget]
    goals: List[FinancialGoal]
    assets: List[Asset]
    import_jobs: List[ImportJob]
    audit_logs: List[AuditLog]
    chat_conversations: List[ChatConversation]
```

### Account Model (Profile Integration)
```python
class Account(Base):
    __tablename__ = "accounts"
    
    id: UUID (primary key)
    financial_profile_id: UUID (foreign key → financial_profiles.id)
    name: str
    account_type: AccountType
    currency: str
    initial_balance: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Relationship
    financial_profile: FinancialProfile
```

### Budget Model (Profile Integration)
```python
class Budget(Base):
    __tablename__ = "budgets"
    
    id: UUID (primary key)
    financial_profile_id: UUID (foreign key → financial_profiles.id)
    name: str
    period_type: PeriodType (MONTHLY|QUARTERLY|YEARLY|CUSTOM)
    start_date: date
    end_date: date
    amount: Decimal
    currency: str
    is_active: bool
    alert_threshold_percentage: Decimal
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    financial_profile: FinancialProfile
    budget_categories: List[BudgetCategory]
```

### FinancialGoal Model (Profile Integration)
```python
class FinancialGoal(Base):
    __tablename__ = "financial_goals"
    
    id: UUID (primary key)
    financial_profile_id: UUID (foreign key → financial_profiles.id)
    name: str
    description: str (optional)
    goal_type: GoalType (HOUSE|CAR|VACATION|RETIREMENT|...)
    target_amount: Decimal
    current_amount: Decimal
    target_date: date
    priority: int (1-10)
    status: GoalStatus (ACTIVE|PAUSED|COMPLETED|CANCELLED)
    achievement_probability: Decimal (0-100%)
    gamification_points: int
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    financial_profile: FinancialProfile
    milestones: List[GoalMilestone]
    
    # Computed property
    progress_percentage: Decimal (calculated from current/target)
```

---

## API Endpoint Examples

### List Profiles
```
GET /api/v1/profiles
Authorization: Bearer <token>

Response (200 OK):
{
  "profiles": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Personal Finance",
      "description": "My personal financial tracking",
      "profile_type": "personal",
      "default_currency": "EUR",
      "database_connection_string": null,
      "database_type": null,
      "is_active": true,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-20T14:22:00Z",
      "is_available": true
    }
  ],
  "total": 1
}
```

### Create Profile
```
POST /api/v1/profiles
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "name": "Family Budget",
  "description": "Shared family expenses",
  "profile_type": "family",
  "default_currency": "EUR"
}

Response (201 Created):
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Family Budget",
  "description": "Shared family expenses",
  "profile_type": "family",
  "default_currency": "EUR",
  "database_connection_string": null,
  "database_type": null,
  "is_active": true,
  "created_at": "2025-11-17T15:30:00Z",
  "updated_at": "2025-11-17T15:30:00Z",
  "is_available": true
}
```

### Get Profile Details
```
GET /api/v1/profiles/550e8400-e29b-41d4-a716-446655440002
Authorization: Bearer <token>

Response (200 OK):
[Same as above single profile object]

Response (403 Forbidden):
{
  "detail": "Not authorized to access this financial profile"
}
```

### Update Profile
```
PATCH /api/v1/profiles/550e8400-e29b-41d4-a716-446655440002
Authorization: Bearer <token>
Content-Type: application/json

Request (partial update):
{
  "name": "Updated Family Budget",
  "default_currency": "USD"
}

Response (200 OK):
[Updated profile object]
```

### Delete Profile (Soft Delete)
```
DELETE /api/v1/profiles/550e8400-e29b-41d4-a716-446655440002
Authorization: Bearer <token>

Response (204 No Content):
[Empty body - sets is_active=False]
```

---

## Authorization Patterns

### Profile Ownership Check (Current Pattern)
```python
# In endpoint
profile = db.query(FinancialProfile).filter(
    FinancialProfile.id == profile_id
).first()

if not profile:
    raise HTTPException(404, "Financial profile not found")

if profile.user_id != current_user.id:
    raise HTTPException(403, "Not authorized to access this profile")
```

### Resource Access Through Profile (Current Pattern)
```python
# For accounts, transactions, budgets, etc.
# Get the profile that owns the resource
profile = db.query(FinancialProfile).filter(
    FinancialProfile.id == resource.financial_profile_id
).first()

# Verify user owns the profile
if not profile or profile.user_id != current_user.id:
    raise HTTPException(403, "Not authorized")
```

---

## Query Patterns

### List All Profiles for User
```python
profiles = db.query(FinancialProfile).filter(
    FinancialProfile.user_id == current_user.id
).all()
```

### List Accounts Across All User Profiles
```python
# Get profile IDs
profile_ids = [p.id for p in current_user.financial_profiles]

# Get accounts from those profiles
accounts = db.query(Account).filter(
    Account.financial_profile_id.in_(profile_ids)
).all()
```

### List Budgets for Specific Profile
```python
budgets = db.query(Budget).filter(
    Budget.financial_profile_id == profile_id
).all()
```

### List Transactions for Specific Profile
```python
transactions = db.query(Transaction).join(
    Account,
    Transaction.account_id == Account.id
).join(
    FinancialProfile,
    Account.financial_profile_id == FinancialProfile.id
).filter(
    FinancialProfile.id == profile_id
).all()
```

### List Goals for Specific Profile
```python
goals = db.query(FinancialGoal).filter(
    FinancialGoal.financial_profile_id == profile_id
).all()
```

---

## Dependency Injection (Current)

### Get Current User
```python
from app.api.dependencies import get_current_user

@router.get("/example")
async def example_endpoint(
    current_user: Annotated[User, Depends(get_current_user)]
):
    # current_user is the authenticated user
    return {"user_id": current_user.id}
```

### What's Missing: Get Current Profile
```python
# This dependency doesn't exist yet, but should be like:

async def get_current_profile(
    profile_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FinancialProfile:
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == profile_id
    ).first()
    
    if not profile:
        raise HTTPException(404, "Profile not found")
    
    if profile.user_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    
    return profile

# Then use in endpoints:
@router.get("/profile-specific")
async def profile_endpoint(
    profile: Annotated[FinancialProfile, Depends(get_current_profile)]
):
    # profile is the authenticated profile
    return {"profile_id": profile.id}
```

---

## Data Isolation Examples

### Creating Account in Specific Profile
```python
# CORRECT: Account linked to profile
account = Account(
    financial_profile_id=profile_id,  # Required
    name="My Checking",
    account_type=AccountType.CHECKING,
    currency="EUR"
)
db.add(account)
db.commit()

# WRONG: Account without profile (will fail FK constraint)
account = Account(
    name="My Checking",
    account_type=AccountType.CHECKING,
    currency="EUR"
)  # Missing financial_profile_id
```

### Creating Budget in Specific Profile
```python
# CORRECT: Budget linked to profile
budget = Budget(
    financial_profile_id=profile_id,  # Required
    name="Monthly Expenses",
    period_type=PeriodType.MONTHLY,
    start_date=date.today(),
    end_date=date.today() + timedelta(days=30),
    amount=2000.00,
    currency="EUR"
)
db.add(budget)
db.commit()
```

### Creating Goal in Specific Profile
```python
# CORRECT: Goal linked to profile
goal = FinancialGoal(
    financial_profile_id=profile_id,  # Required
    name="Emergency Fund",
    goal_type=GoalType.EMERGENCY_FUND,
    target_amount=10000.00,
    target_date=date(2026, 12, 31),
    priority=10
)
db.add(goal)
db.commit()
```

---

## What's Unique About This Implementation

1. **Distributed Database Support**: Profiles can have their own DB connection
   ```python
   profile.database_connection_string  # Could connect to different DB
   profile.database_type              # PostgreSQL or MSSQL
   ```

2. **Soft Delete**: Data preserved for audit/recovery
   ```python
   profile.is_active = False  # Instead of DELETE
   ```

3. **Cascade Behavior**: Delete profile → delete all child resources
   - All relationships use `cascade="all, delete-orphan"`

4. **Multi-Currency**: Each profile has default currency
   ```python
   profile.default_currency  # e.g., "EUR", "USD"
   ```

5. **Data Isolation**: Complete separation at model level
   - Child models can't be created without profile_id
   - Queries always filter by profile ownership

---

## Integration Points for Frontend

1. **Profile Selection**: Frontend needs to track active profile
2. **Profile Parameter**: API calls need profile_id in path/query
3. **Authorization Header**: JWT token from login
4. **Profile Switching**: Endpoint to set active profile context
5. **Multi-Profile UI**: Display profile selector/switcher

---

## Common Query Operations

### Get User's Profiles with Stats
```python
profiles = db.query(FinancialProfile).filter(
    FinancialProfile.user_id == user_id
).all()

for profile in profiles:
    account_count = len(profile.accounts)
    budget_count = len(profile.budgets)
    goal_count = len(profile.goals)
    total_balance = sum(a.current_balance for a in profile.accounts)
```

### Get Profile Summary
```python
profile = db.query(FinancialProfile).filter(
    FinancialProfile.id == profile_id
).first()

summary = {
    "id": profile.id,
    "name": profile.name,
    "type": profile.profile_type,
    "accounts_count": len(profile.accounts),
    "budgets_count": len(profile.budgets),
    "goals_count": len(profile.goals),
    "is_active": profile.is_active,
    "created_at": profile.created_at
}
```

---

## Status Codes Reference

| Code | Scenario |
|------|----------|
| 200 | Successful GET, PATCH |
| 201 | Successful POST (create) |
| 204 | Successful DELETE |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (user doesn't own profile) |
| 404 | Not found (profile doesn't exist) |
| 409 | Conflict (duplicate/constraint error) |
| 500 | Server error |

