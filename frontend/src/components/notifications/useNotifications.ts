import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  NotificationData, 
  NotificationSettings, 
  NotificationFilters, 
  NotificationStats,
  NotificationType,
  NotificationPriority 
} from './NotificationTypes';

// API endpoints (يجب تحديثها حسب Backend API)
const API_ENDPOINTS = {
  notifications: '/api/notifications',
  settings: '/api/notifications/settings',
  markAsRead: '/api/notifications/read',
  markAsUnread: '/api/notifications/unread',
  delete: '/api/notifications',
  markAllAsRead: '/api/notifications/read-all'
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [isConnected, setIsConnected] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // تحميل التنبيهات
  const fetchNotifications = useCallback(async (currentFilters?: NotificationFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      if (currentFilters?.type?.length) {
        queryParams.append('types', currentFilters.type.join(','));
      }
      if (currentFilters?.priority?.length) {
        queryParams.append('priorities', currentFilters.priority.join(','));
      }
      if (currentFilters?.read !== undefined) {
        queryParams.append('read', currentFilters.read.toString());
      }
      if (currentFilters?.search) {
        queryParams.append('search', currentFilters.search);
      }
      if (currentFilters?.dateRange) {
        queryParams.append('startDate', currentFilters.dateRange.start.toISOString());
        queryParams.append('endDate', currentFilters.dateRange.end.toISOString());
      }

      const response = await fetch(`${API_ENDPOINTS.notifications}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('فشل في تحميل التنبيهات');
      }
      
      const data: NotificationData[] = await response.json();
      setNotifications(data);
      updateStats(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, []);

  // تحميل الإعدادات
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.settings);
      
      if (!response.ok) {
        throw new Error('فشل في تحميل الإعدادات');
      }
      
      const data: NotificationSettings = await response.json();
      setSettings(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل الإعدادات');
    }
  }, []);

  // تحديث الإعدادات
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      const response = await fetch(API_ENDPOINTS.settings, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديث الإعدادات');
      }
      
      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحديث الإعدادات');
    }
  }, []);

  // تحديد التنبيه كمقروء
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.markAsRead}/${notificationId}`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديد التنبيه كمقروء');
      }
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحديد التنبيه كمقروء');
    }
  }, []);

  // تحديد التنبيه كغير مقروء
  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.markAsUnread}/${notificationId}`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديد التنبيه كغير مقروء');
      }
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: false }
            : notification
        )
      );
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحديد التنبيه كغير مقروء');
    }
  }, []);

  // حذف التنبيه
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.delete}/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('فشل في حذف التنبيه');
      }
      
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في حذف التنبيه');
    }
  }, []);

  // تحديد جميع التنبيهات كمقروءة
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.markAllAsRead, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديد جميع التنبيهات كمقروءة');
      }
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحديد جميع التنبيهات كمقروءة');
    }
  }, []);

  // إضافة تنبيه جديد
  const addNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev]);
    
    // تشغيل صوت التنبيه إذا كان مسموح
    if (settings?.inApp && !notification.read) {
      playNotificationSound();
    }
  }, [settings]);

  // تشغيل صوت التنبيه
  const playNotificationSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3');
    }
    
    if (audioRef.current && settings?.inApp) {
      audioRef.current.play().catch(console.error);
    }
  }, [settings]);

  // تحديث الإحصائيات
  const updateStats = useCallback((notificationList: NotificationData[]) => {
    const total = notificationList.length;
    const unread = notificationList.filter(n => !n.read).length;
    
    const byType = notificationList.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>);
    
    const byPriority = notificationList.reduce((acc, notification) => {
      acc[notification.priority] = (acc[notification.priority] || 0) + 1;
      return acc;
    }, {} as Record<NotificationPriority, number>);
    
    setStats({ total, unread, byType, byPriority });
  }, []);

  // الاتصال المباشر للحصول على تنبيهات جديدة
  const connectToRealtime = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    eventSourceRef.current = new EventSource('/api/notifications/stream');
    
    eventSourceRef.current.onopen = () => {
      setIsConnected(true);
    };
    
    eventSourceRef.current.onmessage = (event) => {
      try {
        const notification: NotificationData = JSON.parse(event.data);
        addNotification(notification);
      } catch (err) {
        console.error('خطأ في تحليل التنبيه المباشر:', err);
      }
    };
    
    eventSourceRef.current.onerror = () => {
      setIsConnected(false);
      // إعادة الاتصال بعد 5 ثوانٍ
      setTimeout(connectToRealtime, 5000);
    };
  }, [addNotification]);

  // قطع الاتصال المباشر
  const disconnectFromRealtime = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // تطبيق الفلاتر
  const applyFilters = useCallback((newFilters: NotificationFilters) => {
    setFilters(newFilters);
    fetchNotifications(newFilters);
  }, [fetchNotifications]);

  // مسح الفلاتر
  const clearFilters = useCallback(() => {
    setFilters({});
    fetchNotifications({});
  }, [fetchNotifications]);

  // تنظيف الموارد عند إلغاء التحميل
  useEffect(() => {
    fetchNotifications();
    fetchSettings();
    connectToRealtime();
    
    return () => {
      disconnectFromRealtime();
    };
  }, [fetchNotifications, fetchSettings, connectToRealtime, disconnectFromRealtime]);

  return {
    // البيانات
    notifications,
    settings,
    stats,
    filters,
    loading,
    error,
    isConnected,
    
    // الإجراءات
    fetchNotifications: () => fetchNotifications(filters),
    fetchSettings,
    updateSettings,
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead,
    addNotification,
    
    // الفلاتر
    applyFilters,
    clearFilters,
    setFilters,
    
    // الاتصال المباشر
    connectToRealtime,
    disconnectFromRealtime,
    playNotificationSound,
  };
}