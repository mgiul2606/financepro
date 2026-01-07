# 🔧 Analisi e Refactoring delle Utilities Orval

## 📋 Problemi del Codice Attuale

### 1. **Type Extraction Limitata** (`useQueryUtils.ts`)

#### Problema: Status Code Hard-coded
```typescript
export type ExtractSuccessData<TResponse> =
  TResponse extends { data: infer TData; status: 200 }
    ? TData
    : never;
```

**Issues:**
- ❌ Assume solo status 200, ma Orval genera 201 (POST), 204 (DELETE)
- ❌ Non sfrutta i tipi helper di Orval (`XxxQueryResult`, `XxxMutationResult`)
- ❌ Richiede re-implementazione di logica già presente in Orval

#### Problema: Unwrap Runtime Non Type-Safe
```typescript
export function unwrap<TResponse extends OrvalResponseShape>(
  query: UseQueryResult<TResponse, unknown>,
): ExtractSuccessData<TResponse> | undefined {
  if (query.status === 'success' && query.data.status === 200) {
    return query.data.data as ExtractSuccessData<TResponse>;  // ❌ Type assertion
  }
  return undefined;
}
```

**Issues:**
- ❌ Doppio controllo ridondante (`query.status` e `query.data.status`)
- ❌ Type assertion pericolosa (`as ExtractSuccessData<TResponse>`)
- ❌ Non usa `select` di TanStack Query (idiomatico per transformations)

---

### 2. **Perdita di Type Safety** (`useGenericQueries.ts`)

#### Problema: Dynamic Keys Senza Type Completion
```typescript
export function createGenericGetById({
  dataKey,  // string generico
  ...
}) {
  return (id: string) => {
    return {
      [dataKey]: query.data?.data,  // ❌ Nessun autocomplete
      isLoading: query.isLoading,
      error: query.error,
    };
  };
}

// Uso:
const { account } = useAccount(id);  // ❌ 'account' non ha type hints
const { acccont } = useAccount(id);  // ❌ Typo non rilevato!
```

**Issues:**
- ❌ Type inference perso con `[dataKey]`
- ❌ Nessun autocomplete nell'IDE
- ❌ Typo non rilevati dal compilatore

---

### 3. **Multi-Profile Hook Troppo Complesso**

#### Problema: Parametri Opzionali Usati Senza Controllo
```typescript
export interface UseGenericMultiProfileListOptions<TParams, TWrappedResponse> {
  mapProfileIdToParams: (profileId: string) => TParams;  // ❌ Non optional
  // ...
}

// Nel codice:
const queryParams = mapProfileIdToParams(profileId);  // Runtime error se undefined!
```

#### Problema: Aggregazione Hard-coded
```typescript
itemsKey = 'items',  // ❌ Assume sempre questo nome
totalKey = 'total',  // ❌ Non funziona con AccountList { accounts, total }
```

**Issues:**
- ❌ Non funziona con strutture come `AccountList { accounts, total }`
- ❌ Logica di aggregazione non configurabile
- ❌ Troppa responsabilità in un singolo hook

---

## ✅ Soluzioni Proposte

### Principi di Design

1. **Sfruttare i tipi Orval nativi** invece di re-implementarli
2. **Type-safety completa** con autocomplete
3. **Composizione over configurazione** - hook semplici e componibili
4. **Idiomi TanStack Query** - `select`, `queryKey`, etc.
5. **Separazione delle responsabilità** - type utils, runtime utils, hook factories

---

## 🏗️ Architettura Proposta

### Layer 1: Type Utilities (Compile-Time)

```typescript
// frontend/src/lib/orval-types.ts

/**
 * Estrae il tipo di dati dal tipo di response di Orval
 * Funziona con qualsiasi status code di successo (200, 201, 204, etc.)
 */
export type ExtractOrvalData<TResponse> =
  TResponse extends { data: infer TData; status: infer TStatus }
    ? TStatus extends 200 | 201 | 204
      ? TData
      : never
    : never;

/**
 * Estrae il tipo di errore da una response Orval
 */
export type ExtractOrvalError<TResponse> =
  TResponse extends { data: infer TData; status: infer TStatus }
    ? TStatus extends 400 | 403 | 404 | 422
      ? TData
      : never
    : never;

/**
 * Type-safe wrapper per risultati di query
 */
export type SafeQueryResult<TData> = {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};
```

### Layer 2: Runtime Utilities (Semplici e Sicure)

```typescript
// frontend/src/lib/orval-utils.ts

import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Estrae data da una query Orval in modo sicuro
 * Usa conditional types invece di runtime checks
 */
export function extractData<TResponse extends { data: unknown; status: number }>(
  query: UseQueryResult<TResponse, unknown>
): TResponse extends { status: 200 | 201 } ? TResponse['data'] : undefined {
  if (query.isSuccess && 'data' in query.data) {
    return query.data.data as any;
  }
  return undefined as any;
}

/**
 * Check type-safe per query di successo
 */
export function isSuccess<TResponse extends { data: unknown; status: number }>(
  query: UseQueryResult<TResponse, unknown>
): query is UseQueryResult<TResponse, unknown> & {
  isSuccess: true;
  data: TResponse & { status: 200 | 201 };
} {
  return query.isSuccess &&
         'data' in query.data &&
         (query.data.status === 200 || query.data.status === 201);
}
```

### Layer 3: Hook Factories (Type-Safe)

```typescript
// frontend/src/hooks/factories/createGetByIdHook.ts

import type { UseQueryResult, QueryKey } from '@tanstack/react-query';

/**
 * Tipi per hook Orval GET by ID
 */
export type OrvalGetByIdHook<TResponse, TError = Error> = (
  id: string,
  options?: {
    query?: { enabled?: boolean; staleTime?: number };
    request?: RequestInit;
  }
) => UseQueryResult<TResponse, TError> & { queryKey: QueryKey };

/**
 * Factory type-safe per GET by ID hooks
 *
 * IMPORTANTE: Ritorna un oggetto con proprietà statiche, non dynamic keys
 */
export function createGetByIdHook<
  TResponse extends { data: TData; status: number },
  TData
>(
  useOrvalQuery: OrvalGetByIdHook<TResponse>
) {
  return (id: string, options?: { enabled?: boolean }) => {
    const query = useOrvalQuery(id, {
      query: { enabled: options?.enabled ?? !!id },
    });

    // ✅ Type-safe: proprietà fisse invece di [dataKey]
    return {
      data: query.isSuccess ? query.data.data : undefined,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
      queryKey: query.queryKey,
    } as const;
  };
}
```

### Layer 4: Composable Multi-Profile Logic

```typescript
// frontend/src/hooks/factories/createMultiProfileListHook.ts

import { useQueries } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';

/**
 * Configurazione per liste multi-profile
 */
export interface MultiProfileListConfig<TParams, TResponse, TData> {
  /**
   * Funzione per generare query key
   */
  getQueryKey: (params: TParams) => QueryKey;

  /**
   * Funzione di fetch (da Orval)
   */
  queryFn: (params: TParams, options?: RequestInit) => Promise<TResponse>;

  /**
   * Estrae array items dalla response
   * @example (response) => response.data.accounts
   */
  extractItems: (response: TResponse) => TData[];

  /**
   * Estrae total count dalla response
   * @example (response) => response.data.total
   */
  extractTotal: (response: TResponse) => number;

  /**
   * Mappa profile ID a parametri API (opzionale)
   * Se omesso, usa query key per differenziare cache
   */
  mapProfileToParams?: (profileId: string) => TParams;

  /**
   * Parametri base (merged con profile params)
   */
  baseParams?: Partial<TParams>;
}

/**
 * Hook generico per liste multi-profile
 */
export function createMultiProfileListHook<
  TParams extends object,
  TResponse,
  TData
>(config: MultiProfileListConfig<TParams, TResponse, TData>) {
  return (activeProfileIds: string[], options?: { enabled?: boolean }) => {
    const queries = useQueries({
      queries: activeProfileIds.map((profileId) => {
        // Merge params: base + profile-specific
        const params = config.mapProfileToParams
          ? { ...config.baseParams, ...config.mapProfileToParams(profileId) } as TParams
          : { ...config.baseParams } as TParams;

        const queryKey = [...config.getQueryKey(params), profileId];

        return {
          queryKey,
          queryFn: () => config.queryFn(params),
          enabled: options?.enabled ?? activeProfileIds.length > 0,
        };
      }),
    });

    // Aggregazione type-safe
    const items = queries.flatMap((query) =>
      query.isSuccess ? config.extractItems(query.data) : []
    );

    const total = queries.reduce(
      (sum, query) => sum + (query.isSuccess ? config.extractTotal(query.data) : 0),
      0
    );

    return {
      items,
      total,
      isLoading: queries.some((q) => q.isLoading),
      isError: queries.some((q) => q.isError),
      error: queries.find((q) => q.error)?.error ?? null,
      refetch: () => queries.forEach((q) => q.refetch()),
    };
  };
}
```

---

## 📝 Esempi di Uso

### Esempio 1: GET by ID (Type-Safe)

```typescript
// hooks/useAccount.ts
import { useGetAccountApiV1AccountsAccountIdGet } from '@/api/generated/accounts/accounts';
import { createGetByIdHook } from '@/hooks/factories/createGetByIdHook';
import type { AccountResponse } from '@/api/generated/models';

export const useAccount = createGetByIdHook<
  GetAccountApiV1AccountsAccountIdGetQueryResult,
  AccountResponse
>(useGetAccountApiV1AccountsAccountIdGet);

// Uso nel componente:
const { data, isLoading, error } = useAccount(accountId);
//     ^? AccountResponse | undefined  ✅ Type-safe!
```

### Esempio 2: Multi-Profile List

```typescript
// hooks/useAccounts.ts
import {
  getListAccountsApiV1AccountsGetQueryKey,
  listAccountsApiV1AccountsGet,
  type ListAccountsApiV1AccountsGetQueryResult,
} from '@/api/generated/accounts/accounts';
import { createMultiProfileListHook } from '@/hooks/factories/createMultiProfileListHook';
import { useProfileContext } from '@/contexts/ProfileContext';

const useAccountsBase = createMultiProfileListHook({
  getQueryKey: getListAccountsApiV1AccountsGetQueryKey,
  queryFn: listAccountsApiV1AccountsGet,
  extractItems: (response) => response.data.accounts,
  extractTotal: (response) => response.data.total,
  // mapProfileToParams: NON fornito - API usa header/context
});

export const useAccounts = () => {
  const { activeProfileIds, isLoading: profileLoading } = useProfileContext();

  const result = useAccountsBase(activeProfileIds, {
    enabled: !profileLoading
  });

  return {
    accounts: result.items,  // ✅ Type: AccountResponse[]
    total: result.total,
    isLoading: result.isLoading || profileLoading,
    error: result.error,
    refetch: result.refetch,
  };
};
```

### Esempio 3: List con Profile Parameters

```typescript
// hooks/useTransactions.ts
const useTransactionsBase = createMultiProfileListHook({
  getQueryKey: getListTransactionsApiV1TransactionsGetQueryKey,
  queryFn: listTransactionsApiV1TransactionsGet,
  extractItems: (response) => response.data.items,
  extractTotal: (response) => response.data.total,
  mapProfileToParams: (profileId) => ({ profile_ids: [profileId] }),
  baseParams: { limit: 100, status: 'active' },  // Params sempre presenti
});
```

---

## 🎯 Vantaggi della Nuova Architettura

### ✅ Type Safety Completa
- Autocomplete per tutte le proprietà
- Errori di typo rilevati a compile-time
- Inference corretta dei tipi generici

### ✅ Separazione delle Responsabilità
- **Type utils**: solo trasformazioni di tipi
- **Runtime utils**: solo extraction sicura
- **Hook factories**: solo composizione

### ✅ Riusabilità
- Pattern componibili
- Facile estendere per nuovi endpoint
- DRY principle applicato

### ✅ Manutenibilità
- Codice più semplice
- Meno edge cases
- Documentazione chiara con esempi

---

## 📦 File da Creare/Modificare

1. **`frontend/src/lib/orval-types.ts`** - Type utilities
2. **`frontend/src/lib/orval-utils.ts`** - Runtime utilities
3. **`frontend/src/hooks/factories/createGetByIdHook.ts`** - GET by ID factory
4. **`frontend/src/hooks/factories/createMultiProfileListHook.ts`** - Multi-profile list factory
5. **Modificare**: `useQueryUtils.ts`, `useGenericQueries.ts` (deprecare)

---

## 🚀 Migration Path

### Fase 1: Creare nuove utilities (non-breaking)
- Implementare nuovi file senza toccare codice esistente

### Fase 2: Migrare hook esistenti uno alla volta
- Iniziare con `useAccount`, `useAccounts`
- Testare ogni migrazione

### Fase 3: Deprecare vecchie utilities
- Aggiungere `@deprecated` tags
- Rimuovere dopo migrazione completa

---

## 💡 Pattern Aggiuntivi da Considerare

### 1. Select Transformation (TanStack Query idiom)
```typescript
const accounts = useListAccountsApiV1AccountsGet(params, {
  query: {
    select: (response) => response.data.accounts,  // ✅ Unwrap automatico
  },
});
// accounts.data è già AccountResponse[] !
```

### 2. Infinite Queries (per liste paginate)
```typescript
export function createInfiniteListHook<TParams, TResponse, TData>() {
  // Usa useInfiniteQuery per liste con paginazione
}
```

### 3. Optimistic Updates (per mutations)
```typescript
export function createMutationWithOptimisticUpdate() {
  // Wrapper per mutations con UI ottimistica
}
```
