import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'secondary' | 'white';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3 border-2',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-3',
  xl: 'h-12 w-12 border-4',
};

const variantStyles: Record<SpinnerVariant, string> = {
  primary: 'border-blue-200 border-t-blue-600',
  secondary: 'border-neutral-200 border-t-neutral-600',
  white: 'border-white/30 border-t-white',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  label,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(clsx('inline-flex flex-col items-center gap-2', className))}
      role="status"
      aria-label={label || 'Loading'}
      {...props}
    >
      <div
        className={clsx(
          'animate-spin rounded-full',
          sizeStyles[size],
          variantStyles[variant]
        )}
      />
      {label && <span className="text-sm text-neutral-600">{label}</span>}
    </div>
  );
};

Spinner.displayName = 'Spinner';

export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  label?: string;
  children: React.ReactNode;
}> = ({ isLoading, label, children }) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg z-10">
          <Spinner size="lg" label={label} />
        </div>
      )}
    </div>
  );
};
