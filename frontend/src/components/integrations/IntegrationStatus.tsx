import React from 'react';

interface IntegrationStatusProps {
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastActivity?: Date;
  errorMessage?: string;
  successRate?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const IntegrationStatus: React.FC<IntegrationStatusProps> = ({
  status,
  lastActivity,
  errorMessage,
  successRate,
  size = 'md',
  showDetails = false
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: '🟢',
          color: 'text-green-600 bg-green-50',
          label: 'متصل',
          textColor: 'text-green-700'
        };
      case 'disconnected':
        return {
          icon: '⚪',
          color: 'text-gray-600 bg-gray-50',
          label: 'منقطع',
          textColor: 'text-gray-700'
        };
      case 'error':
        return {
          icon: '🔴',
          color: 'text-red-600 bg-red-50',
          label: 'خطأ',
          textColor: 'text-red-700'
        };
      case 'syncing':
        return {
          icon: '🔄',
          color: 'text-blue-600 bg-blue-50',
          label: 'جاري المزامنة',
          textColor: 'text-blue-700'
        };
      default:
        return {
          icon: '⚪',
          color: 'text-gray-600 bg-gray-50',
          label: 'غير معروف',
          textColor: 'text-gray-700'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'text-xs',
          text: 'text-xs'
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'text-lg',
          text: 'text-base'
        };
      default:
        return {
          container: 'px-3 py-1 text-sm',
          icon: 'text-sm',
          text: 'text-sm'
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = getSizeClasses();

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  if (showDetails) {
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`${config.icon} ${sizeClasses.icon}`}>
              {config.icon}
            </span>
            <div>
              <h4 className={`font-medium ${config.textColor}`}>
                {config.label}
              </h4>
              {lastActivity && (
                <p className="text-sm text-gray-600">
                  آخر نشاط: {formatTimeAgo(lastActivity)}
                </p>
              )}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 font-medium text-sm">خطأ:</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
          </div>
        )}

        {successRate !== undefined && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <div className="flex items-center justify-between">
              <span className="text-green-700 font-medium text-sm">
                معدل النجاح
              </span>
              <span className="text-green-800 font-bold">
                {successRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        )}

        {status === 'syncing' && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-blue-700 font-medium text-sm">
                جاري المزامنة...
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 rounded-full ${config.color} ${sizeClasses.container}`}>
      <span className={sizeClasses.icon}>{config.icon}</span>
      <span className={`font-medium ${sizeClasses.text}`}>{config.label}</span>
    </div>
  );
};

// مكون مبسط لحالة سريعة
export const StatusIndicator: React.FC<{
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, size = 'md' }) => {
  const getConfig = () => {
    switch (status) {
      case 'connected':
        return { icon: '🟢', color: 'text-green-500' };
      case 'disconnected':
        return { icon: '⚪', color: 'text-gray-400' };
      case 'error':
        return { icon: '🔴', color: 'text-red-500' };
      case 'syncing':
        return { icon: '🔄', color: 'text-blue-500' };
      default:
        return { icon: '⚪', color: 'text-gray-400' };
    }
  };

  const config = getConfig();
  const sizeClass = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';

  return (
    <div className={`inline-flex items-center justify-center ${sizeClass}`}>
      <span className={`${config.color} text-xs`}>{config.icon}</span>
    </div>
  );
};