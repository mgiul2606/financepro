// features/accounts/components/AccountForm.tsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, Building2, FileText, DollarSign } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';

// Import reusable form components
import {
  DismissibleErrorAlert,
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from '@/components/form';

// Import schemas, types, and constants
import { accountCreateSchema, accountUpdateSchema } from '../accounts.schemas';
import type { AccountCreate, AccountUpdate, AccountResponse } from '@/api/generated/models';
import { CURRENCY_OPTIONS, ACCOUNT_TYPE_OPTIONS } from '../accounts.constants';
import { buildUpdatePayload } from '@/lib/form-utils';

// Conditional props based on mode
interface BaseAccountFormProps {
  /** Current loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Called when error alert is closed */
  onClearError?: () => void;
}

interface CreateModeProps extends BaseAccountFormProps {
  /** No account means create mode */
  account?: never;
  /** Called when form is submitted successfully in create mode */
  onSubmit: (data: AccountCreate) => Promise<void>;
}

interface EditModeProps extends BaseAccountFormProps {
  /** Account to edit (presence means edit mode) */
  account: AccountResponse;
  /** Called when form is submitted successfully in edit mode */
  onSubmit: (data: AccountUpdate) => Promise<void>;
}

type AccountFormProps = CreateModeProps | EditModeProps;

export const AccountForm = ({
  account,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: AccountFormProps) => {
  const { t } = useTranslation();
  const isEditMode = !!account;

  // Default values
  const getDefaultValues = () => {
    if (isEditMode && account) {
      return {
        name: account.name,
        currency: account.currency || 'EUR',
        accountType: account.accountType || 'checking',
        institutionName: account.institutionName || '',
        notes: account.notes || '',
      };
    }
    return {
      name: '',
      currency: 'EUR',
      initialBalance: 0,
      accountType: 'checking' as const,
      institutionName: '',
      notes: '',
    };
  };

  // Initialize form with react-hook-form and zod
  const form = useForm<AccountCreate | AccountUpdate>({
    resolver: zodResolver(isEditMode ? accountUpdateSchema : accountCreateSchema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when account changes (edit mode)
  useEffect(() => {
    if (account) {
      form.reset(getDefaultValues());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const handleSubmit = async (data: AccountCreate | AccountUpdate) => {
    try {
      if (isEditMode) {
        // In edit mode, build clean update payload with only defined fields
        const updateData = buildUpdatePayload(data, [
          'name',
          'accountType',
          'currency',
          'institutionName',
          'notes',
        ]);

        await (onSubmit as (data: AccountUpdate) => Promise<void>)(updateData);
      } else {
        // In create mode, send all fields
        await (onSubmit as (data: AccountCreate) => Promise<void>)(data as AccountCreate);
      }
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <Form {...form}>
      <form
        id="account-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        {/* Error Alert */}
        {error && (
          <DismissibleErrorAlert error={error} onDismiss={onClearError} />
        )}

        {/* Account Name */}
        <FormInputField
          control={form.control}
          name="name"
          label={t('accounts.accountName')}
          placeholder={t('accounts.accountNamePlaceholder')}
          required
          disabled={isLoading}
          icon={<Wallet className="h-4 w-4" />}
          maxLength={100}
        />

        {/* Account Type */}
        <FormSelectField
          control={form.control}
          name="accountType"
          label={t('accounts.accountType')}
          options={ACCOUNT_TYPE_OPTIONS}
          disabled={isLoading}
          description={t('accounts.accountTypeHint')}
        />

        {/* Currency */}
        <FormSelectField
          control={form.control}
          name="currency"
          label={t('accounts.currency')}
          options={CURRENCY_OPTIONS}
          required
          disabled={isLoading}
          description={t('accounts.currencyHint')}
        />

        {/* Initial Balance - Only in Create Mode */}
        {!isEditMode && (
          <FormInputField
            control={form.control}
            name="initialBalance"
            label={t('accounts.initialBalance')}
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            disabled={isLoading}
            icon={<DollarSign className="h-4 w-4" />}
            description={`${t('accounts.initialBalanceHint')} ${t('accounts.negativeBalanceAllowed')}`}
            transformValue={(value) => parseFloat(value) || 0}
          />
        )}

        {/* Institution Name */}
        <FormInputField
          control={form.control}
          name="institutionName"
          label={t('accounts.institutionName')}
          placeholder={t('accounts.institutionNamePlaceholder')}
          disabled={isLoading}
          icon={<Building2 className="h-4 w-4" />}
          description={t('accounts.institutionNameHint')}
        />

        {/* Notes */}
        <FormTextareaField
          control={form.control}
          name="notes"
          label={t('accounts.notes')}
          placeholder={t('accounts.notesPlaceholder')}
          disabled={isLoading}
          icon={<FileText className="h-4 w-4" />}
          rows={3}
        />

        {/* Current Account Info - Only in Edit Mode */}
        {isEditMode && account && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('accounts.currentInfo')}</CardTitle>
              <CardDescription>
                {t('accounts.created')}: {new Date(account.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('accounts.currentBalance')}
                </span>
                <span className="text-lg font-semibold">
                  {account.currency} {parseFloat(account.currentBalance).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
};
