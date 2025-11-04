# دليل تطبيق Hooks المفقودة - Mock Data Replacement Guide

## نظرة عامة

هذا الدليل يوضح كيفية تطبيق الـ hooks الجديدة التي تم إنشاؤها لتحل محل Mock Data في جميع أنحاء التطبيق.

## المحتويات

1. [الـ Hooks المنشأة](#hooks-المنشأة)
2. [خطوات التطبيق](#خطوات-التطبيق)
3. [أمثلة التطبيق](#أمثلة-التطبيق)
4. [أفضل الممارسات](#أفضل-الممارسات)
5. [استكشاف الأخطاء](#استكشاف-الأخطاء)
6. [الاختبار](#الاختبار)

## الـ Hooks المنشأة

### 1. useAdvancedMessages
**الغرض:** إدارة تحليلات الرسائل المتقدمة
**البديل لـ:** Mock data في `messages/advanced/page.tsx`

```typescript
// قبل
const [dashboardStats, setDashboardStats] = useState({
  totalMessages: 1247,
  // ... more mock data
});

// بعد
const { analytics, handleFilterChange } = useAdvancedMessages({
  enableRealTime: true,
  autoRefresh: true
});
```

### 2. useDashboardAnalytics
**الغرض:** تحليلات لوحة التحكم الشاملة
**البديل لـ:** Mock data في `reports/page.tsx`

```typescript
// قبل
const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
  leads: { total: 1250, ... },
  // ... more mock data
});

// بعد
const { analytics, kpis, handleExport } = useDashboardAnalytics({
  enableForecasting: true,
  enableAlerts: true
});
```

### 3. usePlaybooks
**الغرض:** إدارة أدلة اللعب الشاملة
**البديل لـ:** Mock data في `playbooks/page.tsx`

```typescript
// قبل
const mockPlaybooks: Playbook[] = [
  {
    id: '1',
    name: 'تأهيل العملاء الجدد',
    // ... more mock data
  }
];

// بعد
const { playbooks, stats, createPlaybook } = usePlaybooks({
  enableAnalytics: true,
  enableRealTime: true
});
```

### 4. useBusinessIntelligence
**الغرض:** تحليلات الأعمال الذكية
**البديل لـ:** AI insights وpredictions mock

```typescript
// قبل
const [aiInsights] = useState([
  { type: 'opportunity', title: 'فرصة تحسين', ... }
]);

// بعد
const { insights, predictions, executeAIAction } = useBusinessIntelligence({
  enableAI: true,
  enablePredictions: true
});
```

### 5. useNotificationsSystem
**الغرض:** نظام إشعارات متقدم
**البديل لـ:** Notifications mock data

```typescript
// قبل
const [notifications] = useState([
  { id: '1', type: 'lead_alert', ... }
]);

// بعد
const { notifications, markAsRead, updatePreferences } = useNotificationsSystem({
  userId: 'current-user-id',
  enableAI: true
});
```

## خطوات التطبيق

### المرحلة 1: التجهيز

#### 1.1 تحديث imports
```typescript
// إضافة الـ hooks الجديدة
import { 
  useAdvancedMessages, 
  useDashboardAnalytics, 
  usePlaybooks,
  useBusinessIntelligence,
  useNotificationsSystem 
} from '@/hooks';
```

#### 1.2 تحديث TypeScript types
```typescript
// إزالة mock type definitions
// export interface MockAnalyticsData { ... } // حذف هذا

// استخدام types من الـ hooks
import type { 
  MessageAnalytics, 
  DashboardAnalytics, 
  BusinessInsight 
} from '@/hooks';
```

### المرحلة 2: استبدال Mock Data

#### 2.1 إزالة State المحلي
```typescript
// قبل - حذف هذه الأسطر
const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({...});
const [mockPlaybooks, setMockPlaybooks] = useState<Playbook[]>([...]);
const [dashboardStats, setDashboardStats] = useState({...});

// بعد - إزالة كامل
// لا نحتاج أي من هذا - البيانات تأتي من الـ hooks
```

#### 2.2 إضافة الـ Hooks
```typescript
// في بداية المكون
const {
  // Data
  analytics,
  playbooks,
  insights,
  
  // Loading
  isLoading,
  error,
  
  // Actions
  handleFilterChange,
  handleExport,
  refetchData
} = useAdvancedMessages({
  enableRealTime: true,
  autoRefresh: true
});
```

### المرحلة 3: تحديث Functions

#### 3.1 استبدال Load Functions
```typescript
// قبل
const loadAnalyticsData = async () => {
  setLoading(true);
  try {
    // محاكاة API call
    setTimeout(() => {
      setAnalyticsData({ /* mock data */ });
      setLoading(false);
    }, 1000);
  } catch (error) {
    setError(error);
  }
};

// بعد
const handleRefresh = useCallback(async () => {
  await refetchData();
}, [refetchData]);
```

#### 3.2 استبدال Handler Functions
```typescript
// قبل
const handleExport = (format: string) => {
  // mock export logic
  const data = generateMockExportData();
  downloadFile(data, `report.${format}`);
};

// بعد
const handleExport = useCallback(async (format: string) => {
  await exportAnalytics(format, {
    includeCharts: true,
    includeRawData: true
  });
}, [exportAnalytics]);
```

### المرحلة 4: تحديث UI

#### 4.1 استخدام البيانات من الـ Hooks
```typescript
// قبل
<div className="kpi-card">
  <h3>إجمالي العملاء</h3>
  <p>{analyticsData.leads.total}</p>
</div>

// بعد
<div className="kpi-card">
  <h3>إجمالي العملاء</h3>
  <p>{analytics?.performance?.leads_per_day || 0}</p>
</div>
```

#### 4.2 تحديث Loading States
```typescript
// قبل
if (loading) {
  return <LoadingSpinner />;
}

// بعد
if (isLoading) {
  return (
    <div className="loading-container">
      <LoadingSpinner />
      {enableRealTime && (
        <p className="text-sm text-gray-500">
          تحديث تلقائي كل {Math.round(refreshInterval / 1000)} ثانية
        </p>
      )}
    </div>
  );
}
```

#### 4.3 تحديث Error States
```typescript
// قبل
if (error) {
  return <div>حدث خطأ: {error}</div>;
}

// بعد
if (error) {
  return (
    <ErrorBoundary
      error={error}
      onRetry={refetchData}
      onGoBack={() => router.back()}
    />
  );
}
```

## أمثلة التطبيق

### مثال 1: صفحة التقارير

#### قبل:
```typescript
// /app/(dashboard)/reports/page.tsx
'use client';

import { useState } from 'react';

export default function ReportsPage() {
  const [analyticsData, setAnalyticsData] = useState({
    leads: { total: 1250, conversion_rate: 15.2 },
    conversations: { total: 850, response_rate: 87.5 },
    // ... more mock data
  });

  const loadData = async () => {
    // mock function
  };

  return (
    <div>
      <h1>التقارير</h1>
      <p>إجمالي العملاء: {analyticsData.leads.total}</p>
      {/* ... */}
    </div>
  );
}
```

#### بعد:
```typescript
// /app/(dashboard)/reports/page.tsx
'use client';

import { useDashboardAnalytics } from '@/hooks';

export default function ReportsPage() {
  const {
    analytics,
    isLoading,
    error,
    handleExport,
    handleFilterChange
  } = useDashboardAnalytics({
    enableRealTime: true,
    enableForecasting: true
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <h1>التقارير</h1>
      <div className="kpi-grid">
        {analytics?.kpis?.map(kpi => (
          <KPICard key={kpi.id} data={kpi} />
        ))}
      </div>
      {/* ... */}
    </div>
  );
}
```

### مثال 2: صفحة الرسائل المتقدمة

#### قبل:
```typescript
// /app/(dashboard)/messages/advanced/page.tsx
export default function AdvancedMessagesPage() {
  const [dashboardStats, setDashboardStats] = useState({
    totalMessages: 1247,
    unreadMessages: 23,
    responseRate: 34.7,
    // ... more mock data
  });

  useEffect(() => {
    // mock data loading
    setTimeout(() => {
      setDashboardStats({ /* mock data */ });
    }, 1000);
  }, []);

  return (
    <div>
      {/* stats display */}
    </div>
  );
}
```

#### بعد:
```typescript
// /app/(dashboard)/messages/advanced/page.tsx
import { useAdvancedMessages } from '@/hooks';

export default function AdvancedMessagesPage() {
  const {
    analytics,
    notifications,
    isLoading,
    handleFilterChange
  } = useAdvancedMessages({
    enableRealTime: true
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {/* Real-time stats */}
      <StatsBar data={analytics} />
      
      {/* Smart notifications */}
      <NotificationCenter notifications={notifications} />
      
      {/* ... */}
    </div>
  );
}
```

### مثال 3: صفحة اللعب

#### قبل:
```typescript
// /app/playbooks/page.tsx
const mockPlaybooks: Playbook[] = [
  {
    id: '1',
    name: 'تأهيل العملاء الجدد',
    category: 'lead_qualification',
    status: 'active',
    // ... mock properties
  }
  // ... more mock data
];
```

#### بعد:
```typescript
// /app/playbooks/page.tsx
import { usePlaybooks } from '@/hooks';

export default function PlaybooksPage() {
  const {
    playbooks,
    stats,
    createPlaybook,
    executePlaybook
  } = usePlaybooks({
    enableAnalytics: true,
    enableRealTime: true
  });

  return (
    <div>
      <div className="stats-grid">
        <StatCard title="إجمالي الأدلة" value={stats.total} />
        <StatCard title="نشطة" value={stats.active} />
        <StatCard title="متوسط النجاح" value={`${stats.avgSuccessRate}%`} />
      </div>
      
      <div className="playbooks-grid">
        {playbooks.map(playbook => (
          <PlaybookCard 
            key={playbook.id} 
            playbook={playbook}
            onExecute={() => executePlaybook(playbook.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

## أفضل الممارسات

### 1. استخدام Memoization
```typescript
// تجنب re-renders غير ضرورية
const memoizedData = useMemo(() => {
  return analytics?.kpis?.filter(kpi => kpi.category === 'performance');
}, [analytics]);

const handleFilterChange = useCallback((filters) => {
  setFilters(filters);
  // performance optimization
}, []);
```

### 2. Error Boundaries
```typescript
// معالجة الأخطاء بطريقة أنيقة
try {
  const result = await fetchData();
  return { data: result, error: null };
} catch (error) {
  return { 
    data: null, 
    error: handleApiError(error) 
  };
}
```

### 3. Loading States
```typescript
// توفير feedback واضح للمستخدم
if (isLoading) {
  return (
    <LoadingState>
      <LoadingSpinner />
      {enableRealTime && (
        <p>تحديث تلقائي كل {refreshInterval/1000} ثانية</p>
      )}
    </LoadingState>
  );
}
```

### 4. Type Safety
```typescript
// استخدام TypeScript بقوة
const { data, error } = useAdvancedMessages();
// TypeScript يضمن سلامة الأنواع
const kpiValue: number = data?.kpis[0]?.value || 0;
```

### 5. Performance Optimization
```typescript
// تحسين الأداء مع React Query
const { data } = useQuery({
  queryKey: ['analytics', filters],
  queryFn: fetchAnalytics,
  staleTime: 30000, // 30 seconds
  cacheTime: 300000, // 5 minutes
  retry: 3
});
```

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. Hook لا يعود البيانات
```typescript
// المشكلة
const { data } = useAdvancedMessages();
// data undefined

// الحل - التأكد من الـ dependencies
const { data } = useAdvancedMessages({
  filters: { channel: 'whatsapp' }
});
```

#### 2. Loading state لا يتغير
```typescript
// المشكلة
const { isLoading } = useAdvancedMessages();
// isLoading always false

// الحل - إضافة proper error handling
const { isLoading, error } = useAdvancedMessages({
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
});
```

#### 3. Real-time updates لا تعمل
```typescript
// المشكلة
const { enableRealTime } = useAdvancedMessages();
// لا توجد تحديثات

// الحل - التأكد من الـ configuration
const { 
  enableRealTime, 
  autoRefresh, 
  refreshInterval 
} = useAdvancedMessages({
  enableRealTime: true,
  autoRefresh: true,
  refreshInterval: 30000 // 30 seconds
});
```

### نصائح التشخيص

#### 1. فحص Console Logs
```typescript
const { data, isLoading, error } = useAdvancedMessages();

// إضافة console logs للتشخيص
console.log('Data:', data);
console.log('Loading:', isLoading);
console.log('Error:', error);
```

#### 2. فحص Network Tab
```typescript
// التأكد من الـ API calls
// فتح DevTools > Network tab
// البحث عن requests مثل:
// - /api/messages/analytics/advanced
// - /api/analytics/dashboard
```

#### 3. React Query DevTools
```typescript
// إضافة React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

## الاختبار

### Unit Tests
```typescript
// __tests__/hooks/useAdvancedMessages.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useAdvancedMessages } from '@/hooks';

describe('useAdvancedMessages', () => {
  it('should fetch analytics data', async () => {
    const { result } = renderHook(() => useAdvancedMessages());
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
    
    expect(result.current.data).toMatchObject({
      totalMessages: expect.any(Number),
      unreadMessages: expect.any(Number)
    });
  });

  it('should handle errors gracefully', async () => {
    // Mock API to return error
    const { result } = renderHook(() => useAdvancedMessages());
    
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
```

### Integration Tests
```typescript
// __tests__/pages/reports.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportsPage from '@/app/(dashboard)/reports/page';

describe('Reports Page', () => {
  it('should display analytics data', async () => {
    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('إجمالي العملاء')).toBeInTheDocument();
    });
  });

  it('should handle export functionality', async () => {
    render(<ReportsPage />);
    
    const exportButton = screen.getByText('تصدير');
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests
```typescript
// cypress/e2e/reports.cy.ts
describe('Reports Page', () => {
  it('should load and display analytics', () => {
    cy.visit('/dashboard/reports');
    cy.contains('التقارير التفصيلية').should('be.visible');
    cy.contains('إجمالي العملاء').should('be.visible');
  });

  it('should export data in different formats', () => {
    cy.visit('/dashboard/reports');
    cy.get('[data-testid="export-button"]').click();
    cy.get('[data-testid="export-pdf"]').click();
    
    // التحقق من تحميل الملف
    cy.readFile('cypress/downloads/*').should('exist');
  });
});
```

## الخطوات التالية

### 1. Testing
- كتابة Unit tests للـ hooks
- إضافة Integration tests
- تطبيق E2E tests

### 2. Performance Monitoring
- إضافة Performance monitoring
- تتبع Memory usage
- تحسين Bundle size

### 3. Documentation
- Storybook components
- API documentation
- Migration guides

### 4. Monitoring
- Error tracking (Sentry)
- Performance metrics
- User analytics

## الخلاصة

تطبيق هذه الـ hooks سيوفر:

1. **تحسين الأداء** - تقليل Network requests وتحسين Cache management
2. **تجربة مستخدم أفضل** - Real-time updates و Error recovery
3. **صيانة أسهل** - Centralized logic و Type safety
4. **قابلية التوسع** - Architecture مرنة وقابلة للتطوير

تأكد من تطبيق التغييرات تدريجياً واختبار كل مرحلة قبل الانتقال للتالية.