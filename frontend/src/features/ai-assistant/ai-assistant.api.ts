/**
 * API wrapper functions for AI Assistant endpoints
 */
import {
  classifyTransactionApiV1AiAiClassifyTransactionPost,
  trainClassificationModelApiV1AiAiClassifyTrainPost,
  getClassificationMetricsApiV1AiAiClassifyMetricsFinancialProfileIdGet,
  suggestTagsApiV1AiAiClassifySuggestTagsTransactionIdGet,
  sendChatMessageApiV1AiAiChatMessagePost,
  listConversationsApiV1AiAiChatConversationsGet,
  getConversationApiV1AiAiChatConversationsConversationIdGet,
  deleteConversationApiV1AiAiChatConversationsConversationIdDelete,
  getOptimizationInsightsApiV1AiAiOptimizeInsightsPost,
  getSpendingPatternsApiV1AiAiOptimizePatternsFinancialProfileIdGet,
  getSavingsSummaryApiV1AiAiOptimizeSavingsSummaryFinancialProfileIdGet,
  getAiStatusApiV1AiAiStatusGet,
} from '@/api/generated/ai-services/ai-services';

import type {
  ClassificationRequest,
  ClassificationResult,
  ChatMessageRequest,
  ChatMessageResponse,
  OptimizationInsightsRequest,
} from './ai-assistant.types';

export const classifyTransaction = async (request: ClassificationRequest): Promise<ClassificationResult> => {
  const response = await classifyTransactionApiV1AiAiClassifyTransactionPost({ data: request });
  return response.data;
};

export const sendChatMessage = async (request: ChatMessageRequest): Promise<ChatMessageResponse> => {
  const response = await sendChatMessageApiV1AiAiChatMessagePost({ data: request });
  return response.data;
};

export const getOptimizationInsights = async (request: OptimizationInsightsRequest) => {
  const response = await getOptimizationInsightsApiV1AiAiOptimizeInsightsPost({ data: request });
  return response.data;
};

export const getAIStatus = async () => {
  const response = await getAiStatusApiV1AiAiStatusGet();
  return response.data;
};

export const getConversations = async (filters?: { financial_profile_id?: string; skip?: number; limit?: number }) => {
  const response = await listConversationsApiV1AiAiChatConversationsGet(filters);
  return response.data;
};

export const getConversation = async (conversationId: string) => {
  const response = await getConversationApiV1AiAiChatConversationsConversationIdGet(conversationId);
  return response.data;
};

export const deleteConversation = async (conversationId: string) => {
  await deleteConversationApiV1AiAiChatConversationsConversationIdDelete({ conversationId });
};
