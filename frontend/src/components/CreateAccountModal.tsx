// src/components/CreateAccountModal.tsx
import { useState } from 'react';
import { accountService } from '../services/accountService';
import type { Account, AccountCreate } from '../services/accountService';
import { Modal, ModalFooter } from './ui/Modal';
import { FormField, SelectField } from './ui/FormField';
import { Alert } from './ui/Alert';
import { isAxiosError } from 'axios';
import { Wallet } from 'lucide-react';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (account: Account) => void;
}

export const CreateAccountModal = ({ isOpen, onClose, onCreated }: CreateAccountModalProps) => {
  const [formData, setFormData] = useState<AccountCreate>({
    name: '',
    initial_balance: 0,
    currency: 'EUR',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const hasErrors = Object.values(fieldErrors).some(errors => errors.length > 0);
    if (hasErrors) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const account = await accountService.create(formData);
      onCreated(account);
      // Reset form on success
      setFormData({ name: '', initial_balance: 0, currency: 'EUR' });
      setFieldErrors({});
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to create account. Please try again.');
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

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Create New Account"
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
            form="create-account-form"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </ModalFooter>
      }
    >
      <form id="create-account-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" closable onClose={() => setError('')}>
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

        <FormField
          label="Initial Balance"
          type="number"
          step="0.01"
          value={formData.initial_balance}
          onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
          hint="Enter the current balance of this account"
          validation={{
            min: { value: 0, message: 'Initial balance cannot be negative' },
            max: { value: 999999999, message: 'Initial balance is too large' }
          }}
          onValidationChange={(isValid, errors) => {
            setFieldErrors(prev => ({ ...prev, initial_balance: errors }));
          }}
        />

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
