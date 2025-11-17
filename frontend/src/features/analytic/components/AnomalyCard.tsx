import { AlertTriangle, TrendingUp, MapPin, Clock } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Badge } from '@/core/components/atomic/Badge';
import type { AnomalyDetection } from '../types';
import { format } from 'date-fns';

export interface AnomalyCardProps {
  anomaly: AnomalyDetection;
  onViewDetails?: () => void;
}

const anomalyTypeIcons = {
  unusually_high: TrendingUp,
  unusual_category: MapPin,
  unusual_merchant: MapPin,
  unusual_time: Clock,
};

const anomalyTypeLabels = {
  unusually_high: 'Importo Insolito',
  unusual_category: 'Categoria Insolita',
  unusual_merchant: 'Merchant Nuovo',
  unusual_time: 'Orario Insolito',
};

const severityVariants = {
  low: 'info' as const,
  medium: 'warning' as const,
  high: 'danger' as const,
};

export const AnomalyCard: React.FC<AnomalyCardProps> = ({ anomaly, onViewDetails }) => {
  const Icon = anomalyTypeIcons[anomaly.anomalyType];

  return (
    <Card
      variant="bordered"
      hoverable={!!onViewDetails}
      onClick={onViewDetails}
      className="transition-all"
    >
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-orange-600" />
            <span>{anomalyTypeLabels[anomaly.anomalyType]}</span>
          </div>
        }
        action={
          <Badge variant={severityVariants[anomaly.severity]} size="sm">
            {anomaly.severity === 'low' && 'Bassa'}
            {anomaly.severity === 'medium' && 'Media'}
            {anomaly.severity === 'high' && 'Alta'}
          </Badge>
        }
      />
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
                €{anomaly.amount.toFixed(2)}
              </p>
              <p className="text-xs text-neutral-500">
                {format(new Date(anomaly.date), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-900">{anomaly.explanation}</p>
            </div>
          </div>

          {anomaly.expectedAmount && (
            <div className="text-xs text-neutral-600">
              <span>Importo atteso: </span>
              <span className="font-medium">€{anomaly.expectedAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
