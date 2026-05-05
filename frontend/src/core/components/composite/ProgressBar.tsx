import { cn } from '@/lib/utils';

export type ProgressVariant = 'income' | 'warning' | 'expense' | 'brand' | 'default';

const FILL_CLASSES: Record<ProgressVariant, string> = {
  income: 'bg-income',
  warning: 'bg-warning-finance',
  expense: 'bg-expense',
  brand: 'bg-indigo-600',
  default: 'bg-primary',
};

interface ProgressBarProps {
  value: number;
  variant?: ProgressVariant;
  className?: string;
}

export const ProgressBar = ({ value, variant = 'default', className }: ProgressBarProps) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('w-full h-1.5 bg-muted rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full transition-all rounded-full', FILL_CLASSES[variant])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
