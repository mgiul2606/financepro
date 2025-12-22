# Orval + Zod Schema Integration

## Overview

This project now uses **Orval to automatically generate both React Query hooks AND Zod schemas** from the OpenAPI specification. This eliminates the need for manual schema definitions and API wrapper functions.

## Architecture

```
OpenAPI Spec (openapi.json)
    ↓
Orval Generator
    ↓
    ├── React Query Hooks (src/api/generated/*/*)
    └── Zod Schemas (src/api/generated/zod/*/*.zod.ts)
```

## Migration Status

### ✅ Migrated Modules
- **Accounts** - Fully migrated to use Orval-generated Zod schemas

### 🔄 Pending Migration
The following modules still use manual wrappers and should be migrated:
- ai-assistant
- goals
- profiles
- analytic
- budgets
- transactions
- categories
- optimization

## How It Works

### 1. Configuration (`orval.config.ts`)

Two separate Orval configurations:

```typescript
// React Query hooks + TypeScript types
financepro: { client: 'react-query', ... }

// Zod schemas for runtime validation
financepro_zod: { client: 'zod', ... }
```

### 2. Generated Files Structure

**React Query Hooks:**
```
src/api/generated/
  accounts/
    accounts.ts        # React Query hooks
  models/
    index.ts          # TypeScript types
```

**Zod Schemas:**
```
src/api/generated/zod/
  accounts/
    accounts.zod.ts   # Zod validation schemas
```

### 3. Feature Module Pattern (Example: Accounts)

**Before:**
```typescript
// accounts.api.ts - Manual wrapper with Zod validation ❌ DELETED
// accounts.schemas.ts - Manual Zod schemas ❌ REPLACED

// Usage
import { fetchAccounts } from './accounts.api'
const accounts = await fetchAccounts()
```

**After:**
```typescript
// accounts.schemas.ts - Imports from generated schemas ✅
import {
  createAccountApiV1AccountsPostBody,
  listAccountsApiV1AccountsGetResponse
} from '@/api/generated/zod/accounts/accounts.zod'

export const accountCreateSchema = createAccountApiV1AccountsPostBody
export const accountListSchema = listAccountsApiV1AccountsGetResponse

// accounts.hooks.ts - Uses generated React Query hooks ✅
import { useListAccountsApiV1AccountsGet } from '@/api/generated/accounts/accounts'

export const useAccounts = () => {
  const query = useListAccountsApiV1AccountsGet()
  return { accounts: query.data?.data?.accounts }
}
```

## Migration Guide

To migrate a module (e.g., `transactions`):

### Step 1: Update schemas file
```typescript
// features/transactions/transactions.schemas.ts

// Import generated Zod schemas
import {
  createTransactionApiV1TransactionsPostBody,
  updateTransactionApiV1TransactionsTransactionIdPatchBody,
  getTransactionApiV1TransactionsTransactionIdGetResponse,
  listTransactionsApiV1TransactionsGetResponse,
} from '@/api/generated/zod/transactions/transactions.zod'

// Create simple aliases
export const transactionCreateSchema = createTransactionApiV1TransactionsPostBody
export const transactionUpdateSchema = updateTransactionApiV1TransactionsTransactionIdPatchBody
export const transactionResponseSchema = getTransactionApiV1TransactionsTransactionIdGetResponse
export const transactionListSchema = listTransactionsApiV1TransactionsGetResponse

// Keep UI-specific schemas that don't exist in the API
export const transactionWithCategorySchema = transactionResponseSchema.extend({
  categoryName: z.string(),
  categoryColor: z.string(),
})
```

### Step 2: Verify hooks already use generated functions
Check that `*.hooks.ts` already imports from `@/api/generated/*/` (they likely do).

### Step 3: Delete manual wrapper
```bash
rm features/transactions/transactions.api.ts
```

### Step 4: Update index exports
```typescript
// features/transactions/index.ts
// Remove exports from transactions.api.ts
// Keep only hooks, schemas, types exports
```

### Step 5: Type check
```bash
npm run type-check
```

## Benefits

✅ **Single source of truth**: OpenAPI spec → Auto-generated code
✅ **No manual sync**: Schemas update automatically when API changes
✅ **Runtime validation**: Zod schemas validate API responses
✅ **Type safety**: TypeScript types + runtime validation
✅ **Less code to maintain**: No manual wrappers needed
✅ **DRY principle**: Don't repeat yourself

## Regenerating Schemas

Whenever the OpenAPI spec changes:

```bash
npm run generate:api
```

This regenerates both React Query hooks and Zod schemas automatically.

## Custom Validation

If you need custom validation messages or stricter rules:

```typescript
// Extend the generated schema
import { accountCreateSchema as baseSchema } from '@/api/generated/zod/accounts/accounts.zod'

export const accountCreateSchema = baseSchema.extend({
  name: z.string()
    .min(1, 'accounts.errors.nameRequired')
    .max(100, 'accounts.errors.nameTooLong')
})
```

## Notes

- **UI-specific schemas** (e.g., with computed fields) should still be defined manually in `*.schemas.ts`
- **Generated schema names are verbose** (e.g., `createAccountApiV1AccountsPostBody`) - use aliases for better DX
- **Keep custom business logic** in hooks or separate files - only eliminate mechanical wrapper code
