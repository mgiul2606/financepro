import { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      helperText,
      error,
      indeterminate = false,
      className,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const checkboxClasses = twMerge(
      clsx(
        'peer h-5 w-5 appearance-none border-2 rounded transition-all duration-150 cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error
          ? 'border-red-500 text-red-600'
          : 'border-neutral-300 checked:bg-blue-600 checked:border-blue-600',
        className
      )
    );

    return (
      <div className="flex flex-col">
        <label className="inline-flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              ref={ref}
              type="checkbox"
              disabled={disabled}
              checked={checked}
              className={checkboxClasses}
              {...props}
            />
            {(checked || indeterminate) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white">
                {indeterminate ? (
                  <div className="h-0.5 w-3 bg-current" />
                ) : (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                )}
              </div>
            )}
          </div>

          {label && (
            <div className="flex-1">
              <span
                className={clsx(
                  'text-sm font-medium text-neutral-900',
                  disabled && 'opacity-50'
                )}
              >
                {label}
              </span>
              {helperText && (
                <p className="text-sm text-neutral-600 mt-0.5">{helperText}</p>
              )}
            </div>
          )}
        </label>

        {error && <p className="mt-1.5 text-sm text-red-600 ml-8">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
