import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  dot?: boolean;
  onRemove?: () => void;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-blue-100 text-blue-800 border-blue-200',
  secondary: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-sky-100 text-sky-800 border-sky-200',
};

const sizeStyles: Record<BadgeSize, { base: string; text: string; dot: string }> = {
  sm: {
    base: 'px-2 py-0.5',
    text: 'text-xs',
    dot: 'h-1.5 w-1.5',
  },
  md: {
    base: 'px-2.5 py-1',
    text: 'text-sm',
    dot: 'h-2 w-2',
  },
  lg: {
    base: 'px-3 py-1.5',
    text: 'text-base',
    dot: 'h-2.5 w-2.5',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  rounded = false,
  dot = false,
  onRemove,
  className,
  children,
  ...props
}) => {
  const styles = sizeStyles[size];

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 font-medium border',
          'transition-colors duration-150',
          variantStyles[variant],
          styles.base,
          styles.text,
          rounded ? 'rounded-full' : 'rounded-md',
          className
        )
      )}
      {...props}
    >
      {dot && (
        <span className={clsx('rounded-full bg-current', styles.dot)} />
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex hover:opacity-70 transition-opacity"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

Badge.displayName = 'Badge';
