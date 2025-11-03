# Hooks و Utilities للرسائل

مجموعة شاملة من Hooks و Utilities لإدارة الرسائل في نظام المبيعات.

## 📋 المحتويات

- [الميزات](#الميزات)
- [Hooks المتوفرة](#hooks-المتوفرة)
- [Utilities](#utilities)
- [التثبيت والإعداد](#التثبيت-والإعداد)
- [أمثلة الاستخدام](#أمثلة-الاستخدام)
- [Testing](#testing)
- [المساهمة](#المساهمة)

## ✨ الميزات

### 📨 إدارة الرسائل
- **Real-time updates** - تحديثات فورية للرسائل
- **Pagination & Infinite Scroll** - تصفح صفحات لا نهائي
- **Search & Filtering** - بحث وتصفية متقدم
- **Message Operations** - إرسال، تعديل، حذف الرسائل
- **Typing Indicators** - مؤشرات الكتابة
- **File Attachments** - مرفقات الملفات
- **RTL Text Support** - دعم النصوص العربية

### 💬 إدارة المحادثات
- **Conversation Management** - إدارة شاملة للمحادثات
- **Online Status** - حالة الاتصال للمستخدمين
- **Conversation Status** - حالة المحادثات (نشطة، مغلقة، متوقفة)
- **Lead Integration** - ربط مع إدارة العملاء المحتملين

### 📝 قوالب الرسائل
- **Template CRUD** - إنشاء وقراءة وتعديل وحذف القوالب
- **Variable Substitution** - استبدال المتغيرات
- **Template Preview** - معاينة القوالب
- **Category Organization** - تنظيم القوالب بالفئات

## 🪝 Hooks المتوفرة

### `useMessages`

Hook لإدارة الرسائل الفردية في محادثة.

```typescript
const {
  messages,                 // قائمة الرسائل
  loading,                 // حالة التحميل
  error,                   // الأخطاء
  searchQuery,             // نص البحث
  filteredMessages,        // الرسائل المفلترة
  sendMessage,             // إرسال رسالة
  markAsRead,              // تعليم كمقروءة
  deleteMessage,           // حذف رسالة
  subscribeToNewMessages,  // الاشتراك في الرسائل الجديدة
  refreshMessages,         // تحديث الرسائل
  validateMessage,         // التحقق من صحة الرسالة
} = useMessages({
  conversationId: 'conv-123',
  enableRealTime: true,
  autoRefresh: true,
  onNewMessage: (message) => console.log('New message:', message),
});
```

#### الخيارات
- `conversationId` - معرف المحادثة
- `enableRealTime` - تفعيل التحديثات الفورية
- `autoRefresh` - تحديث تلقائي
- `refreshInterval` - فترة التحديث بالميلي ثانية
- `onNewMessage` - دالة الاستدعاء عند وصول رسالة جديدة

#### الدوال
- `sendMessage(content: string, type: MessageType)` - إرسال رسالة
- `markAsRead(messageId: string)` - تعليم كمقروءة
- `deleteMessage(messageId: string)` - حذف رسالة
- `searchMessages(query: string)` - البحث في الرسائل
- `applyFilters(filters: Partial<MessageSearchParams>)` - تطبيق فلاتر

### `useConversations`

Hook لإدارة قائمة المحادثات.

```typescript
const {
  conversations,           // قائمة المحادثات
  loading,
  error,
  searchQuery,
  filteredConversations,   // المحادثات المفلترة
  getConversation,         // الحصول على محادثة
  updateConversationStatus,// تحديث حالة المحادثة
  closeConversation,       // إغلاق المحادثة
  reopenConversation,      // إعادة فتح المحادثة
  subscribeToConversations,// الاشتراك في تحديثات المحادثات
  getUnreadConversations,  // الحصول على المحادثات غير المقروءة
} = useConversations({
  leadId: 'lead-123',
  enableRealTime: true,
  onConversationUpdate: (conversation) => console.log('Updated:', conversation),
});
```

#### الدوال
- `getConversation(conversationId: string)` - الحصول على محادثة مع رسائلها
- `updateConversationStatus(id: string, status: ConversationStatus)`
- `closeConversation(conversationId: string)`
- `reopenConversation(conversationId: string)`
- `addConversationNote(conversationId: string, content: string)`

### `useMessageTemplates`

Hook لإدارة قوالب الرسائل.

```typescript
const {
  templates,               // قائمة القوالب
  loading,
  error,
  categories,              // فئات القوالب
  searchQuery,
  filteredTemplates,
  createTemplate,          // إنشاء قالب
  updateTemplate,          // تحديث قالب
  deleteTemplate,          // حذف قالب
  duplicateTemplate,       // نسخ قالب
  renderTemplate,          // عرض القالب مع المتغيرات
  getTemplatePreview,      // معاينة القالب
  validateTemplateVariables, // التحقق من المتغيرات
} = useMessageTemplates({
  category: 'Welcome',
  enableSearch: true,
  onTemplateCreate: (template) => console.log('Created:', template),
});
```

#### دوال القوالب
- `createTemplate(data: CreateMessageTemplateRequest)`
- `updateTemplate(id: string, data: UpdateMessageTemplateRequest)`
- `deleteTemplate(id: string)`
- `duplicateTemplate(id: string)`
- `renderTemplate(id: string, variables: Record<string, any>)`
- `getTemplatePreview(id: string, sampleVariables?)`

## 🛠️ Utilities

### `messageUtils`

مجموعة من الدوال المساعدة للرسائل.

```typescript
import { messageUtils } from '../lib/message-utils';

// التحقق من صحة الرسالة
const validation = messageUtils.validateMessage({
  type: 'text',
  text: 'مرحبا!',
  attachments: []
});

if (validation.is_valid) {
  console.log('الرسالة صحيحة');
} else {
  console.log('أخطاء:', validation.errors);
}

// تنسيق وقت الرسالة
const timeFormatted = messageUtils.formatMessageTimestamp('2024-01-01T12:00:00Z', 'ar');
// "منذ 5 دقائق" أو "١ يناير ٢٠٢٤، ١٢:٠٠ م"

// استخراج المتغيرات من المحتوى
const variables = messageUtils.extractMessageVariables('مرحباً {{name}}!');
// ['name']

// عرض القالب مع المتغيرات
const rendered = messageUtils.renderTemplate(template, {
  name: 'أحمد',
  company: 'شركة النجاح'
});
```

#### الدوال المتوفرة

**التحقق والValidation**
- `validateMessage(data: any)` - التحقق من صحة الرسالة
- `validateSendMessage(data: SendMessageValidation)` - التحقق من إرسال الرسالة
- `validateTemplateVariables(template, variables)` - التحقق من متغيرات القالب

**التاريخ والوقت**
- `formatMessageTimestamp(date, locale)` - تنسيق وقت الرسالة
- `isMessageRecent(date, threshold)` - التحقق من حداثة الرسالة
- `getMessageDateInfo(date)` - معلومات تاريخ الرسالة

**تحليل المحتوى**
- `parseMessageContent(content)` - تحليل محتوى الرسالة
- `extractMessageVariables(content)` - استخراج المتغيرات
- `detectTextDirection(text)` - اكتشاف اتجاه النص

**دعم RTL**
- `isArabicText(text)` - التحقق من النص العربي
- `formatMessageForDisplay(message)` - تنسيق عرض الرسالة

**المرفقات**
- `getFileIcon(mimeType)` - أيقونة نوع الملف
- `formatFileSize(bytes)` - تنسيق حجم الملف
- `isValidAttachmentFile(file)` - التحقق من صحة المرفق

**التنسيق**
- `truncateMessage(content, maxLength)` - قطع الرسالة
- `highlightSearchTerms(content, searchTerm)` - تمييز مصطلحات البحث

## 📦 التثبيت والإعداد

### المتطلبات
- React 18+
- TypeScript 5+
- @tanstack/react-query 5+
- Zod 3+
- Next.js 14+

### الإعداد

1. **إعداد QueryClient في app layout**

```typescript
// app/layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

2. **إعداد WebSocket للتحديثات الفورية** (اختياري)

```typescript
// lib/websocket.ts
export const initializeWebSocket = () => {
  if (typeof window !== 'undefined') {
    // إعداد WebSocket connection
    const ws = new WebSocket('ws://localhost:8000/ws');
    return ws;
  }
  return null;
};
```

## 📝 أمثلة الاستخدام

### مثال 1: واجهة المحادثة

```typescript
// components/ChatInterface.tsx
import { useMessages } from '../hooks/useMessages';
import { useConversations } from '../hooks/useConversations';

export default function ChatInterface({ conversationId }: { conversationId: string }) {
  const {
    messages,
    loading,
    sendMessage,
    subscribeToNewMessages,
  } = useMessages({
    conversationId,
    enableRealTime: true,
  });

  const [newMessage, setNewMessage] = useState('');

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await sendMessage(newMessage, 'text');
      setNewMessage('');
    } catch (error) {
      console.error('فشل في إرسال الرسالة:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToNewMessages((message) => {
      // إضافة الرسالة الجديدة للواجهة
      console.log('رسالة جديدة:', message);
    });

    return unsubscribe;
  }, [subscribeToNewMessages]);

  return (
    <div className="chat-container">
      {loading && <div>جاري التحميل...</div>}
      
      <div className="messages-list">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      <div className="message-input">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="اكتب رسالتك..."
        />
        <button onClick={handleSend}>إرسال</button>
      </div>
    </div>
  );
}
```

### مثال 2: قائمة المحادثات

```typescript
// components/ConversationsList.tsx
import { useConversations } from '../hooks/useConversations';

export default function ConversationsList() {
  const {
    conversations,
    loading,
    searchQuery,
    filteredConversations,
    searchConversations,
    getUnreadConversations,
  } = useConversations();

  return (
    <div className="conversations-list">
      <div className="search-bar">
        <input
          value={searchQuery}
          onChange={(e) => searchConversations(e.target.value)}
          placeholder="البحث في المحادثات..."
        />
      </div>

      {loading && <div>جاري التحميل...</div>}

      <div className="conversations">
        {filteredConversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            unread={conversation.message_count > 0}
          />
        ))}
      </div>
    </div>
  );
}
```

### مثال 3: استخدام القوالب

```typescript
// components/MessageTemplateSelector.tsx
import { useMessageTemplates } from '../hooks/useMessageTemplates';

export default function MessageTemplateSelector() {
  const {
    templates,
    categories,
    renderTemplate,
    getTemplatePreview,
    validateTemplateVariables,
  } = useMessageTemplates();

  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    const templateVars = Object.fromEntries(
      template.variables.map(v => [v.name, v.default_value || ''])
    );
    setVariables(templateVars);
  };

  const renderedMessage = selectedTemplate
    ? renderTemplate(selectedTemplate.id, variables)
    : '';

  return (
    <div className="template-selector">
      <div className="categories">
        {categories.map(category => (
          <button key={category}>{category}</button>
        ))}
      </div>

      <div className="templates">
        {templates.map(template => (
          <div
            key={template.id}
            className={`template-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
            onClick={() => handleTemplateSelect(template)}
          >
            <h4>{template.name}</h4>
            <p>{template.content.substring(0, 50)}...</p>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="template-editor">
          <h3>معاينة القالب</h3>
          <div className="preview">
            {renderedMessage}
          </div>

          <div className="variables">
            {selectedTemplate.variables.map(variable => (
              <div key={variable.name}>
                <label>{variable.label}</label>
                <input
                  type={variable.type}
                  value={variables[variable.name] || ''}
                  onChange={(e) => setVariables(prev => ({
                    ...prev,
                    [variable.name]: e.target.value
                  }))}
                  required={variable.required}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## 🧪 Testing

### إعداد الاختبارات

```typescript
// __tests__/useMessages.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMessages } from '../hooks/useMessages';
import { 
  createTestWrapper, 
  createMockMessage,
  HookTestUtils 
} from '../hooks/test-utils';

describe('useMessages', () => {
  const createWrapper = () => createTestWrapper();

  it('should load messages', async () => {
    const { result } = renderHook(() => useMessages({
      conversationId: 'conv-123'
    }), { 
      wrapper: createWrapper() 
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.messages)).toBe(true);
  });

  it('should send a message', async () => {
    const { result } = renderHook(() => useMessages({
      conversationId: 'conv-123'
    }), { 
      wrapper: createWrapper() 
    });

    await act(async () => {
      await result.current.sendMessage('Hello World', 'text');
    });

    // Verify message was sent
    expect(result.current.messages).toContainEqual(
      expect.objectContaining({ content: 'Hello World' })
    );
  });

  it('should handle real-time updates', async () => {
    const { result } = renderHook(() => useMessages({
      conversationId: 'conv-123'
    }), { 
      wrapper: createWrapper() 
    });

    const mockMessage = createMockMessage({ content: 'Real-time message' });
    
    const unsubscribe = HookTestUtils.emitNewMessage(
      result.current.subscribeToNewMessages,
      mockMessage
    );

    await waitFor(() => {
      expect(result.current.messages).toContainEqual(mockMessage);
    });

    unsubscribe();
  });
});
```

### تشغيل الاختبارات

```bash
npm test
npm run test:coverage
npm run test:watch
```

## 🚀 الأداء والتحسين

### أفضل الممارسات

1. **استخدام React Query** للcaching وstate management
2. **Debounce للبحث** لمنع الطلبات المتكررة
3. **Pagination** للبيانات الكبيرة
4. **Virtualization** للقوائم الطويلة
5. **Real-time subscriptions** بحذر لتجنب memory leaks

### تحسين الأداء

```typescript
// استخدام useMemo للعمليات المكلفة
const filteredMessages = useMemo(() => {
  return messages.filter(message => 
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [messages, searchQuery]);

// استخدام useCallback للدوال
const handleSendMessage = useCallback(async (content: string) => {
  await sendMessage(content, 'text');
}, [sendMessage]);

// تنظيف subscriptions
useEffect(() => {
  const unsubscribe = subscribeToNewMessages(handleNewMessage);
  return () => unsubscribe();
}, [subscribeToNewMessages]);
```

## 🤝 المساهمة

نرحب بالمساهمات! يرجى اتباع هذه الخطوات:

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للbranch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

### معايير الكود

- TypeScript للحماية من الأخطاء
- ESLint و Prettier للتنسيق
- Testing لجميع الميزات الجديدة
- التوثيق الشامل

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## 🆘 الدعم

إذا واجهت أي مشاكل أو كان لديك أسئلة:

- فتح issue في GitHub
- مراجعة التوثيق
- التواصل مع فريق التطوير

---

**ملاحظة**: هذا التوثيق يتم تحديثه بانتظام. للحصول على أحدث المعلومات، يرجى مراجعة GitHub repository.