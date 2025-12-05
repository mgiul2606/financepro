import { useForm, type FieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../core/components/atomic/Button';
import { Input } from '../../../core/components/atomic/Input';
import { Select } from '../../../core/components/atomic/Select';
import { TransactionCreate, TransactionType } from '@/api/generated/models';
import { useCategories } from '@/features/categories';
import { useAccounts } from '@/features/accounts';

/**
 * Transaction Form Component
 * Uses generated types from OpenAPI (Pydantic models)
 * Validation: client-side + backend validation (422 errors)
 */

export interface TransactionFormProps {
  onSubmit: (data: TransactionCreate) => void;
  onCancel?: () => void;
  initialData?: Partial<TransactionCreate>;
  isLoading?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { accounts, isLoading: accountsLoading } = useAccounts();

  // Use generated TransactionType enum from backend
  const transactionTypes: { value: keyof typeof TransactionType; label: string }[] = [
    { value: 'income', label: t('transactions.types.income') },
    { value: 'salary', label: t('transactions.types.salary') },
    { value: 'dividend', label: t('transactions.types.dividend') },
    { value: 'refund', label: t('transactions.types.refund') },
    { value: 'purchase', label: t('transactions.types.purchase') },
    { value: 'payment', label: t('transactions.types.payment') },
    { value: 'withdrawal', label: t('transactions.types.withdrawal') },
    { value: 'bank_transfer', label: t('transactions.types.bank_transfer') },
    { value: 'internal_transfer', label: t('transactions.types.internal_transfer') },
    { value: 'fee', label: t('transactions.types.fee') },
    { value: 'tax', label: t('transactions.types.tax') },
    { value: 'other', label: t('transactions.types.other') },
  ];

  // Prepare category options for Select
  const categoryOptions = categories?.map((cat) => ({
    value: cat.id,
    label: cat.name,
  })) || [];

  // Prepare account options for Select
  const accountOptions = accounts?.map((acc) => ({
    value: acc.id,
    label: `${acc.name} (${acc.account_type})`,
  })) || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionCreate>({
    defaultValues: {
      transaction_type: TransactionType.purchase,
      currency: 'EUR',
      transaction_date: new Date().toISOString().split('T')[0],
      ...initialData,
    },
    mode: 'onChange',
  });

  const handleFormSubmit = (data: TransactionCreate) => {
    onSubmit(data);
  };

  // Helper to get error message
  const getErrorMessage = (error?: FieldError): string | undefined => {
    return error?.message;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label={t('transactions.type')}
          options={transactionTypes}
          error={getErrorMessage(errors.transaction_type)}
          fullWidth
          required
          {...register('transaction_type', {
            required: 'Transaction type is required',
          })}
        />

        <Input
          label={t('transactions.amount')}
          type="number"
          step="0.01"
          placeholder={t('transactions.amountPlaceholder')}
          error={getErrorMessage(errors.amount)}
          fullWidth
          required
          {...register('amount', {
            required: 'Amount is required',
            valueAsNumber: true,
            min: { value: 0.01, message: 'Amount must be greater than 0' },
          })}
        />
      </div>

      <Input
        label={t('transactions.description')}
        placeholder={t('transactions.descriptionPlaceholder')}
        error={getErrorMessage(errors.description)}
        fullWidth
        required
        {...register('description', {
          required: 'Description is required',
          minLength: { value: 1, message: 'Description cannot be empty' },
        })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label={t('transactions.category')}
          options={categoryOptions}
          placeholder={categoriesLoading ? 'Loading categories...' : t('transactions.categoryPlaceholder')}
          error={getErrorMessage(errors.category_id)}
          fullWidth
          disabled={categoriesLoading}
          {...register('category_id')}
        />

        <Input
          label={t('transactions.date')}
          type="date"
          error={getErrorMessage(errors.transaction_date)}
          fullWidth
          required
          {...register('transaction_date', {
            required: 'Transaction date is required',
          })}
        />
      </div>

      <Input
        label={t('transactions.merchant')}
        placeholder={t('transactions.merchantPlaceholder')}
        error={getErrorMessage(errors.merchant_name)}
        fullWidth
        {...register('merchant_name', {
          maxLength: { value: 255, message: 'Merchant name too long' },
        })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label={t('transactions.accountId')}
          options={accountOptions}
          placeholder={accountsLoading ? 'Loading accounts...' : 'Select an account'}
          error={getErrorMessage(errors.account_id)}
          fullWidth
          required
          disabled={accountsLoading}
          {...register('account_id', {
            required: 'Account is required',
          })}
        />

        <Input
          label={t('accounts.currency')}
          placeholder="EUR"
          error={getErrorMessage(errors.currency)}
          fullWidth
          {...register('currency', {
            required: 'Currency is required',
            pattern: {
              value: /^[A-Z]{3}$/,
              message: 'Currency must be 3 uppercase letters (e.g., EUR, USD)',
            },
          })}
        />
      </div>

      <Input
        label={t('transactions.notes')}
        placeholder={t('transactions.notesPlaceholder')}
        error={getErrorMessage(errors.notes)}
        fullWidth
        {...register('notes')}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? t('transactions.updateTransaction') : t('transactions.createTransaction')}
        </Button>
      </div>
    </form>
  );
};
