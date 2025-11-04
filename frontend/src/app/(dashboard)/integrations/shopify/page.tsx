'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { cn } from '../../../../lib/utils';
import { useShopifyIntegration } from '../../../../hooks/useShopifyIntegration';
import {
  ShoppingBag,
  Settings,
  Webhook,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Copy,
  Play,
  Code,
  HelpCircle,
  ExternalLink,
  Calendar,
  Users,
  Package,
  TrendingUp,
  Activity,
  Clock,
  Database,
  Key,
  Link2,
  Shield,
  Zap,
  Download,
  Upload,
  GitBranch,
  Monitor,
  AlertTriangle,
  Info
} from 'lucide-react';

// Import types from hook
import type { ShopifyConfig } from '../../../../hooks/useShopifyIntegration';

export default function ShopifyIntegrationPage() {
  // Use the custom hook for Shopify integration
  const {
    config,
    setConfig,
    webhookUrls,
    connectionStatus,
    isConnecting,
    syncStatus,
    isLoadingSyncStatus,
    testConnection,
    saveConfig,
    triggerSync,
    isConfigValid
  } = useShopifyIntegration();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showCodeExample, setShowCodeExample] = useState(false);

  const handleConnect = async () => {
    if (!isConfigValid) return;
    
    try {
      await testConnection(config);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };
  
  const handleSaveConfig = async () => {
    if (!isConfigValid) return;
    
    try {
      saveConfig(config);
    } catch (error) {
      console.error('Save config failed:', error);
    }
  };
  
  const handleTriggerSync = async () => {
    try {
      const dataTypes = [
        ...(config.syncSettings.importProducts ? ['products'] : []),
        ...(config.syncSettings.importCustomers ? ['customers'] : []),
        ...(config.syncSettings.importOrders ? ['orders'] : [])
      ];
      await triggerSync(dataTypes);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const steps = [
    { number: 1, title: 'إعداد الاتصال', description: 'توصيل متجر Shopify', icon: Settings },
    { number: 2, title: 'إعداد Webhooks', description: 'تكوين الإشعارات', icon: Webhook },
    { number: 3, title: 'ربط البيانات', description: 'ربط حقول البيانات', icon: GitBranch },
    { number: 4, title: 'إعدادات المزامنة', description: 'تكوين المزامنة', icon: RefreshCw },
    { number: 5, title: 'المراقبة', description: 'مراقبة الأداء', icon: Monitor }
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            currentStep >= step.number 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'border-gray-300 text-gray-400'
          }`}>
            <step.icon className="w-5 h-5" />
          </div>
          {index < steps.length - 1 && (
            <div className={`w-16 h-0.5 mx-4 ${
              currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderConnectionSetup = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رابط المتجر (Store URL)
            </label>
            <Input
              type="url"
              placeholder="https://your-store.myshopify.com"
              value={config.storeUrl}
              onChange={(e) => setConfig({...config, storeUrl: e.target.value})}
            />
            <p className="text-xs text-gray-500 mt-1">
              يجب أن ينتهي الرابط بـ .myshopify.com
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مفتاح API (API Key)
            </label>
            <div className="relative">
              <Input
                type="password"
                placeholder="shppa_xxxxxxxxxxxxxxxxxxxxxx"
                value={config.apiKey}
                onChange={(e) => setConfig({...config, apiKey: e.target.value})}
              />
              <Key className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم التطبيق الخاص (Private App Name)
            </label>
            <Input
              type="text"
              placeholder="Saler Integration"
              value={config.privateAppName}
              onChange={(e) => setConfig({...config, privateAppName: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الأذونات المطلوبة (Required Permissions)
            </label>
            <div className="space-y-2">
              {[
                { key: 'read_products', label: 'قراءة المنتجات', description: 'للحصول على معلومات المنتجات' },
                { key: 'read_orders', label: 'قراءة الطلبات', description: 'لمزامنة بيانات الطلبات' },
                { key: 'read_customers', label: 'قراءة العملاء', description: 'لتزامن معلومات العملاء' },
                { key: 'write_orders', label: 'تعديل الطلبات', description: 'لإدارة الطلبات في Saler' }
              ].map((permission) => (
                <div key={permission.key} className="flex items-start space-x-3 space-x-reverse">
                  <input
                    type="checkbox"
                    id={permission.key}
                    checked={config.permissions.includes(permission.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfig({
                          ...config, 
                          permissions: [...config.permissions, permission.key]
                        });
                      } else {
                        setConfig({
                          ...config,
                          permissions: config.permissions.filter(p => p !== permission.key)
                        });
                      }
                    }}
                    className="mt-1"
                  />
                  <div>
                    <label htmlFor={permission.key} className="text-sm font-medium text-gray-700">
                      {permission.label}
                    </label>
                    <p className="text-xs text-gray-500">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3 space-x-reverse">
          {connectionStatus === 'connected' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : connectionStatus === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-600" />
          ) : connectionStatus === 'connecting' ? (
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <AlertCircle className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-sm font-medium">
            {connectionStatus === 'connected' && 'متصل بنجاح'}
            {connectionStatus === 'connecting' && 'جاري الاتصال...'}
            {connectionStatus === 'error' && 'خطأ في الاتصال'}
            {connectionStatus === 'disconnected' && 'غير متصل'}
          </span>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button 
            onClick={handleConnect}
            disabled={isConnecting || !isConfigValid}
            loading={isConnecting}
            loadingText="جاري الاتصال..."
          >
            {isConnecting ? 'جاري الاتصال...' : 'اختبار الاتصال'}
          </Button>
          <Button 
            onClick={handleSaveConfig}
            disabled={!isConfigValid || connectionStatus !== 'connected'}
            variant="outline"
          >
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </div>
  );

  const renderWebhookConfig = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3 space-x-reverse">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">معلومات مهمة حول Webhooks</h4>
            <p className="text-sm text-blue-700 mt-1">
              Webhooks تسمح لـ Shopify بإرسال إشعارات فورية عند حدوث تغييرات في متجرك. 
              هذا يضمن مزامنة البيانات في الوقت الفعلي.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">رابط Webhooks</h4>
        <div className="space-y-3">
          {Object.entries(webhookUrls).map(([event, url]) => (
            <div key={event} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">{event}</span>
                <p className="text-xs text-gray-500 font-mono">{url}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(url)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">الأحداث المطلوبة</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'orders/create', label: 'إنشاء طلب جديد', icon: Package, enabled: true },
            { key: 'orders/updated', label: 'تحديث طلب', icon: RefreshCw, enabled: true },
            { key: 'customers/create', label: 'عميل جديد', icon: Users, enabled: true },
            { key: 'customers/update', label: 'تحديث بيانات عميل', icon: Users, enabled: true },
            { key: 'products/create', label: 'منتج جديد', icon: Package, enabled: true },
            { key: 'products/update', label: 'تحديث منتج', icon: Package, enabled: true }
          ].map((event) => (
            <div key={event.key} className="flex items-center space-x-3 space-x-reverse">
              <event.icon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">{event.label}</span>
              <div className="mr-auto">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  مفعل
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook Secret (مفتاح التحقق)
          </label>
          <div className="flex space-x-2 space-x-reverse">
            <Input
              type="text"
              placeholder="اختر مفتاح آمن للتحقق من صحة البيانات"
              value={config.webhooks.secret}
              onChange={(e) => setConfig({
                ...config,
                webhooks: { ...config.webhooks, secret: e.target.value }
              })}
            />
            <Button variant="outline">إنشاء مفتاح</Button>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 space-x-reverse">
        <Button 
          variant="outline"
          onClick={() => setShowCodeExample(!showCodeExample)}
          leftIcon={<Code className="w-4 h-4" />}
        >
          أمثلة الكود
        </Button>
        <Button variant="outline">
          اختبار Webhooks
        </Button>
      </div>

      {showCodeExample && (
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">مثال على معالجة Webhook</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => copyToClipboard(`// Shopify Webhook Handler
const crypto = require('crypto');

function verifyShopifyWebhook(data, hmacHeader, secret) {
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(data, 'utf8')
    .digest('base64');
  
  return calculatedHmac === hmacHeader;
}

// Express.js handler
app.post('/webhooks/shopify/orders', (req, res) => {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  
  if (!verifyShopifyWebhook(req.body, hmacHeader, secret)) {
    return res.status(401).send('Unauthorized');
  }
  
  const order = JSON.parse(req.body);
  
  // Process order data
  processOrder(order);
  
  res.status(200).send('OK');
});`)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <pre className="text-xs overflow-x-auto">
{`// Shopify Webhook Handler
const crypto = require('crypto');

function verifyShopifyWebhook(data, hmacHeader, secret) {
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(data, 'utf8')
    .digest('base64');
  
  return calculatedHmac === hmacHeader;
}

// Express.js handler
app.post('/webhooks/shopify/orders', (req, res) => {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  
  if (!verifyShopifyWebhook(req.body, hmacHeader, secret)) {
    return res.status(401).send('Unauthorized');
  }
  
  const order = JSON.parse(req.body);
  
  // Process order data
  processOrder(order);
  
  res.status(200).send('OK');
});`}
          </pre>
        </div>
      )}
    </div>
  );

  const renderDataMapping = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Mapping */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ربط بيانات العملاء</CardTitle>
            <CardDescription>ربط حقول عملاء Shopify مع Saler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(config.fieldMapping.customer).map(([shopifyField, salerField]) => (
              <div key={shopifyField} className="flex items-center space-x-3 space-x-reverse">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Shopify</label>
                  <div className="text-sm font-mono bg-gray-100 p-2 rounded">{shopifyField}</div>
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Saler</label>
                  <div className="text-sm font-mono bg-blue-100 p-2 rounded">{salerField}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order Mapping */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ربط بيانات الطلبات</CardTitle>
            <CardDescription>ربط حقول طلبات Shopify مع Saler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(config.fieldMapping.order).map(([shopifyField, salerField]) => (
              <div key={shopifyField} className="flex items-center space-x-3 space-x-reverse">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Shopify</label>
                  <div className="text-sm font-mono bg-gray-100 p-2 rounded">{shopifyField}</div>
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Saler</label>
                  <div className="text-sm font-mono bg-green-100 p-2 rounded">{salerField}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Product Mapping */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ربط بيانات المنتجات</CardTitle>
            <CardDescription>ربط حقول منتجات Shopify مع Saler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(config.fieldMapping.product).map(([shopifyField, salerField]) => (
              <div key={shopifyField} className="flex items-center space-x-3 space-x-reverse">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Shopify</label>
                  <div className="text-sm font-mono bg-gray-100 p-2 rounded">{shopifyField}</div>
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Saler</label>
                  <div className="text-sm font-mono bg-purple-100 p-2 rounded">{salerField}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الحقول المخصصة (Custom Fields)</CardTitle>
          <CardDescription>إضافة حقول مخصصة للربط مع بيانات Shopify الإضافية</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            إضافة حقل مخصص
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderSyncSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Zap className="w-5 h-5" />
              <span>إعدادات المزامنة التلقائية</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">المزامنة التلقائية</span>
              <input 
                type="checkbox" 
                checked={config.syncSettings.autoSync}
                onChange={(e) => setConfig({
                  ...config,
                  syncSettings: { ...config.syncSettings, autoSync: e.target.checked }
                })}
                className="rounded"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                تكرار المزامنة
              </label>
              <select 
                value={config.syncSettings.frequency}
                onChange={(e) => setConfig({
                  ...config,
                  syncSettings: { ...config.syncSettings, frequency: e.target.value as any }
                })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="realtime">الوقت الفعلي</option>
                <option value="hourly">كل ساعة</option>
                <option value="daily">يومياً</option>
                <option value="weekly">أسبوعياً</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                حل التعارضات
              </label>
              <select 
                value={config.syncSettings.conflictResolution}
                onChange={(e) => setConfig({
                  ...config,
                  syncSettings: { ...config.syncSettings, conflictResolution: e.target.value as any }
                })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="shopify">أولوية Shopify</option>
                <option value="saler">أولوية Saler</option>
                <option value="manual">مراجعة يدوية</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Database className="w-5 h-5" />
              <span>نوع البيانات</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">المزامنة مع المنتجات</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={config.syncSettings.importProducts}
                  onChange={(e) => setConfig({
                    ...config,
                    syncSettings: { ...config.syncSettings, importProducts: e.target.checked }
                  })}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">المزامنة مع العملاء</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={config.syncSettings.importCustomers}
                  onChange={(e) => setConfig({
                    ...config,
                    syncSettings: { ...config.syncSettings, importCustomers: e.target.checked }
                  })}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <ShoppingBag className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">المزامنة مع الطلبات</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={config.syncSettings.importOrders}
                  onChange={(e) => setConfig({
                    ...config,
                    syncSettings: { ...config.syncSettings, importOrders: e.target.checked }
                  })}
                  className="rounded"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>استيراد وتصدير البيانات</CardTitle>
          <CardDescription>إدارة البيانات المكررة أو المفقودة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 space-x-reverse">
            <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
              تصدير البيانات
            </Button>
            <Button variant="outline" leftIcon={<Upload className="w-4 h-4" />}>
              استيراد البيانات
            </Button>
            <Button variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />}>
              مزامنة يدوية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMonitoringDashboard = () => (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Shield className="w-5 h-5" />
            <span>حالة الاتصال</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                connectionStatus === 'connected' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {connectionStatus === 'connected' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <p className="text-sm font-medium">الحالة</p>
              <p className="text-xs text-gray-500">
                {connectionStatus === 'connected' ? 'متصل' : 'غير متصل'}
              </p>
            </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium">آخر مزامنة</p>
                <p className="text-xs text-gray-500">
                  {isLoadingSyncStatus ? 'جاري التحميل...' : (syncStatus?.lastSync || 'لم يتم المزامنة بعد')}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium">إجمالي السجلات</p>
                <p className="text-xs text-gray-500">
                  {isLoadingSyncStatus ? '...' : (syncStatus?.totalRecords?.toLocaleString() || '0')}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-sm font-medium">أخطاء المزامنة</p>
                <p className="text-xs text-gray-500">
                  {isLoadingSyncStatus ? '...' : `${syncStatus?.failedSyncs || 0} أخطاء`}
                </p>
              </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Activity className="w-5 h-5" />
            <span>نشاط المزامنة</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">مزامنة المنتجات</span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{width: `${syncStatus?.syncProgress || 0}%`}}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {isLoadingSyncStatus ? '...' : `${syncStatus?.syncProgress || 0}%`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">مزامنة العملاء</span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{width: `${Math.min(100, (syncStatus?.syncProgress || 0) + 25)}%`}}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {isLoadingSyncStatus ? '...' : (syncStatus?.syncProgress > 25 ? 'مكتمل' : '...')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">مزامنة الطلبات</span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{width: `${Math.max(0, (syncStatus?.syncProgress || 0) - 30)}%`}}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {isLoadingSyncStatus ? '...' : `${Math.max(0, (syncStatus?.syncProgress || 0) - 30)}%`}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card>
        <CardHeader>
          <CardTitle>سجل الأخطاء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 space-x-reverse p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">فشل في مزامنة الطلب #1234</p>
                <p className="text-xs text-red-600">خطأ في الشبكة - إعادة المحاولة</p>
              </div>
              <span className="text-xs text-red-600">منذ 5 دقائق</span>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">حقل مفقود في بيانات العميل</p>
                <p className="text-xs text-yellow-600">البريد الإلكتروني مطلوب للعميل ID: 5678</p>
              </div>
              <span className="text-xs text-yellow-600">منذ 15 دقيقة</span>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">انقطاع في اتصال Shopify</p>
                <p className="text-xs text-red-600">تم استعادة الاتصال تلقائياً</p>
              </div>
              <span className="text-xs text-red-600">منذ 30 دقيقة</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBenefitsAndRequirements = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <TrendingUp className="w-5 h-5" />
            <span>فوائد التكامل مع Shopify</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <span className="text-sm text-gray-700">مزامنة فورية للطلبات والعملاء</span>
            </li>
            <li className="flex items-start space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <span className="text-sm text-gray-700">إدارة مركزية للمبيعات عبر جميع القنوات</span>
            </li>
            <li className="flex items-start space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <span className="text-sm text-gray-700">تحسين تجربة العملاء</span>
            </li>
            <li className="flex items-start space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <span className="text-sm text-gray-700">تقارير تحليلية شاملة</span>
            </li>
            <li className="flex items-start space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <span className="text-sm text-gray-700">توفير الوقت والجهد في إدارة البيانات</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Shield className="w-5 h-5" />
            <span>متطلبات التكامل</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm text-gray-700">حساب Shopify متجر نشط</span>
            </li>
            <li className="flex items-start space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm text-gray-700">صلاحيات المدير في Shopify</span>
            </li>
            <li className="flex items-start space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm text-gray-700">HTTPS مفعل للموقع</span>
            </li>
            <li className="flex items-start space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm text-gray-700">خادم يدعم webhooks</span>
            </li>
            <li className="flex items-start space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm text-gray-700">اتصال مستقر بالإنترنت</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 1:
        return renderConnectionSetup();
      case 2:
        return renderWebhookConfig();
      case 3:
        return renderDataMapping();
      case 4:
        return renderSyncSettings();
      case 5:
        return renderMonitoringDashboard();
      default:
        return renderConnectionSetup();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <div className="bg-green-600 p-2 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">تكامل Shopify</h1>
              <p className="text-gray-600">ربط متجر Shopify مع نظام Saler لإدارة المبيعات والعملاء</p>
            </div>
          </div>

          {/* Benefits and Requirements */}
          {renderBenefitsAndRequirements()}
        </div>

        {/* Step Navigation */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            {renderStepIndicator()}
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <span>الخطوة {currentStep}: {steps[currentStep - 1].title}</span>
            </CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            >
              السابق
            </Button>
            <div className="flex space-x-2 space-x-reverse">
              <Button variant="outline" leftIcon={<HelpCircle className="w-4 h-4" />}>
                مساعدة
              </Button>
              <Button 
                disabled={currentStep === steps.length}
                onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
              >
                التالي
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center space-x-4 space-x-reverse">
          <Button variant="outline" leftIcon={<ExternalLink className="w-4 h-4" />}>
            عرض الوثائق
          </Button>
          <Button variant="outline" leftIcon={<Code className="w-4 h-4" />}>
            أمثلة API
          </Button>
          <Button variant="outline" leftIcon={<HelpCircle className="w-4 h-4" />}>
            الدعم التقني
          </Button>
        </div>
      </div>
    </div>
  );
}

// Missing import for Plus icon
function Plus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}