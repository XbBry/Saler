import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface FieldMapping {
  id: string;
  source: string;
  target: string;
  required: boolean;
  defaultValue?: string;
  transformation?: string;
}

interface Filter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: string;
}

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  active: boolean;
}

interface IntegrationSettingsProps {
  integrationId: string;
  generalSettings: {
    name: string;
    description: string;
    autoSync: boolean;
    syncInterval: number;
    timeout: number;
    retryAttempts: number;
    enabled: boolean;
  };
  fieldMappings: FieldMapping[];
  filters: Filter[];
  webhookEndpoints: WebhookEndpoint[];
  onUpdateGeneralSettings: (settings: any) => void;
  onUpdateFieldMappings: (mappings: FieldMapping[]) => void;
  onUpdateFilters: (filters: Filter[]) => void;
  onUpdateWebhookEndpoints: (endpoints: WebhookEndpoint[]) => void;
  onSave: () => void;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  integrationId,
  generalSettings,
  fieldMappings,
  filters,
  webhookEndpoints,
  onUpdateGeneralSettings,
  onUpdateFieldMappings,
  onUpdateFilters,
  onUpdateWebhookEndpoints,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'mappings' | 'filters' | 'webhooks'>('general');
  const [isEditingMappings, setIsEditingMappings] = useState(false);
  const [isEditingFilters, setIsEditingFilters] = useState(false);

  const operators = [
    { value: 'equals', label: 'يساوي' },
    { value: 'not_equals', label: 'لا يساوي' },
    { value: 'contains', label: 'يحتوي على' },
    { value: 'not_contains', label: 'لا يحتوي على' },
    { value: 'greater_than', label: 'أكبر من' },
    { value: 'less_than', label: 'أصغر من' }
  ];

  const renderGeneralSettings = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">الإعدادات العامة</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            اسم التكامل
          </label>
          <input
            type="text"
            value={generalSettings.name}
            onChange={(e) => onUpdateGeneralSettings({ ...generalSettings, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الوصف
          </label>
          <textarea
            value={generalSettings.description}
            onChange={(e) => onUpdateGeneralSettings({ ...generalSettings, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              فترة المزامنة (دقيقة)
            </label>
            <input
              type="number"
              value={generalSettings.syncInterval}
              onChange={(e) => onUpdateGeneralSettings({ ...generalSettings, syncInterval: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              timeout (ثانية)
            </label>
            <input
              type="number"
              value={generalSettings.timeout}
              onChange={(e) => onUpdateGeneralSettings({ ...generalSettings, timeout: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              max="300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            عدد المحاولات
          </label>
          <input
            type="number"
            value={generalSettings.retryAttempts}
            onChange={(e) => onUpdateGeneralSettings({ ...generalSettings, retryAttempts: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="10"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enabled"
              checked={generalSettings.enabled}
              onChange={(e) => onUpdateGeneralSettings({ ...generalSettings, enabled: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              تفعيل التكامل
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoSync"
              checked={generalSettings.autoSync}
              onChange={(e) => onUpdateGeneralSettings({ ...generalSettings, autoSync: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoSync" className="text-sm font-medium text-gray-700">
              تفعيل المزامنة التلقائية
            </label>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderFieldMappings = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">مطابقة الحقول</h3>
        <Button
          onClick={() => setIsEditingMappings(!isEditingMappings)}
          variant={isEditingMappings ? 'secondary' : 'outline'}
          size="sm"
        >
          {isEditingMappings ? 'إلغاء' : 'تعديل'}
        </Button>
      </div>

      <div className="space-y-4">
        {fieldMappings.map((mapping) => (
          <div key={mapping.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{mapping.source}</span>
                <span className="text-gray-400">→</span>
                <span className="font-medium">{mapping.target}</span>
                {mapping.required && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    مطلوب
                  </span>
                )}
              </div>
            </div>
            
            {mapping.transformation && (
              <p className="text-sm text-gray-600 mb-2">
                تحويل: {mapping.transformation}
              </p>
            )}
            
            {mapping.defaultValue && (
              <p className="text-sm text-gray-600">
                قيمة افتراضية: {mapping.defaultValue}
              </p>
            )}

            {isEditingMappings && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline">تعديل</Button>
                <Button size="sm" variant="destructive">حذف</Button>
              </div>
            )}
          </div>
        ))}

        {isEditingMappings && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Button variant="outline" className="w-full">
              إضافة مطابقة جديدة
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  const renderFilters = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">فلاتر البيانات</h3>
        <Button
          onClick={() => setIsEditingFilters(!isEditingFilters)}
          variant={isEditingFilters ? 'secondary' : 'outline'}
          size="sm"
        >
          {isEditingFilters ? 'إلغاء' : 'تعديل'}
        </Button>
      </div>

      <div className="space-y-4">
        {filters.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد فلاتر محددة. جميع البيانات سيتم مزامنتها.
          </div>
        ) : (
          filters.map((filter, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{filter.field}</span>
                  <span className="text-gray-400">
                    {operators.find(op => op.value === filter.operator)?.label}
                  </span>
                  <span className="font-medium">{filter.value}</span>
                </div>
                {isEditingFilters && (
                  <Button size="sm" variant="destructive">حذف</Button>
                )}
              </div>
            </div>
          ))
        )}

        {isEditingFilters && (
          <div className="border border-gray-300 rounded-lg p-4">
            <h4 className="font-medium mb-3">إضافة فلتر جديد</h4>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="اسم الحقل"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                {operators.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="القيمة"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button size="sm">إضافة</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  const renderWebhookEndpoints = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Webhook Endpoints</h3>
        <Button variant="outline" size="sm">
          إضافة endpoint
        </Button>
      </div>

      <div className="space-y-4">
        {webhookEndpoints.map((endpoint) => (
          <div key={endpoint.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                  endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                  endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {endpoint.method}
                </span>
                <span className="font-medium">{endpoint.name}</span>
                <div className={`w-2 h-2 rounded-full ${endpoint.active ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">تعديل</Button>
                <Button size="sm" variant="destructive">حذف</Button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded p-2 mb-2">
              <code className="text-sm text-gray-800 font-mono">{endpoint.url}</code>
            </div>

            {endpoint.headers && Object.keys(endpoint.headers).length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600">Headers</summary>
                <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(endpoint.headers, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}

        {webhookEndpoints.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد webhook endpoints معرفة
          </div>
        )}
      </div>
    </Card>
  );

  const tabs = [
    { id: 'general', label: 'عام', icon: '⚙️' },
    { id: 'mappings', label: 'مطابقة الحقول', icon: '🔗' },
    { id: 'filters', label: 'فلاتر', icon: '🔍' },
    { id: 'webhooks', label: 'Webhooks', icon: '🔗' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* تبويبات */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* محتوى التبويبات */}
      <div className="space-y-6">
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'mappings' && renderFieldMappings()}
        {activeTab === 'filters' && renderFilters()}
        {activeTab === 'webhooks' && renderWebhookEndpoints()}
      </div>

      {/* أزرار الحفظ */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <Button onClick={onSave} className="bg-blue-600 hover:bg-blue-700">
          حفظ الإعدادات
        </Button>
        <Button variant="secondary">
          إلغاء
        </Button>
      </div>
    </div>
  );
};