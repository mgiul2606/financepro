import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardBody,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from './EmptyState';
import type { EmptyStateProps } from './EmptyState';

export interface SectionCardProps {
  title: string;
  description?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
  isEmpty: boolean;
  emptyState: EmptyStateProps;
  children: ReactNode;
  className?: string;
}

export const SectionCard = ({
  title,
  description,
  onViewAll,
  viewAllLabel,
  isEmpty,
  emptyState,
  children,
  className,
}: SectionCardProps) => {
  const { t } = useTranslation();
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {onViewAll && (
          <CardAction>
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              {viewAllLabel ?? t('dashboard.viewAll')}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardBody>
        {isEmpty ? <EmptyState {...emptyState} /> : children}
      </CardBody>
    </Card>
  );
};
