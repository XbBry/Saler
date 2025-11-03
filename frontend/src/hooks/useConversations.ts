import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi, handleApiError } from '../lib/api';
import { messageUtils } from '../lib/message-utils';
import {
  Conversation,
  ConversationStatus,
  Message,
  MessageStatus,
  PaginatedResponse,
  PaginationParams,
  ApiResponse,
  ConversationSearchParams,
  OnlineStatus,
  Lead,
  Note,
} from '../types';

// ==================== HOOK INTERFACES ====================

interface UseConversationsProps {
  leadId?: string;
  enableRealTime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onConversationUpdate?: (conversation: Conversation) => void;
  onOnlineStatusChange?: (status: OnlineStatus) => void;
}

interface UseConversationsReturn {
  // Data
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  
  // Pagination
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  
  // Search & Filter
  searchQuery: string;
  filteredConversations: Conversation[];
  searchConversations: (query: string) => void;
  clearSearch: () => void;
  applyFilters: (filters: Partial<ConversationSearchParams>) => void;
  
  // Conversation operations
  getConversation: (conversationId: string) => Promise<Conversation & { messages: Message[] }>;
  updateConversationStatus: (conversationId: string, status: ConversationStatus) => Promise<void>;
  closeConversation: (conversationId: string) => Promise<void>;
  reopenConversation: (conversationId: string) => Promise<void>;
  addConversationNote: (conversationId: string, content: string) => Promise<void>;
  getConversationNotes: (conversationId: string) => Promise<Note[]>;
  
  // Status
  unreadCount: number;
  onlineUsers: OnlineStatus[];
  
  // Real-time
  subscribeToConversations: (callback: (conversation: Conversation) => void) => () => void;
  subscribeToOnlineStatus: (callback: (status: OnlineStatus) => void) => () => void;
  
  // Actions
  refreshConversations: () => void;
  loadMoreConversations: () => void;
  resetConversations: () => void;
  
  // Utility
  getConversationById: (id: string) => Conversation | undefined;
  getUnreadConversations: () => Conversation[];
  getConversationsByLead: (leadId: string) => Conversation[];
}

// ==================== REAL-TIME SERVICE ====================

class ConversationRealtimeService {
  private listeners: Map<string, Set<(conversation: Conversation) => void>> = new Map();
  private statusListeners: Map<string, Set<(status: OnlineStatus) => void>> = new Map();
  private isConnected = false;
  private ws?: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    if (typeof window === 'undefined') return;
    
    try {
      this.ws = new WebSocket(`ws://localhost:8000/ws/conversations`);
      
      this.ws.onopen = () => {
        console.log('Conversation real-time service connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };
      
      this.ws.onclose = () => {
        console.log('Conversation real-time service disconnected');
        this.isConnected = false;
        this.handleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      };
    } catch (error) {
      console.error('Failed to connect to conversation real-time service:', error);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, 1000 * Math.pow(2, this.reconnectAttempts));
    }
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'conversation_updated':
        this.emitConversationUpdate(data.conversation_id, data.conversation);
        break;
      case 'online_status':
        this.emitOnlineStatusUpdate(data.user_id, data.status);
        break;
      case 'conversation_created':
        this.emitConversationUpdate(data.conversation_id, data.conversation);
        break;
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    this.isConnected = false;
    this.listeners.clear();
    this.statusListeners.clear();
  }

  subscribe(conversationId: string, callback: (conversation: Conversation) => void): () => void {
    if (!this.listeners.has(conversationId)) {
      this.listeners.set(conversationId, new Set());
    }
    
    this.listeners.get(conversationId)!.add(callback);
    
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({
        type: 'subscribe_conversation',
        conversation_id: conversationId,
      }));
    }
    
    return () => {
      this.listeners.get(conversationId)?.delete(callback);
      if (this.ws && this.isConnected) {
        this.ws.send(JSON.stringify({
          type: 'unsubscribe_conversation',
          conversation_id: conversationId,
        }));
      }
    };
  }

  subscribeToOnlineStatus(callback: (status: OnlineStatus) => void): () => void {
    const subscriptionId = 'all_users';
    if (!this.statusListeners.has(subscriptionId)) {
      this.statusListeners.set(subscriptionId, new Set());
    }
    
    this.statusListeners.get(subscriptionId)!.add(callback);
    
    return () => {
      this.statusListeners.get(subscriptionId)?.delete(callback);
    };
  }

  emitConversationUpdate(conversationId: string, conversation: Conversation): void {
    const callbacks = this.listeners.get(conversationId);
    if (callbacks) {
      callbacks.forEach(callback => callback(conversation));
    }
  }

  emitOnlineStatusUpdate(userId: string, isOnline: boolean): void {
    const status: OnlineStatus = {
      user_id: userId,
      is_online: isOnline,
      last_seen: new Date().toISOString(),
    };
    
    const callbacks = this.statusListeners.get('all_users');
    if (callbacks) {
      callbacks.forEach(callback => callback(status));
    }
  }

  sendStatusUpdate(userId: string, isOnline: boolean): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({
        type: 'status_update',
        user_id: userId,
        is_online: isOnline,
      }));
    }
  }
}

// Singleton instance
const conversationRealtimeService = new ConversationRealtimeService();

// ==================== MAIN HOOK ====================

export const useConversations = ({
  leadId,
  enableRealTime = true,
  autoRefresh = true,
  refreshInterval = 30000,
  onConversationUpdate,
  onOnlineStatusChange,
}: UseConversationsProps = {}): UseConversationsReturn => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ConversationSearchParams>({});
  const [onlineUsers, setOnlineUsers] = useState<OnlineStatus[]>([]);
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeSubscriptionRef = useRef<(() => void) | null>(null);
  const statusSubscriptionRef = useRef<(() => void) | null>(null);
  
  // Query Client
  const queryClient = useQueryClient();
  
  // Pagination params
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    sort_by: 'last_message_at',
    sort_order: 'desc',
  });
  
  // Combine lead ID with search/filter params
  const queryParams = useMemo(() => ({
    ...pagination,
    ...filters,
    ...(leadId && { lead_id: leadId }),
    ...(searchQuery && { query: searchQuery }),
  }), [pagination, filters, leadId, searchQuery]);
  
  // ==================== QUERIES ====================
  
  // Conversations query
  const {
    data: conversationsResponse,
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useQuery<ApiResponse<PaginatedResponse<Conversation>>>({
    queryKey: ['conversations', queryParams],
    queryFn: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      return messagesApi.getConversations(queryParams);
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 1000 * 60 * 5,
  });
  
  // Unread count query
  const {
    data: unreadResponse,
    refetch: refetchUnreadCount,
  } = useQuery<ApiResponse<{ count: number }>>({
    queryKey: ['conversations-unread-count'],
    queryFn: () => messagesApi.getUnreadCount(),
    refetchInterval: refreshInterval,
  });
  
  // ==================== MUTATIONS ====================
  
  // Update conversation status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ conversationId, status }: { conversationId: string; status: ConversationStatus }) => {
      // This would need to be implemented in the API
      // For now, we'll simulate with a local update
      return Promise.resolve({ conversationId, status });
    },
    onSuccess: ({ conversationId, status }) => {
      // Update local state
      queryClient.setQueryData<ApiResponse<PaginatedResponse<Conversation>>>(
        ['conversations', queryParams],
        (oldData) => {
          if (!oldData?.data?.items) return oldData;
          
          return {
            ...oldData,
            data: {
              ...oldData.data,
              items: oldData.data.items.map(conv =>
                conv.id === conversationId
                  ? { ...conv, status }
                  : conv
              ),
            },
          };
        }
      );
      
      refetchUnreadCount();
    },
  });
  
  // Close conversation mutation
  const closeConversationMutation = useMutation({
    mutationFn: (conversationId: string) => updateStatusMutation.mutateAsync({
      conversationId,
      status: 'closed' as ConversationStatus,
    }),
  });
  
  // Reopen conversation mutation
  const reopenConversationMutation = useMutation({
    mutationFn: (conversationId: string) => updateStatusMutation.mutateAsync({
      conversationId,
      status: 'active' as ConversationStatus,
    }),
  });
  
  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) => {
      // This would need to be implemented in the API
      return Promise.resolve({ id: Date.now().toString(), content, conversation_id: conversationId });
    },
    onSuccess: (note) => {
      // Update notes cache
      queryClient.setQueryData(
        ['conversation-notes', note.conversation_id],
        (oldNotes: Note[] = []) => [...oldNotes, note]
      );
    },
  });
  
  // ==================== REAL-TIME SETUP ====================
  
  useEffect(() => {
    if (enableRealTime) {
      conversationRealtimeService.connect();
      
      // Subscribe to conversation updates
      const unsubscribe = conversationRealtimeService.subscribe(
        'all_conversations',
        (conversation) => {
          queryClient.setQueryData<ApiResponse<PaginatedResponse<Conversation>>>(
            ['conversations', queryParams],
            (oldData) => {
              if (!oldData?.data?.items) return oldData;
              
              const exists = oldData.data.items.some(c => c.id === conversation.id);
              
              if (exists) {
                // Update existing conversation
                return {
                  ...oldData,
                  data: {
                    ...oldData.data,
                    items: oldData.data.items.map(conv =>
                      conv.id === conversation.id ? conversation : conv
                    ),
                  },
                };
              } else {
                // Add new conversation
                return {
                  ...oldData,
                  data: {
                    ...oldData.data,
                    items: [conversation, ...oldData.data.items],
                    total: oldData.data.total + 1,
                  },
                };
              }
            }
          );
          
          onConversationUpdate?.(conversation);
        }
      );
      
      // Subscribe to online status updates
      const unsubscribeStatus = conversationRealtimeService.subscribeToOnlineStatus((status) => {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.user_id === status.user_id);
          if (exists) {
            return prev.map(u => u.user_id === status.user_id ? status : u);
          } else {
            return [...prev, status];
          }
        });
        
        onOnlineStatusChange?.(status);
      });
      
      realtimeSubscriptionRef.current = unsubscribe;
      statusSubscriptionRef.current = unsubscribeStatus;
      
      return () => {
        unsubscribe();
        unsubscribeStatus();
        realtimeSubscriptionRef.current = null;
        statusSubscriptionRef.current = null;
      };
    }
  }, [enableRealTime, queryParams, queryClient, onConversationUpdate, onOnlineStatusChange]);
  
  // ==================== SEARCH AND FILTER ====================
  
  const filteredConversations = useMemo(() => {
    if (!conversationsResponse?.data?.items) return [];
    
    let conversations = [...conversationsResponse.data.items];
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      conversations = conversations.filter(conv =>
        conv.id.toLowerCase().includes(query) ||
        conv.lead_id.toLowerCase().includes(query)
      );
    }
    
    // Apply filters
    if (filters.status?.length) {
      conversations = conversations.filter(conv =>
        filters.status!.includes(conv.status)
      );
    }
    
    if (filters.lead_id) {
      conversations = conversations.filter(conv => conv.lead_id === filters.lead_id);
    }
    
    return conversations;
  }, [conversationsResponse?.data?.items, searchQuery, filters]);
  
  const searchConversations = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      refetchConversations();
    }, 300);
  }, [refetchConversations]);
  
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters({});
    refetchConversations();
  }, [refetchConversations]);
  
  const applyFilters = useCallback((newFilters: Partial<ConversationSearchParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    refetchConversations();
  }, [refetchConversations]);
  
  // ==================== CONVERSATION OPERATIONS ====================
  
  const getConversation = useCallback(async (conversationId: string) => {
    const response = await messagesApi.getConversation(conversationId);
    return response.data;
  }, []);
  
  const updateConversationStatus = useCallback(async (conversationId: string, status: ConversationStatus) => {
    await updateStatusMutation.mutateAsync({ conversationId, status });
  }, [updateStatusMutation]);
  
  const closeConversation = useCallback(async (conversationId: string) => {
    await closeConversationMutation.mutateAsync(conversationId);
  }, [closeConversationMutation]);
  
  const reopenConversation = useCallback(async (conversationId: string) => {
    await reopenConversationMutation.mutateAsync(conversationId);
  }, [reopenConversationMutation]);
  
  const addConversationNote = useCallback(async (conversationId: string, content: string) => {
    await addNoteMutation.mutateAsync({ conversationId, content });
  }, [addNoteMutation]);
  
  const getConversationNotes = useCallback(async (conversationId: string) => {
    // This would query notes for the conversation
    const notes: Note[] = [];
    return notes;
  }, []);
  
  // ==================== PAGINATION & ACTIONS ====================
  
  const loadMoreConversations = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      page: prev.page + 1,
    }));
  }, []);
  
  const refreshConversations = useCallback(() => {
    refetchConversations();
    refetchUnreadCount();
  }, [refetchConversations, refetchUnreadCount]);
  
  const resetConversations = useCallback(() => {
    setPagination({
      page: 1,
      limit: 20,
      sort_by: 'last_message_at',
      sort_order: 'desc',
    });
    setSearchQuery('');
    setFilters({});
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [queryClient]);
  
  // ==================== UTILITY METHODS ====================
  
  const getConversationById = useCallback((id: string) => {
    return filteredConversations.find(conv => conv.id === id);
  }, [filteredConversations]);
  
  const getUnreadConversations = useCallback(() => {
    return filteredConversations.filter(conv => conv.message_count > 0);
  }, [filteredConversations]);
  
  const getConversationsByLead = useCallback((leadId: string) => {
    return filteredConversations.filter(conv => conv.lead_id === leadId);
  }, [filteredConversations]);
  
  // ==================== COMPUTED VALUES ====================
  
  const hasNextPage = conversationsResponse?.data?.has_next || false;
  const hasPreviousPage = conversationsResponse?.data?.has_previous || false;
  const currentPage = conversationsResponse?.data?.page || 1;
  const totalPages = conversationsResponse?.data?.total_pages || 1;
  const totalCount = conversationsResponse?.data?.total || 0;
  const unreadCount = unreadResponse?.data?.count || 0;
  
  const loading = conversationsLoading || updateStatusMutation.isPending;
  const error = conversationsError ? handleApiError(conversationsError).message : null;
  
  // ==================== CLEANUP ====================
  
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (realtimeSubscriptionRef.current) {
        realtimeSubscriptionRef.current();
      }
      if (statusSubscriptionRef.current) {
        statusSubscriptionRef.current();
      }
    };
  }, []);
  
  // ==================== RETURN ====================
  
  return {
    // Data
    conversations: filteredConversations,
    loading,
    error,
    
    // Pagination
    hasNextPage,
    hasPreviousPage,
    currentPage,
    totalPages,
    totalCount,
    
    // Search & Filter
    searchQuery,
    filteredConversations,
    searchConversations,
    clearSearch,
    applyFilters,
    
    // Conversation operations
    getConversation,
    updateConversationStatus,
    closeConversation,
    reopenConversation,
    addConversationNote,
    getConversationNotes,
    
    // Status
    unreadCount,
    onlineUsers,
    
    // Real-time
    subscribeToConversations: (callback) => {
      return conversationRealtimeService.subscribe('all_conversations', callback);
    },
    subscribeToOnlineStatus: (callback) => {
      return conversationRealtimeService.subscribeToOnlineStatus(callback);
    },
    
    // Actions
    refreshConversations,
    loadMoreConversations,
    resetConversations,
    
    // Utility
    getConversationById,
    getUnreadConversations,
    getConversationsByLead,
  };
};

// ==================== DEFAULT EXPORT ====================

export default useConversations;