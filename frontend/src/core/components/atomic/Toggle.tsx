import { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ToggleSize = 'sm' | 'md' | 'lg';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  toggleSize?: ToggleSize;
}

const sizeStyles: Record<ToggleSize, { container: string; toggle: string; translate: string }> = {
  sm: {
    container: 'w-9 h-5',
    toggle: 'h-4 w-4',
    translate: 'translate-x-4',
  },
  md: {
    container: 'w-11 h-6',
    toggle: 'h-5 w-5',
    translate: 'translate-x-5',
  },
  lg: {
    container: 'w-14 h-7',
    toggle: 'h-6 w-6',
    translate: 'translate-x-7',
  },
};

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      label,
      helperText,
      error,
      toggleSize = 'md',
      className,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const size = sizeStyles[toggleSize];

    return (
      <div className="flex flex-col">
        <label className="inline-flex items-start gap-3 cursor-pointer group">
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              disabled={disabled}
              checked={checked}
              className="sr-only peer"
              {...props}
            />
            <div
              className={twMerge(
                clsx(
                  'relative rounded-full transition-colors duration-200',
                  'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2',
                  'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                  error
                    ? 'bg-red-200 peer-checked:bg-red-600'
                    : 'bg-neutral-300 peer-checked:bg-blue-600',
                  size.container,
                  className
                )
              )}
            >
              <div
                className={clsx(
                  'absolute left-0.5 top-1/2 -translate-y-1/2',
                  'bg-white rounded-full shadow-sm transition-transform duration-200',
                  'peer-checked:' + size.translate,
                  size.toggle
                )}
              />
            </div>
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

Toggle.displayName = 'Toggle';
