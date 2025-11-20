/**
 * React Query hooks for AI Assistant operations
 * Wraps the generated orval hooks for better usability
 */
import { useState } from 'react';
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
  ClassificationResult,
} from '../types';

// Query keys
export const aiAssistantKeys = {
  all: ['ai-assistant'] as const,
  quickQueries: () => [...aiAssistantKeys.all, 'quick-queries'] as const,
  capabilities: () => [...aiAssistantKeys.all, 'capabilities'] as const,
};

// ========== AI Service Status ==========

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

// ========== Chat & Conversations ==========

/**
 * Hook to list all conversations
 */
export const useConversations = (filters?: {
  financial_profile_id?: string;
  skip?: number;
  limit?: number;
}) => {
  const query = useListConversationsApiV1AiAiChatConversationsGet(filters);

  return {
    conversations: query.data?.data?.items || [],
    total: query.data?.data?.total || 0,
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
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  const mutation = useSendChatMessageApiV1AiAiChatMessagePost({
    mutation: {
      onSuccess: () => {
        // Invalidate conversations list to refetch
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
        // Invalidate conversations list to refetch
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

  const { sendMessage, isSending } = useSendMessage();

  const handleSendMessage = async (content: string, conversationId?: string) => {
    if (!content.trim()) return;

    setIsTyping(true);

    try {
      const response = await sendMessage({
        message: content,
        conversation_id: conversationId,
      });

      // Convert backend response to frontend message format
      const newMessage: ChatMessage = {
        id: String(Date.now()),
        role: 'assistant',
        type: 'text',
        content: response.data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isTyping,
    handleSendMessage,
    clearMessages,
    isLoading: isSending,
  };
};

// ========== Transaction Classification ==========

/**
 * Hook to classify a transaction
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
    trainModel: (data: { financial_profile_id: string }) =>
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

// ========== Optimization & Insights ==========

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
    months_back?: number;
    min_frequency?: number;
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
  financialProfileId: string,
  params?: {
    months_back?: number;
  }
) => {
  const query = useGetSavingsSummaryApiV1AiAiOptimizeSavingsSummaryFinancialProfileIdGet(
    financialProfileId,
    params
  );

  return {
    summary: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

// ========== UI-Only Hooks (Static Data) ==========
// These hooks return static UI data and don't call backend APIs

/**
 * Hook to get quick query suggestions (UI-only)
 * TODO: This could be moved to backend in the future
 */
export const useQuickQueries = (): {
  data: QuickQuery[] | undefined;
  isLoading: boolean;
  error: Error | null;
} => {
  // Static quick queries for now
  const quickQueries: QuickQuery[] = [
    {
      id: '1',
      label: 'How much did I spend this month?',
      query: 'monthly_spending',
      icon: 'TrendingDown',
      category: 'spending',
    },
    {
      id: '2',
      label: 'Show my budget status',
      query: 'budget_status',
      icon: 'PieChart',
      category: 'budget',
    },
    {
      id: '3',
      label: 'What are my top expenses?',
      query: 'top_expenses',
      icon: 'BarChart',
      category: 'insights',
    },
    {
      id: '4',
      label: 'Predict next month spending',
      query: 'predict_spending',
      icon: 'TrendingUp',
      category: 'predictions',
    },
  ];

  return {
    data: quickQueries,
    isLoading: false,
    error: null,
  };
};

/**
 * Hook to get assistant capabilities (UI-only)
 * TODO: This could be moved to backend in the future
 */
export const useCapabilities = (): {
  data: AssistantCapability[] | undefined;
  isLoading: boolean;
  error: Error | null;
} => {
  const capabilities: AssistantCapability[] = [
    {
      id: '1',
      title: 'Transaction Classification',
      description: 'Automatically categorize your transactions using AI',
      examples: ['Classify this transaction', 'What category is this expense?'],
      icon: 'Tag',
    },
    {
      id: '2',
      title: 'Budget Insights',
      description: 'Get personalized insights about your spending habits',
      examples: ['How am I doing this month?', 'Where can I save money?'],
      icon: 'Lightbulb',
    },
    {
      id: '3',
      title: 'Financial Forecasting',
      description: 'Predict future expenses and plan accordingly',
      examples: ['Predict my spending', 'Will I meet my savings goal?'],
      icon: 'TrendingUp',
    },
  ];

  return {
    data: capabilities,
    isLoading: false,
    error: null,
  };
};

// ========== Batch Classification Hooks ==========

/**
 * Hook to classify multiple transactions at once
 * Uses mock classification for now - can be connected to backend API later
 */
export const useClassifyTransactions = () => {
  const queryClient = useQueryClient();

  const mockClassify = async (
    transactions: TransactionToClassify[]
  ): Promise<ClassificationBatch> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock classification logic
    const categoryMapping: Record<string, { category: string; subcategory?: string }> = {
      esselunga: { category: 'Alimentari', subcategory: 'Supermercato' },
      netflix: { category: 'Intrattenimento', subcategory: 'Streaming' },
      amazon: { category: 'Shopping', subcategory: 'E-commerce' },
      ristorante: { category: 'Alimentari', subcategory: 'Ristoranti' },
      enel: { category: 'Utenze', subcategory: 'Elettricità' },
    };

    const results: ClassificationResult[] = transactions.map((tx) => {
      const descLower = tx.description.toLowerCase();
      let category = 'Altro';
      let subcategory: string | undefined;

      for (const [keyword, cat] of Object.entries(categoryMapping)) {
        if (descLower.includes(keyword)) {
          category = cat.category;
          subcategory = cat.subcategory;
          break;
        }
      }

      const confidence = 0.7 + Math.random() * 0.25; // 70-95% confidence

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
  };

  return {
    mutateAsync: mockClassify,
    isPending: false,
  };
};

/**
 * Hook to confirm a classification
 * Updates the classification as confirmed by user
 */
export const useConfirmClassification = () => {
  const queryClient = useQueryClient();

  const confirmClassification = async (data: {
    transactionId: string;
    categoryId: string;
  }) => {
    // In a real implementation, this would call the backend API
    // For now, we just return success
    console.log('Classification confirmed:', data);

    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: aiAssistantKeys.all });

    return { success: true };
  };

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
 * Marks the classification as rejected by user
 */
export const useRejectClassification = () => {
  const queryClient = useQueryClient();

  const rejectClassification = async (transactionId: string) => {
    // In a real implementation, this would call the backend API
    // For now, we just return success
    console.log('Classification rejected:', transactionId);

    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: aiAssistantKeys.all });

    return { success: true };
  };

  return {
    mutate: (transactionId: string) => {
      rejectClassification(transactionId);
    },
    mutateAsync: rejectClassification,
    isPending: false,
  };
};
