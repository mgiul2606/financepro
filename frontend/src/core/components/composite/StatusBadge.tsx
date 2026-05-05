import { ReactNode } from 'react';
import { Badge, badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

export type BadgeStatus = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusBadgeProps {
  status: BadgeStatus;
  children: ReactNode;
  className?: string;
}

const STATUS_TO_VARIANT: Record<BadgeStatus, NonNullable<VariantProps<typeof badgeVariants>['variant']>> = {
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
  neutral: 'secondary',
};

export const StatusBadge = ({ status, children, className }: StatusBadgeProps) => (
  <Badge variant={STATUS_TO_VARIANT[status]} className={className}>
    {children}
  </Badge>
);
