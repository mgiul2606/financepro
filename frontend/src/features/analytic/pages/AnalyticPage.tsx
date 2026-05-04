import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { CurrencyText } from '@/core/components/formatters';
import { formatCurrency } from '@/utils/currency';
import { usePreferences } from '@/contexts/PreferencesContext';
import { LineChart, PieChart, BarChart, PieChartDataPoint } from '@/core/components/composite/charts';
import {
  useAnalyticOverview,
  useTimeSeriesData,
  useCategoryBreakdown,
  useMerchantAnalysis,
  useAnomalies,
  useSpendingPatterns,
  useGenerateReport,
} from '../analytic.hooks';
import { OverviewStats } from '../components/OverviewStats';
import { Filter, Download, Calendar, X, RefreshCw, FileText, BarChart3, TrendingUp, TrendingDown, AlertTriangle, Repeat, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const AnalyticPage = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const [activeTab, setActiveTab] = useState('overview');
  const [filters] = useState({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (dataPoint: PieChartDataPoint) => {
    setSelectedCategory((prev) => (prev === dataPoint.name ? null : dataPoint.name));
  };

  // Create filters for time series with selected category
  const timeSeriesFilters = useMemo(() => ({
    ...filters,
    categories: selectedCategory ? [selectedCategory] : undefined,
  }), [filters, selectedCategory]);

  // Fetch data using centralized hooks
  const { overview, isLoading: overviewLoading, error: overviewError, refetch: refetchOverview } = useAnalyticOverview(filters);
  const { timeSeries: timeSeriesData, isLoading: timeSeriesLoading } = useTimeSeriesData(timeSeriesFilters);
  const { categories, isLoading: categoriesLoading } = useCategoryBreakdown(filters);
  const { merchants, isLoading: merchantsLoading } = useMerchantAnalysis(filters);
  const { anomalies, totalAnalyzed, isLoading: anomaliesLoading } = useAnomalies(filters);
  const { patterns: patternsData, isLoading: patternsLoading } = useSpendingPatterns(filters);
  const { generateReport, report: generatedReport, isGenerating, reset: resetReport } = useGenerateReport();

  // Calculate selected index for PieChart highlighting
  const selectedCategoryIndex = useMemo(() => {
    if (!selectedCategory || !categories) return undefined;
    return categories.findIndex((c) => c.category === selectedCategory);
  }, [selectedCategory, categories]);

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
            <Button variant="default" leftIcon={<Download className="h-4 w-4" />}>
              {t('common.export')}
            </Button>
          </>
        }
        tabs={
          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList>
              <TabsTrigger value="overview">{t('analytics.overview')}</TabsTrigger>
              <TabsTrigger value="trends">{t('analytics.trends')}</TabsTrigger>
              <TabsTrigger value="categories">{t('analytics.categories')}</TabsTrigger>
              <TabsTrigger value="merchants">{t('analytics.merchants')}</TabsTrigger>
              <TabsTrigger value="anomalies">{t('analytics.anomalies')}</TabsTrigger>
              <TabsTrigger value="patterns">{t('analytics.patterns')}</TabsTrigger>
              <TabsTrigger value="reports">{t('analytics.reports')}</TabsTrigger>
            </TabsList>
          </Tabs>
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
                <Spinner size="lg" />
              </div>
            ) : overviewError ? (
              <Alert variant="destructive">
                <div className="flex items-center justify-between">
                  <span>{t('analytics.errors.loadFailed')}</span>
                  <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => refetchOverview()}>
                    {t('common.retry')}
                  </Button>
                </div>
              </Alert>
            ) : overview ? (
              <>
                <OverviewStats overview={overview} />

                {selectedCategory && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-blue-800">
                      {t('analytics.filteringBy')}: <strong>{selectedCategory}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="ml-auto flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-4 w-4" />
                      {t('analytics.clearFilter')}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Time Series Chart */}
                  <Card variant="elevated">
                    <CardHeader><CardTitle>{t('analytics.incomeExpensesTrend')}</CardTitle></CardHeader>
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
                          formatYAxis={(value) => formatCurrency(value, preferences.currency, preferences.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          formatTooltip={(value) => formatCurrency(value, preferences.currency, preferences.locale)}
                        />
                      ) : null}
                    </CardBody>
                  </Card>

                  {/* Category Breakdown */}
                  <Card variant="elevated">
                    <CardHeader><CardTitle>{t('analytics.categoryDistribution')}</CardTitle></CardHeader>
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
                          formatValue={(value) => formatCurrency(value, preferences.currency, preferences.locale)}
                          onSliceClick={handleCategoryClick}
                          selectedIndex={selectedCategoryIndex !== undefined && selectedCategoryIndex >= 0 ? selectedCategoryIndex : undefined}
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
                        <div className="h-12 w-12 bg-income-subtle rounded-full flex items-center justify-center">
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
            ) : (
              <Card variant="elevated">
                <CardBody>
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-neutral-900">{t('analytics.noDataAvailable')}</p>
                    <p className="text-sm text-neutral-600 mt-2">{t('analytics.noDataAvailableDesc')}</p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader><CardTitle>{t('analytics.temporalTrend')}</CardTitle></CardHeader>
              <CardBody>
                {timeSeriesLoading ? (
                  <Spinner />
                ) : timeSeriesData && timeSeriesData.length > 0 ? (
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
                    formatYAxis={(value) => formatCurrency(value, preferences.currency, preferences.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    formatTooltip={(value) => formatCurrency(value, preferences.currency, preferences.locale)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-600">{t('analytics.noDataAvailable')}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="elevated">
                <CardHeader><CardTitle>{t('analytics.categoryBreakdown')}</CardTitle></CardHeader>
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
                      formatValue={(value) => formatCurrency(value, preferences.currency, preferences.locale)}
                    />
                  ) : null}
                </CardBody>
              </Card>

              <Card variant="elevated">
                <CardHeader><CardTitle>{t('analytics.categoryByAmount')}</CardTitle></CardHeader>
                <CardBody>
                  {categoriesLoading ? (
                    <Spinner />
                  ) : categories ? (
                    <BarChart
                      data={categories.map((c) => ({ category: c.category, amount: c.amount }))}
                      xAxisKey="category"
                      bars={[{ dataKey: 'amount', name: t('analytics.amount') }]}
                      height={350}
                      formatYAxis={(value) => formatCurrency(value, preferences.currency, preferences.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      formatTooltip={(value) => formatCurrency(value, preferences.currency, preferences.locale)}
                      customColors={categories.map((c) => c.color || '#3b82f6')}
                    />
                  ) : null}
                </CardBody>
              </Card>
            </div>

            {/* Category Details Table */}
            <Card variant="elevated">
              <CardHeader><CardTitle>{t('analytics.categoryDetails')}</CardTitle></CardHeader>
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
                              <CurrencyText value={cat.amount} />
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-600">
                              {cat.percentage}%
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-600">
                              {cat.transactionCount}
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-600">
                              <CurrencyText value={cat.amount / cat.transactionCount} />
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
              <CardHeader><CardTitle>{t('analytics.topMerchants')}</CardTitle></CardHeader>
              <CardBody>
                {merchantsLoading ? (
                  <Spinner />
                ) : merchants && merchants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b-2 border-neutral-200 bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">{t('analytics.merchant')}</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">{t('analytics.category')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.total')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.percentage')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.transactionCount')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.average')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {merchants.map((merchant, index) => (
                          <tr key={index} className="border-b border-neutral-200 hover:bg-neutral-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {merchant.logoUrl && (
                                  <img src={merchant.logoUrl} alt="" className="h-6 w-6 rounded" />
                                )}
                                <span className="font-medium">{merchant.merchantName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-neutral-600">{merchant.categoryName ?? '—'}</td>
                            <td className="px-4 py-3 text-right font-semibold">
                              <CurrencyText value={merchant.totalAmount} />
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-600">
                              {merchant.percentage.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-600">
                              {merchant.transactionCount}
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-600">
                              <CurrencyText value={merchant.avgTransaction} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-600">{t('analytics.noDataAvailable')}</p>
                  </div>
                )}
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
                  <AlertTriangle className="h-8 w-8 text-orange-600 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {t('analytics.anomalyDetection')}
                    </h3>
                    <p className="text-sm text-neutral-700">
                      {t('analytics.anomalyDetectionDesc')}
                    </p>
                    {totalAnalyzed > 0 && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {t('analytics.transactionsAnalyzed', { count: totalAnalyzed })}
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {anomaliesLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : anomalies && anomalies.length > 0 ? (
              <div className="space-y-3">
                {anomalies.map((anomaly) => (
                  <Card key={anomaly.transactionId} variant="bordered" className="hover:shadow-md transition-shadow">
                    <CardBody>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              anomaly.severity === 'high' ? 'bg-expense-subtle text-expense' :
                              anomaly.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {t(`analytics.severity.${anomaly.severity}`)}
                            </span>
                            <span className="text-xs text-neutral-500">{anomaly.transactionDate}</span>
                          </div>
                          <p className="font-medium text-neutral-900 truncate">{anomaly.description}</p>
                          <p className="text-sm text-neutral-600">{anomaly.categoryName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-expense">
                            <CurrencyText value={anomaly.amount} />
                          </p>
                          <p className="text-xs text-neutral-500">
                            {t('analytics.expectedAvg')}: <CurrencyText value={anomaly.categoryAvg} />
                          </p>
                          <p className="text-xs text-neutral-500">
                            {anomaly.deviationFactor.toFixed(1)}x {t('analytics.deviation')}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <Card variant="elevated">
                <CardBody>
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-income mx-auto mb-4" />
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
            {patternsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : patternsData ? (
              <>
                {/* Day of Week spending */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card variant="elevated">
                    <CardHeader><CardTitle>{t('analytics.dayOfWeekSpending')}</CardTitle></CardHeader>
                    <CardBody>
                      <BarChart
                        data={patternsData.dayOfWeek.map((d) => ({
                          day: d.dayName,
                          total: d.total,
                          avg: d.avg,
                        }))}
                        xAxisKey="day"
                        bars={[
                          { dataKey: 'total', name: t('analytics.total') },
                          { dataKey: 'avg', name: t('analytics.average') },
                        ]}
                        height={250}
                        formatYAxis={(value) => formatCurrency(value, preferences.currency, preferences.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        formatTooltip={(value) => formatCurrency(value, preferences.currency, preferences.locale)}
                      />
                      <div className="mt-3 flex gap-4 text-sm">
                        <span className="text-neutral-600">
                          {t('analytics.busiestDay')}: <strong className="text-neutral-900">{patternsData.busiestDay}</strong>
                        </span>
                        <span className="text-neutral-600">
                          {t('analytics.quietestDay')}: <strong className="text-neutral-900">{patternsData.quietestDay}</strong>
                        </span>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Week of Month spending */}
                  <Card variant="elevated">
                    <CardHeader><CardTitle>{t('analytics.weekOfMonthSpending')}</CardTitle></CardHeader>
                    <CardBody>
                      <BarChart
                        data={patternsData.weekOfMonth.map((w) => ({
                          week: w.label,
                          total: w.total,
                          avg: w.avg,
                        }))}
                        xAxisKey="week"
                        bars={[
                          { dataKey: 'total', name: t('analytics.total') },
                          { dataKey: 'avg', name: t('analytics.average') },
                        ]}
                        height={250}
                        formatYAxis={(value) => formatCurrency(value, preferences.currency, preferences.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        formatTooltip={(value) => formatCurrency(value, preferences.currency, preferences.locale)}
                      />
                    </CardBody>
                  </Card>
                </div>

                {/* Category Trends */}
                {patternsData.categoryTrends.length > 0 && (
                  <Card variant="elevated">
                    <CardHeader><CardTitle>{t('analytics.categoryTrends')}</CardTitle></CardHeader>
                    <CardBody>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b-2 border-neutral-200 bg-neutral-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold">{t('analytics.category')}</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.trend')}</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold">{t('analytics.change')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patternsData.categoryTrends.map((ct) => (
                              <tr key={ct.categoryId} className="border-b border-neutral-200 hover:bg-neutral-50">
                                <td className="px-4 py-3 font-medium">{ct.categoryName}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                                    ct.trend === 'increasing' ? 'text-expense' :
                                    ct.trend === 'decreasing' ? 'text-income' :
                                    'text-neutral-600'
                                  }`}>
                                    {ct.trend === 'increasing' && <TrendingUp className="h-4 w-4" />}
                                    {ct.trend === 'decreasing' && <TrendingDown className="h-4 w-4" />}
                                    {t(`analytics.trendDirection.${ct.trend}`)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className={ct.trendPct > 0 ? 'text-expense' : ct.trendPct < 0 ? 'text-income' : 'text-neutral-600'}>
                                    {ct.trendPct > 0 ? '+' : ''}{ct.trendPct.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Detected Recurring */}
                {patternsData.detectedRecurring.length > 0 && (
                  <Card variant="elevated">
                    <CardHeader><CardTitle>{t('analytics.detectedRecurring')}</CardTitle></CardHeader>
                    <CardBody>
                      <div className="space-y-3">
                        {patternsData.detectedRecurring.map((rec, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Repeat className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-neutral-900">{rec.description}</p>
                                <p className="text-xs text-neutral-500">
                                  {t(`analytics.frequency.${rec.estimatedFrequency}`)} · {rec.occurrenceCount} {t('analytics.occurrences')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-neutral-900">
                                <CurrencyText value={rec.avgAmount} />
                              </p>
                              {rec.alreadyTracked && (
                                <span className="text-xs text-income flex items-center gap-1 justify-end">
                                  <CheckCircle className="h-3 w-3" />
                                  {t('analytics.tracked')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                )}
              </>
            ) : (
              <Card variant="elevated">
                <CardBody>
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-neutral-900">{t('analytics.noPatterns')}</p>
                    <p className="text-sm text-neutral-600 mt-2">{t('analytics.noPatternsDesc')}</p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Card variant="bordered" className="bg-purple-50 border-purple-200">
              <CardBody>
                <div className="flex items-start gap-3">
                  <FileText className="h-8 w-8 text-purple-600 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {t('analytics.generateReports')}
                    </h3>
                    <p className="text-sm text-neutral-700">
                      {t('analytics.generateReportsDesc')}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { type: 'monthly_summary', icon: Calendar, label: t('analytics.reportTypes.monthlySummary') },
                { type: 'category_breakdown', icon: BarChart3, label: t('analytics.reportTypes.categoryBreakdown') },
                { type: 'full_report', icon: FileText, label: t('analytics.reportTypes.fullReport') },
              ].map(({ type, icon: Icon, label }) => (
                <Card key={type} variant="elevated" className="hover:shadow-md cursor-pointer">
                  <CardBody>
                    <div className="text-center py-4">
                      <Icon className="h-10 w-10 text-purple-500 mx-auto mb-3" />
                      <h4 className="font-semibold text-neutral-900 mb-2">{label}</h4>
                      <Button
                        variant="default"
                        size="sm"
                        leftIcon={<Download className="h-4 w-4" />}
                        isLoading={isGenerating}
                        onClick={() => generateReport(type, filters.dateFrom, filters.dateTo)}
                      >
                        {t('analytics.generate')}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {generatedReport && (
              <Card variant="elevated" className="border-green-200 bg-income-subtle">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-income" />
                      <div>
                        <p className="font-medium text-neutral-900">
                          {t('analytics.reportReady')}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {generatedReport.rowCount} {t('analytics.rows')} · {generatedReport.reportType}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        leftIcon={<Download className="h-4 w-4" />}
                        onClick={() => {
                          window.open(generatedReport.downloadUrl, '_blank');
                        }}
                      >
                        {t('common.download')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => resetReport()}>
                        {t('common.close')}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
