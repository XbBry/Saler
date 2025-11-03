import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { IntegrationStatus } from './IntegrationStatus';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon?: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  successCount: number;
  failureCount: number;
  autoSync?: boolean;
}

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onConfigure: (id: string) => void;
  onManage: (id: string) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onConnect,
  onDisconnect,
  onConfigure,
  onManage
}) => {
  const getIconComponent = () => {
    if (integration.icon) {
      return <img src={integration.icon} alt={integration.name} className="w-8 h-8" />;
    }
    
    // أيقونة افتراضية بناءً على نوع التكامل
    const iconMap: Record<string, string> = {
      'crm': '🔗',
      'email': '📧',
      'slack': '💬',
      'webhook': '🔗',
      'api': '🔌',
      'database': '🗄️',
      'analytics': '📊',
      'social': '📱'
    };
    
    const iconKey = integration.name.toLowerCase();
    const icon = iconMap[iconKey] || '⚙️';
    
    return (
      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-lg">
        {icon}
      </div>
    );
  };

  const getStatusColor = () => {
    switch (integration.status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'disconnected': return 'text-gray-600 bg-gray-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getIconComponent()}
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{integration.name}</h3>
            <p className="text-gray-600 text-sm">{integration.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {integration.autoSync && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              مزامنة تلقائية
            </span>
          )}
          <IntegrationStatus status={integration.status} />
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">آخر مزامنة:</span>
          <span className="text-gray-900">
            {integration.lastSync ? 
              new Date(integration.lastSync).toLocaleString('ar-SA') : 
              'لم يتم مزامنة بعد'
            }
          </span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">العمليات:</span>
          <div className="flex items-center gap-4">
            <span className="text-green-600">
              ✓ {integration.successCount} نجح
            </span>
            <span className="text-red-600">
              ✗ {integration.failureCount} فشل
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {integration.status === 'disconnected' ? (
          <Button 
            onClick={() => onConnect(integration.id)}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            الاتصال
          </Button>
        ) : (
          <Button 
            onClick={() => onDisconnect(integration.id)}
            variant="secondary"
            className="flex-1"
          >
            قطع الاتصال
          </Button>
        )}
        
        <Button 
          onClick={() => onConfigure(integration.id)}
          variant="secondary"
          className="flex-1"
        >
          الإعداد
        </Button>
        
        {integration.status === 'connected' && (
          <Button 
            onClick={() => onManage(integration.id)}
            variant="outline"
            className="flex-1"
          >
            إدارة
          </Button>
        )}
      </div>
    </Card>
  );
};