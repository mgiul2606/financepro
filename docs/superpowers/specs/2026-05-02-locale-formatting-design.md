# Locale-Aware Formatting — Design Spec

**Date:** 2026-05-02  
**Scope:** Frontend only  
**Goal:** Ensure all amounts and dates across the application reflect the locale selected by the user in Settings, with no exceptions.

---

## Background

The infrastructure for locale-aware formatting already exists:

- `PreferencesContext` stores `locale` (e.g. `it-IT`) and `currency` (e.g. `EUR`) in `localStorage`
- `utils/currency.ts` exposes `formatCurrency`, `formatDate`, `formatDateTime`, etc. via `Intl.NumberFormat` / `Intl.DateTimeFormat`
- Atomic components `<CurrencyText>`, `<DateText>`, `<NumberText>`, `<PercentageText>` read from `usePreferences()` automatically

The problem is **inconsistency**: some feature components bypass the utility layer and call `.toLocaleString()` directly or hardcode currency symbols (`€`, `$`), so their output ignores the user's locale preference.

---

## Architecture

No new abstractions are introduced. The existing layer is the target state:

```
PreferencesContext  (locale + currency)
        ↓
utils/currency.ts   (formatCurrency, formatDate, …)
        ↓
<CurrencyText>  <DateText>  <NumberText>  <PercentageText>
        ↓
Feature components (transactions, budgets, assets, dashboard, …)
```

Work is in two parts:
1. Fix the **date format mapping** in `utils/currency.ts` to be locale-aware
2. **Audit + replace** every direct formatting call in feature components

---

## Part 1 — Locale-Aware Date Format Mapping

`formatDate` currently uses a single default (`{ year: 'numeric', month: 'short', day: 'numeric' }`) for all locales.

Add a locale-aware default mapping inside `formatDate` and `formatDateTime`:

| `format` value | `it-IT` output | `Intl.DateTimeFormat` options |
|---|---|---|
| `'date'` | `02/05/2026` | `{ day: '2-digit', month: '2-digit', year: 'numeric' }` |
| `'datetime'` | `02/05/2026, 14:30` | above + `{ hour: '2-digit', minute: '2-digit' }` |
| `'time'` | `14:30` | `{ hour: '2-digit', minute: '2-digit' }` |
| `'relative'` | `2 giorni fa` | `Intl.RelativeTimeFormat('it-IT')` — already works |

Other locales (`en-US`, `en-GB`, etc.) keep the existing default (`Mar 15, 2025`).

Components that need the full date for detail views pass `options={{ day: 'numeric', month: 'long', year: 'numeric' }}` explicitly — this is already supported and needs no change.

**Implementation:** Add a `getDefaultDateOptions(locale, includeTime)` helper inside `utils/currency.ts` that returns the correct `Intl.DateTimeFormat` options based on locale. The function is not exported; it is only used by `formatDate` and `formatDateTime`.

---

## Part 2 — Audit and Fix Direct Formatting Calls

### Search Patterns

Run a codebase-wide search (excluding `utils/currency.ts`, `api/generated/`, `*.test.*`, `*.spec.*`) for:

| Pattern | Reason |
|---|---|
| `.toLocaleString(` | Direct locale formatting, ignores user preference |
| `new Intl.NumberFormat` | Bypasses `formatCurrency` / `formatNumber` |
| `new Intl.DateTimeFormat` | Bypasses `formatDate` / `formatDateTime` |
| Hardcoded `'€'`, `'$'`, `'£'` in JSX / template literals | Ignores selected currency |

### Fix Strategy

**In JSX (rendering a value):**
```tsx
// Before
<span>{value.toLocaleString()}</span>

// After
<CurrencyText value={value} />
// or
<DateText value={date} />
```

**In non-JSX callbacks (chart tooltips, labels, export):**
```ts
// Before
value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

// After
const { preferences } = usePreferences()
formatCurrency(value, preferences.currency, preferences.locale)
```

When `usePreferences()` is not available (pure utility context), accept `locale` and `currency` as parameters from the caller.

### Known Files to Fix (non-exhaustive)

- `features/analytic/components/OverviewStats.tsx`
- `features/assets/pages/AssetsPage.tsx`
- `features/optimization/pages/OptimizationPage.tsx`
- `pages/Dashboard.tsx` (and sub-components)
- `features/transactions/` components

Additional files will be discovered during the audit phase.

---

## Testing Approach

After implementation, manually verify in the browser with locale set to `it-IT` / `EUR`:

- [ ] Dashboard KPI cards show `€ 5.474,13` style amounts
- [ ] Transaction list dates show `02/05/2026`
- [ ] Transaction detail dates show `2 maggio 2026` (where long format is used)
- [ ] Budget progress amounts use Italian separators
- [ ] Chart axis labels and tooltips use Italian separators
- [ ] Switching locale in Settings to `en-US` immediately updates all formatted values
- [ ] No hardcoded `€` symbols remain outside `utils/currency.ts`

---

## Out of Scope

- Backend formatting (PDF reports, CSV export, emails)
- Adding new locale support beyond what `PreferencesContext` already defines
- ESLint rules to enforce the pattern (deferred)
