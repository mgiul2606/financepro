/**
 * Anomaly Details Modal Component
 *
 * Modal for viewing detailed information about a detected anomaly.
 */
import { useTranslation } from 'react-i18next';
import { AlertTriangle, TrendingUp, Calendar, DollarSign, Tag, Store, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Card, CardBody } from '@/core/components/atomic/Card';
import { Badge } from '@/core/components/atomic/Badge';
import { CurrencyText } from '@/core/components/atomic/CurrencyText';
import type { AnomalyDetection, BadgeVariant } from '../analytic.types';
import type { AnomalyTypeValue, SeverityValue } from '../analytic.constants';
import { SEVERITY_OPTIONS } from '../analytic.constants';
import type { SupportedCurrency } from '@/utils/currency';

interface AnomalyDetailsModalProps {
  anomaly: AnomalyDetection;
  isOpen: boolean;
  onClose: () => void;
}

const getSeverityColor = (severity: SeverityValue): string => {
  switch (severity) {
    case 'high':
      return 'text-red-600 bg-red-100 border-red-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'low':
      return 'text-blue-600 bg-blue-100 border-blue-200';
    default:
      return 'text-neutral-600 bg-neutral-100 border-neutral-200';
  }
};

const getSeverityVariant = (severity: SeverityValue): BadgeVariant => {
  const option = SEVERITY_OPTIONS.find((o) => o.value === severity);
  return (option?.variant as BadgeVariant) ?? 'info';
};

const getTypeIcon = (type: AnomalyTypeValue): React.ReactNode => {
  switch (type) {
    case 'unusually_high':
      return <TrendingUp className="h-5 w-5" />;
    case 'unusual_category':
      return <Tag className="h-5 w-5" />;
    case 'unusual_merchant':
      return <Store className="h-5 w-5" />;
    case 'unusual_time':
      return <Clock className="h-5 w-5" />;
    default:
      return <AlertTriangle className="h-5 w-5" />;
  }
};

export const AnomalyDetailsModal = ({
  anomaly,
  isOpen,
  onClose,
}: AnomalyDetailsModalProps) => {
  const { t } = useTranslation();

  // Use transactionDate if available, otherwise fall back to date
  const displayDate = anomaly.transactionDate ?? anomaly.date;
  // Use currency if available, otherwise default to EUR
  const displayCurrency = (anomaly.currency ?? 'EUR') as SupportedCurrency;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('analytics.anomalyDetails')}
      size="md"
    >
      <div className="space-y-6">
        {/* Anomaly Header */}
        <Card variant="bordered" className={getSeverityColor(anomaly.severity)}>
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getTypeIcon(anomaly.anomalyType)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">
                    {t(`analytics.anomalyTypes.${anomaly.anomalyType}`)}
                  </h3>
                  <Badge variant={getSeverityVariant(anomaly.severity)} size="sm">
                    {t(`analytics.severity.${anomaly.severity}`)}
                  </Badge>
                </div>
                <p className="text-sm opacity-90">{anomaly.description}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Transaction Details */}
        <div>
          <h4 className="text-sm font-semibold text-neutral-700 mb-3">
            {t('transactions.title')} {t('common.details')}
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-2 text-neutral-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{t('transactions.date')}</span>
              </div>
              <span className="text-sm font-medium text-neutral-900">
                {format(new Date(displayDate), 'MMMM dd, yyyy')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-2 text-neutral-600">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">{t('transactions.amount')}</span>
              </div>
              <CurrencyText
                value={anomaly.amount}
                currency={displayCurrency}
                className="text-sm font-semibold text-red-600"
              />
            </div>

            {anomaly.category && (
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center gap-2 text-neutral-600">
                  <Tag className="h-4 w-4" />
                  <span className="text-sm">{t('transactions.category')}</span>
                </div>
                <Badge variant="secondary" size="sm">
                  {anomaly.category}
                </Badge>
              </div>
            )}

            {anomaly.merchantName && (
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center gap-2 text-neutral-600">
                  <Store className="h-4 w-4" />
                  <span className="text-sm">{t('transactions.merchant')}</span>
                </div>
                <span className="text-sm font-medium text-neutral-900">
                  {anomaly.merchantName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI Explanation */}
        {anomaly.explanation && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-700 mb-3">
              AI {t('analytics.anomalyDetection')}
            </h4>
            <Card variant="bordered" className="bg-purple-50 border-purple-200">
              <CardBody className="p-4">
                <div className="flex gap-3">
                  <span className="text-2xl">🤖</span>
                  <p className="text-sm text-purple-900">{anomaly.explanation}</p>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Recommendation */}
        {anomaly.recommendation && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-700 mb-3">
              {t('analytics.recommendation', 'Recommendation')}
            </h4>
            <Card variant="bordered" className="bg-blue-50 border-blue-200">
              <CardBody className="p-4">
                <p className="text-sm text-blue-900">{anomaly.recommendation}</p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-neutral-200">
          <button
            onClick={() => {
              // TODO: Navigate to transaction details
              console.log('View transaction:', anomaly.transactionId);
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            {t('analytics.viewTransaction', 'View Transaction')}
          </button>
          <button
            onClick={() => {
              // TODO: Mark as reviewed
              console.log('Mark as reviewed:', anomaly.id);
              onClose();
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
          >
            {t('analytics.markAsReviewed', 'Mark as Reviewed')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
