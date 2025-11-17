# Multi-Profile Implementation Documentation

## 📋 Overview

This document describes the implementation of the multi-profile functionality in FinancePro, allowing users to manage multiple financial profiles with a main profile for default operations and active profile selection for multi-profile analysis.

## ✅ Implemented Features

### Backend

#### 1. Database Models and Schema

**New Models:**
- `UserProfileSelection` (`backend/app/models/user_profile_selection.py`)
  - Stores active profile selections for each user
  - Uses PostgreSQL ARRAY type for profile IDs
  - One-to-one relationship with User

**Updated Models:**
- `User` (`backend/app/models/user.py`)
  - Added `main_profile_id` field (UUID, nullable)
  - Added `profile_selection` relationship

**Migration:**
- `e9a3c5f7b2d1_add_user_profile_selection_and_main_profile.py`
  - Adds `main_profile_id` column to `users` table
  - Creates `user_profile_selections` table
  - Includes proper indexes for performance

#### 2. API Schemas

**New Schemas** (`backend/app/schemas/financial_profile.py`):
- `ProfileSelectionUpdate` - Update active profiles
- `ProfileSelectionResponse` - Profile selection response
- `MainProfileUpdate` - Set main profile
- `MainProfileResponse` - Main profile response

#### 3. API Endpoints

**New Endpoints** (`backend/app/api/financial_profiles.py`):

```
PATCH /api/v1/profiles/main
```
- Set the main financial profile
- Validates profile ownership

```
GET /api/v1/profiles/main
```
- Get the user's main profile

```
POST /api/v1/profiles/selection
```
- Update active profile selection
- Supports multiple profile selection
- Validates all profiles belong to user

```
GET /api/v1/profiles/selection
```
- Get current active profile selection
- Auto-creates empty selection if none exists

**Existing Endpoints:**
- GET `/api/v1/profiles/` - List all user profiles
- POST `/api/v1/profiles/` - Create new profile
- GET `/api/v1/profiles/{id}` - Get profile by ID
- PATCH `/api/v1/profiles/{id}` - Update profile
- DELETE `/api/v1/profiles/{id}` - Soft delete profile

### Frontend

#### 1. Type Definitions

**File:** `frontend/src/features/profiles/types/index.ts`
- `FinancialProfile` - Complete profile type
- `ProfileType` enum - personal, family, business
- `DatabaseType` enum - postgresql, mssql
- `ProfileSelection` - Active profiles selection
- `MainProfile` - Main profile data

#### 2. API Layer

**File:** `frontend/src/features/profiles/api/profilesApi.ts`
- Axios-based API client with authentication
- All CRUD operations for profiles
- Main profile management
- Profile selection management

#### 3. React Query Hooks

**File:** `frontend/src/features/profiles/hooks/useProfiles.ts`
- `useProfiles()` - List all profiles
- `useProfile(id)` - Get single profile
- `useCreateProfile()` - Create new profile
- `useUpdateProfile()` - Update profile
- `useDeleteProfile()` - Delete profile
- `useMainProfile()` - Get main profile
- `useSetMainProfile()` - Set main profile
- `useProfileSelection()` - Get active profiles
- `useUpdateProfileSelection()` - Update selection

#### 4. Profile Context

**File:** `frontend/src/contexts/ProfileContext.tsx`
- Centralized profile state management
- Provides:
  - `profiles` - All user profiles
  - `activeProfiles` - Currently selected profiles
  - `mainProfile` - Main profile object
  - `activeProfileIds` - Selected profile IDs
  - `mainProfileId` - Main profile ID
  - `setMainProfile(id)` - Set main profile
  - `setActiveProfiles(ids)` - Set active profiles
  - `toggleProfileSelection(id)` - Toggle profile selection
  - `refreshProfiles()` - Refresh data

#### 5. UI Components

**ProfileSelector** (`frontend/src/features/profiles/components/ProfileSelector.tsx`):
- Dropdown with multi-select checkboxes
- Shows main profile with star icon
- Quick access to set main profile
- Link to full profile management page
- Integrated in Sidebar

**ProfileCard** (`frontend/src/features/profiles/components/ProfileCard.tsx`):
- Displays profile information
- Shows profile type icon (Personal/Family/Business)
- Main profile indicator
- Edit and delete actions
- Set as main button

**CreateProfileModal** (`frontend/src/features/profiles/components/CreateProfileModal.tsx`):
- Create/edit profile form
- Form validation with react-hook-form
- Profile type selection
- Currency selection
- Responsive modal design

**ProfilesPage** (`frontend/src/features/profiles/pages/ProfilesPage.tsx`):
- Full profile management interface
- Grid layout of profile cards
- Create, edit, delete operations
- Set main profile
- Info section about profiles

#### 6. Integration

**App.tsx:**
- ProfileProvider wraps authenticated routes
- Provides profile context to entire app

**Sidebar.tsx:**
- ProfileSelector integrated below logo
- Visible when sidebar is expanded

**Routing:**
- `/settings/profiles` - Profile management page

**Translations:**
- English translations in `frontend/src/i18n/locales/en.json`
- Italian translations in `frontend/src/i18n/locales/it.json`

## 🔄 How It Works

### 1. Profile Selection Flow

```
User logs in
  ↓
ProfileProvider loads:
  - All user profiles
  - Main profile ID
  - Active profile selection
  ↓
If no profiles selected:
  - Auto-select first profile
  ↓
If no main profile:
  - Auto-set first profile as main
  ↓
User interacts with ProfileSelector:
  - Toggle profile selection (multi-select)
  - Set main profile (for default operations)
  ↓
Selection saved to backend
  ↓
All app features can access:
  - useProfileContext() hook
  - Get active profiles for filtering
  - Get main profile for creating data
```

### 2. Data Ownership

- **Main Profile**: Used when creating new:
  - Transactions
  - Budgets
  - Goals
  - Accounts (if profile-scoped)

- **Active Profiles**: Used for viewing/analyzing:
  - Multi-profile analytics
  - Combined statistics
  - Aggregated reports

## 📝 Next Steps: Feature Integration

The core multi-profile system is implemented, but the following features need to be updated to use profile filtering:

### 1. Transactions Feature

**Files to modify:**
- `frontend/src/features/transactions/hooks/useTransactions.ts`
- `frontend/src/features/transactions/pages/TransactionsPage.tsx`

**Changes needed:**
```typescript
// Add to useTransactions hook
const { activeProfileIds, mainProfileId } = useProfileContext();

// Update API calls to include profile filtering
const transactions = useQuery({
  queryKey: ['transactions', activeProfileIds],
  queryFn: () => fetchTransactions({ profileIds: activeProfileIds })
});

// When creating transaction, use mainProfileId
const createTransaction = useMutation({
  mutationFn: (data) => createTransaction({
    ...data,
    profile_id: mainProfileId
  })
});
```

### 2. Budgets Feature

**Files to modify:**
- `frontend/src/features/budgets/hooks/useBudgets.ts`
- `frontend/src/features/budgets/pages/BudgetsPage.tsx`

**Changes needed:**
- Filter budgets by active profiles
- Create budgets in main profile
- Show currency from profile settings

### 3. Goals Feature

**Files to modify:**
- `frontend/src/features/goals/hooks/useGoals.ts`
- `frontend/src/features/goals/pages/GoalsPage.tsx`

**Changes needed:**
- Filter goals by active profiles
- Create goals in main profile
- Aggregate progress across profiles

### 4. Analytics Feature

**Files to modify:**
- `frontend/src/features/analytic/hooks/useAnalyticOverview.ts`
- `frontend/src/features/analytic/pages/AnalyticPage.tsx`

**Changes needed:**
- Aggregate analytics across active profiles
- Show per-profile breakdown
- Handle multi-currency conversion
- Profile comparison charts

### 5. Dashboard

**Files to modify:**
- `frontend/src/pages/Dashboard.tsx`

**Changes needed:**
- Show aggregated stats for active profiles
- Profile selector visibility
- Quick stats per profile
- Main profile highlighted

### 6. Accounts Feature

**Files to modify:**
- `frontend/src/features/accounts/hooks/useAccounts.ts`
- `frontend/src/features/accounts/pages/AccountsPage.tsx`

**Changes needed:**
- Accounts already linked to profiles via `financial_profile_id`
- Filter accounts by active profiles
- Show profile name for each account

### 7. AI Assistant

**Files to modify:**
- `frontend/src/features/ai-assistant/pages/AIAssistantPage.tsx`

**Changes needed:**
- Include active profiles context in AI queries
- Filter suggestions by profile
- Profile-aware spending analysis

## 🎨 UI/UX Considerations

### Currency Handling

When multiple profiles with different currencies are selected:
1. Display amounts in native currency with currency code
2. Optionally convert to main profile currency
3. Show conversion rates and date
4. Allow user to select display currency

### Profile Indicators

- **Main Profile**: Yellow star icon ⭐
- **Active Profile**: Blue checkmark ✓
- **Inactive Profile**: Gray, unselected

### Empty States

- No profiles: Prompt to create first profile
- No selection: Auto-select first profile
- No main profile: Auto-set first profile

### Performance

- Cache profile data in React Query
- Lazy load profile-specific data
- Debounce profile selection updates
- Optimistic UI updates

## 🔒 Security Considerations

1. **Authorization**: All profile operations check user ownership
2. **Validation**: Profile IDs validated before DB queries
3. **Cascade Delete**: Soft delete preserves data integrity
4. **Audit Trail**: All profile changes logged (if audit enabled)

## 🧪 Testing Checklist

### Backend
- [ ] Create profile
- [ ] Update profile
- [ ] Delete profile (soft delete)
- [ ] Set main profile
- [ ] Get main profile
- [ ] Update profile selection
- [ ] Get profile selection
- [ ] Authorization checks
- [ ] Invalid profile ID handling

### Frontend
- [ ] Profile list loads
- [ ] Create new profile
- [ ] Edit existing profile
- [ ] Delete profile with confirmation
- [ ] Set main profile
- [ ] Multi-select profiles in dropdown
- [ ] Toggle profile selection
- [ ] Profile selector in sidebar
- [ ] Navigation to profile management
- [ ] Auto-initialization (first profile)
- [ ] Empty states
- [ ] Translations (EN/IT)

### Integration
- [ ] ProfileContext provides correct data
- [ ] Profile changes reflected across app
- [ ] Main profile used for new data
- [ ] Active profiles filter data correctly
- [ ] Currency formatting per profile
- [ ] Performance with multiple profiles

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Endpoints

#### List Profiles
```http
GET /profiles/
Authorization: Bearer {token}

Response: 200 OK
{
  "profiles": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Personal Finance",
      "description": "My personal accounts",
      "profile_type": "personal",
      "default_currency": "EUR",
      "is_active": true,
      "is_available": true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### Set Main Profile
```http
PATCH /profiles/main
Authorization: Bearer {token}
Content-Type: application/json

{
  "main_profile_id": "uuid"
}

Response: 200 OK
{
  "user_id": "uuid",
  "main_profile_id": "uuid"
}
```

#### Update Profile Selection
```http
POST /profiles/selection
Authorization: Bearer {token}
Content-Type: application/json

{
  "active_profile_ids": ["uuid1", "uuid2"]
}

Response: 200 OK
{
  "id": "uuid",
  "user_id": "uuid",
  "active_profile_ids": ["uuid1", "uuid2"],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

## 🎯 Summary

The multi-profile functionality is now fully implemented at the core level:
- ✅ Backend models, schemas, and API endpoints
- ✅ Frontend types, API layer, and React Query hooks
- ✅ Profile context for state management
- ✅ Complete UI components for profile management
- ✅ Profile selector integrated in sidebar
- ✅ Full translations (EN/IT)
- ✅ Database migration ready

**Remaining work**: Integrate profile filtering and main profile usage into existing features (Transactions, Budgets, Goals, Analytics, Dashboard, Accounts, AI Assistant).

---

**Created**: 2025-11-17
**Author**: Claude-Code Multi-Profile Implementation
