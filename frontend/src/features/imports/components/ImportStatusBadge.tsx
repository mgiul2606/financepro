import { useTranslation } from 'react-i18next';
import { Badge } from '@/core/components/atomic/Badge';
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

  const variant = STATUS_VARIANT_MAP[status] ?? 'secondary';
  const labelKey = STATUS_LABEL_MAP[status] ?? status;

  return (
    <Badge variant={variant} className={className}>
      {t(labelKey, { defaultValue: status })}
    </Badge>
  );
};

export default ImportStatusBadge;
