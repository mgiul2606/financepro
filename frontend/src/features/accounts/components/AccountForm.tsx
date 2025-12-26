// features/accounts/components/AccountForm.tsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, Building2, FileText, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Import schemas and types from the new structure
import { accountCreateSchema, accountUpdateSchema } from '../accounts.schemas';
import type { AccountCreate, AccountUpdate, AccountResponse } from '../accounts.types';

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

  const CURRENCY_OPTIONS = [
    { value: 'EUR', label: t('settings.currencies.EUR') },
    { value: 'USD', label: t('settings.currencies.USD') },
    { value: 'GBP', label: t('settings.currencies.GBP') },
    { value: 'CHF', label: t('settings.currencies.CHF') },
    { value: 'JPY', label: t('settings.currencies.JPY') },
  ] as const;

  const ACCOUNT_TYPE_OPTIONS = [
    { value: 'checking', label: t('accounts.types.checking') },
    { value: 'savings', label: t('accounts.types.savings') },
    { value: 'credit_card', label: t('accounts.types.credit_card') },
    { value: 'investment', label: t('accounts.types.investment') },
    { value: 'cash', label: t('accounts.types.cash') },
    { value: 'loan', label: t('accounts.types.loan') },
    { value: 'mortgage', label: t('accounts.types.mortgage') },
    { value: 'other', label: t('accounts.types.other') },
  ] as const;

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
        // In edit mode, send only defined fields excluding initialBalance
        const updateData: AccountUpdate = {};
        if (data.name) updateData.name = data.name;
        if ('accountType' in data && data.accountType) updateData.accountType = data.accountType;
        if (data.currency) updateData.currency = data.currency;
        if ('institutionName' in data) {
          updateData.institutionName = data.institutionName || undefined;
        }
        if ('notes' in data) {
          updateData.notes = data.notes || undefined;
        }

        // Type assertion is safe here because we know we're in edit mode
        await (onSubmit as (data: AccountUpdate) => Promise<void>)(updateData);
      } else {
        // In create mode, send all fields
        // Type assertion is safe here because we know we're in create mode
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
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {onClearError && (
                <button
                  type="button"
                  onClick={onClearError}
                  className="text-sm underline hover:no-underline"
                >
                  {t('common.dismiss')}
                </button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Account Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => {
            const {value, ...rest} = field;
            return <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      {t('accounts.accountName')}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...rest}
                        value={value ?? ""}
                        placeholder={t('accounts.accountNamePlaceholder')}
                        disabled={isLoading}
                        maxLength={100}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
          }}
        />

        {/* Account Type */}
        <FormField
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accounts.accountType')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value ?? ""}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{t('accounts.accountTypeHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Currency */}
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('accounts.currency')}
                <span className="text-destructive ml-1">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value ?? ""}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{t('accounts.currencyHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Initial Balance - Only in Create Mode */}
        {!isEditMode && (
          <FormField
            control={form.control}
            name="initialBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('accounts.initialBalance')}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  {t('accounts.initialBalanceHint')} {t('accounts.negativeBalanceAllowed')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Institution Name */}
        <FormField
          control={form.control}
          name="institutionName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t('accounts.institutionName')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder={t('accounts.institutionNamePlaceholder')}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>{t('accounts.institutionNameHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('accounts.notes')}
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder={t('accounts.notesPlaceholder')}
                  disabled={isLoading}
                  rows={3}
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
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
