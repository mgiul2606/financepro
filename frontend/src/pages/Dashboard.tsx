// src/pages/Dashboard.tsx
import { Wallet, Target, PiggyBank, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Button } from '@/core/components/atomic/Button';
import { Badge } from '@/core/components/atomic/Badge';
import { Spinner } from '@/core/components/atomic/Spinner';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '@/features/accounts';
import { useBudgets } from '@/features/budgets/hooks/useBudgets';
import { useGoals } from '@/features/goals/hooks/useGoals';

export const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch data
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { data: budgets, isLoading: budgetsLoading } = useBudgets();
  const { data: goals, isLoading: goalsLoading } = useGoals();

  // Calculate stats
  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0);
  const totalBudget = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0;
  const totalBudgetSpent = budgets?.reduce((sum, b) => sum + b.spent, 0) || 0;
  const activeGoals = goals?.filter((g) => g.status === 'in_progress').length || 0;
  const totalGoalProgress =
    goals?.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount) * 100, 0) || 0;
  const avgGoalProgress = goals && goals.length > 0 ? totalGoalProgress / goals.length : 0;

  const isLoading = accountsLoading || budgetsLoading || goalsLoading;

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your financial health"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Balance */}
        <Card variant="elevated">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Balance</p>
                <h3 className="text-2xl font-bold text-gray-900">EUR {totalBalance.toFixed(2)}</h3>
                <p className="text-xs text-gray-500 mt-1">{accounts.length} accounts</p>
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
                <p className="text-sm text-gray-600 mb-1">Budget Status</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {totalBudget > 0 ? ((totalBudgetSpent / totalBudget) * 100).toFixed(1) : 0}%
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {totalBudgetSpent.toFixed(0)} / {totalBudget.toFixed(0)} EUR
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
                <p className="text-sm text-gray-600 mb-1">Active Goals</p>
                <h3 className="text-2xl font-bold text-gray-900">{activeGoals}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {avgGoalProgress.toFixed(0)}% avg progress
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
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <h3 className="text-2xl font-bold text-green-600">+5.2%</h3>
                <p className="text-xs text-gray-500 mt-1">vs last month</p>
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
            title="Accounts"
            subtitle={`${accounts.length} total`}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')}>
                View all
              </Button>
            }
          />
          <CardBody className="pt-0">
            <div className="space-y-3">
              {accounts.slice(0, 3).map((account) => {
                const balance = parseFloat(account.current_balance);
                const initial = parseFloat(account.initial_balance);
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
                        <p className="text-sm text-gray-500">{account.currency} Account</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {account.currency} {balance.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-1 text-xs">
                        {change >= 0 ? (
                          <>
                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">+{change.toFixed(2)}</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="h-3 w-3 text-red-600" />
                            <span className="text-red-600">{change.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {accounts.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No accounts yet</p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Recent Budgets */}
        <Card variant="bordered">
          <CardHeader
            title="Budgets"
            subtitle={`${budgets?.length || 0} active`}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/budgets')}>
                View all
              </Button>
            }
          />
          <CardBody className="pt-0">
            <div className="space-y-3">
              {budgets?.slice(0, 3).map((budget) => {
                const percentage = (budget.spent / budget.amount) * 100;
                return (
                  <div
                    key={budget.id}
                    className="p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate('/budgets')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{budget.name}</p>
                        <p className="text-xs text-gray-500">{budget.category}</p>
                      </div>
                      <Badge
                        variant={
                          percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'success'
                        }
                        size="sm"
                      >
                        {percentage.toFixed(0)}%
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
                <p className="text-sm text-gray-500 text-center py-4">No budgets yet</p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Recent Goals */}
        <Card variant="bordered" className="lg:col-span-2">
          <CardHeader
            title="Goals"
            subtitle={`${activeGoals} in progress`}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/goals')}>
                View all
              </Button>
            }
          />
          <CardBody className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals?.slice(0, 4).map((goal) => {
                const percentage = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => navigate('/goals')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{goal.name}</p>
                        <p className="text-xs text-gray-500">{goal.category}</p>
                      </div>
                      <Badge variant={goal.priority === 'high' ? 'danger' : 'default'} size="sm">
                        {goal.priority}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          {goal.currency} {goal.currentAmount.toFixed(0)}
                        </span>
                        <span>
                          {goal.currency} {goal.targetAmount.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!goals || goals.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4 col-span-2">No goals yet</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
