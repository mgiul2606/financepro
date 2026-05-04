/**
 * Anomaly Card Component
 *
 * Displays a detected anomaly in a card format with severity indication.
 */
import { AlertTriangle, TrendingUp, MapPin, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardAction, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AnomalyDetection, BadgeVariant } from '../analytic.types';
import type { AnomalyTypeValue, SeverityValue } from '../analytic.constants';
import { ANOMALY_TYPE_OPTIONS, SEVERITY_OPTIONS } from '../analytic.constants';
import { usePreferences } from '@/contexts/PreferencesContext';
import { formatCurrency, formatDate } from '@/utils/currency';

export interface AnomalyCardProps {
  anomaly: AnomalyDetection;
  onViewDetails?: () => void;
}

const anomalyTypeIcons: Record<AnomalyTypeValue, typeof TrendingUp> = {
  unusually_high: TrendingUp,
  unusual_category: MapPin,
  unusual_merchant: MapPin,
  unusual_time: Clock,
};

const getSeverityVariant = (severity: SeverityValue): BadgeVariant => {
  const option = SEVERITY_OPTIONS.find((o) => o.value === severity);
  return (option?.variant as BadgeVariant) ?? 'info';
};

const getAnomalyTypeLabel = (type: AnomalyTypeValue): string => {
  const option = ANOMALY_TYPE_OPTIONS.find((o) => o.value === type);
  return option?.label ?? 'analytics.anomalyTypes.unknown';
};

const getSeverityLabel = (severity: SeverityValue): string => {
  const option = SEVERITY_OPTIONS.find((o) => o.value === severity);
  return option?.label ?? 'analytics.severity.unknown';
};

export const AnomalyCard: React.FC<AnomalyCardProps> = ({ anomaly, onViewDetails }) => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const Icon = anomalyTypeIcons[anomaly.anomalyType];

  return (
    <Card
      variant="bordered"
      onClick={onViewDetails}
      className={`transition-all${onViewDetails ? ' hover:shadow-md cursor-pointer' : ''}`}
    >
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-orange-600" />
            <span>{t(getAnomalyTypeLabel(anomaly.anomalyType))}</span>
          </div>
        </CardTitle>
        <CardAction>
          <Badge variant={getSeverityVariant(anomaly.severity) as 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'}>
            {t(getSeverityLabel(anomaly.severity))}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {anomaly.merchantName}
              </p>
              <p className="text-xs text-neutral-600">{anomaly.category}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-neutral-900">
                {formatCurrency(anomaly.amount, preferences.currency, preferences.locale)}
              </p>
              <p className="text-xs text-neutral-500">
                {formatDate(anomaly.date, preferences.locale)}
              </p>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-900">{anomaly.explanation}</p>
            </div>
          </div>

          {anomaly.expectedAmount !== undefined && (
            <div className="text-xs text-neutral-600">
              <span>{t('analytics.expectedAmount')}: </span>
              <span className="font-medium">{formatCurrency(anomaly.expectedAmount, preferences.currency, preferences.locale)}</span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
