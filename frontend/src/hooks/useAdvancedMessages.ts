/**
 * useAdvancedMessages - Advanced Messaging Analytics Hook
 * Hook متقدم لتحليلات الرسائل مع إحصائيات شاملة ووقت فعلي
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

// Types
export interface MessageAnalytics {
  totalMessages: number;
  unreadMessages: number;
  responseRate: number;
  conversionRate: number;
  avgResponseTime: number;
  activeConversations: number;
  messagesByChannel: Record<string, number>;
  responseTimeByHour: Array<{ hour: number; avgTime: number }>;
  messageTrends: Array<{ date: string; sent: number; received: number }>;
}

export interface MessageFilters {
  channel?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  messageType?: string;
  status?: string;
}

// Validation Schema
const analyticsQuerySchema = z.object({
  channel: z.string().optional(),
  dateRange: z.object({
    from: z.string(),
    to: z.string()
  }).optional(),
  messageType: z.string().optional(),
  status: z.string().optional()
});

// Query Keys
const queryKeys = {
  analytics: (filters: MessageFilters) => ['advanced-messages', 'analytics', filters],
  conversations: (page: number, filters: MessageFilters) => ['advanced-messages', 'conversations', page, filters],
  templates: (filters: any) => ['advanced-messages', 'templates', filters]
};

interface UseAdvancedMessagesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
}

export function useAdvancedMessages(options: UseAdvancedMessagesOptions = {}) {
  const queryClient = useQueryClient();
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableRealTime = true
  } = options;

  // State
  const [filters, setFilters] = useState<MessageFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Memoized query key
  const analyticsKey = useMemo(() => queryKeys.analytics(filters), [filters]);

  // Fetch Analytics Data
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: analyticsKey,
    queryFn: async () => {
      const response = await fetch('/api/messages/analytics/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      });

      if (!response.ok) {
        throw new Error(`فشل في تحميل إحصائيات الرسائل: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data as MessageAnalytics;
    },
    staleTime: 20000, // 20 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes('4')) return false;
      return failureCount < 3;
    }
  });

  // Fetch Conversations
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations
  } = useQuery({
    queryKey: queryKeys.conversations(currentPage, filters),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.channel && { channel: filters.channel }),
        ...(filters.messageType && { messageType: filters.messageType }),
        ...(filters.dateRange && { 
          from: filters.dateRange.from, 
          to: filters.dateRange.to 
        })
      });

      const response = await fetch(`/api/messages?${params}`);
      
      if (!response.ok) {
        throw new Error(`فشل في تحميل المحادثات: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 10000,
    enabled: Boolean(selectedConversation === null), // Only load if no specific conversation is selected
    retry: 3
  });

  // Fetch Message Templates
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError
  } = useQuery({
    queryKey: queryKeys.templates(filters),
    queryFn: async () => {
      const response = await fetch('/api/messages/templates');
      
      if (!response.ok) {
        throw new Error(`فشل في تحميل قوالب الرسائل: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 300000, // 5 minutes - templates don't change often
    retry: 2
  });

  // Real-time Updates (WebSocket simulation)
  useEffect(() => {
    if (!enableRealTime) return;

    const interval = setInterval(() => {
      // Refetch analytics every refreshInterval if autoRefresh is enabled
      if (autoRefresh) {
        refetchAnalytics();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, enableRealTime, refetchAnalytics]);

  // Mutations
  const updateConversationStatusMutation = useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: string; status: string }) => {
      const response = await fetch(`/api/messages/${conversationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`فشل في تحديث حالة المحادثة: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['advanced-messages', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['advanced-messages', 'conversations'] });
    },
    onError: (error) => {
      console.error('خطأ في تحديث حالة المحادثة:', error);
    }
  });

  const sendBulkMessageMutation = useMutation({
    mutationFn: async ({ templateId, recipients }: { templateId: string; recipients: string[] }) => {
      const response = await fetch('/api/messages/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, recipients })
      });

      if (!response.ok) {
        throw new Error(`فشل في إرسال الرسائل المجمعة: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-messages', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['advanced-messages', 'conversations'] });
    },
    onError: (error) => {
      console.error('خطأ في إرسال الرسائل المجمعة:', error);
    }
  });

  // Handlers
  const handleFilterChange = useCallback((newFilters: Partial<MessageFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId);
    // Fetch specific conversation data
    queryClient.prefetchQuery({
      queryKey: ['advanced-messages', 'conversation', conversationId],
      queryFn: async () => {
        const response = await fetch(`/api/messages/${conversationId}`);
        if (!response.ok) throw new Error('Failed to fetch conversation');
        return response.json();
      }
    });
  }, [queryClient]);

  const handleConversationDeselect = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const handleExportAnalytics = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const response = await fetch('/api/messages/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filters, 
          format,
          includeCharts: true 
        })
      });

      if (!response.ok) {
        throw new Error(`فشل في تصدير التحليلات: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('خطأ في تصدير التحليلات:', error);
      throw error;
    }
  }, [filters]);

  // Computed values
  const isLoading = analyticsLoading || conversationsLoading;
  const error = analyticsError || conversationsError || templatesError;
  const hasFilters = Object.keys(filters).length > 0;

  return {
    // Data
    analytics: analyticsData,
    conversations: conversationsData?.conversations || [],
    templates: templates || [],
    
    // Loading states
    analyticsLoading,
    conversationsLoading,
    templatesLoading,
    isLoading,
    
    // Errors
    analyticsError,
    conversationsError,
    templatesError,
    error,
    
    // State
    filters,
    currentPage,
    selectedConversation,
    hasFilters,
    
    // Pagination
    pagination: {
      currentPage,
      totalPages: Math.ceil((conversationsData?.total || 0) / 20),
      total: conversationsData?.total || 0,
      hasNext: currentPage < Math.ceil((conversationsData?.total || 0) / 20),
      hasPrevious: currentPage > 1
    },
    
    // Actions
    handleFilterChange,
    handlePageChange,
    handleConversationSelect,
    handleConversationDeselect,
    handleExportAnalytics,
    refetchAnalytics,
    refetchConversations,
    
    // Mutations
    updateConversationStatus: updateConversationStatusMutation.mutateAsync,
    sendBulkMessage: sendBulkMessageMutation.mutateAsync,
    
    // Mutation states
    isUpdatingStatus: updateConversationStatusMutation.isPending,
    isSendingBulkMessage: sendBulkMessageMutation.isPending,
    
    // Real-time
    autoRefresh,
    refreshInterval,
    enableRealTime
  };
}