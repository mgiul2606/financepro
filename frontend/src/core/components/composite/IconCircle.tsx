import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface IconCircleProps {
  icon: ReactNode;
  size?: 'sm' | 'md';
  bg: string;
  color: string;
  className?: string;
}

export const IconCircle = ({ icon, size = 'md', bg, color, className }: IconCircleProps) => (
  <div
    className={cn(
      'rounded-full flex items-center justify-center shrink-0',
      size === 'sm' ? 'h-10 w-10' : 'h-12 w-12',
      bg,
      className
    )}
  >
    <div className={color}>{icon}</div>
  </div>
);
