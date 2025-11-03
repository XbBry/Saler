import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  ArrowRight,
  User,
  MessageSquare,
  DollarSign,
  Settings,
  Zap
} from 'lucide-react';
import { NotificationData, NotificationType } from './NotificationTypes';

interface InAppNotificationProps {
  notification: NotificationData;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  autoHide?: boolean;
  duration?: number; // بالملي ثانية
  showProgress?: boolean;
  onDismiss?: (id: string) => void;
  onActionClick?: (notification: NotificationData) => void;
  className?: string;
}

export function InAppNotification({
  notification,
  position = 'top-right',
  autoHide = true,
  duration = 8000,
  showProgress = true,
  onDismiss,
  onActionClick,
  className = ''
}: InAppNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(duration);

  // إعدادات الألوان والأيقونات حسب النوع
  const getNotificationConfig = (type: NotificationType) => {
    switch (type) {
      case 'lead':
        return {
          icon: <Zap className="w-6 h-6 text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-700',
          progressColor: 'bg-blue-500',
          accentColor: 'bg-blue-500',
          actionColor: 'text-blue-600 hover:text-blue-700',
        };
      case 'message':
        return {
          icon: <MessageSquare className="w-6 h-6 text-green-500" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-900',
          messageColor: 'text-green-700',
          progressColor: 'bg-green-500',
          accentColor: 'bg-green-500',
          actionColor: 'text-green-600 hover:text-green-700',
        };
      case 'system':
        return {
          icon: <Settings className="w-6 h-6 text-gray-500" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          titleColor: 'text-gray-900',
          messageColor: 'text-gray-700',
          progressColor: 'bg-gray-500',
          accentColor: 'bg-gray-500',
          actionColor: 'text-gray-600 hover:text-gray-700',
        };
      case 'sale':
        return {
          icon: <DollarSign className="w-6 h-6 text-emerald-500" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          titleColor: 'text-emerald-900',
          messageColor: 'text-emerald-700',
          progressColor: 'bg-emerald-500',
          accentColor: 'bg-emerald-500',
          actionColor: 'text-emerald-600 hover:text-emerald-700',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-900',
          messageColor: 'text-red-700',
          progressColor: 'bg-red-500',
          accentColor: 'bg-red-500',
          actionColor: 'text-red-600 hover:text-red-700',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-700',
          progressColor: 'bg-yellow-500',
          accentColor: 'bg-yellow-500',
          actionColor: 'text-yellow-600 hover:text-yellow-700',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-900',
          messageColor: 'text-green-700',
          progressColor: 'bg-green-600',
          accentColor: 'bg-green-600',
          actionColor: 'text-green-600 hover:text-green-700',
        };
      default:
        return {
          icon: <Info className="w-6 h-6 text-blue-400" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-700',
          progressColor: 'bg-blue-400',
          accentColor: 'bg-blue-400',
          actionColor: 'text-blue-600 hover:text-blue-700',
        };
    }
  };

  // موقع التنبيه
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const config = getNotificationConfig(notification.type);

  // إظهار التنبيه
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // إخفاء تلقائي
  useEffect(() => {
    if (autoHide && duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            handleDismiss();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      const timeInterval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 100;
          if (newTime <= 0) {
            return 0;
          }
          return newTime;
        });
      }, 100);

      return () => {
        clearInterval(interval);
        clearInterval(timeInterval);
      };
    }
  }, [autoHide, duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss?.(notification.id);
    }, 300);
  };

  const handleActionClick = () => {
    if (onActionClick) {
      onActionClick(notification);
    } else if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    handleDismiss();
  };

  return (
    <div
      className={`
        fixed z-50 max-w-sm w-full
        ${getPositionClasses()}
        transform transition-all duration-500 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100 scale-100' : 
          position.includes('right') ? 'translate-x-full opacity-0 scale-95' :
          position.includes('left') ? '-translate-x-full opacity-0 scale-95' :
          'translate-y-full opacity-0 scale-95'
        }
        ${className}
      `}
    >
      <div
        className={`
          ${config.bgColor} ${config.borderColor}
          border rounded-lg shadow-xl p-4
          backdrop-blur-sm
          relative overflow-hidden
          hover:shadow-2xl transition-shadow duration-300
        `}
      >
        {/* شريط التقدم */}
        {showProgress && autoHide && duration > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white bg-opacity-30 overflow-hidden">
            <div
              className={`h-full ${config.progressColor} transition-all duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* شريط جانبي */}
        <div className={`absolute top-0 left-0 w-1 h-full ${config.accentColor}`} />

        <div className="flex items-start gap-3">
          {/* الأيقونة */}
          <div className="flex-shrink-0 mt-0.5">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center
              ${config.bgColor} border ${config.borderColor}
            `}>
              {config.icon}
            </div>
          </div>

          {/* المحتوى */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h4 className={`font-semibold ${config.titleColor} text-sm`}>
                {notification.title}
              </h4>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors mr-2"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className={`text-sm ${config.messageColor} mt-1 leading-relaxed`}>
              {notification.message}
            </p>

            {/* معلومات إضافية حسب نوع التنبيه */}
            {notification.type === 'lead' && notification.metadata && (
              <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span className={config.messageColor}>
                    {notification.metadata.leadName}
                  </span>
                </div>
              </div>
            )}

            {notification.type === 'message' && notification.metadata && (
              <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" />
                  <span className={config.messageColor}>
                    من: {notification.metadata.senderName}
                  </span>
                </div>
                {notification.metadata.unreadCount > 1 && (
                  <div className="text-xs text-gray-600 mt-1">
                    {notification.metadata.unreadCount} رسائل غير مقروءة
                  </div>
                )}
              </div>
            )}

            {notification.type === 'sale' && notification.metadata && (
              <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  <span className={config.messageColor}>
                    {notification.metadata.dealName} - {notification.metadata.dealValue} ريال
                  </span>
                </div>
              </div>
            )}

            {/* الوقت المتبقي */}
            {autoHide && duration > 0 && timeLeft > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">
                  سيتم إغلاقها خلال {Math.ceil(timeLeft / 1000)}s
                </span>
              </div>
            )}

            {/* الأزرار */}
            <div className="flex items-center gap-2 mt-3">
              {notification.actionText && notification.actionUrl && (
                <button
                  onClick={handleActionClick}
                  className={`
                    flex items-center gap-1 px-3 py-1.5 
                    text-sm font-medium rounded-lg
                    bg-white bg-opacity-80
                    hover:bg-opacity-100
                    transition-all duration-200
                    ${config.actionColor}
                    border ${config.borderColor}
                  `}
                >
                  {notification.actionText}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>

        {/* تأثير الوهج */}
        <div className={`
          absolute inset-0 rounded-lg
          ${config.accentColor} opacity-5
          animate-pulse
        `} />
      </div>
    </div>
  );
}

// حاوي التنبيهات داخل التطبيق
interface InAppNotificationContainerProps {
  notifications: NotificationData[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  maxNotifications?: number;
  autoHide?: boolean;
  showProgress?: boolean;
  onDismiss?: (id: string) => void;
  onActionClick?: (notification: NotificationData) => void;
}

export function InAppNotificationContainer({
  notifications,
  position = 'top-right',
  maxNotifications = 3,
  autoHide = true,
  showProgress = true,
  onDismiss,
  onActionClick
}: InAppNotificationContainerProps) {
  const displayedNotifications = notifications.slice(0, maxNotifications);

  return (
    <>
      {displayedNotifications.map((notification, index) => (
        <InAppNotification
          key={notification.id}
          notification={notification}
          position={position}
          autoHide={autoHide}
          duration={8000 - (index * 1000)} // تأخير كل تنبيه
          showProgress={showProgress}
          onDismiss={onDismiss}
          onActionClick={onActionClick}
          className={index > 0 ? `-translate-y-${index * 4}` : ''}
        />
      ))}
    </>
  );
}

// Hook لإدارة التنبيهات داخل التطبيق
export function useInAppNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = (notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10)); // الاحتفاظ بآخر 10 تنبيهات
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const showLeadNotification = (leadName: string, action: string, leadId?: string) => {
    const notification: NotificationData = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'lead',
      priority: 'medium',
      title: 'تحديث عميل محتمل',
      message: `العميل المحتمل ${leadName} ${action}`,
      timestamp: new Date(),
      read: false,
      userId: 'current-user',
      channels: ['in_app'],
      metadata: {
        leadId: leadId || '',
        leadName,
        action: action as any,
        priority: 'medium'
      }
    };
    addNotification(notification);
  };

  const showMessageNotification = (senderName: string, messagePreview: string, conversationId?: string) => {
    const notification: NotificationData = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'message',
      priority: 'medium',
      title: 'رسالة جديدة',
      message: `${senderName}: ${messagePreview}`,
      timestamp: new Date(),
      read: false,
      userId: 'current-user',
      channels: ['in_app'],
      metadata: {
        conversationId: conversationId || '',
        senderName,
        messagePreview,
        unreadCount: 1
      }
    };
    addNotification(notification);
  };

  const showSaleNotification = (dealName: string, dealValue: number, milestone: string) => {
    const notification: NotificationData = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'sale',
      priority: 'high',
      title: 'إنجاز في المبيعات',
      message: `تم ${milestone} في صفقة ${dealName} بقيمة ${dealValue.toLocaleString()} ريال`,
      timestamp: new Date(),
      read: false,
      userId: 'current-user',
      channels: ['in_app'],
      metadata: {
        dealId: Math.random().toString(36).substring(2, 9),
        dealName,
        dealValue,
        customerName: 'عميل',
        stage: milestone,
        milestone: milestone as any
      }
    };
    addNotification(notification);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showLeadNotification,
    showMessageNotification,
    showSaleNotification,
  };
}