// features/goals/pages/GoalsPage.tsx
import { useState } from 'react';
import { Plus, Target, Edit, Trash2, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody, CardFooter } from '@/core/components/atomic/Card';
import { Button } from '@/core/components/atomic/Button';
import { Badge } from '@/core/components/atomic/Badge';
import { CurrencyText, PercentageText, DateText } from '@/core/components/atomic';
import { EmptyState } from '@/core/components/composite/EmptyState';
import { Spinner } from '@/core/components/atomic/Spinner';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { useConfirm } from '@/hooks/useConfirm';
import { GoalForm } from '../components/GoalForm';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '../goals.hooks';
import type { GoalResponse as Goal, GoalCreate, GoalUpdate } from '../goals.types';

export const GoalsPage: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Data fetching
  const { goals, isLoading, error: loadError } = useGoals();

  // Mutations
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();

  // Handlers
  const handleCreate = async (data: GoalCreate) => {
    try {
      await createMutation.createGoal(data);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
      throw error;
    }
  };

  const handleUpdate = async (data: GoalUpdate) => {
    if (!editingGoal) return;

    try {
      await updateMutation.updateGoal(editingGoal.id, data);
      setEditingGoal(null);
    } catch (error) {
      console.error('Failed to update goal:', error);
      throw error;
    }
  };

  const handleDelete = async (goal: Goal) => {
    const confirmed = await confirm({
      title: t('goals.deleteGoal'),
      message: t('goals.deleteConfirm', { name: goal.name }),
      confirmText: t('common.delete'),
      variant: 'danger',
      confirmButtonVariant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteMutation.deleteGoal(goal.id);
      } catch (error) {
        console.error('Failed to delete goal:', error);
      }
    }
  };

  // Utilities
  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'bg-green-600';
    if (percentage >= 75) return 'bg-blue-600';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger' as const;
      case 'medium':
        return 'warning' as const;
      case 'low':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">{t('common.loadingEntity', { entity: t('nav.goals').toLowerCase() })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('goals.title')}
        subtitle={t('goals.subtitle')}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: t('goals.title') }]}
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
            isLoading={createMutation.isCreating}
          >
            {t('goals.createGoal')}
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Error Alert */}
        {loadError && (
          <Alert variant="error" closable className="mb-6">
            {t('goals.errors.loadFailed')}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && goals && goals.length === 0 ? (
          <EmptyState
            icon={<Target />}
            title={t('goals.noGoals')}
            description={t('goals.noGoalsDesc')}
            action={{
              label: t('goals.createGoal'),
              onClick: () => setShowCreateModal(true),
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        ) : (
          /* Goals Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals?.map((goal) => {
              const percentage = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
              const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);
              const daysRemaining = getDaysRemaining(goal.targetDate);

              return (
                <Card key={goal.id} variant="elevated">
                  <CardHeader
                    title={goal.name}
                    subtitle={goal.goalType ? t(`goals.categories.${goal.goalType}`) : t('goals.categories.general')}
                    action={
                      <Badge variant={getPriorityVariant(goal.priority.toString())} size="sm">
                        {goal.priority}
                      </Badge>
                    }
                  />

                  <CardBody className="mt-4">
                    {/* Description */}
                    {goal.description && (
                      <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-600">{t('goals.progress')}</span>
                        <span className="font-semibold">
                          <PercentageText value={percentage} decimals={1} />
                        </span>
                      </div>
                      <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getProgressColor(parseFloat(goal.currentAmount), parseFloat(goal.targetAmount))}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Goal Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('goals.current')}</span>
                        <span className="font-medium">
                          <CurrencyText value={parseFloat(goal.currentAmount)} currency={goal.currency} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('goals.target')}</span>
                        <span className="font-medium">
                          <CurrencyText value={parseFloat(goal.targetAmount)} currency={goal.currency} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('budgets.remaining')}</span>
                        <span
                          className={`font-medium ${remaining > 0 ? 'text-blue-600' : 'text-green-600'}`}
                        >
                          <CurrencyText value={remaining} currency={goal.currency} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('goals.targetDate')}</span>
                        <span className="font-medium text-xs">
                          <DateText value={goal.targetDate} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('goals.daysLeft')}</span>
                        <span
                          className={`font-medium ${daysRemaining < 30 ? 'text-red-600' : daysRemaining < 90 ? 'text-yellow-600' : 'text-green-600'}`}
                        >
                          {daysRemaining > 0 ? daysRemaining : 0} {t('goals.daysUnit')}
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
                        leftIcon={<TrendingUp size={16} />}
                        onClick={() => console.log('Add contribution:', goal.id)}
                        fullWidth
                      >
                        {t('common.add')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit size={16} />}
                        onClick={() => setEditingGoal(goal)}
                        fullWidth
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 size={16} />}
                        onClick={() => handleDelete(goal)}
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
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('goals.createGoal')}
        size="md"
        preventClose={createMutation.isCreating}
        footer={
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
              form="goal-form"
              isLoading={createMutation.isCreating}
            >
              {t('goals.createGoal')}
            </Button>
          </DialogFooter>
        }
      >
        <GoalForm
          onSubmit={handleCreate}
          isLoading={createMutation.isCreating}
          error={createMutation.error ? t('goals.errors.createFailed') : undefined}
          onClearError={createMutation.reset}
        />
      </Dialog>

      {/* Edit Modal */}
      {editingGoal && (
        <Dialog
          isOpen={true}
          onClose={() => setEditingGoal(null)}
          title={t('goals.editGoal')}
          size="md"
          preventClose={updateMutation.isUpdating}
          footer={
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setEditingGoal(null)}
                disabled={updateMutation.isUpdating}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                type="submit"
                form="goal-form"
                isLoading={updateMutation.isUpdating}
              >
                {t('common.saveChanges')}
              </Button>
            </DialogFooter>
          }
        >
          <GoalForm
            goal={editingGoal}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isUpdating}
            error={updateMutation.error ? t('goals.errors.updateFailed') : undefined}
            onClearError={updateMutation.reset}
          />
        </Dialog>
      )}
    </div>
  );
};
