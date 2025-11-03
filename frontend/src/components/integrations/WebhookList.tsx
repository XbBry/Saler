import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface Webhook {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  status: 'active' | 'inactive' | 'failed';
  lastDelivery?: Date;
  successCount: number;
  failureCount: number;
  nextRetry?: Date;
  headers?: Record<string, string>;
  description?: string;
}

interface WebhookListProps {
  webhooks: Webhook[];
  onTest: (webhookId: string) => void;
  onRetry: (webhookId: string) => void;
  onToggle: (webhookId: string) => void;
  onDelete: (webhookId: string) => void;
  onEdit: (webhookId: string) => void;
}

export const WebhookList: React.FC<WebhookListProps> = ({
  webhooks,
  onTest,
  onRetry,
  onToggle,
  onDelete,
  onEdit
}) => {
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null);

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800'
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '⚪';
      case 'failed': return '🔴';
      default: return '⚪';
    }
  };

  const formatUrl = (url: string) => {
    const maxLength = 50;
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

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

  if (webhooks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 text-4xl mb-4">🔗</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          لا توجد webhooks
        </h3>
        <p className="text-gray-600">
          قم بإنشاء webhook جديد لبدء استقبال البيانات
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => (
        <Card key={webhook.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-xl">{getStatusIcon(webhook.status)}</span>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{webhook.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(webhook.method)}`}>
                    {webhook.method}
                  </span>
                  {webhook.description && (
                    <span className="text-sm text-gray-600">
                      {webhook.description}
                    </span>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded p-3 mb-3">
                  <code className="text-sm text-gray-800 font-mono">
                    {formatUrl(webhook.url)}
                  </code>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="text-green-600">✓</span>
                    <span>{webhook.successCount} نجح</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-red-600">✗</span>
                    <span>{webhook.failureCount} فشل</span>
                  </div>
                  {webhook.lastDelivery && (
                    <div className="flex items-center gap-1">
                      <span>📅</span>
                      <span>آخر محاولة: {formatTimeAgo(webhook.lastDelivery)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 ml-4">
              <Button
                onClick={() => onTest(webhook.id)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                اختبار
              </Button>
              
              {webhook.status === 'failed' && webhook.nextRetry && (
                <Button
                  onClick={() => onRetry(webhook.id)}
                  size="sm"
                  variant="outline"
                >
                  إعادة المحاولة
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setExpandedWebhook(
                  expandedWebhook === webhook.id ? null : webhook.id
                )}
                variant="outline"
                size="sm"
              >
                {expandedWebhook === webhook.id ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => onToggle(webhook.id)}
                size="sm"
                variant={webhook.status === 'active' ? 'secondary' : 'outline'}
              >
                {webhook.status === 'active' ? 'إيقاف' : 'تفعيل'}
              </Button>
              
              <Button
                onClick={() => onEdit(webhook.id)}
                size="sm"
                variant="secondary"
              >
                تعديل
              </Button>
              
              <Button
                onClick={() => onDelete(webhook.id)}
                size="sm"
                variant="destructive"
              >
                حذف
              </Button>
            </div>
          </div>

          {expandedWebhook === webhook.id && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              {webhook.headers && Object.keys(webhook.headers).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Headers:</h4>
                  <div className="bg-gray-50 rounded p-3">
                    <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                      {JSON.stringify(webhook.headers, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {webhook.nextRetry && webhook.status === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">🔄</span>
                    <span className="text-red-700 font-medium text-sm">
                      المحاولة التالية: {webhook.nextRetry.toLocaleString('ar-SA')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

// مكون لإضافة webhook جديد
export const AddWebhookForm: React.FC<{
  onSubmit: (webhook: Omit<Webhook, 'id' | 'successCount' | 'failureCount'>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'POST' as Webhook['method'],
    headers: {} as Record<string, string>,
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">إضافة Webhook جديد</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الاسم
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Method
          </label>
          <select
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value as Webhook['method'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الوصف (اختياري)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            إضافة
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </form>
    </Card>
  );
};