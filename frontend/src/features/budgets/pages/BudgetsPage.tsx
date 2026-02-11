// features/budgets/pages/BudgetsPage.tsx
import { useState } from 'react';
import { Plus, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody, CardFooter } from '@/core/components/atomic/Card';
import { Button } from '@/core/components/atomic/Button';
import { Badge } from '@/core/components/atomic/Badge';
import { CurrencyText, PercentageText, DateText } from '@/core/components/atomic';
import { EmptyState } from '@/core/components/composite/EmptyState';
import { Spinner } from '@/core/components/atomic/Spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { useConfirm } from '@/hooks/useConfirm';
import { BudgetForm } from '../components/BudgetForm';
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from '../budgets.hooks';
import type { BudgetResponse as Budget, BudgetCreate, BudgetUpdate } from '../budgets.types';

export const BudgetsPage: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Data fetching
  const { budgets, isLoading, error: loadError } = useBudgets();

  // Mutations
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  // Handlers
  const handleCreate = async (data: BudgetCreate | BudgetUpdate) => {
    try {
      await createMutation.createBudget(data as BudgetCreate);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create budget:', error);
      throw error;
    }
  };

  const handleUpdate = async (data: BudgetUpdate) => {
    if (!editingBudget) return;

    try {
      await updateMutation.updateBudget(editingBudget.id, data);
      setEditingBudget(null);
    } catch (error) {
      console.error('Failed to update budget:', error);
      throw error;
    }
  };

  const handleDelete = async (budget: Pick<Budget, 'id' | 'name'>) => {
    const confirmed = await confirm({
      title: t('budgets.deleteBudget'),
      message: t('budgets.deleteConfirm', { name: budget.name }),
      confirmText: t('common.delete'),
      variant: 'danger',
      confirmButtonVariant: 'destructive',
    });

    if (confirmed) {
      try {
        await deleteMutation.deleteBudget(budget.id);
      } catch (error) {
        console.error('Failed to delete budget:', error);
      }
    }
  };

  // Utilities
  const getProgressColor = (spent: number, total: number) => {
    const percentage = (spent / total) * 100;
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  const getBadgeVariant = (percentage: number) => {
    if (percentage >= 100) return 'danger' as const;
    if (percentage >= 80) return 'warning' as const;
    return 'success' as const;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">{t('common.loadingEntity', { entity: t('nav.budgets').toLowerCase() })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('budgets.title')}
        subtitle={t('budgets.subtitle')}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: t('budgets.title') }]}
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
            isLoading={createMutation.isCreating}
          >
            {t('budgets.createBudget')}
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Error Alert */}
        {loadError && (
          <Alert variant="destructive" className="mb-6">
            {t('budgets.errors.loadFailed')}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && budgets && budgets.length === 0 ? (
          <EmptyState
            icon={<AlertCircle />}
            title={t('budgets.noBudgets')}
            description={t('budgets.noBudgetsDesc')}
            action={{
              label: t('budgets.createBudget'),
              onClick: () => setShowCreateModal(true),
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        ) : (
          /* Budget Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets?.map((budget) => {
              const percentage = (parseFloat(budget.totalSpent ?? '0') / parseFloat(budget.totalAmount)) * 100;
              const remaining = parseFloat(budget.totalAmount) - parseFloat(budget.totalSpent ?? '0');

              return (
                <Card key={budget.id} variant="elevated">
                  <CardHeader
                    title={budget.name}
                    subtitle={budget.periodType}
                    action={
                      <Badge variant={getBadgeVariant(percentage)} size="sm">
                        <PercentageText value={percentage} decimals={0} />
                      </Badge>
                    }
                  />

                  <CardBody className="mt-4">
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-600">{t('budgets.spent')}</span>
                        <span className="font-semibold">
                          <CurrencyText value={parseFloat(budget.totalSpent ?? '0')} />
                        </span>
                      </div>
                      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getProgressColor(parseFloat(budget.totalSpent ?? '0'), parseFloat(budget.totalAmount))}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Budget Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('budgets.amount')}</span>
                        <span className="font-medium">
                          <CurrencyText value={parseFloat(budget.totalAmount)} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('budgets.remaining')}</span>
                        <span
                          className={`font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          <CurrencyText value={remaining} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('budgets.period')}</span>
                        <span className="font-medium capitalize">{budget.periodType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('budgets.dates')}</span>
                        <span className="font-medium text-xs">
                          <DateText value={budget.startDate} />{budget.endDate && <> - <DateText value={budget.endDate} /></>}
                        </span>
                      </div>
                    </div>
                  </CardBody>

                  {/* Action Buttons */}
                  <CardFooter className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit size={16} />}
                        onClick={() => setEditingBudget({ ...budget, rolloverEnabled: budget.rolloverEnabled ?? false })}
                        fullWidth
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 size={16} />}
                        onClick={() => handleDelete(budget)}
                        fullWidth
                        className="text-red-600 hover:bg-red-50"
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          if (!open && !createMutation.isCreating) setShowCreateModal(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('budgets.createBudget')}</DialogTitle>
          </DialogHeader>
          <BudgetForm
            onSubmit={handleCreate}
            isLoading={createMutation.isCreating}
            error={createMutation.error ? t('budgets.errors.createFailed') : undefined}
            onClearError={createMutation.reset}
          />
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={createMutation.isCreating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="budget-form"
              isLoading={createMutation.isCreating}
            >
              {t('budgets.createBudget')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={!!editingBudget}
        onOpenChange={(open) => {
          if (!open && !updateMutation.isUpdating) setEditingBudget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('budgets.editBudget')}</DialogTitle>
          </DialogHeader>
          {editingBudget && (
            <BudgetForm
              budget={editingBudget}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isUpdating}
              error={updateMutation.error ? t('budgets.errors.updateFailed') : undefined}
              onClearError={updateMutation.reset}
            />
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setEditingBudget(null)}
              disabled={updateMutation.isUpdating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="budget-form"
              isLoading={updateMutation.isUpdating}
            >
              {t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
