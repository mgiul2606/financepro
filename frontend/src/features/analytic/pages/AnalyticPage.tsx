import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Tabs } from '@/core/components/atomic/Tabs';
import { Spinner } from '@/core/components/atomic/Spinner';
import { Button } from '@/core/components/atomic/Button';
import { LineChart, PieChart, BarChart } from '@/core/components/composite/charts';
import {
  useAnalyticOverview,
  useTimeSeriesData,
  useCategoryBreakdown,
  useMerchantAnalysis,
  useAnomalies,
  useRecurringPatterns,
  useReports,
} from '../hooks/useAnalytics';
import { OverviewStats } from '../components/OverviewStats';
import { AnomalyCard } from '../components/AnomalyCard';
import { RecurringPatternCard } from '../components/RecurringPatternCard';
import { ReportCard } from '../components/ReportCard';
import { Filter, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const AnalyticPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [filters] = useState({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });

  // Fetch data
  const { data: overview, isLoading: overviewLoading } = useAnalyticOverview(filters);
  const { data: timeSeriesData, isLoading: timeSeriesLoading } = useTimeSeriesData(filters);
  const { data: categories, isLoading: categoriesLoading } = useCategoryBreakdown(filters);
  const { data: merchants, isLoading: merchantsLoading } = useMerchantAnalysis(filters);
  const { data: anomalies, isLoading: anomaliesLoading } = useAnomalies(filters);
  const { data: patterns, isLoading: patternsLoading } = useRecurringPatterns(filters);
  const { data: reports, isLoading: reportsLoading } = useReports(filters);

  const tabs = [
    { id: 'overview', label: t('analytics.overview') },
    { id: 'trends', label: t('analytics.trends') },
    { id: 'categories', label: t('analytics.categories') },
    { id: 'merchants', label: t('analytics.merchants') },
    { id: 'anomalies', label: t('analytics.anomalies') },
    { id: 'patterns', label: t('analytics.patterns') },
    { id: 'reports', label: t('analytics.reports') },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title={t('analytics.title')}
        subtitle={t('analytics.subtitle')}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('analytics.title') },
        ]}
        actions={
          <>
            <Button variant="secondary" leftIcon={<Filter className="h-4 w-4" />}>
              {t('analytics.filters')}
            </Button>
            <Button variant="primary" leftIcon={<Download className="h-4 w-4" />}>
              {t('common.export')}
            </Button>
          </>
        }
        tabs={
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        }
      />

      <div className="p-6 space-y-6">
        {/* Period Info */}
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Calendar className="h-4 w-4" />
          <span>
            {t('analytics.period')}: {format(new Date(filters.dateFrom), 'dd MMM yyyy')} -{' '}
            {format(new Date(filters.dateTo), 'dd MMM yyyy')}
          </span>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {overviewLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" label={t('analytics.loadingOverview')} />
              </div>
            ) : overview ? (
              <>
                <OverviewStats overview={overview} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Time Series Chart */}
                  <Card variant="elevated">
                    <CardHeader title={t('analytics.incomeExpensesTrend')} />
                    <CardBody>
                      {timeSeriesLoading ? (
                        <Spinner />
                      ) : timeSeriesData ? (
                        <LineChart
                          data={timeSeriesData}
                          xAxisKey="date"
                          lines={[
                            { dataKey: 'income', name: t('analytics.income'), stroke: '#10b981' },
                            { dataKey: 'expenses', name: t('analytics.expenses'), stroke: '#ef4444' },
                          ]}
                          height={250}
                          formatXAxis={(value) => format(new Date(value), 'dd MMM')}
                          formatYAxis={(value) => `€${value}`}
                          formatTooltip={(value) => `€${value.toFixed(2)}`}
                        />
                      ) : null}
                    </CardBody>
                  </Card>

                  {/* Category Breakdown */}
                  <Card variant="elevated">
                    <CardHeader title={t('analytics.categoryDistribution')} />
                    <CardBody>
                      {categoriesLoading ? (
                        <Spinner />
                      ) : categories ? (
                        <PieChart
                          data={categories.map((c) => ({
                            name: c.category,
                            value: c.amount,
                            color: c.color,
                          }))}
                          height={250}
                          formatValue={(value) => `€${value.toFixed(2)}`}
                        />
                      ) : null}
                    </CardBody>
                  </Card>
                </div>

                {/* Quick Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card variant="bordered">
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-neutral-600">{t('analytics.topCategory')}</p>
                          <p className="text-lg font-bold text-neutral-900">{overview.topCategory}</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">📊</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card variant="bordered">
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-neutral-600">{t('analytics.transactionCount')}</p>
                          <p className="text-lg font-bold text-neutral-900">{overview.transactionCount}</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">💳</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card variant="bordered">
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-neutral-600">{t('analytics.anomaliesDetected')}</p>
                          <p className="text-lg font-bold text-neutral-900">{anomalies?.length || 0}</p>
                        </div>
                        <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">⚠️</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader title={t('analytics.temporalTrend')} />
              <CardBody>
                {timeSeriesLoading ? (
                  <Spinner />
                ) : timeSeriesData ? (
                  <LineChart
                    data={timeSeriesData}
                    xAxisKey="date"
                    lines={[
                      { dataKey: 'income', name: t('analytics.income'), stroke: '#10b981' },
                      { dataKey: 'expenses', name: t('analytics.expenses'), stroke: '#ef4444' },
                      { dataKey: 'balance', name: t('analytics.balance'), stroke: '#3b82f6' },
                    ]}
                    height={400}
                    formatXAxis={(value) => format(new Date(value), 'dd MMM')}
                    formatYAxis={(value) => `€${value}`}
                    formatTooltip={(value) => `€${value.toFixed(2)}`}
                  />
                ) : null}
              </CardBody>
            </Card>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="elevated">
                <CardHeader title={t('analytics.categoryBreakdown')} />
                <CardBody>
                  {categoriesLoading ? (
                    <Spinner />
                  ) : categories ? (
                    <PieChart
                      data={categories.map((c) => ({
                        name: c.category,
                        value: c.amount,
                        color: c.color,
                      }))}
                      height={350}
                      formatValue={(value) => `€${value.toFixed(2)}`}
                    />
                  ) : null}
                </CardBody>
              </Card>

              <Card variant="elevated">
                <CardHeader title={t('analytics.categoryByAmount')} />
                <CardBody>
                  {categoriesLoading ? (
                    <Spinner />
                  ) : categories ? (
                    <BarChart
                      data={categories}
                      xAxisKey="category"
                      bars={[{ dataKey: 'amount', name: t('analytics.amount') }]}
                      height={350}
                      formatYAxis={(value) => `€${value}`}
                      formatTooltip={(value) => `€${value.toFixed(2)}`}
                      customColors={categories.map((c) => c.color || '#3b82f6')}
                    />
                  ) : null}
                </CardBody>
              </Card>
            </div>

            {/* Category Details Table */}
            <Card variant="elevated">
              <CardHeader title={t('analytics.categoryDetails')} />
              <CardBody>
                {categoriesLoading ? (
                  <Spinner />
                ) : categories ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b-2 border-neutral-200 bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">{t('analytics.category')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.amount')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.percentage')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.transactionCount')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.average')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat, index) => (
                          <tr key={index} className="border-b border-neutral-200 hover:bg-neutral-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                <span className="font-medium">{cat.category}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              €{cat.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-600">
                              {cat.percentage}%
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-600">
                              {cat.transactionCount}
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-600">
                              €{(cat.amount / cat.transactionCount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          </div>
        )}

        {/* Merchants Tab */}
        {activeTab === 'merchants' && (
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader title={t('analytics.topMerchants')} />
              <CardBody>
                {merchantsLoading ? (
                  <Spinner />
                ) : merchants ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b-2 border-neutral-200 bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">{t('analytics.merchant')}</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">{t('analytics.category')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.total')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.transactionCount')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.average')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.last')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {merchants.map((merchant, index) => (
                          <tr key={index} className="border-b border-neutral-200 hover:bg-neutral-50">
                            <td className="px-4 py-3 font-medium">{merchant.merchantName}</td>
                            <td className="px-4 py-3 text-neutral-600">{merchant.category}</td>
                            <td className="px-4 py-3 text-right font-semibold">
                              €{merchant.totalAmount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-600">
                              {merchant.transactionCount}
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-600">
                              €{merchant.averageAmount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-neutral-500">
                              {format(new Date(merchant.lastTransaction), 'dd/MM/yy')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && (
          <div className="space-y-6">
            <Card variant="bordered" className="bg-orange-50 border-orange-200">
              <CardBody>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🔍</span>
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {t('analytics.anomalyDetection')}
                    </h3>
                    <p className="text-sm text-neutral-700">
                      {t('analytics.anomalyDetectionDesc')}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {anomaliesLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : anomalies && anomalies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {anomalies.map((anomaly) => (
                  <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                ))}
              </div>
            ) : (
              <Card variant="elevated">
                <CardBody>
                  <div className="text-center py-12">
                    <span className="text-5xl mb-4 block">✅</span>
                    <p className="text-lg font-medium text-neutral-900">{t('analytics.noAnomalies')}</p>
                    <p className="text-sm text-neutral-600 mt-2">
                      {t('analytics.noAnomaliesDesc')}
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-6">
            <Card variant="bordered" className="bg-blue-50 border-blue-200">
              <CardBody>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🔄</span>
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {t('analytics.recurringPatternsDetected')}
                    </h3>
                    <p className="text-sm text-neutral-700">
                      {t('analytics.recurringPatternsDesc')}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {patternsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : patterns && patterns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patterns.map((pattern) => (
                  <RecurringPatternCard key={pattern.id} pattern={pattern} />
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Card variant="bordered" className="bg-purple-50 border-purple-200">
              <CardBody>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📊</span>
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {t('analytics.aiGeneratedReports')}
                    </h3>
                    <p className="text-sm text-neutral-700">
                      {t('analytics.aiGeneratedReportsDesc')}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {reportsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onView={() => console.log('View report', report.id)}
                    onDownload={() => console.log('Download report', report.id)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
