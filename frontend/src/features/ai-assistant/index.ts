// features/ai-assistant/index.ts
export { AIAssistantPage } from './pages/AIAssistantPage';

// Components
export { ChatInput } from './components/ChatInput';
export { ChatMessage } from './components/ChatMessage';
export { ExpenseClassifier } from './components/ExpenseClassifier';
export { ClassificationCard } from './components/ClassificationCard';

// Hooks
export {
  useAIStatus,
  useConversations,
  useConversation,
  useClassifyTransaction,
  useSendChatMessage,
  useDeleteConversation,
  useOptimizationInsights,
  aiAssistantKeys,
} from './ai-assistant.hooks';

// API
export {
  classifyTransaction,
  sendChatMessage,
  getOptimizationInsights,
  getAIStatus,
  getConversations,
  getConversation,
  deleteConversation,
} from './ai-assistant.api';

// Schemas
export {
  classificationRequestSchema,
  classificationResultSchema,
  chatMessageRequestSchema,
  chatMessageResponseSchema,
  optimizationInsightsRequestSchema,
  messageRoleSchema,
  messageTypeSchema,
  actionTypeSchema,
  assistantActionSchema,
  aiInsightSchema,
  chatMessageSchema,
  quickQuerySchema,
  assistantCapabilitySchema,
  aiServiceStatusSchema,
} from './ai-assistant.schemas';

// Types
export type {
  ClassificationRequest,
  ClassificationResult,
  ChatMessageRequest,
  ChatMessageResponse,
  OptimizationInsightsRequest,
  MessageRole,
  MessageType,
  ActionType,
  AssistantAction,
  AIInsight,
  ChatMessage,
  QuickQuery,
  AssistantCapability,
  AIServiceStatus,
  TransactionToClassify,
  Classification,
  AlternativeCategory,
  ClassificationBatch,
  ExplanationRequest,
  AssistantResponse,
  // Re-exported backend types
  ClassificationMetricsResponse,
  ConversationResponse,
  ConversationListResponse,
  OptimizationInsightsResponse,
  SpendingPattern,
  SavingsSummaryResponse,
  TagSuggestions,
} from './ai-assistant.types';
