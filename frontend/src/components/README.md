# FinancePro - Componenti UI Riutilizzabili

## 📦 Struttura

```
src/
├── components/
│   ├── ui/                    # Componenti UI riutilizzabili
│   │   ├── Modal.tsx          # Modal con gestione avanzata
│   │   ├── FormField.tsx      # Form fields con validazione
│   │   ├── Alert.tsx          # Sistema di alert multi-variante
│   │   ├── EntityCard.tsx     # Card per visualizzare entità
│   │   └── index.ts           # Export aggregato
│   └── showcase/              
│       └── ComponentsShowcase.tsx  # Demo di tutti i componenti
├── hooks/
│   ├── useConfirm.tsx         # Hook per dialog di conferma
│   ├── useCrud.ts            # Hook per operazioni CRUD
│   └── index.ts              # Export aggregato
└── utils/
    └── cn.ts                 # Utility per combinare classi CSS
```

## 🚀 Quick Start

### Installazione dipendenze

```bash
npm install clsx tailwind-merge
```

## 📚 Componenti

### 1. Modal

Componente modale con gestione avanzata di stati e interazioni.

#### Features:
- ✅ Diverse dimensioni (sm, md, lg, xl, full)
- ✅ Chiusura con ESC e backdrop click
- ✅ Prevenzione chiusura durante operazioni
- ✅ Footer componibile
- ✅ Gestione scroll body

#### Utilizzo:

```tsx
import { Modal, ModalFooter } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Titolo Modal"
  size="md"
  preventClose={loading}
  footer={
    <ModalFooter>
      <button>Cancel</button>
      <button>Confirm</button>
    </ModalFooter>
  }
>
  {/* Contenuto */}
</Modal>
```

### 2. FormField

Sistema di form field con validazione avanzata integrata.

#### Features:
- ✅ Validazione real-time
- ✅ Multiple regole di validazione
- ✅ Supporto icone
- ✅ Toggle password visibility
- ✅ Hints e messaggi di errore
- ✅ Indicatori visivi di validazione

#### Tipi di Field:
- `FormField` - Input standard (text, email, password, number, etc.)
- `TextareaField` - Textarea con auto-resize
- `SelectField` - Select con opzioni

#### Validazione:

```tsx
import { FormField } from '@/components/ui';

<FormField
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  validation={{
    required: { value: true, message: 'Email richiesta' },
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Email non valida'
    },
    custom: [{
      validate: (value) => !forbiddenEmails.includes(value),
      message: 'Email non consentita'
    }]
  }}
  showValidation
  onValidationChange={(isValid, errors) => {
    console.log('Validation:', isValid, errors);
  }}
/>
```

### 3. Alert

Sistema completo di notifiche con diverse varianti.

#### Varianti:
- `Alert` - Alert standard
- `BannerAlert` - Banner full-width
- `ToastAlert` - Notifiche toast
- `InlineAlert` - Alert inline per form

#### Features:
- ✅ 5 varianti di stile (info, success, warning, error, default)
- ✅ Auto-close con timer
- ✅ Action buttons
- ✅ Icone personalizzabili
- ✅ Animazioni di entrata/uscita

#### Utilizzo:

```tsx
import { Alert, ToastAlert, BannerAlert } from '@/components/ui';

// Alert standard
<Alert
  variant="success"
  title="Operazione completata"
  closable
  action={{
    label: 'Dettagli',
    onClick: handleDetails
  }}
>
  Il tuo account è stato creato con successo
</Alert>

// Toast notification
<ToastAlert
  variant="error"
  position="top-right"
  autoClose={5000}
>
  Errore durante il salvataggio
</ToastAlert>
```

### 4. EntityCard

Card componibile per visualizzare entità con azioni.

#### Features:
- ✅ Layout flessibile (default, compact, detailed)
- ✅ Metadata strutturati
- ✅ Azioni integrate (edit, delete, custom)
- ✅ Status badge e indicatori
- ✅ Menu dropdown per azioni multiple
- ✅ Grid e List container

#### Utilizzo:

```tsx
import { EntityCard, EntityCardGrid } from '@/components/ui';

<EntityCardGrid columns={3}>
  {accounts.map(account => (
    <EntityCard
      key={account.id}
      title={account.name}
      subtitle={account.type}
      headerIcon={<Wallet />}
      status={{
        label: account.status,
        variant: 'success'
      }}
      badge={{
        label: 'Premium',
        variant: 'primary'
      }}
      metadata={[
        {
          label: 'Balance',
          value: `€${account.balance}`,
          highlight: true
        },
        {
          label: 'Last Update',
          value: formatDate(account.updatedAt)
        }
      ]}
      actions={{
        onEdit: () => handleEdit(account),
        onDelete: () => handleDelete(account),
        customActions: [
          {
            label: 'Duplicate',
            icon: <Copy />,
            onClick: () => handleDuplicate(account)
          }
        ],
        showMoreMenu: true
      }}
    />
  ))}
</EntityCardGrid>
```

## 🎣 Hooks

### useConfirm

Hook per gestire dialog di conferma con Provider pattern.

#### Setup:

```tsx
// Wrap app con ConfirmProvider
import { ConfirmProvider } from '@/hooks';

<ConfirmProvider>
  <App />
</ConfirmProvider>
```

#### Utilizzo:

```tsx
import { useConfirm, useDeleteConfirm } from '@/hooks';

const MyComponent = () => {
  const confirm = useConfirm();
  const deleteConfirm = useDeleteConfirm();
  
  const handleAction = async () => {
    const confirmed = await confirm({
      title: 'Conferma Azione',
      message: 'Sei sicuro di voler procedere?',
      confirmText: 'Sì, procedi',
      variant: 'warning'
    });
    
    if (confirmed) {
      // Esegui azione
    }
  };
  
  const handleDelete = async (item) => {
    const confirmed = await deleteConfirm(item.name);
    if (confirmed) {
      await deleteItem(item.id);
    }
  };
};
```

### useCrud

Hook completo per gestire operazioni CRUD con stato.

#### Features:
- ✅ Gestione stato completa (loading, error, items)
- ✅ Operazioni CRUD integrate
- ✅ Pagination support
- ✅ Optimistic updates
- ✅ Error handling
- ✅ Success/Error callbacks

#### Utilizzo:

```tsx
import { useCrud } from '@/hooks';

const MyComponent = () => {
  const [state, actions] = useCrud<Account>({
    service: accountService,
    autoLoad: true,
    onSuccess: {
      create: (item) => showToast('Created!'),
      update: (item) => showToast('Updated!'),
      delete: () => showToast('Deleted!')
    },
    onError: {
      create: (error) => showError(error)
    },
    pagination: {
      enabled: true,
      pageSize: 10
    }
  });
  
  const { items, loading, error, creating } = state;
  
  // Operazioni
  await actions.create({ name: 'New Account' });
  await actions.update(id, { name: 'Updated' });
  await actions.delete(id);
  await actions.load({ filter: 'active' });
};
```

#### Optimistic Updates:

```tsx
import { useOptimisticCrud } from '@/hooks';

// Aggiorna UI immediatamente, rollback su errore
const [state, actions] = useOptimisticCrud({
  service: accountService
});
```

## 🎨 Utilities

### cn - Class Names Merger

Utility per combinare classi Tailwind CSS con gestione conflitti.

```tsx
import { cn } from '@/utils/cn';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  isPrimary ? 'primary-class' : 'secondary-class',
  className // props override
)} />
```

## 📝 Best Practices

### 1. Validazione Form

```tsx
const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Check validazione
  const hasErrors = Object.values(fieldErrors).some(errors => errors.length > 0);
  if (hasErrors) {
    showError('Correggi gli errori prima di procedere');
    return;
  }
  
  // Procedi con submit
};
```

### 2. Gestione Loading States

```tsx
const [state, actions] = useCrud({ ... });

// Disabilita UI durante operazioni
<button 
  disabled={state.creating || state.updating}
  onClick={handleAction}
>
  {state.creating ? 'Creating...' : 'Create'}
</button>
```

### 3. Error Handling

```tsx
try {
  await actions.create(data);
} catch (error) {
  // Error già gestito da hook
  // Opzionale: azioni aggiuntive
  console.error('Creation failed:', error);
}
```

### 4. Composizione Componenti

```tsx
// Crea componenti specifici riutilizzando quelli base
const AccountCard = ({ account, onEdit, onDelete }) => (
  <EntityCard
    title={account.name}
    variant="compact"
    headerIcon={<Wallet />}
    metadata={[
      { label: 'Balance', value: formatCurrency(account.balance) }
    ]}
    actions={{ onEdit, onDelete }}
  />
);
```

## 🔄 Migrazione

Per migrare i componenti esistenti:

1. **Sostituire Modal custom** → `Modal` component
2. **Form inputs** → `FormField` con validazione
3. **Alert/Errors** → `Alert` variants
4. **Confirm dialogs** → `useConfirm` hook
5. **CRUD logic** → `useCrud` hook
6. **Card layouts** → `EntityCard`

## 📦 Export Pattern

```tsx
// Import singoli componenti
import { Modal, FormField, Alert } from '@/components/ui';

// Import hooks
import { useConfirm, useCrud } from '@/hooks';

// Import con alias
import * as UI from '@/components/ui';
<UI.Modal />
```

## 🧪 Testing

Tutti i componenti sono testabili con:
- Props controllate
- Eventi simulabili
- Stati predicibili
- Mock services per CRUD

```tsx
// Test example
const mockService = {
  list: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({ id: 1 })
};

const { result } = renderHook(() => 
  useCrud({ service: mockService })
);

await act(async () => {
  await result.current[1].create({ name: 'Test' });
});

expect(mockService.create).toHaveBeenCalled();
```

## 🚀 Next Steps

1. Aggiungere animazioni con Framer Motion
2. Implementare temi dark/light
3. Creare Storybook per documentazione interattiva
4. Aggiungere test unitari con Jest/RTL
5. Implementare componenti data visualization (grafici)
