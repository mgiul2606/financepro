/**
 * AI Assistant Type Definitions
 *
 * All types are derived from Zod schemas for runtime validation consistency.
 * This file serves as the single source of truth for AI Assistant types.
 */
import { z } from 'zod';
import {
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
  chatMessageMetadataSchema,
  quickQuerySchema,
  quickQueryCategorySchema,
  assistantCapabilitySchema,
  aiServiceStatusSchema,
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

// Backend API Types (derived from schemas)
export type ClassificationRequest = z.infer<typeof classificationRequestSchema>;
export type ClassificationResult = z.infer<typeof classificationResultSchema>;
export type ChatMessageRequest = z.infer<typeof chatMessageRequestSchema>;
export type ChatMessageResponse = z.infer<typeof chatMessageResponseSchema>;
export type OptimizationInsightsRequest = z.infer<typeof optimizationInsightsRequestSchema>;

// Frontend UI Types (derived from schemas)
export type MessageRole = z.infer<typeof messageRoleSchema>;
export type MessageType = z.infer<typeof messageTypeSchema>;
export type ActionType = z.infer<typeof actionTypeSchema>;
export type AssistantAction = z.infer<typeof assistantActionSchema>;
export type AIInsight = z.infer<typeof aiInsightSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatMessageMetadata = z.infer<typeof chatMessageMetadataSchema>;
export type QuickQuery = z.infer<typeof quickQuerySchema>;
export type QuickQueryCategory = z.infer<typeof quickQueryCategorySchema>;
export type AssistantCapability = z.infer<typeof assistantCapabilitySchema>;
export type AIServiceStatus = z.infer<typeof aiServiceStatusSchema>;
export type ChartData = z.infer<typeof chartDataSchema>;
export type ChartDataItem = z.infer<typeof chartDataItemSchema>;

// Transaction Classification Types (derived from schemas)
export type TransactionToClassify = z.infer<typeof transactionToClassifySchema>;
export type Classification = z.infer<typeof classificationSchema>;
export type AlternativeCategory = z.infer<typeof alternativeCategorySchema>;
export type ClassificationResultUI = z.infer<typeof classificationResultUISchema>;
export type ClassificationBatch = z.infer<typeof classificationBatchSchema>;

// Explanation Types (derived from schemas)
export type ExplanationType = z.infer<typeof explanationTypeSchema>;
export type ExplanationRequest = z.infer<typeof explanationRequestSchema>;
export type AssistantResponse = z.infer<typeof assistantResponseSchema>;

// Re-export types from backend API for convenience
export type {
  ClassificationMetricsResponse,
  ConversationResponse,
  ConversationListResponse,
  OptimizationInsightsResponse,
  SpendingPattern,
  SavingsSummaryResponse,
  TagSuggestions,
} from '@/api/generated/models';
