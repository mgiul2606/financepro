/**
 * Manual API functions for new analysis endpoints.
 * These replicate the Orval-generated pattern using customInstance.
 * When Orval is re-run, these can be replaced by the generated hooks.
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { customInstance } from '@/api/client';

// ============================================================================
// Types — matching backend CamelCaseModel serialization
// ============================================================================

export interface TopMerchantItem {
  merchantName: string;
  merchantId: string | null;
  logoUrl: string | null;
  categoryName: string | null;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  avgTransaction: number;
}

export interface TopMerchantsResponse {
  merchants: TopMerchantItem[];
  periodStart: string;
  periodEnd: string;
  totalExpenses: number;
}

export interface AnomalyItem {
  transactionId: string;
  transactionDate: string;
  description: string;
  amount: number;
  categoryName: string;
  categoryAvg: number;
  categoryStddev: number;
  deviationFactor: number;
  severity: string;
}

export interface AnomaliesResponse {
  anomalies: AnomalyItem[];
  periodStart: string;
  periodEnd: string;
  totalAnalyzed: number;
}

export interface DayOfWeekSpending {
  day: number;
  dayName: string;
  total: number;
  avg: number;
  transactionCount: number;
}

export interface WeekOfMonthSpending {
  week: number;
  label: string;
  total: number;
  avg: number;
}

export interface CategoryTrend {
  categoryName: string;
  categoryId: string;
  monthlyTotals: { month: string; amount: number }[];
  trend: string;
  trendPct: number;
}

export interface DetectedRecurring {
  description: string;
  merchantName: string | null;
  avgAmount: number;
  occurrenceCount: number;
  estimatedFrequency: string;
  lastOccurrence: string;
  alreadyTracked: boolean;
}

export interface PatternsResponse {
  dayOfWeek: DayOfWeekSpending[];
  busiestDay: string;
  quietestDay: string;
  weekOfMonth: WeekOfMonthSpending[];
  categoryTrends: CategoryTrend[];
  detectedRecurring: DetectedRecurring[];
  periodStart: string;
  periodEnd: string;
}

export interface CategoryBreakdownItem {
  label: string;
  merchantId: string | null;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  avgAmount: number;
}

export interface CategoryBreakdownResponse {
  categoryId: string;
  categoryName: string;
  totalCategorySpending: number;
  breakdown: CategoryBreakdownItem[];
  periodStart: string;
  periodEnd: string;
}

export interface ReportMeta {
  reportType: string;
  periodStart: string;
  periodEnd: string;
  rowCount: number;
  downloadUrl: string;
}

// ============================================================================
// Fetch functions
// ============================================================================

interface DateRangeParams {
  start_date: string;
  end_date: string;
  profile_ids?: string[];
  currency?: string;
}

function buildQueryString(params: Record<string, string | number | string[] | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => sp.append(key, v));
    } else {
      sp.append(key, String(value));
    }
  }
  const str = sp.toString();
  return str ? `?${str}` : '';
}

type ApiResponse<T> = { data: T; status: number; headers: Headers };

export async function fetchTopMerchants(
  params: DateRangeParams & { limit?: number },
  options?: RequestInit,
): Promise<ApiResponse<TopMerchantsResponse>> {
  const qs = buildQueryString(params);
  return customInstance<ApiResponse<TopMerchantsResponse>>(
    `/api/v1/analysis/top-merchants${qs}`,
    { ...options, method: 'GET' },
  );
}

export async function fetchAnomalies(
  params: DateRangeParams & { sensitivity?: string },
  options?: RequestInit,
): Promise<ApiResponse<AnomaliesResponse>> {
  const qs = buildQueryString(params);
  return customInstance<ApiResponse<AnomaliesResponse>>(
    `/api/v1/analysis/anomalies${qs}`,
    { ...options, method: 'GET' },
  );
}

export async function fetchPatterns(
  params: DateRangeParams,
  options?: RequestInit,
): Promise<ApiResponse<PatternsResponse>> {
  const qs = buildQueryString(params);
  return customInstance<ApiResponse<PatternsResponse>>(
    `/api/v1/analysis/patterns${qs}`,
    { ...options, method: 'GET' },
  );
}

export async function fetchCategoryBreakdown(
  categoryId: string,
  params: DateRangeParams & { limit?: number },
  options?: RequestInit,
): Promise<ApiResponse<CategoryBreakdownResponse>> {
  const qs = buildQueryString(params);
  return customInstance<ApiResponse<CategoryBreakdownResponse>>(
    `/api/v1/analysis/categories/${categoryId}/breakdown${qs}`,
    { ...options, method: 'GET' },
  );
}

export async function generateReport(
  body: { reportType: string; startDate: string; endDate: string; profileIds?: string[] },
  options?: RequestInit,
): Promise<ApiResponse<ReportMeta>> {
  return customInstance<ApiResponse<ReportMeta>>(
    `/api/v1/analysis/reports/generate`,
    {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_type: body.reportType,
        start_date: body.startDate,
        end_date: body.endDate,
        profile_ids: body.profileIds,
      }),
    },
  );
}

// ============================================================================
// React Query hooks
// ============================================================================

export function useTopMerchants(
  params: DateRangeParams & { limit?: number },
  options?: { query?: Partial<UseQueryOptions> },
) {
  return useQuery({
    queryKey: ['/api/v1/analysis/top-merchants', params],
    queryFn: ({ signal }) => fetchTopMerchants(params, { signal }),
    ...options?.query,
  });
}

export function useAnomaliesApi(
  params: DateRangeParams & { sensitivity?: string },
  options?: { query?: Partial<UseQueryOptions> },
) {
  return useQuery({
    queryKey: ['/api/v1/analysis/anomalies', params],
    queryFn: ({ signal }) => fetchAnomalies(params, { signal }),
    ...options?.query,
  });
}

export function usePatternsApi(
  params: DateRangeParams,
  options?: { query?: Partial<UseQueryOptions> },
) {
  return useQuery({
    queryKey: ['/api/v1/analysis/patterns', params],
    queryFn: ({ signal }) => fetchPatterns(params, { signal }),
    ...options?.query,
  });
}

export function useCategoryBreakdownApi(
  categoryId: string,
  params: DateRangeParams & { limit?: number },
  options?: { query?: Partial<UseQueryOptions> },
) {
  return useQuery({
    queryKey: ['/api/v1/analysis/categories/breakdown', categoryId, params],
    queryFn: ({ signal }) => fetchCategoryBreakdown(categoryId, params, { signal }),
    enabled: !!categoryId,
    ...options?.query,
  });
}

export function useGenerateReportApi() {
  return useMutation({
    mutationFn: (body: { reportType: string; startDate: string; endDate: string; profileIds?: string[] }) =>
      generateReport(body),
  });
}
