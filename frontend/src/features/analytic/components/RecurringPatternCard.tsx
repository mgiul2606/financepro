/**
 * Recurring Pattern Card Component
 *
 * Displays a detected recurring transaction pattern.
 */
import { Repeat, TrendingUp, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Badge } from '@/core/components/atomic/Badge';
import type { RecurringPattern, BadgeVariant, ConfidenceBadgeInfo } from '../analytic.types';
import type { FrequencyValue } from '../analytic.constants';
import { FREQUENCY_OPTIONS, CONFIDENCE_THRESHOLDS } from '../analytic.constants';
import { format } from 'date-fns';

export interface RecurringPatternCardProps {
  pattern: RecurringPattern;
}

const getFrequencyLabel = (frequency: FrequencyValue): string => {
  const option = FREQUENCY_OPTIONS.find((o) => o.value === frequency);
  return option?.label ?? 'analytics.frequency.unknown';
};

const getConfidenceBadge = (confidence: number): ConfidenceBadgeInfo => {
  if (confidence >= CONFIDENCE_THRESHOLDS.high) {
    return { variant: 'success', label: 'analytics.confidence.high' };
  }
  if (confidence >= CONFIDENCE_THRESHOLDS.medium) {
    return { variant: 'warning', label: 'analytics.confidence.medium' };
  }
  return { variant: 'secondary', label: 'analytics.confidence.low' };
};

export const RecurringPatternCard: React.FC<RecurringPatternCardProps> = ({ pattern }) => {
  const { t } = useTranslation();
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
          <Badge variant={confidenceBadge.variant as BadgeVariant} size="sm">
            {t(confidenceBadge.label)}
          </Badge>
        }
      />
      <CardBody>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">
              {t('analytics.averageAmount')}
            </span>
            <span className="text-lg font-bold text-neutral-900">
              {pattern.averageAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">
              {t('analytics.frequency')}
            </span>
            <span className="text-sm font-medium text-neutral-900">
              {t(getFrequencyLabel(pattern.frequency))}
            </span>
          </div>

          {pattern.variance > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">
                {t('analytics.variance')}
              </span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">
                  {pattern.variance.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-neutral-500" />
              <div className="flex-1">
                <p className="text-xs text-neutral-600">
                  {t('analytics.nextExpectedDate')}
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  {format(new Date(pattern.nextExpectedDate), 'dd MMM yyyy')}
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-neutral-500">
            {t('analytics.transactionsDetected', { count: pattern.transactionCount })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
