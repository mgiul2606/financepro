# Locale-Aware Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure all monetary amounts and dates across the frontend reflect the user's locale preference (e.g. Italian locale shows `€ 5.474,13` and `02/05/2026`).

**Architecture:** The centralized formatting utilities (`utils/currency.ts`) and atomic components (`CurrencyText`, `DateText`) already exist and read from `PreferencesContext`. The only work is (1) making `formatDate`/`formatDateTime` locale-aware for their default options, and (2) replacing every direct call to `.toLocaleString()`, `.toFixed()` with hardcoded `€`, or `new Intl.*` in feature components with the centralized utilities.

**Tech Stack:** React 19, TypeScript, `Intl.NumberFormat`, `Intl.DateTimeFormat`, `usePreferences()` hook from `@/contexts/PreferencesContext`, `formatCurrency` / `formatDate` / `formatNumber` from `@/utils/currency`.

---

## File Map

| File | Change |
|---|---|
| `frontend/src/utils/currency.ts` | Add `getDefaultDateOptions` helper; update `formatDate` and `formatDateTime` |
| `frontend/src/features/analytic/components/OverviewStats.tsx` | Replace 4 direct number formats with `formatCurrency` |
| `frontend/src/features/analytic/components/ReportCard.tsx` | Replace 3 currency + 2 date-fns calls with `formatCurrency` / `formatDate` |
| `frontend/src/features/assets/pages/AssetsPage.tsx` | Replace 1 `.toLocaleString()` with `formatNumber` |
| `frontend/src/features/optimization/pages/OptimizationPage.tsx` | Replace 9 hardcoded `€` + direct number formats with `formatCurrency` |
| `frontend/src/features/imports/components/SmartImportPreview.tsx` | Replace hardcoded `'it-IT'`/`'EUR'` with `preferences.locale`/`preferences.currency` |

---

## Task 1: Make `formatDate` and `formatDateTime` locale-aware

**Files:**
- Modify: `frontend/src/utils/currency.ts` lines 230–263

- [ ] **Step 1: Add `getDefaultDateOptions` helper above `formatDate`**

  Insert the following function at line 228 (just before the `formatDate` function), replacing the existing comment block:

  ```typescript
  // Returns locale-appropriate default options for date formatting.
  // Numeric locales (it-IT, de-DE, fr-FR, es-ES) use dd/mm/yyyy; others use "Jan 1, 2025".
  const getDefaultDateOptions = (
    locale: SupportedLocale,
    includeTime = false
  ): Intl.DateTimeFormatOptions => {
    const isNumeric = ['it-IT', 'de-DE', 'fr-FR', 'es-ES'].includes(locale);
    if (isNumeric) {
      return includeTime
        ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: '2-digit', year: 'numeric' };
    }
    return includeTime
      ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { year: 'numeric', month: 'short', day: 'numeric' };
  };
  ```

- [ ] **Step 2: Update `formatDate` to use `getDefaultDateOptions`**

  Replace the body of `formatDate` (lines 237–242):

  ```typescript
  // Before:
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj);

  // After:
  return new Intl.DateTimeFormat(locale, {
    ...getDefaultDateOptions(locale),
    ...options,
  }).format(dateObj);
  ```

- [ ] **Step 3: Update `formatDateTime` to use `getDefaultDateOptions`**

  Replace the body of `formatDateTime` (lines 255–262):

  ```typescript
  // Before:
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(dateObj);

  // After:
  return new Intl.DateTimeFormat(locale, {
    ...getDefaultDateOptions(locale, true),
    ...options,
  }).format(dateObj);
  ```

- [ ] **Step 4: Verify build**

  ```
  cd frontend && npm run build
  ```
  Expected: no TypeScript errors related to `currency.ts`.

- [ ] **Step 5: Manual spot-check**

  Open browser devtools console and run:
  ```javascript
  // Simulating what formatDate('2026-05-02', 'it-IT') produces:
  new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date('2026-05-02'))
  // Expected: "02/05/2026"

  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date('2026-05-02'))
  // Expected: "May 2, 2026"
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add frontend/src/utils/currency.ts
  git commit -m "feat: make formatDate/formatDateTime locale-aware (it-IT uses dd/mm/yyyy)"
  ```

---

## Task 2: Fix `OverviewStats.tsx`

**Files:**
- Modify: `frontend/src/features/analytic/components/OverviewStats.tsx`

- [ ] **Step 1: Add imports**

  At the top of the file, after the existing imports, add:

  ```typescript
  import { usePreferences } from '@/contexts/PreferencesContext';
  import { formatCurrency } from '@/utils/currency';
  ```

- [ ] **Step 2: Add `usePreferences` and format helper to `OverviewStats`**

  Inside `OverviewStats` component (line 70, after `const { t } = useTranslation();`), add:

  ```typescript
  const { preferences } = usePreferences();
  const fmt = (v: number) => formatCurrency(v, preferences.currency, preferences.locale);
  ```

- [ ] **Step 3: Replace direct number formatting in JSX**

  Replace:
  ```tsx
  value={overview.totalSpent.toLocaleString()}
  ```
  With:
  ```tsx
  value={fmt(overview.totalSpent)}
  ```

  Replace:
  ```tsx
  value={overview.totalIncome.toLocaleString()}
  ```
  With:
  ```tsx
  value={fmt(overview.totalIncome)}
  ```

  Replace:
  ```tsx
  value={overview.netBalance.toLocaleString()}
  ```
  With:
  ```tsx
  value={fmt(overview.netBalance)}
  ```

  Replace:
  ```tsx
  value={overview.averageDaily.toFixed(2)}
  ```
  With:
  ```tsx
  value={fmt(overview.averageDaily)}
  ```

- [ ] **Step 4: Verify build**

  ```
  cd frontend && npm run build
  ```
  Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/features/analytic/components/OverviewStats.tsx
  git commit -m "fix: use locale-aware formatting in OverviewStats"
  ```

---

## Task 3: Fix `ReportCard.tsx`

**Files:**
- Modify: `frontend/src/features/analytic/components/ReportCard.tsx`

- [ ] **Step 1: Update imports**

  Remove the `date-fns` import:
  ```typescript
  // Remove this line:
  import { format } from 'date-fns';
  ```

  Add the locale-aware utilities and preferences hook:
  ```typescript
  import { usePreferences } from '@/contexts/PreferencesContext';
  import { formatCurrency, formatDate } from '@/utils/currency';
  ```

- [ ] **Step 2: Add `usePreferences` and helpers inside `ReportCard`**

  Inside `ReportCard` component (line 28, after `const { t } = useTranslation();`), add:

  ```typescript
  const { preferences } = usePreferences();
  const fmt = (v: number) => formatCurrency(v, preferences.currency, preferences.locale);
  ```

- [ ] **Step 3: Replace date-fns date range with `formatDate`**

  Replace (lines 50–52):
  ```tsx
  {format(new Date(report.period.from), 'dd MMM yyyy')} -{' '}
  {format(new Date(report.period.to), 'dd MMM yyyy')}
  ```
  With:
  ```tsx
  {formatDate(report.period.from, preferences.locale)} -{' '}
  {formatDate(report.period.to, preferences.locale)}
  ```

- [ ] **Step 4: Replace currency `.toLocaleString()` calls**

  Replace (line 58):
  ```tsx
  {report.summary.totalIncome.toLocaleString()}
  ```
  With:
  ```tsx
  {fmt(report.summary.totalIncome)}
  ```

  Replace (line 64):
  ```tsx
  {report.summary.totalExpenses.toLocaleString()}
  ```
  With:
  ```tsx
  {fmt(report.summary.totalExpenses)}
  ```

  Replace (line 74):
  ```tsx
  {isPositive ? '+' : ''}{report.summary.netSavings.toLocaleString()}
  ```
  With:
  ```tsx
  {isPositive ? '+' : ''}{fmt(report.summary.netSavings)}
  ```

- [ ] **Step 5: Verify build**

  ```
  cd frontend && npm run build
  ```
  Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

  ```bash
  git add frontend/src/features/analytic/components/ReportCard.tsx
  git commit -m "fix: use locale-aware formatting in ReportCard, remove date-fns dependency"
  ```

---

## Task 4: Fix `AssetsPage.tsx`

**Files:**
- Modify: `frontend/src/features/assets/pages/AssetsPage.tsx`

- [ ] **Step 1: Update imports**

  The file already imports `SupportedCurrency` from `@/utils/currency` (line 28). Add `formatNumber` to that import:

  ```typescript
  // Before:
  import { SupportedCurrency } from '@/utils/currency';

  // After:
  import { SupportedCurrency, formatNumber } from '@/utils/currency';
  ```

  Add `usePreferences` import:
  ```typescript
  import { usePreferences } from '@/contexts/PreferencesContext';
  ```

- [ ] **Step 2: Add `usePreferences` in the component**

  Find the main component function body and add (after existing hooks):
  ```typescript
  const { preferences } = usePreferences();
  ```

- [ ] **Step 3: Replace `.toLocaleString()` on line 368**

  Replace:
  ```tsx
  {parseFloat(asset.quantity).toLocaleString()}
  ```
  With:
  ```tsx
  {formatNumber(parseFloat(asset.quantity), preferences.locale, { minimumFractionDigits: 0, maximumFractionDigits: 8 })}
  ```
  (8 decimal places covers crypto quantities; the existing `formatNumber` sanitizes the range safely.)

- [ ] **Step 4: Verify build**

  ```
  cd frontend && npm run build
  ```
  Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/features/assets/pages/AssetsPage.tsx
  git commit -m "fix: use locale-aware number formatting for asset quantity"
  ```

---

## Task 5: Fix `OptimizationPage.tsx`

**Files:**
- Modify: `frontend/src/features/optimization/pages/OptimizationPage.tsx`

- [ ] **Step 1: Add imports**

  Add at the top of the file (after existing imports):
  ```typescript
  import { usePreferences } from '@/contexts/PreferencesContext';
  import { formatCurrency } from '@/utils/currency';
  ```

- [ ] **Step 2: Add `usePreferences` and format helper in the component**

  Inside `OptimizationPage` (after `const [activeTab, setActiveTab] = useState('overview');`, around line 25), add:
  ```typescript
  const { preferences } = usePreferences();
  const fmt = (v: number, opts?: Intl.NumberFormatOptions) =>
    formatCurrency(v, preferences.currency, preferences.locale, opts);
  ```

- [ ] **Step 3: Replace all hardcoded `€` + direct number formatting (Stats Grid)**

  Replace (line 102):
  ```tsx
  €{overview.totalPotentialSavings.toLocaleString()}
  ```
  With:
  ```tsx
  {fmt(overview.totalPotentialSavings)}
  ```

  Replace (line 105):
  ```tsx
  €{overview.monthlySavingsOpportunity.toFixed(2)}{t('optimization.perMonth')}
  ```
  With:
  ```tsx
  {fmt(overview.monthlySavingsOpportunity)}{t('optimization.perMonth')}
  ```

  Replace (line 140):
  ```tsx
  €{overview.wasteDetected.totalWastedAmount.toFixed(2)}
  ```
  With:
  ```tsx
  {fmt(overview.wasteDetected.totalWastedAmount)}
  ```

  Replace (line 159):
  ```tsx
  €{overview.totalSavedToDate.toLocaleString()}
  ```
  With:
  ```tsx
  {fmt(overview.totalSavedToDate)}
  ```

- [ ] **Step 4: Replace hardcoded `€` in Duplicates section**

  Replace (line 389):
  ```tsx
  €{duplicate.potentialSaving.toFixed(2)}
  ```
  With:
  ```tsx
  {fmt(duplicate.potentialSaving)}
  ```

  Replace (line 403):
  ```tsx
  €{service.amount.toFixed(2)}
  ```
  With:
  ```tsx
  {fmt(service.amount)}
  ```

- [ ] **Step 5: Replace hardcoded `€` in Alternatives section**

  Replace (line 491):
  ```tsx
  €{alternative.yearlyProjection.toFixed(0)}
  ```
  With:
  ```tsx
  {fmt(alternative.yearlyProjection, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
  ```

  Replace (line 503):
  ```tsx
  €{alternative.currentAmount.toFixed(2)}{t('optimization.perMonth')}
  ```
  With:
  ```tsx
  {fmt(alternative.currentAmount)}{t('optimization.perMonth')}
  ```

  Replace (line 517):
  ```tsx
  €{alternative.suggestedAmount.toFixed(2)}{t('optimization.perMonth')}
  ```
  With:
  ```tsx
  {fmt(alternative.suggestedAmount)}{t('optimization.perMonth')}
  ```

- [ ] **Step 6: Verify build**

  ```
  cd frontend && npm run build
  ```
  Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

  ```bash
  git add frontend/src/features/optimization/pages/OptimizationPage.tsx
  git commit -m "fix: replace hardcoded € and direct number formatting in OptimizationPage"
  ```

---

## Task 6: Fix `SmartImportPreview.tsx`

**Files:**
- Modify: `frontend/src/features/imports/components/SmartImportPreview.tsx`

- [ ] **Step 1: Add imports**

  Add at the top of the file (after existing imports):
  ```typescript
  import { usePreferences } from '@/contexts/PreferencesContext';
  import { formatCurrency } from '@/utils/currency';
  ```

- [ ] **Step 2: Add `usePreferences` in the component**

  Inside `SmartImportPreview` component body (after the existing `useState` hooks, around line 40+), add:
  ```typescript
  const { preferences } = usePreferences();
  ```

- [ ] **Step 3: Replace the hardcoded `formatAmount` function (lines 119–125)**

  Replace:
  ```typescript
  const formatAmount = (amount: number) => {
    const displayAmount = invertAmounts ? -amount : amount;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(displayAmount);
  };
  ```
  With:
  ```typescript
  const formatAmount = (amount: number) => {
    const displayAmount = invertAmounts ? -amount : amount;
    return formatCurrency(displayAmount, preferences.currency, preferences.locale);
  };
  ```

- [ ] **Step 4: Verify build**

  ```
  cd frontend && npm run build
  ```
  Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/features/imports/components/SmartImportPreview.tsx
  git commit -m "fix: use user locale/currency in SmartImportPreview instead of hardcoded it-IT/EUR"
  ```

---

## Task 7: End-to-end browser verification

- [ ] **Step 1: Start the dev server**

  ```
  cd frontend && npm run dev
  ```

- [ ] **Step 2: Set locale to `it-IT` and currency to `EUR` in Settings**

  Navigate to Settings → Locale: "Italian (Italy)" → Currency: "EUR (€)" → Save.

- [ ] **Step 3: Verify each fixed area**

  | Page / Component | Expected output |
  |---|---|
  | Analytics → Overview stats | `€ 5.474,13` style (dot thousands, comma decimal) |
  | Analytics → Report cards | amounts show `€ X.XXX,XX`; dates show `02/05/2026` |
  | Assets → asset detail | quantity uses comma decimal (e.g. `1.234,56789`) |
  | Optimization → overview cards | all amounts show `€ X.XXX,XX`, no hardcoded `€` |
  | Optimization → duplicates list | saving amounts use Italian format |
  | Optimization → alternatives | yearly projection shows `€ X.XXX` (no decimals) |
  | Import → preview table | amounts show `€ X.XXX,XX` |

- [ ] **Step 4: Switch locale to `en-US` and verify**

  Navigate to Settings → Locale: "English (United States)".
  All amounts should switch to `$1,234.56` style; dates to `May 2, 2026`.

- [ ] **Step 5: Final commit if any last fixes were needed**

  ```bash
  git add -p
  git commit -m "fix: final locale formatting adjustments from browser verification"
  ```
