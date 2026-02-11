// components/form/FormInputField.tsx
import { type ReactNode } from 'react';
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { safeFieldValue } from '@/lib/form-utils';

interface FormInputFieldProps<TFieldValues extends FieldValues> {
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
  /** Input type (default: 'text') */
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'date';
  /** Max length for text inputs */
  maxLength?: number;
  /** Step for number inputs */
  step?: string;
  /** Custom onChange handler for transforming values (e.g., parseFloat for numbers) */
  transformValue?: (value: string) => unknown;
}

/**
 * A reusable form input field component that wraps react-hook-form's FormField
 * with consistent styling and null-safe value handling
 */
export function FormInputField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
  icon,
  description,
  type = 'text',
  maxLength,
  step,
  transformValue,
}: FormInputFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const { value, onChange, ...rest } = field;

        return (
          <FormItem>
            <FormLabel className={icon ? 'flex items-center gap-2' : undefined}>
              {icon}
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                {...rest}
                type={type}
                value={safeFieldValue(value as string | null | undefined)}
                onChange={(e) => {
                  if (transformValue) {
                    onChange(transformValue(e.target.value));
                  } else {
                    onChange(e.target.value);
                  }
                }}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                step={step}
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
