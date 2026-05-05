# Dashboard Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Frontend Refactoring SOP to `Dashboard.tsx` — extract 6 reusable `core/` components, add a dashboard color constants file, and rewrite Dashboard.tsx to use them all.

**Architecture:** Six new generic components live in `frontend/src/core/components/composite/` with no dashboard-specific knowledge. Dashboard-specific color config lives in `frontend/src/features/dashboard/constants.ts`. Dashboard.tsx becomes a pure orchestration file (~120 lines) using these components.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS 4, `class-variance-authority`, `clsx`/`cn`, react-i18next, Lucide React, shadcn/ui Card + Badge + Button + Spinner.

---

## File Map

| Action | File |
|--------|------|
| Create | `frontend/src/core/components/composite/IconCircle.tsx` |
| Create | `frontend/src/core/components/composite/ProgressBar.tsx` |
| Create | `frontend/src/core/components/composite/StatusBadge.tsx` |
| Create | `frontend/src/core/components/composite/PageStateWrapper.tsx` |
| Create | `frontend/src/core/components/composite/StatCard.tsx` |
| Create | `frontend/src/core/components/composite/SectionCard.tsx` |
| Create | `frontend/src/features/dashboard/constants.ts` |
| Rewrite | `frontend/src/pages/Dashboard.tsx` |

---

## Task 1: `IconCircle`

Generic colored icon container. Used by `StatCard` and directly in account list rows.

**Files:**
- Create: `frontend/src/core/components/composite/IconCircle.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/core/components/composite/IconCircle.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface IconCircleProps {
  icon: ReactNode;
  size?: 'sm' | 'md';
  bg: string;
  color: string;
  className?: string;
}

export const IconCircle = ({ icon, size = 'md', bg, color, className }: IconCircleProps) => (
  <div
    className={cn(
      'rounded-full flex items-center justify-center shrink-0',
      size === 'sm' ? 'h-10 w-10' : 'h-12 w-12',
      bg,
      className
    )}
  >
    <div className={color}>{icon}</div>
  </div>
);
```

> `size="sm"` = `h-10 w-10` (list rows), `size="md"` = `h-12 w-12` (stat cards). The inner `div` with `color` class propagates `currentColor` to Lucide SVG icons.

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/core/components/composite/IconCircle.tsx
git commit -m "feat(core): add IconCircle component"
```

---

## Task 2: `ProgressBar`

Generic progress bar with finance-semantic color variants.

**Files:**
- Create: `frontend/src/core/components/composite/ProgressBar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/core/components/composite/ProgressBar.tsx
import { cn } from '@/lib/utils';

export type ProgressVariant = 'income' | 'warning' | 'expense' | 'brand' | 'default';

const FILL_CLASSES: Record<ProgressVariant, string> = {
  income: 'bg-income',
  warning: 'bg-warning-finance',
  expense: 'bg-expense',
  brand: 'bg-indigo-600',
  default: 'bg-primary',
};

interface ProgressBarProps {
  value: number;
  variant?: ProgressVariant;
  className?: string;
}

export const ProgressBar = ({ value, variant = 'default', className }: ProgressBarProps) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('w-full h-1.5 bg-muted rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full transition-all rounded-full', FILL_CLASSES[variant])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
```

> `brand` variant uses `bg-indigo-600` to match the existing goal progress bar color. `ProgressVariant` is exported so callers can type their variant variables.

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/core/components/composite/ProgressBar.tsx
git commit -m "feat(core): add ProgressBar component"
```

---

## Task 3: `StatusBadge`

Semantic wrapper over the existing `Badge` component. Maps `success/warning/danger/neutral` status values to Badge variants, replacing 7 instances of raw inline conditional className strings across the codebase.

**Files:**
- Create: `frontend/src/core/components/composite/StatusBadge.tsx`

> The existing `Badge` component (`frontend/src/components/ui/badge.tsx`) already has `success`, `warning`, `destructive`, `secondary` variants — no Badge changes needed.

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/core/components/composite/StatusBadge.tsx
import { ReactNode } from 'react';
import { Badge, badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

export type BadgeStatus = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusBadgeProps {
  status: BadgeStatus;
  children: ReactNode;
  className?: string;
}

const STATUS_TO_VARIANT: Record<BadgeStatus, NonNullable<VariantProps<typeof badgeVariants>['variant']>> = {
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
  neutral: 'secondary',
};

export const StatusBadge = ({ status, children, className }: StatusBadgeProps) => (
  <Badge variant={STATUS_TO_VARIANT[status]} className={className}>
    {children}
  </Badge>
);
```

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/core/components/composite/StatusBadge.tsx
git commit -m "feat(core): add StatusBadge component"
```

---

## Task 4: `PageStateWrapper`

Generic loading/error page guard. Replaces the two early-return blocks in Dashboard.tsx (lines 68–100) and equivalent patterns in GoalsPage, AnalyticPage, OptimizationPage.

**Files:**
- Create: `frontend/src/core/components/composite/PageStateWrapper.tsx`

> All required i18n keys exist in `it.json`: `common.loading`, `common.errorLoadingData`, `common.errorLoadingDataDesc`, `common.retry`.

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/core/components/composite/PageStateWrapper.tsx
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

interface PageStateWrapperProps {
  isLoading: boolean;
  error?: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  children: ReactNode;
}

const stateShell = 'p-8 flex items-center justify-center min-h-[400px] bg-background';

export const PageStateWrapper = ({
  isLoading,
  error,
  isEmpty = true,
  onRetry,
  loadingMessage,
  errorTitle,
  errorMessage,
  children,
}: PageStateWrapperProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className={stateShell}>
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">{loadingMessage ?? t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && isEmpty) {
    return (
      <div className={stateShell}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-expense mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {errorTitle ?? t('common.errorLoadingData')}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {errorMessage ?? t('common.errorLoadingDataDesc')}
          </p>
          {onRetry && (
            <Button variant="default" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
              {t('common.retry')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
```

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/core/components/composite/PageStateWrapper.tsx
git commit -m "feat(core): add PageStateWrapper component"
```

---

## Task 5: `StatCard`

Generic metric tile with a colored left border, `IconCircle`, large value, and sublabel. Uses `IconCircle` from Task 1.

**Files:**
- Create: `frontend/src/core/components/composite/StatCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/core/components/composite/StatCard.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconCircle } from './IconCircle';

export interface ColorScheme {
  border: string;
  iconBg: string;
  iconText: string;
}

interface StatCardProps {
  title: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon: ReactNode;
  colorScheme: ColorScheme;
  loading?: boolean;
}

export const StatCard = ({ title, value, sublabel, icon, colorScheme, loading }: StatCardProps) => (
  <div className="rounded-xl shadow-sm border border-border bg-card overflow-hidden">
    <div className={cn('border-l-4 h-full', colorScheme.border)}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {title}
            </p>
            {loading ? (
              <div className="h-9 w-20 bg-muted rounded animate-pulse mt-1" />
            ) : (
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            )}
            {sublabel && <p className="text-xs text-muted-foreground/70 mt-1">{sublabel}</p>}
          </div>
          <IconCircle icon={icon} size="md" bg={colorScheme.iconBg} color={colorScheme.iconText} />
        </div>
      </div>
    </div>
  </div>
);
```

> `ColorScheme` is exported so `features/dashboard/constants.ts` can import the type. `loading` renders a skeleton pulse instead of the value slot — used for the trend card while month stats are fetching.

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/core/components/composite/StatCard.tsx
git commit -m "feat(core): add StatCard component"
```

---

## Task 6: `SectionCard`

Generic card shell: header (title + description + optional "view all" CTA) + `EmptyState` fallback + children slot. The `Card` component default variant already provides `rounded-xl border shadow-sm bg-card py-6`, so no outer wrapper div is needed.

**Files:**
- Create: `frontend/src/core/components/composite/SectionCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/core/components/composite/SectionCard.tsx
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from './EmptyState';
import type { EmptyStateProps } from './EmptyState';

interface SectionCardProps {
  title: string;
  description?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
  isEmpty: boolean;
  emptyState: EmptyStateProps;
  children: ReactNode;
  className?: string;
}

export const SectionCard = ({
  title,
  description,
  onViewAll,
  viewAllLabel,
  isEmpty,
  emptyState,
  children,
  className,
}: SectionCardProps) => {
  const { t } = useTranslation();
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {onViewAll && (
          <CardAction>
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              {viewAllLabel ?? t('dashboard.viewAll')}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardBody>
        {isEmpty ? <EmptyState {...emptyState} /> : children}
      </CardBody>
    </Card>
  );
};
```

> `EmptyStateProps` must be exported from `EmptyState.tsx`. Check `frontend/src/core/components/composite/EmptyState.tsx` — the interface is currently exported as `export interface EmptyStateProps`. No change needed.

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/core/components/composite/SectionCard.tsx
git commit -m "feat(core): add SectionCard component"
```

---

## Task 7: Dashboard color constants

Centralizes all stat card color configs. Single file to edit for dashboard palette changes.

**Files:**
- Create: `frontend/src/features/dashboard/constants.ts`

- [ ] **Step 1: Create the feature directory and constants file**

```bash
mkdir -p frontend/src/features/dashboard
```

```ts
// frontend/src/features/dashboard/constants.ts
import type { ColorScheme } from '@/core/components/composite/StatCard';

export type StatVariant = 'balance' | 'budget' | 'goals' | 'trend';

export const STAT_CARD_COLORS: Record<StatVariant, ColorScheme> = {
  balance: { border: 'border-indigo-600', iconBg: 'bg-indigo-100',    iconText: 'text-indigo-600' },
  budget:  { border: 'border-amber-500',  iconBg: 'bg-amber-100',     iconText: 'text-amber-500'  },
  goals:   { border: 'border-income',     iconBg: 'bg-income-subtle', iconText: 'text-income'     },
  trend:   { border: 'border-violet-600', iconBg: 'bg-violet-100',    iconText: 'text-violet-600' },
};
```

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/dashboard/constants.ts
git commit -m "feat(dashboard): add STAT_CARD_COLORS constants"
```

---

## Task 8: Rewrite `Dashboard.tsx`

Replace the 430-line file with a ~130-line orchestration file using all new components. Three inline sub-components (`AccountRow`, `BudgetRow`, `GoalTile`) handle item rendering — they are used exactly once and have no reuse value in separate files.

**Files:**
- Rewrite: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
// frontend/src/pages/Dashboard.tsx
import { Wallet, Target, PiggyBank, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { StatCard } from '@/core/components/composite/StatCard';
import { SectionCard } from '@/core/components/composite/SectionCard';
import { PageStateWrapper } from '@/core/components/composite/PageStateWrapper';
import { ProgressBar } from '@/core/components/composite/ProgressBar';
import { StatusBadge } from '@/core/components/composite/StatusBadge';
import { IconCircle } from '@/core/components/composite/IconCircle';
import { Badge } from '@/components/ui/badge';
import { CurrencyText, PercentageText } from '@/core/components/formatters';
import { useAccounts } from '@/features/accounts';
import { useBudgets } from '@/features/budgets';
import { useGoals } from '@/features/goals';
import { useTransactionStats } from '@/features/transactions';
import { STAT_CARD_COLORS } from '@/features/dashboard/constants';
import type { AccountResponse, BudgetResponse, FinancialGoalResponse } from '@/api/generated/models';
import type { SupportedCurrency } from '@/utils/currency';

// --- Inline item renderers ---

const AccountRow = ({ account, onClick }: { account: AccountResponse; onClick: () => void }) => {
  const { t } = useTranslation();
  const balance = parseFloat(account.currentBalance);
  const change = balance - parseFloat(account.initialBalance);
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <IconCircle icon={<Wallet className="h-5 w-5" />} size="sm" bg="bg-indigo-100" color="text-indigo-600" />
        <div>
          <p className="font-medium text-foreground">{account.name}</p>
          <p className="text-sm text-muted-foreground">{account.currency} {t('dashboard.account')}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-foreground">
          <CurrencyText value={balance} currency={account.currency as SupportedCurrency} />
        </p>
        <div className="flex items-center gap-1 text-xs justify-end">
          {change >= 0 ? (
            <><ArrowUpRight className="h-3 w-3 text-income" /><CurrencyText value={change} showSign colorCoded className="text-income" /></>
          ) : (
            <><ArrowDownRight className="h-3 w-3 text-expense" /><CurrencyText value={change} colorCoded className="text-expense" /></>
          )}
        </div>
      </div>
    </div>
  );
};

const BudgetRow = ({ budget, onClick }: { budget: BudgetResponse; onClick: () => void }) => {
  const pct = (parseFloat(budget.totalSpent || '0') / (parseFloat(budget.totalAmount) || 1)) * 100;
  const status = pct >= 100 ? 'danger' as const : pct >= 80 ? 'warning' as const : 'success' as const;
  const variant = pct >= 100 ? 'expense' as const : pct >= 80 ? 'warning' as const : 'income' as const;
  return (
    <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-foreground">{budget.name}</p>
          <p className="text-xs text-muted-foreground">{budget.periodType}</p>
        </div>
        <StatusBadge status={status}>
          <PercentageText value={pct} decimals={0} />
        </StatusBadge>
      </div>
      <ProgressBar value={pct} variant={variant} />
    </div>
  );
};

const GoalTile = ({ goal, onClick }: { goal: FinancialGoalResponse; onClick: () => void }) => {
  const { t } = useTranslation();
  const pct = ((parseFloat(goal.currentAmount) || 0) / (parseFloat(goal.targetAmount) || 1)) * 100;
  return (
    <div
      className="p-4 rounded-xl border border-border hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-foreground">{goal.name}</p>
          <p className="text-xs text-muted-foreground">{goal.goalType}</p>
        </div>
        <Badge variant={goal.status === 'completed' ? 'success' : 'info'}>{goal.status}</Badge>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('dashboard.progress')}</span>
          <span className="font-semibold text-indigo-600"><PercentageText value={pct} decimals={1} /></span>
        </div>
        <ProgressBar value={pct} variant="brand" />
        <div className="flex justify-between text-xs text-muted-foreground/70">
          <CurrencyText value={parseFloat(goal.currentAmount) || 0} currency={goal.currency as SupportedCurrency} options={{ maximumFractionDigits: 0 }} />
          <CurrencyText value={parseFloat(goal.targetAmount) || 0} currency={goal.currency as SupportedCurrency} options={{ maximumFractionDigits: 0 }} />
        </div>
      </div>
    </div>
  );
};

// --- Page ---

export const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { accounts, isLoading: accountsLoading, error: accountsError, refetch: refetchAccounts } = useAccounts();
  const { budgets, isLoading: budgetsLoading, error: budgetsError, refetch: refetchBudgets } = useBudgets();
  const { goals, isLoading: goalsLoading, error: goalsError, refetch: refetchGoals } = useGoals();

  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];

  const { stats: thisMonthStats, isLoading: thisMonthStatsLoading } = useTransactionStats({ dateFrom: thisMonthStart, dateTo: todayStr });
  const { stats: lastMonthStats, isLoading: lastMonthStatsLoading } = useTransactionStats({ dateFrom: lastMonthStart, dateTo: lastMonthEnd });

  const totalBalance = accounts?.reduce((sum, acc) => sum + parseFloat(acc?.currentBalance || '0'), 0) ?? 0;
  const totalBudget = budgets?.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0) || 0;
  const totalBudgetSpent = budgets?.reduce((sum, b) => sum + parseFloat(b.totalSpent || '0'), 0) || 0;
  const activeGoals = goals?.filter((g) => g.status === 'active').length || 0;
  const avgGoalProgress = goals?.length
    ? goals.reduce((sum, g) => sum + ((parseFloat(g.currentAmount) || 0) / (parseFloat(g.targetAmount) || 1)) * 100, 0) / goals.length
    : 0;

  const thisMonthNet = parseFloat(thisMonthStats?.netAmount ?? '0');
  const lastMonthNet = parseFloat(lastMonthStats?.netAmount ?? '0');
  const trendPercent = lastMonthNet !== 0
    ? ((thisMonthNet - lastMonthNet) / Math.abs(lastMonthNet)) * 100
    : thisMonthNet > 0 ? 100 : thisMonthNet < 0 ? -100 : 0;
  const trendIsPositive = trendPercent >= 0;
  const hasTrendData = !thisMonthStatsLoading && !lastMonthStatsLoading && thisMonthStats !== undefined;

  const isLoading = accountsLoading || budgetsLoading || goalsLoading;
  const hasError = accountsError || budgetsError || goalsError;
  const isEmpty = !accounts?.length && !budgets?.length && !goals?.length;

  return (
    <PageStateWrapper
      isLoading={isLoading}
      error={hasError}
      isEmpty={isEmpty}
      onRetry={() => { refetchAccounts(); refetchBudgets(); refetchGoals(); }}
      loadingMessage={t('dashboard.loadingDashboard')}
      errorMessage={t('dashboard.errorLoading')}
    >
      <div className="space-y-8 p-8 bg-background min-h-full">
        <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('dashboard.totalBalance')}
            value={<CurrencyText value={totalBalance} />}
            sublabel={`${accounts.length} ${t('dashboard.accountsCount')}`}
            icon={<Wallet className="h-6 w-6" />}
            colorScheme={STAT_CARD_COLORS.balance}
          />
          <StatCard
            title={t('dashboard.budgetStatus')}
            value={<PercentageText value={totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0} decimals={1} />}
            sublabel={
              <span>
                <CurrencyText value={totalBudgetSpent} options={{ maximumFractionDigits: 0 }} /> /{' '}
                <CurrencyText value={totalBudget} options={{ maximumFractionDigits: 0 }} />
              </span>
            }
            icon={<PiggyBank className="h-6 w-6" />}
            colorScheme={STAT_CARD_COLORS.budget}
          />
          <StatCard
            title={t('dashboard.activeGoals')}
            value={activeGoals}
            sublabel={<><PercentageText value={avgGoalProgress} decimals={0} /> {t('dashboard.avgProgress')}</>}
            icon={<Target className="h-6 w-6" />}
            colorScheme={STAT_CARD_COLORS.goals}
          />
          <StatCard
            title={t('dashboard.thisMonth')}
            value={
              hasTrendData
                ? <span className={trendIsPositive ? 'text-income' : 'text-expense'}><PercentageText value={parseFloat(trendPercent.toFixed(1))} showSign /></span>
                : <span className="text-muted-foreground">—</span>
            }
            sublabel={t('dashboard.vsLastMonth')}
            icon={<TrendingUp className="h-6 w-6" />}
            colorScheme={STAT_CARD_COLORS.trend}
            loading={thisMonthStatsLoading || lastMonthStatsLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard
            title={t('nav.accounts')}
            description={`${accounts.length} ${t('dashboard.total')}`}
            isEmpty={!accounts.length}
            emptyState={{
              icon: <Wallet className="h-8 w-8" />,
              title: t('dashboard.noAccountsYet'),
              description: t('dashboard.noAccountsYetDesc'),
              action: { label: t('accounts.createAccount'), onClick: () => navigate('/accounts') },
            }}
            onViewAll={() => navigate('/accounts')}
          >
            <div className="space-y-1">
              {accounts.slice(0, 3).map((account) => (
                <AccountRow key={account.id} account={account} onClick={() => navigate('/accounts')} />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={t('nav.budgets')}
            description={`${budgets?.length || 0} ${t('dashboard.active')}`}
            isEmpty={!budgets?.length}
            emptyState={{
              icon: <PiggyBank className="h-8 w-8" />,
              title: t('dashboard.noBudgetsYet'),
              description: t('dashboard.noBudgetsYetDesc'),
              action: { label: t('budgets.createBudget'), onClick: () => navigate('/budgets') },
            }}
            onViewAll={() => navigate('/budgets')}
          >
            <div className="space-y-2">
              {budgets?.slice(0, 3).map((budget) => (
                <BudgetRow key={budget.id} budget={budget} onClick={() => navigate('/budgets')} />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            className="lg:col-span-2"
            title={t('nav.goals')}
            description={`${activeGoals} ${t('dashboard.inProgress')}`}
            isEmpty={!goals?.length}
            emptyState={{
              icon: <Target className="h-8 w-8" />,
              title: t('dashboard.noGoalsYet'),
              description: t('dashboard.noGoalsYetDesc'),
              action: { label: t('goals.createGoal'), onClick: () => navigate('/goals') },
            }}
            onViewAll={() => navigate('/goals')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals?.slice(0, 4).map((goal) => (
                <GoalTile key={goal.id} goal={goal} onClick={() => navigate('/goals')} />
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageStateWrapper>
  );
};
```

- [ ] **Step 2: Verify build passes with zero errors**

```bash
cd frontend && npm run build
```

Expected: zero TypeScript errors. If `PercentageText` complains about `value` type (it receives `number` but may expect `string`), check its signature in `frontend/src/core/components/formatters/PercentageText.tsx` and cast with `Number(...)` as needed.

- [ ] **Step 3: Verify line count is ≤150**

```bash
wc -l frontend/src/pages/Dashboard.tsx
```

Expected: ≤150 lines.

- [ ] **Step 4: Verify no raw gray-* classes remain in Dashboard.tsx**

```bash
grep -n "gray-" frontend/src/pages/Dashboard.tsx
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/features/dashboard/constants.ts
git commit -m "refactor(dashboard): apply Frontend Refactoring SOP — extract 6 core components, semantic token pass"
```

---

## Self-Review

**Spec coverage check:**
- ✅ `IconCircle` — Task 1
- ✅ `ProgressBar` — Task 2
- ✅ `StatusBadge` — Task 3
- ✅ `PageStateWrapper` — Task 4
- ✅ `StatCard` — Task 5
- ✅ `SectionCard` — Task 6
- ✅ `features/dashboard/constants.ts` — Task 7
- ✅ `Dashboard.tsx` rewrite — Task 8
- ✅ Semantic token pass (`bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`) — applied throughout Tasks 1–8
- ✅ Double-wrapper anti-pattern removed — `SectionCard` uses `<Card>` directly (Task 6)
- ✅ `locale='it-IT'` hardcoded prop removed — `CurrencyText` in new Dashboard.tsx has no `locale` prop
- ✅ `STAT_CARD_COLORS` centralizes all stat tile color config (Task 7)

**Placeholder scan:** No TBDs, TODOs, or "similar to Task N" references. All code blocks are complete.

**Type consistency:**
- `ColorScheme` exported from `StatCard.tsx`, imported in `constants.ts` ✅
- `EmptyStateProps` exported from `EmptyState.tsx` (already was), imported in `SectionCard.tsx` ✅
- `BadgeStatus` exported from `StatusBadge.tsx`, used via `as const` assertions in `BudgetRow` ✅
- `ProgressVariant` exported from `ProgressBar.tsx`, used via `as const` assertions in `BudgetRow` ✅
- `AccountResponse`, `BudgetResponse`, `FinancialGoalResponse` from `@/api/generated/models` — confirmed from `accountResponse.ts`, `budgetResponse.ts`, `financialGoalResponse.ts` ✅
