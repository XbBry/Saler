# صفحة المحادثة الفردية

## نظرة عامة

هذه الصفحة توفر واجهة شاملة لإدارة المحادثات الفردية مع الميزات التالية:

## الميزات الرئيسية

### 1. رأس المحادثة (Chat Header)
- عرض معلومات العميل/المستخدم
- حالة الاتصال المباشرة (متصل/غير متصل)
- أزرار التحكم: مكالمة صوتية، مكالمة فيديو، مشاركة شاشة
- زر البحث في الرسائل
- زر كتم/إلغاء كتم الصوت
- زر المزيد من الخيارات
- زر إعدادات المحادثة
- زر إنهاء المحادثة

### 2. منطقة الرسائل (Message Area)
- عرض الرسائل مع bubbles منفصلة للرسائل الواردة والصادرة
- دعم أنواع الرسائل المختلفة:
  - الرسائل النصية
  - الصور
  - الملفات
  - الرسائل الصوتية
- حالة الرسائل (مرسل، تم التسليم، مقروء، فشل)
- أزرار التفاعل مع الرسائل (رد، رد فعل، المزيد)
- infinite scroll لتحميل الرسائل القديمة
- auto-scroll للرسائل الجديدة

### 3. مكون إدخال الرسائل (Message Composer)
- textarea متحركة للحجم مع تكبير تلقائي
- دعم الرسائل النصية
- رفع الملفات (صور، PDF، مستندات)
- تسجيل الرسائل الصوتية
- قوالب الرد السريع
- اختصارات لوحة المفاتيح (Enter للإرسال، Shift+Enter لسطر جديد)
- مؤشر الكتابة

### 4. الشريط الجانبي (Conversation Sidebar)
- معلومات العميل التفصيلية
- تفاصيل حالة المحادثة
- الأنشطة الأخيرة (مكالمات، إيميلات، اجتماعات)
- اقتراحات الذكاء الاصطناعي مع درجات الثقة
- إمكانية إخفاء/إظهار الشريط

## التقنيات المستخدمة

- **Next.js 14** مع App Router
- **TypeScript** للأمان في الكتابة
- **Tailwind CSS** للتصميم
- **React Query** لإدارة البيانات والـ caching
- **Lucide React** للأيقونات
- **date-fns** لتنسيق التواريخ
- **React Hot Toast** للإشعارات
- **WebSocket** للتحديثات المباشرة

## البنية المعمارية

```
src/app/[locale]/messages/[id]/
├── page.tsx              # الصفحة الرئيسية
├── loading.tsx           # صفحة التحميل
├── error.tsx            # صفحة الأخطاء
└── not-found.tsx        # صفحة غير موجود
```

## مكونات الواجهة

### MessageBubble Component
```typescript
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  lead?: Lead;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onDownload?: (attachment: MessageAttachment) => void;
}
```

### MessageComposer Component
```typescript
interface MessageComposerProps {
  conversationId: string;
  onSendMessage: (content: string, type: MessageType) => Promise<void>;
  disabled?: boolean;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
}
```

### ConversationSidebar Component
```typescript
interface ConversationSidebarProps {
  conversation: Conversation;
  lead: Lead;
  recentActivities: Activity[];
  aiSuggestions: AISuggestion[];
  onClose?: () => void;
}
```

## المتطلبات

### Dependencies
- React 18+
- Next.js 14+
- TypeScript 5+
- @tanstack/react-query 5+
- date-fns 3+
- react-hot-toast 2+
- lucide-react 0.3+

### البيئة
- Node.js 18+
- npm 9+

## الاستخدام

### الروتينغ
```typescript
// للوصول إلى محادثة محددة
router.push('/ar/messages/[id]')

// مع معاملات إضافية
router.push({
  pathname: '/ar/messages/[id]',
  params: { id: conversationId },
  query: { highlight: messageId }
})
```

### البيانات المطلوبة
```typescript
// Conversation
{
  id: string;
  lead_id: string;
  status: 'active' | 'closed' | 'paused';
  last_message_at: string;
  message_count: number;
  created_at: string;
}

// Lead
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  score?: number;
}

// Message
{
  id: string;
  conversation_id: string;
  content: string;
  type: MessageType;
  direction: 'inbound' | 'outbound';
  status: MessageStatus;
  created_at: string;
  metadata?: Record<string, any>;
}
```

## التخصيص

### الألوان والأنماط
الألوان قابلة للتخصيص من خلال Tailwind CSS classes:
- `bg-blue-500` - لون أساسي
- `bg-gray-50` - خلفية الصفحة
- `border-gray-200` - حدود المكونات

### الأيقونات
استخدام مكتبة Lucide React:
```typescript
import { MessageCircle, Phone, Video, Send } from 'lucide-react';
```

### النصوص والترجمة
```typescript
import { useTranslations } from 'next-intl';

// في المكون
const t = useTranslations();
return <h1>{t('messages.conversation')}</h1>;
```

## الأداء

### التحسينات المطبقة
- Lazy loading للرسائل القديمة
- Virtual scrolling للرسائل الطويلة
- Memoization للمكونات المكلفة
- Debounced search
- Connection pooling للـ WebSocket

### Best Practices
- استخدام React Query للـ caching
- Avoid unnecessary re-renders
- Optimistic updates
- Error boundaries
- Loading states

## الأمان

### التحقق من البيانات
- Type safety مع TypeScript
- Input sanitization
- XSS protection
- CSRF protection

### الصلاحيات
- Authentication checks
- Authorization per conversation
- Role-based access control

## الاختبار

### Unit Tests
```typescript
// اختبار مكون الرسالة
import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';

test('renders message content', () => {
  // Test implementation
});
```

### Integration Tests
```typescript
// اختبار تدفق المحادثة
import { renderWithProviders } from '@/test/utils';
import ConversationPage from './page';

test('loads conversation successfully', async () => {
  // Test implementation
});
```

## الصيانة

### Log Monitoring
- Console logging للـ development
- Error tracking مع Sentry
- Performance monitoring

### Updates
- Regular dependency updates
- Security patches
- Feature additions

## المساهمة

### Guidelines
1. اتبع TypeScript strict mode
2. استخدم ESLint و Prettier
3. اكتب tests للمكونات الجديدة
4. وثق أي API changes
5. اختبر على RTL و LTR

### Development Workflow
```bash
# Development
npm run dev

# Testing
npm run test

# Linting
npm run lint

# Build
npm run build
```

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

---

## الدعم

للحصول على المساعدة أو الإبلاغ عن مشاكل:
- GitHub Issues
- Email: support@saler.com
- Documentation: docs.saler.com