import { useState, useEffect, useCallback, useMemo } from 'react';
import { messagesApi } from '../lib/api';
import { 
  Conversation, 
  Message, 
  PaginatedResponse, 
  PaginationParams,
  ConversationStatus,
  MessageType,
  SendMessageRequest
} from '../types';

interface UseMessagesOptions {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  status?: ConversationStatus;
  message_type?: MessageType;
  search?: string;
}

interface UseMessagesReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  unreadCount: number;
  // Actions
  loadConversations: (options?: UseMessagesOptions) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  createConversation: (leadId: string) => Promise<Conversation | null>;
  sendMessage: (data: SendMessageRequest) => Promise<Message | null>;
  markAsRead: (messageId: string) => Promise<void>;
  updateConversationStatus: (conversationId: string, status: ConversationStatus) => Promise<void>;
  // Filters
  setFilter: (key: keyof UseMessagesOptions, value: any) => void;
  clearFilters: () => void;
  // Search
  searchConversations: (query: string) => void;
  // Real-time updates
  enableRealtimeUpdates: () => void;
  disableRealtimeUpdates: () => void;
}

export const useMessages = (initialOptions?: UseMessagesOptions): UseMessagesReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: initialOptions?.page || 1,
    limit: initialOptions?.limit || 20,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [realtimeEnabled, setRealtimeEnabled] = useState<boolean>(false);
  const [filters, setFilters] = useState<UseMessagesOptions>(initialOptions || {});

  // Load conversations from API
  const loadConversations = useCallback(async (options?: UseMessagesOptions) => {
    try {
      setLoading(true);
      setError(null);

      const params: PaginationParams = {
        page: options?.page || pagination.page,
        limit: options?.limit || pagination.limit,
        sort_by: options?.sort_by || 'last_message_at',
        sort_order: options?.sort_order || 'desc',
      };

      // Add filters (converted to snake_case for API)
      if (options?.status) (params as any).status = options.status;
      if (options?.message_type) (params as any).message_type = options.message_type;
      if (options?.search) (params as any).search = options.search;

      const response = await messagesApi.getConversations(params);
      const data = response.data;

      setConversations(data.items);
      setPagination({
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.total_pages,
        hasNext: data.has_next,
        hasPrevious: data.has_previous,
      });
    } catch (err: any) {
      setError(err.message || 'خطأ في تحميل المحادثات');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  // Load more conversations (pagination)
  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loading) return;

    const nextPage = pagination.page + 1;
    try {
      setLoading(true);
      setError(null);

      const params: PaginationParams = {
        page: nextPage,
        limit: pagination.limit,
        sort_by: filters.sort_by || 'last_message_at',
        sort_order: filters.sort_order || 'desc',
      };

      if (filters.status) (params as any).status = filters.status;
      if (filters.message_type) (params as any).message_type = filters.message_type;
      if (filters.search) (params as any).search = filters.search;

      const response = await messagesApi.getConversations(params);
      const data = response.data;

      setConversations(prev => [...prev, ...data.items]);
      setPagination(prev => ({
        ...prev,
        page: data.page,
        hasNext: data.has_next,
        hasPrevious: data.has_previous,
      }));
    } catch (err: any) {
      setError(err.message || 'خطأ في تحميل المزيد من المحادثات');
      console.error('Error loading more conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination, loading, filters]);

  // Refresh conversations
  const refresh = useCallback(() => {
    loadConversations(filters);
  }, [loadConversations, filters]);

  // Create new conversation
  const createConversation = useCallback(async (leadId: string): Promise<Conversation | null> => {
    try {
      setError(null);
      // This would be implemented in the API
      // For now, return null as placeholder
      return null;
    } catch (err: any) {
      setError(err.message || 'خطأ في إنشاء المحادثة');
      console.error('Error creating conversation:', err);
      return null;
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (data: SendMessageRequest): Promise<Message | null> => {
    try {
      setError(null);
      const response = await messagesApi.sendMessage(data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'خطأ في إرسال الرسالة');
      console.error('Error sending message:', err);
      return null;
    }
  }, []);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    try {
      await messagesApi.markAsRead(messageId);
      // Update local state to reflect read status
      setConversations(prev => prev.map(conv => 
        conv.id === messageId ? { ...conv } : conv
      ));
      
      // Refresh unread count
      const response = await messagesApi.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (err: any) {
      setError(err.message || 'خطأ في تعليم الرسالة كمقروءة');
      console.error('Error marking message as read:', err);
    }
  }, []);

  // Update conversation status
  const updateConversationStatus = useCallback(async (
    conversationId: string, 
    status: ConversationStatus
  ): Promise<void> => {
    try {
      setError(null);
      // Update local state immediately for better UX
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, status } : conv
      ));
      
      // In a real implementation, this would call the API
      // For now, we just update local state
    } catch (err: any) {
      setError(err.message || 'خطأ في تحديث حالة المحادثة');
      console.error('Error updating conversation status:', err);
    }
  }, []);

  // Set filter
  const setFilter = useCallback((key: keyof UseMessagesOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({ page: 1, limit: pagination.limit });
  }, [pagination.limit]);

  // Search conversations
  const searchConversations = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, search: query, page: 1 }));
  }, []);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await messagesApi.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, []);

  // Real-time updates (WebSocket implementation would go here)
  const enableRealtimeUpdates = useCallback(() => {
    setRealtimeEnabled(true);
    // In a real implementation, this would connect to WebSocket
    console.log('Real-time updates enabled');
  }, []);

  const disableRealtimeUpdates = useCallback(() => {
    setRealtimeEnabled(false);
    // In a real implementation, this would disconnect from WebSocket
    console.log('Real-time updates disabled');
  }, []);

  // Effect to load conversations when filters change
  useEffect(() => {
    loadConversations(filters);
  }, [filters, loadConversations]);

  // Effect to load unread count on mount
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Memoized return value
  const value = useMemo(() => ({
    conversations,
    loading,
    error,
    total: pagination.total,
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    hasNext: pagination.hasNext,
    hasPrevious: pagination.hasPrevious,
    unreadCount,
    loadConversations,
    loadMore,
    refresh,
    createConversation,
    sendMessage,
    markAsRead,
    updateConversationStatus,
    setFilter,
    clearFilters,
    searchConversations,
    enableRealtimeUpdates,
    disableRealtimeUpdates,
  }), [
    conversations,
    loading,
    error,
    pagination,
    unreadCount,
    loadConversations,
    loadMore,
    refresh,
    createConversation,
    sendMessage,
    markAsRead,
    updateConversationStatus,
    setFilter,
    clearFilters,
    searchConversations,
    enableRealtimeUpdates,
    disableRealtimeUpdates,
  ]);

  return value;
};

export default useMessages;