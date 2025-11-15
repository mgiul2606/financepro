# FinancePro - Componenti Riutilizzabili

## Struttura dei Componenti

La nuova architettura introduce componenti UI riutilizzabili e hook personalizzati per rendere il codice più manutenibile e consistente.

### 📁 Struttura delle cartelle

```
src/
├── components/
│   ├── ui/                    # Componenti UI riutilizzabili
│   │   ├── Modal.tsx          # Modali con gestione avanzata
│   │   ├── FormField.tsx      # Campi form con validazione
│   │   ├── EntityCard.tsx     # Card per entità
│   │   └── Alert.tsx          # Alert e notifiche
│   ├── CreateAccountModalV2.tsx
│   └── EditAccountModalV2.tsx
├── hooks/
│   ├── useConfirm.tsx         # Hook per dialoghi di conferma
│   └── useCrud.ts             # Hook per operazioni CRUD
├── utils/
│   └── cn.ts                  # Utility per classi CSS
└── pages/
    └── AccountsV2.tsx         # Pagina Accounts refactored
```

## 🎯 Componenti Principali

### 1. Modal Component

**Caratteristiche:**
- Gestione ESC e click backdrop
- Prevenzione chiusura durante operazioni
- Multiple dimensioni (sm, md, lg, xl, full)
- Footer personalizzabile
- Animazioni fluide

**Esempio di utilizzo:**

```tsx
import { Modal, ModalFooter } from './components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Account Details"
  size="md"
  preventClose={loading}
  footer={
    <ModalFooter>
      <button>Cancel</button>
      <button>Save</button>
    </ModalFooter>
  }
>
  {/* Content */}
</Modal>
```

### 2. FormField Components

**Caratteristiche:**
- Validazione integrata e real-time
- Supporto per diversi tipi di input
- Icone e hint
- Stati di errore/successo
- Password toggle

**Validazioni supportate:**
- required
- minLength / maxLength
- pattern (regex)
- min / max (numeri)
- custom validators

**Esempio:**

```tsx
import { FormField, SelectField, TextareaField } from './components/ui/FormField';

<FormField
  label="Email"
  type="email"
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  validation={{
    required: true,
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format'
    }
  }}
  showValidation
  icon={<Mail className="h-5 w-5" />}
/>

<SelectField
  label="Currency"
  value={currency}
  onChange={(e) => setCurrency(e.target.value)}
  options={[
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'USD', label: 'Dollar ($)' }
  ]}
/>
```

### 3. EntityCard Component

**Caratteristiche:**
- Layout flessibile per visualizzare entità
- Azioni integrate (edit, delete, custom)
- Status badges
- Metadata strutturati
- Grid e List layout

**Esempio:**

```tsx
import { EntityCard, EntityCardGrid } from './components/ui/EntityCard';

<EntityCardGrid columns={3}>
  <EntityCard
    title="Main Account"
    subtitle="EUR Account"
    headerIcon={<Wallet />}
    status={{ label: 'Active', variant: 'success' }}
    metadata={[
      { label: 'Balance', value: '€1,234.56', highlight: true },
      { label: 'Last Transaction', value: 'Today' }
    ]}
    actions={{
      onEdit: handleEdit,
      onDelete: handleDelete,
      customActions: [
        {
          label: 'View Details',
          icon: <Eye />,
          onClick: handleView
        }
      ]
    }}
  />
</EntityCardGrid>
```

### 4. Alert Components

**Varianti disponibili:**
- Alert standard
- InlineAlert (per form)
- BannerAlert (full width)
- ToastAlert (notifiche)

**Esempio:**

```tsx
import { Alert, ToastAlert, BannerAlert } from './components/ui/Alert';

<Alert 
  variant="success"
  title="Success!"
  closable
  autoClose={5000}
>
  Account created successfully
</Alert>

<ToastAlert
  variant="error"
  position="top-right"
  autoClose={3000}
>
  Operation failed
</ToastAlert>
```

## 🪝 Custom Hooks

### useConfirm Hook

**Utilizzo:**

```tsx
import { useConfirm, ConfirmProvider } from './hooks/useConfirm';

function MyComponent() {
  const confirm = useConfirm();
  
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Item',
      message: 'Are you sure?',
      variant: 'danger',
      confirmText: 'Delete',
      confirmButtonVariant: 'danger'
    });
    
    if (confirmed) {
      // Perform deletion
    }
  };
}

// Wrap your app/component
<ConfirmProvider>
  <MyComponent />
</ConfirmProvider>
```

### useCrud Hook

**Caratteristiche:**
- Gestione stato CRUD completa
- Loading states separati
- Error handling
- Optimistic updates disponibili
- Paginazione opzionale

**Esempio:**

```tsx
import { useCrud } from './hooks/useCrud';

const [state, actions] = useCrud<Account>({
  service: accountService,
  autoLoad: true,
  onSuccess: {
    create: (item) => console.log('Created:', item),
    delete: (id) => console.log('Deleted:', id)
  }
});

const { items, loading, error, creating, updating, deleting } = state;

// Operazioni
await actions.create(newAccount);
await actions.update(id, updates);
await actions.delete(id);
actions.select(account);
actions.clearError();
```

## 🎨 Utilities

### cn() - Class Names Merge

Combina classi CSS con gestione dei conflitti Tailwind:

```tsx
import { cn } from './utils/cn';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  isDisabled && 'disabled-class',
  className // props override
)} />
```

## 📋 Checklist di Migrazione

Per migrare componenti esistenti:

1. **Modal Migration:**
   - [ ] Sostituire div fissi con `<Modal>`
   - [ ] Aggiungere `isOpen` prop
   - [ ] Usare `ModalFooter` per i bottoni
   - [ ] Gestire `preventClose` durante loading

2. **Form Migration:**
   - [ ] Sostituire input nativi con `FormField`
   - [ ] Aggiungere validazioni
   - [ ] Implementare `onValidationChange`
   - [ ] Mostrare stati di validazione

3. **Card/List Migration:**
   - [ ] Usare `EntityCard` per liste di entità
   - [ ] Configurare metadata e actions
   - [ ] Implementare grid/list layout
   - [ ] Aggiungere status badges

4. **CRUD Operations:**
   - [ ] Sostituire useState multipli con `useCrud`
   - [ ] Rimuovere loading/error states manuali
   - [ ] Implementare callbacks success/error
   - [ ] Usare actions predefinite

5. **Confirmations:**
   - [ ] Rimuovere window.confirm()
   - [ ] Wrap con `ConfirmProvider`
   - [ ] Usare `useConfirm` hook
   - [ ] Personalizzare varianti

## 🚀 Best Practices

1. **Validazione Forms:**
   - Validare sempre lato client prima di inviare
   - Mostrare errori in real-time dopo blur
   - Usare messaggi di errore chiari e specifici

2. **Gestione Stati:**
   - Usare `useCrud` per operazioni CRUD standard
   - Implementare optimistic updates per UX migliore
   - Gestire sempre stati di loading

3. **Feedback Utente:**
   - Mostrare sempre feedback per azioni utente
   - Usare ToastAlert per notifiche temporanee
   - Implementare confirm dialogs per azioni distruttive

4. **Accessibilità:**
   - Tutti i modal devono essere keyboard navigabili
   - Form fields devono avere label appropriate
   - Includere aria-labels dove necessario

## 🔄 Prossimi Passi

Per completare la migrazione Week 2:

1. Creare componenti per Transactions
2. Implementare ImportCSV con wizard
3. Aggiungere filtri e paginazione
4. Creare dashboard con grafici
5. Implementare sistema di notifiche globale

Tutti i componenti sono pronti per essere estesi e riutilizzati nelle prossime fasi dello sviluppo.
