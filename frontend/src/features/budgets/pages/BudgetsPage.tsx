import { Plus, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../../core/components/composite/PageHeader';
import { Card, CardHeader, CardBody } from '../../../core/components/atomic/Card';
import { Button } from '../../../core/components/atomic/Button';
import { Badge } from '../../../core/components/atomic/Badge';
import { EmptyState } from '../../../core/components/composite/EmptyState';
import { useBudgets } from '../hooks/useBudgets';

export const BudgetsPage: React.FC = () => {
  const { data: budgets, isLoading } = useBudgets();

  const getProgressColor = (spent: number, total: number) => {
    const percentage = (spent / total) * 100;
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Budgets"
        subtitle="Plan and monitor your spending across categories"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Budgets' },
        ]}
        actions={
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Create Budget
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {!isLoading && budgets && budgets.length === 0 ? (
          <EmptyState
            icon={<AlertCircle />}
            title="No budgets yet"
            description="Create your first budget to start tracking your spending"
            action={{
              label: 'Create Budget',
              onClick: () => {},
              icon: <Plus className="h-4 w-4" />
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets?.map((budget) => {
              const percentage = (budget.spent / budget.amount) * 100;
              const remaining = budget.amount - budget.spent;

              return (
                <Card key={budget.id} variant="elevated">
                  <CardHeader
                    title={budget.name}
                    subtitle={budget.category}
                    action={
                      <Badge
                        variant={
                          percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'success'
                        }
                        size="sm"
                      >
                        {percentage.toFixed(0)}%
                      </Badge>
                    }
                  />
                  <CardBody className="mt-4">
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-600">Spent</span>
                        <span className="font-semibold">EUR {budget.spent.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getProgressColor(budget.spent, budget.amount)}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Budget</span>
                        <span className="font-medium">EUR {budget.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Remaining</span>
                        <span className={`font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          EUR {remaining.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Period</span>
                        <span className="font-medium capitalize">{budget.period}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
