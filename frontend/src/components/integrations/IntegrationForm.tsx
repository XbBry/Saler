import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { createIntegrationSchema, IntegrationConfig } from '../../schemas/integrations';
import { validationEngine } from '../../schemas';
import { useValidationErrorHandler } from '../../lib/error-handler';
import { Alert } from '../ui/Alert';

interface IntegrationConfig {
  id?: string;
  name: string;
  description: string;
  type: string;
  provider: string;
  credentials: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    username?: string;
    password?: string;
    privateKey?: string;
    certificate?: string;
    webhookUrl?: string;
    webhookSecret?: string;
  };
  settings: {
    baseUrl?: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    rateLimit?: {
      requests: number;
      window: number;
    };
    sync?: {
      enabled: boolean;
      interval: number;
      direction: 'pull' | 'push' | 'bidirectional';
      autoStart: boolean;
    };
    notifications?: {
      enabled: boolean;
      email: boolean;
      webhook: boolean;
      criticalOnly: boolean;
    };
  };
  mappings?: Record<string, any>;
  filters?: Record<string, any>;
}

interface IntegrationFormProps {
  integration?: IntegrationConfig;
  onSubmit: (config: IntegrationConfig) => void;
  onCancel: () => void;
  onTestConnection?: (config: IntegrationConfig) => Promise<boolean>;
  isEditing?: boolean;
}

export const IntegrationForm: React.FC<IntegrationFormProps> = ({
  integration,
  onSubmit,
  onCancel,
  onTestConnection,
  isEditing = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    trigger,
    reset
  } = useForm<IntegrationConfig>({
    resolver: zodResolver(createIntegrationSchema),
    defaultValues: integration || {
      name: '',
      description: '',
      type: '',
      provider: '',
      credentials: {
        apiKey: '',
        clientId: '',
        clientSecret: '',
        accessToken: '',
        refreshToken: '',
        username: '',
        password: '',
        webhookUrl: '',
        webhookSecret: ''
      },
      settings: {
        timeout: 30,
        retryAttempts: 3,
        retryDelay: 1000,
        sync: {
          enabled: false,
          interval: 60,
          direction: 'bidirectional',
          autoStart: false
        },
        notifications: {
          enabled: true,
          email: true,
          webhook: false,
          criticalOnly: false
        }
      }
    },
    mode: 'onChange'
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    warnings?: string[];
  } | null>(null);
  
  const { fieldErrors, generalErrors, warnings, handleValidationResult, handleApiError, clearErrors } = useValidationErrorHandler();
  
  // Watch form values for dynamic fields
  const watchedType = watch('type');
  const watchedProvider = watch('provider');
  const watchedSyncEnabled = watch('settings.sync.enabled');

  const integrationTypes = [
    { value: 'crm', label: 'CRM', icon: '🔗' },
    { value: 'email', label: 'البريد الإلكتروني', icon: '📧' },
    { value: 'slack', label: 'Slack', icon: '💬' },
    { value: 'webhook', label: 'Webhook', icon: '🔗' },
    { value: 'api', label: 'API مخصص', icon: '🔌' },
    { value: 'database', label: 'قاعدة البيانات', icon: '🗄️' },
    { value: 'analytics', label: 'التحليلات', icon: '📊' },
    { value: 'social', label: 'وسائل التواصل', icon: '📱' }
  ];

  const onSubmit = async (data: IntegrationConfig) => {
    clearErrors();
    
    // Validate form data with Zod
    const validationResult = validationEngine.validate('createIntegration', data);
    const isValid = handleValidationResult(validationResult);
    
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(data);
      // Reset form on success
      if (!isEditing) {
        reset();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      const processedError = handleApiError(error);
      
      if (!processedError.isValidationError) {
        // Show user-friendly error message
        setTestResult({
          success: false,
          message: processedError.message
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!onTestConnection) return;

    const currentData = watch();
    clearErrors();
    setTestResult(null);
    setTestingConnection(true);

    try {
      // Validate before testing
      const validationResult = validationEngine.validate('integrationTest', {
        integrationId: integration?.id || 'test',
        testData: currentData
      });
      
      const isValid = handleValidationResult(validationResult);
      
      if (!isValid) {
        setTestResult({
          success: false,
          message: 'يرجى التحقق من صحة البيانات قبل اختبار الاتصال.'
        });
        return;
      }

      const success = await onTestConnection(currentData);
      
      setTestResult({
        success,
        message: success 
          ? 'تم الاتصال بنجاح!' 
          : 'فشل في الاتصال. يرجى التحقق من البيانات.',
        warnings: validationResult.warnings
      });
    } catch (error) {
      const processedError = handleApiError(error);
      
      setTestResult({
        success: false,
        message: processedError.message || 'حدث خطأ أثناء اختبار الاتصال.'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const renderFieldsByType = () => {
    switch (formData.type) {
      case 'api':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رابط API الأساسي
              </label>
              <input
                type="url"
                value={formData.baseUrl || ''}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={formData.apiKey || ''}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Secret (اختياري)
              </label>
              <input
                type="password"
                value={formData.apiSecret || ''}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                value={formData.webhookUrl || ''}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-domain.com/webhook"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h4 className="font-medium text-blue-900 mb-2">معلومات مهمة:</h4>
              <p className="text-blue-800 text-sm">
                سيتم إنشاء webhook endpoint تلقائياً لك. يمكنك استخدامه لاستقبال البيانات من أنظمة خارجية.
              </p>
            </div>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع قاعدة البيانات
              </label>
              <select
                value={formData.fields?.databaseType || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  fields: { ...formData.fields, databaseType: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر نوع قاعدة البيانات</option>
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mongodb">MongoDB</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connection String
              </label>
              <input
                type="text"
                value={formData.fields?.connectionString || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  fields: { ...formData.fields, connectionString: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="mysql://user:password@localhost:3306/database"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={formData.apiKey || ''}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Secret (اختياري)
              </label>
              <input
                type="password"
                value={formData.apiSecret || ''}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">
          {isEditing ? 'تعديل التكامل' : 'إضافة تكامل جديد'}
        </h2>

        {/* عرض الأخطاء العامة */}
        {generalErrors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <div className="font-medium">خطأ في النموذج</div>
            <div className="text-sm mt-1">
              {generalErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </Alert>
        )}

        {/* عرض التحذيرات */}
        {warnings.length > 0 && (
          <Alert variant="warning" className="mb-4">
            <div className="font-medium">تحذيرات</div>
            <div className="text-sm mt-1">
              {warnings.map((warning, index) => (
                <div key={index}>{warning}</div>
              ))}
            </div>
          </Alert>
        )}

        {/* رسائل اختبار الاتصال */}
        {testResult && (
          <Alert 
            variant={testResult.success ? "default" : "destructive"} 
            className="mb-4"
          >
            <div className="font-medium">
              {testResult.success ? '✅ نجح الاختبار' : '❌ فشل الاختبار'}
            </div>
            <div className="text-sm mt-1">{testResult.message}</div>
            {testResult.warnings && testResult.warnings.length > 0 && (
              <div className="text-sm mt-1 text-yellow-600">
                <strong>تحذيرات:</strong>
                {testResult.warnings.map((warning, index) => (
                  <div key={index}>• {warning}</div>
                ))}
              </div>
            )}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* معلومات أساسية */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">المعلومات الأساسية</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع التكامل
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {integrationTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم التكامل
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
                الوصف
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>
          </div>

          {/* إعدادات الاتصال */}
          {formData.type && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">إعدادات الاتصال</h3>
              {renderFieldsByType()}
            </div>
          )}

          {/* إعدادات متقدمة */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">إعدادات متقدمة</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  timeout (ثانية)
                </label>
                <input
                  type="number"
                  value={formData.timeout || 30}
                  onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="5"
                  max="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عدد المحاولات
                </label>
                <input
                  type="number"
                  value={formData.retryAttempts || 3}
                  onChange={(e) => setFormData({ ...formData, retryAttempts: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoSync"
                checked={formData.autoSync || false}
                onChange={(e) => setFormData({ ...formData, autoSync: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoSync" className="text-sm font-medium text-gray-700">
                تفعيل المزامنة التلقائية
              </label>
            </div>

            {formData.autoSync && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  فترة المزامنة (دقيقة)
                </label>
                <input
                  type="number"
                  value={formData.syncInterval || 60}
                  onChange={(e) => setFormData({ ...formData, syncInterval: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="1440"
                />
              </div>
            )}
          </div>

          {/* رسائل اختبار الاتصال */}
          {testResult && (
            <div className={`p-3 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                <span>{testResult.success ? '✅' : '❌'}</span>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'جاري الحفظ...' : (isEditing ? 'حفظ التغييرات' : 'إضافة التكامل')}
            </Button>

            {onTestConnection && formData.type && (
              <Button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                variant="secondary"
              >
                {testingConnection ? 'جاري الاختبار...' : 'اختبار الاتصال'}
              </Button>
            )}

            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};