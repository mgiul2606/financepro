// components/form/FormSelectField.tsx
import { type ReactNode } from 'react';
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { safeFieldValue } from '@/lib/form-utils';

export interface SelectOption {
  /** The value of the option */
  value: string;
  /** The label (can be a translation key or plain text) */
  label: string;
}

interface FormSelectFieldProps<TFieldValues extends FieldValues> {
  /** Form control from react-hook-form */
  control: Control<TFieldValues>;
  /** Field name */
  name: FieldPath<TFieldValues>;
  /** Label text */
  label: string;
  /** Array of select options */
  options: readonly SelectOption[];
  /** Whether the field is required (shows asterisk) */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Optional icon to display before the label */
  icon?: ReactNode;
  /** Optional description/hint text */
  description?: string;
  /** Whether to translate option labels (default: true) */
  translateLabels?: boolean;
}

/**
 * A reusable form select field component that wraps react-hook-form's FormField
 * with consistent styling, null-safe value handling, and automatic translation
 */
export function FormSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  required = false,
  disabled = false,
  icon,
  description,
  translateLabels = true,
}: FormSelectFieldProps<TFieldValues>) {
  const { t } = useTranslation();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={icon ? 'flex items-center gap-2' : undefined}>
            {icon}
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={safeFieldValue(field.value as string | null | undefined)}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {translateLabels ? t(option.label) : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
