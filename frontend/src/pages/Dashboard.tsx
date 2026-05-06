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
        <Badge variant={goal.status === 'completed' ? 'success' : 'info'}>{t(`goals.statuses.${goal.status}`)}</Badge>
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
            sublabel={`${accounts?.length ?? 0} ${t('dashboard.accountsCount')}`}
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
                ? <span className={trendIsPositive ? 'text-income' : 'text-expense'}><PercentageText value={Number(trendPercent.toFixed(1))} showSign /></span>
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
            description={`${accounts?.length ?? 0} ${t('dashboard.total')}`}
            isEmpty={!accounts?.length}
            emptyState={{
              icon: <Wallet className="h-8 w-8" />,
              title: t('dashboard.noAccountsYet'),
              description: t('dashboard.noAccountsYetDesc'),
              action: { label: t('accounts.createAccount'), onClick: () => navigate('/accounts') },
            }}
            onViewAll={() => navigate('/accounts')}
          >
            <div className="space-y-1">
              {accounts?.slice(0, 3).map((account) => (
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
