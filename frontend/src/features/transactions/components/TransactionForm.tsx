// features/transactions/components/TransactionForm.tsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DollarSign,
  Calendar,
  FileText,
  Tag,
  Store,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import { Form } from '@/components/ui/form';

// Import reusable form components
import {
  DismissibleErrorAlert,
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from '@/components/form';

// Import schemas, types, and constants
import { transactionCreateSchema, transactionUpdateSchema } from '../transactions.schemas';
import type { TransactionCreate, TransactionUpdate, TransactionResponse } from '@/api/generated/models';
import { TRANSACTION_TYPE_OPTIONS, CURRENCY_OPTIONS } from '../transactions.constants';
import { buildUpdatePayload } from '@/lib/form-utils';
import { useCategories } from '@/features/categories';
import { useAccounts } from '@/features/accounts';

// Conditional props based on mode
interface BaseTransactionFormProps {
  /** Current loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Called when error alert is closed */
  onClearError?: () => void;
}

interface CreateModeProps extends BaseTransactionFormProps {
  /** No transaction means create mode */
  transaction?: never;
  /** Called when form is submitted successfully in create mode */
  onSubmit: (data: TransactionCreate) => Promise<void>;
}

interface EditModeProps extends BaseTransactionFormProps {
  /** Transaction to edit (presence means edit mode) */
  transaction: TransactionResponse;
  /** Called when form is submitted successfully in edit mode */
  onSubmit: (data: TransactionUpdate) => Promise<void>;
}

type TransactionFormProps = CreateModeProps | EditModeProps;

export const TransactionForm = ({
  transaction,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: TransactionFormProps) => {
  const { t } = useTranslation();
  const isEditMode = !!transaction;

  // Load categories and accounts for dropdowns
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { accounts, isLoading: accountsLoading } = useAccounts();

  // Build category options
  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  // Build account options with account type info
  const accountOptions = accounts.map((account) => ({
    value: account.id,
    label: `${account.name} (${account.accountType})`,
  }));

  // Default values
  const getDefaultValues = () => {
    if (isEditMode && transaction) {
      return {
        accountId: transaction.accountId,
        transactionType: transaction.transactionType,
        amount: transaction.amount.toString(),
        currency: transaction.currency || 'EUR',
        categoryId: transaction.categoryId || undefined,
        description: transaction.description,
        transactionDate: transaction.transactionDate,
        merchantName: transaction.merchantName || '',
        notes: transaction.notes || '',
      };
    }
    return {
      accountId: '',
      transactionType: 'purchase' as const,
      amount: '0',
      currency: 'EUR',
      categoryId: undefined,
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
      merchantName: '',
      notes: '',
    };
  };

  // Initialize form with react-hook-form and zod
  const form = useForm<TransactionCreate | TransactionUpdate>({
    resolver: zodResolver(isEditMode ? transactionUpdateSchema : transactionCreateSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  // Reset form when transaction changes (edit mode)
  useEffect(() => {
    if (transaction) {
      form.reset(getDefaultValues());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction]);

  const handleSubmit = async (data: TransactionCreate | TransactionUpdate) => {
    try {
      if (isEditMode) {
        // In edit mode, build clean update payload with only defined fields
        // Note: accountId is not included as it's not part of TransactionUpdate
        const updateData = buildUpdatePayload<TransactionUpdate>(data as TransactionUpdate, [
          'transactionType',
          'amount',
          'currency',
          'categoryId',
          'description',
          'transactionDate',
          'merchantName',
          'notes',
        ]);

        await (onSubmit as (data: TransactionUpdate) => Promise<void>)(updateData);
      } else {
        // In create mode, send all fields
        // Transform amount to number if it's a string
        const createData = {
          ...data,
          amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
        } as TransactionCreate;

        await (onSubmit as (data: TransactionCreate) => Promise<void>)(createData);
      }
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <Form {...form}>
      <form
        id="transaction-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        {/* Error Alert */}
        {error && (
          <DismissibleErrorAlert error={error} onDismiss={onClearError} />
        )}

        {/* Transaction Type & Amount Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            control={form.control}
            name="transactionType"
            label={t('transactions.type')}
            options={TRANSACTION_TYPE_OPTIONS}
            required
            disabled={isLoading}
            icon={<TrendingUp className="h-4 w-4" />}
            description={t('transactions.typeHint')}
          />

          <FormInputField
            control={form.control}
            name="amount"
            label={t('transactions.amount')}
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            disabled={isLoading}
            icon={<DollarSign className="h-4 w-4" />}
            description={t('transactions.amountHint')}
            transformValue={(value) => parseFloat(value) || 0}
          />
        </div>

        {/* Description */}
        <FormInputField
          control={form.control}
          name="description"
          label={t('transactions.description')}
          placeholder={t('transactions.descriptionPlaceholder')}
          required
          disabled={isLoading}
          icon={<FileText className="h-4 w-4" />}
          maxLength={200}
        />

        {/* Account & Category Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            control={form.control}
            name="accountId"
            label={t('transactions.accountId')}
            options={accountOptions}
            required
            disabled={isLoading || accountsLoading}
            icon={<Wallet className="h-4 w-4" />}
            description={t('transactions.accountHint')}
            translateLabels={false}
          />

          <FormSelectField
            control={form.control}
            name="categoryId"
            label={t('transactions.category')}
            options={categoryOptions}
            disabled={isLoading || categoriesLoading}
            icon={<Tag className="h-4 w-4" />}
            description={t('transactions.categoryHint')}
            translateLabels={false}
          />
        </div>

        {/* Transaction Date & Currency Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInputField
            control={form.control}
            name="transactionDate"
            label={t('transactions.date')}
            type="text"
            required
            disabled={isLoading}
            icon={<Calendar className="h-4 w-4" />}
            description={t('transactions.dateHint')}
          />

          <FormSelectField
            control={form.control}
            name="currency"
            label={t('accounts.currency')}
            options={CURRENCY_OPTIONS}
            required
            disabled={isLoading}
            description={t('transactions.currencyHint')}
          />
        </div>

        {/* Merchant Name */}
        <FormInputField
          control={form.control}
          name="merchantName"
          label={t('transactions.merchant')}
          placeholder={t('transactions.merchantPlaceholder')}
          disabled={isLoading}
          icon={<Store className="h-4 w-4" />}
          description={t('transactions.merchantHint')}
        />

        {/* Notes */}
        <FormTextareaField
          control={form.control}
          name="notes"
          label={t('transactions.notes')}
          placeholder={t('transactions.notesPlaceholder')}
          disabled={isLoading}
          icon={<FileText className="h-4 w-4" />}
          rows={3}
        />
      </form>
    </Form>
  );
};
