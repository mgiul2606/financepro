// components/form/FormTextareaField.tsx
import { type ReactNode } from 'react';
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { safeFieldValue } from '@/lib/form-utils';

interface FormTextareaFieldProps<TFieldValues extends FieldValues> {
  /** Form control from react-hook-form */
  control: Control<TFieldValues>;
  /** Field name */
  name: FieldPath<TFieldValues>;
  /** Label text */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required (shows asterisk) */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Optional icon to display before the label */
  icon?: ReactNode;
  /** Optional description/hint text */
  description?: string;
  /** Number of rows (default: 3) */
  rows?: number;
  /** Whether to allow resizing (default: false - resize-none) */
  resizable?: boolean;
}

/**
 * A reusable form textarea field component that wraps react-hook-form's FormField
 * with consistent styling and null-safe value handling
 */
export function FormTextareaField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
  icon,
  description,
  rows = 3,
  resizable = false,
}: FormTextareaFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const { value, ...rest } = field;

        return (
          <FormItem>
            <FormLabel className={icon ? 'flex items-center gap-2' : undefined}>
              {icon}
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              <Textarea
                {...rest}
                value={safeFieldValue(value as string | null | undefined)}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                className={resizable ? undefined : 'resize-none'}
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
