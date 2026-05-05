# Dashboard Refactor — Design Spec

**Date:** 2026-05-05  
**File:** `frontend/src/pages/Dashboard.tsx`  
**SOP:** Frontend Refactoring SOP (CLAUDE.md)

---

## Goal

Apply the Frontend Refactoring SOP to `Dashboard.tsx` (430 lines). Reduce it to a ~40-line layout orchestrator by extracting components, a data hook, and a CSS utility.

---

## New File Structure

```
frontend/src/features/dashboard/
  components/
    DashboardStatCard.tsx
    DashboardAccountsPanel.tsx
    DashboardBudgetsPanel.tsx
    DashboardGoalsPanel.tsx
  hooks/
    useDashboardData.ts
  index.ts

frontend/src/index.css
  @utility stat-card  (new)
```

---

## CSS Utility (`stat-card`)

Added to `frontend/src/index.css` as a Tailwind 4 `@utility`:

```css
@utility stat-card {
  @apply rounded-xl shadow-sm border border-gray-100 bg-white overflow-hidden;
}
```

Replaces the repeated inline class string on every stat card wrapper and activity panel. The `border-l-4` accent color stays inline (varies per card).

---

## `useDashboardData` Hook

**Location:** `frontend/src/features/dashboard/hooks/useDashboardData.ts`

Returns a single object with:

- **Raw data:** `accounts`, `budgets`, `goals`
- **Flags:** `isLoading`, `hasError`, `hasTrendData`, `thisMonthStatsLoading`, `lastMonthStatsLoading`
- **Callbacks:** `refetchAll` (calls refetchAccounts + refetchBudgets + refetchGoals)
- **Derived stats:**
  - `totalBalance: number`
  - `totalBudget: number`, `totalBudgetSpent: number`
  - `activeGoals: number`, `avgGoalProgress: number`
  - `thisMonthNet: number`, `trendPercent: number`, `trendIsPositive: boolean`

All date range calculations and `parseFloat` aggregations live here.

---

## `DashboardStatCard` Component

**Location:** `frontend/src/features/dashboard/components/DashboardStatCard.tsx`

Props:
```ts
interface DashboardStatCardProps {
  label: string;
  value: ReactNode;
  subtext: ReactNode;
  icon: ReactNode;
  accentClass: string;   // e.g. "border-indigo-600"
  iconBgClass: string;   // e.g. "bg-indigo-100"
  iconColorClass: string; // e.g. "text-indigo-600"
}
```

Renders the repeated 5-level nesting (`stat-card` → `border-l-4` → `p-6` → flex row → icon circle) as a single reusable component.

---

## Panel Components

All three panels are **purely presentational** — no hooks inside them.

### `DashboardAccountsPanel`
Props: `accounts`, `navigate`  
Renders: account list (max 3) with balance/change row, empty state.

### `DashboardBudgetsPanel`
Props: `budgets`, `navigate`  
Renders: budget list (max 3) with progress bar, status badge (uses `Badge` component, not inline conditional classes), empty state.

### `DashboardGoalsPanel`
Props: `goals`, `activeGoals`, `navigate`  
Renders: goal cards grid (max 4) with progress bar, empty state.

---

## `Dashboard.tsx` After Refactor

```tsx
export const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const data = useDashboardData();

  if (data.isLoading) return <DashboardLoading />;
  if (data.hasError && !data.accounts.length ...) return <DashboardError onRetry={data.refetchAll} />;

  return (
    <div className="space-y-8 p-8 bg-gray-50 min-h-full">
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard ... />  {/* balance */}
        <DashboardStatCard ... />  {/* budget */}
        <DashboardStatCard ... />  {/* goals */}
        <DashboardStatCard ... />  {/* trend */}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardAccountsPanel accounts={data.accounts} navigate={navigate} />
        <DashboardBudgetsPanel budgets={data.budgets} navigate={navigate} />
        <DashboardGoalsPanel goals={data.goals} activeGoals={data.activeGoals} navigate={navigate} />
      </div>
    </div>
  );
};
```

---

## Bug Fixes Included

- **Double-wrapper removed:** Each activity panel's outer `<div className="rounded-xl…">` + inner `<Card className="border-0 shadow-none…">` collapses to a single `<div className="stat-card">` wrapping the `CardHeader`/`CardBody` content directly. The `Card` component is dropped from these panels.
- **Budget badge:** Inline conditional `className` string replaced with `<Badge variant={…}>`.
- **Semantic tokens:** `text-income`, `text-expense`, `bg-income-subtle` used where the token already exists. `indigo`/`violet`/`amber` kept where no semantic token covers them.

---

## Out of Scope

- No logic changes — only structural reorganisation.
- No new backend calls.
- No changes to `@/api/generated/` files.
