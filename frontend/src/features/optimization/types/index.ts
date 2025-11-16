// Optimization Types

export type SuggestionCategory = 'savings' | 'subscriptions' | 'alternatives' | 'timing' | 'cashflow';
export type SuggestionPriority = 'low' | 'medium' | 'high' | 'critical';
export type WasteType = 'unused_subscription' | 'duplicate_service' | 'high_cost_low_usage' | 'better_alternative';

export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  category: SuggestionCategory;
  priority: SuggestionPriority;
  potentialSavings: number;
  monthlySavings: number;
  confidence: number; // 0-1
  aiExplanation: string;
  actionSteps: string[];
  relatedTransactions?: string[];
  status: 'active' | 'implemented' | 'dismissed';
  createdAt: string;
  implementedAt?: string;
}

export interface WasteDetection {
  id: string;
  type: WasteType;
  merchantName: string;
  category: string;
  subscriptionAmount: number;
  frequency: 'monthly' | 'yearly' | 'quarterly';
  lastUsage?: string;
  usageCount: number;
  usageFrequency: 'never' | 'rarely' | 'occasionally' | 'frequently';
  costPerUse: number;
  monthlyCost: number;
  detectedAt: string;
  recommendation: string;
  potentialSaving: number;
}

export interface DuplicateService {
  id: string;
  services: {
    merchantName: string;
    amount: number;
    frequency: string;
  }[];
  category: string;
  totalMonthlyCost: number;
  recommendation: string;
  potentialSaving: number;
}

export interface SavingsStrategy {
  id: string;
  title: string;
  description: string;
  targetCategory?: string;
  targetAmount: number;
  timeframe: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'low' | 'medium' | 'high';
  steps: {
    order: number;
    description: string;
    completed: boolean;
  }[];
  projectedSavings: {
    monthly: number;
    yearly: number;
  };
  actualSavings?: number;
  startDate?: string;
  status: 'suggested' | 'active' | 'completed' | 'abandoned';
}

export interface OptimizationImpact {
  suggestionId: string;
  implementedAt: string;
  expectedSavings: number;
  actualSavings: number;
  accuracy: number; // percentage
  verified: boolean;
  notes?: string;
}

export interface OptimizationOverview {
  totalPotentialSavings: number;
  monthlySavingsOpportunity: number;
  activeSuggestions: number;
  implementedSuggestions: number;
  totalSavedToDate: number;
  topCategory: string;
  averageAccuracy: number;
  wasteDetected: {
    unusedSubscriptions: number;
    duplicateServices: number;
    totalWastedAmount: number;
  };
}

export interface AlternativeRecommendation {
  id: string;
  currentMerchant: string;
  currentAmount: number;
  suggestedMerchant: string;
  suggestedAmount: number;
  category: string;
  monthlySavings: number;
  yearlyProjection: number;
  qualityScore: number; // 0-100
  reason: string;
  pros: string[];
  cons: string[];
}

export interface CashFlowOptimization {
  id: string;
  title: string;
  description: string;
  currentPattern: {
    problematicPeriod: string;
    avgBalance: number;
    minBalance: number;
  };
  suggestedPattern: {
    recommendations: string[];
    expectedMinBalance: number;
    improvement: number; // percentage
  };
  implementation: {
    steps: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  };
}
