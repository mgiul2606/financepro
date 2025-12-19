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
  quickQuerySchema,
  assistantCapabilitySchema,
  aiServiceStatusSchema,
} from './ai-assistant.schemas';

/**
 * Type definitions for AI Assistant
 */

// Backend API Types
export type ClassificationRequest = z.infer<typeof classificationRequestSchema>;
export type ClassificationResult = z.infer<typeof classificationResultSchema>;
export type ChatMessageRequest = z.infer<typeof chatMessageRequestSchema>;
export type ChatMessageResponse = z.infer<typeof chatMessageResponseSchema>;
export type OptimizationInsightsRequest = z.infer<typeof optimizationInsightsRequestSchema>;

// Frontend UI Types
export type MessageRole = z.infer<typeof messageRoleSchema>;
export type MessageType = z.infer<typeof messageTypeSchema>;
export type ActionType = z.infer<typeof actionTypeSchema>;
export type AssistantAction = z.infer<typeof assistantActionSchema>;
export type AIInsight = z.infer<typeof aiInsightSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type QuickQuery = z.infer<typeof quickQuerySchema>;
export type AssistantCapability = z.infer<typeof assistantCapabilitySchema>;
export type AIServiceStatus = z.infer<typeof aiServiceStatusSchema>;

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

// Additional UI-specific types
export interface TransactionToClassify {
  id: string;
  amount: number;
  description: string;
  merchant?: string;
  date: string;
  accountId: string;
}

export interface Classification {
  category: string;
  subcategory?: string;
  confidence: number;
  tags?: string[];
  explanation?: string;
  confirmedByUser?: boolean;
}

export interface AlternativeCategory {
  category: string;
  subcategory?: string;
  confidence: number;
}

export interface ClassificationBatch {
  results: Array<{
    transactionId: string;
    classification: Classification;
    alternativeCategories?: AlternativeCategory[];
  }>;
  averageConfidence: number;
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
