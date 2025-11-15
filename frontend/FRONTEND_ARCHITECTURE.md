# FinancePro Frontend - Architettura Completa

## 📁 Struttura del Progetto

```
src/
├── app/                          # Configurazione applicazione
│   ├── layout/                   # Layout components (Sidebar, Topbar, etc.)
│   ├── routes/                   # Route definitions
│   └── providers/                # App-level providers (QueryClient, Theme, etc.)
│
├── core/                         # Codice riutilizzabile cross-feature
│   ├── components/
│   │   ├── atomic/              # Atomic components (Button, Input, Select, etc.)
│   │   └── composite/           # Composite components (DataTable, Form, etc.)
│   ├── hooks/                   # Custom hooks generici
│   ├── utils/                   # Utility functions
│   ├── validations/             # Zod schemas comuni
│   └── types/                   # TypeScript types condivisi
│
├── features/                     # Feature modules (feature-based architecture)
│   ├── transactions/
│   │   ├── pages/               # TransactionsPage, TransactionDetailPage
│   │   ├── components/          # TransactionCard, TransactionForm, etc.
│   │   ├── hooks/               # useTransactions, useCreateTransaction
│   │   ├── api/                 # API clients (real or mock)
│   │   └── types/               # Feature-specific types
│   │
│   ├── budgets/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   │
│   ├── goals/                   # Goal planning
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   │
│   ├── analytics/               # Analytics & Reports
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   │
│   ├── ai-assistant/            # AI Chat Assistant
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   │
│   ├── optimization/            # Financial Optimization
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   │
│   ├── assets/                  # Asset Management (Patrimonio)
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   │
│   ├── recurring/               # Recurring Transactions
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   │
│   └── import/                  # Data Import (CSV, OCR)
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       └── types/
│
├── api/                         # API layer
│   └── generated/               # Orval generated code (existing)
│
├── assets/                      # Static assets
├── contexts/                    # React contexts (existing)
├── hooks/                       # Legacy hooks (to be migrated to core/)
└── pages/                       # Top-level pages (existing, to be refactored)
```

## 🎨 Design System - Componenti Atomici

### Già Implementati
- ✅ Modal
- ✅ FormField
- ✅ Alert
- ✅ EntityCard (partial)

### Da Implementare
- Button (variants: primary, secondary, danger, ghost, link)
- Input (text, number, email, password, search)
- Select (single, multiple, searchable)
- Checkbox
- Toggle / Switch
- Card (generico, non solo Entity)
- Spinner / Loading
- Badge
- Tooltip
- Dropdown
- Tabs
- Accordion
- Progress Bar
- Date Picker
- Currency Input

## 🧩 Design System - Componenti Compositi

### Da Implementare
- **DataTable Generica**
  - Sorting
  - Filtering
  - Pagination
  - Row selection
  - Custom cell renderers

- **Form Framework**
  - Integration con react-hook-form + zod
  - Auto-generation da schema Zod
  - Field arrays support
  - Conditional fields

- **PageHeader**
  - Title + breadcrumbs
  - Actions (buttons)
  - Filters

- **Sidebar Navigation**
  - Hierarchical menu
  - Active state
  - Icons
  - Collapse/expand

- **ConfirmDialog**
  - Già presente in hooks/useConfirm.tsx

- **Chart Components**
  - Line Chart
  - Bar Chart
  - Pie Chart
  - Area Chart
  - (usando recharts)

## 🔌 API Strategy

### Real APIs (Backend Available)
- Authentication (`/api/v1/auth/*`)
- Accounts (`/api/v1/accounts/*`)
- Categories (`/api/v1/categories`)

### Mock APIs (Backend Not Yet Available)
Per le seguenti feature, creeremo servizi mock che restituiscono dati fittizi:

- **Transactions**
  - `GET /api/v1/transactions`
  - `POST /api/v1/transactions`
  - `GET /api/v1/transactions/{id}`
  - `PUT /api/v1/transactions/{id}`
  - `DELETE /api/v1/transactions/{id}`

- **Budgets**
  - CRUD completo
  - Budget tracking

- **Goals**
  - CRUD completo
  - Progress tracking

- **Analytics**
  - Dashboard data
  - Reports
  - Charts data

- **AI Assistant**
  - Chat messages
  - Suggestions
  - Classifications

- **Optimization**
  - Recommendations
  - Savings opportunities

- **Recurring Transactions**
  - CRUD completo
  - Schedule patterns

### Mock Service Pattern

```typescript
// features/transactions/api/mockTransactionsApi.ts
import { Transaction, TransactionCreate } from '../types';

export const mockTransactionsApi = {
  getAll: async (): Promise<Transaction[]> => {
    // Return mock data
    return mockTransactions;
  },

  create: async (data: TransactionCreate): Promise<Transaction> => {
    // Simulate creation
    return { ...data, id: generateId() };
  },

  // ... altre operazioni
};

// features/transactions/hooks/useTransactions.ts
import { useQuery } from '@tanstack/react-query';
import { mockTransactionsApi } from '../api/mockTransactionsApi';

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => mockTransactionsApi.getAll(),
  });
};
```

Quando il backend sarà pronto, basterà sostituire `mockTransactionsApi` con il client generato da Orval.

## 🎯 Feature Implementation Order

### Phase 1: Core & Infrastructure (Priorità Alta)
1. ✅ Design System - Atomic Components
2. ✅ Design System - Composite Components (DataTable, Form)
3. ✅ Layout avanzato (Sidebar, Topbar, Navigation)
4. ✅ Routing completo

### Phase 2: Core Financial Features (Priorità Alta)
1. **Transactions Management**
   - List, Create, Edit, Delete transactions
   - Multi-currency support
   - Categorization (manual)

2. **Budgets**
   - Create budgets by category/period
   - Monitor progress
   - Alerts

3. **Dashboard Enhanced**
   - Financial overview
   - Charts e visualizations
   - Quick actions

### Phase 3: Advanced Features (Priorità Media)
1. **Goals & Planning**
   - Goal creation wizard
   - Progress tracking
   - Milestone management

2. **Analytics & Reports**
   - Spending trends
   - Category breakdown
   - Time comparisons
   - Export capabilities

3. **Recurring Transactions**
   - Pattern definition
   - Auto-generation
   - Management

### Phase 4: AI Features (Priorità Media-Bassa)
1. **AI Classification** (mock UI)
   - Auto-categorization feedback
   - Training interface

2. **AI Assistant** (mock UI)
   - Chat interface
   - Query natural language
   - Suggestions display

3. **Forecasting** (mock UI)
   - Predictions visualization
   - Scenario analysis

4. **Optimization** (mock UI)
   - Recommendations display
   - Savings opportunities

### Phase 5: Additional Features (Priorità Bassa)
1. **Import/Export**
   - CSV import
   - OCR upload interface (mock)

2. **Asset Management**
   - Mobile/Immobile assets
   - Valuation tracking

3. **Audit Log**
   - Activity timeline
   - Change history

## 🎨 Design Tokens

### Colors
```typescript
const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  success: {
    500: '#10b981',
    600: '#059669',
  },
  warning: {
    500: '#f59e0b',
    600: '#d97706',
  },
  danger: {
    500: '#ef4444',
    600: '#dc2626',
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    500: '#6b7280',
    700: '#374151',
    900: '#111827',
  },
};
```

### Typography
```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
};
```

### Spacing
```typescript
const spacing = {
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
};
```

## 🧪 Testing Strategy

### Unit Tests
- Componenti atomici con React Testing Library
- Utility functions con Vitest
- Zod schemas validation

### Integration Tests
- Feature flows completi
- Form submissions
- API interactions

### E2E Tests (Future)
- Playwright per flussi critici
- Login → Create Transaction → Budget tracking

## 📦 State Management

### React Query per:
- Server state (API calls)
- Caching
- Background refetching
- Optimistic updates

### React Context per:
- Auth state
- Theme preference
- UI state (sidebar collapsed, etc.)

### Local State per:
- Form state (react-hook-form)
- Component-specific UI state

## 🔒 Type Safety

### End-to-End Type Safety

```
Backend (Pydantic)
  → OpenAPI
    → Orval
      → TypeScript Types + Zod Schemas
        → Frontend Components
```

### Validation Layers
1. **Compile-time**: TypeScript
2. **Runtime**: Zod (form validation, API response validation)
3. **Backend**: Pydantic (API request/response validation)

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Tailwind CSS per styling
- Adaptive layouts (griglia → lista → card su mobile)

## ♿ Accessibility

- Semantic HTML
- ARIA labels dove necessario
- Keyboard navigation
- Focus management
- Screen reader support
- Color contrast WCAG AA compliance

## 🚀 Performance

### Code Splitting
- React.lazy per route-based code splitting
- Dynamic imports per componenti pesanti

### Optimization
- Memoization (React.memo, useMemo, useCallback)
- Virtual scrolling per liste lunghe (react-window)
- Image optimization
- Bundle size monitoring

## 📝 Decisioni Architetturali

### Feature-Based Architecture
**Perché**: Scalabilità, team parallelo, clear boundaries

### Mock Services Pattern
**Perché**: Permette sviluppo frontend indipendente dal backend

### Orval + Zod
**Perché**: Single source of truth, type safety end-to-end

### React Query
**Perché**: Best-in-class server state management, caching, devtools

### Tailwind CSS
**Perché**: Rapid development, consistent design, small bundle

### TypeScript Strict Mode
**Perché**: Maximum type safety, fewer bugs

## 🔄 Migration Path (Mock → Real API)

1. Backend implements endpoint
2. Generate OpenAPI spec
3. Run `npm run generate:api`
4. Replace mock import with generated hook:

```typescript
// Before
import { mockTransactionsApi } from '../api/mockTransactionsApi';

// After
import { useGetTransactions } from '@/api/generated/transactions';
```

## 🎯 Success Metrics

- ✅ Zero `any` types
- ✅ 100% TypeScript coverage
- ✅ All forms validated with Zod
- ✅ < 3s initial load time
- ✅ Lighthouse score > 90
- ✅ Zero accessibility violations (axe-core)

## 📚 Documentation

- Component documentation con Storybook (future)
- JSDoc per funzioni complesse
- README per ogni feature module
- Architecture Decision Records (ADRs)
