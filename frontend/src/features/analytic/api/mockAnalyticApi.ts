// Mock Analytic API Service

import {
  AnalyticOverview,
  TimeSeriesData,
  CategoryBreakdown,
  MerchantAnalysis,
  AnomalyDetection,
  RecurringPattern,
  FinancialReport,
  SubcategoryBreakdown,
  AnalyticFilters,
} from '../types';

// Helper to generate dates
const generateDates = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Mock data generators
const mockOverview: AnalyticOverview = {
  period: {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  },
  totalSpent: 4567.89,
  totalIncome: 5800.00,
  netBalance: 1232.11,
  transactionCount: 142,
  topCategory: 'Alimentari',
  averageDaily: 152.26,
  comparisonToPrevious: {
    spent: -8.5,
    income: 3.2,
    balance: 15.7,
  },
};

const mockTimeSeriesData: TimeSeriesData[] = generateDates(30).map((date, index) => ({
  date,
  income: Math.random() * 300 + 100,
  expenses: Math.random() * 200 + 50,
  balance: 1000 + (Math.random() * 500 - 250),
}));

// Category-specific time series data for filtering
const categoryTimeSeriesData: Record<string, TimeSeriesData[]> = {
  'Alimentari': generateDates(30).map((date) => ({
    date,
    income: 0,
    expenses: Math.random() * 60 + 20,
    balance: 0,
  })),
  'Trasporti': generateDates(30).map((date) => ({
    date,
    income: 0,
    expenses: Math.random() * 40 + 15,
    balance: 0,
  })),
  'Ristoranti': generateDates(30).map((date) => ({
    date,
    income: 0,
    expenses: Math.random() * 35 + 10,
    balance: 0,
  })),
  'Bollette': generateDates(30).map((date) => ({
    date,
    income: 0,
    expenses: Math.random() * 30 + 10,
    balance: 0,
  })),
  'Shopping': generateDates(30).map((date) => ({
    date,
    income: 0,
    expenses: Math.random() * 25 + 8,
    balance: 0,
  })),
  'Intrattenimento': generateDates(30).map((date) => ({
    date,
    income: 0,
    expenses: Math.random() * 20 + 5,
    balance: 0,
  })),
  'Salute': generateDates(30).map((date) => ({
    date,
    income: 0,
    expenses: Math.random() * 15 + 5,
    balance: 0,
  })),
  'Altro': generateDates(30).map((date) => ({
    date,
    income: 0,
    expenses: Math.random() * 18 + 4,
    balance: 0,
  })),
};

const mockCategoryBreakdown: CategoryBreakdown[] = [
  { category: 'Alimentari', amount: 1234.56, percentage: 27, transactionCount: 42, color: '#3b82f6' },
  { category: 'Trasporti', amount: 876.23, percentage: 19, transactionCount: 28, color: '#10b981' },
  { category: 'Ristoranti', amount: 654.32, percentage: 14, transactionCount: 18, color: '#f59e0b' },
  { category: 'Bollette', amount: 543.21, percentage: 12, transactionCount: 8, color: '#ef4444' },
  { category: 'Shopping', amount: 432.10, percentage: 9, transactionCount: 15, color: '#8b5cf6' },
  { category: 'Intrattenimento', amount: 345.67, percentage: 8, transactionCount: 12, color: '#06b6d4' },
  { category: 'Salute', amount: 234.56, percentage: 5, transactionCount: 6, color: '#ec4899' },
  { category: 'Altro', amount: 247.24, percentage: 6, transactionCount: 13, color: '#64748b' },
];

const mockMerchantAnalysis: MerchantAnalysis[] = [
  {
    merchantName: 'Esselunga',
    totalAmount: 567.89,
    transactionCount: 15,
    averageAmount: 37.86,
    category: 'Alimentari',
    lastTransaction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    merchantName: 'Eni Station',
    totalAmount: 456.78,
    transactionCount: 8,
    averageAmount: 57.10,
    category: 'Trasporti',
    lastTransaction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    merchantName: 'Amazon',
    totalAmount: 345.67,
    transactionCount: 12,
    averageAmount: 28.81,
    category: 'Shopping',
    lastTransaction: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    merchantName: 'Ristorante Da Mario',
    totalAmount: 234.56,
    transactionCount: 6,
    averageAmount: 39.09,
    category: 'Ristoranti',
    lastTransaction: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockAnomalies: AnomalyDetection[] = [
  {
    id: '1',
    transactionId: 'txn_001',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 450.00,
    category: 'Shopping',
    merchantName: 'Electronics Store',
    description: 'Acquisto elettronica',
    anomalyType: 'unusually_high',
    severity: 'high',
    explanation: 'Questo importo è 3.5x superiore alla media delle tue spese in questa categoria.',
    expectedAmount: 128.57,
  },
  {
    id: '2',
    transactionId: 'txn_002',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 85.00,
    category: 'Intrattenimento',
    merchantName: 'Cinema',
    description: 'Biglietti cinema',
    anomalyType: 'unusual_time',
    severity: 'low',
    explanation: 'Non hai mai speso per intrattenimento in questo giorno della settimana.',
  },
  {
    id: '3',
    transactionId: 'txn_003',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 120.00,
    category: 'Alimentari',
    merchantName: 'Supermercato Premium',
    description: 'Spesa settimanale',
    anomalyType: 'unusual_merchant',
    severity: 'medium',
    explanation: 'È la prima volta che fai acquisti presso questo merchant.',
  },
];

const mockRecurringPatterns: RecurringPattern[] = [
  {
    id: '1',
    merchantName: 'Netflix',
    category: 'Abbonamenti',
    averageAmount: 15.99,
    frequency: 'monthly',
    nextExpectedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    confidence: 0.98,
    variance: 0,
    transactionCount: 12,
  },
  {
    id: '2',
    merchantName: 'Palestra XYZ',
    category: 'Salute',
    averageAmount: 45.00,
    frequency: 'monthly',
    nextExpectedDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    confidence: 0.95,
    variance: 2.5,
    transactionCount: 8,
  },
  {
    id: '3',
    merchantName: 'Esselunga',
    category: 'Alimentari',
    averageAmount: 85.50,
    frequency: 'weekly',
    nextExpectedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    confidence: 0.87,
    variance: 12.3,
    transactionCount: 52,
  },
];

const mockReports: FinancialReport[] = [
  {
    id: '1',
    title: 'Report Mensile - Novembre 2024',
    type: 'monthly',
    period: {
      from: '2024-11-01',
      to: '2024-11-30',
    },
    summary: {
      totalIncome: 5800.00,
      totalExpenses: 4567.89,
      netSavings: 1232.11,
      savingsRate: 21.2,
    },
    topCategories: mockCategoryBreakdown.slice(0, 5),
    insights: [
      'Hai risparmiato il 21.2% del tuo reddito questo mese, superiore alla media del 18%.',
      'Le spese per alimentari sono aumentate del 5% rispetto al mese scorso.',
      'Hai identificato 3 transazioni anomale che potrebbero richiedere attenzione.',
    ],
    generatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Report Trimestrale - Q4 2024',
    type: 'quarterly',
    period: {
      from: '2024-10-01',
      to: '2024-12-31',
    },
    summary: {
      totalIncome: 17400.00,
      totalExpenses: 13456.78,
      netSavings: 3943.22,
      savingsRate: 22.7,
    },
    topCategories: mockCategoryBreakdown.slice(0, 5),
    insights: [
      'Il tuo tasso di risparmio è aumentato del 4% rispetto al trimestre precedente.',
      'Le spese per trasporti sono diminuite del 12% grazie al telelavoro.',
    ],
    generatedAt: new Date().toISOString(),
  },
];

const mockSubcategoryBreakdown: SubcategoryBreakdown[] = [
  {
    category: 'Alimentari',
    subcategories: [
      { name: 'Supermercato', amount: 856.34, percentage: 69.4 },
      { name: 'Frutta e Verdura', amount: 234.56, percentage: 19.0 },
      { name: 'Pane e Pasticceria', amount: 143.66, percentage: 11.6 },
    ],
    total: 1234.56,
  },
  {
    category: 'Trasporti',
    subcategories: [
      { name: 'Carburante', amount: 456.78, percentage: 52.1 },
      { name: 'Mezzi Pubblici', amount: 289.45, percentage: 33.0 },
      { name: 'Taxi/Uber', amount: 130.00, percentage: 14.9 },
    ],
    total: 876.23,
  },
];

// Mock API functions with delays to simulate network
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAnalyticApi = {
  getOverview: async (filters?: AnalyticFilters): Promise<AnalyticOverview> => {
    await delay(500);
    return mockOverview;
  },

  getTimeSeriesData: async (filters?: AnalyticFilters): Promise<TimeSeriesData[]> => {
    await delay(600);
    // Filter by category if specified
    if (filters?.categories && filters.categories.length === 1) {
      const category = filters.categories[0];
      if (categoryTimeSeriesData[category]) {
        return categoryTimeSeriesData[category];
      }
    }
    return mockTimeSeriesData;
  },

  getCategoryBreakdown: async (filters?: AnalyticFilters): Promise<CategoryBreakdown[]> => {
    await delay(500);
    return mockCategoryBreakdown;
  },

  getSubcategoryBreakdown: async (
    category: string,
    filters?: AnalyticFilters
  ): Promise<SubcategoryBreakdown> => {
    await delay(500);
    const found = mockSubcategoryBreakdown.find((s) => s.category === category);
    return found || mockSubcategoryBreakdown[0];
  },

  getMerchantAnalysis: async (filters?: AnalyticFilters): Promise<MerchantAnalysis[]> => {
    await delay(550);
    return mockMerchantAnalysis;
  },

  getAnomalies: async (filters?: AnalyticFilters): Promise<AnomalyDetection[]> => {
    await delay(700);
    return mockAnomalies;
  },

  getRecurringPatterns: async (filters?: AnalyticFilters): Promise<RecurringPattern[]> => {
    await delay(650);
    return mockRecurringPatterns;
  },

  getReports: async (filters?: AnalyticFilters): Promise<FinancialReport[]> => {
    await delay(600);
    return mockReports;
  },

  getReportById: async (id: string): Promise<FinancialReport> => {
    await delay(400);
    const report = mockReports.find((r) => r.id === id);
    if (!report) throw new Error('Report not found');
    return report;
  },
};
