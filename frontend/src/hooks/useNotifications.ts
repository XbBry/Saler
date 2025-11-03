/**
 * useNotifications - Comprehensive Notifications Management Hook
 * Hook شامل لإدارة التنبيهات مع Real-time alerts وتفضيلات المستخدم
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { z } from 'zod';

// ========================
// Types and Schemas
// ========================

export interface NotificationConfig {
  enablePush: boolean;
  enableEmail: boolean;
  enableInApp: boolean;
  soundEnabled: boolean;
  autoMarkAsRead: boolean;
  retentionPeriod: number; // days
  maxNotifications: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  status: NotificationStatus;
  category: NotificationCategory;
  source: string;
  userId: string;
  isRead: boolean;
  isArchived: boolean;
  actionRequired: boolean;
  createdAt: Date;
  readAt?: Date;
  archivedAt?: Date;
  expiresAt?: Date;
  metadata?: NotificationMetadata;
}

export interface NotificationMetadata {
  icon?: string;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  tags?: string[];
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
  customFields?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  email: NotificationChannelPreferences;
  push: NotificationChannelPreferences;
  inApp: NotificationChannelPreferences;
  categories: Record<NotificationCategory, CategoryPreferences>;
  quietHours: QuietHours;
  doNotDisturb: boolean;
  updatedAt: Date;
}

export interface NotificationChannelPreferences {
  enabled: boolean;
  categories: NotificationType[];
  priority: NotificationPriority;
  soundEnabled: boolean;
}

export interface CategoryPreferences {
  enabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  soundEnabled: boolean;
  minPriority: NotificationPriority;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  timezone: string;
  weekdays: number[]; // 0-6
  overrideForHighPriority: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  variables: TemplateVariable[];
  channels: NotificationChannel[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export type NotificationType = 
  | 'sales_alert'
  | 'lead_update'
  | 'customer_action'
  | 'system_alert'
  | 'deadline_reminder'
  | 'performance_alert'
  | 'goal_achieved'
  | 'security_alert'
  | 'integration_update'
  | 'report_ready';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export type NotificationCategory = 
  | 'sales'
  | 'leads'
  | 'customers'
  | 'system'
  | 'security'
  | 'integration'
  | 'reports'
  | 'general';

export type NotificationChannel = 'email' | 'push' | 'in_app' | 'sms';

// ========================
// Default Configuration
// ========================

const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  enablePush: true,
  enableEmail: true,
  enableInApp: true,
  soundEnabled: true,
  autoMarkAsRead: false,
  retentionPeriod: 30,
  maxNotifications: 1000,
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  userId: '',
  email: {
    enabled: true,
    categories: ['sales_alert', 'lead_update', 'customer_action', 'system_alert'],
    priority: 'normal',
    soundEnabled: false,
  },
  push: {
    enabled: true,
    categories: ['sales_alert', 'lead_update', 'system_alert', 'security_alert'],
    priority: 'high',
    soundEnabled: true,
  },
  inApp: {
    enabled: true,
    categories: ['sales_alert', 'lead_update', 'customer_action', 'system_alert', 'performance_alert'],
    priority: 'normal',
    soundEnabled: true,
  },
  categories: {
    sales: {
      enabled: true,
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      soundEnabled: true,
      minPriority: 'normal',
    },
    leads: {
      enabled: true,
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      soundEnabled: true,
      minPriority: 'normal',
    },
    customers: {
      enabled: true,
      emailEnabled: true,
      pushEnabled: false,
      inAppEnabled: true,
      soundEnabled: false,
      minPriority: 'low',
    },
    system: {
      enabled: true,
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      soundEnabled: true,
      minPriority: 'high',
    },
    security: {
      enabled: true,
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      soundEnabled: true,
      minPriority: 'urgent',
    },
    integration: {
      enabled: true,
      emailEnabled: true,
      pushEnabled: false,
      inAppEnabled: true,
      soundEnabled: false,
      minPriority: 'normal',
    },
    reports: {
      enabled: true,
      emailEnabled: true,
      pushEnabled: false,
      inAppEnabled: true,
      soundEnabled: false,
      minPriority: 'low',
    },
    general: {
      enabled: true,
      emailEnabled: false,
      pushEnabled: false,
      inAppEnabled: true,
      soundEnabled: false,
      minPriority: 'low',
    },
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'Asia/Riyadh',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    overrideForHighPriority: true,
  },
  doNotDisturb: false,
  updatedAt: new Date(),
};

// ========================
// Validation Schemas
// ========================

const NotificationSchema = z.object({
  id: z.string(),
  type: z.enum([
    'sales_alert', 'lead_update', 'customer_action', 'system_alert',
    'deadline_reminder', 'performance_alert', 'goal_achieved',
    'security_alert', 'integration_update', 'report_ready'
  ]),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  status: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']),
  category: z.enum(['sales', 'leads', 'customers', 'system', 'security', 'integration', 'reports', 'general']),
  source: z.string(),
  userId: z.string(),
  isRead: z.boolean(),
  isArchived: z.boolean(),
  actionRequired: z.boolean(),
  createdAt: z.date(),
  readAt: z.date().optional(),
  archivedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  metadata: z.object({
    icon: z.string().optional(),
    imageUrl: z.string().optional(),
    actionUrl: z.string().optional(),
    actionText: z.string().optional(),
    tags: z.array(z.string()).optional(),
    relatedEntity: z.object({
      type: z.string(),
      id: z.string(),
      name: z.string(),
    }).optional(),
    customFields: z.record(z.any()).optional(),
  }).optional(),
});

const NotificationPreferencesSchema = z.object({
  userId: z.string(),
  email: z.object({
    enabled: z.boolean(),
    categories: z.array(z.string()),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    soundEnabled: z.boolean(),
  }),
  push: z.object({
    enabled: z.boolean(),
    categories: z.array(z.string()),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    soundEnabled: z.boolean(),
  }),
  inApp: z.object({
    enabled: z.boolean(),
    categories: z.array(z.string()),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    soundEnabled: z.boolean(),
  }),
  categories: z.record(z.object({
    enabled: z.boolean(),
    emailEnabled: z.boolean(),
    pushEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
    soundEnabled: z.boolean(),
    minPriority: z.enum(['low', 'normal', 'high', 'urgent']),
  })),
  quietHours: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    timezone: z.string(),
    weekdays: z.array(z.number()),
    overrideForHighPriority: z.boolean(),
  }),
  doNotDisturb: z.boolean(),
  updatedAt: z.date(),
});

// ========================
// Hook Implementation
// ========================

export function useNotifications(config: Partial<NotificationConfig> = {}) {
  // Merge config with defaults
  const finalConfig = { ...DEFAULT_NOTIFICATION_CONFIG, ...config };
  
  // Get current user ID (you'd get this from your auth context)
  const userId = 'current-user-id'; // Replace with actual user ID
  
  // State Management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const soundRef = useRef<HTMLAudioElement | null>(null);
  
  // ========================
  // Notification Management
  // ========================
  
  const fetchNotifications = useCallback(async (filters?: {
    unread?: boolean;
    category?: NotificationCategory;
    priority?: NotificationPriority;
    limit?: number;
    offset?: number;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filters?.unread !== undefined) queryParams.set('unread', String(filters.unread));
      if (filters?.category) queryParams.set('category', filters.category);
      if (filters?.priority) queryParams.set('priority', filters.priority);
      if (filters?.limit) queryParams.set('limit', String(filters.limit));
      if (filters?.offset) queryParams.set('offset', String(filters.offset));
      
      const response = await fetch(`/api/notifications?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('فشل في جلب التنبيهات');
      }
      
      const data = await response.json();
      const notifications = data.notifications || [];
      
      // Validate and process notifications
      const processedNotifications = notifications.map((notif: any) => ({
        ...notif,
        createdAt: new Date(notif.createdAt),
        readAt: notif.readAt ? new Date(notif.readAt) : undefined,
        archivedAt: notif.archivedAt ? new Date(notif.archivedAt) : undefined,
        expiresAt: notif.expiresAt ? new Date(notif.expiresAt) : undefined,
      }));
      
      setNotifications(processedNotifications);
      setUnreadCount(processedNotifications.filter((n: Notification) => !n.isRead).length);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في جلب التنبيهات';
      setError(errorMessage);
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديد التنبيهات كمقروءة');
      }
      
      // Update local state
      setNotifications(prev => prev.map(notif =>
        notificationIds.includes(notif.id) 
          ? { ...notif, isRead: true, readAt: new Date() }
          : notif
      ));
      
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحديد التنبيهات';
      setError(errorMessage);
      console.error('Error marking notifications as read:', error);
    }
  }, []);
  
  const markAsUnread = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications/mark-unread', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديد التنبيهات كغير مقروءة');
      }
      
      // Update local state
      setNotifications(prev => prev.map(notif =>
        notificationIds.includes(notif.id) 
          ? { ...notif, isRead: false, readAt: undefined }
          : notif
      ));
      
      // Recalculate unread count
      setNotifications(current => {
        const newUnreadCount = current.filter(n => !n.isRead).length;
        setUnreadCount(newUnreadCount);
        return current;
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحديد التنبيهات';
      setError(errorMessage);
    }
  }, []);
  
  const archiveNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications/archive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });
      
      if (!response.ok) {
        throw new Error('فشل في أرشفة التنبيهات');
      }
      
      // Update local state
      setNotifications(prev => prev.map(notif =>
        notificationIds.includes(notif.id) 
          ? { ...notif, isArchived: true, archivedAt: new Date() }
          : notif
      ));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في أرشفة التنبيهات';
      setError(errorMessage);
    }
  }, []);
  
  const deleteNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });
      
      if (!response.ok) {
        throw new Error('فشل في حذف التنبيهات');
      }
      
      // Update local state
      setNotifications(prev => prev.filter(notif => !notificationIds.includes(notif.id)));
      
      // Recalculate unread count
      setNotifications(current => {
        const newUnreadCount = current.filter(n => !n.isRead).length;
        setUnreadCount(newUnreadCount);
        return current;
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في حذف التنبيهات';
      setError(errorMessage);
    }
  }, []);
  
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      if (unreadIds.length === 0) return;
      
      await markAsRead(unreadIds);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحديد جميع التنبيهات';
      setError(errorMessage);
    }
  }, [notifications, markAsRead]);
  
  // ========================
  // Real-time Connection
  // ========================
  
  const setupRealTimeConnection = useCallback(() => {
    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // Create new connection
      const eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`);
      
      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_notification') {
            const notification: Notification = {
              ...data.payload,
              createdAt: new Date(data.payload.createdAt),
            };
            
            // Add to notifications list
            setNotifications(prev => [notification, ...prev].slice(0, finalConfig.maxNotifications));
            
            // Update unread count
            if (!notification.isRead) {
              setUnreadCount(prev => prev + 1);
            }
            
            // Play sound if enabled
            if (finalConfig.soundEnabled && preferences?.categories[notification.category]?.soundEnabled) {
              playNotificationSound(notification.priority);
            }
          }
          
          if (data.type === 'notification_update') {
            setNotifications(prev => prev.map(notif =>
              notif.id === data.payload.id 
                ? { ...notif, ...data.payload }
                : notif
            ));
          }
          
        } catch (error) {
          console.error('Error processing real-time notification:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('Real-time connection error:', error);
        setIsConnected(false);
        setError('فشل في الاتصال بالتنبيهات المباشرة');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(setupRealTimeConnection, 5000);
      };
      
      eventSourceRef.current = eventSource;
      
    } catch (error) {
      console.error('Error setting up real-time connection:', error);
      setError('فشل في إعداد الاتصال المباشر');
    }
  }, [userId, finalConfig.maxNotifications, finalConfig.soundEnabled, preferences]);
  
  // ========================
  // Notification Sounds
  // ========================
  
  const playNotificationSound = useCallback((priority: NotificationPriority) => {
    try {
      if (!finalConfig.soundEnabled) return;
      
      // Create audio context for different priorities
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Different sound patterns for different priorities
      const soundConfig = {
        low: { frequency: 440, duration: 200, volume: 0.1 },
        normal: { frequency: 523, duration: 300, volume: 0.2 },
        high: { frequency: 659, duration: 400, volume: 0.3 },
        urgent: { frequency: 784, duration: 500, volume: 0.4 },
      };
      
      const config = soundConfig[priority];
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + config.duration / 1000);
      
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [finalConfig.soundEnabled]);
  
  // ========================
  // Preferences Management
  // ========================
  
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) {
        throw new Error('فشل في جلب تفضيلات التنبيهات');
      }
      
      const data = await response.json();
      const preferences = { ...DEFAULT_PREFERENCES, ...data.preferences, userId };
      setPreferences(preferences);
      
    } catch (error) {
      // If preferences don't exist, create default ones
      setPreferences({ ...DEFAULT_PREFERENCES, userId });
    }
  }, [userId]);
  
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      if (!preferences) return;
      
      const updatedPreferences = {
        ...preferences,
        ...newPreferences,
        updatedAt: new Date(),
      };
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPreferences),
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديث التفضيلات');
      }
      
      setPreferences(updatedPreferences);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحديث التفضيلات';
      setError(errorMessage);
    }
  }, [preferences]);
  
  // ========================
  // Memoized Values
  // ========================
  
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by creation date
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [notifications]);
  
  const notificationsByCategory = useMemo(() => {
    return notifications.reduce((acc, notif) => {
      if (!acc[notif.category]) {
        acc[notif.category] = [];
      }
      acc[notif.category].push(notif);
      return acc;
    }, {} as Record<NotificationCategory, Notification[]>);
  }, [notifications]);
  
  const urgentNotifications = useMemo(() => {
    return notifications.filter(notif => 
      notif.priority === 'urgent' && 
      !notif.isRead && 
      !notif.isArchived
    );
  }, [notifications]);
  
  const shouldShowNotification = useCallback((notification: Notification) => {
    if (!preferences) return true;
    
    // Check if user is in quiet hours
    if (preferences.quietHours.enabled && !preferences.quietHours.overrideForHighPriority) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const currentDay = now.getDay();
      
      const isQuietTime = currentTime >= preferences.quietHours.startTime || 
                         currentTime <= preferences.quietHours.endTime;
      const isQuietDay = preferences.quietHours.weekdays.includes(currentDay);
      
      if (isQuietTime && isQuietDay && notification.priority !== 'urgent') {
        return false;
      }
    }
    
    // Check category preferences
    const categoryPrefs = preferences.categories[notification.category];
    if (!categoryPrefs?.enabled) return false;
    
    // Check priority threshold
    const priorityOrder = { low: 1, normal: 2, high: 3, urgent: 4 };
    const minPriorityOrder = priorityOrder[categoryPrefs.minPriority];
    const notifPriorityOrder = priorityOrder[notification.priority];
    
    return notifPriorityOrder >= minPriorityOrder;
    
  }, [preferences]);
  
  // ========================
  // Effects
  // ========================
  
  // Initial data fetch
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, []);
  
  // Setup real-time connection
  useEffect(() => {
    setupRealTimeConnection();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [setupRealTimeConnection]);
  
  // ========================
  // Public API
  // ========================
  
  return {
    // State
    notifications: sortedNotifications,
    notificationsByCategory,
    unreadCount,
    urgentNotifications,
    preferences,
    isLoading,
    isConnected,
    error,
    
    // Notification actions
    markAsRead,
    markAsUnread,
    archiveNotifications,
    deleteNotifications,
    markAllAsRead,
    
    // Preferences actions
    updatePreferences,
    
    // Data fetching
    refreshNotifications: () => fetchNotifications(),
    refreshPreferences: fetchPreferences,
    
    // Utilities
    clearError: () => setError(null),
    shouldShowNotification,
    
    // Configuration
    config: finalConfig,
  };
}

// ========================
// Custom Hooks for Specific Notification Types
// ========================

export function useSalesNotifications() {
  const notifications = useNotifications();
  
  const salesNotifications = notifications.notifications.filter(
    notif => notif.category === 'sales'
  );
  
  return {
    ...notifications,
    salesNotifications,
    unreadSalesCount: salesNotifications.filter(n => !n.isRead).length,
  };
}

export function useSystemNotifications() {
  const notifications = useNotifications();
  
  const systemNotifications = notifications.notifications.filter(
    notif => notif.category === 'system' || notif.category === 'security'
  );
  
  return {
    ...notifications,
    systemNotifications,
    unreadSystemCount: systemNotifications.filter(n => !n.isRead).length,
  };
}