import { Repeat, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Badge } from '@/core/components/atomic/Badge';
import type { RecurringPattern } from '../types';
import { format } from 'date-fns';

export interface RecurringPatternCardProps {
  pattern: RecurringPattern;
}

const frequencyLabels = {
  daily: 'Giornaliera',
  weekly: 'Settimanale',
  biweekly: 'Bisettimanale',
  monthly: 'Mensile',
  quarterly: 'Trimestrale',
  yearly: 'Annuale',
};

const getConfidenceBadge = (confidence: number) => {
  if (confidence >= 0.9) return { variant: 'success' as const, label: 'Alta' };
  if (confidence >= 0.7) return { variant: 'warning' as const, label: 'Media' };
  return { variant: 'secondary' as const, label: 'Bassa' };
};

export const RecurringPatternCard: React.FC<RecurringPatternCardProps> = ({ pattern }) => {
  const confidenceBadge = getConfidenceBadge(pattern.confidence);

  return (
    <Card variant="default" className="h-full">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-blue-600" />
            <span className="truncate">{pattern.merchantName}</span>
          </div>
        }
        subtitle={pattern.category}
        action={
          <Badge variant={confidenceBadge.variant} size="sm">
            {confidenceBadge.label}
          </Badge>
        }
      />
      <CardBody>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Importo medio</span>
            <span className="text-lg font-bold text-neutral-900">
              €{pattern.averageAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Frequenza</span>
            <span className="text-sm font-medium text-neutral-900">
              {frequencyLabels[pattern.frequency]}
            </span>
          </div>

          {pattern.variance > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Varianza</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">
                  ±{pattern.variance.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-neutral-500" />
              <div className="flex-1">
                <p className="text-xs text-neutral-600">Prossima occorrenza attesa</p>
                <p className="text-sm font-medium text-neutral-900">
                  {format(new Date(pattern.nextExpectedDate), 'dd MMM yyyy')}
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-neutral-500">
            {pattern.transactionCount} transazioni rilevate
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
