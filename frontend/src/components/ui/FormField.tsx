// components/ui/FormField.tsx
/**
 * Legacy FormField and SelectField components for backward compatibility
 * These provide a simple interface without react-hook-form integration
 */
import React, { useState, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';

interface ValidationRule {
  value: boolean | number | string | RegExp;
  message: string;
}

interface ValidationRules {
  required?: ValidationRule;
  minLength?: ValidationRule;
  maxLength?: ValidationRule;
  min?: ValidationRule;
  max?: ValidationRule;
  pattern?: ValidationRule;
}

interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Field label */
  label: string;
  /** Optional hint/description text */
  hint?: string;
  /** Optional icon to display */
  icon?: React.ReactNode;
  /** Whether the field is required */
  required?: boolean;
  /** Validation rules */
  validation?: ValidationRules;
  /** Callback when validation state changes */
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  /** Whether to show validation feedback */
  showValidation?: boolean;
  /** Custom onChange handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  hint,
  icon,
  required = false,
  validation,
  onValidationChange,
  showValidation = false,
  className,
  id,
  value,
  onChange,
  ...props
}) => {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Validate value
  useEffect(() => {
    if (!validation || !showValidation) return;

    const newErrors: string[] = [];
    const strValue = String(value || '');
    const numValue = Number(value);

    if (validation.required?.value && !strValue.trim()) {
      newErrors.push(validation.required.message);
    }

    if (validation.minLength && strValue.length < Number(validation.minLength.value)) {
      newErrors.push(validation.minLength.message);
    }

    if (validation.maxLength && strValue.length > Number(validation.maxLength.value)) {
      newErrors.push(validation.maxLength.message);
    }

    if (validation.min && numValue < Number(validation.min.value)) {
      newErrors.push(validation.min.message);
    }

    if (validation.max && numValue > Number(validation.max.value)) {
      newErrors.push(validation.max.message);
    }

    if (validation.pattern && !new RegExp(validation.pattern.value as string | RegExp).test(strValue)) {
      newErrors.push(validation.pattern.message);
    }

    setErrors(newErrors);
    onValidationChange?.(newErrors.length === 0, newErrors);
  }, [value, validation, showValidation, onValidationChange]);

  const showErrors = showValidation && touched && errors.length > 0;

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {icon}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={fieldId}
        value={value}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        className={cn(
          'w-full px-3 py-2 border rounded-lg bg-white transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500',
          showErrors ? 'border-red-500' : 'border-gray-300',
          className
        )}
        {...props}
      />
      {hint && !showErrors && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
      {showErrors && (
        <p className="text-sm text-red-500">{errors[0]}</p>
      )}
    </div>
  );
};

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  /** Field label */
  label: string;
  /** Array of options */
  options: SelectOption[];
  /** Optional hint/description text */
  hint?: string;
  /** Optional icon to display */
  icon?: React.ReactNode;
  /** Whether the field is required */
  required?: boolean;
  /** Custom onChange handler - receives the value directly */
  onChange?: (value: string) => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  hint,
  icon,
  required = false,
  className,
  id,
  value,
  onChange,
  ...props
}) => {
  const generatedId = useId();
  const fieldId = id || generatedId;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {icon}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={fieldId}
        value={value}
        onChange={handleChange}
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-lg bg-white transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
};
