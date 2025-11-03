# مكونات واجهة الرسائل (Message UI Components)

مكونات React/TypeScript لتطبيق الرسائل مع دعم كامل للغة العربية والتصميم المتجاوب.

## المكونات المتاحة

### 1. MessageBubble
مكون فقاعة الرسالة لعرض الرسائل مع دعم متعدد الوسائط.

**المميزات:**
- ✅ دعم الرسائل النصية والصورية وملفات PDF والفيديو
- ✅ حالات الرسائل (مُرسل، يُرسل، مُسلم، مقروء، فشل)
- ✅ أزرار الرد وإعادة التوجيه والنسخ
- ✅ دعم الرد على الرسائل والإعادة توجيه
- ✅ دعم الوضع المظلم والفاتح
- ✅ الأوقات والطوابع الزمنية باللغة العربية

**الاستخدام:**
```tsx
import { MessageBubble } from '@/components/messages';

const message: Message = {
  id: '1',
  content: 'مرحباً! كيف حالك؟',
  type: 'text',
  senderId: 'user1',
  senderName: 'أحمد محمد',
  timestamp: new Date(),
  status: 'read',
  isOwn: true
};

<MessageBubble 
  message={message}
  onReply={(id) => console.log('رد على:', id)}
  onForward={(id) => console.log('إعادة توجيه:', id)}
  onCopy={(content) => console.log('نسخ:', content)}
/>
```

### 2. MessageComposer
مكون مؤلف الرسائل مع جميع الوظائف المتقدمة.

**المميزات:**
- ✅ نص مُحسّن مع تلقيم كامل للكلمات
- ✅ رفع الملفات والصور
- ✅ قالب الرسائل المُعدّة مسبقاً
- ✅ لوحة إيموجي
- ✅ عداد الأحرف
- ✅ إرسال الرسائل الصوتية
- ✅ السحب والإفلات للملفات
- ✅ دعم الوضع المظلم

**الاستخدام:**
```tsx
import { MessageComposer, MessageTemplate } from '@/components/messages';

const templates: MessageTemplate[] = [
  {
    id: '1',
    title: 'ترحيب',
    content: 'مرحباً! أهلاً وسهلاً بك.',
    category: 'عام'
  }
];

<MessageComposer
  onSendMessage={(content, attachments) => {
    console.log('إرسال رسالة:', content, attachments);
  }}
  templates={templates}
  placeholder="اكتب رسالتك..."
  maxLength={1000}
/>
```

### 3. ConversationList
مكون قائمة المحادثات مع فلترة وبحث متقدم.

**المميزات:**
- ✅ عرض معلومات المحادثة
- ✅ معاينة آخر رسالة
- ✅ عدد الرسائل غير المقروءة
- ✅ بحث وفلترة (الكل، مثبت، مميز، مؤرشف)
- ✅ تثبيت/إلغاء تثبيت المحادثات
- ✅ تقييم وإهمال المحادثات
- ✅ أزرار الإجراء (اتصال، فيديو، حذف)

**الاستخدام:**
```tsx
import { ConversationList } from '@/components/messages';

const conversations: Conversation[] = [
  {
    id: '1',
    name: 'أحمد محمد',
    lastMessage: {
      content: 'شكراً لك',
      timestamp: new Date(),
      senderId: 'user1',
      type: 'text'
    },
    unreadCount: 2,
    isPinned: true,
    isStarred: false,
    isArchived: false,
    participants: [],
    type: 'direct',
    status: 'online'
  }
];

<ConversationList
  conversations={conversations}
  selectedConversationId="1"
  onSelectConversation={(id) => console.log('اختيار محادثة:', id)}
  onPinConversation={(id) => console.log('تثبيت:', id)}
  onUnpinConversation={(id) => console.log('إلغاء تثبيت:', id)}
  onStarConversation={(id) => console.log('تقييم:', id)}
  onUnstarConversation={(id) => console.log('إلغاء تقييم:', id)}
  onArchiveConversation={(id) => console.log('أرشفة:', id)}
  onDeleteConversation={(id) => console.log('حذف:', id)}
/>
```

### 4. MessageStatus
مكون حالة الرسالة مع تفاعلات متقدمة.

**المميزات:**
- ✅ أيقونات حالات مختلفة (مُرسل، مُسلم، مقروء، فشل)
- ✅ Tooltips مع تفاصيل كاملة
- ✅ الطوابع الزمنية النسبية
- ✅ تفاعلات الرسائل (إعجاب، حب، ضحك، حزن، غضب، عدم إعجاب)
- ✅ أحجام وأشكال مختلفة
- ✅ عرض التفاعلات للمستخدمين

**الاستخدام:**
```tsx
import { MessageStatus } from '@/components/messages';

<MessageStatus
  status="read"
  timestamp={new Date()}
  reactions={{
    like: { emoji: '👍', count: 2, users: ['user1', 'user2'] },
    love: { emoji: '❤️', count: 1, users: ['user3'] }
  }}
  userReactions={['like']}
  onReactionClick={(reaction) => console.log('رد فعل:', reaction)}
  showReactions={true}
  showTooltip={true}
  size="md"
  variant="default"
/>
```

## التبعيات المطلوبة

تأكد من تثبيت هذه الحزم في مشروعك:

```bash
npm install date-fns lucide-react
# أو
yarn add date-fns lucide-react
```

## التخصيص

جميع المكونات تدعم التخصيص عبر:
- `className` للتخصيص الإضافي
- متغيرات CSS للثيم
- متغيرات Tailwind للون والخط

## نماذج البيانات (Types)

### Message
```tsx
interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'video' | 'audio';
  senderId: string;
  senderName: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
  forwardedFrom?: string;
  attachments?: {
    url: string;
    name: string;
    type: string;
    size: number;
  }[];
  isOwn: boolean;
}
```

### Conversation
```tsx
interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: {
    content: string;
    timestamp: Date;
    senderId: string;
    type: 'text' | 'image' | 'file' | 'video';
  };
  unreadCount: number;
  isPinned: boolean;
  isStarred: boolean;
  isArchived: boolean;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  }[];
  type: 'direct' | 'group' | 'bot';
  status: 'online' | 'offline' | 'away' | 'busy';
}
```

## الدعم والإسهام

هذه المكونات مصممة لتكون قابلة للتوسع والتخصيص. يمكنك إضافة مميزات جديدة أو تخصيص التصميم حسب احتياجاتك.

---

**ملاحظة:** جميع النصوص والواجهات محسنة للغة العربية مع دعم كامل لاتجاه RTL.