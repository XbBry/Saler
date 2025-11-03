import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

interface SyncItem {
  id: string;
  type: 'contact' | 'deal' | 'message' | 'note' | 'activity';
  action: 'create' | 'update' | 'delete';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: Date;
  errorMessage?: string;
  data?: any;
}

interface SyncStats {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  pending: number;
}

interface SyncStatusProps {
  integrationId: string;
  isActive: boolean;
  onStartSync: () => void;
  onCancelSync: () => void;
  syncItems?: SyncItem[];
  stats?: SyncStats;
  lastSyncTime?: Date;
  nextSyncTime?: Date;
  autoSyncEnabled?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  integrationId,
  isActive,
  onStartSync,
  onCancelSync,
  syncItems = [],
  stats,
  lastSyncTime,
  nextSyncTime,
  autoSyncEnabled = false
}) => {
  const [currentStats, setCurrentStats] = useState<SyncStats>(stats || {
    total: 0,
    completed: 0,
    inProgress: 0,
    failed: 0,
    pending: 0
  });

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [logView, setLogView] = useState(false);

  useEffect(() => {
    if (stats) {
      setCurrentStats(stats);
    }
  }, [stats]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in_progress': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contact': return '👤';
      case 'deal': return '💼';
      case 'message': return '💬';
      case 'note': return '📝';
      case 'activity': return '📅';
      default: return '📄';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'create': return 'إنشاء';
      case 'update': return 'تحديث';
      case 'delete': return 'حذف';
      default: return action;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('ar-SA');
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${Math.floor(diffHours / 24)} يوم`;
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const calculateProgress = () => {
    if (currentStats.total === 0) return 0;
    return Math.round((currentStats.completed / currentStats.total) * 100);
  };

  const renderProgressBar = () => {
    const progress = calculateProgress();
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">التقدم</span>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isActive ? 'bg-blue-600' : 'bg-green-600'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{currentStats.completed} / {currentStats.total}</span>
          <span>مكتمل</span>
        </div>
      </div>
    );
  };

  const renderStatsGrid = () => {
    const statItems = [
      { label: 'مكتمل', value: currentStats.completed, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'قيد التنفيذ', value: currentStats.inProgress, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'في الانتظار', value: currentStats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
      { label: 'فاشل', value: currentStats.failed, color: 'text-red-600', bg: 'bg-red-50' }
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <div key={item.label} className={`p-3 rounded-lg ${item.bg}`}>
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-sm text-gray-600">{item.label}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* رأس المزامنة */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">حالة المزامنة</h3>
          <div className="flex items-center gap-2">
            {autoSyncEnabled && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                مزامنة تلقائية
              </span>
            )}
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {isActive ? 'نشط' : 'متوقف'}
            </span>
          </div>
        </div>

        {/* شريط التقدم */}
        {currentStats.total > 0 && renderProgressBar()}

        {/* إحصائيات سريعة */}
        {renderStatsGrid()}

        {/* معلومات التوقيت */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
          {lastSyncTime && (
            <div className="text-sm">
              <span className="text-gray-600">آخر مزامنة:</span>
              <div className="font-medium text-gray-900">
                {formatTimeAgo(lastSyncTime)}
              </div>
            </div>
          )}
          {nextSyncTime && autoSyncEnabled && (
            <div className="text-sm">
              <span className="text-gray-600">المزامنة التالية:</span>
              <div className="font-medium text-gray-900">
                {formatTime(nextSyncTime)}
              </div>
            </div>
          )}
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          {!isActive ? (
            <Button 
              onClick={onStartSync}
              disabled={currentStats.pending === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              بدء المزامنة
            </Button>
          ) : (
            <Button 
              onClick={onCancelSync}
              variant="secondary"
            >
              إيقاف المزامنة
            </Button>
          )}
          
          <Button 
            onClick={() => setLogView(!logView)}
            variant="outline"
          >
            {logView ? 'إخفاء السجل' : 'عرض السجل'}
          </Button>

          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            تحديث
          </Button>
        </div>
      </div>

      {/* سجل العمليات */}
      {logView && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">سجل العمليات</h4>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {syncItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                لا توجد عمليات في السجل
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {syncItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg">
                    <div 
                      className="p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleExpanded(item.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getTypeIcon(item.type)}</span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {getActionText(item.action)} {item.type}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatTime(item.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)} {item.status}
                          </span>
                          <span className="text-gray-400">
                            {expandedItems.has(item.id) ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {expandedItems.has(item.id) && (
                      <div className="px-3 pb-3 border-t border-gray-100">
                        <div className="mt-3 space-y-2">
                          {item.errorMessage && (
                            <div className="bg-red-50 border border-red-200 rounded p-2">
                              <span className="text-red-700 text-sm font-medium">خطأ:</span>
                              <p className="text-red-600 text-sm">{item.errorMessage}</p>
                            </div>
                          )}
                          
                          {item.data && (
                            <div className="bg-gray-50 rounded p-2">
                              <span className="text-gray-700 text-sm font-medium">البيانات:</span>
                              <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                                {JSON.stringify(item.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* مؤشر المزامنة المباشرة */}
      {isActive && currentStats.inProgress > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <div>
              <div className="font-medium text-blue-900">
                جاري المزامنة...
              </div>
              <div className="text-sm text-blue-700">
                يتم معالجة {currentStats.inProgress} عملية
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// مكون مبسط للعرض السريع
export const SyncStatusIndicator: React.FC<{
  isActive: boolean;
  lastSyncTime?: Date;
  autoSyncEnabled?: boolean;
}> = ({ isActive, lastSyncTime, autoSyncEnabled }) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
      <span className="text-gray-600">
        {isActive ? 'نشط' : 'متوقف'}
      </span>
      {autoSyncEnabled && (
        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
          تلقائي
        </span>
      )}
      {lastSyncTime && (
        <span className="text-gray-500">
          آخر: {new Date(lastSyncTime).toLocaleString('ar-SA')}
        </span>
      )}
    </div>
  );
};