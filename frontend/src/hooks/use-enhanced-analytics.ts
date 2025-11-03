import { useQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { analyticsQueryApi } from '../lib/query-api';
import { queryKeys, analyticsKeys } from '../lib/query-keys';
import { 
  createMutation,
  createOptimisticUpdater,
  createArrayOptimisticUpdater 
} from '../lib/mutation-helpers';
import { AnalyticsData } from '../types';

// ===============================================
// Enhanced Analytics Hooks
// ===============================================

/**
 * Enhanced Analytics Hook with React Query integration
 */
export const useEnhancedAnalytics = (config?: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealtime?: boolean;
}) => {
  const queryClient = useQueryClient();
  const { 
    autoRefresh = true, 
    refreshInterval = 30000, 
    enableRealtime = true 
  } = config || {};

  // ==================== DASHBOARD ANALYTICS ====================
  
  /**
   * Dashboard metrics with real-time updates
   */
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    error: dashboardError,
    refetch: refetchDashboard,
    isStale: isDashboardStale,
  } = useQuery({
    queryKey: queryKeys.analytics.dashboard(),
    queryFn: () => analyticsQueryApi.getDashboard(),
    staleTime: 1000 * 60 * 2, // 2 minutes - more frequent for dashboard
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: true,
  });

  /**
   * Dashboard metrics with date range filtering
   */
  const useDashboardWithDateRange = (dateRange?: { start_date: string; end_date: string }) => {
    return useQuery({
      queryKey: queryKeys.analytics.dashboard(dateRange),
      queryFn: () => analyticsQueryApi.getDashboard(dateRange),
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 15,
      refetchInterval: autoRefresh ? refreshInterval : false,
    });
  };

  // ==================== SPECIFIC ANALYTICS ====================
  
  /**
   * Leads analytics
   */
  const useLeadsAnalytics = (dateRange?: { start_date: string; end_date: string }) => {
    return useQuery({
      queryKey: queryKeys.analytics.leads(dateRange),
      queryFn: () => analyticsQueryApi.getLeads(dateRange),
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    });
  };

  /**
   * Conversations analytics
   */
  const useConversationsAnalytics = (dateRange?: { start_date: string; end_date: string }) => {
    return useQuery({
      queryKey: queryKeys.analytics.conversations(dateRange),
      queryFn: () => analyticsQueryApi.getConversations(dateRange),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    });
  };

  /**
   * Messages analytics
   */
  const useMessagesAnalytics = (dateRange?: { start_date: string; end_date: string }) => {
    return useQuery({
      queryKey: queryKeys.analytics.messages(dateRange),
      queryFn: () => analyticsQueryApi.getMessages(dateRange),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    });
  };

  /**
   * Performance analytics
   */
  const usePerformanceAnalytics = (dateRange?: { start_date: string; end_date: string }) => {
    return useQuery({
      queryKey: queryKeys.analytics.performance(dateRange),
      queryFn: () => analyticsQueryApi.getPerformance(dateRange),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    });
  };

  // ==================== INFINITE QUERIES ====================
  
  /**
   * Analytics history with infinite scrolling
   */
  const useAnalyticsHistory = (type: 'leads' | 'messages' | 'conversations', 
                                dateRange?: { start_date: string; end_date: string }) => {
    return useQuery({
      queryKey: [...queryKeys.analytics.all, 'history', type, dateRange],
      queryFn: ({ pageParam = 1 }) => 
        analyticsQueryApi.getHistory(type, dateRange, { page: pageParam, limit: 20 }),
      getNextPageParam: (lastPage) => {
        if (lastPage.hasMore) {
          return lastPage.page + 1;
        }
        return undefined;
      },
      getPreviousPageParam: (firstPage) => {
        if (firstPage.page > 1) {
          return firstPage.page - 1;
        }
        return undefined;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
    });
  };

  // ==================== EXPORT FUNCTIONS ====================
  
  /**
   * Export analytics data
   */
  const exportAnalytics = useMutation({
    mutationFn: ({ 
      type, 
      format, 
      dateRange 
    }: { 
      type: string;
      format: 'csv' | 'pdf' | 'excel';
      dateRange?: { start_date: string; end_date: string };
    }) => analyticsQueryApi.exportData(type, format, dateRange),
    onSuccess: (data) => {
      // Trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = `analytics-${Date.now()}.${data.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  });

  // ==================== REAL-TIME UPDATES ====================
  
  /**
   * Setup real-time analytics updates
   */
  const setupRealTimeUpdates = useCallback(() => {
    if (!enableRealtime || typeof window === 'undefined') return;

    try {
      const eventSource = new EventSource('/api/analytics/stream');
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'metric_update':
              // Update dashboard metrics
              queryClient.setQueryData(queryKeys.analytics.dashboard(), (old: any) => ({
                ...old,
                ...data.payload,
              }));
              break;
              
            case 'leads_update':
              // Update leads analytics
              queryClient.invalidateQueries({ queryKey: queryKeys.analytics.leads() });
              break;
              
            case 'messages_update':
              // Update messages analytics
              queryClient.invalidateQueries({ queryKey: queryKeys.analytics.messages() });
              break;
              
            case 'conversations_update':
              // Update conversations analytics
              queryClient.invalidateQueries({ queryKey: queryKeys.analytics.conversations() });
              break;
          }
        } catch (error) {
          console.error('Error processing real-time analytics update:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('Real-time analytics connection error:', error);
      };
      
      return () => eventSource.close();
    } catch (error) {
      console.error('Error setting up real-time analytics:', error);
    }
  }, [enableRealtime, queryClient]);

  // ==================== COMPUTED VALUES ====================
  
  /**
   * Format metrics for display
   */
  const formattedMetrics = useMemo(() => {
    if (!dashboardData) return {};
    
    const formatNumber = (value: number) => {
      return new Intl.NumberFormat('ar-SA').format(value);
    };
    
    const formatPercentage = (value: number) => {
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };
    
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
      }).format(value);
    };
    
    return {
      ...dashboardData,
      metrics: Object.entries(dashboardData.metrics || {}).reduce((acc, [key, metric]: [string, any]) => {
        acc[key] = {
          ...metric,
          formattedValue: formatNumber(metric.value),
          formattedChange: formatPercentage(metric.change),
          formattedCurrency: typeof metric.value === 'number' ? formatCurrency(metric.value) : metric.value,
        };
        return acc;
      }, {} as Record<string, any>),
    };
  }, [dashboardData]);

  /**
   * Get performance insights
   */
  const performanceInsights = useMemo(() => {
    if (!dashboardData?.performance) return [];
    
    const insights: Array<{
      type: 'success' | 'warning' | 'error';
      message: string;
      metric?: string;
      value?: number;
    }> = [];
    
    // Analyze conversion rates
    if (dashboardData.conversionRate < 0.05) {
      insights.push({
        type: 'warning',
        message: 'معدل التحويل منخفض - فكر في تحسين استراتيجية التسويق',
        metric: 'conversionRate',
        value: dashboardData.conversionRate,
      });
    }
    
    // Analyze response time
    if (dashboardData.avgResponseTime > 3600) { // > 1 hour
      insights.push({
        type: 'warning',
        message: 'وقت الاستجابة مرتفع - يمكن تحسين سرعة الاستجابة',
        metric: 'avgResponseTime',
        value: dashboardData.avgResponseTime,
      });
    }
    
    return insights;
  }, [dashboardData]);

  // ==================== CACHE MANAGEMENT ====================
  
  /**
   * Clear analytics cache
   */
  const clearAnalyticsCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: queryKeys.analytics.all });
  }, [queryClient]);

  /**
   * Prefetch analytics data
   */
  const prefetchAnalytics = useCallback(async (dateRange?: { start_date: string; end_date: string }) => {
    const queryKey = queryKeys.analytics.dashboard(dateRange);
    if (!queryClient.getQueryData(queryKey)) {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: () => analyticsQueryApi.getDashboard(dateRange),
        staleTime: 1000 * 60 * 2,
      });
    }
  }, [queryClient]);

  // ==================== RETURN ====================
  
  return {
    // Dashboard data
    dashboardData: formattedMetrics,
    isLoadingDashboard,
    dashboardError,
    refetchDashboard,
    isDashboardStale,
    
    // Specific analytics
    useLeadsAnalytics,
    useConversationsAnalytics,
    useMessagesAnalytics,
    usePerformanceAnalytics,
    
    // History queries
    useAnalyticsHistory,
    
    // Export
    exportAnalytics,
    
    // Real-time
    setupRealTimeUpdates,
    
    // Computed values
    performanceInsights,
    
    // Cache management
    clearAnalyticsCache,
    prefetchAnalytics,
  };
};

// ===============================================
// Dashboard Specific Hook
// ===============================================

/**
 * Hook for dashboard-specific analytics
 */
export const useDashboard = (dateRange?: { start_date: string; end_date: string }) => {
  const { 
    dashboardData, 
    isLoadingDashboard, 
    refetchDashboard,
    performanceInsights,
  } = useEnhancedAnalytics({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    enableRealtime: true,
  });

  /**
   * Get key metrics for dashboard widgets
   */
  const keyMetrics = useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      {
        id: 'totalLeads',
        title: 'إجمالي العملاء المحتملين',
        value: dashboardData.metrics?.totalLeads?.value || 0,
        change: dashboardData.metrics?.totalLeads?.change || 0,
        changeType: (dashboardData.metrics?.totalLeads?.change || 0) >= 0 ? 'increase' : 'decrease',
        format: 'number',
      },
      {
        id: 'conversionRate',
        title: 'معدل التحويل',
        value: dashboardData.metrics?.conversionRate?.value || 0,
        change: dashboardData.metrics?.conversionRate?.change || 0,
        changeType: (dashboardData.metrics?.conversionRate?.change || 0) >= 0 ? 'increase' : 'decrease',
        format: 'percentage',
      },
      {
        id: 'revenue',
        title: 'الإيرادات',
        value: dashboardData.metrics?.revenue?.value || 0,
        change: dashboardData.metrics?.revenue?.change || 0,
        changeType: (dashboardData.metrics?.revenue?.change || 0) >= 0 ? 'increase' : 'decrease',
        format: 'currency',
      },
      {
        id: 'responseTime',
        title: 'متوسط وقت الاستجابة',
        value: dashboardData.metrics?.avgResponseTime?.value || 0,
        change: dashboardData.metrics?.avgResponseTime?.change || 0,
        changeType: (dashboardData.metrics?.avgResponseTime?.change || 0) <= 0 ? 'increase' : 'decrease',
        format: 'time',
      },
    ];
  }, [dashboardData]);

  /**
   * Get chart data for dashboard
   */
  const chartData = useMemo(() => {
    if (!dashboardData?.charts) return {};
    
    return {
      leadsOverTime: dashboardData.charts.leadsOverTime || [],
      conversionFunnel: dashboardData.charts.conversionFunnel || [],
      revenueBySource: dashboardData.charts.revenueBySource || [],
      responseTimeTrend: dashboardData.charts.responseTimeTrend || [],
    };
  }, [dashboardData]);

  /**
   * Get recent activities
   */
  const recentActivities = useMemo(() => {
    if (!dashboardData?.recentActivities) return [];
    
    return dashboardData.recentActivities.slice(0, 10); // Latest 10 activities
  }, [dashboardData]);

  return {
    // Data
    dashboardData,
    keyMetrics,
    chartData,
    recentActivities,
    performanceInsights,
    
    // State
    isLoading: isLoadingDashboard,
    
    // Actions
    refetch: refetchDashboard,
  };
};

// ===============================================
// Export Hook
// ===============================================

/**
 * Hook for exporting analytics data
 */
export const useAnalyticsExport = () => {
  const { exportAnalytics } = useEnhancedAnalytics();

  const exportDashboard = useCallback((format: 'csv' | 'pdf' | 'excel', dateRange?: { start_date: string; end_date: string }) => {
    return exportAnalytics.mutateAsync({
      type: 'dashboard',
      format,
      dateRange,
    });
  }, [exportAnalytics]);

  const exportLeads = useCallback((format: 'csv' | 'pdf' | 'excel', dateRange?: { start_date: string; end_date: string }) => {
    return exportAnalytics.mutateAsync({
      type: 'leads',
      format,
      dateRange,
    });
  }, [exportAnalytics]);

  const exportConversations = useCallback((format: 'csv' | 'pdf' | 'excel', dateRange?: { start_date: string; end_date: string }) => {
    return exportAnalytics.mutateAsync({
      type: 'conversations',
      format,
      dateRange,
    });
  }, [exportAnalytics]);

  return {
    exportAnalytics: exportAnalytics,
    exportDashboard,
    exportLeads,
    exportConversations,
    isExporting: exportAnalytics.isPending,
    exportError: exportAnalytics.error,
  };
};

// ===============================================
// Export all hooks
// ===============================================

export default useEnhancedAnalytics;
