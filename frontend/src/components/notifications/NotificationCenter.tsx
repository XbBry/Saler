import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  MoreVertical,
  Bell,
  Settings,
  Download,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { 
  NotificationData, 
  NotificationFilters, 
  NotificationType, 
  NotificationPriority 
} from './NotificationTypes';
import { useNotifications } from './useNotifications';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick?: (notification: NotificationData) => void;
}

export function NotificationCenter({ isOpen, onClose, onNotificationClick }: NotificationCenterProps) {
  const {
    notifications,
    stats,
    filters,
    loading,
    error,
    applyFilters,
    clearFilters,
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead,
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // فلاتر التطبيق
  const filteredNotifications = notifications.filter(notification => {
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (filters.type && !filters.type.includes(notification.type)) {
      return false;
    }
    
    if (filters.priority && !filters.priority.includes(notification.priority)) {
      return false;
    }
    
    if (filters.read !== undefined && notification.read !== filters.read) {
      return false;
    }
    
    return true;
  });

  // أيقونة نوع التنبيه
  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'lead':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'message':
        return <Bell className="w-4 h-4 text-green-500" />;
      case 'system':
        return <Settings className="w-4 h-4 text-gray-500" />;
      case 'sale':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  // لون الأولوية
  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // تطبيق البحث والفلاتر
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters({
      ...filters,
      search: term || undefined,
    });
  };

  // تحديد/إلغاء تحديد تنبيه
  const toggleNotificationSelection = (id: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  // تحديد جميع التنبيهات
  const selectAllNotifications = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
    setShowBulkActions(filteredNotifications.length > 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* رأس النافذة */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">مركز التنبيهات</h2>
            {stats && (
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{stats.total} إجمالي</span>
                <span className="text-blue-600 font-medium">{stats.unread} غير مقروء</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* شريط البحث والفلاتر */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث في التنبيهات..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              فلترة
            </button>
            <button
              onClick={markAllAsRead}
              disabled={loading || stats?.unread === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              تحديد الكل كمقروء
            </button>
          </div>

          {/* قائمة الفلاتر */}
          {showFilters && (
            <div className="bg-white p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* نوع التنبيه */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
                  <div className="space-y-2">
                    {['lead', 'message', 'system', 'sale', 'error'].map((type) => (
                      <label key={type} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.type?.includes(type as NotificationType) || false}
                          onChange={(e) => {
                            const types = filters.type || [];
                            const newTypes = e.target.checked
                              ? [...types, type as NotificationType]
                              : types.filter(t => t !== type);
                            applyFilters({ ...filters, type: newTypes.length ? newTypes : undefined });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* الأولوية */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                  <div className="space-y-2">
                    {['urgent', 'high', 'medium', 'low'].map((priority) => (
                      <label key={priority} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.priority?.includes(priority as NotificationPriority) || false}
                          onChange={(e) => {
                            const priorities = filters.priority || [];
                            const newPriorities = e.target.checked
                              ? [...priorities, priority as NotificationPriority]
                              : priorities.filter(p => p !== priority);
                            applyFilters({ ...filters, priority: newPriorities.length ? newPriorities : undefined });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{priority}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* الحالة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.read === true}
                        onChange={(e) => {
                          applyFilters({ ...filters, read: e.target.checked ? true : undefined });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">مقروء</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.read === false}
                        onChange={(e) => {
                          applyFilters({ ...filters, read: e.target.checked ? false : undefined });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">غير مقروء</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* الإجراءات المتعددة */}
          {showBulkActions && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
              <span className="text-sm text-blue-700">
                تم تحديد {selectedNotifications.size} تنبيه
              </span>
              <button
                onClick={() => {
                  selectedNotifications.forEach(id => markAsRead(id));
                  setSelectedNotifications(new Set());
                  setShowBulkActions(false);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                تحديد كمقروء
              </button>
              <button
                onClick={() => {
                  // حذف متعدد
                  selectedNotifications.forEach(id => deleteNotification(id));
                  setSelectedNotifications(new Set());
                  setShowBulkActions(false);
                }}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                حذف
              </button>
            </div>
          )}
        </div>

        {/* قائمة التنبيهات */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="w-12 h-12 text-gray-300 mb-4" />
              <p>لا توجد تنبيهات</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => toggleNotificationSelection(notification.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <div className="flex-1 cursor-pointer" onClick={() => onNotificationClick?.(notification)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(notification.type)}
                          <div className="flex-1">
                            <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                                {notification.priority}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(notification.timestamp).toLocaleString('ar-SA')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.read ? markAsUnread(notification.id) : markAsRead(notification.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {notification.read ? (
                              <Circle className="w-4 h-4 text-gray-400" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ذيل النافذة */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={selectAllNotifications}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {selectedNotifications.size === filteredNotifications.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
            </button>
            {(filters.type || filters.priority || filters.read !== undefined || filters.search) && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500">
            عرض {filteredNotifications.length} من {notifications.length} تنبيه
          </div>
        </div>
      </div>
    </div>
  );
}