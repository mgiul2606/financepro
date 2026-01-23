// features/assets/components/AssetForm.tsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, DollarSign, FileText, Calendar, Hash, Tag } from 'lucide-react';
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
import { assetFormSchema } from '../assets.schemas';
import type { AssetCreate, AssetUpdate, AssetResponse } from '../assets.types';
import {
  CURRENCY_OPTIONS,
  ASSET_TYPE_OPTIONS,
  VALUATION_METHOD_OPTIONS,
} from '../assets.constants';
import { buildUpdatePayload } from '@/lib/form-utils';
import type { z } from 'zod';

// Input type: what we provide to the form (before Zod transforms)
type AssetFormInput = z.input<typeof assetFormSchema>;
// Output type: validated data after Zod transforms
type AssetFormData = z.output<typeof assetFormSchema>;

// Boolean options for isLiquid field
const IS_LIQUID_OPTIONS = [
  { value: 'false', label: 'common.no' },
  { value: 'true', label: 'common.yes' },
] as const;

// Conditional props based on mode
interface BaseAssetFormProps {
  /** Current loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Called when error alert is closed */
  onClearError?: () => void;
}

interface CreateModeProps extends BaseAssetFormProps {
  /** No asset means create mode */
  asset?: never;
  /** Called when form is submitted successfully in create mode */
  onSubmit: (data: AssetCreate) => Promise<void>;
}

interface EditModeProps extends BaseAssetFormProps {
  /** Asset to edit (presence means edit mode) */
  asset: AssetResponse;
  /** Called when form is submitted successfully in edit mode */
  onSubmit: (data: AssetUpdate) => Promise<void>;
}

type AssetFormProps = CreateModeProps | EditModeProps;

export const AssetForm = ({
  asset,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: AssetFormProps) => {
  const { t } = useTranslation();
  const isEditMode = !!asset;

  // Default values - note: isLiquid uses string for FormSelectField compatibility
  const getDefaultValues = () => {
    if (isEditMode && asset) {
      return {
        name: asset.name,
        assetType: asset.assetType,
        purchaseDate: asset.purchaseDate ?? '',
        purchasePrice: asset.purchasePrice ? parseFloat(asset.purchasePrice) : undefined,
        currentValue: parseFloat(asset.currentValue) || 0,
        valuationMethod: asset.valuationMethod || 'manual',
        currency: asset.currency || 'EUR',
        isLiquid: asset.isLiquid ? 'true' : 'false',
        quantity: asset.quantity ? parseFloat(asset.quantity) : undefined,
        tickerSymbol: asset.tickerSymbol ?? '',
        notes: asset.notes ?? '',
      };
    }
    return {
      name: '',
      assetType: 'other' as const,
      purchaseDate: '',
      purchasePrice: undefined,
      currentValue: 0,
      valuationMethod: 'manual' as const,
      currency: 'EUR',
      isLiquid: 'false',
      quantity: undefined,
      tickerSymbol: '',
      notes: '',
    };
  };

  // Initialize form with react-hook-form and zod
  // Use AssetFormInput for form state (pre-transform), AssetFormData for validated output
  const form = useForm<AssetFormInput>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when asset changes (edit mode)
  useEffect(() => {
    if (asset) {
      form.reset(getDefaultValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset]);

  const handleSubmit = async (data: AssetFormData) => {
    try {
      if (isEditMode) {
        // In edit mode, build clean update payload with only defined fields
        const updateData = buildUpdatePayload(data, [
          'name',
          'assetType',
          'purchaseDate',
          'purchasePrice',
          'currentValue',
          'valuationMethod',
          'currency',
          'isLiquid',
          'quantity',
          'tickerSymbol',
          'notes',
        ]);

        await (onSubmit as (data: AssetUpdate) => Promise<void>)(updateData);
      } else {
        // In create mode, send all required fields
        const createData: AssetCreate = {
          name: data.name,
          assetType: data.assetType,
          currentValue: data.currentValue,
          currency: data.currency,
          valuationMethod: data.valuationMethod,
          isLiquid: data.isLiquid,
          ...(data.purchaseDate && { purchaseDate: data.purchaseDate }),
          ...(data.purchasePrice !== undefined && { purchasePrice: data.purchasePrice }),
          ...(data.quantity !== undefined && { quantity: data.quantity }),
          ...(data.tickerSymbol && { tickerSymbol: data.tickerSymbol }),
          ...(data.notes && { notes: data.notes }),
        };

        await (onSubmit as (data: AssetCreate) => Promise<void>)(createData);
      }
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  // Watch asset type to show/hide relevant fields
  const assetType = form.watch('assetType');
  const showTickerField = ['investment', 'crypto'].includes(assetType);
  const showQuantityField = ['investment', 'crypto', 'precious_metal'].includes(assetType);

  return (
    <Form {...form}>
      <form
        id="asset-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        {/* Error Alert */}
        {error && (
          <DismissibleErrorAlert error={error} onDismiss={onClearError} />
        )}

        {/* Asset Name */}
        <FormInputField
          control={form.control}
          name="name"
          label={t('assets.assetName')}
          placeholder={t('assets.assetNamePlaceholder')}
          required
          disabled={isLoading}
          icon={<Package className="h-4 w-4" />}
          maxLength={255}
        />

        {/* Asset Type */}
        <FormSelectField
          control={form.control}
          name="assetType"
          label={t('assets.assetType')}
          options={ASSET_TYPE_OPTIONS}
          disabled={isLoading}
          description={t('assets.assetTypeHint')}
        />

        {/* Current Value */}
        <FormInputField
          control={form.control}
          name="currentValue"
          label={t('assets.currentValue')}
          type="number"
          step="0.01"
          placeholder="0.00"
          required
          disabled={isLoading}
          icon={<DollarSign className="h-4 w-4" />}
          description={t('assets.currentValueHint')}
          transformValue={(value) => parseFloat(value) || 0}
        />

        {/* Currency */}
        <FormSelectField
          control={form.control}
          name="currency"
          label={t('assets.currency')}
          options={CURRENCY_OPTIONS}
          required
          disabled={isLoading}
          description={t('assets.currencyHint')}
        />

        {/* Valuation Method */}
        <FormSelectField
          control={form.control}
          name="valuationMethod"
          label={t('assets.valuationMethod')}
          options={VALUATION_METHOD_OPTIONS}
          disabled={isLoading}
          description={t('assets.valuationMethodHint')}
        />

        {/* Is Liquid */}
        <FormSelectField
          control={form.control}
          name="isLiquid"
          label={t('assets.isLiquid')}
          options={IS_LIQUID_OPTIONS}
          disabled={isLoading}
          description={t('assets.isLiquidHint')}
          translateLabels={true}
        />

        {/* Purchase Date */}
        <FormInputField
          control={form.control}
          name="purchaseDate"
          label={t('assets.purchaseDate')}
          type="date"
          disabled={isLoading}
          icon={<Calendar className="h-4 w-4" />}
          description={t('assets.purchaseDateHint')}
        />

        {/* Purchase Price */}
        <FormInputField
          control={form.control}
          name="purchasePrice"
          label={t('assets.purchasePrice')}
          type="number"
          step="0.01"
          placeholder="0.00"
          disabled={isLoading}
          icon={<DollarSign className="h-4 w-4" />}
          description={t('assets.purchasePriceHint')}
          transformValue={(value) => {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? undefined : parsed;
          }}
        />

        {/* Ticker Symbol - Only for investment/crypto */}
        {showTickerField && (
          <FormInputField
            control={form.control}
            name="tickerSymbol"
            label={t('assets.tickerSymbol')}
            placeholder={t('assets.tickerSymbolPlaceholder')}
            disabled={isLoading}
            icon={<Tag className="h-4 w-4" />}
            description={t('assets.tickerSymbolHint')}
            maxLength={20}
          />
        )}

        {/* Quantity - Only for investment/crypto/precious_metal */}
        {showQuantityField && (
          <FormInputField
            control={form.control}
            name="quantity"
            label={t('assets.quantity')}
            type="number"
            step="0.00000001"
            placeholder="1.00"
            disabled={isLoading}
            icon={<Hash className="h-4 w-4" />}
            description={t('assets.quantityHint')}
            transformValue={(value) => {
              const parsed = parseFloat(value);
              return isNaN(parsed) ? undefined : parsed;
            }}
          />
        )}

        {/* Notes */}
        <FormTextareaField
          control={form.control}
          name="notes"
          label={t('assets.notes')}
          placeholder={t('assets.notesPlaceholder')}
          disabled={isLoading}
          icon={<FileText className="h-4 w-4" />}
          rows={3}
        />

        {/* Current Asset Info - Only in Edit Mode */}
        {isEditMode && asset && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('assets.currentInfo')}</CardTitle>
              <CardDescription>
                {t('assets.created')}: {new Date(asset.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('assets.lastUpdated')}
                </span>
                <span className="text-sm font-medium">
                  {new Date(asset.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
};
