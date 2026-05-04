---
title: Design System Refactoring — Standardize on shadcn/ui
date: 2026-05-04
status: approved
---

# Design System Refactoring

## Problem

The frontend has two parallel component systems used inconsistently across pages:

- **shadcn/ui** (`src/components/ui/`) — used in TransactionsPage, AccountsPage
- **Custom core** (`src/core/components/atomic/`) — used in BudgetsPage, GoalsPage, AnalyticPage

These systems have incompatible APIs (`variant="primary"` vs `variant="outline"`), different props (`leftIcon` vs no icon support), and different visual outputs (different shadows, radii, border colors). Pages also bypass both systems with hardcoded Tailwind colors (`bg-emerald-600`, `text-gray-500`) instead of using the CSS variables already defined in `index.css`.

## Decision

Standardize on **shadcn/ui** as the single component library, extended with finance-specific semantic variants. Remove `src/core/components/atomic/`. Keep composite components (`PageHeader`, `DataTable`, `EmptyState`, charts) but rewrite them internally using shadcn primitives.

## Architecture

### Layer 1 — Design Tokens (`index.css`)

Clean up `index.css` to a single color system (OKLch, already the newer one). Add a second layer of **finance semantic tokens** on top:

```css
:root {
  --color-income: oklch(...);      /* green family — entrate */
  --color-expense: oklch(...);     /* rose family — uscite */
  --color-warning: oklch(...);     /* amber family — budget in scadenza */
  --color-neutral-muted: oklch(...); /* gray family — elementi secondari */
}
```

These are exposed as Tailwind utilities via `@layer utilities`:
```css
.bg-income   { background-color: var(--color-income); }
.text-income { color: var(--color-income); }
/* etc. */
```

Pages write `bg-income` instead of `bg-emerald-600`. Changing the income color requires touching one variable.

### Layer 2 — Extended shadcn Components (`src/components/ui/`)

Extend existing shadcn components with variants missing for finance use:

**Badge** — add `success`, `warning`, `info` variants (shadcn has only `default`, `secondary`, `outline`, `destructive`):
```tsx
<Badge variant="success">+€1.200</Badge>
<Badge variant="warning">80% budget</Badge>
<Badge variant="info">Ricorrente</Badge>
```

**Button** — add `leftIcon`, `rightIcon`, `isLoading`, `fullWidth` props:
```tsx
<Button variant="default" leftIcon={<PlusIcon />} isLoading={saving}>
<Button variant="destructive" fullWidth>
```

**Card** — add `elevated` and `bordered` variants via CVA so pages migrating from core Card keep the same semantics, just a different import:
```tsx
<Card variant="elevated">   /* shadow-md */
<Card variant="bordered">   /* border-2 */
```

All extensions use CVA consistently with the existing shadcn pattern.

### Layer 3 — Finance Color Utilities (`src/lib/finance-colors.ts`)

Centralize all dynamic color logic that today is scattered as `getProgressColor()` functions in individual pages:

```ts
export function getProgressVariant(pct: number): 'success' | 'warning' | 'destructive' {
  if (pct >= 100) return 'destructive';
  if (pct >= 80) return 'warning';
  return 'success';
}

export function getAmountVariant(amount: number): 'income' | 'expense' {
  return amount >= 0 ? 'income' : 'expense';
}
```

Returns semantic variant names, not raw Tailwind strings. Components apply the variant, not the color.

### Layer 4 — Composite Components (`src/core/components/composite/`)

`PageHeader`, `DataTable`, `EmptyState`, `AreaChart`, `BarChart`, `LineChart`, `PieChart` are **kept as the recommended page-level API** but rewritten internally to use shadcn primitives. No API changes for consumers.

## Migration Scope

### Phase 1 — Infrastructure (no page changes)
- Clean `index.css`: one color system + finance semantic tokens
- Extend `src/components/ui/badge.tsx` with `success`/`warning`/`info`
- Extend `src/components/ui/button.tsx` with `leftIcon`/`rightIcon`/`isLoading`/`fullWidth`
- Extend `src/components/ui/card.tsx` with `elevated`/`bordered`
- Create `src/lib/finance-colors.ts`

### Phase 2 — Page Migration
Migrate from `src/core/components/atomic/` to shadcn imports:

| Page | Components to migrate |
|------|----------------------|
| `BudgetsPage.tsx` + `BudgetDetailsModal.tsx` | Button, Card, Badge, progress colors |
| `GoalsPage.tsx` | Button, Card, Badge, progress colors |
| `AnalyticPage.tsx` | Card, Badge, status colors |
| `OptimizationPage.tsx` | Card, Badge |
| `Dashboard.tsx` | Card, Badge |
| `Sidebar.tsx` | Button, Badge |

Replace all hardcoded Tailwind colors (`bg-emerald-600`, `text-gray-500`, etc.) with design tokens or finance-colors utilities.

### Phase 3 — Cleanup
- Delete `src/core/components/atomic/` directory
- Update composite components to use shadcn primitives internally
- Verify `npm run build` passes with zero TypeScript errors

## Out of Scope
- `src/api/generated/` — never modify generated files
- `src/components/ui/` shadcn internals — extend only, never rewrite
- Backend, OpenAPI, Orval pipeline

## Success Criteria
1. `npm run build` passes with zero TypeScript errors
2. All pages import components only from `src/components/ui/` or `src/core/components/composite/`
3. No hardcoded Tailwind color classes (`bg-emerald-*`, `text-gray-*`, `bg-rose-*`, etc.) outside of `index.css`
4. `src/core/components/atomic/` directory does not exist
5. Visual output is consistent across all pages (same button styles, same card styles, same badge styles)
