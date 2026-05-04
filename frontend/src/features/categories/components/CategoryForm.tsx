// features/categories/components/CategoryForm.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag, FileText, Languages, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Form } from '@/components/ui/form';
import {
  DismissibleErrorAlert,
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CategoryCreate, CategoryUpdate, CategoryResponse } from '@/api/generated/models';
import { CATEGORY_ICON_OPTIONS, CATEGORY_COLOR_OPTIONS } from '../categories.constants';

const categoryFormSchema = z.object({
  name: z.string().min(1, 'required').max(100),
  translations: z.array(
    z.object({
      lang: z.string().min(2).max(10),
      value: z.string().min(1).max(100),
    })
  ),
  isIncome: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  isActive: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface BaseCategoryFormProps {
  isLoading?: boolean;
  error?: string;
  onClearError?: () => void;
}

interface CreateModeProps extends BaseCategoryFormProps {
  category?: never;
  onSubmit: (data: CategoryCreate) => Promise<void>;
}

interface EditModeProps extends BaseCategoryFormProps {
  category: CategoryResponse;
  onSubmit: (data: CategoryUpdate) => Promise<void>;
}

type CategoryFormProps = CreateModeProps | EditModeProps;

export const CategoryForm = ({
  category,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: CategoryFormProps) => {
  const { t } = useTranslation();
  const isEditMode = !!category;

  const iconOptions = CATEGORY_ICON_OPTIONS.map((opt) => ({
    value: opt.value,
    label: `${opt.value} ${t(opt.label)}`,
  }));

  const colorOptions = CATEGORY_COLOR_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.label),
  }));

  const typeOptions = [
    { value: 'false', label: t('categories.types.expense') },
    { value: 'true', label: t('categories.types.income') },
  ];

  const statusOptions = [
    { value: 'true', label: t('categories.status.active') },
    { value: 'false', label: t('categories.status.inactive') },
  ];

  const getDefaultValues = (): CategoryFormValues => {
    const translationsObj = (category?.nameTranslations ?? {}) as Record<string, string>;
    const translationRows = Object.entries(translationsObj).map(([lang, value]) => ({ lang, value }));
    return {
      name: isEditMode ? category.name : '',
      translations: translationRows,
      isIncome: String(category?.isIncome ?? false),
      icon: category?.icon ?? '',
      color: category?.color ?? '',
      description: category?.description ?? '',
      isActive: String(category?.isActive ?? true),
    };
  };

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: getDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'translations',
  });

  const [translationsOpen, setTranslationsOpen] = useState(false);

  useEffect(() => {
    if (category) form.reset(getDefaultValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const selectedColor = form.watch('color');

  const handleSubmit = async (data: CategoryFormValues) => {
    try {
      const nameTranslations: Record<string, string> = {};
      for (const row of data.translations) {
        const lang = row.lang.trim().toLowerCase();
        const val = row.value.trim();
        if (lang && val) nameTranslations[lang] = val;
      }

      const base = {
        name: data.name.trim(),
        nameTranslations,
        isIncome: data.isIncome === 'true',
        icon: data.icon || null,
        color: data.color || null,
        description: data.description || null,
      };

      if (isEditMode) {
        await (onSubmit as (d: CategoryUpdate) => Promise<void>)({
          ...base,
          isActive: data.isActive === 'true',
        });
      } else {
        await (onSubmit as (d: CategoryCreate) => Promise<void>)(base as CategoryCreate);
      }
    } catch (err) {
      console.error('Category form error:', err);
    }
  };

  return (
    <Form {...form}>
      <form
        id="category-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        {error && <DismissibleErrorAlert error={error} onDismiss={onClearError} />}

        {/* Primary name */}
        <FormInputField
          control={form.control}
          name="name"
          label={t('categories.name')}
          placeholder={t('categories.namePlaceholder')}
          disabled={isLoading}
          icon={<Tag className="h-4 w-4" />}
          maxLength={100}
        />

        {/* Translations collapsible */}
        <div className="rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setTranslationsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span>{t('categories.translations')}</span>
              {fields.length > 0 && (
                <span className="text-xs text-muted-foreground">({fields.length})</span>
              )}
            </div>
            {translationsOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {translationsOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">{t('categories.translationsHint')}</p>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    {...form.register(`translations.${index}.lang`)}
                    placeholder={t('categories.langCodePlaceholder')}
                    className="w-20 shrink-0 font-mono text-sm"
                    maxLength={10}
                    disabled={isLoading}
                  />
                  <Input
                    {...form.register(`translations.${index}.value`)}
                    placeholder={t('categories.translatedName')}
                    className="flex-1 text-sm"
                    maxLength={100}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ lang: '', value: '' })}
                disabled={isLoading}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('categories.addTranslation')}
              </Button>
            </div>
          )}
        </div>

        <FormSelectField
          control={form.control}
          name="isIncome"
          label={t('categories.type')}
          options={typeOptions}
          required
          disabled={isLoading}
          translateLabels={false}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormSelectField
            control={form.control}
            name="icon"
            label={t('categories.icon')}
            options={iconOptions}
            disabled={isLoading}
            translateLabels={false}
          />

          <div className="space-y-1">
            <FormSelectField
              control={form.control}
              name="color"
              label={t('categories.color')}
              options={colorOptions}
              disabled={isLoading}
              translateLabels={false}
            />
            {selectedColor && (
              <div className="flex items-center gap-2 px-1">
                <div
                  className="h-3.5 w-3.5 rounded-full border border-gray-200 shrink-0"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="text-xs text-muted-foreground font-mono">{selectedColor}</span>
              </div>
            )}
          </div>
        </div>

        {isEditMode && (
          <FormSelectField
            control={form.control}
            name="isActive"
            label={t('categories.statusLabel')}
            options={statusOptions}
            disabled={isLoading}
            translateLabels={false}
          />
        )}

        <FormTextareaField
          control={form.control}
          name="description"
          label={t('categories.description')}
          placeholder={t('categories.descriptionPlaceholder')}
          disabled={isLoading}
          icon={<FileText className="h-4 w-4" />}
          rows={2}
        />
      </form>
    </Form>
  );
};
