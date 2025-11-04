# دليل API Routes المؤقتة - نظام SALER

## نظرة عامة

هذا الدليل يشرح كيفية استخدام API routes المؤقتة التي تم إنشاؤها لنظام إدارة المبيعات SALER. هذه APIs توفر بيانات وهمية للاختبار والتطوير.

## 📋 قائمة APIs المتاحة

### 1. التحليلات والإحصائيات

#### `/api/analytics/dashboard`
جلب بيانات لوحة التحكم الرئيسية

**المعاملات:**
- `period` (اختياري): الفترة الزمنية (`today`, `week`, `month`, `quarter`, `year`) - افتراضي: `month`
- `date` (اختياري): تاريخ محدد

**مثال الاستخدام:**
```javascript
// جلب بيانات الشهر الحالي
fetch('/api/analytics/dashboard?period=month')
  .then(res => res.json())
  .then(data => console.log(data))

// جلب بيانات الأسبوع
fetch('/api/analytics/dashboard?period=week')
```

#### `/api/analytics/reports`
إنشاء والحصول على التقارير المتقدمة

**المعاملات:**
- `type` (مطلوب): نوع التقرير (`leads`, `conversions`, `revenue`, `tasks`, `performance`)
- `period`: الفترة الزمنية - افتراضي: `month`
- `groupBy`: التجميع (`day`, `week`, `month`) - افتراضي: `day`
- `filters`: مرشحات معقدة (JSON string)

**أمثلة الاستخدام:**
```javascript
// تقرير العملاء المحتملين
fetch('/api/analytics/reports?type=leads&period=month&groupBy=week')

// تقرير الإيرادات الشهري
fetch('/api/analytics/reports?type=revenue&period=quarter&groupBy=month')

// إنشاء تقرير مخصص
fetch('/api/analytics/reports', {
  method: 'POST',
  body: JSON.stringify({
    name: 'تقرير مخصص',
    type: 'performance',
    config: {
      period: 'month',
      groupBy: 'week'
    }
  })
})
```

#### `/api/analytics/advanced`
تحليلات متقدمة مع رؤى وتوقعات

**المعاملات:**
- `metric`: المقياس (`leads`, `conversions`, `revenue`, `performance`, `customer_satisfaction`)
- `timeframe`: الإطار الزمني (`daily`, `weekly`, `monthly`, `quarterly`)
- `period`: الفترة (`7d`, `30d`, `90d`, `1y`)
- `compare`: فترة للمقارنة

**أمثلة الاستخدام:**
```javascript
// تحليل العملاء المحتملين الشهري
fetch('/api/analytics/advanced?metric=leads&timeframe=monthly&period=30d')

// تحليل التحويلات الأسبوعي مع مقارنة
fetch('/api/analytics/advanced?metric=conversions&timeframe=weekly&period=30d&compare=7d')

// تحليل رضا العملاء
fetch('/api/analytics/advanced?metric=customer_satisfaction&timeframe=monthly&period=90d')
```

### 2. إدارة المهام

#### `/api/tasks`
عمليات CRUD للمهام

**GET - جلب المهام:**
```javascript
// جلب جميع المهام
fetch('/api/tasks')

// فلترة المهام
fetch('/api/tasks?status=in_progress&priority=high&limit=10')

// بحث في المهام
fetch('/api/tasks?search=عميل&assigneeId=user_001')
```

**المعاملات:**
- `page`: رقم الصفحة - افتراضي: 1
- `limit`: عدد النتائج في الصفحة - افتراضي: 10
- `status`: حالة المهمة (`todo`, `in_progress`, `completed`, `cancelled`)
- `priority`: الأولوية (`low`, `medium`, `high`, `urgent`)
- `assigneeId`: معرف المكلف
- `search`: نص البحث

**POST - إنشاء مهمة جديدة:**
```javascript
fetch('/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'متابعة العميل المحتمل',
    description: 'التواصل مع العميل لمناقشة العرض',
    priority: 'high',
    status: 'todo',
    dueDate: '2025-11-10T14:00:00.000Z',
    assigneeId: 'user_001',
    tags: ['follow-up', 'urgent'],
    estimatedHours: 2,
    leadId: 'lead_001'
  })
})
```

#### `/api/tasks/[id]`
عمليات على مهمة محددة

**GET - جلب مهمة محددة:**
```javascript
fetch('/api/tasks/task_001')
  .then(res => res.json())
  .then(data => {
    console.log('المهمة:', data.data)
    console.log('متأخرة؟:', data.data.isOverdue)
    console.log('التقدم %:', data.data.progress)
  })
```

**PUT - تحديث مهمة:**
```javascript
fetch('/api/tasks/task_001', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'in_progress',
    actualHours: 1.5,
    priority: 'high'
  })
})
```

**DELETE - حذف مهمة:**
```javascript
fetch('/api/tasks/task_001', {
  method: 'DELETE'
})
```

### 3. إدارة الرسائل

#### `/api/messages`
عمليات إرسال وإدارة الرسائل

**GET - جلب الرسائل:**
```javascript
// جلب جميع الرسائل
fetch('/api/messages')

// فلترة الرسائل
fetch('/api/messages?type=sms&status=sent&limit=5')

// بحث متقدم
fetch('/api/messages?search=عرض&dateFrom=2025-11-01&dateTo=2025-11-30')
```

**POST - إرسال رسالة:**
```javascript
// إرسال SMS
fetch('/api/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipient: '+966501234567',
    content: 'مرحباً، عرض خاص لفترة محدودة!',
    type: 'sms',
    priority: 'normal',
    tags: ['promotion', 'special']
  })
})

// إرسال إيميل
fetch('/api/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipient: 'client@company.com',
    subject: 'عرض خاص - خصم 20%',
    content: 'نود إعلامكم بعرض خاص لفترة محدودة...',
    type: 'email',
    priority: 'high'
  })
})

// إرسال WhatsApp
fetch('/api/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipient: '+966507654321',
    content: '🎉 عرض خاص! خصم 20% على جميع خدماتنا',
    type: 'whatsapp',
    priority: 'normal'
  })
})
```

### 4. فحص صحة النظام

#### `/api/health`
فحص صحة النظام والمكونات

**GET - فحص سريع:**
```javascript
fetch('/api/health')
  .then(res => res.json())
  .then(data => {
    console.log('حالة النظام:', data.status)
    console.log('وقت الاستجابة:', data.responseTime + 'ms')
    console.log('فحص المكونات:', data.checks)
    console.log('إحصائيات النظام:', data.statistics)
  })
```

**POST - فحص عميق:**
```javascript
fetch('/api/health', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    test_type: 'full',
    duration: 60
  })
})
```

## 📊 هيكل الاستجابة

### استجابة ناجحة
```json
{
  "success": true,
  "data": { /* البيانات المطلوبة */ },
  "meta": {
    "timestamp": "2025-11-04T02:36:09.000Z",
    "cached": false
  }
}
```

### استجابة خطأ
```json
{
  "error": "رسالة الخطأ",
  "details": [
    {
      "field": "اسم_الحقل",
      "message": "وصف الخطأ"
    }
  ]
}
```

## 🔧 البيانات الوهمية

### KPIs (المؤشرات الرئيسية)
- إجمالي العملاء المحتملين: 2,847 (+12.5%)
- العملاء المحتملين المحولون: 892
- معدل التحويل: 31.4% (+2.1%)
- إجمالي الإيرادات: 2,847,500 ريال (+18.3%)
- متوسط قيمة الصفقة: 3,192 ريال (-5.2%)
- المهام النشطة: 156 (-8.7%)
- وقت الاستجابة: 2.4 ساعة (-12.3%)

### بيانات المهام
- 5 مهام وهمية متنوعة
- حالات مختلفة: قائمة انتظار، قيد التنفيذ، مكتملة، ملغية
- أولويات متنوعة
- تواريخ استحقاق مختلفة

### بيانات الرسائل
- 5 رسائل وهمية
- أنواع مختلفة: SMS، إيميل، WhatsApp، Push
- حالات متنوعة: مرسلة، تسليم، معلقة، فاشلة، مسودة
- أوقات إرسال مختلفة

## 🧪 الاختبار

### تشغيل اختبارات API
```bash
cd saler/frontend
node src/app/api/test-apis.js
```

### اختبار يدوي
```bash
# تشغيل خادم التطوير
npm run dev

# اختبار APIs في المتصفح أو Postman
# http://localhost:3000/api/analytics/dashboard
# http://localhost:3000/api/tasks
# http://localhost:3000/api/messages
# http://localhost:3000/api/health
```

## ⚠️ ملاحظات مهمة

1. **البيانات المؤقتة**: جميع البيانات وهمية وتعيد تعيينها عند إعادة التشغيل
2. **الأمان**: لا توجد مصادقة في هذه النسخة المؤقتة
3. **الأداء**: تأخير مصطنع لمحاكاة الشبكة الحقيقية
4. **قاعدة البيانات**: في التطبيق الحقيقي ستتم استبدال البيانات الوهمية بقاعدة بيانات حقيقية
5. **التخزين المؤقت**: APIs لا تستخدم تخزين مؤقت في هذه النسخة

## 🚀 التطوير المستقبلي

- إضافة مصادقة JWT
- ربط بقاعدة بيانات حقيقية
- إضافة تخزين مؤقت
- تحسين معالجة الأخطاء
- إضافة rate limiting
- تسجيل العمليات (logging)
- إضافة APIs للمزيد من الوظائف

## 📞 الدعم

للحصول على مساعدة أو الإبلاغ عن مشاكل، يرجى التواصل مع فريق التطوير.