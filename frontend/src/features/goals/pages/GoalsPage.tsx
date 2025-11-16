// features/goals/pages/GoalsPage.tsx
import { useState } from 'react';
import { Plus, Target, Edit, Trash2, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody, CardFooter } from '@/core/components/atomic/Card';
import { Button } from '@/core/components/atomic/Button';
import { Badge } from '@/core/components/atomic/Badge';
import { EmptyState } from '@/core/components/composite/EmptyState';
import { Spinner } from '@/core/components/atomic/Spinner';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { useConfirm } from '@/hooks/useConfirm';
import { GoalForm } from '../components/GoalForm';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '../hooks/useGoals';
import type { Goal, GoalCreate, GoalUpdate } from '../types';

export const GoalsPage: React.FC = () => {
  const confirm = useConfirm();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Data fetching
  const { data: goals, isLoading, error: loadError } = useGoals();

  // Mutations
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();

  // Handlers
  const handleCreate = async (data: GoalCreate) => {
    try {
      await createMutation.mutateAsync(data);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
      throw error;
    }
  };

  const handleUpdate = async (data: GoalUpdate) => {
    if (!editingGoal) return;

    try {
      await updateMutation.mutateAsync({ id: editingGoal.id, data });
      setEditingGoal(null);
    } catch (error) {
      console.error('Failed to update goal:', error);
      throw error;
    }
  };

  const handleDelete = async (goal: Goal) => {
    const confirmed = await confirm({
      title: 'Delete Goal',
      message: `Are you sure you want to delete "${goal.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      confirmButtonVariant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(goal.id);
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
          <p className="mt-4 text-gray-600">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Goals"
        subtitle="Track and achieve your financial goals"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Goals' }]}
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
            isLoading={createMutation.isPending}
          >
            Create Goal
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Error Alert */}
        {loadError && (
          <Alert variant="error" closable className="mb-6">
            Failed to load goals. Please try again later.
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && goals && goals.length === 0 ? (
          <EmptyState
            icon={<Target />}
            title="No goals yet"
            description="Start tracking your financial goals and make your dreams come true"
            action={{
              label: 'Create Goal',
              onClick: () => setShowCreateModal(true),
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        ) : (
          /* Goals Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals?.map((goal) => {
              const percentage = (goal.currentAmount / goal.targetAmount) * 100;
              const remaining = goal.targetAmount - goal.currentAmount;
              const daysRemaining = getDaysRemaining(goal.targetDate);

              return (
                <Card key={goal.id} variant="elevated">
                  <CardHeader
                    title={goal.name}
                    subtitle={goal.category || 'General'}
                    action={
                      <Badge variant={getPriorityVariant(goal.priority)} size="sm">
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
                        <span className="text-neutral-600">Progress</span>
                        <span className="font-semibold">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getProgressColor(goal.currentAmount, goal.targetAmount)}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Goal Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Current</span>
                        <span className="font-medium">
                          {goal.currency} {goal.currentAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Target</span>
                        <span className="font-medium">
                          {goal.currency} {goal.targetAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Remaining</span>
                        <span
                          className={`font-medium ${remaining > 0 ? 'text-blue-600' : 'text-green-600'}`}
                        >
                          {goal.currency} {remaining.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Target Date</span>
                        <span className="font-medium text-xs">
                          {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Days Left</span>
                        <span
                          className={`font-medium ${daysRemaining < 30 ? 'text-red-600' : daysRemaining < 90 ? 'text-yellow-600' : 'text-green-600'}`}
                        >
                          {daysRemaining > 0 ? daysRemaining : 0} days
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
                        Add
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit size={16} />}
                        onClick={() => setEditingGoal(goal)}
                        fullWidth
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 size={16} />}
                        onClick={() => handleDelete(goal)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
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
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Goal"
        size="md"
        preventClose={createMutation.isPending}
        footer={
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="goal-form"
              isLoading={createMutation.isPending}
            >
              Create Goal
            </Button>
          </ModalFooter>
        }
      >
        <GoalForm
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
          error={createMutation.error ? 'Failed to create goal. Please try again.' : undefined}
          onClearError={createMutation.reset}
        />
      </Modal>

      {/* Edit Modal */}
      {editingGoal && (
        <Modal
          isOpen={true}
          onClose={() => setEditingGoal(null)}
          title="Edit Goal"
          size="md"
          preventClose={updateMutation.isPending}
          footer={
            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => setEditingGoal(null)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                form="goal-form"
                isLoading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </ModalFooter>
          }
        >
          <GoalForm
            goal={editingGoal}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
            error={updateMutation.error ? 'Failed to update goal. Please try again.' : undefined}
            onClearError={updateMutation.reset}
          />
        </Modal>
      )}
    </div>
  );
};
