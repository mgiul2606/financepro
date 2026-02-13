// src/components/EditAccountModalV2.tsx
import { useState, useEffect } from 'react';
import { accountService } from '../services/accountService';
import type { Account, AccountUpdate } from '../services/accountService';
import { Modal, ModalFooter } from './ui/Modal';
import { FormField, SelectField } from './ui/FormField';
import { Alert } from './ui/Alert';
import { isAxiosError } from 'axios';
import { Wallet, TrendingUp } from 'lucide-react';

interface EditAccountModalProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (account: Account) => void;
}

export const EditAccountModal = ({ account, isOpen, onClose, onUpdated }: EditAccountModalProps) => {
  const [formData, setFormData] = useState<AccountUpdate>({
    name: account.name,
    current_balance: account.current_balance,
    currency: account.currency,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when account changes
  useEffect(() => {
    setFormData({
      name: account.name,
      current_balance: account.current_balance,
      currency: account.currency,
    });
    setError('');
    setFieldErrors({});
    setHasChanges(false);
  }, [account]);

  // Check for changes
  useEffect(() => {
    const changed = 
      formData.name !== account.name ||
      formData.current_balance !== account.current_balance ||
      formData.currency !== account.currency;
    setHasChanges(changed);
  }, [formData, account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const hasErrors = Object.values(fieldErrors).some(errors => errors.length > 0);
    if (hasErrors) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    if (!hasChanges) {
      onClose();
      return;
    }

    setError('');
    setLoading(true);

    try {
      const updatedAccount = await accountService.update(account.id, formData);
      onUpdated(updatedAccount);
      onClose();
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to update account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currencyOptions = [
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'GBP', label: 'GBP (£)' },
  ];

  const balanceDifference = formData.current_balance - account.current_balance;
  const showBalanceDiff = hasChanges && balanceDifference !== 0;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Edit Account"
      size="md"
      preventClose={loading}
      footer={
        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-account-form"
            disabled={loading || !hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Updating...' : 'Update Account'}
          </button>
        </ModalFooter>
      }
    >
      <form id="edit-account-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" closable onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {hasChanges && (
          <Alert variant="info" icon={<TrendingUp className="h-5 w-5" />}>
            You have unsaved changes
          </Alert>
        )}

        <FormField
          label="Account Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Main Account, Savings..."
          icon={<Wallet className="h-5 w-5 text-gray-400" />}
          validation={{
            required: { value: true, message: 'Account name is required' },
            minLength: { value: 2, message: 'Account name must be at least 2 characters' },
            maxLength: { value: 50, message: 'Account name must not exceed 50 characters' },
            pattern: {
              value: /^[a-zA-Z0-9\s\-_]+$/,
              message: 'Account name can only contain letters, numbers, spaces, hyphens, and underscores'
            }
          }}
          onValidationChange={(isValid, errors) => {
            setFieldErrors(prev => ({ ...prev, name: errors }));
          }}
          showValidation
        />

        <div>
          <FormField
            label="Current Balance"
            type="number"
            step="0.01"
            value={formData.current_balance}
            onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            hint={showBalanceDiff ? (
              <span className={balanceDifference > 0 ? 'text-green-600' : 'text-red-600'}>
                {balanceDifference > 0 ? '+' : ''}{balanceDifference.toFixed(2)} from original
              </span>
            ) : 'Enter the current balance of this account'}
            validation={{
              min: { value: 0, message: 'Balance cannot be negative' },
              max: { value: 999999999, message: 'Balance is too large' }
            }}
            onValidationChange={(isValid, errors) => {
              setFieldErrors(prev => ({ ...prev, current_balance: errors }));
            }}
          />
          
          <div className="mt-2 text-sm text-gray-500">
            Initial Balance: {account.currency} {account.initial_balance.toFixed(2)}
          </div>
        </div>

        <SelectField
          label="Currency"
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          options={currencyOptions}
          hint="Select the currency for this account"
        />
      </form>
    </Modal>
  );
};
