# Finance Pro - Architecture Documentation

## Single Source of Truth (SOT)

**The definitive Single Source of Truth is: Pydantic Models in the backend**

Location: `backend/app/schemas/*.py` + `backend/app/models/enums.py`

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (Python/FastAPI)                                    │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 1. Pydantic Models (SOT)                             │   │
│ │    - app/schemas/*.py                                │   │
│ │    - app/models/enums.py                            │   │
│ │    - Validation: Field(...), validators             │   │
│ └────────────────────┬─────────────────────────────────┘   │
│                      │                                      │
│                      │ FastAPI.openapi()                    │
│                      │ (automatic generation)               │
│                      ↓                                      │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 2. OpenAPI Specification                             │   │
│ │    - backend/openapi.json (238 KB)                  │   │
│ │    - Generated via: scripts/generate_openapi.py     │   │
│ │    - OpenAPI 3.1.0 compliant                        │   │
│ └────────────────────┬─────────────────────────────────┘   │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       │ Copy to frontend
                       │ (npm script: generate:openapi)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (TypeScript/React)                                 │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 3. OpenAPI Specification (copy)                      │   │
│ │    - frontend/openapi.json                          │   │
│ └────────────────────┬─────────────────────────────────┘   │
│                      │                                      │
│                      │ Orval generation                     │
│                      │ (npm script: generate:api)           │
│                      ↓                                      │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 4. TypeScript Types + React Query Hooks             │   │
│ │    - src/api/generated/models/*.ts (256 files)      │   │
│ │    - src/api/generated/{domain}/{domain}.ts         │   │
│ │    - Interfaces: TransactionCreate, AccountResponse │   │
│ │    - Hooks: useCreateTransactionApiV1TransactionsPost│   │
│ └────────────────────┬─────────────────────────────────┘   │
│                      │                                      │
│                      │ Direct usage                         │
│                      │ (import from @/api/generated/models) │
│                      ↓                                      │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 5. Components, Forms, Pages                          │   │
│ │    - TransactionForm uses TransactionCreate type    │   │
│ │    - No manual schemas, no duplication              │   │
│ │    - Validation: React Hook Form + backend 422      │   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Generated Artifacts

### Automatic Generation

1. **`backend/openapi.json`**
   - Generated from: Pydantic models via FastAPI
   - Command: `python backend/scripts/generate_openapi.py`
   - Size: ~238 KB
   - Contains: 70+ endpoints, 12 tags, 120+ schemas

2. **`frontend/openapi.json`**
   - Copy of: `backend/openapi.json`
   - Command: `npm run generate:openapi`
   - Used by: Orval for TypeScript generation

3. **`frontend/src/api/generated/`**
   - Generated from: `frontend/openapi.json` via Orval
   - Command: `npm run generate:api`
   - Contents:
     - `models/*.ts` - 256 TypeScript interfaces
     - `{domain}/{domain}.ts` - React Query hooks per domain
   - Size: ~735 KB (excluding removed zod.ts)

### Manual Files (DO NOT GENERATE)

- `frontend/src/api/client.ts` - Custom Axios mutator
- `frontend/src/services/api.ts` - Axios base instance
- Component files, hooks, pages (use generated types)

## Preventing BE/FE Drift

### Strict Rules

❌ **FORBIDDEN:**
- Defining manual schemas in frontend (e.g., Zod, custom types)
- Using `as` type casts without validation
- Duplicating enums/types from backend
- Hardcoding API field names different from backend

✅ **MANDATORY:**
- Import types only from `@/api/generated/models`
- Use React Query hooks from `@/api/generated/{domain}`
- Use snake_case field names matching backend API
- Regenerate before every build/dev (pre-hooks)

### Automation

**npm Scripts:**
```json
{
  "generate:openapi": "cd ../backend && ./venv/bin/python scripts/generate_openapi.py",
  "generate:api": "orval --config orval.config.ts",
  "generate:full": "npm run generate:openapi && npm run generate:api",
  "prebuild": "npm run generate:api",
  "predev": "npm run generate:api"
}
```

**Pre-hooks:**
- `prebuild` - Regenerates types before production build
- `predev` - Regenerates types before dev server

**CI/CD Checks:**
- Verify generated files are up-to-date
- Run `npm run generate:full` in CI
- Fail if generated files differ from committed versions

## Validation Strategy

### Backend Validation (Primary)

- **Framework:** Pydantic
- **Location:** `app/schemas/*.py`
- **Features:**
  - Field constraints: `min_length`, `max_length`, `pattern`, `ge`, `le`
  - Custom validators: `@field_validator`
  - Type validation: `UUID`, `Decimal`, `date`, `datetime`, `Enum`
  - Error responses: 422 Unprocessable Entity with detailed messages

### Frontend Validation (Secondary)

- **Framework:** React Hook Form (built-in validators)
- **Location:** Component files (e.g., `TransactionForm.tsx`)
- **Features:**
  - Required fields
  - Min/max values
  - Regex patterns (currency, UUID)
  - Real-time validation (mode: 'onChange')
- **No Zod:** Eliminated to prevent duplication and drift

### Error Handling

1. **Client-side validation** - Immediate feedback (onChange)
2. **Backend validation** - Definitive validation on submit
3. **422 errors** - Display backend validation errors to user
4. **Type safety** - TypeScript prevents type errors at compile time

## Decision History

### Zod Elimination (2025-01)

**Decision:** Complete elimination of Zod from the codebase

**Rationale:**
- Generated Zod schemas (119 KB) were never used
- Manual Zod schema in TransactionForm was inconsistent with backend
- Enum mismatch: 3 values in form vs 17 in backend
- Field name mismatch: camelCase vs snake_case
- Type mismatch: number vs UUID string
- Validation duplication between Pydantic and Zod

**Benefits:**
- -119 KB bundle size
- No drift risk between Zod and Pydantic schemas
- Simpler architecture
- Single source of validation truth (backend)
- React Hook Form works perfectly without Zod

**Files Changed:**
- `orval.config.ts` - Removed `financepro-zod` configuration
- `src/api/generated/zod.ts` - Deleted (119 KB)
- `src/features/transactions/components/TransactionForm.tsx` - Refactored to use generated types

## Type System

### Backend Types (Python)

```python
# Pydantic Model
class TransactionCreate(BaseModel):
    account_id: UUID
    transaction_type: TransactionType  # Enum
    amount: Decimal
    currency: str = Field(pattern="^[A-Z]{3}$")
    description: str = Field(min_length=1)
```

### Generated TypeScript Types

```typescript
// Auto-generated from OpenAPI
export interface TransactionCreate {
  account_id: string;  // UUID as string
  transaction_type: TransactionType;  // Enum
  amount: number;
  currency: string;  // Pattern in JSDoc
  description: string;  // MinLength in JSDoc
}

export const TransactionType = {
  bank_transfer: "bank_transfer",
  purchase: "purchase",
  // ... 17 values total
} as const;
```

### Frontend Usage

```typescript
import { TransactionCreate, TransactionType } from '@/api/generated/models';

// Type-safe form
const { register } = useForm<TransactionCreate>();

// Type-safe hook
const { mutate } = useCreateTransactionApiV1TransactionsPost();
mutate(data);  // data is TransactionCreate
```

## Development Workflow

### Adding New Backend Field

1. Add field to Pydantic model (`backend/app/schemas/*.py`)
2. Run `npm run generate:full` (from frontend)
3. TypeScript will show errors where type is now incomplete
4. Update frontend components to use new field
5. Commit both backend and generated frontend files

### Changing Field Type

1. Change type in Pydantic model
2. Regenerate OpenAPI and TypeScript
3. TypeScript compiler will catch all usages with wrong type
4. Fix all type errors
5. Test end-to-end

### Adding New Endpoint

1. Add FastAPI route in backend
2. Regenerate types
3. New React Query hook automatically available
4. Import and use: `useNewEndpointApiV1PathPost()`

## Maintenance

### Regular Tasks

- ✅ Run `npm run generate:full` after pulling backend changes
- ✅ Review generated types after major schema changes
- ✅ Keep Orval version updated (currently 8.0.0-rc.2)
- ✅ Verify pre-hooks are working in CI/CD

### Troubleshooting

**Problem:** Generated types are outdated
- **Solution:** Run `npm run generate:full`

**Problem:** TypeScript errors after backend changes
- **Solution:** Normal - fix components to match new types

**Problem:** 422 validation errors at runtime
- **Solution:** Check backend validation rules, update frontend validation to match

**Problem:** Field names don't match between FE/BE
- **Solution:** Use snake_case in frontend to match backend exactly

## References

- **Backend Schemas:** `backend/app/schemas/`
- **OpenAPI Spec:** `backend/openapi.json`
- **Orval Config:** `frontend/orval.config.ts`
- **Generated Types:** `frontend/src/api/generated/models/`
- **Custom Mutator:** `frontend/src/api/client.ts`
