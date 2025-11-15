# Guida Migrazione da openapi-typescript a Orval + Zod

## 📋 Panoramica

Questa guida ti aiuta a migrare il codice esistente dal vecchio setup basato su `openapi-typescript` al nuovo sistema Orval + Zod + React Query.

## ✅ Cosa è stato fatto

### Backend
- ✅ Creato script `backend/scripts/generate_openapi.py`
- ✅ Virtual environment configurato
- ✅ OpenAPI 3.1 generato correttamente

### Frontend
- ✅ Installato Orval, React Query, Zod
- ✅ Creato `orval.config.ts`
- ✅ Creato `src/api/client.ts` (custom axios instance)
- ✅ Creato `src/providers/QueryProvider.tsx`
- ✅ Generati TypeScript types, Zod schemas, React Query hooks
- ✅ Rimosso openapi-typescript
- ✅ Aggiornati script npm

### Documentazione
- ✅ `ORVAL_ZOD_ARCHITECTURE.md` - Architettura completa
- ✅ `frontend/USAGE_GUIDE.md` - Esempi pratici
- ✅ `README_ORVAL_SETUP.md` - Setup e quick start

## 🔄 Pattern di Migrazione

### 1. Import dei Tipi

**PRIMA (openapi-typescript):**
```tsx
import { components } from '@/types/generated/api';

type Account = components['schemas']['AccountResponse'];
```

**DOPO (Orval):**
```tsx
import { AccountResponse } from '@/api/generated/models';

// Oppure importa direttamente da index
import type { AccountResponse } from '@/api/generated/models';
```

### 2. Chiamate API con Axios

**PRIMA (Axios manuale):**
```tsx
import api from '@/services/api';

function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/accounts/')
      .then(res => setAccounts(res.data.accounts))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  return <ul>{accounts.map(...)}</ul>;
}
```

**DOPO (React Query hooks):**
```tsx
import { useListAccountsApiV1AccountsGet } from '@/api/generated/accounts/accounts';

function AccountsPage() {
  const { data, isLoading, error } = useListAccountsApiV1AccountsGet();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <ul>{data?.accounts.map(...)}</ul>;
}
```

### 3. Mutations (POST, PUT, PATCH, DELETE)

**PRIMA (Axios manuale):**
```tsx
import api from '@/services/api';

function CreateAccountForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/v1/accounts/', {
        name: 'Savings',
        currency: 'EUR'
      });
      alert('Account created!');
      // Ricarica manualmente gli account
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**DOPO (React Query mutation):**
```tsx
import { useCreateAccountApiV1AccountsPost } from '@/api/generated/accounts/accounts';
import { queryClient } from '@/providers/QueryProvider';
import { getListAccountsApiV1AccountsGetQueryKey } from '@/api/generated/accounts/accounts';

function CreateAccountForm() {
  const createAccount = useCreateAccountApiV1AccountsPost({
    mutation: {
      onSuccess: () => {
        // Invalida automaticamente la cache
        queryClient.invalidateQueries({
          queryKey: getListAccountsApiV1AccountsGetQueryKey(),
        });
        alert('Account created!');
      },
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createAccount.mutate({
      data: {
        name: 'Savings',
        currency: 'EUR',
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <button disabled={createAccount.isPending}>
        {createAccount.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

### 4. Validazione Form

**PRIMA (Validazione manuale):**
```tsx
function CreateAccountForm() {
  const [errors, setErrors] = useState({});

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Required';
    if (values.name?.length > 100) errors.name = 'Too long';
    if (!/^[A-Z]{3}$/.test(values.currency)) {
      errors.currency = 'Invalid currency code';
    }
    return errors;
  };

  // ...
}
```

**DOPO (Zod + React Hook Form):**
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountApiV1AccountsPostBody } from '@/api/generated/zod';

function CreateAccountForm() {
  const form = useForm({
    resolver: zodResolver(createAccountApiV1AccountsPostBody),
  });

  // Validazione automatica basata su schemi backend!
}
```

### 5. Servizi CRUD

**PRIMA (BaseCrudService):**
```tsx
// src/services/accountService.ts
import { BaseCrudService } from './BaseCrudService';

class AccountService extends BaseCrudService {
  constructor() {
    super('/accounts');
  }

  async getBalance(id: number) {
    const response = await this.api.get(`${this.endpoint}/${id}/balance`);
    return response.data;
  }
}

export const accountService = new AccountService();
```

**DOPO (Hooks diretti):**
```tsx
// Usa direttamente gli hooks generati
import {
  useListAccountsApiV1AccountsGet,
  useGetAccountBalanceApiV1AccountsAccountIdBalanceGet,
  useCreateAccountApiV1AccountsPost,
  // ... tutti gli altri
} from '@/api/generated/accounts/accounts';

// Non serve più creare servizi custom!
```

### 6. Error Handling

**PRIMA:**
```tsx
try {
  await api.get('/accounts');
} catch (error) {
  if (error.response?.status === 401) {
    // Handle auth error
  }
}
```

**DOPO:**
```tsx
const { data, error } = useListAccountsApiV1AccountsGet({
  query: {
    onError: (error) => {
      // Type-safe error handling
      console.error(error);
    },
  },
});
```

## 🎯 Checklist di Migrazione per Componenti

Per ogni componente che usa l'API:

- [ ] Importa hook React Query invece di axios diretto
- [ ] Rimuovi useState per loading/error/data
- [ ] Rimuovi useEffect per fetch
- [ ] Usa `isLoading`, `error`, `data` da hook
- [ ] Per mutations, usa hook mutation + invalidateQueries
- [ ] Sostituisci validazione manuale con Zod schemas
- [ ] Aggiorna import dei tipi

## 📝 Esempio Completo di Migrazione

### PRIMA

```tsx
// src/pages/AccountsPage.tsx
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { components } from '@/types/generated/api';

type Account = components['schemas']['AccountResponse'];

function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/accounts/');
      setAccounts(response.data.accounts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: number) => {
    try {
      await api.delete(`/api/v1/accounts/${id}`);
      loadAccounts(); // Reload
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Accounts</h1>
      <ul>
        {accounts.map((account) => (
          <li key={account.id}>
            {account.name}
            <button onClick={() => deleteAccount(account.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### DOPO

```tsx
// src/pages/AccountsPage.tsx
import {
  useListAccountsApiV1AccountsGet,
  useDeleteAccountApiV1AccountsAccountIdDelete,
  getListAccountsApiV1AccountsGetQueryKey,
} from '@/api/generated/accounts/accounts';
import { queryClient } from '@/providers/QueryProvider';

function AccountsPage() {
  const { data, isLoading, error } = useListAccountsApiV1AccountsGet();

  const deleteAccount = useDeleteAccountApiV1AccountsAccountIdDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListAccountsApiV1AccountsGetQueryKey(),
        });
      },
      onError: (err) => {
        alert('Error: ' + err.message);
      },
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Accounts ({data?.total})</h1>
      <ul>
        {data?.accounts.map((account) => (
          <li key={account.id}>
            {account.name}
            <button
              onClick={() => deleteAccount.mutate({ accountId: account.id })}
              disabled={deleteAccount.isPending}
            >
              {deleteAccount.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 🚀 Setup Iniziale per Nuovi Componenti

### 1. Avvolgi l'App con QueryProvider

```tsx
// src/main.tsx
import { QueryProvider } from './providers/QueryProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </React.StrictMode>
);
```

### 2. Usa gli Hooks

```tsx
// Qualsiasi componente
import { useListAccountsApiV1AccountsGet } from '@/api/generated/accounts/accounts';

function MyComponent() {
  const { data } = useListAccountsApiV1AccountsGet();
  // Use data.accounts
}
```

## 🔧 Troubleshooting Comune

### Problema: "Cannot find module '@/api/generated/...'"

**Soluzione:**
```bash
npm run generate:api
```

### Problema: Tipi non corrispondono dopo modifica backend

**Soluzione:**
```bash
npm run generate:full
```

### Problema: Query non si aggiorna dopo mutation

**Soluzione:** Aggiungi `invalidateQueries`:
```tsx
const mutation = useSomeMutation({
  mutation: {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getSomeQueryKey() });
    },
  },
});
```

## 📚 Risorse

- [React Query Docs](https://tanstack.com/query/latest)
- [Zod Docs](https://zod.dev/)
- [Orval Docs](https://orval.dev/)
- `frontend/USAGE_GUIDE.md` - Esempi specifici del progetto

## ✨ Vantaggi della Nuova Architettura

- ✅ **Type safety completa** - Errori rilevati a compile-time
- ✅ **Validazione runtime** - Zod protegge da dati invalidi
- ✅ **Cache automatica** - React Query gestisce tutto
- ✅ **Meno codice** - Hooks auto-generati
- ✅ **Sincronizzazione BE/FE** - Un solo schema (Pydantic)
- ✅ **Migliore DX** - Auto-completion, DevTools
- ✅ **Performance** - Deduplication, caching, background refetch
