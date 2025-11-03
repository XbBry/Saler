# نظام إدارة التكاملات - Error Handling & Retry Logic

نظام شامل لإدارة التكاملات مع معالجة الأخطاء المتقدمة وآليات إعادة المحاولة الذكية.

## 📋 المحتويات

- [الميزات الأساسية](#-الميزات-الأساسية)
- [التثبيت والإعداد](#-التثبيت-والإعداد)
- [الاستخدام السريع](#-الاستخدام-السريع)
- [Error Classes](#-error-classes)
- [Retry Strategies](#-retry-strategies)
- [Rate Limiting](#-rate-limiting)
- [الأمان والمراقبة](#-الأمان-والمراقبة)
- [أمثلة الاستخدام](#-أمثلة-الاستخدام)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Best Practices](#-best-practices)

## 🚀 الميزات الأساسية

### معالجة الأخطاء المتقدمة
- **Error Classification**: تصنيف الأخطاء حسب النوع والسبب
- **Retry Logic**: آليات إعادة المحاولة مع Exponential Backoff
- **Circuit Breaker**: حماية من الأخطاء المتكررة
- **Rate Limiting**: إدارة حدود الطلبات
- **Health Checks**: فحوصات الصحة التلقائية

### الأداء والمراقبة
- **Performance Monitoring**: تتبع أداء العمليات
- **Metrics Collection**: جمع مقاييس الأداء
- **Alert Management**: إدارة التنبيهات
- **Log Aggregation**: تجميع السجلات

### الأمان والتحقق
- **Webhook Verification**: التحقق من توقيعات الـ webhooks
- **API Key Validation**: التحقق من صحة مفاتيح API
- **OAuth Token Refresh**: تجديد رموز OAuth تلقائياً
- **SSL/TLS Checking**: فحص شهادات الأمان

### معالجة البيانات
- **Data Transformation**: تحويل البيانات
- **Batch Processing**: معالجة دفعات البيانات
- **Data Enrichment**: إثراء البيانات
- **Conflict Resolution**: حل تضارب البيانات

## 🔧 التثبيت والإعداد

### المتطلبات
```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.2",
    "sonner": "^1.3.1"
  }
}
```

### الإعداد الأساسي

```typescript
import { useIntegrations } from '@/hooks/useIntegrations';

const MyComponent = () => {
  const {
    integrations,
    isLoading,
    error,
    syncIntegration,
    testConnection,
  } = useIntegrations({
    autoRefresh: true,
    refreshInterval: 30000,
    enableMetrics: true,
    enableHealthChecks: true,
  });

  // استخدام الـ hook
};
```

## ⚡ الاستخدام السريع

### 1. إنشاء تكامل جديد
```typescript
const { createIntegration } = useIntegrations();

const handleCreate = async () => {
  await createIntegration({
    name: 'Salesforce CRM',
    type: 'crm',
    config: {
      instanceUrl: 'https://mydomain.salesforce.com',
      apiVersion: 'v58.0',
    },
    credentials: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    },
  });
};
```

### 2. اختبار الاتصال
```typescript
const { testConnection } = useIntegrations();

const handleTest = async (integrationId: string) => {
  try {
    const isConnected = await testConnection(integrationId);
    console.log('Connected:', isConnected);
  } catch (error) {
    console.error('Connection failed:', error);
  }
};
```

### 3. مزامنة البيانات
```typescript
const { syncIntegration } = useIntegrations();

const handleSync = async (integrationId: string) => {
  try {
    const operation = await syncIntegration(integrationId, {
      direction: 'both',
      dataTypes: ['contacts', 'deals', 'activities'],
    });
    console.log('Sync completed:', operation);
  } catch (error) {
    console.error('Sync failed:', error);
  }
};
```

### 4. إرسال البيانات
```typescript
const { pushData } = useIntegrations();

const handlePush = async (integrationId: string) => {
  const data = {
    contact: {
      firstName: 'أحمد',
      lastName: 'محمد',
      email: 'ahmed@example.com',
    },
  };

  try {
    const result = await pushData(integrationId, data, 'contacts');
    console.log('Data pushed:', result);
  } catch (error) {
    console.error('Push failed:', error);
  }
};
```

## ❌ Error Classes

### IntegrationError
```typescript
class IntegrationError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;
  public readonly metadata?: Record<string, any>;
}

// الاستخدام
throw new IntegrationError(
  'Integration failed',
  'INTEGRATION_ERROR',
  500,
  false,
  { integrationId: '123' }
);
```

### ConnectionError
```typescript
class ConnectionError extends IntegrationError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'CONNECTION_ERROR', undefined, true, metadata);
  }
}

// الاستخدام
throw new ConnectionError('Network timeout', { host: 'api.example.com' });
```

### RateLimitError
```typescript
class RateLimitError extends IntegrationError {
  public readonly retryAfter?: number;
  public readonly limit?: number;

  constructor(message: string, retryAfter?: number, limit?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429, true);
    this.retryAfter = retryAfter;
    this.limit = limit;
  }
}

// الاستخدام
throw new RateLimitError('Too many requests', 60, 100);
```

### WebhookError
```typescript
class WebhookError extends IntegrationError {
  public readonly signature?: string;
  public readonly timestamp?: string;

  constructor(message: string, signature?: string, timestamp?: string) {
    super(message, 'WEBHOOK_ERROR', undefined, false);
    this.signature = signature;
    this.timestamp = timestamp;
  }
}
```

### DataMappingError
```typescript
class DataMappingError extends IntegrationError {
  public readonly sourceData?: any;
  public readonly targetSchema?: string;

  constructor(message: string, sourceData?: any, targetSchema?: string) {
    super(message, 'DATA_MAPPING_ERROR', undefined, false);
    this.sourceData = sourceData;
    this.targetSchema = targetSchema;
  }
}
```

## 🔄 Retry Strategies

### Fixed Interval Retry
```typescript
import { retryManager } from '@/lib/integration-utils';

const result = await retryManager.executeWithRetry(
  async () => apiCall(),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 1, // No exponential backoff
    jitter: false,
  }
);
```

### Exponential Backoff
```typescript
const result = await retryManager.executeWithRetry(
  async () => apiCall(),
  {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true, // Add random jitter
  }
);
```

### Custom Retry Condition
```typescript
const result = await retryManager.executeWithRetry(
  async () => apiCall(),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error) => {
      // Retry only on specific errors
      if (error instanceof RateLimitError) return true;
      if (error.statusCode >= 500) return true;
      return false;
    }
  }
);
```

### Circuit Breaker Pattern
```typescript
const result = await retryManager.executeWithRetry(
  async () => apiCall(),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
  },
  'api-endpoint-identifier' // Circuit breaker context
);
```

## 🚦 Rate Limiting

### Manual Rate Limit Management
```typescript
import { rateLimitManager } from '@/lib/integration-utils';

// Check if we can make a request
if (rateLimitManager.canMakeRequest('api-key')) {
  const response = await apiCall();
  
  // Update rate limit info from response headers
  rateLimitManager.updateLimit('api-key', {
    limit: parseInt(response.headers['x-ratelimit-limit']),
    remaining: parseInt(response.headers['x-ratelimit-remaining']),
    resetTime: parseInt(response.headers['x-ratelimit-reset']) * 1000,
  });
} else {
  const retryAfter = rateLimitManager.getRetryAfter('api-key');
  console.log(`Wait ${retryAfter}ms before next request`);
}
```

### Automatic Rate Limit Handling
```typescript
const { pushData } = useIntegrations();

try {
  await pushData(integrationId, data);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
    // The system will automatically retry based on the retryAfter value
  }
}
```

## 🔒 الأمان والمراقبة

### Webhook Signature Verification
```typescript
import { WebhookSecurity } from '@/lib/integration-utils';

const result = WebhookSecurity.verifySignature(
  payload,
  signature,
  webhookSecret,
  300000 // 5 minutes tolerance
);

if (result.isValid) {
  // Process webhook
  console.log('Valid webhook:', result.payload);
} else {
  console.error('Invalid webhook:', result.error);
}
```

### Health Checks
```typescript
import { HealthChecker } from '@/lib/integration-utils';

// Register custom health check
HealthChecker.registerCheck('database', async () => {
  try {
    await db.ping();
    return { status: 'healthy', responseTime: 10 };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
});

// Run all health checks
const checks = await HealthChecker.runAllChecks();
const isSystemHealthy = await HealthChecker.isHealthy();
```

### Performance Monitoring
```typescript
import { PerformanceMonitor } from '@/lib/integration-utils';

// Monitor custom operation
const startTime = Date.now();
try {
  const result = await performOperation();
  
  PerformanceMonitor.recordMetric({
    operation: 'custom-operation',
    duration: Date.now() - startTime,
    timestamp: Date.now(),
    status: 'success',
    metadata: { userId: '123' }
  });
  
  return result;
} catch (error) {
  PerformanceMonitor.recordMetric({
    operation: 'custom-operation',
    duration: Date.now() - startTime,
    timestamp: Date.now(),
    status: 'error',
    error: error.message,
    metadata: { userId: '123' }
  });
  throw error;
}

// Get performance metrics
const metrics = PerformanceMonitor.getMetrics('custom-operation');
const avgDuration = PerformanceMonitor.getAverageDuration('custom-operation');
const successRate = PerformanceMonitor.getSuccessRate('custom-operation');
```

## 📊 أمثلة الاستخدام

### Dashboard مع إحصائيات شاملة
```typescript
function IntegrationDashboard() {
  const { integrations, stats, activeOperations } = useIntegrations();

  return (
    <div>
      <StatsOverview stats={stats} />
      <IntegrationList integrations={integrations} />
      <ActiveOperations operations={activeOperations} />
    </div>
  );
}
```

### فلترة وبحث متقدم
```typescript
function IntegrationList() {
  const { integrations, filters, setFilters } = useIntegrations();

  return (
    <div>
      <Filters
        type={filters.type}
        status={filters.status}
        search={filters.search}
        onChange={setFilters}
      />
      
      <div className="integrations-grid">
        {integrations.map(integration => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </div>
  );
}
```

### معالجة الأخطاء المتقدمة
```typescript
function AdvancedErrorHandling() {
  const { syncIntegration } = useIntegrations();

  const handleSync = async (integrationId: string) => {
    try {
      await syncIntegration(integrationId);
    } catch (error) {
      switch (error.constructor.name) {
        case 'RateLimitError':
          showNotification('سيتم إعادة المحاولة تلقائياً', 'info');
          break;
        case 'ConnectionError':
          showNotification('تحقق من الاتصال بالإنترنت', 'warning');
          break;
        case 'IntegrationError':
          showNotification('خطأ في التكامل، راجع الإعدادات', 'error');
          break;
        default:
          showNotification('خطأ غير متوقع', 'error');
      }
    }
  };

  return <button onClick={() => handleSync('id')}>Sync</button>;
}
```

## 📚 API Reference

### useIntegrations Hook

#### Parameters
```typescript
interface UseIntegrationsOptions {
  autoRefresh?: boolean;          // تمكين التحديث التلقائي
  refreshInterval?: number;       // فترة التحديث (بالميلي ثانية)
  enableMetrics?: boolean;        // تمكين جمع المقاييس
  enableHealthChecks?: boolean;   // تمكين فحوصات الصحة
  retryConfig?: RetryConfig;      // إعدادات إعادة المحاولة المخصصة
}
```

#### Return Value
```typescript
interface UseIntegrationsReturn {
  // البيانات
  integrations: Integration[];
  allIntegrations: Integration[];
  stats: IntegrationStats | null;
  operations: IntegrationOperation[];
  activeOperations: IntegrationOperation[];
  
  // حالة التحميل
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // الفلترة
  filters: IntegrationFilters;
  setFilters: (filters: Partial<IntegrationFilters>) => void;
  
  // العمليات
  createIntegration: (integration: Partial<Integration>) => void;
  updateIntegration: (id: string, updates: Partial<Integration>) => void;
  deleteIntegration: (id: string) => void;
  testConnection: (id: string) => Promise<boolean>;
  syncIntegration: (id: string, options?: SyncOptions) => Promise<IntegrationOperation>;
  pushData: (id: string, data: any, endpoint?: string) => Promise<any>;
  pullData: (id: string, endpoint?: string, params?: Record<string, any>) => Promise<any>;
  cancelOperation: (operationId: string) => void;
  retryOperation: (operationId: string) => Promise<IntegrationOperation>;
  
  // الأدوات
  refresh: () => void;
  clearError: () => void;
}
```

### DataProcessor Class

#### Methods
```typescript
// التحقق من البيانات
validateData<T>(data: any, schema: z.ZodSchema<T>): Promise<ValidationResult<T>>

// تحويل البيانات
transformData<T, U>(data: T, transformer: (data: T) => U): U

// معالجة دفعات البيانات
batchProcess<T, U>(items: T[], processor: (item: T) => Promise<U>, batchSize?: number): Promise<U[]>

// إثراء البيانات
enrichData<T, U>(data: T[], enricher: (item: T) => Promise<U>): Promise<(T & U)[]>
```

### ResponseProcessor Class

#### Methods
```typescript
// معالجة استجابة API
processResponse<T>(response: any, expectedStatus?: number[]): ApiResponse<T>

// استخراج معلومات التصفح
extractPagination(response: any): PaginationInfo
```

## 🧪 Testing

### اختبار الـ Hook
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { TestUtils } from '@/lib/integration-utils';

test('should fetch integrations', async () => {
  const mockIntegrations = [{ id: '1', name: 'Test', type: 'crm', status: 'connected', config: {}, metrics: { successRate: 100, averageResponseTime: 100, totalRequests: 1, errorCount: 0 }, createdAt: '', updatedAt: '' }];
  
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ integrations: mockIntegrations }),
  });

  const { result } = renderHook(() => useIntegrations(), { wrapper });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.integrations).toEqual(mockIntegrations);
});
```

### اختبار معالجة الأخطاء
```typescript
test('should handle connection errors', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));

  const { result } = renderHook(() => useIntegrations(), { wrapper });

  await waitFor(() => {
    expect(result.current.isError).toBe(true);
  });

  expect(result.current.error).toBeTruthy();
});
```

### اختبار آليات إعادة المحاولة
```typescript
test('should retry failed operations', async () => {
  const mockOperation = jest.fn()
    .mockRejectedValueOnce(new Error('Temporary error'))
    .mockResolvedValueOnce('success');

  const result = await retryManager.executeWithRetry(
    mockOperation,
    {
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      jitter: false,
    }
  );

  expect(result).toBe('success');
  expect(mockOperation).toHaveBeenCalledTimes(2);
});
```

## 💡 Best Practices

### 1. Error Handling
```typescript
// ✅ جيد: معالجة أخطاء محددة
try {
  await syncIntegration(integrationId);
} catch (error) {
  if (error instanceof RateLimitError) {
    // معالجة خطأ حدود الطلبات
  } else if (error instanceof ConnectionError) {
    // معالجة خطأ الاتصال
  }
}

// ❌ سيء: معالجة عامة فقط
try {
  await syncIntegration(integrationId);
} catch (error) {
  console.error('Error:', error);
}
```

### 2. Retry Configuration
```typescript
// ✅ جيد: إعدادات مناسبة لنوع العملية
const emailRetryConfig = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

const criticalRetryConfig = {
  maxAttempts: 3,
  initialDelay: 500,
  maxDelay: 5000,
  backoffMultiplier: 1.5,
  jitter: false, // dla critical operations
};
```

### 3. Performance Monitoring
```typescript
// ✅ جيد: مراقبة العمليات المهمة
const startTime = Date.now();
try {
  const result = await processData(data);
  
  PerformanceMonitor.recordMetric({
    operation: 'data-processing',
    duration: Date.now() - startTime,
    timestamp: Date.now(),
    status: 'success',
    metadata: { dataSize: data.length }
  });
  
  return result;
} catch (error) {
  PerformanceMonitor.recordMetric({
    operation: 'data-processing',
    duration: Date.now() - startTime,
    timestamp: Date.now(),
    status: 'error',
    error: error.message,
    metadata: { dataSize: data.length }
  });
  throw error;
}
```

### 4. Rate Limiting
```typescript
// ✅ جيد: التحقق من حدود الطلبات قبل الإرسال
if (rateLimitManager.canMakeRequest(integrationId)) {
  await pushData(integrationId, data);
} else {
  const retryAfter = rateLimitManager.getRetryAfter(integrationId);
  scheduleRetry(() => pushData(integrationId, data), retryAfter);
}
```

### 5. Health Checks
```typescript
// ✅ جيد: فحوصات صحة مخصصة
HealthChecker.registerCheck('external-api', async () => {
  try {
    const response = await fetch('/health');
    const health = await response.json();
    
    return {
      status: health.status === 'healthy' ? 'healthy' : 'degraded',
      responseTime: health.responseTime,
      metadata: { version: health.version }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
});
```

### 6. Data Validation
```typescript
// ✅ جيد: التحقق من البيانات قبل الإرسال
const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

const validation = await DataProcessor.validateData(contactData, contactSchema);
if (!validation.success) {
  throw new DataMappingError(
    'Invalid contact data',
    contactData,
    'ContactSchema'
  );
}

await pushData(integrationId, validation.data, 'contacts');
```

## 📈 Performance Tips

1. **Batch Operations**: استخدم معالجة الدفعات للعمليات المتعددة
2. **Connection Pooling**: أعد استخدام الاتصالات النشطة
3. **Caching**: cache البيانات المتكررة
4. **Debouncing**: تجنب الطلبات المتكررة
5. **Lazy Loading**: حمل البيانات عند الحاجة

## 🐛 Troubleshooting

### مشاكل شائعة وحلولها

#### 1. Rate Limit Errors
```typescript
// المشكلة: خطأ حدود الطلبات المتكرر
// الحل: زيادة فترة إعادة المحاولة
const retryConfig = {
  maxAttempts: 5,
  initialDelay: 2000, // زيادة التأخير الأولي
  maxDelay: 60000,
  backoffMultiplier: 3,
  jitter: true,
};
```

#### 2. Connection Timeouts
```typescript
// المشكلة: مهلة الاتصال تنتهي
// الحل: تحسين إعدادات المهلة وإعادة المحاولة
const retryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 15000,
  backoffMultiplier: 2.5,
  retryCondition: (error) => {
    return error instanceof ConnectionError || error.code === 'TIMEOUT';
  }
};
```

#### 3. Memory Issues with Large Datasets
```typescript
// المشكلة: نفاد الذاكرة مع مجموعات البيانات الكبيرة
// الحل: معالجة دفعات صغيرة
const batchProcessWithLimit = async (data: any[]) => {
  const batchSize = 100; // تقليل حجم الدفعة
  return await DataProcessor.batchProcess(data, processItem, batchSize);
};
```

## 📞 الدعم والمساعدة

- **الوثائق**: راجع هذا الملف للتفاصيل الكاملة
- **الأمثلة**: تحقق من `IntegrationExamples.tsx`
- **الاختبارات**: راجع `useIntegrations.test.tsx`
- **GitHub Issues**: للإبلاغ عن المشاكل

---

**ملاحظة**: هذا النظام مصمم ليكون قابلاً للتوسع والتخصيص حسب احتياجات مشروعك المحددة.