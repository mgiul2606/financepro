// features/goals/pages/GoalsPage.tsx
import { useState } from 'react';
import { Plus, Target, Edit, Trash2, TrendingUp, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardBody, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CurrencyText, PercentageText, DateText } from '@/core/components/formatters';
import { EmptyState } from '@/core/components/composite/EmptyState';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { useConfirm } from '@/hooks/useConfirm';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoalForm } from '../components/GoalForm';
import { GoalContributionForm } from '../components/GoalContributionForm';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useAddGoalContribution } from '../goals.hooks';
import type { GoalResponse as Goal, GoalCreate, GoalUpdate } from '../goals.types';
import type { SupportedCurrency } from '@/utils/currency';
import { getPriorityVariant, getProgressBarClass, getDaysRemainingClass } from '@/lib/finance-colors';

export const GoalsPage: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);

  // Data fetching
  const { goals, isLoading, error: loadError, refetch } = useGoals();

  // Mutations
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();
  const contributionMutation = useAddGoalContribution();

  // Handlers
  const handleCreate = async (data: GoalCreate | GoalUpdate) => {
    try {
      await createMutation.createGoal(data as GoalCreate);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
      throw error;
    }
  };

  const handleUpdate = async (data: GoalCreate | GoalUpdate) => {
    if (!editingGoal) return;

    try {
      await updateMutation.updateGoal(editingGoal.id, data as GoalUpdate);
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
      confirmButtonVariant: 'destructive',
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
            variant="default"
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
          <Alert variant="destructive" className="mb-6">
            <div className="flex items-center justify-between">
              <span>{t('goals.errors.loadFailed')}</span>
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => refetch()}>
                {t('common.retry')}
              </Button>
            </div>
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
                  <CardHeader>
                    <CardTitle>{goal.name}</CardTitle>
                    <CardDescription>
                      {goal.goalType ? t(`goals.categories.${goal.goalType}`) : t('goals.categories.general')}
                    </CardDescription>
                    <CardAction>
                      <Badge variant={getPriorityVariant(goal.priority.toString())}>
                        {goal.priority}
                      </Badge>
                    </CardAction>
                  </CardHeader>

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
                          className={`h-full transition-all duration-300 ${getProgressBarClass(percentage)}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Goal Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('goals.current')}</span>
                        <span className="font-medium">
                          <CurrencyText value={parseFloat(goal.currentAmount)} currency={goal.currency as SupportedCurrency} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('goals.target')}</span>
                        <span className="font-medium">
                          <CurrencyText value={parseFloat(goal.targetAmount)} currency={goal.currency as SupportedCurrency} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">{t('budgets.remaining')}</span>
                        <span
                          className={`font-medium ${remaining > 0 ? 'text-muted-foreground' : 'text-income'}`}
                        >
                          <CurrencyText value={remaining} currency={goal.currency as SupportedCurrency} />
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
                          className={`font-medium ${getDaysRemainingClass(daysRemaining)}`}
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
                        onClick={() => setContributionGoal(goal)}
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
                        className="text-expense hover:bg-expense-subtle"
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
      <Dialog open={showCreateModal} onOpenChange={(open) => !open && !createMutation.isCreating && setShowCreateModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('goals.createGoal')}</DialogTitle>
          </DialogHeader>
          <GoalForm
            onSubmit={handleCreate}
            isLoading={createMutation.isCreating}
            error={createMutation.error ? t('goals.errors.createFailed') : undefined}
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
              form="goal-form"
              isLoading={createMutation.isCreating}
            >
              {t('goals.createGoal')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingGoal} onOpenChange={(open) => !open && !updateMutation.isUpdating && setEditingGoal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('goals.editGoal')}</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <GoalForm
              goal={editingGoal}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isUpdating}
              error={updateMutation.error ? t('goals.errors.updateFailed') : undefined}
              onClearError={updateMutation.reset}
            />
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setEditingGoal(null)}
              disabled={updateMutation.isUpdating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="default"
              type="submit"
              form="goal-form"
              isLoading={updateMutation.isUpdating}
            >
              {t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contribution Modal */}
      <Dialog
        open={!!contributionGoal}
        onOpenChange={(open) => {
          if (!open && !contributionMutation.isAdding) {
            setContributionGoal(null);
            contributionMutation.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('goals.contribution.title')}
              {contributionGoal && ` — ${contributionGoal.name}`}
            </DialogTitle>
          </DialogHeader>
          {contributionGoal && (
            <GoalContributionForm
              onSubmit={async (data) => {
                await contributionMutation.addContribution({
                  goalId: contributionGoal.id,
                  data: {
                    amount: data.amount,
                    contributionDate: data.contributionDate,
                    notes: data.notes,
                  },
                });
                setContributionGoal(null);
                contributionMutation.reset();
              }}
              isLoading={contributionMutation.isAdding}
              error={contributionMutation.error ? t('goals.contribution.addFailed') : undefined}
              onClearError={contributionMutation.reset}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
