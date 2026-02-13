/**
 * AI Assistant React Query Hooks
 *
 * Consolidated hooks for AI Assistant operations.
 * Combines Orval-generated API hooks with custom UI logic.
 */
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useClassifyTransactionApiV1AiAiClassifyTransactionPost,
  useTrainClassificationModelApiV1AiAiClassifyTrainPost,
  useGetClassificationMetricsApiV1AiAiClassifyMetricsFinancialProfileIdGet,
  useSuggestTagsApiV1AiAiClassifySuggestTagsTransactionIdGet,
  useSendChatMessageApiV1AiAiChatMessagePost,
  useListConversationsApiV1AiAiChatConversationsGet,
  useGetConversationApiV1AiAiChatConversationsConversationIdGet,
  useDeleteConversationApiV1AiAiChatConversationsConversationIdDelete,
  useGetOptimizationInsightsApiV1AiAiOptimizeInsightsPost,
  useGetSpendingPatternsApiV1AiAiOptimizePatternsFinancialProfileIdGet,
  useGetSavingsSummaryApiV1AiAiOptimizeSavingsSummaryFinancialProfileIdGet,
  useGetAiStatusApiV1AiAiStatusGet,
  getListConversationsApiV1AiAiChatConversationsGetQueryKey,
} from '@/api/generated/ai-services/ai-services';
import type {
  ClassificationRequest,
  ChatMessageRequest,
  OptimizationInsightsRequest,
  ChatMessage,
  QuickQuery,
  AssistantCapability,
  TransactionToClassify,
  ClassificationBatch,
  ClassificationResultUI,
} from './ai-assistant.types';
import {
  QUICK_QUERIES,
  CAPABILITIES_LIST,
  CLASSIFICATION_CATEGORY_MAPPING,
  MOCK_CONFIDENCE_RANGE,
  MOCK_API_DELAY_MS,
} from './ai-assistant.constants';

// ============================================================================
// Query Keys
// ============================================================================

export const aiAssistantKeys = {
  all: ['ai-assistant'] as const,
  status: () => [...aiAssistantKeys.all, 'status'] as const,
  conversations: () => [...aiAssistantKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...aiAssistantKeys.all, 'conversation', id] as const,
  quickQueries: () => [...aiAssistantKeys.all, 'quick-queries'] as const,
  capabilities: () => [...aiAssistantKeys.all, 'capabilities'] as const,
  classification: () => [...aiAssistantKeys.all, 'classification'] as const,
  metrics: (profileId: string) => [...aiAssistantKeys.all, 'metrics', profileId] as const,
  patterns: (profileId: string) => [...aiAssistantKeys.all, 'patterns', profileId] as const,
  savings: (profileId: string) => [...aiAssistantKeys.all, 'savings', profileId] as const,
};

// ============================================================================
// AI Service Status
// ============================================================================

/**
 * Hook to get AI service status
 */
export const useAIStatus = () => {
  const query = useGetAiStatusApiV1AiAiStatusGet();

  return {
    status: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// Chat & Conversations
// ============================================================================

/**
 * Hook to list all conversations
 */
export const useConversations = () => {
  const query = useListConversationsApiV1AiAiChatConversationsGet();

  return {
    conversations: query.data?.data || [],
    total: query.data?.data?.length || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get a single conversation
 */
export const useConversation = (conversationId: string) => {
  const query = useGetConversationApiV1AiAiChatConversationsConversationIdGet(
    conversationId,
    {
      query: {
        enabled: !!conversationId,
      },
    }
  );

  return {
    conversation: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to send a chat message
 */
export const useSendChatMessage = () => {
  const queryClient = useQueryClient();

  const mutation = useSendChatMessageApiV1AiAiChatMessagePost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListConversationsApiV1AiAiChatConversationsGetQueryKey(),
        });
      },
    },
  });

  return {
    sendMessage: (data: ChatMessageRequest) => mutation.mutateAsync({ data }),
    isSending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to delete a conversation
 */
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  const mutation = useDeleteConversationApiV1AiAiChatConversationsConversationIdDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListConversationsApiV1AiAiChatConversationsGetQueryKey(),
        });
      },
    },
  });

  return {
    deleteConversation: (conversationId: string) =>
      mutation.mutateAsync({ conversationId }),
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Custom hook for managing chat state (UI wrapper)
 */
export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const { sendMessage, isSending } = useSendChatMessage();

  const handleSendMessage = useCallback(
    async (content: string, conversationId?: string) => {
      if (!content.trim()) return;

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        type: 'text',
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        const response = await sendMessage({
          message: content,
          conversationId,
        });

        const responseData = response.data;
        if (!('content' in responseData)) {
          throw new Error('Unexpected response format');
        }

        // Convert backend response to frontend message format
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          type: 'text',
          content: responseData.content,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        // Add error message
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          type: 'text',
          content: 'Mi dispiace, si è verificato un errore. Riprova.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [sendMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    handleSendMessage,
    clearMessages,
    isLoading: isSending,
  };
};

// ============================================================================
// Transaction Classification
// ============================================================================

/**
 * Hook to classify a single transaction
 */
export const useClassifyTransaction = () => {
  const queryClient = useQueryClient();

  const mutation = useClassifyTransactionApiV1AiAiClassifyTransactionPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: aiAssistantKeys.all });
      },
    },
  });

  return {
    classifyTransaction: (data: ClassificationRequest) =>
      mutation.mutateAsync({ data }),
    isClassifying: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to train classification model
 */
export const useTrainClassificationModel = () => {
  const queryClient = useQueryClient();

  const mutation = useTrainClassificationModelApiV1AiAiClassifyTrainPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: aiAssistantKeys.all });
      },
    },
  });

  return {
    trainModel: (data: { financialProfileId: string }) =>
      mutation.mutateAsync({ data }),
    isTraining: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to get classification metrics
 */
export const useClassificationMetrics = (financialProfileId: string) => {
  const query = useGetClassificationMetricsApiV1AiAiClassifyMetricsFinancialProfileIdGet(
    financialProfileId,
    {
      query: {
        enabled: !!financialProfileId,
      },
    }
  );

  return {
    metrics: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to suggest tags for a transaction
 */
export const useSuggestTags = (transactionId: string) => {
  const query = useSuggestTagsApiV1AiAiClassifySuggestTagsTransactionIdGet(
    transactionId,
    {
      query: {
        enabled: !!transactionId,
      },
    }
  );

  return {
    tags: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// Optimization & Insights
// ============================================================================

/**
 * Hook to get optimization insights
 */
export const useOptimizationInsights = () => {
  const mutation = useGetOptimizationInsightsApiV1AiAiOptimizeInsightsPost();

  return {
    getInsights: (data: OptimizationInsightsRequest) =>
      mutation.mutateAsync({ data }),
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook to get spending patterns
 */
export const useSpendingPatterns = (
  financialProfileId: string,
  params?: {
    lookback_days?: number;
  }
) => {
  const query = useGetSpendingPatternsApiV1AiAiOptimizePatternsFinancialProfileIdGet(
    financialProfileId,
    params
  );

  return {
    patterns: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get savings summary
 */
export const useSavingsSummary = (
  financialProfileId: string
) => {
  const query = useGetSavingsSummaryApiV1AiAiOptimizeSavingsSummaryFinancialProfileIdGet(
    financialProfileId
  );

  return {
    summary: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============================================================================
// UI-Only Hooks (Static Data)
// ============================================================================

/**
 * Hook to get quick query suggestions
 * Returns static data from constants. Consider moving to backend for dynamic content.
 */
export const useQuickQueries = (): {
  data: QuickQuery[];
  isLoading: boolean;
  error: Error | null;
} => {
  return {
    data: QUICK_QUERIES,
    isLoading: false,
    error: null,
  };
};

/**
 * Hook to get assistant capabilities
 * Returns static data from constants. Consider moving to backend for dynamic content.
 */
export const useCapabilities = (): {
  data: AssistantCapability[];
  isLoading: boolean;
  error: Error | null;
} => {
  return {
    data: CAPABILITIES_LIST,
    isLoading: false,
    error: null,
  };
};

// ============================================================================
// Batch Classification Hooks (Mock Implementation)
// ============================================================================

/**
 * Hook to classify multiple transactions at once
 * TODO: Replace mock implementation with actual API call when backend endpoint is available.
 */
export const useClassifyTransactions = () => {
  const classifyBatch = useCallback(
    async (transactions: TransactionToClassify[]): Promise<ClassificationBatch> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, MOCK_API_DELAY_MS));

      const results: ClassificationResultUI[] = transactions.map((tx) => {
        const descLower = tx.description.toLowerCase();
        let category = 'Altro';
        let subcategory: string | undefined;

        // Match against known categories
        for (const [keyword, cat] of Object.entries(CLASSIFICATION_CATEGORY_MAPPING)) {
          if (descLower.includes(keyword)) {
            category = cat.category;
            subcategory = cat.subcategory;
            break;
          }
        }

        const confidence =
          MOCK_CONFIDENCE_RANGE.min +
          Math.random() * (MOCK_CONFIDENCE_RANGE.max - MOCK_CONFIDENCE_RANGE.min);

        return {
          transactionId: tx.id,
          originalDescription: tx.description,
          classification: {
            category,
            subcategory,
            confidence,
            tags: [category.toLowerCase()],
            explanation: `Classificato come ${category} basandosi sulla descrizione "${tx.description}"`,
            confirmedByUser: false,
          },
          alternativeCategories: [
            {
              category: 'Altro',
              confidence: 0.1 + Math.random() * 0.2,
            },
          ],
        };
      });

      const averageConfidence =
        results.reduce((sum, r) => sum + r.classification.confidence, 0) / results.length;

      return {
        results,
        averageConfidence,
      };
    },
    []
  );

  return {
    mutateAsync: classifyBatch,
    isPending: false,
  };
};

/**
 * Hook to confirm a classification
 * TODO: Replace mock implementation with actual API call when backend endpoint is available.
 */
export const useConfirmClassification = () => {
  const queryClient = useQueryClient();

  const confirmClassification = useCallback(
    async (data: { transactionId: string; categoryId: string }) => {
      // TODO: Call backend API
      console.log('Classification confirmed:', data);

      queryClient.invalidateQueries({ queryKey: aiAssistantKeys.all });

      return { success: true };
    },
    [queryClient]
  );

  return {
    mutate: (data: { transactionId: string; categoryId: string }) => {
      confirmClassification(data);
    },
    mutateAsync: confirmClassification,
    isPending: false,
  };
};

/**
 * Hook to reject a classification
 * TODO: Replace mock implementation with actual API call when backend endpoint is available.
 */
export const useRejectClassification = () => {
  const queryClient = useQueryClient();

  const rejectClassification = useCallback(
    async (transactionId: string) => {
      // TODO: Call backend API
      console.log('Classification rejected:', transactionId);

      queryClient.invalidateQueries({ queryKey: aiAssistantKeys.all });

      return { success: true };
    },
    [queryClient]
  );

  return {
    mutate: (transactionId: string) => {
      rejectClassification(transactionId);
    },
    mutateAsync: rejectClassification,
    isPending: false,
  };
};
