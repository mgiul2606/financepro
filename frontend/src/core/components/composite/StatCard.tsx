import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconCircle } from './IconCircle';

export interface ColorScheme {
  border: string;
  iconBg: string;
  iconText: string;
}

interface StatCardProps {
  title: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon: ReactNode;
  colorScheme: ColorScheme;
  loading?: boolean;
}

export const StatCard = ({ title, value, sublabel, icon, colorScheme, loading }: StatCardProps) => (
  <div className="rounded-xl shadow-sm border border-border bg-card overflow-hidden">
    <div className={cn('border-l-4 h-full', colorScheme.border)}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {title}
            </p>
            {loading ? (
              <div className="h-9 w-20 bg-muted rounded animate-pulse mt-1" />
            ) : (
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            )}
            {sublabel && <p className="text-xs text-muted-foreground/70 mt-1">{sublabel}</p>}
          </div>
          <IconCircle icon={icon} size="md" bg={colorScheme.iconBg} color={colorScheme.iconText} />
        </div>
      </div>
    </div>
  </div>
);
