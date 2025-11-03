# نظام التنبيهات والإشعارات (Notifications System)

نظام شامل لإدارة التنبيهات والإشعارات في التطبيق مع دعم أنواع مختلفة من التنبيهات وقنوات الإرسال المختلفة.

## المكونات الرئيسية

### 1. NotificationCenter.tsx
مركز التنبيهات الرئيسي مع قائمة شاملة بجميع التنبيهات.

**الميزات:**
- عرض جميع التنبيهات مع فلترة وبحث متقدم
- تحديد/إلغاء تحديد التنبيهات كمقروءة أو غير مقروءة
- حذف التنبيهات (فردي أو متعدد)
- فلترة حسب النوع والأولوية والحالة
- بحث في المحتوى
- إجراءات مجمعة للتنبيهات المتعددة

### 2. NotificationBell.tsx
أيقونة الجرس مع شارة التنبيهات والقائمة المنسدلة.

**الميزات:**
- عرض العدد غير المقروء في شارة
- قائمة منسدلة للتنبيهات الحديثة
- تأثيرات بصرية وصوتية
- مؤشر حالة الاتصال المباشر
- تحريكات وانتقالات سلسة
- تخصيص الموضع والحجم

### 3. NotificationToast.tsx
التنبيهات المنبثقة مع أنواع مختلفة.

**الميزات:**
- 5 أنواع: success, error, warning, info, loading
- إخفاء تلقائي مع شريط تقدم
- أزرار إجراء قابلة للتخصيص
- إمكانية التحكم في المدة والموضع
- حاوي لإدارة عدة تنبيهات منبثقة
- Hook مخصص `useToast` لإدارة التنبيهات

### 4. InAppNotification.tsx
التنبيهات داخل التطبيق مع تحريكات متقدمة.

**الميزات:**
- تحريكات slide-in من الجوانب
- محتوى مخصص حسب نوع التنبيه
- أزرار إجراء تفاعلية
- دعم معلومات إضافية (عميل محتمل، رسالة، صفقة)
- تحديد الوقت المتبقي للإخفاء
- تأثيرات بصرية متقدمة

### 5. EmailNotification.tsx
قوالب التنبيهات عبر البريد الإلكتروني.

**الميزات:**
- قوالب HTML احترافية
- محتوى مخصص لكل نوع تنبيه
- تصميم متجاوب ودعم RTL
- روابط unsubscribe
- أيقونات وألوان مميزة لكل نوع
- مولد قوالب HTML ديناميكي

### 6. NotificationSettings.tsx
واجهة إعدادات التنبيهات الشاملة.

**الميزات:**
- إدارة قنوات التنبيهات (email, push, inApp, sms)
- تفضيلات أنواع التنبيهات المختلفة
- إعدادات الساعات الهادئة
- تحديد تكرار التنبيهات (فوري، يومي، أسبوعي، بدون)
- واجهة مستخدم سهلة وبديهية
- حفظ وإعادة تعيين الإعدادات

### 7. NotificationTypes.ts
تعريفات الأنواع والواجهات.

**الميزات:**
- أنواع التنبيهات: lead, message, system, sale, error, warning, success, info
- مستويات الأولوية: low, medium, high, urgent
- قنوات الإرسال المختلفة
- واجهات شاملة لجميع أنواع البيانات
- إعدادات التنبيهات والفلاتر

### 8. useNotifications.ts
Hook مخصص لإدارة حالة التنبيهات.

**الميزات:**
- إدارة حالة شاملة للتنبيهات
- اتصال مباشر (real-time) مع EventSource
- تحميل وتنظيف البيانات
- إدارة الأخطاء والحالات الاستثنائية
- تحديث الإحصائيات تلقائياً
- تشغيل الأصوات والتنبيهات الصوتية

## كيفية الاستخدام

### الاستخدام الأساسي

```tsx
import { 
  NotificationBell, 
  NotificationCenter, 
  useNotifications 
} from '@/components/notifications';

function App() {
  const [isCenterOpen, setIsCenterOpen] = useState(false);
  
  return (
    <div>
      {/* أيقونة الجرس في الهيدر */}
      <NotificationBell 
        size="md"
        position="bottom-right"
        onClick={() => setIsCenterOpen(true)}
      />
      
      {/* مركز التنبيهات */}
      <NotificationCenter 
        isOpen={isCenterOpen}
        onClose={() => setIsCenterOpen(false)}
        onNotificationClick={(notification) => {
          // معالجة النقر على التنبيه
          console.log('تم النقر على التنبيه:', notification);
        }}
      />
    </div>
  );
}
```

### التنبيهات المنبثقة

```tsx
import { useToast } from '@/components/notifications';

function MyComponent() {
  const { showSuccess, showError, showInfo } = useToast();
  
  const handleAction = async () => {
    const loadingToast = showLoading('جاري الحفظ...');
    
    try {
      // عملية حفظ البيانات
      await saveData();
      
      removeToast(loadingToast);
      showSuccess('تم الحفظ بنجاح!', 'تم حفظ البيانات بنجاح');
    } catch (error) {
      removeToast(loadingToast);
      showError('خطأ في الحفظ', 'حدث خطأ أثناء حفظ البيانات');
    }
  };
  
  return (
    <button onClick={handleAction}>
      حفظ
    </button>
  );
}
```

### التنبيهات داخل التطبيق

```tsx
import { useInAppNotifications } from '@/components/notifications';

function LeadComponent() {
  const { showLeadNotification } = useInAppNotifications();
  
  const handleNewLead = (leadData) => {
    showLeadNotification(
      leadData.name, 
      'تم إضافة عميل محتمل جديد', 
      leadData.id
    );
  };
  
  return (
    // مكونات العميل المحتمل
  );
}
```

### الإعدادات

```tsx
import { NotificationSettings } from '@/components/notifications';

function SettingsPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  return (
    <div>
      <button onClick={() => setIsSettingsOpen(true)}>
        إعدادات التنبيهات
      </button>
      
      <NotificationSettings 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
```

## الإعداد والتكوين

### 1. إضافة الأصوات
ضع ملفات الصوت في مجلد `public/sounds/`:

```bash
public/
  sounds/
    notification.mp3
    success.mp3
    error.mp3
```

### 2. تكوين API Endpoints
قم بتحديث `API_ENDPOINTS` في `useNotifications.ts`:

```typescript
const API_ENDPOINTS = {
  notifications: '/api/v1/notifications',
  settings: '/api/v1/notifications/settings',
  // ... باقي النقاط النهائية
};
```

### 3. تفعيل الاتصال المباشر
قم بإعداد نقطة النهاية للـ EventStream في الخادم:

```typescript
// مثال على خادم Express.js
app.get('/api/notifications/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // إرسال تنبيهات جديدة
  const sendNotification = (notification) => {
    res.write(`data: ${JSON.stringify(notification)}\n\n`);
  };
  
  // تنظيف الاتصال
  req.on('close', () => {
    // تنظيف الموارد
  });
});
```

### 4. التخصيص

#### الألوان
يمكن تخصيص الألوان في ملفات المكونات:

```css
/* في NotificationBell.tsx */
const badgeColor = 'bg-red-500'; // اللون الافتراضي للشارة
const connectedColor = 'bg-green-500'; // لون الاتصال
const disconnectedColor = 'bg-red-500'; // لون عدم الاتصال
```

#### التحريكات
يمكن تخصيص التحريكات والانتقالات:

```css
/* في NotificationToast.tsx */
.toast-enter {
  transform: translateX(100%);
  opacity: 0;
}

.toast-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: all 300ms ease-in-out;
}
```

## البيانات المتوقعة من API

### GET /api/notifications
```json
[
  {
    "id": "notification-1",
    "type": "lead",
    "priority": "high",
    "title": "عميل محتمل جديد",
    "message": "تم إضافة عميل محتمل جديد باسم أحمد محمد",
    "timestamp": "2024-01-15T10:30:00Z",
    "read": false,
    "userId": "user-123",
    "actionUrl": "/leads/lead-123",
    "actionText": "عرض العميل المحتمل",
    "metadata": {
      "leadId": "lead-123",
      "leadName": "أحمد محمد",
      "leadEmail": "ahmed@example.com",
      "action": "new_lead",
      "priority": "high"
    },
    "channels": ["in_app", "email"]
  }
]
```

### GET /api/notifications/settings
```json
{
  "userId": "user-123",
  "email": true,
  "push": true,
  "inApp": true,
  "sms": false,
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00",
    "timezone": "Asia/Riyadh"
  },
  "preferences": {
    "leadUpdates": true,
    "messageAlerts": true,
    "systemNotifications": false,
    "salesMilestones": true,
    "marketingEmails": false
  },
  "frequency": {
    "immediate": ["lead", "message"],
    "daily": ["system"],
    "weekly": [],
    "never": ["marketing"]
  }
}
```

## أفضل الممارسات

### 1. إدارة الذاكرة
- تنظيف الموارد عند إلغاء تحميل المكونات
- تحديد عدد التنبيهات المعروضة
- إزالة التنبيهات القديمة تلقائياً

### 2. الأداء
- استخدام pagination للتنبيهات الكثيرة
- تطبيق lazy loading للقوائم الطويلة
- تحسين استعلامات البيانات

### 3. إمكانية الوصول
- دعم قارئات الشاشة
- تنقل لوحة المفاتيح
- تباين ألوان مناسب

### 4. الأمان
- التحقق من صحة البيانات
- تنظيف المدخلات
- حماية من XSS

## استكشاف الأخطاء

### مشاكل شائعة

1. **لا يتم عرض التنبيهات**
   - تحقق من اتصال API
   - تأكد من صحة البيانات المرسلة
   - راجع console للأخطاء

2. **الصوت لا يعمل**
   - تحقق من إعدادات المتصفح
   - تأكد من وجود ملفات الصوت
   - تحقق من إعدادات التنبيهات

3. **الاتصال المباشر لا يعمل**
   - تحقق من إعداد EventSource
   - تأكد من دعم الخادم لـ Server-Sent Events
   - راجع إعدادات CORS

### تسجيل الأخطاء

```typescript
// إضافة loggers مخصصة
const logger = {
  error: (message: string, error?: any) => {
    console.error(`[Notifications Error] ${message}`, error);
    // إرسال للأدوات الخارجية مثل Sentry
  },
  info: (message: string) => {
    console.info(`[Notifications Info] ${message}`);
  }
};
```

---

هذا النظام يوفر حلاً شاملاً ومرناً لإدارة التنبيهات في التطبيق مع دعم كامل للغة العربية والتصميم المتجاوب.