# صفحة لوحة التحكم - Dashboard Page

## نظرة عامة
صفحة لوحة التحكم الرئيسية في منصة سالير توفر رؤية شاملة لجميع المؤشرات والأداء والإحصائيات المهمة للعمل.

## المكونات الرئيسية

### 1. Dashboard Header
- **العنوان والترحيب**: عرض رسالة ترحيب بالاسم
- **Time Range Selector**: اختيار فترة زمنية (اليوم، الأسبوع، الشهر، السنة)
- **أزرار الإجراءات**: تحديث البيانات، تصدير التقارير

### 2. Key Metrics Row
مجموعة من بطاقات المؤشرات الرئيسية:
- **العملاء الجدد**: عدد العملاء الجدد في الفترة المحددة
- **معدل التحويل**: نسبة التحويل من عملاء إلى مبيعات
- **الرسائل المرسلة**: إجمالي الرسائل المرسلة
- **معدل الرد**: نسبة الرد على الرسائل
- **الإيرادات**: إجمالي الإيرادات المحققة

### 3. Charts Section
#### Line Chart - اتجاهات العملاء
- عرض اتجاهات العملاء عبر الزمن
- بيانات يومية مقسمة حسب الفترة المحددة

#### Bar Chart - الأداء الشهري
- مقارنة الأداء الشهري
- ثلاث مقاييس: العملاء، المحادثات، الرسائل

#### Pie Chart - توزيع حالات العملاء
- توزيع العملاء حسب الحالة (جديد، تم التواصل، مؤهل، إلخ)

#### Area Chart - مصادر العملاء
- توزيع العملاء حسب مصدر الوصول

### 4. Recent Activity
- قائمة آخر الأنشطة والتفاعلات
- عرض الوقت والوصف لكل نشاط
- أيقونات مميزة لكل نوع نشاط

### 5. Top Performing Section
#### أفضل العملاء
- ترتيب العملاء حسب القيمة والأهمية
- عرض النقاط والقيمة المالية

#### أفضل المصادر
- ترتيب مصادر الوصول حسب الفعالية
- عرض النسب المئوية وعدد العملاء

#### أفضل القنوات
- ترتيب قنوات التواصل حسب الأداء
- عرض عدد الرسائل ومعدل الاستجابة

### 6. Notifications Panel
- التنبيهات الهامة والنصائح
- حالة النظام والتحذيرات
- قراءة/عدم قراءة التنبيهات

### 7. Quick Actions
- إجراءات سريعة للأعمال الشائعة
- إضافة عميل، إرسال رسالة، إنشاء هدف، تقارير

## التقنيات المستخدمة

### Libraries & Frameworks
- **Next.js 14**: Framework للـ React
- **TypeScript**: للكتابة الآمنة
- **Tailwind CSS**: للتصميم
- **React Query**: لإدارة البيانات
- **Recharts**: للرسوم البيانية
- **Lucide React**: للأيقونات
- **date-fns**: للتعامل مع التواريخ

### التصميم والواجهة
- **RTL Support**: دعم كامل للغة العربية
- **Responsive Design**: متجاوب مع جميع الأجهزة
- **Loading States**: حالات التحميل والانتظار
- **Interactive Charts**: رسوم بيانية تفاعلية
- **Real-time Updates**: تحديث البيانات كل 30 ثانية

## APIs المستخدمة

### Analytics API
```typescript
// جلب بيانات لوحة التحكم
analyticsApi.getDashboard(dateRange: { start_date: string; end_date: string })

// جلب بيانات العملاء
analyticsApi.getLeads(dateRange)

// جلب بيانات المحادثات
analyticsApi.getConversations(dateRange)

// جلب بيانات الرسائل
analyticsApi.getMessages(dateRange)

// جلب بيانات الأداء
analyticsApi.getPerformance(dateRange)
```

## المميزات التقنية

### إدارة البيانات
- **React Query**: كاش البيانات وتحديث تلقائي
- **Real-time Updates**: تحديث كل 30 ثانية
- **Error Handling**: معالجة الأخطاء بشكل أنيق
- **Loading States**: مؤشرات التحميل المناسبة

### UI/UX
- **Skeleton Loading**: تأثيرات تحميل متحركة
- **Smooth Transitions**: انتقالات سلسة
- **Hover Effects**: تأثيرات التفاعل
- **Responsive Grid**: شبكة متجاوبة

### Accessibility
- **ARIA Labels**: تسميات وصولية
- **Keyboard Navigation**: التنقل بلوحة المفاتيح
- **Color Contrast**: تباين ألوان جيد
- **RTL Support**: دعم القراءة من اليمين لليسار

## هيكل البيانات

### AnalyticsData Interface
```typescript
interface AnalyticsData {
  leads: {
    total: number;
    new_this_month: number;
    conversion_rate: number;
    by_status: Record<string, number>;
    by_source: Record<string, number>;
    trends: { date: string; count: number }[];
  };
  conversations: {
    total: number;
    active: number;
    response_rate: number;
    avg_response_time: number;
  };
  messages: {
    total: number;
    by_type: Record<string, number>;
    delivery_rate: number;
  };
  performance: {
    leads_per_day: number;
    conversations_per_day: number;
    messages_per_day: number;
  };
}
```

## التخصيص والتطوير

### إضافة مؤشرات جديدة
1. أضف نوع جديد في enum `MetricType`
2. أنشئ مكون `MetricCard` جديد
3. أضف البيانات في API response
4. اربط البيانات في المكون الرئيسي

### إضافة رسوم بيانية جديدة
1. اختر نوع الرسم البياني المناسب من Recharts
2. جهز البيانات بالتنسيق المطلوب
3. أضف المكون في `Charts Section`
4. أضف ألوان مميزة

### إضافة أقسام جديدة
1. أنشئ مكون منفصل
2. أضف البيانات في المكون الرئيسي
3. ضع المكون في الشبكة المناسبة
4. أضف أنيميشنز مناسبة

## تحسينات الأداء

### Code Splitting
- استيراد مكونات Charts ديناميكياً
- تقسيم الكود حسب الأقسام

### Caching
- React Query untuk caching
- Local storage للبيانات المؤقتة

### Lazy Loading
- تحميل البيانات عند الحاجة
- تحميل الصور والأيقونات بشكل تدريجي

## التوثيق والتنظيم

### مسارات الملفات
```
saler/frontend/src/app/(dashboard)/
├── page.tsx                    # الصفحة الرئيسية
├── layout.tsx                  # تخطيط الصفحة
├── loading.tsx                 # صفحة التحميل
└── error.tsx                   # صفحة الخطأ
```

### المكونات
```
saler/frontend/src/components/
├── ui/                         # مكونات أساسية
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Input.tsx
└── charts/                     # مكونات الرسوم البيانية
    ├── LineChart.tsx
    ├── BarChart.tsx
    ├── PieChart.tsx
    └── AreaChart.tsx
```

## الاستخدام

### تشغيل الصفحة
```bash
# تشغيل الخادم المحلي
npm run dev

# زيارة الصفحة
http://localhost:3000/dashboard
```

### التصدير والاستيراد
- زر تصدير البيانات بصيغ متعددة (CSV, PDF, Excel)
- تخصيص الفترة الزمنية للصدور
- إعدادات التقارير المتقدمة

هذا التوثيق يوفر دليلاً شاملاً لفهم وتطوير صفحة لوحة التحكم في منصة سالير.