# Scripts di Post-Processing Orval

Questa cartella contiene script di utilità per il post-processing dei file generati da Orval.

## post-generate-orval.ts

### Scopo

Questo script modifica automaticamente le interfacce TypeScript generate da Orval per farle estendere `EntityWithId` quando hanno un campo `id: string`.

### Funzionamento

1. **Scansiona** tutti i file `*Response.ts` in `src/api/generated/models/`
2. **Controlla** se l'interfaccia ha un campo `id: string`
3. **Aggiunge** `extends EntityWithId` alla dichiarazione dell'interfaccia
4. **Importa** `EntityWithId` da `hooks/useCrudModal.ts`

### Esempio

**Prima della generazione:**
```typescript
export interface TransactionResponse {
  id: string;
  accountId: string;
  amount: string;
  // ... altri campi
}
```

**Dopo il post-processing:**
```typescript
import type { EntityWithId } from "../../../hooks/useCrudModal";

export interface TransactionResponse extends EntityWithId {
  id: string;
  accountId: string;
  amount: string;
  // ... altri campi
}
```

### Utilizzo

Lo script viene eseguito automaticamente dopo `orval` tramite il comando:

```bash
npm run generate:api
```

Che esegue internamente:
```bash
orval --config orval.config.ts && npm run generate:post-process
```

Per eseguirlo manualmente:
```bash
npm run generate:post-process
```

### Benefici

- **Type-safety**: Le interfacce Response possono essere usate con `useCrudModal` senza cast
- **Automatizzazione**: Non è necessario modificare manualmente i file generati
- **Consistency**: Tutte le Response con `id` implementano la stessa interfaccia base

### Interfacce Processate

Il post-processing viene applicato a tutte le interfacce `*Response` che hanno un campo `id`, tra cui:

- `AccountResponse`
- `TransactionResponse`
- `CategoryResponse`
- `BudgetResponse`
- `FinancialProfileResponse`
- `UserResponse`
- E altre...

### Note Tecniche

- Lo script usa `tsx` per eseguire TypeScript direttamente
- Preserva tutti i commenti e la formattazione esistente
- Salta interfacce che già estendono altre interfacce
- È idempotente: può essere eseguito più volte senza problemi
