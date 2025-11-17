import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../core/components/atomic/Button';
import { Input } from '../../../core/components/atomic/Input';
import { Select } from '../../../core/components/atomic/Select';
import { type TransactionCreate, type TransactionType } from '../types';

const transactionSchema = z.object({
  accountId: z.number().int().positive('Please select an account'),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().default('EUR'),
  category: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  date: z.string(),
  merchantName: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export interface TransactionFormProps {
  onSubmit: (data: TransactionCreate) => void;
  onCancel?: () => void;
  initialData?: Partial<TransactionFormData>;
  isLoading?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const transactionTypes: { value: TransactionType; label: string }[] = [
    { value: 'income', label: t('transactions.types.income') },
    { value: 'expense', label: t('transactions.types.expense') },
    { value: 'transfer', label: t('transactions.types.transfer') },
  ];

  const categories = [
    { value: 'Salary', label: t('transactions.categories.salary') },
    { value: 'Groceries', label: t('transactions.categories.groceries') },
    { value: 'Rent', label: t('transactions.categories.rent') },
    { value: 'Transport', label: t('transactions.categories.transport') },
    { value: 'Entertainment', label: t('transactions.categories.entertainment') },
    { value: 'Healthcare', label: t('transactions.categories.healthcare') },
    { value: 'Shopping', label: t('transactions.categories.shopping') },
    { value: 'Utilities', label: t('transactions.categories.utilities') },
    { value: 'Other', label: t('transactions.categories.other') },
  ];
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      currency: 'EUR',
      date: new Date().toISOString().split('T')[0],
      accountId: 1, // Default account
      ...initialData,
    },
  });

  const transactionType = watch('type');

  const handleFormSubmit = (data: TransactionFormData) => {
    onSubmit(data as TransactionCreate);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label={t('transactions.type')}
          options={transactionTypes}
          error={errors.type?.message}
          fullWidth
          required
          {...register('type')}
        />

        <Input
          label={t('transactions.amount')}
          type="number"
          step="0.01"
          placeholder={t('transactions.amountPlaceholder')}
          error={errors.amount?.message}
          fullWidth
          required
          {...register('amount', { valueAsNumber: true })}
        />
      </div>

      <Input
        label={t('transactions.description')}
        placeholder={t('transactions.descriptionPlaceholder')}
        error={errors.description?.message}
        fullWidth
        required
        {...register('description')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label={t('transactions.category')}
          placeholder={t('transactions.categoryPlaceholder')}
          options={categories}
          error={errors.category?.message}
          fullWidth
          {...register('category')}
        />

        <Input
          label={t('transactions.date')}
          type="date"
          error={errors.date?.message}
          fullWidth
          required
          {...register('date')}
        />
      </div>

      <Input
        label={t('transactions.merchant')}
        placeholder={t('transactions.merchantPlaceholder')}
        error={errors.merchantName?.message}
        fullWidth
        {...register('merchantName')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('accounts.currency')}
          placeholder="EUR"
          error={errors.currency?.message}
          fullWidth
          {...register('currency')}
        />

        <Input
          label={t('transactions.accountId')}
          type="number"
          error={errors.accountId?.message}
          fullWidth
          required
          {...register('accountId', { valueAsNumber: true })}
        />
      </div>

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
