// features/budgets/components/BudgetForm.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calendar, Plus, X } from 'lucide-react';
import { FormField, SelectField } from '@/components/ui/FormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/features/categories/categories.hooks';
import type { Budget, BudgetCreate, BudgetUpdate, PeriodType } from '../budgets.types';
import {
  PERIOD_TYPE_OPTIONS,
  DEFAULT_ALERT_THRESHOLD,
} from '../budgets.constants';

interface CategoryAllocation {
  categoryId: string;
  allocatedAmount: number;
}

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

  // Fetch expense categories (isIncome: false)
  const { categories } = useCategories({ isIncome: false });

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
    scopeType: 'user',
    rolloverEnabled: budget?.rolloverEnabled ?? false,
    alertThresholdPercent: budget?.alertThresholdPercent ?? DEFAULT_ALERT_THRESHOLD,
  });

  // Category allocations state
  const [allocations, setAllocations] = useState<CategoryAllocation[]>(() => {
    if (budget?.categoryAllocations) {
      return budget.categoryAllocations.map((a) => ({
        categoryId: a.categoryId,
        allocatedAmount: parseFloat(String(a.allocatedAmount)),
      }));
    }
    return [];
  });

  // Field-level errors tracked for FormField visual validation feedback
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

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
        scopeType: 'user',
        rolloverEnabled: budget.rolloverEnabled ?? false,
        alertThresholdPercent: budget.alertThresholdPercent ?? DEFAULT_ALERT_THRESHOLD,
      });
      if (budget.categoryAllocations) {
        setAllocations(
          budget.categoryAllocations.map((a) => ({
            categoryId: a.categoryId,
            allocatedAmount: parseFloat(String(a.allocatedAmount)),
          }))
        );
      }
    }
  }, [budget]);

  // Categories not yet allocated
  const availableCategories = categories.filter(
    (cat) => !allocations.some((a) => a.categoryId === cat.id)
  );

  const handleAddAllocation = () => {
    if (availableCategories.length === 0) return;
    setAllocations([
      ...allocations,
      { categoryId: availableCategories[0].id, allocatedAmount: 0 },
    ]);
  };

  const handleRemoveAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleAllocationChange = (
    index: number,
    field: keyof CategoryAllocation,
    value: string | number
  ) => {
    const updated = [...allocations];
    if (field === 'categoryId') {
      updated[index] = { ...updated[index], categoryId: value as string };
    } else {
      updated[index] = { ...updated[index], allocatedAmount: parseFloat(String(value)) || 0 };
    }
    setAllocations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate directly at submit time to avoid stale fieldErrors state
    const errors: string[] = [];
    if (!formData.name || formData.name.trim().length === 0) {
      errors.push('name');
    }
    if (!formData.totalAmount || Number(formData.totalAmount) <= 0) {
      errors.push('totalAmount');
    }
    if (!formData.startDate) {
      errors.push('startDate');
    }
    if (errors.length > 0) {
      return;
    }

    // Build category_allocations for the API
    const validAllocations = allocations.filter(
      (a) => a.categoryId && a.allocatedAmount > 0
    );

    const submitData = {
      ...formData,
      categoryAllocations: validAllocations.length > 0 ? validAllocations : undefined,
    };

    try {
      await onSubmit(submitData);
    } catch (err) {
      // Error handling is done by parent component
      console.error('Form submission error:', err);
    }
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0);
  const budgetTotal = parseFloat(String(formData.totalAmount)) || 0;

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

      {/* Category Allocations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {t('budgets.categoryAllocations')}
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<Plus className="h-3 w-3" />}
            onClick={handleAddAllocation}
            disabled={isLoading || availableCategories.length === 0}
          >
            {t('budgets.addCategory')}
          </Button>
        </div>

        {allocations.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            {t('budgets.noCategoryAllocations')}
          </p>
        ) : (
          <div className="space-y-2">
            {allocations.map((alloc, index) => {
              // Build options: current selection + available categories
              const selectOptions = categories
                .filter(
                  (cat) =>
                    cat.id === alloc.categoryId ||
                    !allocations.some((a) => a.categoryId === cat.id)
                )
                .map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                }));

              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <select
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={alloc.categoryId}
                      onChange={(e) =>
                        handleAllocationChange(index, 'categoryId', e.target.value)
                      }
                      disabled={isLoading}
                    >
                      {selectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={t('budgets.allocatedAmount')}
                      value={alloc.allocatedAmount || ''}
                      onChange={(e) =>
                        handleAllocationChange(index, 'allocatedAmount', e.target.value)
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAllocation(index)}
                    disabled={isLoading}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {/* Allocation summary */}
            {allocations.length > 0 && budgetTotal > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-600">{t('budgets.totalAllocated')}</span>
                <span
                  className={`font-medium ${
                    totalAllocated > budgetTotal ? 'text-red-600' : 'text-gray-900'
                  }`}
                >
                  {formData.currency} {totalAllocated.toFixed(2)} / {budgetTotal.toFixed(2)}
                  {totalAllocated > budgetTotal && (
                    <span className="text-red-600 ml-1">({t('budgets.overAllocated')})</span>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500">
          {t('budgets.categoryAllocationsHint')}
        </p>
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
