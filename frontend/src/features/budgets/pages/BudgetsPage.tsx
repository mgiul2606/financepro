// features/budgets/pages/BudgetsPage.tsx
import { useState } from 'react';
import { Plus, AlertCircle, Edit, Trash2, RefreshCw, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardBody, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CurrencyText, PercentageText, DateText } from '@/core/components/formatters';
import { getProgressBarClass, getProgressVariant, getAmountClass } from '@/lib/finance-colors';
import { EmptyState } from '@/core/components/composite/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '@/hooks/useConfirm';
import { BudgetForm } from '../components/BudgetForm';
import { BudgetDetailsModal } from '../components/BudgetDetailsModal';
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useAddBudgetCategory,
  useRemoveBudgetCategory,
} from '../budgets.hooks';
import type { BudgetResponse as Budget, BudgetCreate, BudgetUpdate } from '../budgets.types';

export const BudgetsPage: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [detailsBudget, setDetailsBudget] = useState<Budget | null>(null);

  // Data fetching
  const { budgets, isLoading, error: loadError, refetch } = useBudgets();

  // Mutations
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();
  const addCategoryMutation = useAddBudgetCategory();
  const removeCategoryMutation = useRemoveBudgetCategory();

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

  const handleUpdate = async (data: BudgetCreate | BudgetUpdate) => {
    if (!editingBudget) return;

    try {
      // Extract category allocations (not part of BudgetUpdate schema)
      const { categoryAllocations: rawAllocations, ...budgetData } = data as BudgetCreate & { categoryAllocations?: Array<{ categoryId: string; allocatedAmount: number }> };
      const newAllocations = rawAllocations as Array<{ categoryId: string; allocatedAmount: number }> | undefined;
      await updateMutation.updateBudget(editingBudget.id, budgetData);

      // Sync category allocations if provided
      if (newAllocations !== undefined) {
        const existingIds = (editingBudget.categoryAllocations ?? []).map((a) => a.categoryId);
        const newIds = newAllocations.map((a) => a.categoryId);

        // Remove categories no longer in the list
        const toRemove = existingIds.filter((id) => !newIds.includes(id));
        for (const categoryId of toRemove) {
          await removeCategoryMutation.mutateAsync({
            budgetId: editingBudget.id,
            categoryId,
          });
        }

        // Add new categories (ones not in existing list)
        const toAdd = newAllocations.filter((a) => !existingIds.includes(a.categoryId));
        for (const alloc of toAdd) {
          await addCategoryMutation.mutateAsync({
            budgetId: editingBudget.id,
            categoryId: alloc.categoryId,
            allocatedAmount: alloc.allocatedAmount,
          });
        }
      }

      // Invalidate detail queries so the modal refreshes with new data
      queryClient.invalidateQueries({ queryKey: ['budget-detail'] });
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

  // Loading state — skeleton grid
  if (isLoading) {
    return (
      <div className="min-h-full flex flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-white shadow-sm border border-gray-100 animate-pulse h-48"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      <PageHeader
        title={t('budgets.title')}
        subtitle={t('budgets.subtitle')}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: t('budgets.title') }]}
        actions={
          <Button
            variant="default"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
            isLoading={createMutation.isCreating}
          >
            {t('budgets.createBudget')}
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Error Alert */}
        {loadError && (
          <Alert variant="destructive" className="mb-6">
            <div className="flex items-center justify-between">
              <span>{t('budgets.errors.loadFailed')}</span>
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => refetch()}>
                {t('common.retry')}
              </Button>
            </div>
          </Alert>
        )}

        {/* Empty State */}
        {budgets && budgets.length === 0 ? (
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
                <Card key={budget.id} variant="elevated" className="rounded-xl">
                  <CardHeader>
                    <CardTitle>{budget.name}</CardTitle>
                    <CardDescription>{budget.periodType}</CardDescription>
                    <CardAction>
                      <Badge variant={getProgressVariant(percentage)}>
                        <PercentageText value={percentage} decimals={0} />
                      </Badge>
                    </CardAction>
                  </CardHeader>

                  <CardBody className="mt-4">
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-sm text-gray-500">{t('budgets.spent')}</span>
                        <span className="font-semibold text-gray-900">
                          <CurrencyText value={parseFloat(budget.totalSpent ?? '0')} />
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getProgressBarClass(percentage)}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Budget Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">{t('budgets.amount')}</span>
                        <span className="font-semibold text-gray-900">
                          <CurrencyText value={parseFloat(budget.totalAmount)} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">{t('budgets.remaining')}</span>
                        <span className={`font-semibold ${getAmountClass(remaining)}`}>
                          <CurrencyText value={remaining} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">{t('budgets.period')}</span>
                        <span className="font-semibold text-gray-900 capitalize">{budget.periodType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">{t('budgets.dates')}</span>
                        <span className="font-semibold text-gray-900 text-xs">
                          <DateText value={budget.startDate} />{budget.endDate && <> - <DateText value={budget.endDate} /></>}
                        </span>
                      </div>
                    </div>
                  </CardBody>

                  {/* Action Buttons */}
                  <CardFooter className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye size={16} />}
                        onClick={() => setDetailsBudget({ ...budget, rolloverEnabled: budget.rolloverEnabled ?? false, isActive: budget.isActive ?? true })}
                        fullWidth
                        className="hover:text-indigo-600 hover:bg-indigo-50"
                      >
                        {t('budgets.viewDetails')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit size={16} />}
                        onClick={() => setEditingBudget({ ...budget, rolloverEnabled: budget.rolloverEnabled ?? false, isActive: budget.isActive ?? true })}
                        fullWidth
                        className="hover:text-indigo-600 hover:bg-indigo-50"
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 size={16} />}
                        onClick={() => handleDelete(budget)}
                        fullWidth
                        className="hover:text-rose-600 hover:bg-rose-50"
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
              variant="default"
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
              variant="default"
              type="submit"
              form="budget-form"
              isLoading={updateMutation.isUpdating}
            >
              {t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Details Modal */}
      {detailsBudget && (
        <BudgetDetailsModal
          budget={detailsBudget}
          isOpen={true}
          onClose={() => setDetailsBudget(null)}
        />
      )}
    </div>
  );
};
