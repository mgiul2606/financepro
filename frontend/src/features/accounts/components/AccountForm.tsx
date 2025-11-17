// features/accounts/components/AccountForm.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

export const AccountForm = ({
  account,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: AccountFormProps) => {
  const { t } = useTranslation();
  const isEditMode = !!account;

  const CURRENCY_OPTIONS = [
    { value: 'EUR', label: t('settings.currencies.EUR') },
    { value: 'USD', label: t('settings.currencies.USD') },
    { value: 'GBP', label: t('settings.currencies.GBP') },
    { value: 'CHF', label: t('settings.currencies.CHF') },
    { value: 'JPY', label: t('settings.currencies.JPY') },
  ];

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
        label={t('accounts.accountName')}
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder={t('accounts.accountNamePlaceholder')}
        icon={<Wallet className="h-5 w-5 text-gray-400" />}
        disabled={isLoading}
        validation={{
          required: { value: true, message: t('accounts.errors.nameRequired') },
          minLength: { value: 1, message: t('accounts.errors.nameRequired') },
          maxLength: { value: 100, message: t('accounts.errors.nameTooLong') },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, name: errors }));
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
        hint={t('accounts.currencyHint')}
      />

      <FormField
        label={t('accounts.initialBalance')}
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
            ? t('accounts.initialBalanceHintEdit')
            : t('accounts.initialBalanceHint')
        }
        validation={{
          required: { value: true, message: t('accounts.errors.balanceRequired') },
          min: { value: 0, message: t('accounts.errors.balanceNegative') },
        }}
        onValidationChange={(isValid, errors) => {
          setFieldErrors((prev) => ({ ...prev, initial_balance: errors }));
        }}
        showValidation
      />

      {isEditMode && account && (
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">{t('accounts.currentInfo')}</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <span className="font-medium">{t('accounts.currentBalance')}:</span>{' '}
              {account.currency} {parseFloat(account.current_balance).toFixed(2)}
            </p>
            <p>
              <span className="font-medium">{t('accounts.created')}:</span>{' '}
              {new Date(account.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </form>
  );
};
