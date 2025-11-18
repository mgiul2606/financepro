/**
 * AI Assistant Types
 * Mix of backend-generated types and frontend-only UI types
 */

// Re-export backend-generated types for AI services
export type {
  ClassificationRequest,
  ClassificationResult,
  ClassificationMetricsResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  ConversationResponse,
  ConversationListResponse,
  OptimizationInsightsRequest,
  OptimizationInsightsResponse,
  SpendingPattern,
  SavingsSummaryResponse,
  AIServiceStatus,
  TagSuggestions,
} from '@/api/generated/models';

// Frontend-only UI types (not in backend API)

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'text' | 'chart' | 'table' | 'action' | 'insight';
export type ActionType =
  | 'create_budget'
  | 'create_goal'
  | 'categorize_transaction'
  | 'generate_report'
  | 'optimize_spending';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  timestamp: string;
  metadata?: {
    chartData?: any;
    tableData?: any;
    actionData?: AssistantAction;
    insightData?: AIInsight;
  };
}

export interface AssistantAction {
  type: ActionType;
  title: string;
  description: string;
  parameters?: Record<string, any>;
  suggestedValues?: Record<string, any>;
  onExecute?: () => void;
}

export interface AIInsight {
  title: string;
  description: string;
  confidence: number;
  category: string;
  relatedData?: any[];
}

export interface QuickQuery {
  id: string;
  label: string;
  query: string;
  icon: string;
  category: 'spending' | 'income' | 'budget' | 'insights' | 'predictions';
}

export interface AssistantCapability {
  id: string;
  title: string;
  description: string;
  examples: string[];
  icon: string;
}

export interface ExplanationRequest {
  transactionId?: string;
  category?: string;
  anomalyId?: string;
  type: 'classification' | 'anomaly' | 'prediction' | 'suggestion';
}

export interface AssistantResponse {
  message: string;
  type: MessageType;
  suggestions?: string[];
  actions?: AssistantAction[];
  data?: any;
}
