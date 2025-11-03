import React, { useState, useRef, useEffect } from 'react';
import { Bell, Settings, X, ChevronDown } from 'lucide-react';
import { NotificationData, NotificationType } from './NotificationTypes';
import { useNotifications } from './useNotifications';
import { NotificationCenter } from './NotificationCenter';

interface NotificationBellProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
  maxDropdownItems?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function NotificationBell({ 
  className = '', 
  size = 'md', 
  showDropdown = true,
  maxDropdownItems = 5,
  position = 'bottom-right'
}: NotificationBellProps) {
  const {
    notifications,
    stats,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    addNotification,
    isConnected,
  } = useNotifications();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  // تحديد حجم الأيقونة
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const badgeSizes = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  // التنبيهات الحديثة (غير مقروءة)
  const unreadNotifications = notifications.filter(n => !n.read);
  const recentNotifications = notifications
    .slice(0, maxDropdownItems)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // تأثير النبضة عند وجود تنبيهات جديدة
  useEffect(() => {
    const previousUnreadCount = React.useRef(stats?.unread || 0);
    
    if (stats && stats.unread > previousUnreadCount.current) {
      // تنبيه جديد وصل
      setShowPulse(true);
      setIsAnimating(true);
      
      // إيقاف التأثير بعد 3 ثوانٍ
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        setShowPulse(false);
      }, 3000);
    }
    
    previousUnreadCount.current = stats?.unread || 0;
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [stats]);

  // تحديد موقع القائمة المنسدلة
  const getDropdownPosition = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-full left-0 mb-2';
      case 'top-right':
        return 'top-full right-0 mt-2';
      case 'top-left':
        return 'top-full left-0 mt-2';
      default: // bottom-right
        return 'bottom-full right-0 mb-2';
    }
  };

  // أيقونة نوع التنبيه
  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'lead':
        return <div className={`${iconClass} bg-blue-500 rounded-full`} />;
      case 'message':
        return <div className={`${iconClass} bg-green-500 rounded-full`} />;
      case 'system':
        return <div className={`${iconClass} bg-gray-500 rounded-full`} />;
      case 'sale':
        return <div className={`${iconClass} bg-emerald-500 rounded-full`} />;
      case 'error':
        return <div className={`${iconClass} bg-red-500 rounded-full`} />;
      case 'warning':
        return <div className={`${iconClass} bg-yellow-500 rounded-full`} />;
      case 'success':
        return <div className={`${iconClass} bg-green-600 rounded-full`} />;
      default:
        return <div className={`${iconClass} bg-blue-400 rounded-full`} />;
    }
  };

  // تنسيق الوقت
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `${minutes}د`;
    if (hours < 24) return `${hours}س`;
    if (days < 7) return `${days}ي`;
    return new Date(timestamp).toLocaleDateString('ar-SA');
  };

  const handleNotificationClick = (notification: NotificationData) => {
    markAsRead(notification.id);
    setIsDropdownOpen(false);
    
    // يمكن إضافة منطق التنقل هنا
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  return (
    <div className="relative">
      {/* أيقونة الجرس */}
      <button
        ref={bellRef}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`
          ${sizeClasses[size]} 
          relative 
          bg-white 
          border border-gray-200 
          rounded-full 
          flex items-center justify-center 
          hover:bg-gray-50 
          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
          transition-all duration-200 
          ${isAnimating ? 'animate-pulse' : ''} 
          ${className}
        `}
      >
        {/* أيقونة الجرس */}
        <Bell 
          className={`${iconSizes[size]} text-gray-600 ${showPulse ? 'animate-bounce' : ''}`}
        />
        
        {/* شارة العدد */}
        {stats && stats.unread > 0 && (
          <div className={`
            ${badgeSizes[size]}
            absolute -top-1 -right-1 
            bg-red-500 
            text-white 
            rounded-full 
            flex items-center justify-center 
            font-medium 
            animate-pulse
          `}>
            {stats.unread > 99 ? '99+' : stats.unread}
          </div>
        )}
        
        {/* مؤشر الاتصال */}
        <div className={`
          absolute -bottom-0.5 -right-0.5 
          w-3 h-3 
          rounded-full 
          border-2 border-white
          ${isConnected ? 'bg-green-500' : 'bg-red-500'}
        `} />
      </button>

      {/* القائمة المنسدلة */}
      {showDropdown && isDropdownOpen && (
        <div 
          ref={dropdownRef}
          className={`
            absolute 
            w-80 
            bg-white 
            border border-gray-200 
            rounded-lg 
            shadow-lg 
            z-50
            ${getDropdownPosition()}
            transform transition-all duration-200
            ${isDropdownOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}
        >
          {/* رأس القائمة */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">التنبيهات</h3>
              {stats && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {stats.unread} جديد
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                disabled={!stats?.unread || stats.unread === 0}
                className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                تحديد الكل كمقروء
              </button>
              <button className="p-1 hover:bg-gray-100 rounded">
                <Settings className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* محتوى القائمة */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-600">
                <p className="text-sm">{error}</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">لا توجد تنبيهات</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-4 hover:bg-gray-50 cursor-pointer transition-colors
                      ${!notification.read ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''}
                    `}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium truncate ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mr-2" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                          {notification.actionText && (
                            <span className="text-xs text-blue-600 hover:text-blue-700">
                              {notification.actionText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ذيل القائمة */}
          {notifications.length > maxDropdownItems && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                عرض جميع التنبيهات ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}