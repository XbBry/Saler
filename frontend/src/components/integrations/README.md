# مكونات إدارة التكاملات

مجموعة شاملة من مكونات React لإدارة تكاملات النظام مع الأنظمة الخارجية.

## المكونات المتوفرة

### 1. IntegrationCard
بطاقة تعرض معلومات التكامل وحالته مع أزرار التحكم.

```tsx
import { IntegrationCard } from '@/components/integrations';

<IntegrationCard
  integration={integration}
  onConnect={handleConnect}
  onDisconnect={handleDisconnect}
  onConfigure={handleConfigure}
  onManage={handleManage}
/>
```

**الخصائص:**
- `integration`: بيانات التكامل
- `onConnect`: دالة الاتصال
- `onDisconnect`: دالة قطع الاتصال
- `onConfigure`: دالة الإعداد
- `onManage`: دالة الإدارة

### 2. IntegrationStatus
مكون لعرض حالة التكامل مع تفاصيل إضافية.

```tsx
import { IntegrationStatus } from '@/components/integrations';

// عرض مختصر
<IntegrationStatus status="connected" />

// عرض تفصيلي
<IntegrationStatus 
  status="error"
  lastActivity={new Date()}
  errorMessage="فشل في الاتصال"
  successRate={85.5}
  showDetails={true}
/>
```

**الخصائص:**
- `status`: حالة التكامل (connected, disconnected, error, syncing)
- `lastActivity`: آخر نشاط
- `errorMessage`: رسالة الخطأ
- `successRate`: معدل النجاح
- `showDetails`: عرض التفاصيل

### 3. WebhookList
قائمة عرض وإدارة webhooks.

```tsx
import { WebhookList } from '@/components/integrations';

<WebhookList
  webhooks={webhooks}
  onTest={handleTest}
  onRetry={handleRetry}
  onToggle={handleToggle}
  onDelete={handleDelete}
  onEdit={handleEdit}
/>
```

**الخصائص:**
- `webhooks`: قائمة webhooks
- `onTest`: اختبار webhook
- `onRetry`: إعادة المحاولة
- `onToggle`: تفعيل/إيقاف
- `onDelete`: حذف
- `onEdit`: تعديل

### 4. IntegrationForm
نموذج إضافة أو تعديل التكاملات.

```tsx
import { IntegrationForm } from '@/components/integrations';

<IntegrationForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  onTestConnection={handleTestConnection}
  isEditing={false}
/>
```

**الخصائص:**
- `integration`: بيانات التكامل للتعديل
- `onSubmit`: إرسال النموذج
- `onCancel`: إلغاء
- `onTestConnection`: اختبار الاتصال
- `isEditing`: وضع التعديل

### 5. SyncStatus
عرض حالة ومتابعة عمليات المزامنة.

```tsx
import { SyncStatus } from '@/components/integrations';

<SyncStatus
  integrationId="integration-1"
  isActive={true}
  onStartSync={handleStartSync}
  onCancelSync={handleCancelSync}
  syncItems={syncItems}
  stats={syncStats}
/>
```

**الخصائص:**
- `integrationId`: معرف التكامل
- `isActive`: حالة المزامنة
- `onStartSync`: بدء المزامنة
- `onCancelSync`: إيقاف المزامنة
- `syncItems`: عناصر المزامنة
- `stats`: إحصائيات المزامنة

### 6. IntegrationSettings
واجهة إعدادات التكامل الشاملة.

```tsx
import { IntegrationSettings } from '@/components/integrations';

<IntegrationSettings
  integrationId="integration-1"
  generalSettings={settings}
  fieldMappings={mappings}
  filters={filters}
  webhookEndpoints={endpoints}
  onUpdateGeneralSettings={handleUpdateSettings}
  onUpdateFieldMappings={handleUpdateMappings}
  onUpdateFilters={handleUpdateFilters}
  onUpdateWebhookEndpoints={handleUpdateEndpoints}
  onSave={handleSave}
/>
```

**الخصائص:**
- `generalSettings`: الإعدادات العامة
- `fieldMappings`: مطابقة الحقول
- `filters`: فلاتر البيانات
- `webhookEndpoints`: نقاط webhook
- `onUpdateGeneralSettings`: تحديث الإعدادات العامة
- `onUpdateFieldMappings`: تحديث مطابقة الحقول
- `onUpdateFilters`: تحديث الفلاتر
- `onUpdateWebhookEndpoints`: تحديث endpoints
- `onSave`: حفظ الإعدادات

## الأنواع المتوفرة

### Integration
```typescript
interface Integration {
  id: string;
  name: string;
  description: string;
  icon?: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: Date;
  successCount: number;
  failureCount: number;
  autoSync?: boolean;
  type: string;
}
```

### Webhook
```typescript
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
```

### SyncItem
```typescript
interface SyncItem {
  id: string;
  type: 'contact' | 'deal' | 'message' | 'note' | 'activity';
  action: 'create' | 'update' | 'delete';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: Date;
  errorMessage?: string;
  data?: any;
}
```

## الاستخدام

```tsx
import { 
  IntegrationCard, 
  IntegrationForm, 
  WebhookList,
  SyncStatus,
  IntegrationSettings 
} from '@/components/integrations';

// مثال على صفحة إدارة التكاملات
function IntegrationsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">إدارة التكاملات</h1>
      
      {/* قائمة التكاملات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(integration => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onConfigure={handleConfigure}
            onManage={handleManage}
          />
        ))}
      </div>

      {/* نموذج إضافة تكامل */}
      <IntegrationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onTestConnection={handleTestConnection}
      />

      {/* قائمة webhooks */}
      <WebhookList
        webhooks={webhooks}
        onTest={handleTest}
        onRetry={handleRetry}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* حالة المزامنة */}
      <SyncStatus
        integrationId="integration-1"
        isActive={true}
        onStartSync={handleStartSync}
        onCancelSync={handleCancelSync}
        syncItems={syncItems}
        stats={syncStats}
      />

      {/* إعدادات التكامل */}
      <IntegrationSettings
        integrationId="integration-1"
        generalSettings={settings}
        fieldMappings={mappings}
        filters={filters}
        webhookEndpoints={endpoints}
        onUpdateGeneralSettings={handleUpdateSettings}
        onUpdateFieldMappings={handleUpdateMappings}
        onUpdateFilters={handleUpdateFilters}
        onUpdateWebhookEndpoints={handleUpdateEndpoints}
        onSave={handleSave}
      />
    </div>
  );
}
```

## الميزات

### ✅ ما تم تنفيذه:
- **بطاقة التكامل**: عرض شامل للمعلومات والأزرار
- **حالة التكامل**: عرض مبسط ومفصل للحالات
- **قائمة Webhooks**: إدارة كاملة مع الاختبار
- **نموذج التكامل**: إعداد وتعديل شامل
- **حالة المزامنة**: متابعة مباشرة مع سجلات
- **إعدادات التكامل**: تبويبات منظمة للإعدادات

### 🎨 المميزات:
- تصميم responsive مع Tailwind CSS
- دعم اللغة العربية
- أيقونات وألوان للحالات المختلفة
- تفاعل سلس مع المستخدم
- رسائل وأخطاء واضحة
- إعدادات متقدمة قابلة للتخصيص

### 🔧 التفاعل:
- اختبار الاتصال
- مزامنة مباشرة مع مؤشرات التقدم
- سجلات تفصيلية للعمليات
- إعدادات مرنة للفلاتر والمطابقة
- إدارة webhooks كاملة

جميع المكونات مكتوبة بـ TypeScript وتدعم التخصيص الكامل حسب احتياجات المشروع.