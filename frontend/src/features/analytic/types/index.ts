// Analytic Types

export interface SpendingTrend {
  date: string;
  amount: number;
  category?: string;
}

export interface CategoryBreakdown {
  category: string;
  subcategory?: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  color?: string;
}

export interface MerchantAnalysis {
  merchantName: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  category: string;
  lastTransaction: string;
}

export interface AnomalyDetection {
  id: string;
  transactionId: string;
  date: string;
  amount: number;
  category: string;
  merchantName: string;
  description: string;
  anomalyType: 'unusually_high' | 'unusual_category' | 'unusual_merchant' | 'unusual_time';
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  expectedAmount?: number;
}

export interface RecurringPattern {
  id: string;
  merchantName: string;
  category: string;
  averageAmount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  nextExpectedDate: string;
  confidence: number; // 0-1
  variance: number; // percentage
  transactionCount: number;
}

export interface FinancialReport {
  id: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number; // percentage
  };
  topCategories: CategoryBreakdown[];
  insights: string[];
  generatedAt: string;
  downloadUrl?: string;
}

export interface AnalyticFilters {
  profileId?: string;
  dateFrom?: string;
  dateTo?: string;
  categories?: string[];
  tags?: string[];
  minAmount?: number;
  maxAmount?: number;
}

export interface AnalyticOverview {
  period: {
    from: string;
    to: string;
  };
  totalSpent: number;
  totalIncome: number;
  netBalance: number;
  transactionCount: number;
  topCategory: string;
  averageDaily: number;
  comparisonToPrevious: {
    spent: number; // percentage change
    income: number;
    balance: number;
  };
}

export interface TimeSeriesData {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface SubcategoryBreakdown {
  category: string;
  subcategories: {
    name: string;
    amount: number;
    percentage: number;
  }[];
  total: number;
}
