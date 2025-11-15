# Guida all'Utilizzo - Orval + Zod + React Query

## Setup Iniziale

### 1. Avvolgere l'App con QueryProvider

```tsx
// src/main.tsx o src/App.tsx
import { QueryProvider } from './providers/QueryProvider';

function App() {
  return (
    <QueryProvider>
      {/* Your app components */}
    </QueryProvider>
  );
}
```

## Utilizzo degli Hooks

### Esempio 1: Lista Account (useQuery)

```tsx
// src/pages/AccountsPage.tsx
import { useListAccountsApiV1AccountsGet } from '@/api/generated/accounts/accounts';

function AccountsPage() {
  const { data, isLoading, error, refetch } = useListAccountsApiV1AccountsGet();

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  if (error) {
    return <div>Errore: {error.message}</div>;
  }

  return (
    <div>
      <h1>I miei Account ({data?.total})</h1>
      <button onClick={() => refetch()}>Aggiorna</button>
      <ul>
        {data?.accounts.map((account) => (
          <li key={account.id}>
            {account.name} - {account.current_balance} {account.currency}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Esempio 2: Creare Account (useMutation)

```tsx
// src/components/CreateAccountForm.tsx
import { useCreateAccountApiV1AccountsPost } from '@/api/generated/accounts/accounts';
import { queryClient } from '@/providers/QueryProvider';
import { getListAccountsApiV1AccountsGetQueryKey } from '@/api/generated/accounts/accounts';

function CreateAccountForm() {
  const createAccount = useCreateAccountApiV1AccountsPost({
    mutation: {
      onSuccess: () => {
        // Invalida la cache degli account per ricaricarli
        queryClient.invalidateQueries({
          queryKey: getListAccountsApiV1AccountsGetQueryKey(),
        });
        alert('Account creato!');
      },
      onError: (error) => {
        console.error('Errore creazione account:', error);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createAccount.mutate({
      data: {
        name: formData.get('name') as string,
        currency: formData.get('currency') as string,
        initial_balance: formData.get('balance') as string,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Nome account" required />
      <input name="currency" placeholder="EUR" defaultValue="EUR" />
      <input name="balance" type="number" placeholder="0.00" />
      <button type="submit" disabled={createAccount.isPending}>
        {createAccount.isPending ? 'Creazione...' : 'Crea Account'}
      </button>
    </form>
  );
}
```

## Validazione con Zod

### Esempio 3: Validazione Form con React Hook Form + Zod

```tsx
// src/components/CreateAccountFormValidated.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountApiV1AccountsPostBody } from '@/api/generated/zod';
import { useCreateAccountApiV1AccountsPost } from '@/api/generated/accounts/accounts';
import { z } from 'zod';

// Lo schema Zod è già generato da Orval!
type AccountFormData = z.infer<typeof createAccountApiV1AccountsPostBody>;

function CreateAccountFormValidated() {
  const createAccount = useCreateAccountApiV1AccountsPost();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AccountFormData>({
    resolver: zodResolver(createAccountApiV1AccountsPostBody),
    defaultValues: {
      currency: 'EUR',
      initial_balance: '0.00',
    },
  });

  const onSubmit = (data: AccountFormData) => {
    createAccount.mutate(
      { data },
      {
        onSuccess: () => {
          reset();
          alert('Account creato con successo!');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Nome Account</label>
        <input {...register('name')} />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>

      <div>
        <label>Valuta (ISO 4217)</label>
        <input {...register('currency')} maxLength={3} />
        {errors.currency && (
          <span className="error">{errors.currency.message}</span>
        )}
      </div>

      <div>
        <label>Saldo Iniziale</label>
        <input {...register('initial_balance')} type="number" step="0.01" />
        {errors.initial_balance && (
          <span className="error">{errors.initial_balance.message}</span>
        )}
      </div>

      <button type="submit" disabled={createAccount.isPending}>
        {createAccount.isPending ? 'Creazione...' : 'Crea Account'}
      </button>

      {createAccount.error && (
        <div className="error">
          Errore: {createAccount.error.message}
        </div>
      )}
    </form>
  );
}
```

### Esempio 4: Validazione Runtime di Dati Esterni

```tsx
// src/utils/validation.ts
import { listAccountsApiV1AccountsGetResponse } from '@/api/generated/zod';

/**
 * Valida dati da fonte esterna (es. localStorage, API esterna)
 */
function validateAccountsData(data: unknown) {
  const result = listAccountsApiV1AccountsGetResponse.safeParse(data);

  if (!result.success) {
    console.error('Validazione fallita:', result.error.errors);
    return null;
  }

  return result.data; // Type-safe!
}

// Uso
const cachedData = JSON.parse(localStorage.getItem('accounts') || '{}');
const validatedData = validateAccountsData(cachedData);

if (validatedData) {
  console.log('Accounts:', validatedData.accounts);
} else {
  console.log('Dati non validi, ricarico dal server');
}
```

### Esempio 5: Login con Validazione

```tsx
// src/pages/LoginPage.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginApiV1AuthLoginPostBody } from '@/api/generated/zod';
import { useLoginApiV1AuthLoginPost } from '@/api/generated/authentication/authentication';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

type LoginFormData = z.infer<typeof loginApiV1AuthLoginPostBody>;

function LoginPage() {
  const navigate = useNavigate();
  const login = useLoginApiV1AuthLoginPost();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginApiV1AuthLoginPostBody),
  });

  const onSubmit = (data: LoginFormData) => {
    login.mutate(
      { data },
      {
        onSuccess: (response) => {
          // Salva il token
          localStorage.setItem('token', response.access_token);
          navigate('/dashboard');
        },
        onError: (error) => {
          alert('Login fallito: ' + error.message);
        },
      }
    );
  };

  return (
    <div className="login-page">
      <h1>Login</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Email</label>
          <input {...register('email')} type="email" />
          {errors.email && <span>{errors.email.message}</span>}
        </div>

        <div>
          <label>Password</label>
          <input {...register('password')} type="password" />
          {errors.password && <span>{errors.password.message}</span>}
        </div>

        <button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Login...' : 'Accedi'}
        </button>
      </form>
    </div>
  );
}
```

## Optimistic Updates

### Esempio 6: Update Account con Optimistic Update

```tsx
// src/components/UpdateAccountForm.tsx
import { useUpdateAccountApiV1AccountsAccountIdPatch } from '@/api/generated/accounts/accounts';
import { queryClient } from '@/providers/QueryProvider';
import { getListAccountsApiV1AccountsGetQueryKey } from '@/api/generated/accounts/accounts';
import type { AccountList } from '@/api/generated/models';

function UpdateAccountButton({ accountId, newName }: { accountId: number; newName: string }) {
  const updateAccount = useUpdateAccountApiV1AccountsAccountIdPatch({
    mutation: {
      // Optimistic update
      onMutate: async (variables) => {
        const queryKey = getListAccountsApiV1AccountsGetQueryKey();

        // Cancella query in corso
        await queryClient.cancelQueries({ queryKey });

        // Salva valore precedente
        const previousAccounts = queryClient.getQueryData<AccountList>(queryKey);

        // Aggiorna ottimisticamente
        if (previousAccounts) {
          queryClient.setQueryData<AccountList>(queryKey, {
            ...previousAccounts,
            accounts: previousAccounts.accounts.map((acc) =>
              acc.id === accountId ? { ...acc, name: newName } : acc
            ),
          });
        }

        return { previousAccounts };
      },

      // Rollback in caso di errore
      onError: (err, variables, context) => {
        if (context?.previousAccounts) {
          queryClient.setQueryData(
            getListAccountsApiV1AccountsGetQueryKey(),
            context.previousAccounts
          );
        }
      },

      // Ricarica sempre alla fine
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: getListAccountsApiV1AccountsGetQueryKey(),
        });
      },
    },
  });

  const handleUpdate = () => {
    updateAccount.mutate({
      accountId,
      data: { name: newName },
    });
  };

  return (
    <button onClick={handleUpdate} disabled={updateAccount.isPending}>
      Aggiorna Nome
    </button>
  );
}
```

## Type Safety End-to-End

### Esempio 7: Inferenza Automatica dei Tipi

```tsx
// I tipi sono inferiti automaticamente!
import { useListAccountsApiV1AccountsGet } from '@/api/generated/accounts/accounts';

function AccountsTable() {
  const { data } = useListAccountsApiV1AccountsGet();

  // ✅ TypeScript conosce esattamente la struttura di 'data'
  // data.accounts[0].name ✅
  // data.accounts[0].invalidField ❌ Type error!

  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Saldo</th>
          <th>Valuta</th>
        </tr>
      </thead>
      <tbody>
        {data?.accounts.map((account) => (
          <tr key={account.id}>
            <td>{account.name}</td>
            <td>{account.current_balance}</td>
            <td>{account.currency}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Gestione Errori Centralizzata

### Esempio 8: Error Boundary e Query Error Reset

```tsx
// src/components/QueryErrorBoundary.tsx
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="error-boundary">
          <h2>Qualcosa è andato storto</h2>
          <pre>{error.message}</pre>
          <button onClick={resetErrorBoundary}>Riprova</button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Testing

### Esempio 9: Test con Mock di React Query

```tsx
// src/components/__tests__/AccountsPage.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { AccountsPage } from '../AccountsPage';

describe('AccountsPage', () => {
  it('should display accounts', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AccountsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/i miei account/i)).toBeInTheDocument();
  });
});
```

## Best Practices

### ✅ DO

- Usa `invalidateQueries` dopo mutazioni per ricaricare i dati
- Usa `optimistic updates` per UX migliore
- Usa Zod resolver per validazione form
- Mantieni `staleTime` e `gcTime` appropriati
- Usa React Query DevTools in sviluppo

### ❌ DON'T

- Non modificare file in `src/api/generated/` (sono auto-generati)
- Non fare fetch manualmente con axios quando hai hook React Query
- Non duplicare schemi Zod (usa quelli generati)
- Non dimenticare di invalidare le query dopo mutazioni

## Workflow di Sviluppo

1. **Modifica schema Pydantic nel backend**
   ```python
   # backend/app/schemas/account.py
   class AccountCreate(BaseModel):
       name: str = Field(..., max_length=100)
       new_field: str  # Nuovo campo
   ```

2. **Rigenera OpenAPI**
   ```bash
   npm run generate:openapi
   ```

3. **Rigenera client frontend**
   ```bash
   npm run generate:api
   ```

4. **TypeScript ti avviserà degli errori**
   ```tsx
   // Errore: manca 'new_field'
   createAccount.mutate({
     data: { name: "Test" }  // ❌ Type error!
   });
   ```

5. **Aggiungi il campo**
   ```tsx
   // ✅ OK
   createAccount.mutate({
     data: {
       name: "Test",
       new_field: "value"
     }
   });
   ```

## Comandi Utili

```bash
# Genera tutto (OpenAPI + Client)
npm run generate:full

# Solo client frontend (usa openapi.json esistente)
npm run generate:api

# Solo OpenAPI dal backend
npm run generate:openapi

# Dev con auto-generazione
npm run dev

# Build con auto-generazione
npm run build
```

## Troubleshooting

### Errore: "Module not found: @/api/generated/..."

Assicurati di aver eseguito `npm run generate:api` prima di avviare l'app.

### Errore: "Cannot find module 'zod'"

Installa zod: `npm install zod`

### Warning: "import.meta is not available"

È normale durante la generazione con Orval. Non influisce sul funzionamento.

### Tipi non aggiornati dopo modifica backend

Esegui `npm run generate:full` per rigenerare tutto.
