# Dashboard Refactor — Design Spec
_Date: 2026-05-05_

## Overview

Apply the Frontend Refactoring SOP to `frontend/src/pages/Dashboard.tsx` (430 lines → ~120 lines). The refactor introduces six generic core components reusable across the whole app, a dashboard-specific color constants file, and a semantic Tailwind token pass.

---

## Goals

1. Reduce `Dashboard.tsx` to a lean orchestration file (~120 lines): data fetching + stat derivation + layout only.
2. Extract six reusable `core/` components that eliminate repeated patterns across all feature pages.
3. Centralize dashboard stat card colors in one constants file for global design coherence.
4. Replace raw `gray-*` Tailwind classes with semantic tokens (`bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`).
5. Collapse the redundant double-wrapper anti-pattern into a single `<SectionCard>`.

---

## File Changes

### New files

| File | Purpose |
|------|---------|
| `frontend/src/core/components/composite/StatCard.tsx` | Generic metric tile: colored left border + icon circle + value + sublabel |
| `frontend/src/core/components/composite/SectionCard.tsx` | Generic card shell: header (title + description + view-all CTA) + EmptyState fallback + children slot |
| `frontend/src/core/components/composite/PageStateWrapper.tsx` | Generic loading/error page guard: Spinner state, AlertCircle+retry error state, or children |
| `frontend/src/core/components/composite/IconCircle.tsx` | Colored icon circle: `h-10/h-12 rounded-full` with `bg` + `text` color classes |
| `frontend/src/core/components/composite/ProgressBar.tsx` | Animated progress bar with finance-semantic color variants |
| `frontend/src/core/components/composite/StatusBadge.tsx` | Semantic Badge wrapper: maps `success/warning/danger/neutral` to Badge variants |
| `frontend/src/features/dashboard/constants.ts` | `STAT_CARD_COLORS` — dashboard-specific color configs for each stat variant |

### Modified files

| File | Change |
|------|--------|
| `frontend/src/pages/Dashboard.tsx` | Rewritten: data fetching + stat derivation + layout using new components |

---

## Component APIs

### `IconCircle` (`core/components/composite/IconCircle.tsx`)

```ts
interface IconCircleProps {
  icon: ReactNode
  size?: 'sm' | 'md'       // sm = h-10 w-10, md = h-12 w-12 (default)
  bg: string               // Tailwind bg class, e.g. 'bg-indigo-100'
  color: string            // Tailwind text class, e.g. 'text-indigo-600'
  className?: string
}
```

- Used internally by `StatCard` and directly in list rows and feature pages
- 15 occurrences across 6 pages today — highest-impact extraction

### `ProgressBar` (`core/components/composite/ProgressBar.tsx`)

```ts
type ProgressVariant = 'income' | 'warning' | 'expense' | 'default'

interface ProgressBarProps {
  value: number                  // 0–100
  variant?: ProgressVariant      // defaults to 'default' (primary color)
  className?: string
}
```

- Maps variants to finance semantic tokens: `income` → `bg-income`, `warning` → `bg-warning-finance`, `expense` → `bg-expense`, `default` → `bg-primary`
- Track: `bg-muted rounded-full h-1.5 overflow-hidden`; fill: `h-full transition-all rounded-full {variantColor}`
- `value` is clamped to `[0, 100]` internally
- 5 occurrences across 4 pages today

### `StatusBadge` (`core/components/composite/StatusBadge.tsx`)

```ts
type BadgeStatus = 'success' | 'warning' | 'danger' | 'neutral'

interface StatusBadgeProps {
  status: BadgeStatus
  children: ReactNode
  className?: string
}
```

- Thin semantic wrapper over the existing `Badge` component
- Maps: `success` → `variant="success"`, `warning` → amber classes, `danger` → `variant="destructive"`, `neutral` → `variant="secondary"`
- 7 occurrences of raw inline conditional className strings across 6 pages today

### `PageStateWrapper` (`core/components/composite/PageStateWrapper.tsx`)

```ts
interface PageStateWrapperProps {
  isLoading: boolean
  error?: unknown              // any truthy value triggers error state
  isEmpty?: boolean            // combined with error: only shows error UI when all data is absent
  onRetry?: () => void         // shows retry button when provided
  loadingMessage?: string      // defaults to t('common.loading')
  errorTitle?: string          // defaults to t('common.errorLoadingData')
  errorMessage?: string        // defaults to t('dashboard.errorLoading') / caller-provided
  children: ReactNode
}
```

- Loading state: `bg-background p-8 flex items-center justify-center min-h-[400px]` + centered `Spinner` + message
- Error state (when `error && isEmpty`): same shell + `AlertCircle` + title + message + optional `Button` retry
- Otherwise: renders `children` directly
- Standardizes on Spinner (not skeleton) — per-section skeletons remain at page level where content-specific
- Replaces the two early-return blocks in `Dashboard.tsx` (lines 68–100) and equivalent blocks in GoalsPage, AnalyticPage, OptimizationPage

### `StatCard` (`core/components/composite/StatCard.tsx`)

```ts
interface ColorScheme {
  border: string   // Tailwind border-color class, e.g. 'border-indigo-600'
  iconBg: string   // Tailwind bg class for IconCircle, e.g. 'bg-indigo-100'
  iconText: string // Tailwind text class for IconCircle, e.g. 'text-indigo-600'
}

interface StatCardProps {
  title: string
  value: ReactNode        // accepts CurrencyText, PercentageText, string, or skeleton node
  sublabel?: ReactNode
  icon: ReactNode
  colorScheme: ColorScheme
  loading?: boolean       // when true, renders a pulse skeleton in the value slot
}
```

- Shell: `bg-card border-border rounded-xl shadow-sm overflow-hidden` with `border-l-4 {colorScheme.border}`
- Uses `<IconCircle size="md" bg={colorScheme.iconBg} color={colorScheme.iconText}>` internally
- Label: `text-xs font-semibold uppercase tracking-wide text-muted-foreground`
- Value: `text-3xl font-bold text-foreground`
- Sublabel: `text-xs text-muted-foreground/70 mt-1`

### `SectionCard` (`core/components/composite/SectionCard.tsx`)

```ts
interface SectionCardProps {
  title: string
  description?: string
  onViewAll?: () => void
  viewAllLabel?: string       // defaults to t('dashboard.viewAll')
  isEmpty: boolean
  emptyState: EmptyStateProps // passed through to existing core/EmptyState
  children: ReactNode
  className?: string
}
```

- Renders a single `<Card>` — no outer wrapper div
- `CardAction` (view-all button) shown only when `onViewAll` is provided
- When `isEmpty` is true, renders `<EmptyState {...emptyState}>` instead of `children`
- Eliminates the current double-wrapper anti-pattern

### `features/dashboard/constants.ts`

```ts
import type { ColorScheme } from '@/core/components/composite/StatCard'

export type StatVariant = 'balance' | 'budget' | 'goals' | 'trend'

export const STAT_CARD_COLORS: Record<StatVariant, ColorScheme> = {
  balance: { border: 'border-indigo-600', iconBg: 'bg-indigo-100',    iconText: 'text-indigo-600' },
  budget:  { border: 'border-amber-500',  iconBg: 'bg-amber-100',     iconText: 'text-amber-500'  },
  goals:   { border: 'border-income',     iconBg: 'bg-income-subtle', iconText: 'text-income'     },
  trend:   { border: 'border-violet-600', iconBg: 'bg-violet-100',    iconText: 'text-violet-600' },
}
```

Single file to edit when changing the visual identity of any dashboard stat tile.

---

## Semantic Token Pass

Applied in `Dashboard.tsx` and all new components:

| Old class | Replacement |
|-----------|-------------|
| `bg-gray-50` | `bg-background` |
| `bg-white` (cards) | `bg-card` |
| `border-gray-100` | `border-border` |
| `text-gray-900` | `text-foreground` |
| `text-gray-500`, `text-gray-600` | `text-muted-foreground` |
| `text-gray-400` | `text-muted-foreground/70` |
| `hover:bg-gray-50` | `hover:bg-muted/50` |

Additionally, remove the hardcoded `locale='it-IT'` prop on `CurrencyText` (line 121 in current file).

---

## `Dashboard.tsx` Target Structure (~120 lines)

```tsx
// Data fetching (~20 lines)
// Stat derivation (~15 lines)

return (
  <PageStateWrapper isLoading={isLoading} error={hasError} isEmpty={!accounts.length && !budgets.length && !goals.length} onRetry={refetchAll} errorMessage={t('dashboard.errorLoading')}>
    <div className="space-y-8 p-8 bg-background min-h-full">
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      {/* Stat tiles — rendered from a typed config array */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_CARDS_CONFIG.map(card => <StatCard key={card.variant} ... />)}
      </div>

      {/* Activity panels — inline item renderers as children */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title={t('nav.accounts')} isEmpty={!accounts.length} emptyState={...} onViewAll={...}>
          {accounts.slice(0, 3).map(account => <AccountRow key={account.id} ... />)}
        </SectionCard>

        <SectionCard title={t('nav.budgets')} isEmpty={!budgets?.length} emptyState={...} onViewAll={...}>
          {budgets?.slice(0, 3).map(budget => <BudgetRow key={budget.id} ... />)}
        </SectionCard>

        <SectionCard className="lg:col-span-2" title={t('nav.goals')} isEmpty={!goals?.length} emptyState={...} onViewAll={...}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals?.slice(0, 4).map(goal => <GoalTile key={goal.id} ... />)}
          </div>
        </SectionCard>
      </div>
    </div>
  </PageStateWrapper>
)
```

`AccountRow`, `BudgetRow`, and `GoalTile` are inline sub-components in `Dashboard.tsx` (each ~25–35 lines, used exactly once).

---

## Out of Scope

- Adopting new `core/` components in other pages (AnalyticPage, OptimizationPage, AccountsPage, etc.) — separate refactor tasks per feature
- Adding CSS variables for stat card colors — migratable from TS constants if dark-mode theming becomes a requirement
- New i18n keys — existing keys cover all strings
- Skeleton loading states for `AccountsPage` and `BudgetsPage` — separate concern

---

## Success Criteria

- `npm run build` passes with zero TypeScript errors
- Dashboard renders identically to the current implementation
- `Dashboard.tsx` is ≤150 lines
- All six new `core/` components have no dashboard-specific logic or imports
- All `gray-*` raw color classes removed from `Dashboard.tsx` and new components
