/**
 * صفحة المحادثة الفردية - تصدير جميع المكونات والوظائف
 */

// ==================== MAIN PAGE ====================

export { default as ConversationPage } from './page';
export { default as ConversationLoading } from './loading';
export { default as ConversationError } from './error';
export { default as ConversationNotFound } from './not-found';

// ==================== COMPONENTS ====================

// MessageBubble Component
export {
  MessageBubble,
  type MessageBubbleProps
} from './components/MessageBubble';

// MessageComposer Component  
export {
  MessageComposer,
  type MessageComposerProps
} from './components/MessageComposer';

// ConversationSidebar Component
export {
  ConversationSidebar,
  type ConversationSidebarProps
} from './components/ConversationSidebar';

// ==================== TYPES ====================

// Base types
export type {
  Message,
  Conversation,
  Lead,
  MessageType,
  MessageDirection,
  MessageStatus,
  ConversationStatus,
  MessageTemplate,
  MessageAttachment,
  MessageContent,
  TypingIndicator,
  OnlineStatus
} from '@/types';

// Enhanced types
export type {
  EnhancedConversation,
  EnhancedMessage,
  EnhancedLead,
  MessageReaction,
  MessageThread,
  MessageDraft,
  ConversationMetrics,
  ConversationTags,
  ConversationAssignment,
  ConversationSettings,
  EscalationRule,
  WorkingHours,
  ConversationParticipant,
  AgentStatus,
  ConversationActivity,
  ConversationIntegration,
  MessageDeliveryStatus,
  ConversationAnalytics,
  AgentPerformanceMetrics,
  CustomerFeedback,
  ConversationNotification,
  ConversationSearchResult,
  MessageSearchResult,
  ConversationFilter,
  ConversationSort,
  BulkAction,
  ConversationPriority,
  MessageContentType,
  ConversationEventType,
  NotificationType,
  ConversationListRequest,
  ConversationListResponse,
  ConversationUpdateRequest,
  BulkConversationActionRequest
} from './types';

// Constants
export {
  CONVERSATION_PRIORITIES,
  MESSAGE_TYPES,
  CONVERSATION_EVENTS,
  NOTIFICATION_TYPES
} from './types';

// ==================== UTILITIES ====================

export {
  formatMessageTime,
  formatConversationDuration,
  getConversationPreview,
  detectMessageType,
  getMessageDirection,
  getMessageStatusText,
  getConversationStatusText,
  calculateUnreadCount,
  calculateAverageResponseTime,
  formatResponseTime,
  canReplyToMessage,
  getConversationStatusColor,
  getPriorityColor,
  filterMessagesByText,
  groupMessagesByDate,
  getDisplayName,
  hasNewMessages,
  needsAttention,
  calculateConversationScore,
  exportConversation
} from './utils';

// ==================== API HELPERS ====================

/**
 * تحويل بيانات API إلى نموذج محادثة محسن
 */
export const transformConversation = (data: any): EnhancedConversation => {
  return {
    ...data,
    metrics: {
      total_messages: data.message_count || 0,
      unread_count: 0, // سيتم حسابها من الرسائل
      avg_response_time: 0, // سيتم حسابها من الرسائل
      last_activity: data.last_message_at || data.created_at
    }
  };
};

/**
 * تحويل بيانات API إلى نموذج رسالة محسن
 */
export const transformMessage = (data: any): EnhancedMessage => {
  return {
    ...data,
    reactions: [],
    delivery_status: {
      message_id: data.id,
      delivery_status: data.status as any,
      attempted_at: data.created_at,
      delivered_at: data.status === 'delivered' ? data.created_at : undefined
    }
  };
};

/**
 * تحويل بيانات API إلى نموذج عميل محسن
 */
export const transformLead = (data: any): EnhancedLead => {
  return {
    ...data,
    total_conversations: 0,
    preferred_channels: [],
    last_contact_date: data.updated_at
  };
};

// ==================== VALIDATION ====================

/**
 * التحقق من صحة بيانات المحادثة
 */
export const validateConversation = (data: any): boolean => {
  return !!(
    data.id &&
    data.lead_id &&
    ['active', 'closed', 'paused'].includes(data.status)
  );
};

/**
 * التحقق من صحة بيانات الرسالة
 */
export const validateMessage = (data: any): boolean => {
  return !!(
    data.id &&
    data.conversation_id &&
    data.content &&
    ['text', 'email', 'sms', 'whatsapp'].includes(data.type) &&
    ['inbound', 'outbound'].includes(data.direction)
  );
};

// ==================== HOOKS HELPERS ====================

/**
 * إنشاء مفاتيح الاستعلام للـ React Query
 */
export const createQueryKeys = {
  conversation: (id: string) => ['conversation', id] as const,
  messages: (id: string) => ['messages', id] as const,
  lead: (id: string) => ['lead', id] as const,
  templates: () => ['message-templates'] as const,
  activities: (id: string) => ['conversation-activities', id] as const,
  analytics: (id: string) => ['conversation-analytics', id] as const,
  search: (query: string, filters?: any) => ['message-search', query, filters] as const
};

/**
 * إعدادات React Query للمحادثات
 */
export const conversationQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  retry: (failureCount: number, error: any) => {
    // Don't retry on 401, 403, 404
    if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
      return false;
    }
    return failureCount < 3;
  },
  refetchOnWindowFocus: false
};

// ==================== EVENT HANDLERS ====================

/**
 * معالج أحداث المحادثة
 */
export class ConversationEventHandler {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

// ==================== WEBSOCKET HELPERS ====================

/**
 * إنشاء اتصال WebSocket للمحادثة
 */
export const createConversationWebSocket = (
  conversationId: string,
  onMessage: (data: any) => void,
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void
): WebSocket => {
  const ws = new WebSocket(`ws://localhost:8000/ws/conversations/${conversationId}`);
  
  ws.onopen = () => onStatusChange('connected');
  ws.onclose = () => onStatusChange('disconnected');
  ws.onerror = () => onStatusChange('disconnected');
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  return ws;
};

/**
 * إرسال رسالة عبر WebSocket
 */
export const sendWebSocketMessage = (ws: WebSocket, type: string, data: any): void => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...data }));
  }
};

// ==================== STORAGE HELPERS ====================

/**
 * حفظ مسودة الرسالة في التخزين المحلي
 */
export const saveMessageDraft = (conversationId: string, content: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`draft_${conversationId}`, content);
  }
};

/**
 * استرجاع مسودة الرسالة من التخزين المحلي
 */
export const getMessageDraft = (conversationId: string): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`draft_${conversationId}`) || '';
  }
  return '';
};

/**
 * حذف مسودة الرسالة
 */
export const clearMessageDraft = (conversationId: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`draft_${conversationId}`);
  }
};

// ==================== PERFORMANCE HELPERS ====================

/**
 * تحسين عرض الرسائل الطويلة
 */
export const optimizeMessageDisplay = (messages: Message[], maxVisible = 100): {
  visible: Message[];
  hasMore: boolean;
  hiddenCount: number;
} => {
  if (messages.length <= maxVisible) {
    return {
      visible: messages,
      hasMore: false,
      hiddenCount: 0
    };
  }

  return {
    visible: messages.slice(-maxVisible),
    hasMore: true,
    hiddenCount: messages.length - maxVisible
  };
};

/**
 * تأخير تحميل الصور
 */
export const lazyLoadImages = (container: HTMLElement): void => {
  const images = container.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src!;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
};

// ==================== ACCESSIBILITY HELPERS ====================

/**
 * إضافة دعم قارئ الشاشة
 */
export const announceMessage = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * التركيز على عنصر جديد
 */
export const focusNewMessage = (messageId: string): void => {
  const messageElement = document.getElementById(`message-${messageId}`);
  if (messageElement) {
    messageElement.focus();
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

// ==================== EXPORT DEFAULT ====================

// التصدير الافتراضي للصفحة الرئيسية
export default ConversationPage;