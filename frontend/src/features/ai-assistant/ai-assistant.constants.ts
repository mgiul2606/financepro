/**
 * AI Assistant Constants
 *
 * Static data for quick queries and capabilities.
 * These are currently client-side only but can be moved to backend API in the future.
 */
import type { QuickQuery, AssistantCapability } from './ai-assistant.types';

/**
 * Quick query suggestions for the chat interface.
 * TODO: Consider moving to backend API for dynamic content based on user context.
 */
export const QUICK_QUERIES: QuickQuery[] = [
  {
    id: 'monthly_spending',
    label: 'How much did I spend this month?',
    query: 'monthly_spending',
    icon: 'TrendingDown',
    category: 'spending',
  },
  {
    id: 'budget_status',
    label: 'Show my budget status',
    query: 'budget_status',
    icon: 'PieChart',
    category: 'budget',
  },
  {
    id: 'top_expenses',
    label: 'What are my top expenses?',
    query: 'top_expenses',
    icon: 'BarChart',
    category: 'insights',
  },
  {
    id: 'predict_spending',
    label: 'Predict next month spending',
    query: 'predict_spending',
    icon: 'TrendingUp',
    category: 'predictions',
  },
] as const;

/**
 * AI Assistant capabilities displayed in the welcome screen.
 * TODO: Consider moving to backend API for dynamic capabilities based on model version.
 */
export const CAPABILITIES_LIST: AssistantCapability[] = [
  {
    id: 'classification',
    title: 'Transaction Classification',
    description: 'Automatically categorize your transactions using AI',
    examples: ['Classify this transaction', 'What category is this expense?'],
    icon: 'Tag',
  },
  {
    id: 'insights',
    title: 'Budget Insights',
    description: 'Get personalized insights about your spending habits',
    examples: ['How am I doing this month?', 'Where can I save money?'],
    icon: 'Lightbulb',
  },
  {
    id: 'forecasting',
    title: 'Financial Forecasting',
    description: 'Predict future expenses and plan accordingly',
    examples: ['Predict my spending', 'Will I meet my savings goal?'],
    icon: 'TrendingUp',
  },
] as const;

/**
 * Mock category mapping for batch classification.
 * TODO: Replace with actual AI classification API when available.
 */
export const CLASSIFICATION_CATEGORY_MAPPING: Record<
  string,
  { category: string; subcategory?: string }
> = {
  esselunga: { category: 'Alimentari', subcategory: 'Supermercato' },
  coop: { category: 'Alimentari', subcategory: 'Supermercato' },
  carrefour: { category: 'Alimentari', subcategory: 'Supermercato' },
  lidl: { category: 'Alimentari', subcategory: 'Supermercato' },
  netflix: { category: 'Intrattenimento', subcategory: 'Streaming' },
  spotify: { category: 'Intrattenimento', subcategory: 'Streaming' },
  disney: { category: 'Intrattenimento', subcategory: 'Streaming' },
  amazon: { category: 'Shopping', subcategory: 'E-commerce' },
  zalando: { category: 'Shopping', subcategory: 'E-commerce' },
  ristorante: { category: 'Alimentari', subcategory: 'Ristoranti' },
  pizzeria: { category: 'Alimentari', subcategory: 'Ristoranti' },
  bar: { category: 'Alimentari', subcategory: 'Bar e Caffè' },
  enel: { category: 'Utenze', subcategory: 'Elettricità' },
  eni: { category: 'Utenze', subcategory: 'Gas' },
  telecom: { category: 'Utenze', subcategory: 'Telefonia' },
  vodafone: { category: 'Utenze', subcategory: 'Telefonia' },
  tim: { category: 'Utenze', subcategory: 'Telefonia' },
  wind: { category: 'Utenze', subcategory: 'Telefonia' },
  trenitalia: { category: 'Trasporti', subcategory: 'Treno' },
  italo: { category: 'Trasporti', subcategory: 'Treno' },
  atm: { category: 'Trasporti', subcategory: 'Mezzi Pubblici' },
  benzina: { category: 'Trasporti', subcategory: 'Carburante' },
  q8: { category: 'Trasporti', subcategory: 'Carburante' },
  ip: { category: 'Trasporti', subcategory: 'Carburante' },
} as const;

/**
 * Default confidence range for mock classifications.
 */
export const MOCK_CONFIDENCE_RANGE = {
  min: 0.7,
  max: 0.95,
} as const;

/**
 * Simulated API delay for mock operations (in milliseconds).
 */
export const MOCK_API_DELAY_MS = 1500;
