/**
 * React Query hooks for AI Assistant operations
 */
import { useQueryClient } from '@tanstack/react-query';
import {
  useClassifyTransactionApiV1AiAiClassifyTransactionPost,
  useSendChatMessageApiV1AiAiChatMessagePost,
  useListConversationsApiV1AiAiChatConversationsGet,
  useGetConversationApiV1AiAiChatConversationsConversationIdGet,
  useDeleteConversationApiV1AiAiChatConversationsConversationIdDelete,
  useGetOptimizationInsightsApiV1AiAiOptimizeInsightsPost,
  useGetAiStatusApiV1AiAiStatusGet,
  getListConversationsApiV1AiAiChatConversationsGetQueryKey,
} from '@/api/generated/ai-services/ai-services';

import type {
  ClassificationRequest,
  ChatMessageRequest,
  OptimizationInsightsRequest,
} from './ai-assistant.types';

// Query keys
export const aiAssistantKeys = {
  all: ['ai-assistant'] as const,
  status: () => [...aiAssistantKeys.all, 'status'] as const,
  conversations: () => [...aiAssistantKeys.all, 'conversations'] as const,
};

export const useAIStatus = () => {
  const query = useGetAiStatusApiV1AiAiStatusGet();
  return {
    status: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

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

export const useConversation = (conversationId: string) => {
  const query = useGetConversationApiV1AiAiChatConversationsConversationIdGet(
    conversationId,
    { query: { enabled: !!conversationId } }
  );
  return {
    conversation: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useClassifyTransaction = () => {
  const mutation = useClassifyTransactionApiV1AiAiClassifyTransactionPost();
  return {
    classifyTransaction: (data: ClassificationRequest) => mutation.mutateAsync({ data }),
    isClassifying: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

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
    deleteConversation: (conversationId: string) => mutation.mutateAsync({ conversationId }),
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

export const useOptimizationInsights = () => {
  const mutation = useGetOptimizationInsightsApiV1AiAiOptimizeInsightsPost();
  return {
    getInsights: (data: OptimizationInsightsRequest) => mutation.mutateAsync({ data }),
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
