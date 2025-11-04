/**
 * useMessagesDetail - Hook for Messages Detail Page
 * Hook متخصص لإدارة تفاصيل المحادثة مع استخدام React Query
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  Conversation, 
  Message, 
  Lead, 
  MessageType,
  SendMessageRequest,
  PaginationParams,
  PaginatedResponse
} from '../types';
import { messagesApi } from '../lib/api';

// Query Keys
export const messagesDetailQueryKeys = {
  all: ['messages-detail'] as const,
  conversation: (id: string) => [...messagesDetailQueryKeys.all, 'conversation', id] as const,
  messages: (id: string) => [...messagesDetailQueryKeys.all, 'messages', id] as const,
  lead: (id: string) => [...messagesDetailQueryKeys.all, 'lead', id] as const,
} as const;

// Types for query results
export interface ConversationDetailData {
  conversation: Conversation;
  lead: Lead;
}

export interface MessagesData {
  messages: PaginatedResponse<Message>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export interface SendMessageData {
  content: string;
  type: MessageType;
  metadata?: Record<string, any>;
}

// Main hook return type
export interface UseMessagesDetailReturn {
  // Data
  conversation: Conversation | undefined;
  lead: Lead | undefined;
  messages: Message[];
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Actions
  sendMessage: (data: SendMessageData) => Promise<void>;
  refreshConversation: () => void;
  loadMoreMessages: () => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  
  // Status
  isSendingMessage: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
}

/**
 * Hook الرئيسي للحصول على تفاصيل المحادثة والرسائل
 */
export const useMessagesDetail = (
  conversationId: string, 
  options?: {
    enableAutoRefresh?: boolean;
    refreshInterval?: number;
  }
): UseMessagesDetailReturn => {
  const queryClient = useQueryClient();
  const { enableAutoRefresh = true, refreshInterval = 30000 } = options || {};

  // Query for conversation and lead data
  const {
    data: conversationData,
    isLoading: conversationLoading,
    isError: conversationError,
    error: conversationErrorObj,
    refetch: refetchConversation
  } = useQuery({
    queryKey: messagesDetailQueryKeys.conversation(conversationId),
    queryFn: async (): Promise<ConversationDetailData> => {
      const response = await messagesApi.getConversation(conversationId);
      return {
        conversation: response.data,
        lead: response.data.lead || {} as Lead
      };
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: enableAutoRefresh ? refreshInterval : false,
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Query for messages with pagination
  const {
    data: messagesData,
    isLoading: messagesLoading,
    isError: messagesError,
    error: messagesErrorObj,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchMessages
  } = useQuery({
    queryKey: messagesDetailQueryKeys.messages(conversationId),
    queryFn: async ({ pageParam = 1 }) => {
      const params: PaginationParams = {
        page: pageParam,
        limit: 50,
        sort_by: 'created_at',
        sort_order: 'desc'
      };
      
      const response = await messagesApi.getMessages(conversationId, params);
      return response.data;
    },
    enabled: !!conversationId,
    getNextPageParam: (lastPage) => {
      if (lastPage.has_next) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: enableAutoRefresh ? refreshInterval : false,
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: SendMessageData) => {
      const request: SendMessageRequest = {
        conversation_id: conversationId,
        content: data.content,
        type: data.type,
        metadata: data.metadata
      };
      
      const response = await messagesApi.sendMessage(request);
      return response.data;
    },
    onSuccess: (newMessage) => {
      // Update messages cache immediately
      queryClient.setQueryData(
        messagesDetailQueryKeys.messages(conversationId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            items: [newMessage, ...old.items],
            total: old.total + 1
          };
        }
      );

      // Update conversation data
      queryClient.setQueryData(
        messagesDetailQueryKeys.conversation(conversationId),
        (old: ConversationDetailData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            conversation: {
              ...old.conversation,
              last_message_at: newMessage.created_at,
              message_count: old.conversation.message_count + 1
            }
          };
        }
      );

      toast.success('تم إرسال الرسالة بنجاح');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'فشل في إرسال الرسالة';
      toast.error(errorMessage);
      console.error('Error sending message:', error);
    }
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await messagesApi.markAsRead(messageId);
    },
    onSuccess: (_, messageId) => {
      // Update message status in cache
      queryClient.setQueryData(
        messagesDetailQueryKeys.messages(conversationId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((msg: Message) =>
              msg.id === messageId 
                ? { ...msg, status: 'read' as const }
                : msg
            )
          };
        }
      );
    },
    onError: (error: any) => {
      console.error('Error marking message as read:', error);
    }
  });

  // Helper functions
  const refreshConversation = useCallback(() => {
    refetchConversation();
    refetchMessages();
  }, [refetchConversation, refetchMessages]);

  const loadMoreMessages = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sendMessage = useCallback(async (data: SendMessageData) => {
    await sendMessageMutation.mutateAsync(data);
  }, [sendMessageMutation]);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    await markAsReadMutation.mutateAsync(messageId);
  }, [markAsReadMutation]);

  // Memoized values
  const conversation = conversationData?.conversation;
  const lead = conversationData?.lead;
  const messages = useMemo(() => {
    if (!messagesData) return [];
    // Reverse to show newest messages at bottom
    return [...messagesData.items].reverse();
  }, [messagesData]);

  const isLoading = conversationLoading || messagesLoading;
  const isError = conversationError || messagesError;
  const error = conversationErrorObj || messagesErrorObj;

  return {
    // Data
    conversation,
    lead,
    messages,
    hasMore: !!hasNextPage,
    isLoading,
    isError,
    error,

    // Actions
    sendMessage,
    refreshConversation,
    loadMoreMessages,
    markMessageAsRead,

    // Status
    isSendingMessage: sendMessageMutation.isPending,
    isRefreshing: false, // You can implement this if needed
    isLoadingMore: isFetchingNextPage,
  };
};

export default useMessagesDetail;