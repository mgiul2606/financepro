/**
 * Recurring Pattern Card Component
 *
 * Displays a detected recurring transaction pattern.
 */
import { Repeat, TrendingUp, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RecurringPattern, ConfidenceBadgeInfo } from '../analytic.types';
import type { FrequencyValue } from '../analytic.constants';
import { FREQUENCY_OPTIONS, CONFIDENCE_THRESHOLDS } from '../analytic.constants';
import { usePreferences } from '@/contexts/PreferencesContext';
import { formatDate, formatCurrency } from '@/utils/currency';

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
  const { preferences } = usePreferences();
  const confidenceBadge = getConfidenceBadge(pattern.confidence);

  return (
    <Card variant="default" className="h-full">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-blue-600" />
            <span className="truncate">{pattern.merchantName}</span>
          </div>
        </CardTitle>
        <CardDescription>{pattern.category}</CardDescription>
        <CardAction>
          <Badge variant={confidenceBadge.variant as 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'}>
            {t(confidenceBadge.label)}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">
              {t('analytics.averageAmount')}
            </span>
            <span className="text-lg font-bold text-neutral-900">
              {formatCurrency(pattern.averageAmount, preferences.currency, preferences.locale)}
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
                  {formatDate(pattern.nextExpectedDate, preferences.locale)}
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
