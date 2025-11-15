# FinancePro - Componenti Riutilizzabili

## 📦 Componenti UI

### 1. Modal (`/components/ui/Modal.tsx`)

Componente modale flessibile con supporto per diverse dimensioni e comportamenti.

**Props principali:**
- `isOpen`: boolean - Controlla la visibilità
- `onClose`: () => void - Callback di chiusura
- `title`: string - Titolo del modale
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full' - Dimensione
- `closeOnBackdrop`: boolean - Chiudi cliccando fuori
- `closeOnEscape`: boolean - Chiudi con ESC
- `preventClose`: boolean - Previeni chiusura (es. durante caricamento)
- `footer`: ReactNode - Contenuto footer personalizzato

**Esempio:**
```tsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Edit Account"
  size="md"
  footer={
    <ModalFooter>
      <button>Cancel</button>
      <button>Save</button>
    </ModalFooter>
  }
>
  {/* Modal content */}
</Modal>
```

### 2. FormField (`/components/ui/FormField.tsx`)

Sistema completo di campi form con validazione avanzata integrata.

**Componenti disponibili:**
- `FormField` - Input generico con validazione
- `TextareaField` - Textarea con validazione
- `SelectField` - Select con opzioni

**Features:**
- Validazione in tempo reale
- Messaggi di errore personalizzati
- Icone di stato
- Password toggle
- Supporto per hint e placeholder

**Validazioni supportate:**
- `required` - Campo obbligatorio
- `minLength`/`maxLength` - Lunghezza stringa
- `min`/`max` - Valori numerici
- `pattern` - RegEx personalizzata
- `custom` - Validazioni custom

**Esempio:**
```tsx
<FormField
  label="Email"
  type="email"
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  icon={<Mail className="h-5 w-5" />}
  validation={{
    required: true,
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format'
    }
  }}
  showValidation
/>
```

### 3. EntityCard (`/components/ui/EntityCard.tsx`)

Componente card versatile per visualizzare entità con azioni e metadata.

**Props principali:**
- `title`: string - Titolo della card
- `subtitle`: string - Sottotitolo
- `description`: string - Descrizione
- `metadata`: Array - Dati chiave-valore
- `actions`: Object - Azioni (edit, delete, custom)
- `status`: Object - Badge di stato
- `badge`: Object - Badge personalizzato
- `variant`: 'default' | 'compact' | 'detailed'

**Layout helpers:**
- `EntityCardGrid` - Griglia responsive
- `EntityCardList` - Layout lista

**Esempio:**
```tsx
<EntityCard
  title={account.name}
  subtitle="EUR Account"
  headerIcon={<Wallet />}
  metadata={[
    { label: 'Balance', value: '€1,000', highlight: true },
    { label: 'Status', value: 'Active' }
  ]}
  actions={{
    onEdit: () => handleEdit(),
    onDelete: () => handleDelete()
  }}
  status={{ label: 'Active', variant: 'success' }}
/>
```

### 4. Alert (`/components/ui/Alert.tsx`)

Sistema completo di notifiche con multiple varianti.

**Componenti:**
- `Alert` - Alert standard
- `ToastAlert` - Notifica toast
- `BannerAlert` - Banner full-width
- `InlineAlert` - Alert inline per form

**Varianti:**
- `info` - Informazioni
- `success` - Successo
- `warning` - Avvertimento
- `error` - Errore
- `default` - Neutro

**Features:**
- Auto-close timer
- Azioni personalizzate
- Icone automatiche
- Animazioni smooth

**Esempio:**
```tsx
<Alert
  variant="error"
  title="Error"
  closable
  action={{
    label: 'Retry',
    onClick: () => retry()
  }}
>
  Failed to save changes
</Alert>
```

## 🪝 Hooks Personalizzati

### 1. useConfirm (`/hooks/useConfirm.tsx`)

Hook per gestire dialog di conferma con stili predefiniti.

**Hooks disponibili:**
- `useConfirm()` - Conferma generica
- `useDeleteConfirm()` - Conferma eliminazione
- `useDiscardConfirm()` - Conferma scarto modifiche
- `useSaveConfirm()` - Conferma salvataggio

**Setup richiesto:**
Wrappare l'app con `ConfirmProvider`:
```tsx
<ConfirmProvider>
  <App />
</ConfirmProvider>
```

**Esempio:**
```tsx
const confirm = useConfirm();
const deleteConfirm = useDeleteConfirm();

const handleDelete = async () => {
  const confirmed = await deleteConfirm('account');
  if (confirmed) {
    await deleteAccount();
  }
};
```

### 2. useCrud (`/hooks/useCrud.ts`)

Hook per gestire operazioni CRUD complete con stato.

**Features:**
- Gestione stato completa (items, loading, error)
- Operazioni CRUD standard
- Paginazione opzionale
- Callbacks success/error
- Update ottimistici

**Esempio:**
```tsx
const [state, actions] = useCrud<Account>({
  service: accountService,
  autoLoad: true,
  onSuccess: {
    create: (item) => showSuccessToast(),
    delete: (id) => showDeleteToast()
  }
});

// Uso
await actions.create(newAccount);
await actions.update(id, updates);
await actions.delete(id);
actions.load(); // Ricarica
```

## 🛠️ Utilities

### cn (`/utils/cn.ts`)
Utility per combinare classi CSS con Tailwind merge.

```tsx
import { cn } from '@/utils/cn';

<div className={cn(
  'base-class',
  condition && 'conditional-class',
  className // prop override
)} />
```

## 📝 Best Practices

### Validazione Form
```tsx
const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

<FormField
  validation={{
    required: true,
    minLength: 2,
    custom: [{
      validate: (value) => value !== 'admin',
      message: 'Username not available'
    }]
  }}
  onValidationChange={(isValid, errors) => {
    setFieldErrors(prev => ({ ...prev, fieldName: errors }));
  }}
/>
```

### Gestione Modali
```tsx
// State
const [showModal, setShowModal] = useState(false);
const [loading, setLoading] = useState(false);

// Previeni chiusura durante operazioni
<Modal
  isOpen={showModal}
  onClose={() => !loading && setShowModal(false)}
  preventClose={loading}
>
```

### CRUD con Conferma
```tsx
const confirmDelete = useDeleteConfirm();
const [, actions] = useCrud<Item>({ service });

const handleDelete = async (item: Item) => {
  if (await confirmDelete(item.name)) {
    try {
      await actions.delete(item.id);
      showToast('Deleted successfully');
    } catch (error) {
      showToast('Delete failed', 'error');
    }
  }
};
```

## 🚀 Quick Start

1. **Installare dipendenze:**
```bash
npm install clsx tailwind-merge lucide-react
```

2. **Importare componenti:**
```tsx
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { EntityCard } from '@/components/ui/EntityCard';
import { Alert } from '@/components/ui/Alert';
import { useConfirm } from '@/hooks/useConfirm';
import { useCrud } from '@/hooks/useCrud';
```

3. **Setup Provider (App.tsx):**
```tsx
<ConfirmProvider>
  <YourApp />
</ConfirmProvider>
```

## 🎨 Personalizzazione

Tutti i componenti supportano:
- `className` prop per override stili
- Varianti predefinite
- Composizione con altri componenti
- Temi colore consistenti

## 📊 Status del Progetto

### ✅ Completato
- [x] Modal system completo
- [x] Form fields con validazione
- [x] Entity cards flessibili  
- [x] Alert system multi-variante
- [x] Confirm dialogs
- [x] CRUD hook generico
- [x] Utility functions

### 🔄 Prossimi Step (Week 2)
- [ ] Componente Table con sorting/filtering
- [ ] Componente DatePicker
- [ ] Componente SearchBar avanzata
- [ ] Hook useDebounce
- [ ] Hook usePagination
- [ ] Componente FileUpload

## 🐛 Troubleshooting

### Problema: Modal non si chiude
**Soluzione:** Verificare che `preventClose` non sia `true` e che non ci siano operazioni async in corso.

### Problema: Validazione non funziona
**Soluzione:** Assicurarsi di gestire `onValidationChange` e salvare gli errori nello state.

### Problema: useCrud non aggiorna UI
**Soluzione:** Verificare che il service ritorni l'oggetto aggiornato e che `idField` sia corretto.

## 📚 Esempi Completi

Vedere `/src/pages/ComponentsDemo.tsx` per esempi live di tutti i componenti.
Vedere `/src/pages/AccountsV2.tsx` per un'implementazione completa con tutti i componenti.
