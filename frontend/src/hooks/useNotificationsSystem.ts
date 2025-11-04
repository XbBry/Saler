/**
 * useNotificationsSystem - Comprehensive Notifications Management Hook
 * Hook شامل لإدارة جميع أنواع الإشعارات مع تخصيص متقدم وذكاء اصطناعي
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

// Types
export interface NotificationPreferences {
  user_id: string;
  channels: {
    email: {
      enabled: boolean;
      frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
      quiet_hours: {
        enabled: boolean;
        start: string; // HH:mm format
        end: string;   // HH:mm format
        timezone: string;
      };
    };
    push: {
      enabled: boolean;
      frequency: 'immediate' | 'batched';
      mobile_enabled: boolean;
      desktop_enabled: boolean;
    };
    sms: {
      enabled: boolean;
      priority_only: boolean;
      emergency_only: boolean;
    };
    in_app: {
      enabled: boolean;
      show_toasts: boolean;
      sound_enabled: boolean;
      badge_count: boolean;
    };
  };
  categories: {
    [key: string]: {
      enabled: boolean;
      priority: 'low' | 'medium' | 'high' | 'critical';
      keywords: string[];
      mute_keywords: string[];
    };
  };
  filters: {
    time_restrictions: {
      enabled: boolean;
      allowed_days: number[]; // 0-6 (Sunday to Saturday)
      allowed_hours: { start: string; end: string };
    };
    language: {
      primary: string;
      fallback: string;
    };
    privacy: {
      hide_sensitive_data: boolean;
      hide_personal_info: boolean;
    };
  };
  ai_personalization: {
    enabled: boolean;
    learning_rate: number; // 0-1
    adaptation_enabled: boolean;
    context_awareness: boolean;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  category: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'promotion';
  content: {
    title: string;
    body: string;
    variables: string[];
  };
  personalization: {
    dynamic_content: boolean;
    ai_generated: boolean;
    context_based: boolean;
    user_history_influenced: boolean;
  };
  channels: string[];
  timing: {
    immediate: boolean;
    scheduled: boolean;
    recurring: boolean;
    delay_options: number[]; // in minutes
  };
  targeting: {
    user_segments: string[];
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
  ai_rules: {
    smart_scheduling: boolean;
    frequency_control: boolean;
    relevance_scoring: boolean;
    spam_prevention: boolean;
  };
  created_at: string;
  updated_at: string;
  is_active: boolean;
  performance: {
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    satisfaction_score: number;
  };
}

export interface NotificationAnalytics {
  overview: {
    total_sent: number;
    total_delivered: number;
    total_opened: number;
    total_clicked: number;
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    satisfaction_score: number;
  };
  trends: {
    daily: Array<{ date: string; sent: number; opened: number; clicked: number }>;
    hourly: Array<{ hour: number; opens: number; clicks: number }>;
    by_category: Array<{ category: string; count: number; avg_score: number }>;
    by_channel: Array<{ channel: string; engagement: number; opt_out_rate: number }>;
  };
  user_behavior: {
    opt_out_rate: number;
    engagement_trend: 'increasing' | 'stable' | 'decreasing';
    preferred_channels: string[];
    peak_activity_hours: number[];
    spam_reports: number;
  };
  ai_performance: {
    relevance_accuracy: number;
    timing_optimization_score: number;
    personalization_effectiveness: number;
    spam_prevention_success_rate: number;
  };
  predictions: {
    next_week_volume: number;
    engagement_forecast: number;
    churn_risk: number;
    optimization_opportunities: string[];
  };
}

export interface SmartNotification {
  id: string;
  type: 'lead_alert' | 'task_reminder' | 'deadline_warning' | 'opportunity' | 'system_alert' | 'personal_insight';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  urgency_score: number; // 0-100
  relevance_score: number; // 0-100
  ai_generated: boolean;
  context: {
    user_id: string;
    lead_id?: string;
    opportunity_id?: string;
    task_id?: string;
    action_required: boolean;
    deadline?: string;
    related_entities: string[];
  };
  personalization: {
    tone: 'formal' | 'casual' | 'friendly' | 'professional';
    length: 'short' | 'medium' | 'detailed';
    include_suggestions: boolean;
    include_links: boolean;
    include_attachments: boolean;
  };
  timing: {
    immediate: boolean;
    scheduled_for?: string;
    recurring?: {
      pattern: 'daily' | 'weekly' | 'monthly';
      interval: number;
    };
    quiet_hours_respected: boolean;
  };
  channels: string[];
  ai_insights: {
    recommended_action: string;
    predicted_impact: 'low' | 'medium' | 'high';
    related_opportunities: string[];
    follow_up_suggestions: string[];
  };
  created_at: string;
  expires_at?: string;
  read_at?: string;
  action_taken?: string;
}

// Validation Schema
const preferencesSchema = z.object({
  channels: z.object({
    email: z.object({
      enabled: z.boolean(),
      frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']),
      quiet_hours: z.object({
        enabled: z.boolean(),
        start: z.string(),
        end: z.string(),
        timezone: z.string()
      })
    }),
    push: z.object({
      enabled: z.boolean(),
      frequency: z.enum(['immediate', 'batched']),
      mobile_enabled: z.boolean(),
      desktop_enabled: z.boolean()
    }),
    sms: z.object({
      enabled: z.boolean(),
      priority_only: z.boolean(),
      emergency_only: z.boolean()
    }),
    in_app: z.object({
      enabled: z.boolean(),
      show_toasts: z.boolean(),
      sound_enabled: z.boolean(),
      badge_count: z.boolean()
    })
  }),
  categories: z.record(z.object({
    enabled: z.boolean(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    keywords: z.array(z.string()),
    mute_keywords: z.array(z.string())
  })),
  filters: z.object({
    time_restrictions: z.object({
      enabled: z.boolean(),
      allowed_days: z.array(z.number().min(0).max(6)),
      allowed_hours: z.object({
        start: z.string(),
        end: z.string()
      })
    }),
    language: z.object({
      primary: z.string(),
      fallback: z.string()
    }),
    privacy: z.object({
      hide_sensitive_data: z.boolean(),
      hide_personal_info: z.boolean()
    })
  }),
  ai_personalization: z.object({
    enabled: z.boolean(),
    learning_rate: z.number().min(0).max(1),
    adaptation_enabled: z.boolean(),
    context_awareness: z.boolean()
  })
});

// Query Keys
const queryKeys = {
  preferences: (userId: string) => ['notifications', 'preferences', userId],
  templates: (filters: any) => ['notifications', 'templates', filters],
  analytics: (filters: any) => ['notifications', 'analytics', filters],
  smart_notifications: (filters: any) => ['notifications', 'smart', filters],
  delivery_status: (notificationId: string) => ['notifications', 'delivery', notificationId]
};

interface UseNotificationsSystemOptions {
  userId: string;
  enableAI?: boolean;
  enableRealTime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useNotificationsSystem(options: UseNotificationsSystemOptions) {
  const queryClient = useQueryClient();
  const {
    userId,
    enableAI = true,
    enableRealTime = true,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  // State
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priority: [] as string[],
    channels: [] as string[],
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    },
    unread_only: false,
    action_required_only: false
  });

  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'dashboard'>('list');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'relevance'>('priority');
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  // Memoized query keys
  const preferencesKey = useMemo(() => queryKeys.preferences(userId), [userId]);
  const templatesKey = useMemo(() => queryKeys.templates(filters), [filters]);
  const analyticsKey = useMemo(() => queryKeys.analytics(filters), [filters]);
  const smartNotificationsKey = useMemo(() => queryKeys.smart_notifications(filters), [filters]);

  // Fetch User Preferences
  const {
    data: preferencesData,
    isLoading: preferencesLoading,
    error: preferencesError,
    refetch: refetchPreferences
  } = useQuery({
    queryKey: preferencesKey,
    queryFn: async () => {
      const response = await fetch(`/api/notifications/preferences/${userId}`);
      
      if (!response.ok) {
        throw new Error(`فشل في تحميل تفضيلات الإشعارات: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 300000, // 5 minutes
    retry: 3
  });

  // Fetch Templates
  const {
    data: templatesData,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates
  } = useQuery({
    queryKey: templatesKey,
    queryFn: async () => {
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`/api/notifications/templates?${params}`);
      
      if (!response.ok) {
        throw new Error(`فشل في تحميل قوالب الإشعارات: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 600000, // 10 minutes - templates don't change often
    retry: 2
  });

  // Fetch Smart Notifications
  const {
    data: smartNotificationsData,
    isLoading: smartNotificationsLoading,
    error: smartNotificationsError,
    refetch: refetchSmartNotifications
  } = useQuery({
    queryKey: smartNotificationsKey,
    queryFn: async () => {
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`/api/notifications/smart?${params}`);
      
      if (!response.ok) {
        throw new Error(`فشل في تحميل الإشعارات الذكية: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    enabled: enableAI
  });

  // Fetch Analytics
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: analyticsKey,
    queryFn: async () => {
      const response = await fetch('/api/notifications/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, userId })
      });

      if (!response.ok) {
        throw new Error(`فشل في تحميل تحليلات الإشعارات: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 300000, // 5 minutes
    refetchInterval: enableRealTime && autoRefresh ? 120000 : false // 2 minutes
  });

  // Real-time updates for notifications
  useEffect(() => {
    if (!enableRealTime) return;

    const interval = setInterval(() => {
      if (autoRefresh) {
        queryClient.invalidateQueries({ queryKey: ['notifications', 'smart'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'analytics'] });
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableRealTime, autoRefresh, refreshInterval, queryClient]);

  // Mutations
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      const validatedPreferences = preferencesSchema.parse(preferences);
      
      const response = await fetch(`/api/notifications/preferences/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedPreferences)
      });

      if (!response.ok) {
        throw new Error(`فشل في تحديث التفضيلات: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKey });
    },
    onError: (error) => {
      console.error('خطأ في تحديث تفضيلات الإشعارات:', error);
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read_at: new Date().toISOString() })
      });

      if (!response.ok) {
        throw new Error(`فشل في تحديد الإشعار كمقروء: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartNotificationsKey });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error(`فشل في تحديد جميع الإشعارات كمقروءة: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartNotificationsKey });
    }
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async ({
      templateId,
      recipients,
      personalization
    }: {
      templateId: string;
      recipients: string[];
      personalization?: any;
    }) => {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          recipients,
          personalization,
          ai_enhanced: enableAI
        })
      });

      if (!response.ok) {
        throw new Error(`فشل في إرسال الإشعار: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartNotificationsKey });
      queryClient.invalidateQueries({ queryKey: analyticsKey });
    }
  });

  const snoozeNotificationMutation = useMutation({
    mutationFn: async ({
      notificationId,
      duration
    }: {
      notificationId: string;
      duration: number; // in minutes
    }) => {
      const response = await fetch(`/api/notifications/${notificationId}/snooze`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snooze_until: new Date(Date.now() + duration * 60000).toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`فشل في تأجيل الإشعار: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartNotificationsKey });
    }
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async (category: string) => {
      const response = await fetch(`/api/notifications/unsubscribe/${category}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error(`فشل في إلغاء الاشتراك: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKey });
    }
  });

  // Handlers
  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
  }, []);

  const handleViewModeChange = useCallback((newViewMode: typeof viewMode) => {
    setViewMode(newViewMode);
  }, []);

  const handleNotificationSelect = useCallback((notificationId: string | null) => {
    setSelectedNotification(notificationId);
  }, []);

  const handleBulkActions = useCallback(async (action: string, notificationIds: string[]) => {
    switch (action) {
      case 'mark_read':
        await Promise.all(
          notificationIds.map(id => markAsReadMutation.mutateAsync(id))
        );
        break;
      case 'snooze_1h':
        await Promise.all(
          notificationIds.map(id => snoozeNotificationMutation.mutateAsync({ notificationId: id, duration: 60 }))
        );
        break;
      case 'snooze_1d':
        await Promise.all(
          notificationIds.map(id => snoozeNotificationMutation.mutateAsync({ notificationId: id, duration: 1440 }))
        );
        break;
      case 'unsubscribe_category':
        const category = prompt('أدخل اسم الفئة لإلغاء الاشتراك:');
        if (category) {
          await unsubscribeMutation.mutateAsync(category);
        }
        break;
      default:
        console.warn(`Unknown bulk action: ${action}`);
    }
  }, [markAsReadMutation, snoozeNotificationMutation, unsubscribeMutation]);

  const handleExportAnalytics = useCallback(async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await fetch('/api/notifications/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          format,
          filters,
          userId,
          includeRawData: true,
          includeCharts: true
        })
      });

      if (!response.ok) {
        throw new Error(`فشل في تصدير تحليلات الإشعارات: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notifications-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('خطأ في تصدير تحليلات الإشعارات:', error);
      throw error;
    }
  }, [filters, userId]);

  // Computed values
  const isLoading = preferencesLoading || templatesLoading || smartNotificationsLoading || analyticsLoading;
  const error = preferencesError || templatesError || smartNotificationsError || analyticsError;

  // Smart notifications with computed scores
  const enrichedNotifications = useMemo(() => {
    if (!smartNotificationsData?.notifications) return [];
    
    return smartNotificationsData.notifications
      .map((notification: SmartNotification) => ({
        ...notification,
        computed_priority: calculateComputedPriority(notification),
        computed_relevance: calculateComputedRelevance(notification, userId),
        urgency_level: calculateUrgencyLevel(notification)
      }))
      .sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'relevance':
            return (b.computed_relevance || 0) - (a.computed_relevance || 0);
          case 'priority':
          default:
            return (b.computed_priority || 0) - (a.computed_priority || 0);
        }
      });
  }, [smartNotificationsData?.notifications, sortBy, userId]);

  // Statistics
  const stats = useMemo(() => {
    const notifications = enrichedNotifications;
    
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read_at).length,
      high_priority: notifications.filter(n => n.priority === 'high' || n.priority === 'critical').length,
      action_required: notifications.filter(n => n.context.action_required).length,
      ai_generated: notifications.filter(n => n.ai_generated).length,
      by_category: notifications.reduce((acc: Record<string, number>, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {}),
      engagement_rate: calculateEngagementRate(notifications)
    };
  }, [enrichedNotifications]);

  // Helper functions
  function calculateComputedPriority(notification: SmartNotification): number {
    let score = 0;
    
    // Base priority weight
    const priorityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    score += priorityWeights[notification.priority] * 10;
    
    // Urgency score
    score += notification.urgency_score * 0.5;
    
    // Relevance score
    score += notification.relevance_score * 0.3;
    
    // AI insights impact
    if (notification.ai_insights.predicted_impact === 'high') score += 15;
    if (notification.ai_insights.predicted_impact === 'medium') score += 10;
    
    return Math.min(score, 100);
  }

  function calculateComputedRelevance(notification: SmartNotification, userId: string): number {
    // Simplified relevance calculation based on user preferences and behavior
    return notification.relevance_score * 0.8 + Math.random() * 20; // Add some variation
  }

  function calculateUrgencyLevel(notification: SmartNotification): 'low' | 'medium' | 'high' | 'urgent' {
    if (notification.urgency_score >= 80) return 'urgent';
    if (notification.urgency_score >= 60) return 'high';
    if (notification.urgency_score >= 40) return 'medium';
    return 'low';
  }

  function calculateEngagementRate(notifications: SmartNotification[]): number {
    const withAction = notifications.filter(n => n.action_taken).length;
    const total = notifications.length;
    return total > 0 ? (withAction / total) * 100 : 0;
  }

  return {
    // Data
    preferences: preferencesData?.preferences,
    templates: templatesData?.templates || [],
    notifications: enrichedNotifications,
    analytics: analyticsData?.analytics,
    
    // Summary statistics
    stats,
    
    // Loading states
    preferencesLoading,
    templatesLoading,
    smartNotificationsLoading,
    analyticsLoading,
    isLoading,
    
    // Errors
    preferencesError,
    templatesError,
    smartNotificationsError,
    analyticsError,
    error,
    
    // State
    filters,
    viewMode,
    sortBy,
    selectedNotification,
    
    // Actions
    handleFilterChange,
    handleSortChange,
    handleViewModeChange,
    handleNotificationSelect,
    handleBulkActions,
    handleExportAnalytics,
    
    // Mutations
    updatePreferences: updatePreferencesMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    sendNotification: sendNotificationMutation.mutateAsync,
    snoozeNotification: snoozeNotificationMutation.mutateAsync,
    unsubscribe: unsubscribeMutation.mutateAsync,
    
    // Mutation states
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isSendingNotification: sendNotificationMutation.isPending,
    isSnoozing: snoozeNotificationMutation.isPending,
    isUnsubscribing: unsubscribeMutation.isPending,
    
    // Utilities
    refetchPreferences,
    refetchTemplates,
    refetchSmartNotifications,
    refetchAnalytics,
    
    // Options
    enableAI,
    enableRealTime,
    autoRefresh,
    refreshInterval
  };
}