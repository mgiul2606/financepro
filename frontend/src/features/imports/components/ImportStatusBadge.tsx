import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { STATUS_VARIANT_MAP, STATUS_LABEL_MAP } from '../imports.constants';

interface ImportStatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * Badge component for displaying import job status
 * Maps status values to appropriate colors and labels
 */
export const ImportStatusBadge = ({ status, className }: ImportStatusBadgeProps) => {
  const { t } = useTranslation();

  const rawVariant = STATUS_VARIANT_MAP[status] ?? 'secondary';
  const variant = rawVariant === 'danger' ? 'destructive' : rawVariant;
  const labelKey = STATUS_LABEL_MAP[status] ?? status;

  return (
    <Badge variant={variant as 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'} className={className}>
      {t(labelKey, { defaultValue: status })}
    </Badge>
  );
};

export default ImportStatusBadge;
