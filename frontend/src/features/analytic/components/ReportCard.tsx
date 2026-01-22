/**
 * Report Card Component
 *
 * Displays a financial report summary in a card format.
 */
import { FileText, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardBody, CardFooter } from '@/core/components/atomic/Card';
import { Badge } from '@/core/components/atomic/Badge';
import { Button } from '@/core/components/atomic/Button';
import type { FinancialReport } from '../analytic.types';
import type { ReportTypeValue } from '../analytic.constants';
import { REPORT_TYPE_OPTIONS } from '../analytic.constants';
import { format } from 'date-fns';

export interface ReportCardProps {
  report: FinancialReport;
  onView?: () => void;
  onDownload?: () => void;
}

const getReportTypeLabel = (type: ReportTypeValue): string => {
  const option = REPORT_TYPE_OPTIONS.find((o) => o.value === type);
  return option?.label ?? 'analytics.reportTypes.unknown';
};

export const ReportCard: React.FC<ReportCardProps> = ({ report, onView, onDownload }) => {
  const { t } = useTranslation();
  const savingsRate = report.summary.savingsRate;
  const isPositive = report.summary.netSavings > 0;

  return (
    <Card variant="elevated" hoverable={!!onView}>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>{report.title}</span>
          </div>
        }
        action={
          <Badge variant="primary" size="sm">
            {t(getReportTypeLabel(report.type))}
          </Badge>
        }
      />
      <CardBody>
        <div className="space-y-4">
          <div className="text-sm text-neutral-600">
            {format(new Date(report.period.from), 'dd MMM yyyy')} -{' '}
            {format(new Date(report.period.to), 'dd MMM yyyy')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-600 mb-1">{t('analytics.income')}</p>
              <p className="text-lg font-semibold text-green-600">
                {report.summary.totalIncome.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-600 mb-1">{t('analytics.expenses')}</p>
              <p className="text-lg font-semibold text-red-600">
                {report.summary.totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-600 mb-1">{t('analytics.netSavings')}</p>
                <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{report.summary.netSavings.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-600 mb-1">{t('analytics.savingsRate')}</p>
                <div className="flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {savingsRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {report.insights.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-700">{t('analytics.keyInsights')}:</p>
              <ul className="space-y-1">
                {report.insights.slice(0, 2).map((insight, index) => (
                  <li key={index} className="text-xs text-neutral-600 flex items-start gap-2">
                    <span className="text-blue-600">-</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardBody>
      <CardFooter align="between">
        <Button variant="ghost" size="sm" onClick={onView}>
          {t('common.view')}
        </Button>
        {report.downloadUrl && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={onDownload}
          >
            {t('common.download')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
