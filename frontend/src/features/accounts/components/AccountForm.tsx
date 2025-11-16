// features/accounts/components/AccountForm.tsx
import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { FormField, SelectField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import type { AccountCreate, AccountUpdate, AccountResponse } from '../types';

interface AccountFormProps {
  /** Account to edit (if undefined, form is in create mode) */
  account?: AccountResponse;
  /** Called when form is submitted successfully */
  onSubmit: (data: AccountCreate | AccountUpdate) => Promise<void>;
  /** Current loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Called when error alert is closed */
  onClearError?: () => void;
}

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CHF', label: 'CHF (Fr)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

export const AccountForm = ({
  account,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: AccountFormProps) => {
  const isEditMode = !!account;

  const [formData, setFormData] = useState<AccountCreate>({
    name: account?.name || '',
    currency: account?.currency || 'EUR',
    initial_balance: account ? parseFloat(account.initial_balance) : 0,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Update form when account changes (edit mode)
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        currency: account.currency || 'EUR',
        initial_balance: parseFloat(account.initial_balance),
      });
    }
  }, [account]);

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
    <form id="account-form" onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="error" closable onClose={onClearError}>
          {error}
        </Alert>
      )}

      <FormField
        label="Account Name"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g., Main Account, Savings..."
        icon={<Wallet className="h-5 w-5 text-gray-400" />}
        disabled={isLoading}
        validation={{
          required: { value: true, message: 'Account name is required' },
          minLength: { value: 1, message: 'Account name is required' },
          maxLength: { value: 100, message: 'Account name must not exceed 100 characters' },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, name: errors }));
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
        hint="Select the currency for this account"
      />

      <FormField
        label="Initial Balance"
        type="number"
        step="0.01"
        required
        value={formData.initial_balance}
        onChange={(e) =>
          setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })
        }
        placeholder="0.00"
        disabled={isLoading}
        hint={
          isEditMode
            ? 'Changing this will affect the account balance calculation'
            : 'Enter the current balance of this account'
        }
        validation={{
          required: { value: true, message: 'Initial balance is required' },
          min: { value: 0, message: 'Initial balance cannot be negative' },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, initial_balance: errors }));
        }}
        showValidation
      />

      {isEditMode && account && (
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Current Information</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <span className="font-medium">Current Balance:</span>{' '}
              {account.currency} {parseFloat(account.current_balance).toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Created:</span>{' '}
              {new Date(account.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </form>
  );
};
