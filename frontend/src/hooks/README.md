# Type-Safe Orval Hook Factories

Utilities e factory functions per creare hook type-safe che wrappano i metodi generati da Orval.

## 📚 Indice

- [Panoramica](#panoramica)
- [Architettura](#architettura)
- [Utilities](#utilities)
- [Hook Factories](#hook-factories)
- [Esempi](#esempi)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

---

## 🎯 Panoramica

Questo sistema fornisce un layer type-safe sopra i metodi generati da Orval, risolvendo i seguenti problemi:

### ❌ Problemi Risolti

1. **Unwrapping manuale dei dati**: Orval wrappa le response in `{ data: T, status: number }`
2. **Perdita di type safety**: Dynamic keys (`[dataKey]`) perdono l'autocomplete
3. **Codice duplicato**: Stesso pattern ripetuto per ogni endpoint
4. **Multi-profile complexity**: Gestione manuale di query multiple e aggregazione

### ✅ Soluzioni Fornite

1. **Type utilities**: Extraction sicura dei tipi a compile-time
2. **Runtime utilities**: Helper per data extraction con type narrowing
3. **Hook factories**: Pattern riusabili per creare hook type-safe
4. **Multi-profile support**: Aggregazione automatica di query multiple

---

## 🏗️ Architettura

Il sistema è diviso in 4 layer:

```
Layer 1: Type Utilities (lib/orval-types.ts)
├─ ExtractOrvalData<T>        - Estrae il tipo di dato da una response
├─ ExtractOrvalError<T>       - Estrae i tipi di errore
├─ SafeQueryResult<T>         - Type wrapper per risultati di query
└─ UnwrapQueryResult<T>       - Unwrap dei tipi Orval

Layer 2: Runtime Utilities (lib/orval-utils.ts)
├─ extractQueryData()         - Estrazione sicura di dati da query
├─ isQuerySuccess()           - Type guard per query di successo
├─ flatMapQueries()           - Aggregazione di array da query multiple
└─ reduceQueries()            - Riduzione di risultati multipli

Layer 3: Hook Factories (hooks/factories/)
├─ createGetByIdHook()             - Factory per GET by ID
├─ createGetByIdHookWithSelect()   - Factory con TanStack Query select
└─ createMultiProfileListHook()    - Factory per liste multi-profile

Layer 4: Domain Hooks (hooks/useXxx.ts)
└─ Hook specifici del dominio creati con le factories
```

---

## 🛠️ Utilities

### Type Utilities (`lib/orval-types.ts`)

#### `ExtractOrvalData<TResponse>`

Estrae il tipo di dato da una response Orval.

```typescript
import type { ExtractOrvalData } from '@/lib/orval-types';

type Response =
  | { data: AccountList; status: 200 }
  | { data: void; status: 400 }
  | { data: HTTPValidationError; status: 422 };

type Data = ExtractOrvalData<Response>;
//   ^? AccountList
```

#### `ExtractOrvalError<TResponse>`

Estrae i tipi di errore possibili.

```typescript
type Errors = ExtractOrvalError<Response>;
//   ^? void | HTTPValidationError
```

### Runtime Utilities (`lib/orval-utils.ts`)

#### `extractQueryData(query)`

Estrae dati da una query in modo type-safe.

```typescript
import { extractQueryData } from '@/lib/orval-utils';

const query = useGetAccountApiV1AccountsAccountIdGet(id);
const account = extractQueryData(query);
//    ^? AccountResponse | undefined
```

#### `isQuerySuccess(query)`

Type guard che stringe il tipo a una query di successo.

```typescript
import { isQuerySuccess } from '@/lib/orval-utils';

if (isQuerySuccess(query)) {
  // TypeScript sa che query.data esiste e ha status 200
  const account = query.data.data;
}
```

#### `flatMapQueries(queries, accessor)`

Aggrega array da query multiple.

```typescript
import { flatMapQueries } from '@/lib/orval-utils';

const queries = profileIds.map(id =>
  useListAccountsApiV1AccountsGet({ profile_id: id })
);

const allAccounts = flatMapQueries(
  queries,
  (data) => data.accounts
);
```

---

## 🏭 Hook Factories

### `createGetByIdHook`

Crea hook type-safe per GET by ID.

#### Tipo di Signature

```typescript
function createGetByIdHook<TResponse, TData>(config: {
  useQuery: OrvalGetByIdHook<TResponse>;
  defaultOptions?: GetByIdHookOptions;
}): (id: string, options?: GetByIdHookOptions) => GetByIdHookResult<TData>
```

#### Esempio Base

```typescript
import { createGetByIdHook } from '@/hooks/factories/createGetByIdHook';
import {
  useGetAccountApiV1AccountsAccountIdGet,
  type GetAccountApiV1AccountsAccountIdGetQueryResult,
} from '@/api/generated/accounts/accounts';
import type { AccountResponse } from '@/api/generated/models';

export const useAccount = createGetByIdHook<
  GetAccountApiV1AccountsAccountIdGetQueryResult,
  AccountResponse
>({
  useQuery: useGetAccountApiV1AccountsAccountIdGet,
});

// Uso:
const { data, isLoading, error } = useAccount(accountId);
//     ^? { data: AccountResponse | undefined, ... }
```

#### Con Opzioni

```typescript
export const useAccount = createGetByIdHook<...>({
  useQuery: useGetAccountApiV1AccountsAccountIdGet,
  defaultOptions: {
    staleTime: 30000,              // Data fresca per 30s
    gcTime: 300000,                // Cache per 5 minuti
    isIdValid: (id) => id.length === 36,  // Validazione UUID
  },
});
```

#### Opzioni Runtime

```typescript
const { data } = useAccount(id, {
  enabled: shouldFetch,
  staleTime: 60000,
});
```

### `createGetByIdHookWithSelect`

Alternativa che usa `select` di TanStack Query (più idiomatico).

```typescript
export const useAccount = createGetByIdHookWithSelect<...>({
  useQuery: useGetAccountApiV1AccountsAccountIdGet,
});
```

### `createMultiProfileListHook`

Crea hook per liste con supporto multi-profile.

#### Tipo di Signature

```typescript
function createMultiProfileListHook<TParams, TResponse, TItem>(
  config: MultiProfileListConfig<TParams, TResponse, TItem>
): (
  activeProfileIds: string[],
  options?: MultiProfileListHookOptions
) => MultiProfileListResult<TItem>
```

#### Esempio: Context-based Filtering

```typescript
import { createMultiProfileListHook } from '@/hooks/factories/createMultiProfileListHook';
import {
  getListAccountsApiV1AccountsGetQueryKey,
  listAccountsApiV1AccountsGet,
  type ListAccountsApiV1AccountsGetQueryResult,
} from '@/api/generated/accounts/accounts';
import type { AccountResponse } from '@/api/generated/models';

const useAccountsBase = createMultiProfileListHook<
  ListAccountsApiV1AccountsGetParams,
  ListAccountsApiV1AccountsGetQueryResult,
  AccountResponse
>({
  getQueryKey: getListAccountsApiV1AccountsGetQueryKey,
  queryFn: listAccountsApiV1AccountsGet,
  extractItems: (response) => response.data.accounts,
  extractTotal: (response) => response.data.total,
  // No mapProfileToParams - l'API usa context/headers
});

// Wrapper con ProfileContext:
export const useAccounts = () => {
  const { activeProfileIds, isLoading: profilesLoading } = useProfileContext();

  const result = useAccountsBase(activeProfileIds, {
    enabled: !profilesLoading,
  });

  return {
    accounts: result.items,
    total: result.total,
    isLoading: result.isLoading || profilesLoading,
    error: result.error,
    refetch: result.refetch,
  };
};
```

#### Esempio: Parameter-based Filtering

```typescript
const useTransactionsBase = createMultiProfileListHook({
  getQueryKey: getListTransactionsApiV1TransactionsGetQueryKey,
  queryFn: listTransactionsApiV1TransactionsGet,
  extractItems: (response) => response.data.items,
  extractTotal: (response) => response.data.total,
  mapProfileToParams: (profileId) => ({
    profile_ids: [profileId],
  }),
  baseParams: {
    limit: 100,
    status: 'active',
  },
});
```

---

## 📝 Esempi

### Esempio Completo: Account Management

```typescript
// hooks/useAccount.ts
import { createGetByIdHook } from '@/hooks/factories/createGetByIdHook';
import {
  useGetAccountApiV1AccountsAccountIdGet,
  type GetAccountApiV1AccountsAccountIdGetQueryResult,
} from '@/api/generated/accounts/accounts';
import type { AccountResponse } from '@/api/generated/models';

export const useAccount = createGetByIdHook<
  GetAccountApiV1AccountsAccountIdGetQueryResult,
  AccountResponse
>({
  useQuery: useGetAccountApiV1AccountsAccountIdGet,
  defaultOptions: {
    staleTime: 30000,
  },
});

// hooks/useAccounts.ts
import { createMultiProfileListHook } from '@/hooks/factories/createMultiProfileListHook';
import {
  getListAccountsApiV1AccountsGetQueryKey,
  listAccountsApiV1AccountsGet,
} from '@/api/generated/accounts/accounts';
import { useProfileContext } from '@/contexts/ProfileContext';

const useAccountsBase = createMultiProfileListHook({
  getQueryKey: getListAccountsApiV1AccountsGetQueryKey,
  queryFn: listAccountsApiV1AccountsGet,
  extractItems: (response) => response.data.accounts,
  extractTotal: (response) => response.data.total,
});

export const useAccounts = () => {
  const { activeProfileIds, isLoading: profilesLoading } = useProfileContext();
  const result = useAccountsBase(activeProfileIds, {
    enabled: !profilesLoading,
  });

  return {
    accounts: result.items,
    total: result.total,
    isLoading: result.isLoading || profilesLoading,
    error: result.error,
    refetch: result.refetch,
  };
};

// components/AccountDetails.tsx
import { useAccount } from '@/hooks/useAccount';

export function AccountDetails({ accountId }: { accountId: string }) {
  const { data: account, isLoading, error } = useAccount(accountId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!account) return <div>Account not found</div>;

  return (
    <div>
      <h1>{account.name}</h1>
      <p>Balance: {account.currentBalance}</p>
      <p>Type: {account.accountType}</p>
    </div>
  );
}

// components/AccountsList.tsx
import { useAccounts } from '@/hooks/useAccounts';

export function AccountsList() {
  const { accounts, total, isLoading } = useAccounts();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Accounts ({total})</h2>
      {accounts.map(account => (
        <div key={account.id}>
          {account.name} - {account.currentBalance}
        </div>
      ))}
    </div>
  );
}
```

---

## 💡 Best Practices

### 1. **Preferire `select` per Unwrapping**

Quando possibile, usa l'opzione `select` di TanStack Query invece di unwrap manuale:

```typescript
// ✅ Buono (idiomatico)
const query = useListAccountsApiV1AccountsGet({}, {
  query: {
    select: (response) => response.data.accounts,
  },
});
// query.data è già AccountResponse[]

// ❌ Evitare (non idiomatico)
const query = useListAccountsApiV1AccountsGet({});
const accounts = extractQueryData(query)?.accounts;
```

### 2. **Un Hook per Dominio**

Crea un hook wrapper per ogni dominio invece di usare le factory direttamente:

```typescript
// ✅ Buono
// hooks/useAccount.ts
export const useAccount = createGetByIdHook({...});

// components/AccountDetails.tsx
import { useAccount } from '@/hooks/useAccount';

// ❌ Evitare
// components/AccountDetails.tsx
import { createGetByIdHook } from '@/hooks/factories/createGetByIdHook';
const useAccount = createGetByIdHook({...}); // ❌ Non creare inline
```

### 3. **Type Exports per Consumers**

Esporta i tipi di ritorno degli hook:

```typescript
// hooks/useAccount.ts
export const useAccount = createGetByIdHook({...});
export type AccountHookResult = ReturnType<typeof useAccount>;

// components/AccountDetails.tsx
import type { AccountHookResult } from '@/hooks/useAccount';

function useAccountWithCache(): AccountHookResult {
  // Tipo di ritorno garantito compatibile
}
```

### 4. **Naming Convention Consistente**

```typescript
// Singolare per GET by ID
export const useAccount = ...
export const useTransaction = ...
export const useBudget = ...

// Plurale per liste
export const useAccounts = ...
export const useTransactions = ...
export const useBudgets = ...

// Suffissi descrittivi per varianti
export const useActiveAccounts = ...
export const useAccountsForProfile = ...
```

### 5. **Validazione ID Centralizzata**

```typescript
// lib/validators.ts
export const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// hooks/useAccount.ts
export const useAccount = createGetByIdHook({
  useQuery: useGetAccountApiV1AccountsAccountIdGet,
  defaultOptions: {
    isIdValid: isValidUUID,
  },
});
```

---

## 🔄 Migration Guide

### Da `useQueryUtils.ts` al Nuovo Sistema

**Prima (vecchio):**
```typescript
import { unwrap } from '@/lib/useQueryUtils';

const query = useGetAccountApiV1AccountsAccountIdGet(id);
const account = unwrap(query);
```

**Dopo (nuovo):**
```typescript
import { useAccount } from '@/hooks/useAccount';

const { data: account } = useAccount(id);
```

### Da `useGenericQueries.ts` al Nuovo Sistema

**Prima (vecchio):**
```typescript
const { account, isLoading } = createGenericGetById({
  useQuery: useGetAccountApiV1AccountsAccountIdGet,
  dataKey: 'account', // ❌ Nessun autocomplete
})(id);
```

**Dopo (nuovo):**
```typescript
const { data, isLoading } = useAccount(id);
//     ^? AccountResponse | undefined ✅ Type-safe!
```

### Deprecation Plan

1. **Fase 1** (corrente): Nuove utilities disponibili, vecchie ancora supportate
2. **Fase 2** (prossima): Aggiungere `@deprecated` tags alle vecchie utilities
3. **Fase 3** (futura): Rimuovere vecchie utilities dopo migrazione completa

---

## 📦 File Structure

```
frontend/src/
├── lib/
│   ├── orval-types.ts          # Type utilities (compile-time)
│   └── orval-utils.ts          # Runtime utilities
├── hooks/
│   ├── factories/
│   │   ├── createGetByIdHook.ts
│   │   └── createMultiProfileListHook.ts
│   ├── examples/
│   │   └── useAccountsExample.ts
│   ├── useAccount.ts           # Domain hook (creato con factory)
│   ├── useAccounts.ts          # Domain hook (creato con factory)
│   └── README.md               # Questa guida
└── api/
    └── generated/              # File generati da Orval
```

---

## 🎓 Risorse Aggiuntive

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Orval Documentation](https://orval.dev/)
- [TypeScript Type Utilities](https://www.typescriptlang.org/docs/handbook/utility-types.html)

---

## 🐛 Troubleshooting

### Errore: "Type 'X' is not assignable to type 'Y'"

Assicurati di usare i tipi corretti da Orval:

```typescript
// ✅ Corretto
import type {
  GetAccountApiV1AccountsAccountIdGetQueryResult,
} from '@/api/generated/accounts/accounts';

// ❌ Sbagliato
import type { AccountResponse } from '@/api/generated/models';
// AccountResponse è il tipo unwrapped, non il tipo di response!
```

### Query Non Viene Eseguita

Controlla che l'ID sia valido e la query sia `enabled`:

```typescript
const { data, isLoading } = useAccount(accountId, {
  enabled: !!accountId && accountId !== 'undefined',
});
```

### Dati Non Aggiornati

Configura `staleTime` e `gcTime` appropriatamente:

```typescript
export const useAccount = createGetByIdHook({
  useQuery: useGetAccountApiV1AccountsAccountIdGet,
  defaultOptions: {
    staleTime: 60000,    // 1 minuto
    gcTime: 300000,      // 5 minuti
  },
});
```
