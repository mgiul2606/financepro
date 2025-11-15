import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const transactionTypes: { value: TransactionType; label: string }[] = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
];

const categories = [
  { value: 'Salary', label: 'Salary' },
  { value: 'Groceries', label: 'Groceries' },
  { value: 'Rent', label: 'Rent / Housing' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Shopping', label: 'Shopping' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Other', label: 'Other' },
];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
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
          label="Type"
          options={transactionTypes}
          error={errors.type?.message}
          fullWidth
          required
          {...register('type')}
        />

        <Input
          label="Amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.amount?.message}
          fullWidth
          required
          {...register('amount', { valueAsNumber: true })}
        />
      </div>

      <Input
        label="Description"
        placeholder="What is this transaction for?"
        error={errors.description?.message}
        fullWidth
        required
        {...register('description')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Category"
          placeholder="Select a category"
          options={categories}
          error={errors.category?.message}
          fullWidth
          {...register('category')}
        />

        <Input
          label="Date"
          type="date"
          error={errors.date?.message}
          fullWidth
          required
          {...register('date')}
        />
      </div>

      <Input
        label="Merchant / Payee"
        placeholder="e.g., SuperMarket SpA"
        error={errors.merchantName?.message}
        fullWidth
        {...register('merchantName')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Currency"
          placeholder="EUR"
          error={errors.currency?.message}
          fullWidth
          {...register('currency')}
        />

        <Input
          label="Account ID"
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
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? 'Update Transaction' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  );
};
