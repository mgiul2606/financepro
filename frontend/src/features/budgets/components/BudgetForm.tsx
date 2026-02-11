// features/budgets/components/BudgetForm.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calendar } from 'lucide-react';
import { FormField, SelectField } from '@/components/ui/FormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Budget, BudgetCreate, BudgetUpdate, PeriodType } from '../budgets.types';
import {
  PERIOD_TYPE_OPTIONS,
  DEFAULT_ALERT_THRESHOLD,
} from '../budgets.constants';

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

  // Translate period options for display
  const periodOptions = PERIOD_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.label),
  }));

  const [formData, setFormData] = useState<BudgetCreate>({
    name: budget?.name || '',
    periodType: budget?.periodType || 'monthly',
    startDate: budget?.startDate || new Date().toISOString().split('T')[0],
    endDate: budget?.endDate || undefined,
    totalAmount: budget?.totalAmount || 0,
    currency: budget?.currency || 'EUR',
    alertThresholdPercent: budget?.alertThresholdPercent ?? DEFAULT_ALERT_THRESHOLD,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Update form when budget changes (edit mode)
  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        periodType: budget.periodType,
        startDate: budget.startDate,
        endDate: budget.endDate || undefined,
        totalAmount: budget.totalAmount,
        currency: budget.currency,
        alertThresholdPercent: budget.alertThresholdPercent ?? DEFAULT_ALERT_THRESHOLD,
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
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {onClearError && (
              <button type="button" onClick={onClearError} className="text-sm underline ml-2">
                {t('common.dismiss')}
              </button>
            )}
          </AlertDescription>
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
        onValidationChange={(_isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, name: errors }));
        }}
        showValidation
      />

      <FormField
        label={t('budgets.amount')}
        type="number"
        step="0.01"
        required
        value={formData.totalAmount}
        onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
        placeholder={t('budgets.amountPlaceholder')}
        icon={<DollarSign className="h-5 w-5 text-gray-400" />}
        disabled={isLoading}
        hint={t('budgets.amountHint')}
        validation={{
          required: { value: true, message: t('budgets.errors.amountRequired') },
          min: { value: 0.01, message: t('budgets.errors.amountPositive') },
        }}
        onValidationChange={(_isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, totalAmount: errors }));
        }}
        showValidation
      />

      <SelectField
        label={t('budgets.period')}
        required
        value={formData.periodType}
        onChange={(value) => setFormData({ ...formData, periodType: value as PeriodType })}
        options={periodOptions}
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
          onValidationChange={(_isValid, errors) => {
            setFieldErrors((prev) => ({ ...prev, startDate: errors }));
          }}
          showValidation
        />

        <FormField
          label={t('budgets.endDate')}
          type="date"
          required
          value={formData.endDate ?? ''}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          icon={<Calendar className="h-5 w-5 text-gray-400" />}
          disabled={isLoading}
          validation={{
            required: { value: true, message: t('budgets.errors.endDateRequired') },
          }}
          onValidationChange={(_isValid, errors) => {
            setFieldErrors((prev) => ({ ...prev, endDate: errors }));
          }}
          showValidation
        />
      </div>

      <FormField
        label={t('budgets.alertThreshold')}
        type="number"
        step="1"
        value={formData.alertThresholdPercent}
        onChange={(e) =>
          setFormData({ ...formData, alertThresholdPercent: parseInt(e.target.value) || DEFAULT_ALERT_THRESHOLD })
        }
        placeholder={t('budgets.alertThresholdPlaceholder')}
        disabled={isLoading}
        hint={t('budgets.alertThresholdHint')}
        validation={{
          min: { value: 0, message: t('budgets.errors.thresholdMin') },
          max: { value: 100, message: t('budgets.errors.thresholdMax') },
        }}
        onValidationChange={(_isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, alertThresholdPercent: errors }));
        }}
        showValidation
      />

      {isEditMode && budget && (
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">{t('budgets.currentProgress')}</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <span className="font-medium">{t('budgets.spent')}:</span> {budget.currency}{' '}
              {parseFloat(budget.totalSpent ?? '0').toFixed(2)} / {parseFloat(budget.totalAmount).toFixed(2)}
            </p>
            <p>
              <span className="font-medium">{t('budgets.remaining')}:</span> {budget.currency}{' '}
              {parseFloat(budget.remaining ?? '0').toFixed(2)}
            </p>
            <p>
              <span className="font-medium">{t('budgets.status')}:</span>{' '}
              <span className="capitalize">
                {parseFloat(budget.usagePercentage ?? '0') >= 100
                  ? t('budgets.exceeded')
                  : parseFloat(budget.usagePercentage ?? '0') >= (budget.alertThresholdPercent ?? 80)
                    ? t('budgets.warning')
                    : t('budgets.onTrack')}
              </span>
            </p>
          </div>
        </div>
      )}
    </form>
  );
};
