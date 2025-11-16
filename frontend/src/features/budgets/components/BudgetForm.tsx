// features/budgets/components/BudgetForm.tsx
import { useState, useEffect } from 'react';
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

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
];

const CATEGORY_OPTIONS = [
  { value: 'Groceries', label: 'Groceries' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Shopping', label: 'Shopping' },
  { value: 'Dining', label: 'Dining' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Housing', label: 'Housing' },
  { value: 'Other', label: 'Other' },
];

export const BudgetForm = ({
  budget,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: BudgetFormProps) => {
  const isEditMode = !!budget;

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
        label="Budget Name"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g., Monthly Groceries Budget"
        disabled={isLoading}
        validation={{
          required: { value: true, message: 'Budget name is required' },
          minLength: { value: 1, message: 'Budget name is required' },
          maxLength: { value: 100, message: 'Budget name must not exceed 100 characters' },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, name: errors }));
        }}
        showValidation
      />

      <SelectField
        label="Category"
        required
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        options={CATEGORY_OPTIONS}
        disabled={isLoading}
        hint="Select the spending category for this budget"
      />

      <FormField
        label="Budget Amount"
        type="number"
        step="0.01"
        required
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
        placeholder="0.00"
        icon={<DollarSign className="h-5 w-5 text-gray-400" />}
        disabled={isLoading}
        hint="Set the maximum amount you plan to spend"
        validation={{
          required: { value: true, message: 'Budget amount is required' },
          min: { value: 0.01, message: 'Budget amount must be greater than 0' },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, amount: errors }));
        }}
        showValidation
      />

      <SelectField
        label="Period"
        required
        value={formData.period}
        onChange={(e) => setFormData({ ...formData, period: e.target.value as BudgetPeriod })}
        options={PERIOD_OPTIONS}
        disabled={isLoading}
        hint="Select the budget period"
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Start Date"
          type="date"
          required
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          icon={<Calendar className="h-5 w-5 text-gray-400" />}
          disabled={isLoading}
          validation={{
            required: { value: true, message: 'Start date is required' },
          }}
          onValidationChange={(isValid, errors) => {
            setFieldErrors((prev) => ({ ...prev, startDate: errors }));
          }}
          showValidation
        />

        <FormField
          label="End Date"
          type="date"
          required
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          icon={<Calendar className="h-5 w-5 text-gray-400" />}
          disabled={isLoading}
          validation={{
            required: { value: true, message: 'End date is required' },
            validate: {
              afterStart: (value) =>
                !formData.startDate ||
                value >= formData.startDate ||
                'End date must be after start date',
            },
          }}
          onValidationChange={(isValid, errors) => {
            setFieldErrors((prev) => ({ ...prev, endDate: errors }));
          }}
          showValidation
        />
      </div>

      <FormField
        label="Alert Threshold (%)"
        type="number"
        step="1"
        value={formData.alertThreshold}
        onChange={(e) =>
          setFormData({ ...formData, alertThreshold: parseInt(e.target.value) || 80 })
        }
        placeholder="80"
        disabled={isLoading}
        hint="Get notified when spending reaches this percentage (0-100)"
        validation={{
          min: { value: 0, message: 'Threshold must be at least 0%' },
          max: { value: 100, message: 'Threshold cannot exceed 100%' },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, alertThreshold: errors }));
        }}
        showValidation
      />

      {isEditMode && budget && (
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Current Progress</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <span className="font-medium">Spent:</span> EUR {budget.spent.toFixed(2)} /{' '}
              {budget.amount.toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Remaining:</span> EUR{' '}
              {(budget.amount - budget.spent).toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className="capitalize">{budget.status}</span>
            </p>
          </div>
        </div>
      )}
    </form>
  );
};
