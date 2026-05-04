// src/pages/Dashboard.tsx
import { Wallet, Target, PiggyBank, TrendingUp, ArrowUpRight, ArrowDownRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { CurrencyText, PercentageText } from '@/core/components/formatters';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '@/features/accounts';
import { useBudgets } from '@/features/budgets';
import { useGoals } from '@/features/goals';
import { useTransactionStats } from '@/features/transactions';
import type { SupportedCurrency } from '@/utils/currency';

export const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch data
  const { accounts, isLoading: accountsLoading, error: accountsError, refetch: refetchAccounts } = useAccounts();
  const { budgets, isLoading: budgetsLoading, error: budgetsError, refetch: refetchBudgets } = useBudgets();
  const { goals, isLoading: goalsLoading, error: goalsError, refetch: refetchGoals } = useGoals();

  // Date ranges for month-over-month trend
  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];

  const { stats: thisMonthStats, isLoading: thisMonthStatsLoading } = useTransactionStats({
    dateFrom: thisMonthStart,
    dateTo: todayStr,
  });
  const { stats: lastMonthStats, isLoading: lastMonthStatsLoading } = useTransactionStats({
    dateFrom: lastMonthStart,
    dateTo: lastMonthEnd,
  });

  // Calculate stats
  const totalBalance = accounts?.reduce((sum: number, acc) => sum + parseFloat(acc?.currentBalance || '0'), 0) ?? 0;
  const totalBudget = budgets?.reduce((sum: number, b) => sum + parseFloat(b.totalAmount || '0'), 0) || 0;
  const totalBudgetSpent = budgets?.reduce((sum: number, b) => sum + parseFloat(b.totalSpent || '0'), 0) || 0;
  const activeGoals = goals?.filter((g) => g.status === 'active').length || 0;
  const totalGoalProgress =
    goals?.reduce((sum: number, g) => sum + ((parseFloat(g.currentAmount) || 0) / (parseFloat(g.targetAmount) || 1)) * 100, 0) || 0;
  const avgGoalProgress = goals && goals.length > 0 ? totalGoalProgress / goals.length : 0;

  // Month-over-month net cash flow trend
  const thisMonthNet = parseFloat(thisMonthStats?.netAmount ?? '0');
  const lastMonthNet = parseFloat(lastMonthStats?.netAmount ?? '0');
  const trendPercent =
    lastMonthNet !== 0
      ? ((thisMonthNet - lastMonthNet) / Math.abs(lastMonthNet)) * 100
      : thisMonthNet > 0
        ? 100
        : thisMonthNet < 0
          ? -100
          : 0;
  const trendIsPositive = trendPercent >= 0;
  const hasTrendData = !thisMonthStatsLoading && !lastMonthStatsLoading && thisMonthStats !== undefined;

  const isLoading = accountsLoading || budgetsLoading || goalsLoading;
  const hasError = accountsError || budgetsError || goalsError;

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">{t('dashboard.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (hasError && !accounts?.length && !budgets?.length && !goals?.length) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-rose-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('common.errorLoadingData')}</h3>
          <p className="text-sm text-gray-600 mb-6">{t('dashboard.errorLoading')}</p>
          <Button
            variant="default"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => {
              refetchAccounts();
              refetchBudgets();
              refetchGoals();
            }}
          >
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 bg-gray-50 min-h-full">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance */}
        <div className="rounded-xl shadow-sm border border-gray-100 bg-white overflow-hidden">
          <div className="border-l-4 border-indigo-600 h-full">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    {t('dashboard.totalBalance')}
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    <CurrencyText value={totalBalance} locale='it-IT'/>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {accounts.length} {t('dashboard.accountsCount')}
                  </p>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <Wallet className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Status */}
        <div className="rounded-xl shadow-sm border border-gray-100 bg-white overflow-hidden">
          <div className="border-l-4 border-amber-500 h-full">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    {t('dashboard.budgetStatus')}
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    <PercentageText
                      value={totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0}
                      decimals={1}
                    />
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    <CurrencyText value={totalBudgetSpent} options={{ maximumFractionDigits: 0 }} /> /{' '}
                    <CurrencyText value={totalBudget} options={{ maximumFractionDigits: 0 }} />
                  </p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <PiggyBank className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Goals */}
        <div className="rounded-xl shadow-sm border border-gray-100 bg-white overflow-hidden">
          <div className="border-l-4 border-emerald-600 h-full">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    {t('dashboard.activeGoals')}
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900">{activeGoals}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    <PercentageText value={avgGoalProgress} decimals={0} /> {t('dashboard.avgProgress')}
                  </p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <Target className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Net Worth Trend */}
        <div className="rounded-xl shadow-sm border border-gray-100 bg-white overflow-hidden">
          <div className="border-l-4 border-violet-600 h-full">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    {t('dashboard.thisMonth')}
                  </p>
                  {thisMonthStatsLoading || lastMonthStatsLoading ? (
                    <div className="h-9 w-20 bg-gray-100 rounded animate-pulse mt-1" />
                  ) : hasTrendData ? (
                    <h3 className={`text-3xl font-bold ${trendIsPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      <PercentageText value={trendPercent.toFixed(1)} showSign={true} />
                    </h3>
                  ) : (
                    <h3 className="text-3xl font-bold text-gray-400">—</h3>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{t('dashboard.vsLastMonth')}</p>
                </div>
                <div className="h-12 w-12 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                  <TrendingUp className="h-6 w-6 text-violet-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Accounts */}
        <div className="rounded-xl shadow-sm border border-gray-100 bg-white">
          <Card variant="bordered" className="border-0 shadow-none rounded-xl">
            <CardHeader>
              <CardTitle>{t('nav.accounts')}</CardTitle>
              <CardDescription>{`${accounts.length} ${t('dashboard.total')}`}</CardDescription>
              <CardAction>
                <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')}>
                  {t('dashboard.viewAll')}
                </Button>
              </CardAction>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-1">
                {accounts.slice(0, 3).map((account) => {
                  const balance = parseFloat(account.currentBalance);
                  const initial = parseFloat(account.initialBalance);
                  const change = balance - initial;

                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate('/accounts')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{account.name}</p>
                          <p className="text-sm text-gray-500">{account.currency} {t('dashboard.account')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          <CurrencyText value={balance} currency={account.currency as SupportedCurrency} />
                        </p>
                        <div className="flex items-center gap-1 text-xs justify-end">
                          {change >= 0 ? (
                            <>
                              <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                              <CurrencyText value={change} showSign colorCoded className="text-emerald-600" />
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="h-3 w-3 text-rose-600" />
                              <CurrencyText value={change} colorCoded className="text-rose-600" />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {accounts.length === 0 && (
                  <div className="text-center py-8">
                    <Wallet className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t('dashboard.noAccountsYet')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('dashboard.noAccountsYetDesc')}</p>
                    <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/accounts')}>
                      {t('accounts.createAccount')}
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Recent Budgets */}
        <div className="rounded-xl shadow-sm border border-gray-100 bg-white">
          <Card variant="bordered" className="border-0 shadow-none rounded-xl">
            <CardHeader>
              <CardTitle>{t('nav.budgets')}</CardTitle>
              <CardDescription>{`${budgets?.length || 0} ${t('dashboard.active')}`}</CardDescription>
              <CardAction>
                <Button variant="ghost" size="sm" onClick={() => navigate('/budgets')}>
                  {t('dashboard.viewAll')}
                </Button>
              </CardAction>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-2">
                {budgets?.slice(0, 3).map((budget) => {
                  const percentage = ((parseFloat(budget.totalSpent || '0')) / (parseFloat(budget.totalAmount) || 1)) * 100;
                  const isExceeded = percentage >= 100;
                  const isWarning = percentage >= 80 && percentage < 100;
                  return (
                    <div
                      key={budget.id}
                      className="p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate('/budgets')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{budget.name}</p>
                          <p className="text-xs text-gray-500">{budget.periodType}</p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isExceeded
                              ? 'bg-rose-100 text-rose-600'
                              : isWarning
                                ? 'bg-amber-100 text-amber-500'
                                : 'bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          <PercentageText value={percentage} decimals={0} />
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${
                            isExceeded
                              ? 'bg-rose-600'
                              : isWarning
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!budgets || budgets.length === 0) && (
                  <div className="text-center py-8">
                    <PiggyBank className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t('dashboard.noBudgetsYet')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('dashboard.noBudgetsYetDesc')}</p>
                    <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/budgets')}>
                      {t('budgets.createBudget')}
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Recent Goals */}
        <div className="rounded-xl shadow-sm border border-gray-100 bg-white lg:col-span-2">
          <Card variant="bordered" className="border-0 shadow-none rounded-xl">
            <CardHeader>
              <CardTitle>{t('nav.goals')}</CardTitle>
              <CardDescription>{`${activeGoals} ${t('dashboard.inProgress')}`}</CardDescription>
              <CardAction>
                <Button variant="ghost" size="sm" onClick={() => navigate('/goals')}>
                  {t('dashboard.viewAll')}
                </Button>
              </CardAction>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals?.slice(0, 4).map((goal) => {
                  const percentage = ((parseFloat(goal.currentAmount) || 0) / (parseFloat(goal.targetAmount) || 1)) * 100;
                  return (
                    <div
                      key={goal.id}
                      className="p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => navigate('/goals')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">{goal.name}</p>
                          <p className="text-xs text-gray-500">{goal.goalType}</p>
                        </div>
                        <Badge variant={goal.status === 'completed' ? 'success' : 'info'}>
                          {goal.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{t('dashboard.progress')}</span>
                          <span className="font-semibold text-indigo-600">
                            <PercentageText value={percentage} decimals={1} />
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>
                            <CurrencyText value={parseFloat(goal.currentAmount) || 0} currency={goal.currency as SupportedCurrency} options={{ maximumFractionDigits: 0 }} />
                          </span>
                          <span>
                            <CurrencyText value={parseFloat(goal.targetAmount) || 0} currency={goal.currency as SupportedCurrency} options={{ maximumFractionDigits: 0 }} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!goals || goals.length === 0) && (
                  <div className="text-center py-8 col-span-2">
                    <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t('dashboard.noGoalsYet')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('dashboard.noGoalsYetDesc')}</p>
                    <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/goals')}>
                      {t('goals.createGoal')}
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
