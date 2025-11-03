'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Star,
  TrendingUp,
  Clock,
  Users,
  Target,
  DollarSign,
  Brain,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  NotificationData,
  NotificationFilters,
  NotificationType,
  NotificationPriority,
  LiveAlert,
  NotificationCenterProps,
} from './NotificationTypes';
import { useNotifications } from './useNotifications';

interface RealTimeNotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

const RealTimeNotificationContext = createContext<RealTimeNotificationContextType | undefined>(undefined);

export const useRealTimeNotifications = () => {
  const context = useContext(RealTimeNotificationContext);
  if (!context) {
    throw new Error('useRealTimeNotifications must be used within RealTimeNotificationProvider');
  }
  return context;
};

// WebSocket connection manager
class NotificationWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private listeners: Map<string, Function[]> = new Map();
  private isConnecting = false;

  connect(url: string = 'wss://your-websocket-url/ws') {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected for notifications');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connection', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
          
          // Handle different types of messages
          if (data.type === 'notification') {
            this.emit('notification', data.payload);
          } else if (data.type === 'alert') {
            this.emit('alert', data.payload);
          } else if (data.type === 'intelligence_update') {
            this.emit('intelligence', data.payload);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        this.emit('connection', { status: 'disconnected' });
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
            this.connect(url);
          }, this.reconnectInterval * this.reconnectAttempts);
        } else {
          this.emit('connection', { status: 'error' });
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('connection', { status: 'error' });
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.emit('connection', { status: 'error' });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', data);
    }
  }

  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  unsubscribe(event: string, callback: Function) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Smart notification generator for demo
class SmartNotificationGenerator {
  private templates = {
    hot_lead: [
      {
        title: 'عميل ساخن جديد',
        message: 'عميل جديد أظهر اهتماماً عالياً',
        type: 'lead' as const,
        priority: 'high' as const,
      },
      {
        title: 'تغير درجة الحرارة',
        message: 'عميل موجود أصبح ساخناً',
        type: 'lead' as const,
        priority: 'medium' as const,
      },
    ],
    intelligence: [
      {
        title: 'تحديث الذكاء الاصطناعي',
        message: 'تم تحديث نقاط العميل بناءً على نشاط جديد',
        type: 'system' as const,
        priority: 'low' as const,
      },
      {
        title: 'تنبؤ جديد',
        message: 'نظام الذكاء الاصطناعي حدد فرصة جديدة',
        type: 'sale' as const,
        priority: 'medium' as const,
      },
    ],
    activity: [
      {
        title: 'نشاط جديد',
        message: 'عميل تفاعل مع المحتوى',
        type: 'message' as const,
        priority: 'medium' as const,
      },
      {
        title: 'رد سريع',
        message: 'عميل رد على الرسالة بسرعة',
        type: 'message' as const,
        priority: 'high' as const,
      },
    ],
  };

  generate(type: 'hot_lead' | 'intelligence' | 'activity'): Omit<NotificationData, 'id' | 'timestamp'> {
    const template = this.templates[type][Math.floor(Math.random() * this.templates[type].length)];
    
    return {
      ...template,
      read: false,
      actions: this.generateActions(template.type),
    };
  }

  private generateActions(type: NotificationType) {
    switch (type) {
      case 'lead':
        return [
          { label: 'عرض الملف', action: 'view_lead' },
          { label: 'اتصل الآن', action: 'call' },
        ];
      case 'message':
        return [
          { label: 'عرض الرسالة', action: 'view_message' },
          { label: 'رد سريع', action: 'quick_reply' },
        ];
      case 'sale':
        return [
          { label: 'عرض التفاصيل', action: 'view_sale' },
          { label: 'متابعة', action: 'follow_up' },
        ];
      default:
        return [];
    }
  }
}

export const RealTimeNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  
  const wsRef = useRef<NotificationWebSocket | null>(null);
  const generatorRef = useRef(new SmartNotificationGenerator());

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new NotificationWebSocket();
    wsRef.current = ws;

    // Subscribe to connection events
    ws.subscribe('connection', ({ status }) => {
      setIsConnected(status === 'connected');
      setConnectionStatus(status);
    });

    // Subscribe to notifications
    ws.subscribe('notification', (notification: NotificationData) => {
      addNotification(notification);
    });

    // Subscribe to alerts
    ws.subscribe('alert', (alert: LiveAlert) => {
      const notification: Omit<NotificationData, 'id' | 'timestamp'> = {
        title: `تنبيه: ${alert.type}`,
        message: alert.message,
        type: alert.type === 'hot_lead' ? 'lead' : 'system',
        priority: alert.priority === 'high' ? 'high' : alert.priority === 'medium' ? 'medium' : 'low',
        read: false,
      };
      addNotification(notification);
    });

    // Subscribe to intelligence updates
    ws.subscribe('intelligence', (data) => {
      console.log('Intelligence update received:', data);
    });

    // Connect (in demo mode, we'll simulate connection)
    setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus('connected');
    }, 1000);

    // Demo: Generate random notifications every 30 seconds
    const demoInterval = setInterval(() => {
      const types: Array<'hot_lead' | 'intelligence' | 'activity'> = ['hot_lead', 'intelligence', 'activity'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const notification = generatorRef.current.generate(randomType);
      addNotification(notification);
    }, 30000);

    return () => {
      clearInterval(demoInterval);
      ws.disconnect();
    };
  }, []);

  const addNotification = useCallback((notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 99)]); // Keep only last 100 notifications
    setUnreadCount(prev => prev + 1);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted' && notification.priority === 'high') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/notification-icon.png',
        tag: newNotification.id,
      });
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const contextValue: RealTimeNotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    isConnected,
    connectionStatus,
  };

  return (
    <RealTimeNotificationContext.Provider value={contextValue}>
      {children}
    </RealTimeNotificationContext.Provider>
  );
};

// Smart notification bell component
export const SmartNotificationBell: React.FC<{
  onClick?: () => void;
  showCount?: boolean;
}> = ({ onClick, showCount = true }) => {
  const { unreadCount, isConnected, connectionStatus } = useRealTimeNotifications();
  
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-3 h-3" />;
      case 'connecting':
        return <Clock className="w-3 h-3 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Bell className="w-3 h-3" />;
    }
  };

  return (
    <motion.button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        <Bell className={`w-5 h-5 ${getStatusColor()}`} />
        
        {/* Connection status indicator */}
        <div className={`absolute -bottom-1 -right-1 ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
      </div>

      {/* Unread count badge */}
      {showCount && unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.span>
      )}
    </motion.button>
  );
};

// Notification toast component
export const NotificationToast: React.FC<{
  notification: NotificationData;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}> = ({ notification, onClose, autoClose = true, duration = 5000 }) => {
  const { markAsRead } = useRealTimeNotifications();

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'lead':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'message':
        return <Bell className="w-5 h-5 text-green-500" />;
      case 'sale':
        return <DollarSign className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'system':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      className="max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="mr-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {notification.message}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {formatDistanceToNow(new Date(notification.timestamp), {
                addSuffix: true,
                locale: ar,
              })}
            </p>
          </div>
          <div className="mr-4 flex-shrink-0 flex">
            <button
              className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Action buttons */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="mt-3 flex space-x-2 space-x-reverse">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Action clicked:', action.action);
                  onClose();
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};