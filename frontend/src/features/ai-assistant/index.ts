/**
 * AI Assistant Feature
 *
 * Public API for AI Assistant functionality.
 * This module provides chat, classification, and optimization features.
 */

// Pages
export { AIAssistantPage } from './pages/AIAssistantPage';

// Components
export { ChatInput } from './components/ChatInput';
export { ChatMessage } from './components/ChatMessage';
export { ExpenseClassifier } from './components/ExpenseClassifier';
export { ClassificationCard } from './components/ClassificationCard';

// Hooks
export {
  // Query keys
  aiAssistantKeys,
  // AI Service Status
  useAIStatus,
  // Chat & Conversations
  useConversations,
  useConversation,
  useSendChatMessage,
  useDeleteConversation,
  useChat,
  // Transaction Classification
  useClassifyTransaction,
  useTrainClassificationModel,
  useClassificationMetrics,
  useSuggestTags,
  // Optimization & Insights
  useOptimizationInsights,
  useSpendingPatterns,
  useSavingsSummary,
  // UI-Only Hooks
  useQuickQueries,
  useCapabilities,
  // Batch Classification
  useClassifyTransactions,
  useConfirmClassification,
  useRejectClassification,
} from './ai-assistant.hooks';

// Constants
export {
  QUICK_QUERIES,
  CAPABILITIES_LIST,
  CLASSIFICATION_CATEGORY_MAPPING,
} from './ai-assistant.constants';

// Schemas
export {
  // Backend API Schemas
  classificationRequestSchema,
  classificationResultSchema,
  chatMessageRequestSchema,
  chatMessageResponseSchema,
  optimizationInsightsRequestSchema,
  // Frontend UI Schemas
  messageRoleSchema,
  messageTypeSchema,
  actionTypeSchema,
  assistantActionSchema,
  aiInsightSchema,
  chatMessageSchema,
  chatMessageMetadataSchema,
  quickQuerySchema,
  quickQueryCategorySchema,
  assistantCapabilitySchema,
  aiServiceStatusSchema,
  // Transaction Classification Schemas
  transactionToClassifySchema,
  classificationSchema,
  alternativeCategorySchema,
  classificationResultUISchema,
  classificationBatchSchema,
  explanationRequestSchema,
  explanationTypeSchema,
  assistantResponseSchema,
  chartDataSchema,
  chartDataItemSchema,
} from './ai-assistant.schemas';

// Types
export type {
  // Backend API Types
  ClassificationRequest,
  ClassificationResult,
  ChatMessageRequest,
  ChatMessageResponse,
  OptimizationInsightsRequest,
  // Frontend UI Types
  MessageRole,
  MessageType,
  ActionType,
  AssistantAction,
  AIInsight,
  ChatMessage as ChatMessageType,
  ChatMessageMetadata,
  QuickQuery,
  QuickQueryCategory,
  AssistantCapability,
  AIServiceStatus,
  ChartData,
  ChartDataItem,
  // Transaction Classification Types
  TransactionToClassify,
  Classification,
  AlternativeCategory,
  ClassificationResultUI,
  ClassificationBatch,
  // Explanation Types
  ExplanationType,
  ExplanationRequest,
  AssistantResponse,
  // Re-exported Backend Types
  ClassificationMetrics,
  ConversationDetail,
  ConversationListItem,
  OptimizationResponse,
  SpendingPatternSchema,
  SavingsSummary,
  SuggestedTag,
} from './ai-assistant.types';
