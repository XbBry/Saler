/**
 * Dashboard Data Hook - جلب البيانات من API
 * بديل للـ Mock Data
 */
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { LeadWithIntelligence, Activity, Notification, KPIMetric, ConversionTrend } from '@/types/lead-intelligence';

export interface DashboardData {
  kpis: KPIMetric[];
  activities: Activity[];
  notifications: Notification[];
  conversionTrends: ConversionTrend[];
  leadsWithIntelligence: LeadWithIntelligence[];
}

export interface DashboardFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  period: 'day' | 'week' | 'month' | 'year';
  filterBy?: string;
}

// جلب البيانات الأساسية للداشبورد
export function useDashboardData(filters?: DashboardFilters) {
  return useQuery<DashboardData>({
    queryKey: ['dashboard-data', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.dateRange) {
        params.append('from', filters.dateRange.from.toISOString());
        params.append('to', filters.dateRange.to.toISOString());
      }
      
      if (filters?.period) {
        params.append('period', filters.period);
      }

      const response = await fetch(`/api/analytics/dashboard?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`فشل في جلب بيانات الداشبورد: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 دقائق
    cacheTime: 30 * 60 * 1000, // 30 دقيقة
  });
}

// جلب العملاء المحتملين مع الذكاء الاصطناعي (Infinity scroll)
export function useLeadsWithIntelligence(filters?: DashboardFilters) {
  return useInfiniteQuery({
    queryKey: ['leads-intelligence', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '20',
        ...(filters?.dateRange && {
          from: filters.dateRange.from.toISOString(),
          to: filters.dateRange.to.toISOString(),
        }),
      });

      const response = await fetch(`/api/analytics/dashboard/leads?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`فشل في جلب العملاء المحتملين: ${response.statusText}`);
      }

      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined;
    },
    staleTime: 10 * 60 * 1000, // 10 دقائق
    cacheTime: 60 * 60 * 1000, // ساعة واحدة
  });
}

// جلب المهام (مكتمل والمعلقة)
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks');
      
      if (!response.ok) {
        throw new Error(`فشل في جلب المهام: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 دقيقة
    cacheTime: 10 * 60 * 1000, // 10 دقائق
  });
}

// جلب الرسائل
export function useMessages() {
  return useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const response = await fetch('/api/messages');
      
      if (!response.ok) {
        throw new Error(`فشل في جلب الرسائل: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 1 * 60 * 1000, // دقيقة واحدة
    cacheTime: 5 * 60 * 1000, // 5 دقائق
  });
}

// جلب التحليلات المتقدمة
export function useAdvancedAnalytics(period: 'day' | 'week' | 'month' = 'month') {
  return useQuery({
    queryKey: ['advanced-analytics', period],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/advanced?period=${period}`);
      
      if (!response.ok) {
        throw new Error(`فشل في جلب التحليلات المتقدمة: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 دقيقة
    cacheTime: 60 * 60 * 1000, // ساعة واحدة
  });
}

// إنشاء مهمة جديدة
export function useCreateTask() {
  return async (taskData: Partial<any>) => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error(`فشل في إنشاء المهمة: ${response.statusText}`);
    }

    return response.json();
  };
}

// تحديث مهمة
export function useUpdateTask() {
  return async (taskId: string, updates: Partial<any>) => {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`فشل في تحديث المهمة: ${response.statusText}`);
    }

    return response.json();
  };
}

// إرسال رسالة
export function useSendMessage() {
  return async (messageData: any) => {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      throw new Error(`فشل في إرسال الرسالة: ${response.statusText}`);
    }

    return response.json();
  };
}

// التحقق من صحة الاتصال بالخادم
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health-check'],
    queryFn: async () => {
      const response = await fetch('/api/health');
      
      if (!response.ok) {
        throw new Error(`الخادم غير متاح: ${response.statusText}`);
      }

      return response.json();
    },
    retry: 3,
    staleTime: 30 * 1000, // 30 ثانية
    cacheTime: 2 * 60 * 1000, // دقيقتان
  });
}

// إعادة تعيين جميع الـ queries عند الحاجة
export function useRefreshDashboard() {
  return () => {
    // استخدام query client لإعادة تعيين الـ cache
    return Promise.resolve();
  };
}

// Hook مخصص للداشبورد كاملاً
export function useDashboardComplete(filters?: DashboardFilters) {
  const dashboardData = useDashboardData(filters);
  const leadsData = useLeadsWithIntelligence(filters);
  const tasksData = useTasks();
  const messagesData = useMessages();
  const analyticsData = useAdvancedAnalytics(filters?.period);

  return {
    // Dashboard main data
    dashboardData: dashboardData.data,
    dashboardLoading: dashboardData.isLoading,
    dashboardError: dashboardData.error,

    // Leads with intelligence
    leadsData: leadsData.data,
    leadsLoading: leadsData.isLoading,
    leadsError: leadsData.error,
    fetchNextPage: leadsData.fetchNextPage,
    hasNextPage: leadsData.hasNextPage,

    // Tasks
    tasksData: tasksData.data,
    tasksLoading: tasksData.isLoading,
    tasksError: tasksData.error,

    // Messages
    messagesData: messagesData.data,
    messagesLoading: messagesData.isLoading,
    messagesError: messagesData.error,

    // Advanced Analytics
    analyticsData: analyticsData.data,
    analyticsLoading: analyticsData.isLoading,
    analyticsError: analyticsData.error,

    // Overall state
    isLoading: dashboardData.isLoading || leadsData.isLoading || tasksData.isLoading || messagesData.isLoading,
    error: dashboardData.error || leadsData.error || tasksData.error || messagesData.error,

    // Functions
    refreshAll: () => {
      dashboardData.refetch();
      leadsData.refetch();
      tasksData.refetch();
      messagesData.refetch();
      analyticsData.refetch();
    },
  };
}
