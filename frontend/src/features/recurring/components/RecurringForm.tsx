/**
 * Form component for creating/editing recurring transactions
 * Follows the pattern established in AccountForm.tsx
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RefreshCw,
  DollarSign,
  Calendar,
  FileText,
  Wallet,
  Tag,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import {
  DismissibleErrorAlert,
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from '@/components/form';

import {
  recurringCreateSchema,
  recurringUpdateSchema,
} from '../recurring.schemas';
import type {
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate,
} from '../recurring.types';
import {
  FREQUENCY_OPTIONS,
  AMOUNT_MODEL_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  RECURRING_DEFAULTS,
} from '../recurring.constants';
import { buildUpdatePayload } from '@/lib/form-utils';

import { useAccounts } from '@/features/accounts';
import { useCategories } from '@/features/categories';

// ============================================================================
// TYPES
// ============================================================================

interface BaseRecurringFormProps {
  isLoading?: boolean;
  error?: string;
  onClearError?: () => void;
}

interface CreateModeProps extends BaseRecurringFormProps {
  recurring?: never;
  onSubmit: (data: RecurringTransactionCreate) => Promise<void>;
}

interface EditModeProps extends BaseRecurringFormProps {
  recurring: RecurringTransaction;
  onSubmit: (data: RecurringTransactionUpdate) => Promise<void>;
}

type RecurringFormProps = CreateModeProps | EditModeProps;

// ============================================================================
// COMPONENT
// ============================================================================

export const RecurringForm = ({
  recurring,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: RecurringFormProps) => {
  const { t } = useTranslation();
  const isEditMode = !!recurring;

  // Fetch accounts and categories for select options
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { categories, isLoading: categoriesLoading } = useCategories();

  // Build account options
  const accountOptions = accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));

  // Build category options
  const categoryOptions = [
    { value: '', label: t('recurring.noCategory') },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  // Default values
  const getDefaultValues = (): RecurringTransactionCreate | Partial<RecurringTransaction> => {
    if (isEditMode && recurring) {
      return {
        name: recurring.name,
        description: recurring.description ?? '',
        amount: recurring.amount,
        currency: recurring.currency,
        frequency: recurring.frequency,
        interval: recurring.interval,
        startDate: recurring.startDate.split('T')[0],
        endDate: recurring.endDate?.split('T')[0] ?? '',
        accountId: recurring.accountId,
        categoryId: recurring.categoryId ?? '',
        transactionType: recurring.transactionType,
        amountModel: recurring.amountModel,
        minAmount: recurring.minAmount ?? undefined,
        maxAmount: recurring.maxAmount ?? undefined,
        isActive: recurring.isActive,
        autoCreate: recurring.autoCreate,
      };
    }
    return {
      name: '',
      description: '',
      amount: 0,
      currency: RECURRING_DEFAULTS.currency,
      frequency: RECURRING_DEFAULTS.frequency,
      interval: RECURRING_DEFAULTS.interval,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      accountId: accounts[0]?.id ?? '',
      categoryId: '',
      transactionType: RECURRING_DEFAULTS.transactionType,
      amountModel: RECURRING_DEFAULTS.amountModel,
      isActive: RECURRING_DEFAULTS.isActive,
      autoCreate: RECURRING_DEFAULTS.autoCreate,
    };
  };

  // Initialize form
  const form = useForm<RecurringTransactionCreate | RecurringTransactionUpdate>({
    resolver: zodResolver(isEditMode ? recurringUpdateSchema : recurringCreateSchema),
    defaultValues: getDefaultValues(),
  });

  // Watch amount model for conditional fields
  const amountModel = form.watch('amountModel');
  const showRangeFields = amountModel === 'variable_within_range';

  // Reset form when recurring changes
  useEffect(() => {
    if (recurring) {
      form.reset(getDefaultValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurring]);

  // Update accountId when accounts load
  useEffect(() => {
    if (!isEditMode && accounts.length > 0 && !form.getValues('accountId')) {
      form.setValue('accountId', accounts[0].id);
    }
  }, [accounts, isEditMode, form]);

  const handleSubmit = async (data: RecurringTransactionCreate | RecurringTransactionUpdate) => {
    try {
      // Convert date strings to ISO format
      const processedData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate as string).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate as string).toISOString() : undefined,
        categoryId: data.categoryId || undefined,
      };

      if (isEditMode) {
        const updateData = buildUpdatePayload(processedData, [
          'name',
          'description',
          'amount',
          'currency',
          'frequency',
          'interval',
          'startDate',
          'endDate',
          'accountId',
          'categoryId',
          'transactionType',
          'amountModel',
          'minAmount',
          'maxAmount',
          'isActive',
          'autoCreate',
        ]);
        await (onSubmit as (data: RecurringTransactionUpdate) => Promise<void>)(updateData);
      } else {
        await (onSubmit as (data: RecurringTransactionCreate) => Promise<void>)(
          processedData as RecurringTransactionCreate
        );
      }
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  const isFormLoading = isLoading || accountsLoading || categoriesLoading;

  return (
    <Form {...form}>
      <form
        id="recurring-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        {/* Error Alert */}
        {error && (
          <DismissibleErrorAlert error={error} onDismiss={onClearError} />
        )}

        {/* Name */}
        <FormInputField
          control={form.control}
          name="name"
          label={t('recurring.form.name')}
          placeholder={t('recurring.form.namePlaceholder')}
          required
          disabled={isFormLoading}
          icon={<RefreshCw className="h-4 w-4" />}
          maxLength={255}
        />

        {/* Transaction Type */}
        <FormSelectField
          control={form.control}
          name="transactionType"
          label={t('recurring.form.transactionType')}
          options={TRANSACTION_TYPE_OPTIONS}
          required
          disabled={isFormLoading}
          description={t('recurring.form.transactionTypeHint')}
        />

        {/* Amount */}
        <FormInputField
          control={form.control}
          name="amount"
          label={t('recurring.form.amount')}
          type="number"
          step="0.01"
          placeholder="0.00"
          required
          disabled={isFormLoading}
          icon={
            form.watch('transactionType') === 'income' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )
          }
          transformValue={(value) => parseFloat(value) || 0}
        />

        {/* Amount Model */}
        <FormSelectField
          control={form.control}
          name="amountModel"
          label={t('recurring.form.amountModel')}
          options={AMOUNT_MODEL_OPTIONS}
          disabled={isFormLoading}
          description={t('recurring.form.amountModelHint')}
        />

        {/* Range fields - only show for variable_within_range */}
        {showRangeFields && (
          <div className="grid grid-cols-2 gap-4">
            <FormInputField
              control={form.control}
              name="minAmount"
              label={t('recurring.form.minAmount')}
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={isFormLoading}
              icon={<DollarSign className="h-4 w-4" />}
              transformValue={(value) => parseFloat(value) || undefined}
            />
            <FormInputField
              control={form.control}
              name="maxAmount"
              label={t('recurring.form.maxAmount')}
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={isFormLoading}
              icon={<DollarSign className="h-4 w-4" />}
              transformValue={(value) => parseFloat(value) || undefined}
            />
          </div>
        )}

        {/* Currency */}
        <FormSelectField
          control={form.control}
          name="currency"
          label={t('recurring.form.currency')}
          options={CURRENCY_OPTIONS}
          required
          disabled={isFormLoading}
        />

        {/* Frequency */}
        <div className="grid grid-cols-2 gap-4">
          <FormSelectField
            control={form.control}
            name="frequency"
            label={t('recurring.form.frequency')}
            options={FREQUENCY_OPTIONS}
            required
            disabled={isFormLoading}
          />
          <FormInputField
            control={form.control}
            name="interval"
            label={t('recurring.form.interval')}
            type="number"
            required={true}
            placeholder="1"
            disabled={isFormLoading}
            description={t('recurring.form.intervalHint')}
            transformValue={(value) => parseInt(value, 10) || 1}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <FormInputField
            control={form.control}
            name="startDate"
            label={t('recurring.form.startDate')}
            type="date"
            required
            disabled={isFormLoading}
            icon={<Calendar className="h-4 w-4" />}
          />
          <FormInputField
            control={form.control}
            name="endDate"
            label={t('recurring.form.endDate')}
            type="date"
            disabled={isFormLoading}
            icon={<Calendar className="h-4 w-4" />}
            description={t('recurring.form.endDateHint')}
          />
        </div>

        {/* Account */}
        <FormSelectField
          control={form.control}
          name="accountId"
          label={t('recurring.form.account')}
          options={accountOptions}
          required
          disabled={isFormLoading || accounts.length === 0}
          icon={<Wallet className="h-4 w-4" />}
          description={
            accounts.length === 0
              ? t('recurring.form.noAccountsWarning')
              : t('recurring.form.accountHint')
          }
        />

        {/* Category */}
        <FormSelectField
          control={form.control}
          name="categoryId"
          label={t('recurring.form.category')}
          options={categoryOptions}
          disabled={isFormLoading}
          icon={<Tag className="h-4 w-4" />}
          description={t('recurring.form.categoryHint')}
        />

        {/* Description */}
        <FormTextareaField
          control={form.control}
          name="description"
          label={t('recurring.form.description')}
          placeholder={t('recurring.form.descriptionPlaceholder')}
          disabled={isFormLoading}
          icon={<FileText className="h-4 w-4" />}
          rows={3}
        />

        {/* Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('recurring.form.options')}</CardTitle>
            <CardDescription>{t('recurring.form.optionsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Is Active Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">{t('recurring.form.isActive')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('recurring.form.isActiveHint')}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={form.watch('isActive') ?? true}
                onCheckedChange={(checked) => form.setValue('isActive', checked)}
                disabled={isFormLoading}
              />
            </div>

            {/* Auto Create Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoCreate">{t('recurring.form.autoCreate')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('recurring.form.autoCreateHint')}
                </p>
              </div>
              <Switch
                id="autoCreate"
                checked={form.watch('autoCreate') ?? false}
                onCheckedChange={(checked) => form.setValue('autoCreate', checked)}
                disabled={isFormLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Current Info - Only in Edit Mode */}
        {isEditMode && recurring && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('recurring.form.currentInfo')}</CardTitle>
              <CardDescription>
                {t('recurring.form.created')}: {new Date(recurring.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recurring.nextOccurrence && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('recurring.form.nextOccurrence')}
                  </span>
                  <span className="text-sm font-medium">
                    {new Date(recurring.nextOccurrence).toLocaleDateString()}
                  </span>
                </div>
              )}
              {recurring.lastOccurrence && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('recurring.form.lastOccurrence')}
                  </span>
                  <span className="text-sm font-medium">
                    {new Date(recurring.lastOccurrence).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
};
