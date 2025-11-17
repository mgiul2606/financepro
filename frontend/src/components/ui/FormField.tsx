// src/components/ui/FormField.tsx
import { useState, useEffect } from 'react';
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

// Validation types
export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface FieldValidation {
  required?: boolean | { value: boolean; message?: string };
  minLength?: number | { value: number; message?: string };
  maxLength?: number | { value: number; message?: string };
  pattern?: RegExp | { value: RegExp; message?: string };
  min?: number | { value: number; message?: string };
  max?: number | { value: number; message?: string };
  custom?: ValidationRule[];
}

// Base Props
interface BaseFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  validation?: FieldValidation;
  showValidation?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  containerClassName?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

// Input Field Props
interface InputFieldProps extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local' | 'time';
  showPasswordToggle?: boolean;
}

// Textarea Field Props
interface TextareaFieldProps extends BaseFieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  rows?: number;
  resize?: boolean;
}

// Select Field Props
interface SelectFieldProps extends BaseFieldProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
  placeholder?: string;
}

// Validation helper
const validateField = (value: any, validation?: FieldValidation): string[] => {
  const errors: string[] = [];
  
  if (!validation) return errors;

  // Required validation
  if (validation.required) {
    const isRequired = typeof validation.required === 'boolean' ? validation.required : validation.required.value;
    if (isRequired && (!value || value === '')) {
      const message = typeof validation.required === 'object' && validation.required.message 
        ? validation.required.message 
        : 'This field is required';
      errors.push(message);
    }
  }

  // Skip other validations if value is empty and not required
  if (!value && !validation.required) return errors;

  // MinLength validation
  if (validation.minLength && typeof value === 'string') {
    const minLength = typeof validation.minLength === 'number' ? validation.minLength : validation.minLength.value;
    if (value.length < minLength) {
      const message = typeof validation.minLength === 'object' && validation.minLength.message
        ? validation.minLength.message
        : `Minimum length is ${minLength} characters`;
      errors.push(message);
    }
  }

  // MaxLength validation
  if (validation.maxLength && typeof value === 'string') {
    const maxLength = typeof validation.maxLength === 'number' ? validation.maxLength : validation.maxLength.value;
    if (value.length > maxLength) {
      const message = typeof validation.maxLength === 'object' && validation.maxLength.message
        ? validation.maxLength.message
        : `Maximum length is ${maxLength} characters`;
      errors.push(message);
    }
  }

  // Pattern validation
  if (validation.pattern && typeof value === 'string') {
    const pattern = validation.pattern instanceof RegExp ? validation.pattern : validation.pattern.value;
    if (!pattern.test(value)) {
      const message = typeof validation.pattern === 'object' && validation.pattern.message
        ? validation.pattern.message
        : 'Invalid format';
      errors.push(message);
    }
  }

  // Min validation (for numbers)
  if (validation.min && typeof value === 'number') {
    const min = typeof validation.min === 'number' ? validation.min : validation.min.value;
    if (value < min) {
      const message = typeof validation.min === 'object' && validation.min.message
        ? validation.min.message
        : `Minimum value is ${min}`;
      errors.push(message);
    }
  }

  // Max validation (for numbers)
  if (validation.max && typeof value === 'number') {
    const max = typeof validation.max === 'number' ? validation.max : validation.max.value;
    if (value > max) {
      const message = typeof validation.max === 'object' && validation.max.message
        ? validation.max.message
        : `Maximum value is ${max}`;
      errors.push(message);
    }
  }

  // Custom validations
  if (validation.custom) {
    validation.custom.forEach(rule => {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    });
  }

  return errors;
};

// Input Field Component
export const FormField = ({
  label,
  error: externalError,
  hint,
  validation,
  showValidation = false,
  required,
  disabled,
  className,
  labelClassName,
  containerClassName,
  icon,
  rightIcon,
  type = 'text',
  showPasswordToggle = true,
  onValidationChange,
  onChange,
  onBlur,
  value,
  ...props
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [internalErrors, setInternalErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const actualType = type === 'password' && showPassword ? 'text' : type;
  const errors = externalError ? [externalError] : internalErrors;
  const hasError = touched && errors.length > 0;
  const showSuccess = touched && isValid && showValidation && !hasError;

  useEffect(() => {
    if (validation) {
      const validationErrors = validateField(value, validation);
      setInternalErrors(validationErrors);
      setIsValid(validationErrors.length === 0);
      
      if (onValidationChange) {
        onValidationChange(validationErrors.length === 0, validationErrors);
      }
    }
  }, [value, validation, onValidationChange]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to number for number inputs
    if (type === 'number' && e.target.value !== '') {
      const numValue = parseFloat(e.target.value);
      if (!isNaN(numValue) && onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: e.target.value,
            valueAsNumber: numValue
          }
        };
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      } else if (onChange) {
        onChange(e);
      }
    } else if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={cn('space-y-1', containerClassName)}>
      {label && (
        <label className={cn(
          'block text-sm font-medium text-gray-700',
          labelClassName
        )}>
          {label}
          {(required || validation?.required) && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          {...props}
          type={actualType}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors',
            icon && 'pl-10',
            (rightIcon || (type === 'password' && showPasswordToggle)) && 'pr-10',
            hasError && 'border-red-300 focus:ring-red-500 focus:border-red-500',
            showSuccess && 'border-green-300 focus:ring-green-500 focus:border-green-500',
            !hasError && !showSuccess && 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
            disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
            className
          )}
        />
        
        {/* Right icon or password toggle */}
        {(type === 'password' && showPasswordToggle) ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        ) : rightIcon ? (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        ) : null}

        {/* Validation icons */}
        {showValidation && touched && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {hasError ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : null}
          </div>
        )}
      </div>
      
      {/* Hint or error message */}
      {hasError ? (
        <p className="text-sm text-red-600">{errors[0]}</p>
      ) : hint ? (
        <p className="text-sm text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
};

// Textarea Component
export const TextareaField = ({
  label,
  error: externalError,
  hint,
  validation,
  showValidation = false,
  required,
  disabled,
  className,
  labelClassName,
  containerClassName,
  rows = 3,
  resize = true,
  onValidationChange,
  onChange,
  onBlur,
  value,
  ...props
}: TextareaFieldProps) => {
  const [internalErrors, setInternalErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const errors = externalError ? [externalError] : internalErrors;
  const hasError = touched && errors.length > 0;
  const showSuccess = touched && isValid && showValidation && !hasError;

  useEffect(() => {
    if (validation) {
      const validationErrors = validateField(value, validation);
      setInternalErrors(validationErrors);
      setIsValid(validationErrors.length === 0);
      
      if (onValidationChange) {
        onValidationChange(validationErrors.length === 0, validationErrors);
      }
    }
  }, [value, validation, onValidationChange]);

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={cn('space-y-1', containerClassName)}>
      {label && (
        <label className={cn(
          'block text-sm font-medium text-gray-700',
          labelClassName
        )}>
          {label}
          {(required || validation?.required) && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}
      
      <textarea
        {...props}
        rows={rows}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors',
          hasError && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          showSuccess && 'border-green-300 focus:ring-green-500 focus:border-green-500',
          !hasError && !showSuccess && 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
          !resize && 'resize-none',
          className
        )}
      />
      
      {hasError ? (
        <p className="text-sm text-red-600">{errors[0]}</p>
      ) : hint ? (
        <p className="text-sm text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
};

// Select Component
export const SelectField = ({
  label,
  error: externalError,
  hint,
  validation,
  required,
  disabled,
  className,
  labelClassName,
  containerClassName,
  options,
  placeholder,
  onValidationChange,
  onChange,
  onBlur,
  value,
  ...props
}: SelectFieldProps) => {
  const [internalErrors, setInternalErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  const errors = externalError ? [externalError] : internalErrors;
  const hasError = touched && errors.length > 0;

  useEffect(() => {
    if (validation) {
      const validationErrors = validateField(value, validation);
      setInternalErrors(validationErrors);

      if (onValidationChange) {
        onValidationChange(validationErrors.length === 0, validationErrors);
      }
    }
  }, [value, validation, onValidationChange]);

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={cn('space-y-1', containerClassName)}>
      {label && (
        <label className={cn(
          'block text-sm font-medium text-gray-700',
          labelClassName
        )}>
          {label}
          {(required || validation?.required) && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}
      
      <select
        {...props}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors',
          hasError && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          !hasError && 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
          className
        )}
      >
        {placeholder && (
          <option value="" disabled>{placeholder}</option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {hasError ? (
        <p className="text-sm text-red-600">{errors[0]}</p>
      ) : hint ? (
        <p className="text-sm text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
};
