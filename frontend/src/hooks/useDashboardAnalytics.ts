/**
 * useDashboardAnalytics - Advanced Dashboard Analytics Hook
 * Hook متقدم لتحليلات لوحة التحكم مع KPI tracking وتوقعات ذكية
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

// Types
export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  target?: number;
  unit?: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  trend: Array<{ date: string; value: number }>;
  description?: string;
  category: 'performance' | 'revenue' | 'customer' | 'engagement' | 'conversion';
}

export interface DashboardAnalytics {
  kpis: KPIMetric[];
  performance: {
    leads_per_day: number;
    conversations_per_day: number;
    messages_per_day: number;
    conversion_rate: number;
    response_time_avg: number;
    customer_satisfaction: number;
  };
  trends: {
    leads: Array<{ date: string; count: number }>;
    conversations: Array<{ date: string; count: number }>;
    messages: Array<{ date: string; count: number }>;
    revenue: Array<{ date: string; amount: number }>;
  };
  segments: {
    by_source: Record<string, number>;
    by_status: Record<string, number>;
    by_temperature: Record<string, number>;
    by_priority: Record<string, number>;
  };
  forecasts: {
    leads_next_week: number;
    revenue_next_month: number;
    conversion_trend: 'up' | 'down' | 'stable';
    confidence_score: number;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'critical' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
  }>;
  realTime: {
    active_users: number;
    messages_per_minute: number;
    new_leads_today: number;
    system_health: 'healthy' | 'warning' | 'critical';
  };
}

export interface AnalyticsFilters {
  dateRange?: {
    from: string;
    to: string;
    preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  };
  segments?: {
    channels?: string[];
    sources?: string[];
    priorities?: string[];
    temperatures?: string[];
  };
  comparison?: {
    enabled: boolean;
    period: 'previous_period' | 'previous_year' | 'custom';
    start_date?: string;
    end_date?: string;
  };
  granularity?: 'hour' | 'day' | 'week' | 'month';
  viewType?: 'overview' | 'detailed' | 'custom';
}

// Validation Schema
const analyticsFiltersSchema = z.object({
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
    preset: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']).optional()
  }).optional(),
  segments: z.object({
    channels: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional(),
    priorities: z.array(z.string()).optional(),
    temperatures: z.array(z.string()).optional()
  }).optional(),
  comparison: z.object({
    enabled: z.boolean(),
    period: z.enum(['previous_period', 'previous_year', 'custom']),
    start_date: z.string().optional(),
    end_date: z.string().optional()
  }).optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional(),
  viewType: z.enum(['overview', 'detailed', 'custom']).optional()
});

const exportOptionsSchema = z.object({
  format: z.enum(['pdf', 'excel', 'csv', 'json']),
  includeCharts: z.boolean().optional(),
  includeRawData: z.boolean().optional(),
  dateRange: z.object({
    from: z.string(),
    to: z.string()
  }).optional(),
  filters: analyticsFiltersSchema.optional()
});

// Query Keys
const queryKeys = {
  analytics: (filters: AnalyticsFilters) => ['dashboard', 'analytics', filters],
  kpis: (filters: AnalyticsFilters) => ['dashboard', 'kpis', filters],
  trends: (filters: AnalyticsFilters) => ['dashboard', 'trends', filters],
  segments: (filters: AnalyticsFilters) => ['dashboard', 'segments', filters],
  forecasts: (filters: AnalyticsFilters) => ['dashboard', 'forecasts', filters],
  alerts: () => ['dashboard', 'alerts'],
  realTime: () => ['dashboard', 'realtime']
};

interface UseDashboardAnalyticsOptions {
  enableRealTime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableForecasting?: boolean;
  enableAlerts?: boolean;
}

export function useDashboardAnalytics(options: UseDashboardAnalyticsOptions = {}) {
  const queryClient = useQueryClient();
  const {
    enableRealTime = true,
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableForecasting = true,
    enableAlerts = true
  } = options;

  // State
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
      preset: 'month'
    },
    granularity: 'day',
    viewType: 'overview'
  });

  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Memoized query keys
  const analyticsKey = useMemo(() => queryKeys.analytics(filters), [filters]);
  const kpisKey = useMemo(() => queryKeys.kpis(filters), [filters]);
  const trendsKey = useMemo(() => queryKeys.trends(filters), [filters]);
  const segmentsKey = useMemo(() => queryKeys.segments(filters), [filters]);
  const forecastsKey = useMemo(() => queryKeys.forecasts(filters), [filters]);

  // Fetch Dashboard Analytics
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: analyticsKey,
    queryFn: async () => {
      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      });

      if (!response.ok) {
        throw new Error(`فشل في تحميل تحليلات لوحة التحكم: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data as DashboardAnalytics;
    },
    staleTime: 20000, // 20 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('4')) return false;
      return failureCount < 3;
    }
  });

  // Fetch KPIs
  const {
    data: kpisData,
    isLoading: kpisLoading,
    error: kpisError,
    refetch: refetchKPIs
  } = useQuery({
    queryKey: kpisKey,
    queryFn: async () => {
      const response = await fetch('/api/analytics/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      });

      if (!response.ok) {
        throw new Error(`فشل في تحميل المؤشرات: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 30000,
    enabled: true
  });

  // Fetch Alerts
  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts
  } = useQuery({
    queryKey: queryKeys.alerts(),
    queryFn: async () => {
      const response = await fetch('/api/alerts?unread=true');
      
      if (!response.ok) {
        throw new Error(`فشل في تحميل التنبيهات: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 10000,
    enabled: enableAlerts,
    refetchInterval: enableRealTime ? 15000 : false // Check alerts every 15 seconds
  });

  // Real-time Updates
  useEffect(() => {
    if (!enableRealTime) return;

    const interval = setInterval(() => {
      if (autoRefresh) {
        queryClient.invalidateQueries({ queryKey: queryKeys.realTime() });
        if (autoRefresh) {
          refetchAnalytics();
        }
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableRealTime, autoRefresh, refreshInterval, queryClient, refetchAnalytics]);

  // Real-time metrics
  const {
    data: realTimeData,
    isLoading: realTimeLoading
  } = useQuery({
    queryKey: queryKeys.realTime(),
    queryFn: async () => {
      const response = await fetch('/api/analytics/realtime');
      
      if (!response.ok) {
        throw new Error(`فشل في تحميل البيانات الآنية: ${response.statusText}`);
      }

      return response.json();
    },
    refetchInterval: enableRealTime ? 5000 : false, // Update every 5 seconds
    staleTime: 2000
  });

  // Mutations
  const markAlertAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts/${alertId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });

      if (!response.ok) {
        throw new Error(`فشل في تحديث حالة التنبيه: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
    }
  });

  const exportAnalyticsMutation = useMutation({
    mutationFn: async (exportOptions: z.infer<typeof exportOptionsSchema>) => {
      const validatedOptions = exportOptionsSchema.parse(exportOptions);
      
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validatedOptions,
          filters
        })
      });

      if (!response.ok) {
        throw new Error(`فشل في تصدير التحليلات: ${response.statusText}`);
      }

      return response.blob();
    },
    onError: (error) => {
      console.error('خطأ في تصدير التحليلات:', error);
    }
  });

  const refreshDataMutation = useMutation({
    mutationFn: async () => {
      const promises = [
        refetchAnalytics(),
        refetchKPIs(),
        refetchAlerts()
      ];
      
      await Promise.allSettled(promises);
    },
    onError: (error) => {
      console.error('خطأ في تحديث البيانات:', error);
    }
  });

  // Handlers
  const handleFilterChange = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleDateRangeChange = useCallback((dateRange: {
    from: string;
    to: string;
    preset?: string;
  }) => {
    setFilters(prev => ({
      ...prev,
      dateRange
    }));
  }, []);

  const handleKPISelect = useCallback((kpiId: string | null) => {
    setSelectedKPI(kpiId);
  }, []);

  const handleExport = useCallback(async (format: 'pdf' | 'excel' | 'csv' | 'json', options?: {
    includeCharts?: boolean;
    includeRawData?: boolean;
  }) => {
    const exportOptions = {
      format,
      includeCharts: options?.includeCharts || true,
      includeRawData: options?.includeRawData || false,
      dateRange: filters.dateRange
    };

    const blob = await exportAnalyticsMutation.mutateAsync(exportOptions);
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [exportAnalyticsMutation, filters.dateRange]);

  const handleMarkAlertAsRead = useCallback((alertId: string) => {
    markAlertAsReadMutation.mutate(alertId);
  }, [markAlertAsReadMutation]);

  const handleRefreshAll = useCallback(() => {
    refreshDataMutation.mutate();
  }, [refreshDataMutation]);

  // Computed values
  const isLoading = analyticsLoading || kpisLoading || alertsLoading || realTimeLoading;
  const error = analyticsError || kpisError || alertsError;

  // KPI Categories
  const kpisByCategory = useMemo(() => {
    if (!kpisData?.data) return {};
    
    return kpisData.data.reduce((acc: Record<string, KPIMetric[]>, kpi: KPIMetric) => {
      if (!acc[kpi.category]) acc[kpi.category] = [];
      acc[kpi.category].push(kpi);
      return acc;
    }, {});
  }, [kpisData]);

  // Summary Statistics
  const summaryStats = useMemo(() => {
    if (!analyticsData) return null;

    return {
      totalLeads: analyticsData.kpis.find(kpi => kpi.name === 'إجمالي العملاء المحتملين')?.value || 0,
      conversionRate: analyticsData.kpis.find(kpi => kpi.name === 'معدل التحويل')?.value || 0,
      avgResponseTime: analyticsData.performance.response_time_avg,
      totalRevenue: analyticsData.kpis.find(kpi => kpi.name === 'إجمالي الإيرادات')?.value || 0,
      activeUsers: realTimeData?.active_users || 0,
      unreadAlerts: (alertsData?.alerts || []).filter((alert: any) => !alert.isRead).length
    };
  }, [analyticsData, kpisData, realTimeData, alertsData]);

  // Alert Categories
  const alertsByType = useMemo(() => {
    if (!alertsData?.alerts) return {};
    
    return alertsData.alerts.reduce((acc: Record<string, any[]>, alert: any) => {
      if (!acc[alert.type]) acc[alert.type] = [];
      acc[alert.type].push(alert);
      return acc;
    }, {});
  }, [alertsData]);

  return {
    // Data
    analytics: analyticsData,
    kpis: kpisData?.data || [],
    alerts: alertsData?.alerts || [],
    realTime: realTimeData,
    
    // Loading states
    analyticsLoading,
    kpisLoading,
    alertsLoading,
    realTimeLoading,
    isLoading,
    
    // Errors
    analyticsError,
    kpisError,
    alertsError,
    error,
    
    // State
    filters,
    selectedKPI,
    showComparison,
    
    // Computed values
    kpisByCategory,
    summaryStats,
    alertsByType,
    
    // Actions
    handleFilterChange,
    handleDateRangeChange,
    handleKPISelect,
    handleExport,
    handleMarkAlertAsRead,
    handleRefreshAll,
    
    // Mutations
    markAlertAsRead: markAlertAsReadMutation.mutate,
    exportAnalytics: handleExport,
    refreshData: handleRefreshAll,
    
    // Mutation states
    isMarkingAlertAsRead: markAlertAsReadMutation.isPending,
    isExporting: exportAnalyticsMutation.isPending,
    isRefreshing: refreshDataMutation.isPending,
    
    // Options
    enableRealTime,
    autoRefresh,
    refreshInterval,
    enableForecasting,
    enableAlerts,
    
    // Utilities
    refetchAnalytics,
    refetchKPIs,
    refetchAlerts
  };
}