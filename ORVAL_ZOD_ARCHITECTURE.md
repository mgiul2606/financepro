# Architettura Orval + Zod - FinancePro

## Single Source of Truth (SSoT)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PYDANTIC MODELS (Backend)                     │
│                  Single Source of Truth (SSoT)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  FastAPI       │
                  │  Auto-generates│
                  │  OpenAPI 3.1   │
                  └────────┬───────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  openapi.json          │
              │  (API Specification)   │
              └───────────┬────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │     ORVAL     │
                  │   Generator   │
                  └───────┬───────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
   ┌─────────┐    ┌──────────────┐  ┌──────────┐
   │TypeScript│    │ Zod Schemas  │  │  React   │
   │  Types   │    │ (Runtime Val)│  │  Query   │
   └─────────┘    └──────────────┘  └──────────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   Frontend (React)     │
              │   - Type Safety        │
              │   - Runtime Validation │
              │   - Auto API Client    │
              └────────────────────────┘
```

## Pipeline di Generazione

### 1. Backend → OpenAPI
```bash
# Script automatico che genera openapi.json
python backend/scripts/generate_openapi.py
```

**Output**: `backend/openapi.json`

### 2. OpenAPI → Frontend Assets (Orval)
```bash
# Orval genera tutto in una volta
npm run generate:api
```

**Output**:
- `frontend/src/api/generated/schemas.ts` - Tipi TypeScript
- `frontend/src/api/generated/zod.ts` - Schemi Zod per validazione runtime
- `frontend/src/api/generated/api.ts` - Client API con React Query hooks
- `frontend/src/api/generated/models.ts` - Modelli TypeScript

## Struttura Directory

```
financepro/
├── backend/
│   ├── app/
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas (SSoT)
│   │   ├── routes/         # FastAPI routes
│   │   └── main.py         # OpenAPI configuration
│   ├── scripts/
│   │   └── generate_openapi.py  # Script generazione OpenAPI
│   └── openapi.json        # Generated OpenAPI spec
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── generated/  # Output Orval (auto-generated)
│   │   │   │   ├── api.ts          # React Query hooks
│   │   │   │   ├── schemas.ts      # TypeScript types
│   │   │   │   ├── zod.ts          # Zod schemas
│   │   │   │   └── models.ts       # TypeScript models
│   │   │   └── client.ts   # Axios instance configurato
│   │   ├── services/       # Business logic (usa generated)
│   │   └── components/     # React components
│   ├── orval.config.ts     # Configurazione Orval
│   └── package.json
│
└── scripts/
    └── generate-all.sh     # Script completo di generazione
```

## Configurazione Orval

### orval.config.ts
```typescript
import { defineConfig } from 'orval';

export default defineConfig({
  financepro: {
    input: {
      target: '../backend/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/api.ts',
      schemas: './src/api/generated/models',
      client: 'react-query',
      mock: false,
      clean: true,
      prettier: true,
      override: {
        mutator: {
          path: './src/api/client.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
  'financepro-zod': {
    input: {
      target: '../backend/openapi.json',
    },
    output: {
      mode: 'single',
      target: './src/api/generated/zod.ts',
      client: 'zod',
      clean: true,
      prettier: true,
    },
  },
});
```

## Script di Generazione

### backend/scripts/generate_openapi.py
```python
"""Generate OpenAPI specification from FastAPI app."""
import json
from pathlib import Path
from app.main import app

def generate_openapi():
    """Generate OpenAPI JSON file."""
    openapi_schema = app.openapi()

    output_path = Path(__file__).parent.parent / "openapi.json"

    with open(output_path, "w") as f:
        json.dump(openapi_schema, f, indent=2)

    print(f"✓ OpenAPI schema generated: {output_path}")

if __name__ == "__main__":
    generate_openapi()
```

### scripts/generate-all.sh
```bash
#!/bin/bash
set -e

echo "🔄 Generating API artifacts..."

# 1. Generate OpenAPI from backend
echo "📝 Step 1: Generating OpenAPI spec from FastAPI..."
cd backend
python scripts/generate_openapi.py

# 2. Generate TypeScript + Zod from OpenAPI
echo "⚡ Step 2: Generating TypeScript, Zod, and React Query client..."
cd ../frontend
npm run generate:api

echo "✅ All API artifacts generated successfully!"
```

## Integrazione nel Workflow

### package.json (frontend)
```json
{
  "scripts": {
    "dev": "npm run generate:api && vite",
    "generate:api": "orval --config orval.config.ts",
    "generate:full": "../scripts/generate-all.sh",
    "prebuild": "npm run generate:api",
    "build": "tsc && vite build",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "orval": "^7.3.0",
    "@tanstack/react-query": "^5.62.11",
    "zod": "^3.24.1"
  }
}
```

### Pre-commit Hook (.husky/pre-commit)
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Regenerate API if backend schemas changed
if git diff --cached --name-only | grep -q "backend/app/schemas"; then
  echo "🔄 Backend schemas changed, regenerating API..."
  npm run --prefix frontend generate:full
  git add frontend/src/api/generated
fi
```

## Utilizzo nel Frontend

### Con React Query (Auto-generated)
```typescript
import { useGetAccountsAccountsGet } from '@/api/generated/api';
import { accountCreateSchema } from '@/api/generated/zod';

function AccountsPage() {
  // Hook auto-generato con tipi completi
  const { data: accounts, isLoading } = useGetAccountsAccountsGet();

  // Validazione runtime con Zod
  const handleSubmit = (formData: unknown) => {
    const result = accountCreateSchema.safeParse(formData);
    if (!result.success) {
      console.error('Validation error:', result.error);
      return;
    }
    // formData è ora type-safe e validato
    createAccount(result.data);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {accounts?.map(account => (
        <div key={account.id}>{account.name}</div>
      ))}
    </div>
  );
}
```

### Validazione Form con Zod
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountCreateSchema } from '@/api/generated/zod';

function CreateAccountForm() {
  const form = useForm({
    resolver: zodResolver(accountCreateSchema),
  });

  // Auto-completamento + validazione runtime
  const onSubmit = form.handleSubmit((data) => {
    // data è validato e type-safe
    createAccountMutation.mutate(data);
  });

  return <form onSubmit={onSubmit}>...</form>;
}
```

## Vantaggi dell'Architettura

### ✅ Single Source of Truth
- **Pydantic** definisce tutti gli schemi
- Nessuna duplicazione manuale
- Un cambio nel backend si propaga automaticamente al frontend

### ✅ Type Safety End-to-End
- Compile-time: TypeScript rileva errori
- Runtime: Zod valida dati esterni
- Auto-completion in IDE

### ✅ Automazione Completa
- `npm run dev` → genera tutto automaticamente
- Pre-commit hooks → mantiene sincronizzazione
- Zero intervento manuale

### ✅ Validazione Robusta
- Backend: Pydantic valida request/response
- Frontend: Zod valida input utente e API responses
- Schema allineati garantiti

### ✅ React Query Integration
- Hooks auto-generati per ogni endpoint
- Cache management automatico
- Optimistic updates support
- Error handling consistente

## Versioning API

### Backend Versioning
```python
# app/routes/v1/__init__.py
router = APIRouter(prefix="/api/v1")

# app/routes/v2/__init__.py
router = APIRouter(prefix="/api/v2")
```

### Frontend Multi-Version Support
```typescript
// orval.config.ts
export default defineConfig({
  'financepro-v1': {
    input: { target: '../backend/openapi-v1.json' },
    output: { target: './src/api/v1/generated/api.ts' },
  },
  'financepro-v2': {
    input: { target: '../backend/openapi-v2.json' },
    output: { target: './src/api/v2/generated/api.ts' },
  },
});
```

## Testing Strategy

### Backend Testing
```python
# pytest con Pydantic validation
def test_account_schema_validation():
    valid_data = {"name": "Savings", "balance": 1000.0}
    account = AccountCreate(**valid_data)
    assert account.name == "Savings"

    invalid_data = {"name": "", "balance": "invalid"}
    with pytest.raises(ValidationError):
        AccountCreate(**invalid_data)
```

### Frontend Testing
```typescript
// Vitest con Zod validation
import { accountCreateSchema } from '@/api/generated/zod';

describe('Account validation', () => {
  it('should validate correct account data', () => {
    const result = accountCreateSchema.safeParse({
      name: 'Savings',
      balance: 1000,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid account data', () => {
    const result = accountCreateSchema.safeParse({
      name: '',
      balance: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});
```

## Manutenzione

### Workflow Quotidiano
1. Modifichi schema Pydantic nel backend
2. Esegui `npm run dev` nel frontend
3. Orval rigenera automaticamente tutto
4. TypeScript + Zod si aggiornano
5. Errori di tipo vengono segnalati immediatamente

### Breaking Changes
1. Backend: usa versioning API (`/api/v2`)
2. Frontend: mantieni entrambe le versioni generate
3. Migrazione graduale dei componenti
4. Depreca vecchia versione

### Monitoraggio
```bash
# Check se generazione è aggiornata
npm run generate:api -- --dry-run

# Verifica differenze
git diff frontend/src/api/generated
```

## Migrazione da openapi-typescript

### Passi
1. ✅ Installa Orval + dipendenze
2. ✅ Crea `orval.config.ts`
3. ✅ Genera nuovi file con Orval
4. ✅ Aggiorna import nei servizi
5. ✅ Sostituisci `BaseCrudService` con React Query hooks
6. ✅ Rimuovi `openapi-typescript` e vecchi tipi
7. ✅ Aggiorna script in `package.json`
8. ✅ Testa funzionalità esistenti

### Compatibilità
- Vecchio: `import { components } from '@/types/generated/api'`
- Nuovo: `import { Account } from '@/api/generated/models'`
- React Query hooks sostituiscono chiamate Axios manuali

## Performance

### Generazione
- OpenAPI: ~1-2s (FastAPI)
- Orval: ~3-5s (TypeScript + Zod + React Query)
- Totale: ~5-7s (eseguito solo quando necessario)

### Bundle Size
- Orval client: ~15kb (gzipped)
- Zod schemas: ~5kb per 20 schemi
- React Query: già incluso

### Caching
- React Query gestisce cache automaticamente
- Invalidazione granulare per mutation
- Optimistic updates per UX migliore

## Conclusione

Questa architettura garantisce:
- **Zero duplicazione**: Pydantic è l'unica fonte
- **Type safety totale**: Compile-time + Runtime
- **Automazione completa**: Da dev a production
- **Manutenibilità**: Modifiche propagate automaticamente
- **Scalabilità**: Supporta versioning e crescita del team
