// features/goals/components/GoalForm.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

export const GoalForm = ({
  goal,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: GoalFormProps) => {
  const { t } = useTranslation();
  const isEditMode = !!goal;

  const PRIORITY_OPTIONS = [
    { value: 'low', label: t('goals.priorities.low') },
    { value: 'medium', label: t('goals.priorities.medium') },
    { value: 'high', label: t('goals.priorities.high') },
  ];

  const CURRENCY_OPTIONS = [
    { value: 'EUR', label: t('settings.currencies.EUR') },
    { value: 'USD', label: t('settings.currencies.USD') },
    { value: 'GBP', label: t('settings.currencies.GBP') },
  ];

  const CATEGORY_OPTIONS = [
    { value: 'Savings', label: t('goals.categories.savings') },
    { value: 'Investment', label: t('goals.categories.investment') },
    { value: 'Travel', label: t('goals.categories.travel') },
    { value: 'Education', label: t('goals.categories.education') },
    { value: 'Home', label: t('goals.categories.home') },
    { value: 'Other', label: t('goals.categories.other') },
  ];

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
        label={t('goals.name')}
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder={t('goals.namePlaceholder')}
        icon={<Target className="h-5 w-5 text-gray-400" />}
        disabled={isLoading}
        validation={{
          required: { value: true, message: t('goals.errors.nameRequired') },
          minLength: { value: 1, message: t('goals.errors.nameRequired') },
          maxLength: { value: 100, message: t('goals.errors.nameTooLong') },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, name: errors }));
        }}
        showValidation
      />

      <TextareaField
        label={t('goals.descriptionLabel')}
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder={t('goals.descriptionPlaceholder')}
        disabled={isLoading}
        hint={t('goals.descriptionHint')}
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('goals.targetAmount')}
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
            required: { value: true, message: t('goals.errors.targetAmountRequired') },
            min: { value: 0.01, message: t('goals.errors.targetAmountPositive') },
          }}
          onValidationChange={(isValid, errors) => {
            setFieldErrors((prev) => ({ ...prev, targetAmount: errors }));
          }}
          showValidation
        />

        <SelectField
          label={t('accounts.currency')}
          required
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          options={CURRENCY_OPTIONS}
          disabled={isLoading}
        />
      </div>

      <FormField
        label={t('goals.targetDate')}
        type="date"
        required
        value={formData.targetDate}
        onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
        icon={<Calendar className="h-5 w-5 text-gray-400" />}
        disabled={isLoading}
        hint={t('goals.targetDateHint')}
        validation={{
          required: { value: true, message: t('goals.errors.targetDateRequired') },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, targetDate: errors }));
        }}
        showValidation
      />

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label={t('goals.priority')}
          required
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as GoalPriority })}
          options={PRIORITY_OPTIONS}
          disabled={isLoading}
          hint={t('goals.priorityHint')}
        />

        <SelectField
          label={t('transactions.category')}
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={CATEGORY_OPTIONS}
          disabled={isLoading}
        />
      </div>

      {isEditMode && goal && (
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">{t('goals.currentProgress')}</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <span className="font-medium">{t('goals.saved')}:</span> {goal.currency}{' '}
              {goal.currentAmount.toFixed(2)} / {goal.targetAmount.toFixed(2)}
            </p>
            <p>
              <span className="font-medium">{t('budgets.remaining')}:</span> {goal.currency}{' '}
              {(goal.targetAmount - goal.currentAmount).toFixed(2)}
            </p>
            <p>
              <span className="font-medium">{t('goals.progress')}:</span>{' '}
              {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%
            </p>
            <p>
              <span className="font-medium">{t('budgets.status')}:</span>{' '}
              <span className="capitalize">{goal.status.replace('_', ' ')}</span>
            </p>
          </div>
        </div>
      )}
    </form>
  );
};
