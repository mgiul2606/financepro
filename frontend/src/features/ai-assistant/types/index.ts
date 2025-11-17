// AI Assistant Types

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'text' | 'chart' | 'table' | 'action' | 'insight';
export type ActionType = 'create_budget' | 'create_goal' | 'categorize_transaction' | 'generate_report' | 'optimize_spending';

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

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
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

// ========== Expense Classification Types ==========

export interface ExpenseClassification {
  id: string;
  transactionId: string;
  category: string;
  subcategory?: string;
  tags: string[];
  confidence: number; // 0-1
  explanation: string;
  suggestedBy: 'ai' | 'manual' | 'rule';
  confirmedByUser: boolean;
  createdAt: string;
}

export interface TransactionToClassify {
  id: string;
  amount: number;
  description: string;
  merchant?: string;
  date: string;
  accountId: number;
  currentCategory?: string;
  notes?: string;
}

export interface ClassificationRequest {
  transactions: TransactionToClassify[];
  autoConfirm?: boolean;
  includeExplanation?: boolean;
}

export interface ClassificationResult {
  transactionId: string;
  originalDescription: string;
  classification: ExpenseClassification;
  alternativeCategories?: Array<{
    category: string;
    subcategory?: string;
    confidence: number;
  }>;
}

export interface ClassificationBatch {
  id: string;
  results: ClassificationResult[];
  totalProcessed: number;
  averageConfidence: number;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface CategorySuggestion {
  category: string;
  subcategory?: string;
  confidence: number;
  reason: string;
}
