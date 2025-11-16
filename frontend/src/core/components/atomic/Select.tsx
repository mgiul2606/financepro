import { forwardRef, SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';

export type SelectVariant = 'default' | 'error' | 'success';
export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: SelectVariant;
  selectSize?: SelectSize;
  options: SelectOption[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  label?: string;
  fullWidth?: boolean;
}

const variantStyles: Record<SelectVariant, string> = {
  default: 'border-neutral-300 focus:border-blue-500 focus:ring-blue-500',
  error: 'border-red-500 focus:border-red-600 focus:ring-red-500',
  success: 'border-green-500 focus:border-green-600 focus:ring-green-500',
};

const sizeStyles: Record<SelectSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-5 py-3 text-lg rounded-lg',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant = 'default',
      selectSize = 'md',
      options,
      placeholder,
      helperText,
      error,
      label,
      fullWidth = false,
      className,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const actualVariant = error ? 'error' : variant;

    const baseStyles = 'block appearance-none border bg-white text-neutral-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-500 pr-10';

    const selectClasses = twMerge(
      clsx(
        baseStyles,
        variantStyles[actualVariant],
        sizeStyles[selectSize],
        fullWidth && 'w-full',
        className
      )
    );

    return (
      <div className={clsx('relative', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            required={required}
            className={selectClasses}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
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

          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          </div>
        </div>

        {(helperText || error) && (
          <p
            className={clsx(
              'mt-1.5 text-sm',
              error ? 'text-red-600' : 'text-neutral-600'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
