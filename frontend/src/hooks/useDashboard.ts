/**
 * useDashboard - Specialized Dashboard Hook
 * Hook مخصص لإدارة بيانات وعرض الـ dashboard مع الأداء والتحسين
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { z } from 'zod';
import {
  DateRange,
  ChartDataPoint,
  MetricData,
  analyticsCache,
  calculatePercentageChange,
  formatNumber,
  formatCurrency,
  groupByTimePeriod,
  transformToChartData,
} from '@/lib/analytics-utils';
import { useAnalytics } from './useAnalytics';

// ========================
// Types and Schemas
// ========================

export interface DashboardConfig {
  enablePerformanceTracking: boolean;
  enableCustomWidgets: boolean;
  autoRefreshInterval: number;
  showLoadingStates: boolean;
  enableNotifications: boolean;
  maxChartPoints: number;
}

export interface DashboardMetrics {
  // Key Performance Indicators
  totalSales: MetricData;
  totalRevenue: MetricData;
  totalLeads: MetricData;
  conversionRate: MetricData;
  averageDealSize: MetricData;
  customerLifetimeValue: MetricData;
  
  // Additional Metrics
  newCustomers: MetricData;
  repeatCustomers: MetricData;
  customerSatisfaction: MetricData;
  marketShare: MetricData;
  profitMargin: MetricData;
}

export interface ChartWidget {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'donut';
  title: string;
  dataSource: string;
  filters: Record<string, any>;
  timePeriod: 'day' | 'week' | 'month' | 'quarter' | 'year';
  priority: 'high' | 'medium' | 'low';
  position: { x: number; y: number; width: number; height: number };
  isVisible: boolean;
  customConfig?: Record<string, any>;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  dataFetchTime: number;
  renderTime: number;
  cacheHitRate: number;
  apiResponseTime: number;
}

// ========================
// Default Configuration
// ========================

const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  enablePerformanceTracking: true,
  enableCustomWidgets: true,
  autoRefreshInterval: 30000, // 30 seconds
  showLoadingStates: true,
  enableNotifications: true,
  maxChartPoints: 100,
};

// ========================
// Hook Implementation
// ========================

export function useDashboard(config: Partial<DashboardConfig> = {}) {
  // Merge config with defaults
  const finalConfig = { ...DEFAULT_DASHBOARD_CONFIG, ...config };
  
  // State Management
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [charts, setCharts] = useState<Record<string, ChartWidget[]>>({});
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the main analytics hook
  const analytics = useAnalytics({
    autoRefresh: true,
    refreshInterval: finalConfig.autoRefreshInterval,
    enableCaching: true,
  });
  
  // ========================
  // Data Fetching Functions
  // ========================
  
  const fetchDashboardData = useCallback(async (dateRange: DateRange) => {
    const cacheKey = `dashboard-${dateRange.start.getTime()}-${dateRange.end.getTime()}`;
    
    try {
      // Check cache first
      if (analytics.config.enableCaching && analyticsCache.has(cacheKey)) {
        const cached = analyticsCache.get(cacheKey);
        if (cached) {
          setMetrics(cached.metrics);
          setCharts(cached.charts);
          return;
        }
      }
      
      setIsLoading(true);
      setError(null);
      
      const startTime = performance.now();
      
      // Fetch all dashboard data concurrently
      const [
        salesData,
        revenueData,
        leadsData,
        conversionData,
        customerData,
      ] = await Promise.allSettled([
        fetchSalesMetrics(dateRange),
        fetchRevenueMetrics(dateRange),
        fetchLeadsMetrics(dateRange),
        fetchConversionMetrics(dateRange),
        fetchCustomerMetrics(dateRange),
      ]);
      
      const endTime = performance.now();
      
      // Process results
      const dashboardMetrics: DashboardMetrics = {
        totalSales: salesData.status === 'fulfilled' ? salesData.value.totalSales : getDefaultMetric(),
        totalRevenue: revenueData.status === 'fulfilled' ? revenueData.value.totalRevenue : getDefaultMetric(),
        totalLeads: leadsData.status === 'fulfilled' ? leadsData.value.totalLeads : getDefaultMetric(),
        conversionRate: conversionData.status === 'fulfilled' ? conversionData.value.conversionRate : getDefaultMetric(),
        averageDealSize: revenueData.status === 'fulfilled' ? revenueData.value.averageDealSize : getDefaultMetric(),
        customerLifetimeValue: customerData.status === 'fulfilled' ? customerData.value.customerLifetimeValue : getDefaultMetric(),
        newCustomers: customerData.status === 'fulfilled' ? customerData.value.newCustomers : getDefaultMetric(),
        repeatCustomers: customerData.status === 'fulfilled' ? customerData.value.repeatCustomers : getDefaultMetric(),
        customerSatisfaction: customerData.status === 'fulfilled' ? customerData.value.customerSatisfaction : getDefaultMetric(),
        marketShare: salesData.status === 'fulfilled' ? salesData.value.marketShare : getDefaultMetric(),
        profitMargin: revenueData.status === 'fulfilled' ? revenueData.value.profitMargin : getDefaultMetric(),
      };
      
      // Fetch chart widgets data
      const chartWidgets = await fetchChartWidgets(dateRange);
      
      // Update performance metrics
      if (finalConfig.enablePerformanceTracking) {
        setPerformance({
          pageLoadTime: endTime - startTime,
          dataFetchTime: endTime - startTime,
          renderTime: 0, // Will be updated after render
          cacheHitRate: analyticsCache.size() > 0 ? 75 : 0, // Mock calculation
          apiResponseTime: endTime - startTime,
        });
      }
      
      // Cache the results
      if (analytics.config.enableCaching) {
        analyticsCache.set(cacheKey, {
          metrics: dashboardMetrics,
          charts: chartWidgets,
        }, 300000); // 5 minutes cache
      }
      
      setMetrics(dashboardMetrics);
      setCharts(chartWidgets);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في جلب بيانات الـ dashboard';
      setError(errorMessage);
      console.error('Dashboard data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [analytics]);
  
  // ========================
  // Metric Fetching Functions
  // ========================
  
  const fetchSalesMetrics = async (dateRange: DateRange) => {
    // Mock API call - replace with actual API
    const response = await fetch('/api/analytics/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateRange }),
    });
    
    if (!response.ok) {
      throw new Error('فشل في جلب بيانات المبيعات');
    }
    
    const data = await response.json();
    
    return {
      totalSales: {
        value: data.current,
        change: data.change,
        changeType: data.change >= 0 ? 'increase' : 'decrease',
        percentage: Math.abs(data.percentage),
      },
      marketShare: {
        value: data.marketShare || 0,
        change: data.marketShareChange || 0,
        changeType: data.marketShareChange >= 0 ? 'increase' : 'decrease',
        percentage: Math.abs(data.marketShareChange || 0),
      },
    };
  };
  
  const fetchRevenueMetrics = async (dateRange: DateRange) => {
    const response = await fetch('/api/analytics/revenue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateRange }),
    });
    
    if (!response.ok) {
      throw new Error('فشل في جلب بيانات الإيرادات');
    }
    
    const data = await response.json();
    
    return {
      totalRevenue: {
        value: data.current,
        change: data.change,
        changeType: data.change >= 0 ? 'increase' : 'decrease',
        percentage: Math.abs(data.percentage),
      },
      averageDealSize: {
        value: data.averageDealSize,
        change: data.dealSizeChange,
        changeType: data.dealSizeChange >= 0 ? 'increase' : 'decrease',
        percentage: Math.abs(data.dealSizePercentage),
      },
      profitMargin: {
        value: data.profitMargin,
        change: data.marginChange,
        changeType: data.marginChange >= 0 ? 'increase' : 'decrease',
        percentage: Math.abs(data.marginPercentage),
      },
    };
  };
  
  const fetchLeadsMetrics = async (dateRange: DateRange) => {
    const response = await fetch('/api/analytics/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateRange }),
    });
    
    if (!response.ok) {
      throw new Error('فشل في جلب بيانات العملاء المحتملين');
    }
    
    const data = await response.json();
    
    return {
      totalLeads: {
        value: data.current,
        change: data.change,
        changeType: data.change >= 0 ? 'increase' : 'decrease',
        percentage: Math.abs(data.percentage),
      },
    };
  };
  
  const fetchConversionMetrics = async (dateRange: DateRange) => {
    const response = await fetch('/api/analytics/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateRange }),
    });
    
    if (!response.ok) {
      throw new Error('فشل في جلب بيانات معدلات التحويل');
    }
    
    const data = await response.json();
    
    return {
      conversionRate: {
        value: data.rate,
        change: data.change,
        changeType: data.change >= 0 ? 'increase' : 'decrease',
        percentage: Math.abs(data.percentage),
      },
    };
  };
  
  const fetchCustomerMetrics = async (dateRange: DateRange) => {
    const response = await fetch('/api/analytics/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateRange }),
    });
    
    if (!response.ok) {
      throw new Error('فشل في جلب بيانات العملاء');
    }
    
    const data = await response.json();
    
    return {
      customerLifetimeValue: {
        value: data.lifetimeValue,
        change: data.valueChange,
        changeType: data.valueChange >= 0 ? 'increase' : 'decrease',
        percentage: Math.abs(data.valuePercentage),
      },
      newCustomers: {
        value: data.newCustomers,
        change: data.newCustomersChange,
        changeType: data.newCustomersChange >= 0 ? 'increase' : 'decrease',
        percentage: Math.abs(data.newCustomersPercentage),
      },
      repeatCustomers: {
        value: data.repeatCustomers,
        change: data.repeatChange,
        changeType: data.repeatChange >= 0 ? 'increase' : 'decrease',
        percentage: Math.abs(data.repeatPercentage),
      },
      customerSatisfaction: {
        value: data.satisfaction,
        change: data.satisfactionChange,
        changeType: data.satisfactionChange >= 0 ? 'increase' : 'decrease',
        percentage: Math.abs(data.satisfactionPercentage),
      },
    };
  };
  
  const fetchChartWidgets = async (dateRange: DateRange): Promise<Record<string, ChartWidget[]>> => {
    // Mock chart widgets configuration
    return {
      primary: [
        {
          id: 'revenue-trend',
          type: 'line',
          title: 'اتجاه الإيرادات',
          dataSource: 'revenue',
          filters: { dateRange },
          timePeriod: 'month',
          priority: 'high',
          position: { x: 0, y: 0, width: 6, height: 4 },
          isVisible: true,
        },
        {
          id: 'sales-performance',
          type: 'bar',
          title: 'أداء المبيعات',
          dataSource: 'sales',
          filters: { dateRange },
          timePeriod: 'day',
          priority: 'high',
          position: { x: 6, y: 0, width: 6, height: 4 },
          isVisible: true,
        },
      ],
      secondary: [
        {
          id: 'leads-conversion',
          type: 'area',
          title: 'تحويل العملاء المحتملين',
          dataSource: 'conversion',
          filters: { dateRange },
          timePeriod: 'week',
          priority: 'medium',
          position: { x: 0, y: 4, width: 4, height: 3 },
          isVisible: true,
        },
        {
          id: 'customer-breakdown',
          type: 'pie',
          title: 'توزيع العملاء',
          dataSource: 'customers',
          filters: { dateRange },
          timePeriod: 'month',
          priority: 'medium',
          position: { x: 4, y: 4, width: 4, height: 3 },
          isVisible: true,
        },
      ],
      tertiary: [
        {
          id: 'regional-performance',
          type: 'bar',
          title: 'الأداء الإقليمي',
          dataSource: 'regional',
          filters: { dateRange },
          timePeriod: 'month',
          priority: 'low',
          position: { x: 8, y: 4, width: 4, height: 3 },
          isVisible: true,
        },
      ],
    };
  };
  
  const getDefaultMetric = (): MetricData => ({
    value: 0,
    change: 0,
    changeType: 'neutral',
    percentage: 0,
  });
  
  // ========================
  // Chart Data Management
  // ========================
  
  const getChartData = useCallback(async (widget: ChartWidget) => {
    try {
      const cacheKey = `chart-${widget.id}`;
      
      // Check cache
      if (analytics.config.enableCaching && analyticsCache.has(cacheKey)) {
        return analyticsCache.get(cacheKey);
      }
      
      // Fetch data based on widget configuration
      const response = await fetch('/api/analytics/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSource: widget.dataSource,
          filters: widget.filters,
          timePeriod: widget.timePeriod,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`فشل في جلب بيانات الرسم البياني: ${widget.title}`);
      }
      
      const rawData = await response.json();
      const chartData = transformToChartData(rawData, 'date', 'value');
      
      // Apply time period grouping if needed
      const groupedData = widget.timePeriod !== 'day' 
        ? groupByTimePeriod(rawData, 'date', widget.timePeriod, 'value')
        : chartData;
      
      // Limit data points
      const limitedData = groupedData.slice(-finalConfig.maxChartPoints);
      
      // Cache the results
      if (analytics.config.enableCaching) {
        analyticsCache.set(cacheKey, limitedData, 300000);
      }
      
      return limitedData;
      
    } catch (error) {
      console.error(`Error fetching chart data for ${widget.id}:`, error);
      return [];
    }
  }, [analytics.config.enableCaching, finalConfig.maxChartPoints]);
  
  // ========================
  // Widget Management
  // ========================
  
  const updateWidgetVisibility = useCallback((widgetId: string, isVisible: boolean) => {
    setCharts(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(category => {
        updated[category] = updated[category].map(widget =>
          widget.id === widgetId ? { ...widget, isVisible } : widget
        );
      });
      return updated;
    });
  }, []);
  
  const updateWidgetPosition = useCallback((
    widgetId: string, 
    position: { x: number; y: number; width: number; height: number }
  ) => {
    setCharts(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(category => {
        updated[category] = updated[category].map(widget =>
          widget.id === widgetId ? { ...widget, position } : widget
        );
      });
      return updated;
    });
  }, []);
  
  const addCustomWidget = useCallback((widget: Omit<ChartWidget, 'id'>) => {
    const newWidget: ChartWidget = {
      ...widget,
      id: `custom-${Date.now()}`,
    };
    
    setCharts(prev => ({
      ...prev,
      custom: [...(prev.custom || []), newWidget],
    }));
  }, []);
  
  const removeWidget = useCallback((widgetId: string) => {
    setCharts(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(category => {
        updated[category] = updated[category].filter(widget => widget.id !== widgetId);
      });
      return updated;
    });
  }, []);
  
  // ========================
  // Memoized Values
  // ========================
  
  const formattedMetrics = useMemo(() => {
    if (!metrics) return null;
    
    return {
      totalSales: {
        ...metrics.totalSales,
        formattedValue: formatNumber(metrics.totalSales.value),
        formattedChange: formatNumber(metrics.totalSales.change),
      },
      totalRevenue: {
        ...metrics.totalRevenue,
        formattedValue: formatCurrency(metrics.totalRevenue.value),
        formattedChange: formatCurrency(metrics.totalRevenue.change),
      },
      totalLeads: {
        ...metrics.totalLeads,
        formattedValue: formatNumber(metrics.totalLeads.value),
        formattedChange: formatNumber(metrics.totalLeads.change),
      },
      conversionRate: {
        ...metrics.conversionRate,
        formattedValue: `${metrics.conversionRate.value.toFixed(1)}%`,
        formattedChange: `${metrics.conversionRate.change.toFixed(1)}%`,
      },
      averageDealSize: {
        ...metrics.averageDealSize,
        formattedValue: formatCurrency(metrics.averageDealSize.value),
        formattedChange: formatCurrency(metrics.averageDealSize.change),
      },
      customerLifetimeValue: {
        ...metrics.customerLifetimeValue,
        formattedValue: formatCurrency(metrics.customerLifetimeValue.value),
        formattedChange: formatCurrency(metrics.customerLifetimeValue.change),
      },
      newCustomers: {
        ...metrics.newCustomers,
        formattedValue: formatNumber(metrics.newCustomers.value),
        formattedChange: formatNumber(metrics.newCustomers.change),
      },
      repeatCustomers: {
        ...metrics.repeatCustomers,
        formattedValue: formatNumber(metrics.repeatCustomers.value),
        formattedChange: formatNumber(metrics.repeatCustomers.change),
      },
      customerSatisfaction: {
        ...metrics.customerSatisfaction,
        formattedValue: `${metrics.customerSatisfaction.value.toFixed(1)}/5`,
        formattedChange: `${metrics.customerSatisfaction.change.toFixed(1)}/5`,
      },
      marketShare: {
        ...metrics.marketShare,
        formattedValue: `${metrics.marketShare.value.toFixed(1)}%`,
        formattedChange: `${metrics.marketShare.change.toFixed(1)}%`,
      },
      profitMargin: {
        ...metrics.profitMargin,
        formattedValue: `${metrics.profitMargin.value.toFixed(1)}%`,
        formattedChange: `${metrics.profitMargin.change.toFixed(1)}%`,
      },
    };
  }, [metrics]);
  
  const visibleWidgets = useMemo(() => {
    if (!charts) return {};
    
    return Object.entries(charts).reduce((acc, [category, widgets]) => {
      acc[category] = widgets.filter(widget => widget.isVisible);
      return acc;
    }, {} as Record<string, ChartWidget[]>);
  }, [charts]);
  
  // ========================
  // Effects
  // ========================
  
  // Fetch dashboard data when date range changes
  useEffect(() => {
    fetchDashboardData(selectedDateRange);
  }, [selectedDateRange, fetchDashboardData]);
  
  // ========================
  // Public API
  // ========================
  
  return {
    // State
    metrics: formattedMetrics,
    charts: visibleWidgets,
    allCharts: charts,
    selectedDateRange,
    performance,
    isLoading: isLoading || analytics.isLoading,
    isRefreshing: isRefreshing || analytics.isRefreshing,
    error: error || analytics.error,
    
    // Actions
    setDateRange: setSelectedDateRange,
    refreshData: () => fetchDashboardData(selectedDateRange),
    updateWidgetVisibility,
    updateWidgetPosition,
    addCustomWidget,
    removeWidget,
    
    // Chart Data
    getChartData,
    
    // Utils
    clearError: () => {
      setError(null);
      analytics.clearError();
    },
  };
}

// ========================
// Custom Hooks for Specific Metrics
// ========================

export function useSalesMetrics(dateRange: DateRange) {
  const dashboard = useDashboard();
  
  useEffect(() => {
    dashboard.setDateRange(dateRange);
  }, [dateRange, dashboard]);
  
  return {
    totalSales: dashboard.metrics?.totalSales,
    marketShare: dashboard.metrics?.marketShare,
    isLoading: dashboard.isLoading,
    error: dashboard.error,
    refresh: dashboard.refreshData,
  };
}

export function useRevenueMetrics(dateRange: DateRange) {
  const dashboard = useDashboard();
  
  useEffect(() => {
    dashboard.setDateRange(dateRange);
  }, [dateRange, dashboard]);
  
  return {
    totalRevenue: dashboard.metrics?.totalRevenue,
    averageDealSize: dashboard.metrics?.averageDealSize,
    profitMargin: dashboard.metrics?.profitMargin,
    isLoading: dashboard.isLoading,
    error: dashboard.error,
    refresh: dashboard.refreshData,
  };
}