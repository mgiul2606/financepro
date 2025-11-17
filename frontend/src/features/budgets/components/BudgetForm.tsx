// features/budgets/components/BudgetForm.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calendar } from 'lucide-react';
import { FormField, SelectField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import type { Budget, BudgetCreate, BudgetUpdate, BudgetPeriod } from '../types';

interface BudgetFormProps {
  /** Budget to edit (if undefined, form is in create mode) */
  budget?: Budget;
  /** Called when form is submitted successfully */
  onSubmit: (data: BudgetCreate | BudgetUpdate) => Promise<void>;
  /** Current loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Called when error alert is closed */
  onClearError?: () => void;
}

export const BudgetForm = ({
  budget,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: BudgetFormProps) => {
  const { t } = useTranslation();
  const isEditMode = !!budget;

  const PERIOD_OPTIONS = [
    { value: 'monthly', label: t('budgets.periods.monthly') },
    { value: 'quarterly', label: t('budgets.periods.quarterly') },
    { value: 'yearly', label: t('budgets.periods.yearly') },
    { value: 'custom', label: t('budgets.periods.custom') },
  ];

  const CATEGORY_OPTIONS = [
    { value: 'Groceries', label: t('budgets.categories.groceries') },
    { value: 'Transportation', label: t('budgets.categories.transportation') },
    { value: 'Entertainment', label: t('budgets.categories.entertainment') },
    { value: 'Healthcare', label: t('budgets.categories.healthcare') },
    { value: 'Shopping', label: t('budgets.categories.shopping') },
    { value: 'Dining', label: t('budgets.categories.dining') },
    { value: 'Utilities', label: t('budgets.categories.utilities') },
    { value: 'Housing', label: t('budgets.categories.housing') },
    { value: 'Other', label: t('budgets.categories.other') },
  ];

  const [formData, setFormData] = useState<BudgetCreate>({
    name: budget?.name || '',
    category: budget?.category || 'Other',
    amount: budget?.amount || 0,
    period: (budget?.period as BudgetPeriod) || 'monthly',
    startDate: budget?.startDate || new Date().toISOString().split('T')[0],
    endDate: budget?.endDate || '',
    alertThreshold: budget?.alertThreshold || 80,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Update form when budget changes (edit mode)
  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        category: budget.category,
        amount: budget.amount,
        period: budget.period,
        startDate: budget.startDate,
        endDate: budget.endDate,
        alertThreshold: budget.alertThreshold || 80,
      });
    }
  }, [budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const hasErrors = Object.values(fieldErrors).some((errors) => errors.length > 0);
    if (hasErrors) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      // Error handling is done by parent component
      console.error('Form submission error:', err);
    }
  };

  return (
    <form id="budget-form" onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="error" closable onClose={onClearError}>
          {error}
        </Alert>
      )}

      <FormField
        label={t('budgets.name')}
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder={t('budgets.namePlaceholder')}
        disabled={isLoading}
        validation={{
          required: { value: true, message: t('budgets.errors.nameRequired') },
          minLength: { value: 1, message: t('budgets.errors.nameRequired') },
          maxLength: { value: 100, message: t('budgets.errors.nameTooLong') },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, name: errors }));
        }}
        showValidation
      />

      <SelectField
        label={t('budgets.category')}
        required
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        options={CATEGORY_OPTIONS}
        disabled={isLoading}
        hint={t('budgets.categoryHint')}
      />

      <FormField
        label={t('budgets.amount')}
        type="number"
        step="0.01"
        required
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
        placeholder={t('budgets.amountPlaceholder')}
        icon={<DollarSign className="h-5 w-5 text-gray-400" />}
        disabled={isLoading}
        hint={t('budgets.amountHint')}
        validation={{
          required: { value: true, message: t('budgets.errors.amountRequired') },
          min: { value: 0.01, message: t('budgets.errors.amountPositive') },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, amount: errors }));
        }}
        showValidation
      />

      <SelectField
        label={t('budgets.period')}
        required
        value={formData.period}
        onChange={(e) => setFormData({ ...formData, period: e.target.value as BudgetPeriod })}
        options={PERIOD_OPTIONS}
        disabled={isLoading}
        hint={t('budgets.periodHint')}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('budgets.startDate')}
          type="date"
          required
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          icon={<Calendar className="h-5 w-5 text-gray-400" />}
          disabled={isLoading}
          validation={{
            required: { value: true, message: t('budgets.errors.startDateRequired') },
          }}
          onValidationChange={(isValid, errors) => {
            setFieldErrors((prev) => ({ ...prev, startDate: errors }));
          }}
          showValidation
        />

        <FormField
          label={t('budgets.endDate')}
          type="date"
          required
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          icon={<Calendar className="h-5 w-5 text-gray-400" />}
          disabled={isLoading}
          validation={{
            required: { value: true, message: t('budgets.errors.endDateRequired') },
          }}
          onValidationChange={(isValid, errors) => {
            setFieldErrors((prev) => ({ ...prev, endDate: errors }));
          }}
          showValidation
        />
      </div>

      <FormField
        label={t('budgets.alertThreshold')}
        type="number"
        step="1"
        value={formData.alertThreshold}
        onChange={(e) =>
          setFormData({ ...formData, alertThreshold: parseInt(e.target.value) || 80 })
        }
        placeholder={t('budgets.alertThresholdPlaceholder')}
        disabled={isLoading}
        hint={t('budgets.alertThresholdHint')}
        validation={{
          min: { value: 0, message: t('budgets.errors.thresholdMin') },
          max: { value: 100, message: t('budgets.errors.thresholdMax') },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, alertThreshold: errors }));
        }}
        showValidation
      />

      {isEditMode && budget && (
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">{t('budgets.currentProgress')}</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <span className="font-medium">{t('budgets.spent')}:</span> EUR {budget.spent.toFixed(2)} /{' '}
              {budget.amount.toFixed(2)}
            </p>
            <p>
              <span className="font-medium">{t('budgets.remaining')}:</span> EUR{' '}
              {(budget.amount - budget.spent).toFixed(2)}
            </p>
            <p>
              <span className="font-medium">{t('budgets.status')}:</span>{' '}
              <span className="capitalize">{budget.status}</span>
            </p>
          </div>
        </div>
      )}
    </form>
  );
};
