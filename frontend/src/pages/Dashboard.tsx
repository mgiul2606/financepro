// src/pages/Dashboard.tsx
import { Wallet, Target, PiggyBank, TrendingUp, ArrowUpRight, ArrowDownRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Button } from '@/core/components/atomic/Button';
import { Badge } from '@/core/components/atomic/Badge';
import { Spinner } from '@/core/components/atomic/Spinner';
import { CurrencyText, NumberText, PercentageText } from '@/core/components/atomic';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '@/features/accounts';
import { useBudgets } from '@/features/budgets';
import { useGoals } from '@/features/goals';
import type { SupportedCurrency } from '@/utils/currency';

export const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch data
  const { accounts, isLoading: accountsLoading, error: accountsError, refetch: refetchAccounts } = useAccounts();
  const { budgets, isLoading: budgetsLoading, error: budgetsError, refetch: refetchBudgets } = useBudgets();
  const { goals, isLoading: goalsLoading, error: goalsError, refetch: refetchGoals } = useGoals();

  // Calculate stats
  const totalBalance = accounts?.reduce((sum: number, acc) => sum + parseFloat(acc?.currentBalance || '0'), 0) ?? 0;
  const totalBudget = budgets?.reduce((sum: number, b) => sum + parseFloat(b.totalAmount || '0'), 0) || 0;
  const totalBudgetSpent = budgets?.reduce((sum: number, b) => sum + parseFloat(b.totalSpent || '0'), 0) || 0;
  const activeGoals = goals?.filter((g) => g.status === 'active').length || 0;
  const totalGoalProgress =
    goals?.reduce((sum: number, g) => sum + ((parseFloat(g.currentAmount) || 0) / (parseFloat(g.targetAmount) || 1)) * 100, 0) || 0;
  const avgGoalProgress = goals && goals.length > 0 ? totalGoalProgress / goals.length : 0;

  const isLoading = accountsLoading || budgetsLoading || goalsLoading;
  const hasError = accountsError || budgetsError || goalsError;

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">{t('dashboard.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (hasError && !accounts?.length && !budgets?.length && !goals?.length) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('common.errorLoadingData')}</h3>
          <p className="text-sm text-gray-600 mb-6">{t('dashboard.errorLoading')}</p>
          <Button
            variant="primary"
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
    <div className="p-8">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Balance */}
        <Card variant="elevated">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('dashboard.totalBalance')}</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  <CurrencyText value={totalBalance} />
                </h3>
                <p className="text-xs text-gray-500 mt-1">{accounts.length} {t('dashboard.accountsCount')}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Budget Status */}
        <Card variant="elevated">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('dashboard.budgetStatus')}</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  <PercentageText
                    value={totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0}
                    decimals={1}
                  />
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  <CurrencyText value={totalBudgetSpent} options={{ maximumFractionDigits: 0 }} /> / <CurrencyText value={totalBudget} options={{ maximumFractionDigits: 0 }} />
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Active Goals */}
        <Card variant="elevated">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('dashboard.activeGoals')}</p>
                <h3 className="text-2xl font-bold text-gray-900">{activeGoals}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <PercentageText value={avgGoalProgress} decimals={0} /> {t('dashboard.avgProgress')}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Net Worth Trend */}
        <Card variant="elevated">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('dashboard.thisMonth')}</p>
                <h3 className="text-2xl font-bold text-green-600">+5.2%</h3>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.vsLastMonth')}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Accounts */}
        <Card variant="bordered">
          <CardHeader
            title={t('nav.accounts')}
            subtitle={`${accounts.length} ${t('dashboard.total')}`}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')}>
                {t('dashboard.viewAll')}
              </Button>
            }
          />
          <CardBody className="pt-0">
            <div className="space-y-3">
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
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-blue-600" />
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
                      <div className="flex items-center gap-1 text-xs">
                        {change >= 0 ? (
                          <>
                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                            <NumberText value={change} showSign colorCoded className="text-green-600" />
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="h-3 w-3 text-red-600" />
                            <NumberText value={change} colorCoded className="text-red-600" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {accounts.length === 0 && (
                <div className="text-center py-6">
                  <Wallet className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t('dashboard.noAccountsYet')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('dashboard.noAccountsYetDesc')}</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/accounts')}>
                    {t('accounts.createAccount')}
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Recent Budgets */}
        <Card variant="bordered">
          <CardHeader
            title={t('nav.budgets')}
            subtitle={`${budgets?.length || 0} ${t('dashboard.active')}`}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/budgets')}>
                {t('dashboard.viewAll')}
              </Button>
            }
          />
          <CardBody className="pt-0">
            <div className="space-y-3">
              {budgets?.slice(0, 3).map((budget) => {
                const percentage = ((parseFloat(budget.totalSpent || '0')) / (parseFloat(budget.totalAmount) || 1)) * 100;
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
                      <Badge
                        variant={
                          percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'success'
                        }
                        size="sm"
                      >
                        <PercentageText value={percentage} decimals={0} />
                      </Badge>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          percentage >= 100
                            ? 'bg-red-600'
                            : percentage >= 80
                              ? 'bg-yellow-500'
                              : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!budgets || budgets.length === 0) && (
                <div className="text-center py-6">
                  <PiggyBank className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t('dashboard.noBudgetsYet')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('dashboard.noBudgetsYetDesc')}</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/budgets')}>
                    {t('budgets.createBudget')}
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Recent Goals */}
        <Card variant="bordered" className="lg:col-span-2">
          <CardHeader
            title={t('nav.goals')}
            subtitle={`${activeGoals} ${t('dashboard.inProgress')}`}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/goals')}>
                {t('dashboard.viewAll')}
              </Button>
            }
          />
          <CardBody className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals?.slice(0, 4).map((goal) => {
                const percentage = ((parseFloat(goal.currentAmount) || 0) / (parseFloat(goal.targetAmount) || 1)) * 100;
                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => navigate('/goals')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{goal.name}</p>
                        <p className="text-xs text-gray-500">{goal.goalType}</p>
                      </div>
                      <Badge variant={goal.status === 'completed' ? 'success' : 'info'} size="sm">
                        {goal.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('dashboard.progress')}</span>
                        <span className="font-semibold">
                          <PercentageText value={percentage} decimals={1} />
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
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
                <div className="text-center py-6 col-span-2">
                  <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t('dashboard.noGoalsYet')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('dashboard.noGoalsYetDesc')}</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/goals')}>
                    {t('goals.createGoal')}
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
