# FinancePro - Architettura Orval + Zod

## 🎯 Overview

Questo progetto implementa un'architettura **Single Source of Truth** dove gli schemi Pydantic del backend generano automaticamente:

- ✅ **TypeScript Types** - Type safety completa nel frontend
- ✅ **Zod Schemas** - Validazione runtime nel frontend
- ✅ **React Query Hooks** - Client API auto-generato con cache management
- ✅ **Sincronizzazione automatica** - Backend e frontend sempre allineati

## 🏗️ Architettura

```
Pydantic (Backend) → FastAPI → OpenAPI 3.1 → Orval → TypeScript + Zod + React Query
```

### Stack Tecnologico

**Backend:**
- FastAPI 0.115.6
- Pydantic 2.10.4 (Single Source of Truth)
- PostgreSQL + SQLAlchemy 2.0.36

**Frontend:**
- React 19.1.1 + TypeScript 5.9.3
- Vite 7.1.7
- **Orval 8.0.0** - Generatore API client
- **React Query 5.90** - State management e cache
- **Zod 4.1** - Validazione runtime

## 🚀 Quick Start

### 1. Setup Iniziale

```bash
# Backend - Crea virtual environment e installa dipendenze
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend - Installa dipendenze
cd ../frontend
npm install
```

### 2. Genera API Client

```bash
# Genera tutto (OpenAPI + TypeScript + Zod + React Query)
npm run generate:full

# O in passi separati:
npm run generate:openapi  # Solo backend → OpenAPI
npm run generate:api      # Solo frontend (usa openapi.json esistente)
```

### 3. Sviluppo

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Frontend (in un altro terminale)
cd frontend
npm run dev
```

## 📁 Struttura File Generati

```
backend/
├── openapi.json                    # ← Generato da FastAPI
└── scripts/
    └── generate_openapi.py         # Script generazione OpenAPI

frontend/
├── src/
│   ├── api/
│   │   ├── generated/              # ← Generato da Orval (NON MODIFICARE!)
│   │   │   ├── accounts/
│   │   │   │   └── accounts.ts     # Hooks React Query per account
│   │   │   ├── authentication/
│   │   │   │   └── authentication.ts
│   │   │   ├── categories/
│   │   │   ├── health/
│   │   │   ├── models/             # TypeScript types
│   │   │   └── zod.ts              # Zod validation schemas
│   │   └── client.ts               # Axios instance configurata
│   └── providers/
│       └── QueryProvider.tsx       # React Query provider
├── orval.config.ts                 # Configurazione Orval
└── USAGE_GUIDE.md                  # Esempi di utilizzo
```

## 💻 Utilizzo

### Esempio 1: Query (GET)

```tsx
import { useListAccountsApiV1AccountsGet } from '@/api/generated/accounts/accounts';

function AccountsPage() {
  const { data, isLoading, error } = useListAccountsApiV1AccountsGet();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.accounts.map(account => (
        <li key={account.id}>{account.name}</li>
      ))}
    </ul>
  );
}
```

### Esempio 2: Mutation (POST)

```tsx
import { useCreateAccountApiV1AccountsPost } from '@/api/generated/accounts/accounts';

function CreateAccountForm() {
  const createAccount = useCreateAccountApiV1AccountsPost();

  const handleSubmit = (e) => {
    e.preventDefault();
    createAccount.mutate({
      data: {
        name: "Savings",
        currency: "EUR",
        initial_balance: "1000.00"
      }
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Esempio 3: Validazione con Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountApiV1AccountsPostBody } from '@/api/generated/zod';

function ValidatedForm() {
  const form = useForm({
    resolver: zodResolver(createAccountApiV1AccountsPostBody)
  });

  // Validazione automatica + type safety!
}
```

Vedi `frontend/USAGE_GUIDE.md` per esempi completi.

## 🔄 Workflow di Sviluppo

### Scenario: Aggiungere un nuovo campo

1. **Modifica schema Pydantic** (Backend)

```python
# backend/app/schemas/account.py
class AccountCreate(BaseModel):
    name: str
    description: str  # ← NUOVO CAMPO
```

2. **Rigenera tutto**

```bash
cd frontend
npm run generate:full
```

3. **TypeScript segnala gli errori**

```tsx
// ❌ TypeScript Error: manca 'description'
createAccount.mutate({
  data: { name: "Test" }
});

// ✅ OK
createAccount.mutate({
  data: {
    name: "Test",
    description: "My savings account"
  }
});
```

### Automazione

Gli script npm gestiscono la generazione automaticamente:

```json
{
  "scripts": {
    "predev": "npm run generate:api",      // ← Auto-genera prima di dev
    "prebuild": "npm run generate:api",    // ← Auto-genera prima di build
    "generate:full": "npm run generate:openapi && npm run generate:api"
  }
}
```

## 🛠️ Comandi Disponibili

### Frontend

```bash
npm run dev              # Avvia dev server (auto-genera API)
npm run build            # Build production (auto-genera API)
npm run generate:api     # Genera client da openapi.json esistente
npm run generate:openapi # Genera openapi.json dal backend
npm run generate:full    # Genera tutto (OpenAPI + Client)
npm run type-check       # Verifica tipi TypeScript
```

### Backend

```bash
# Genera OpenAPI
python scripts/generate_openapi.py

# Avvia server
uvicorn app.main:app --reload
```

### Script Completo

```bash
# Dalla root del progetto
./scripts/generate-all.sh
```

Questo script:
1. ✅ Genera OpenAPI dal backend
2. ✅ Genera TypeScript + Zod + React Query
3. ✅ Verifica i file generati
4. ✅ Mostra statistiche

## 🎨 Features Chiave

### 1. Type Safety End-to-End

```tsx
// I tipi sono inferiti automaticamente dal backend!
const { data } = useListAccountsApiV1AccountsGet();

data.accounts[0].name        // ✅ Type: string
data.accounts[0].invalidField // ❌ TypeScript Error!
```

### 2. Validazione Runtime con Zod

```tsx
import { accountCreateSchema } from '@/api/generated/zod';

const result = accountCreateSchema.safeParse(userInput);
if (result.success) {
  // Dati validati e type-safe
  createAccount(result.data);
}
```

### 3. React Query Integration

- ✅ Cache automatica
- ✅ Refetch intelligente
- ✅ Optimistic updates
- ✅ Deduplicate requests
- ✅ DevTools integration

### 4. Zero Duplicazione

- Un solo schema Pydantic definisce tutto
- Nessun codice duplicato tra BE e FE
- Modifiche propagate automaticamente

## 📚 Documentazione

- **Architecture**: `ORVAL_ZOD_ARCHITECTURE.md` - Architettura completa
- **Usage Guide**: `frontend/USAGE_GUIDE.md` - Esempi pratici
- **API Docs**: `http://localhost:8000/docs` - Swagger UI

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

test('accounts page', () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <AccountsPage />
    </QueryClientProvider>
  );
});
```

## 🐛 Troubleshooting

### Problema: "Module not found: @/api/generated"

**Soluzione**: Esegui `npm run generate:api`

### Problema: Tipi non aggiornati dopo modifica backend

**Soluzione**: Esegui `npm run generate:full`

### Problema: "Cannot find module 'zod'"

**Soluzione**: `npm install` (già nelle dipendenze)

### Problema: Warning "import.meta is not available"

**Soluzione**: Ignoralo, è normale durante la generazione Orval. Non influisce sul funzionamento.

## 🔐 Best Practices

### ✅ DO

- Usa sempre gli hook auto-generati invece di fetch manuali
- Usa Zod schemas per validazione form
- Invalida query dopo mutazioni
- Usa optimistic updates per UX migliore

### ❌ DON'T

- **NON modificare** file in `src/api/generated/` (vengono sovrascritti)
- **NON duplicare** schemi Zod o tipi (usa quelli generati)
- **NON dimenticare** di invalidare query dopo mutations

## 📦 Versioning API

Per supportare multiple versioni:

```typescript
// orval.config.ts
export default defineConfig({
  'api-v1': {
    input: { target: '../backend/openapi-v1.json' },
    output: { target: './src/api/v1/generated' }
  },
  'api-v2': {
    input: { target: '../backend/openapi-v2.json' },
    output: { target: './src/api/v2/generated' }
  }
});
```

## 🚀 Production

### Build

```bash
# Frontend
cd frontend
npm run build  # Auto-genera API prima del build

# Backend
cd backend
# Deploy with gunicorn, uvicorn, etc.
```

### CI/CD

```yaml
# .github/workflows/ci.yml
- name: Generate API
  run: |
    cd frontend
    npm run generate:full
    npm run build
```

## 🤝 Contribuire

1. Modifica gli schemi Pydantic nel backend
2. Esegui `npm run generate:full`
3. Verifica che i tipi TypeScript siano corretti
4. Testa le modifiche
5. Commit e push

## 📄 License

MIT

## 🙏 Credits

- **Orval** - API client generator
- **React Query** - Powerful data synchronization
- **Zod** - TypeScript-first schema validation
- **FastAPI** - High performance Python web framework
- **Pydantic** - Data validation using Python type annotations
