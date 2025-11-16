# FinancePro v2.0 - Architecture Design Document

## 📋 Executive Summary

Questo documento definisce l'architettura completa di FinancePro v2.0 basata sui requisiti del documento "FinancePro requisiti.pdf". L'applicazione è una piattaforma finanziaria premium con AI integrata per gestione multi-profilo, classificazione intelligente, previsioni avanzate e ottimizzazione finanziaria.

## 🎯 Requisiti Funzionali Estratti

### 1. Struttura e Gestione Utenti

#### 1.1 Utenti e Profili Finanziari (Modello Gerarchico)
- **User** (utente principale)
  - Può creare/gestire multipli **FinancialProfile**
  - Ogni profilo rappresenta un'entità finanziaria separata (personale, familiare, professionale)
  - Accesso esclusivo ai propri profili
  - Visualizzazione aggregata o selettiva

#### 1.2 Autenticazione e Sicurezza
- Email/password con JWT
- GUID (UUID) invece di ID incrementali
- End-to-end encryption per dati sensibili
- GDPR compliance (export/delete data)
- 2FA (future implementation)
- SSO (future implementation)

#### 1.3 Database Distribuiti
- Ogni **FinancialProfile** può avere database separato
- Supporto PostgreSQL e MS SQL Server
- Gestione automatica disponibilità
- ConnectionString per profilo

### 2. Gestione Transazioni

#### 2.1 Tipi di Transazioni
- `BANK_TRANSFER` - Bonifici
- `WITHDRAWAL` - Prelievi
- `PAYMENT` - Pagamenti
- `PURCHASE` - Acquisti categorizzati
- `INTERNAL_TRANSFER` - Giroconti tra accounts stesso profilo
- `INCOME` - Accrediti (stipendio, parcelle)
- `ASSET_PURCHASE` - Acquisto beni mobili/immobili
- `ASSET_SALE` - Vendita beni

#### 2.2 Multi-valuta
- Ogni profilo ha valuta di riferimento (default EUR)
- Transazioni in valuta estera registrate in originale
- **ExchangeRate** table con storico tassi
- Conversione automatica per reporting

#### 2.3 Transazioni Ricorrenti
- **RecurringTransaction** model
- Modelli di variazione:
  - `FIXED` - Importo fisso
  - `VARIABLE_WITHIN_RANGE` - Con min/max
  - `PROGRESSIVE` - Rate variabili programmate
  - `SEASONAL` - Variazioni stagionali
- Regole di calcolo (formule matematiche)
- Analisi storica per stima
- Override manuale per occorrenze
- Notifiche intelligenti (preventive, conferma, anomalia, reconciliation)
- Automazione: pattern detection, suggerimenti, dashboard timeline
- Gestione eccezioni (pause, modifiche, festività)

### 3. Importazione e Classificazione

#### 3.1 Importazione Dati
- **CSV Import** con mapping configurabile
- Estratti conto bancari
- **AI-powered OCR** (future):
  - Fatture, scontrini, ricevute
  - Riconoscimento tipo documento
  - Estrazione strutturata
  - Parsing contratti finanziari
- **Banking Conditions Extraction** (future):
  - Tassi, commissioni, condizioni
  - Confronto tra istituti

#### 3.2 Classificazione Automatica ML
- **Multi-model approach**:
  - Supervised (Gradient Boosting)
  - Unsupervised (pattern discovery)
- **Architecture a più livelli**:
  - Modello globale pre-trained
  - Modello personalizzato per utente
  - Meta-learning da utenti simili
- **Smart Categorization 2.0**:
  - Merchant recognition e normalizzazione
  - **Sotto-categorizzazione gerarchica** (3 livelli):
    - Livello 1: Categoria principale (es. "Supermercato")
    - Livello 2: Sotto-categoria (es. "Alimentari freschi")
    - Livello 3: Dettaglio (es. "Frutta e verdura")
  - **Multi-dimensional tagging**:
    - Contestuali: #lavoro, #personale, #famiglia
    - Funzionali: #deducibile, #rimborsabile, #condiviso
    - Temporali: #ricorrente, #stagionale, #una-tantum
    - Emotivi: #urgente, #voluttuario, #necessario
- Apprendimento eccezioni
- Gestione ambiguità con conferma
- **Metriche**: accuracy, precision, recall, F1-score
- **Explainability**: motivazioni classificazioni

### 4. Assistente AI Conversazionale

#### 4.1 FinancePro Chat Assistant
- **Query NL** sui dati finanziari
- Comprensione contesto conversazionale
- Query complesse multi-criterio
- **Analisi e reporting**:
  - Report personalizzati su richiesta
  - Visualizzazioni grafiche dinamiche
  - Confronti temporali
  - Export in vari formati
- **Consigli proattivi**:
  - Pattern detection
  - Alert personalizzati
  - Raccomandazioni ottimizzazione
- **Operazioni guidate**:
  - Assistenza creazione budget/goal
  - Spiegazione metriche
  - Supporto troubleshooting

#### 4.2 Privacy e Sicurezza AI
- Elaborazione locale quando possibile
- No invio dati raw a servizi esterni
- Anonimizzazione automatica
- Controllo utente granulare
- **Multimodalità**: testuale, vocale, allegati

### 5. Budget e Previsioni

#### 5.1 Sistema Budget
- Budget configurabili (mensile, trimestrale, annuale, custom)
- Per categoria o gruppo categorie
- Monitoraggio real-time
- Alert soglie

#### 5.2 Previsioni Finanziarie Avanzate
- **Algoritmi**:
  - Serie temporali (ARIMA/SARIMA, Exponential Smoothing)
  - ML (Gradient Boosting, reti neurali)
  - Modelli causali con variabili esterne
- **Previsioni Contestuali**:
  - Integrazione calendario (eventi, scadenze, vacanze)
  - Dati esterni (festività, eventi stagionali, meteo, eventi locali)
  - Modelli predittivi stagionali personalizzati
  - Alert preventivi liquidità
- **Visualizzazione incertezza**:
  - Intervalli confidenza
  - Scenari multipli (ottimistico, probabile, pessimistico)
  - Spiegazioni NL qualità previsioni
  - Indicatori affidabilità
- **Personalizzazione profilo rischio**
- **Simulazioni what-if** interattive
- Benchmarking anonimo
- ML per affinamento continuo

### 6. Ottimizzazione Finanziaria e Goal Planning

#### 6.1 Ottimizzazione AI-driven
- **Analisi spese**:
  - Suggerimenti riduzione basati su pattern
  - Aree ottimizzabili senza impatto lifestyle
  - Benchmark utenti simili
  - Rapporto qualità-prezzo
- **Rilevamento sprechi**:
  - Abbonamenti non utilizzati/duplicati
  - Frequenza utilizzo servizi
  - Costo effettivo per utilizzo
  - Alternative economiche
- **Ottimizzazione cash flow**:
  - Raccomandazioni flusso cassa
  - Tempistica ottimale pagamenti
  - Opportunità spostamento spese
  - Riduzione periodi critici
- **Strategie risparmio**:
  - Piani adattivi su obiettivi
  - Micro-opportunità
  - Sfide personalizzate
  - Calcolo impatto proiettato
- **Monitoraggio efficacia**:
  - Tracking raccomandazioni
  - Misurazione risparmio effettivo
  - Feedback loop
  - Report periodici

#### 6.2 Goal Planning Intelligente
- **Definizione assistita**:
  - Conversational AI
  - Categorie predefinite (casa, auto, vacanza, pensione, emergenza)
  - Obiettivi custom
  - Validazione fattibilità
- **Pianificazione adattiva**:
  - Piani con milestone automatici
  - Quota mensile calcolata
  - Fonti risparmio ottimali
  - Strategie per obiettivi concorrenti
- **Monitoraggio dinamico**:
  - Ricalcolo in base a cambiamenti
  - Aggiustamenti proattivi
  - Notifiche avanzamento
  - Analisi predittiva probabilità
- **Gamification intelligente**:
  - Sistema punti/livelli
  - Traguardi adattivi
  - Badge e achievement
  - Sfide settimanali/mensili
  - Grafici motivazionali
- **Simulazioni e scenari**:
  - What-if analysis
  - Comparazione strategie
  - Impatto eventi futuri
  - Ottimizzazione multi-obiettivo
- **Insights**:
  - Suggerimenti accelerazione
  - Ostacoli ricorrenti
  - Pattern successo/fallimento
  - Consigli da comportamenti simili

### 7. Gestione Patrimoniale

#### 7.1 Beni Mobili e Immobili
- **Asset** model (mobili, immobili, investimenti)
- Metodi valutazione:
  - Quotazioni oggettive (metalli preziosi)
  - Range per immobili
  - Valutazioni comparative
- Aggiornamento valutazioni nel tempo
- Distinzione patrimonio liquido/immobilizzato
- Andamento valore

#### 7.2 Analisi Patrimoniale
- Valore netto patrimoniale
- Range min-max valutazioni variabili
- Cash flow mensile/annuale
- Indici liquidità e solvibilità
- Diversificazione asset

### 8. Audit e Sicurezza

#### 8.1 Sistema Logging Completo
- **Eventi accesso**: login/logout, dispositivo, IP, modifiche account, eventi sospetti
- **Operazioni finanziarie**: CRUD entità, modifiche transazioni, import/export
- **Interazioni AI**: classificazioni, previsioni, pattern, query chat, raccomandazioni, goal
- **Operazioni sistema**: connessioni DB, backup, errori

#### 8.2 Conservazione Log
- Operativi: 90-180 giorni
- Sicurezza/transazionali: 1-2 anni
- Conformità: 5-10 anni
- Compressione e anonimizzazione progressiva

#### 8.3 Visualizzazione Cronologia
- Dashboard attività con filtri
- Timeline visuale
- Report periodici/tematici
- Evidenziazione anomalie
- Diff modifiche

### 9. Interfaccia Utente

#### 9.1 Multi-dispositivo
- Desktop, tablet, smartphone
- Responsive design

#### 9.2 Dashboard Specializzate
- Panoramica finanziaria generale
- Monitoraggio budget
- Analisi transazioni
- Gestione patrimoniale
- Obiettivi e goal planning
- AI insights
- Dashboard personalizzata con widget configurabili

#### 9.3 Personalizzazione
- Widget personalizzabili
- Layout configurabile
- Temi e preferenze visive
- Notifiche personalizzate
- Livello proattività AI

### 10. Integrazioni e API

#### 10.1 Importazione Bancaria
- Estratti conto vari formati
- Documenti condizioni bancarie
- Confronto istituti

#### 10.2 API e Estensibilità
- RESTful API completa
- Struttura modulare
- Plugin framework

## 🏛️ Database Schema Design

### Core Entities

#### User
```python
- id: UUID (PK)
- email: String (unique)
- hashed_password: String
- full_name: String
- is_active: Boolean
- is_verified: Boolean
- created_at: DateTime
- updated_at: DateTime
- last_login_at: DateTime
```

#### FinancialProfile
```python
- id: UUID (PK)
- user_id: UUID (FK -> User)
- name: String
- description: String
- profile_type: Enum (PERSONAL, FAMILY, BUSINESS)
- default_currency: String (ISO 4217)
- database_connection_string: String (encrypted)
- database_type: Enum (POSTGRESQL, MSSQL)
- is_active: Boolean
- created_at: DateTime
- updated_at: DateTime
```

#### Account
```python
- id: UUID (PK)
- financial_profile_id: UUID (FK -> FinancialProfile)
- name: String
- account_type: Enum (CHECKING, SAVINGS, CREDIT_CARD, INVESTMENT, CASH)
- currency: String (ISO 4217)
- initial_balance: Decimal(15,2)
- current_balance: Decimal(15,2) (computed)
- institution_name: String
- account_number: String (encrypted)
- is_active: Boolean
- created_at: DateTime
- updated_at: DateTime
```

#### Transaction
```python
- id: UUID (PK)
- account_id: UUID (FK -> Account)
- category_id: UUID (FK -> Category, nullable)
- recurring_transaction_id: UUID (FK -> RecurringTransaction, nullable)
- transaction_type: Enum (BANK_TRANSFER, WITHDRAWAL, ...)
- amount: Decimal(15,2)
- currency: String (ISO 4217)
- exchange_rate_id: UUID (FK -> ExchangeRate, nullable)
- amount_in_profile_currency: Decimal(15,2) (computed)
- description: String
- merchant_name: String
- merchant_normalized: String (ML normalized)
- transaction_date: Date
- value_date: Date
- notes: Text
- is_reconciled: Boolean
- location: String
- receipt_url: String
- created_at: DateTime
- updated_at: DateTime
- created_by: Enum (MANUAL, IMPORT, OCR, RECURRING)
```

#### Category (Hierarchical)
```python
- id: UUID (PK)
- financial_profile_id: UUID (FK -> FinancialProfile)
- parent_category_id: UUID (FK -> Category, nullable)
- name: String
- description: String
- icon: String
- color: String
- level: Integer (1, 2, 3)
- full_path: String (e.g., "Supermercato > Alimentari freschi > Frutta e verdura")
- is_system: Boolean (cannot be deleted)
- is_active: Boolean
- created_at: DateTime
- updated_at: DateTime
```

#### Tag
```python
- id: UUID (PK)
- financial_profile_id: UUID (FK -> FinancialProfile)
- name: String
- tag_type: Enum (CONTEXTUAL, FUNCTIONAL, TEMPORAL, EMOTIONAL)
- color: String
- created_at: DateTime
```

#### TransactionTag (Many-to-Many)
```python
- transaction_id: UUID (FK -> Transaction)
- tag_id: UUID (FK -> Tag)
- created_at: DateTime
```

#### RecurringTransaction
```python
- id: UUID (PK)
- account_id: UUID (FK -> Account)
- category_id: UUID (FK -> Category, nullable)
- name: String
- description: String
- amount_model: Enum (FIXED, VARIABLE_WITHIN_RANGE, PROGRESSIVE, SEASONAL)
- base_amount: Decimal(15,2)
- min_amount: Decimal(15,2) (nullable, for VARIABLE)
- max_amount: Decimal(15,2) (nullable, for VARIABLE)
- frequency: Enum (DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY)
- start_date: Date
- end_date: Date (nullable)
- next_occurrence_date: Date
- calculation_formula: String (nullable, mathematical formula)
- is_active: Boolean
- notification_enabled: Boolean
- notification_days_before: Integer
- anomaly_threshold_percentage: Decimal(5,2)
- created_at: DateTime
- updated_at: DateTime
```

#### RecurringTransactionOccurrence
```python
- id: UUID (PK)
- recurring_transaction_id: UUID (FK -> RecurringTransaction)
- transaction_id: UUID (FK -> Transaction, nullable)
- scheduled_date: Date
- expected_amount: Decimal(15,2)
- actual_amount: Decimal(15,2) (nullable)
- status: Enum (PENDING, EXECUTED, SKIPPED, OVERRIDDEN)
- is_anomaly: Boolean
- notes: Text
- created_at: DateTime
- updated_at: DateTime
```

#### ExchangeRate
```python
- id: UUID (PK)
- from_currency: String (ISO 4217)
- to_currency: String (ISO 4217)
- rate: Decimal(18,8)
- date: Date
- source: String (e.g., "ECB", "Manual")
- created_at: DateTime
```

#### Budget
```python
- id: UUID (PK)
- financial_profile_id: UUID (FK -> FinancialProfile)
- name: String
- period_type: Enum (MONTHLY, QUARTERLY, YEARLY, CUSTOM)
- start_date: Date
- end_date: Date
- amount: Decimal(15,2)
- currency: String
- is_active: Boolean
- alert_threshold_percentage: Decimal(5,2)
- created_at: DateTime
- updated_at: DateTime
```

#### BudgetCategory (Many-to-Many)
```python
- budget_id: UUID (FK -> Budget)
- category_id: UUID (FK -> Category)
- allocated_amount: Decimal(15,2)
```

#### FinancialGoal
```python
- id: UUID (PK)
- financial_profile_id: UUID (FK -> FinancialProfile)
- name: String
- description: Text
- goal_type: Enum (HOUSE, CAR, VACATION, RETIREMENT, EMERGENCY_FUND, CUSTOM)
- target_amount: Decimal(15,2)
- current_amount: Decimal(15,2)
- target_date: Date
- monthly_contribution: Decimal(15,2) (computed)
- priority: Integer
- status: Enum (ACTIVE, PAUSED, COMPLETED, CANCELLED)
- achievement_probability: Decimal(5,2) (ML predicted)
- gamification_points: Integer
- created_at: DateTime
- updated_at: DateTime
```

#### GoalMilestone
```python
- id: UUID (PK)
- goal_id: UUID (FK -> FinancialGoal)
- name: String
- target_amount: Decimal(15,2)
- target_date: Date
- is_completed: Boolean
- completed_at: DateTime
- created_at: DateTime
```

#### Asset
```python
- id: UUID (PK)
- financial_profile_id: UUID (FK -> FinancialProfile)
- name: String
- asset_type: Enum (REAL_ESTATE, VEHICLE, PRECIOUS_METAL, INVESTMENT, OTHER)
- purchase_date: Date
- purchase_price: Decimal(15,2)
- current_value: Decimal(15,2)
- current_value_min: Decimal(15,2) (for range)
- current_value_max: Decimal(15,2) (for range)
- valuation_method: Enum (MARKET_QUOTE, RANGE, COMPARATIVE, MANUAL)
- currency: String
- is_liquid: Boolean
- notes: Text
- created_at: DateTime
- updated_at: DateTime
```

#### AssetValuation
```python
- id: UUID (PK)
- asset_id: UUID (FK -> Asset)
- valuation_date: Date
- value: Decimal(15,2)
- value_min: Decimal(15,2)
- value_max: Decimal(15,2)
- source: String
- notes: Text
- created_at: DateTime
```

#### AuditLog
```python
- id: UUID (PK)
- user_id: UUID (FK -> User, nullable)
- financial_profile_id: UUID (FK -> FinancialProfile, nullable)
- event_type: Enum (ACCESS, SECURITY, FINANCIAL_OP, AI_INTERACTION, SYSTEM)
- entity_type: String
- entity_id: UUID
- action: String
- details: JSONB
- ip_address: String
- user_agent: String
- device_info: String
- timestamp: DateTime
- severity: Enum (INFO, WARNING, ERROR, CRITICAL)
```

#### MLClassificationLog
```python
- id: UUID (PK)
- transaction_id: UUID (FK -> Transaction)
- model_version: String
- predicted_category_id: UUID (FK -> Category)
- confidence_score: Decimal(5,4)
- was_accepted: Boolean
- corrected_category_id: UUID (FK -> Category, nullable)
- features_used: JSONB
- explanation: Text
- timestamp: DateTime
```

#### ImportJob
```python
- id: UUID (PK)
- financial_profile_id: UUID (FK -> FinancialProfile)
- account_id: UUID (FK -> Account, nullable)
- import_type: Enum (CSV, OCR, BANK_API)
- file_name: String
- file_url: String
- status: Enum (PENDING, PROCESSING, COMPLETED, FAILED)
- total_records: Integer
- processed_records: Integer
- successful_records: Integer
- failed_records: Integer
- error_details: JSONB
- mapping_config: JSONB
- created_at: DateTime
- completed_at: DateTime
```

#### ChatConversation
```python
- id: UUID (PK)
- user_id: UUID (FK -> User)
- financial_profile_id: UUID (FK -> FinancialProfile, nullable)
- title: String (auto-generated from first message)
- created_at: DateTime
- updated_at: DateTime
```

#### ChatMessage
```python
- id: UUID (PK)
- conversation_id: UUID (FK -> ChatConversation)
- role: Enum (USER, ASSISTANT, SYSTEM)
- content: Text
- metadata: JSONB (query results, charts, etc.)
- timestamp: DateTime
```

### Indexes Strategy

- UUID primary keys (clustered)
- Foreign keys (non-clustered)
- Composite indexes:
  - `(financial_profile_id, transaction_date)` on Transaction
  - `(financial_profile_id, is_active)` on Account
  - `(user_id, created_at DESC)` on AuditLog
  - `(from_currency, to_currency, date DESC)` on ExchangeRate
  - `(parent_category_id, level)` on Category

## 🏗️ Backend Architecture

### Layer Structure

```
app/
├── models/          # SQLAlchemy ORM models
├── schemas/         # Pydantic request/response schemas
├── repositories/    # Data access layer
├── services/        # Business logic layer
├── api/            # FastAPI routers
├── ml/             # Machine learning models
├── ai/             # AI/LLM integrations
├── core/           # Core utilities
│   ├── security.py
│   ├── encryption.py
│   ├── database_manager.py
│   └── exceptions.py
├── db/             # Database configuration
└── tests/          # Unit and integration tests
```

### Repository Pattern

```python
# Base Repository
class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], db: Session):
        self.model = model
        self.db = db

    async def get_by_id(self, id: UUID) -> Optional[T]
    async def list(self, skip: int, limit: int, filters: Dict) -> List[T]
    async def create(self, obj_in: BaseModel) -> T
    async def update(self, id: UUID, obj_in: BaseModel) -> T
    async def delete(self, id: UUID) -> bool
    async def count(self, filters: Dict) -> int

# Specialized Repositories
class TransactionRepository(BaseRepository[Transaction]):
    async def get_by_profile(self, profile_id: UUID, ...)
    async def get_by_date_range(self, start: date, end: date, ...)
    async def get_unclassified(self, ...)
    async def bulk_create(self, transactions: List[TransactionCreate])
```

### Service Layer

```python
# Services encapsulate business logic
class TransactionService:
    def __init__(
        self,
        repo: TransactionRepository,
        category_service: CategoryService,
        ml_service: MLClassificationService,
        audit_service: AuditService
    ):
        ...

    async def create_transaction(self, ...) -> Transaction
    async def classify_transaction(self, transaction_id: UUID) -> Category
    async def import_from_csv(self, file: UploadFile, ...) -> ImportResult
    async def get_spending_analysis(self, profile_id: UUID, ...) -> SpendingAnalysis
```

### API Routers

```python
# FastAPI routers with dependency injection
@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service)
):
    return await service.create_transaction(transaction_in, current_user)
```

## 🎨 Frontend Architecture

### Folder Structure

```
src/
├── api/
│   ├── generated/      # Orval generated (DO NOT EDIT)
│   └── client.ts       # Axios instance with interceptors
├── components/
│   ├── ui/            # Base reusable components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Card.tsx
│   │   ├── Chart.tsx
│   │   ├── Form.tsx
│   │   └── ...
│   ├── layout/        # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── domain/        # Domain-specific components
│       ├── TransactionList.tsx
│       ├── CategoryTree.tsx
│       ├── BudgetCard.tsx
│       └── ...
├── features/          # Feature modules
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   ├── transactions/
│   ├── budgets/
│   ├── goals/
│   ├── assets/
│   ├── chat/
│   └── settings/
├── hooks/             # Global custom hooks
│   ├── useAuth.ts
│   ├── useProfile.ts
│   ├── useToast.ts
│   └── ...
├── contexts/          # React contexts
├── providers/         # Context providers
├── utils/             # Utility functions
├── types/             # TypeScript types (complementary to generated)
└── pages/             # Page components (routes)
```

### Component Design Principles

1. **Single Responsibility**: Each component does one thing well
2. **Composition over Inheritance**: Build complex UIs from simple components
3. **Controlled Components**: Parent controls state
4. **TypeScript First**: Full type safety
5. **Zod Validation**: Runtime validation for forms

### Custom Hooks

```typescript
// useTransactions.ts
export const useTransactions = (profileId: string, filters?: TransactionFilters) => {
  const query = useListTransactionsApiV1TransactionsGet({
    profileId,
    ...filters
  });

  return {
    transactions: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};

// useTransactionMutations.ts
export const useTransactionMutations = () => {
  const queryClient = useQueryClient();

  const create = useCreateTransactionApiV1TransactionsPost({
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      toast.success('Transaction created');
    }
  });

  const update = useUpdateTransactionApiV1TransactionsIdPatch({
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      toast.success('Transaction updated');
    }
  });

  return { create, update, ... };
};
```

## 🔒 Security Architecture

### Authentication Flow
1. User logs in → JWT access token (15 min) + refresh token (7 days)
2. Access token in Authorization header
3. Refresh token in httpOnly cookie
4. Automatic token refresh before expiration

### Data Encryption
- Passwords: bcrypt with salt
- Sensitive fields (account_number, connection_string): AES-256-GCM
- Database: transparent data encryption (TDE) in production

### GDPR Compliance
- Data export: `/api/v1/users/me/export` → JSON/CSV
- Data deletion: `/api/v1/users/me/delete` → soft delete + anonymization
- Consent tracking in User model
- Audit log for all data access

## 🧪 Testing Strategy

### Backend Tests
```python
# Unit tests (services, utilities)
def test_calculate_budget_utilization():
    ...

# Integration tests (repositories, database)
@pytest.mark.asyncio
async def test_create_transaction(db_session):
    ...

# API tests (endpoints)
def test_create_transaction_endpoint(client, auth_headers):
    ...
```

### Frontend Tests
```typescript
// Component tests (React Testing Library)
describe('TransactionList', () => {
  it('renders transactions correctly', () => {
    ...
  });
});

// Hook tests
describe('useTransactions', () => {
  it('fetches transactions on mount', () => {
    ...
  });
});

// Integration tests (with MSW for API mocking)
```

## 📊 ML/AI Architecture

### Classification Service
```python
class MLClassificationService:
    def __init__(self):
        self.global_model = load_model('global_model.pkl')
        self.user_models = {}  # Cached per-user models

    async def classify(
        self,
        transaction: Transaction,
        user_id: UUID
    ) -> Tuple[Category, float]:
        # 1. Get or train user model
        # 2. Extract features
        # 3. Predict with ensemble
        # 4. Return category + confidence
        # 5. Log for feedback loop
        ...

    async def train_user_model(self, user_id: UUID):
        # Federated learning approach
        ...

    def explain_classification(self, transaction: Transaction) -> str:
        # SHAP/LIME for explainability
        ...
```

### Forecasting Service
```python
class ForecastingService:
    async def forecast_cashflow(
        self,
        profile_id: UUID,
        horizon_days: int
    ) -> ForecastResult:
        # 1. Get historical data
        # 2. Apply ARIMA/Prophet/ML model
        # 3. Integrate calendar events
        # 4. Integrate external data (weather, holidays)
        # 5. Return scenarios (optimistic, likely, pessimistic)
        ...
```

### Chat Assistant Service
```python
class ChatAssistantService:
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    async def process_query(
        self,
        query: str,
        profile_id: UUID,
        conversation_history: List[ChatMessage]
    ) -> ChatResponse:
        # 1. Parse intent (query, analysis, recommendation)
        # 2. Execute data retrieval if needed
        # 3. Generate contextual response
        # 4. Include visualizations if applicable
        # 5. Log interaction
        ...
```

## 🚀 Deployment Architecture

### Development
- Backend: uvicorn with --reload
- Frontend: Vite dev server
- Database: PostgreSQL in Docker

### Production
- Backend: Gunicorn + Uvicorn workers
- Frontend: Vite build → Nginx/CDN
- Database: PostgreSQL (managed service) + replica for read
- Cache: Redis for session/query cache
- Queue: Celery for background tasks (ML training, forecasts)
- Monitoring: Prometheus + Grafana
- Logging: ELK stack

## 📈 Performance Considerations

### Backend
- Connection pooling (SQLAlchemy)
- Query optimization (select_in loading for relationships)
- Caching (Redis for frequent queries)
- Pagination (default 50, max 100)
- Background jobs (Celery) for heavy operations

### Frontend
- Code splitting (React.lazy)
- Virtualized lists (react-window) for large datasets
- Optimistic updates (React Query)
- Debounced search/filters
- Image lazy loading

### Database
- Proper indexes (see schema)
- Partitioning for large tables (transactions by date)
- Archival strategy (move old data to cold storage)

## 🔄 Development Workflow

1. **Modify Pydantic schema** in backend
2. **Run** `npm run generate:full` (backend → OpenAPI → frontend types)
3. **Implement** service layer logic
4. **Create** API endpoint
5. **Test** with pytest
6. **Use generated hooks** in React
7. **Build UI** with reusable components
8. **Commit** with conventional commits

## 📝 Implementation Phases

### Phase 1: Core Foundation ✅ (Partially Done)
- User authentication
- Basic models (User, Account, Transaction, Category)
- API structure
- Frontend setup with orval

### Phase 2: Multi-Profile & Advanced Transactions (NEXT)
- FinancialProfile model + distributed DB support
- RecurringTransaction with all variation models
- Multi-currency with ExchangeRate
- Transaction types expansion
- Hierarchical categories + tagging system

### Phase 3: ML Classification
- MLClassificationLog model
- Classification service with ML
- Training pipeline
- Explainability features

### Phase 4: Budget & Forecasting
- Budget model + monitoring
- Forecasting service (ARIMA, ML)
- Contextual predictions
- What-if simulations

### Phase 5: Goals & Assets
- FinancialGoal + gamification
- Asset management
- Patrimony analysis

### Phase 6: Chat Assistant
- ChatConversation + ChatMessage models
- NL query processing
- LLM integration
- Proactive recommendations

### Phase 7: Optimization & Advanced Features
- Optimization service (waste detection)
- OCR import
- Advanced dashboards
- Banking conditions extraction

### Phase 8: Security & Compliance
- Enhanced audit logging
- GDPR full compliance
- 2FA
- SSO

## 🎯 Next Steps

1. ✅ Create this architecture document
2. Implement Phase 2 models
3. Create migrations (Alembic)
4. Implement repositories
5. Implement services
6. Create API endpoints
7. Generate OpenAPI + client
8. Build React components
9. Implement features
10. Add tests
11. Deploy

---

**Document Version**: 1.0
**Last Updated**: 2025-11-15
**Status**: Draft - Ready for Implementation
