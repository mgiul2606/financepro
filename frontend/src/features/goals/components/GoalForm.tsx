// features/goals/components/GoalForm.tsx
import { useState, useEffect } from 'react';
import { Target, Calendar } from 'lucide-react';
import { FormField, SelectField, TextareaField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import type { Goal, GoalCreate, GoalUpdate, GoalPriority } from '../types';

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (data: GoalCreate | GoalUpdate) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  onClearError?: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
];

const CATEGORY_OPTIONS = [
  { value: 'Savings', label: 'Savings' },
  { value: 'Investment', label: 'Investment' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Education', label: 'Education' },
  { value: 'Home', label: 'Home' },
  { value: 'Other', label: 'Other' },
];

export const GoalForm = ({
  goal,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: GoalFormProps) => {
  const isEditMode = !!goal;

  const [formData, setFormData] = useState<GoalCreate>({
    name: goal?.name || '',
    description: goal?.description || '',
    targetAmount: goal?.targetAmount || 0,
    currency: goal?.currency || 'EUR',
    targetDate: goal?.targetDate || '',
    priority: (goal?.priority as GoalPriority) || 'medium',
    category: goal?.category || 'Savings',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        description: goal.description || '',
        targetAmount: goal.targetAmount,
        currency: goal.currency,
        targetDate: goal.targetDate,
        priority: goal.priority,
        category: goal.category || 'Savings',
      });
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasErrors = Object.values(fieldErrors).some((errors) => errors.length > 0);
    if (hasErrors) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <form id="goal-form" onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="error" closable onClose={onClearError}>
          {error}
        </Alert>
      )}

      <FormField
        label="Goal Name"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g., Emergency Fund, Vacation..."
        icon={<Target className="h-5 w-5 text-gray-400" />}
        disabled={isLoading}
        validation={{
          required: { value: true, message: 'Goal name is required' },
          minLength: { value: 1, message: 'Goal name is required' },
          maxLength: { value: 100, message: 'Goal name must not exceed 100 characters' },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, name: errors }));
        }}
        showValidation
      />

      <TextareaField
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Describe your goal..."
        disabled={isLoading}
        hint="Optional: Add details about why this goal is important to you"
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Target Amount"
          type="number"
          step="0.01"
          required
          value={formData.targetAmount}
          onChange={(e) =>
            setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })
          }
          placeholder="0.00"
          disabled={isLoading}
          validation={{
            required: { value: true, message: 'Target amount is required' },
            min: { value: 0.01, message: 'Target amount must be greater than 0' },
          }}
          onValidationChange={(isValid, errors) => {
            setFieldErrors((prev) => ({ ...prev, targetAmount: errors }));
          }}
          showValidation
        />

        <SelectField
          label="Currency"
          required
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          options={CURRENCY_OPTIONS}
          disabled={isLoading}
        />
      </div>

      <FormField
        label="Target Date"
        type="date"
        required
        value={formData.targetDate}
        onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
        icon={<Calendar className="h-5 w-5 text-gray-400" />}
        disabled={isLoading}
        hint="When do you want to achieve this goal?"
        validation={{
          required: { value: true, message: 'Target date is required' },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, targetDate: errors }));
        }}
        showValidation
      />

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Priority"
          required
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as GoalPriority })}
          options={PRIORITY_OPTIONS}
          disabled={isLoading}
          hint="How important is this goal?"
        />

        <SelectField
          label="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={CATEGORY_OPTIONS}
          disabled={isLoading}
        />
      </div>

      {isEditMode && goal && (
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Current Progress</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <span className="font-medium">Saved:</span> {goal.currency}{' '}
              {goal.currentAmount.toFixed(2)} / {goal.targetAmount.toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Remaining:</span> {goal.currency}{' '}
              {(goal.targetAmount - goal.currentAmount).toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Progress:</span>{' '}
              {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%
            </p>
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className="capitalize">{goal.status.replace('_', ' ')}</span>
            </p>
          </div>
        </div>
      )}
    </form>
  );
};
