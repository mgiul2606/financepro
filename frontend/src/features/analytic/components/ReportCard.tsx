/**
 * Report Card Component
 *
 * Displays a financial report summary in a card format.
 */
import { FileText, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardAction, CardBody, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FinancialReport } from '../analytic.types';
import type { ReportTypeValue } from '../analytic.constants';
import { REPORT_TYPE_OPTIONS } from '../analytic.constants';
import { usePreferences } from '@/contexts/PreferencesContext';
import { formatCurrency, formatDate } from '@/utils/currency';

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
  const { preferences } = usePreferences();
  const fmt = (v: number) => formatCurrency(v, preferences.currency, preferences.locale);
  const savingsRate = report.summary.savingsRate;
  const isPositive = report.summary.netSavings > 0;

  return (
    <Card variant="elevated" className={onView ? 'hover:shadow-md cursor-pointer' : ''}>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>{report.title}</span>
          </div>
        </CardTitle>
        <CardAction>
          <Badge variant="default">
            {t(getReportTypeLabel(report.type))}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div className="text-sm text-neutral-600">
            {formatDate(report.period.from, preferences.locale)} -{' '}
            {formatDate(report.period.to, preferences.locale)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-600 mb-1">{t('analytics.income')}</p>
              <p className="text-lg font-semibold text-income">
                {fmt(report.summary.totalIncome)}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-600 mb-1">{t('analytics.expenses')}</p>
              <p className="text-lg font-semibold text-expense">
                {fmt(report.summary.totalExpenses)}
              </p>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-600 mb-1">{t('analytics.netSavings')}</p>
                <p className={`text-xl font-bold ${isPositive ? 'text-income' : 'text-expense'}`}>
                  {isPositive ? '+' : ''}{fmt(report.summary.netSavings)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-600 mb-1">{t('analytics.savingsRate')}</p>
                <div className="flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-income" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-expense" />
                  )}
                  <span className={`text-lg font-bold ${isPositive ? 'text-income' : 'text-expense'}`}>
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
      <CardFooter className="justify-between">
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
