import { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type InputVariant = 'default' | 'error' | 'success';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  inputSize?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  error?: string;
  label?: string;
  fullWidth?: boolean;
}

const variantStyles: Record<InputVariant, string> = {
  default: 'border-neutral-300 focus:border-blue-500 focus:ring-blue-500',
  error: 'border-red-500 focus:border-red-600 focus:ring-red-500',
  success: 'border-green-500 focus:border-green-600 focus:ring-green-500',
};

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-5 py-3 text-lg rounded-lg',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      inputSize = 'md',
      leftIcon,
      rightIcon,
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

    const baseStyles = 'block border bg-white text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-500';

    const inputClasses = twMerge(
      clsx(
        baseStyles,
        variantStyles[actualVariant],
        sizeStyles[inputSize],
        leftIcon && 'pl-10',
        rightIcon && 'pr-10',
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
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            required={required}
            className={inputClasses}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';
