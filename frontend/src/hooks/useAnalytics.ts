/**
 * useAnalytics - Comprehensive Analytics Hook
 * Hook شامل لإدارة وتحليل الإحصائيات مع Real-time updates والفلترة
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { z } from 'zod';
import {
  ChartDataPoint,
  DateRange,
  MetricData,
  ExportOptions,
  DateRangeSchema,
  MetricDataSchema,
  analyticsCache,
  formatNumber,
  calculatePercentageChange,
  transformToChartData,
  groupByTimePeriod,
} from '@/lib/analytics-utils';

// ========================
// Types and Schemas
// ========================

export interface AnalyticsState {
  // Dashboard Metrics
  dashboardMetrics: Record<string, MetricData>;
  
  // Chart Data
  chartsData: Record<string, ChartDataPoint[]>;
  
  // Filters and Settings
  filters: AnalyticsFilters;
  sorting: AnalyticsSorting;
  
  // Date Range
  dateRange: DateRange;
  
  // Loading States
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Error Handling
  error: string | null;
  
  // Export
  isExporting: boolean;
  exportProgress: number;
}

export interface AnalyticsFilters {
  dateRange?: DateRange;
  categories?: string[];
  regions?: string[];
  products?: string[];
  customFilters?: Record<string, any>;
}

export interface AnalyticsSorting {
  field: string;
  direction: 'asc' | 'desc';
  priority?: 'primary' | 'secondary';
}

export interface AnalyticsAPIResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  timestamp: string;
}

export interface AnalyticsConfig {
  autoRefresh: boolean;
  refreshInterval: number;
  enableCaching: boolean;
  cacheTTL: number;
  realTimeEnabled: boolean;
  enableNotifications: boolean;
}

// ========================
// Default Configuration
// ========================

const DEFAULT_CONFIG: AnalyticsConfig = {
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  enableCaching: true,
  cacheTTL: 300000, // 5 minutes
  realTimeEnabled: true,
  enableNotifications: true,
};

// ========================
// Hook Implementation
// ========================

export function useAnalytics(config: Partial<AnalyticsConfig> = {}) {
  // Merge config with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State Management
  const [state, setState] = useState<AnalyticsState>({
    dashboardMetrics: {},
    chartsData: {},
    filters: {},
    sorting: { field: 'date', direction: 'desc' },
    dateRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
    isLoading: false,
    isRefreshing: false,
    error: null,
    isExporting: false,
    exportProgress: 0,
  });
  
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const realTimeSubscriptionRef = useRef<EventSource | null>(null);
  
  // ========================
  // Data Fetching Functions
  // ========================
  
  const fetchDashboardMetrics = useCallback(async (filters?: AnalyticsFilters): Promise<Record<string, MetricData>> => {
    const cacheKey = `dashboard-metrics-${JSON.stringify(filters || {})}`;
    
    // Check cache first
    if (finalConfig.enableCaching && analyticsCache.has(cacheKey)) {
      const cached = analyticsCache.get(cacheKey);
      if (cached) return cached;
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Mock API call - replace with actual API
      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });
      
      if (!response.ok) {
        throw new Error(`فشل في جلب الإحصائيات: ${response.statusText}`);
      }
      
      const result: AnalyticsAPIResponse<Record<string, any>> = await response.json();
      
      // Transform to MetricData format
      const metrics: Record<string, MetricData> = {};
      Object.entries(result.data).forEach(([key, value]: [string, any]) => {
        metrics[key] = {
          value: Number(value.current) || 0,
          change: Number(value.change) || 0,
          changeType: Number(value.change) >= 0 ? 'increase' : 'decrease',
          percentage: Math.abs(Number(value.percentage) || 0),
        };
      });
      
      // Cache the results
      if (finalConfig.enableCaching) {
        analyticsCache.set(cacheKey, metrics, finalConfig.cacheTTL);
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
      return metrics;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [finalConfig.enableCaching, finalConfig.cacheTTL]);
  
  const fetchChartData = useCallback(async (
    chartType: string, 
    filters?: AnalyticsFilters
  ): Promise<ChartDataPoint[]> => {
    const cacheKey = `chart-data-${chartType}-${JSON.stringify(filters || {})}`;
    
    // Check cache first
    if (finalConfig.enableCaching && analyticsCache.has(cacheKey)) {
      const cached = analyticsCache.get(cacheKey);
      if (cached) return cached;
    }
    
    try {
      setState(prev => ({ ...prev, isRefreshing: true, error: null }));
      
      // Mock API call - replace with actual API
      const response = await fetch('/api/analytics/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chartType, 
          filters,
          dateRange: filters?.dateRange || state.dateRange 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`فشل في جلب بيانات الرسم البياني: ${response.statusText}`);
      }
      
      const result: AnalyticsAPIResponse<any[]> = await response.json();
      const chartData = transformToChartData(result.data, 'date', 'value');
      
      // Cache the results
      if (finalConfig.enableCaching) {
        analyticsCache.set(cacheKey, chartData, finalConfig.cacheTTL);
      }
      
      setState(prev => ({ ...prev, isRefreshing: false }));
      return chartData;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في جلب البيانات';
      setState(prev => ({ ...prev, isRefreshing: false, error: errorMessage }));
      throw error;
    }
  }, [finalConfig.enableCaching, finalConfig.cacheTTL, state.dateRange]);
  
  // ========================
  // State Update Functions
  // ========================
  
  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }));
  }, []);
  
  const updateSorting = useCallback((sorting: Partial<AnalyticsSorting>) => {
    setState(prev => ({
      ...prev,
      sorting: { ...prev.sorting, ...sorting },
    }));
  }, []);
  
  const updateDateRange = useCallback((dateRange: DateRange) => {
    try {
      DateRangeSchema.parse(dateRange);
      setState(prev => ({ ...prev, dateRange }));
    } catch (error) {
      console.error('Invalid date range:', error);
    }
  }, []);
  
  // ========================
  // Real-time Updates
  // ========================
  
  const setupRealTimeUpdates = useCallback(() => {
    if (!finalConfig.realTimeEnabled) return;
    
    try {
      // Close existing connection
      if (realTimeSubscriptionRef.current) {
        realTimeSubscriptionRef.current.close();
      }
      
      // Create new connection
      const eventSource = new EventSource('/api/analytics/stream');
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Update dashboard metrics
          if (data.type === 'metric_update') {
            setState(prev => ({
              ...prev,
              dashboardMetrics: {
                ...prev.dashboardMetrics,
                ...data.payload
              }
            }));
          }
          
          // Update chart data
          if (data.type === 'chart_update') {
            setState(prev => ({
              ...prev,
              chartsData: {
                ...prev.chartsData,
                [data.chartType]: data.payload
              }
            }));
          }
          
        } catch (error) {
          console.error('Error processing real-time update:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('Real-time connection error:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'فشل في الاتصال بالـ real-time updates' 
        }));
      };
      
      realTimeSubscriptionRef.current = eventSource;
      
    } catch (error) {
      console.error('Error setting up real-time updates:', error);
    }
  }, [finalConfig.realTimeEnabled]);
  
  // ========================
  // Export Functions
  // ========================
  
  const exportData = useCallback(async (options: ExportOptions) => {
    try {
      setState(prev => ({ ...prev, isExporting: true, exportProgress: 0 }));
      
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...options, 
          filters: state.filters,
          dateRange: state.dateRange 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`فشل في تصدير البيانات: ${response.statusText}`);
      }
      
      // Handle streaming response for progress
      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Update progress
          const progress = JSON.parse(new TextDecoder().decode(value));
          setState(prev => ({ ...prev, exportProgress: progress.percentage }));
        }
      }
      
      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export-${new Date().toISOString().split('T')[0]}.${options.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تصدير البيانات';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isExporting: false, exportProgress: 0 }));
    }
  }, [state.filters, state.dateRange]);
  
  // ========================
  // Refresh Functions
  // ========================
  
  const refreshData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRefreshing: true, error: null }));
      
      // Clear cache
      if (finalConfig.enableCaching) {
        analyticsCache.clear();
      }
      
      // Refetch all data
      const [dashboardMetrics] = await Promise.all([
        fetchDashboardMetrics(state.filters),
      ]);
      
      setState(prev => ({
        ...prev,
        dashboardMetrics,
        isRefreshing: false,
      }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحديث البيانات';
      setState(prev => ({ ...prev, isRefreshing: false, error: errorMessage }));
    }
  }, [fetchDashboardMetrics, finalConfig.enableCaching, state.filters]);
  
  // ========================
  // Memoized Values
  // ========================
  
  const formattedMetrics = useMemo(() => {
    return Object.entries(state.dashboardMetrics).reduce((acc, [key, metric]) => {
      acc[key] = {
        ...metric,
        formattedValue: formatNumber(metric.value),
        formattedChange: formatNumber(metric.change),
      };
      return acc;
    }, {} as Record<string, MetricData & { formattedValue: string; formattedChange: string }>);
  }, [state.dashboardMetrics]);
  
  const sortedChartData = useMemo(() => {
    return Object.entries(state.chartsData).reduce((acc, [chartType, data]) => {
      const sorted = [...data].sort((a, b) => {
        const aValue = a[state.sorting.field as keyof ChartDataPoint] as any;
        const bValue = b[state.sorting.field as keyof ChartDataPoint] as any;
        
        if (state.sorting.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      acc[chartType] = sorted;
      return acc;
    }, {} as Record<string, ChartDataPoint[]>);
  }, [state.chartsData, state.sorting]);
  
  // ========================
  // Effects
  // ========================
  
  // Setup real-time updates
  useEffect(() => {
    setupRealTimeUpdates();
    return () => {
      if (realTimeSubscriptionRef.current) {
        realTimeSubscriptionRef.current.close();
      }
    };
  }, [setupRealTimeUpdates]);
  
  // Auto refresh setup
  useEffect(() => {
    if (finalConfig.autoRefresh && !finalConfig.realTimeEnabled) {
      refreshIntervalRef.current = setInterval(() => {
        refreshData();
      }, finalConfig.refreshInterval);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [finalConfig.autoRefresh, finalConfig.refreshInterval, finalConfig.realTimeEnabled, refreshData]);
  
  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, []); // Only run once on mount
  
  // ========================
  // Public API
  // ========================
  
  return {
    // State
    ...state,
    formattedMetrics,
    sortedChartData,
    
    // Data fetching
    fetchDashboardMetrics,
    fetchChartData,
    
    // State updates
    updateFilters,
    updateSorting,
    updateDateRange,
    
    // Actions
    refreshData,
    exportData,
    
    // Utilities
    clearError: () => setState(prev => ({ ...prev, error: null })),
    clearCache: () => analyticsCache.clear(),
    
    // Configuration
    config: finalConfig,
  };
}

// ========================
// Custom Hooks for Common Use Cases
// ========================

export function useDashboardMetrics(filters?: AnalyticsFilters) {
  const analytics = useAnalytics();
  
  useEffect(() => {
    if (filters) {
      analytics.updateFilters(filters);
    }
  }, [filters, analytics]);
  
  return {
    metrics: analytics.formattedMetrics,
    isLoading: analytics.isLoading,
    error: analytics.error,
    refresh: analytics.refreshData,
  };
}

export function useChartData(chartType: string, filters?: AnalyticsFilters) {
  const analytics = useAnalytics();
  
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await analytics.fetchChartData(chartType, filters);
        setChartData(data);
      } catch (error) {
        console.error(`Error fetching chart data for ${chartType}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [chartType, filters, analytics]);
  
  return {
    data: chartData,
    isLoading,
    error: analytics.error,
    refresh: () => analytics.fetchChartData(chartType, filters),
  };
}