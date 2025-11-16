// AI Assistant Hooks using React Query

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { mockAIAssistantApi } from '../api/mockAIAssistantApi';
import type { ChatMessage, ExplanationRequest } from '../types';

// Query keys
export const aiAssistantKeys = {
  all: ['ai-assistant'] as const,
  quickQueries: () => [...aiAssistantKeys.all, 'quick-queries'] as const,
  capabilities: () => [...aiAssistantKeys.all, 'capabilities'] as const,
  conversations: () => [...aiAssistantKeys.all, 'conversations'] as const,
};

export const useQuickQueries = () => {
  return useQuery({
    queryKey: aiAssistantKeys.quickQueries(),
    queryFn: () => mockAIAssistantApi.getQuickQueries(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCapabilities = () => {
  return useQuery({
    queryKey: aiAssistantKeys.capabilities(),
    queryFn: () => mockAIAssistantApi.getCapabilities(),
    staleTime: 30 * 60 * 1000,
  });
};

export const useConversations = () => {
  return useQuery({
    queryKey: aiAssistantKeys.conversations(),
    queryFn: () => mockAIAssistantApi.getConversations(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSendMessage = () => {
  return useMutation({
    mutationFn: ({ message, conversationId }: { message: string; conversationId?: string }) =>
      mockAIAssistantApi.sendMessage(message, conversationId),
  });
};

export const useExplanation = () => {
  return useMutation({
    mutationFn: (request: ExplanationRequest) => mockAIAssistantApi.getExplanation(request),
  });
};

// Custom hook for managing chat state
export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useSendMessage();

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    setIsTyping(true);

    try {
      const newMessages = await sendMessage.mutateAsync({ message: content });
      setMessages((prev) => [...prev, ...newMessages]);
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
    isLoading: sendMessage.isPending,
  };
};
