import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { 
  Message, 
  Conversation, 
  Lead, 
  MessageType, 
  MessageDirection,
  ConversationStatus,
  MessageStatus
} from '@/types';

/**
 * تنسيق وقت الرسالة للعرض
 */
export const formatMessageTime = (date: string | Date, locale: string = 'ar'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // إذا كانت الرسالة من اليوم
  if (isToday(dateObj)) {
    return format(dateObj, 'HH:mm', { locale: locale === 'ar' ? ar : undefined });
  }
  
  // إذا كانت الرسالة من الأمس
  if (isYesterday(dateObj)) {
    return `أمس ${format(dateObj, 'HH:mm', { locale: locale === 'ar' ? ar : undefined })}`;
  }
  
  // إذا كانت الرسالة من هذا الأسبوع
  if (isThisWeek(dateObj)) {
    const dayName = format(dateObj, 'EEEE', { locale: locale === 'ar' ? ar : undefined });
    return `${dayName} ${format(dateObj, 'HH:mm', { locale: locale === 'ar' ? ar : undefined })}`;
  }
  
  // للأوقات الأقدم
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: locale === 'ar' ? ar : undefined });
};

/**
 * تنسيق مدة المحادثة
 */
export const formatConversationDuration = (startTime: string, endTime?: string): string => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const durationMs = end.getTime() - start.getTime();
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}س ${minutes}د ${seconds}ث`;
  } else if (minutes > 0) {
    return `${minutes}د ${seconds}ث`;
  } else {
    return `${seconds}ث`;
  }
};

/**
 * الحصول على رسالة معاينة للمحادثة
 */
export const getConversationPreview = (lastMessage?: Message): string => {
  if (!lastMessage) return 'لا توجد رسائل';
  
  // إذا كانت الرسالة تحتوي على ملف
  if (lastMessage.metadata?.type === 'file') {
    return `📎 ${lastMessage.metadata.attachment?.filename || 'ملف مرفق'}`;
  }
  
  // إذا كانت الرسالة تحتوي على صورة
  if (lastMessage.metadata?.type === 'image') {
    return '🖼️ صورة';
  }
  
  // إذا كانت رسالة صوتية
  if (lastMessage.metadata?.type === 'voice') {
    return '🎤 رسالة صوتية';
  }
  
  // نص عادي
  const content = lastMessage.content || '';
  return content.length > 50 ? `${content.substring(0, 50)}...` : content;
};

/**
 * تحديد نوع الرسالة من المحتوى
 */
export const detectMessageType = (content: string, metadata?: Record<string, any>): MessageType => {
  // إذا كان هناك metadata، استخدمه
  if (metadata?.type && ['text', 'email', 'sms', 'whatsapp'].includes(metadata.type)) {
    return metadata.type as MessageType;
  }
  
  // اكتشاف نوع الرسالة من المحتوى
  if (content.includes('@') && content.includes('.')) {
    return 'email';
  }
  
  if (content.startsWith('+') || content.match(/^\d{10,}$/)) {
    return 'sms';
  }
  
  if (content.includes('whatsapp') || content.length > 1000) {
    return 'whatsapp';
  }
  
  return 'text';
};

/**
 * تحديد اتجاه الرسالة
 */
export const getMessageDirection = (message: Message, currentUserId: string): MessageDirection => {
  // في التطبيق الحقيقي، سيتم تحديد هذا من خلال user_id في الرسالة
  return message.direction;
};

/**
 * تنسيق حالة الرسالة
 */
export const getMessageStatusText = (status: MessageStatus, direction: MessageDirection): string => {
  if (direction === 'inbound') {
    switch (status) {
      case 'sent': return 'تم الاستلام';
      case 'delivered': return 'تم التسليم';
      case 'read': return 'تم القراءة';
      default: return 'قيد المعالجة';
    }
  } else {
    switch (status) {
      case 'sent': return 'تم الإرسال';
      case 'delivered': return 'تم التسليم';
      case 'read': return 'تم القراءة';
      case 'failed': return 'فشل الإرسال';
      default: return 'قيد الإرسال';
    }
  }
};

/**
 * تنسيق حالة المحادثة
 */
export const getConversationStatusText = (status: ConversationStatus): string => {
  switch (status) {
    case 'active': return 'نشطة';
    case 'closed': return 'منتهية';
    case 'paused': return 'متوقفة';
    default: return 'غير محدد';
  }
};

/**
 * حساب عدد الرسائل غير المقروءة
 */
export const calculateUnreadCount = (messages: Message[], lastReadAt?: string): number => {
  if (!lastReadAt) return messages.length;
  
  const lastReadDate = new Date(lastReadAt);
  return messages.filter(msg => new Date(msg.created_at) > lastReadDate).length;
};

/**
 * حساب متوسط وقت الاستجابة
 */
export const calculateAverageResponseTime = (messages: Message[]): number => {
  const responseTimes: number[] = [];
  
  for (let i = 0; i < messages.length - 1; i++) {
    const currentMessage = messages[i];
    const nextMessage = messages[i + 1];
    
    // إذا كانت الرسالة الحالية واردة والتالية صادرة
    if (currentMessage.direction === 'inbound' && nextMessage.direction === 'outbound') {
      const responseTime = new Date(nextMessage.created_at).getTime() - new Date(currentMessage.created_at).getTime();
      responseTimes.push(responseTime);
    }
  }
  
  if (responseTimes.length === 0) return 0;
  
  const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  return Math.round(average / (1000 * 60)); // بالدقائق
};

/**
 * تنسيق وقت الاستجابة
 */
export const formatResponseTime = (minutes: number): string => {
  if (minutes < 1) return 'أقل من دقيقة';
  if (minutes < 60) return `${Math.round(minutes)} دقيقة`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ساعة`;
  }
  
  return `${hours} ساعة و ${Math.round(remainingMinutes)} دقيقة`;
};

/**
 * التحقق من إمكانية الرد على رسالة
 */
export const canReplyToMessage = (message: Message): boolean => {
  // لا يمكن الرد على الرسائل الصوتية أو الملفات
  if (message.metadata?.type === 'voice' || message.metadata?.type === 'file') {
    return false;
  }
  
  // لا يمكن الرد على الرسائل المنتهية الصلاحية
  if (message.metadata?.expired_at) {
    return new Date(message.metadata.expired_at) > new Date();
  }
  
  return true;
};

/**
 * تحديد لون حالة المحادثة
 */
export const getConversationStatusColor = (status: ConversationStatus): string => {
  switch (status) {
    case 'active': return 'text-green-600 bg-green-100';
    case 'closed': return 'text-gray-600 bg-gray-100';
    case 'paused': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

/**
 * تحديد لون أولوية المحادثة
 */
export const getPriorityColor = (priority?: 'low' | 'medium' | 'high' | 'urgent'): string => {
  switch (priority) {
    case 'urgent': return 'text-red-600 bg-red-100';
    case 'high': return 'text-orange-600 bg-orange-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

/**
 * فلترة الرسائل حسب النص
 */
export const filterMessagesByText = (messages: Message[], query: string): Message[] => {
  if (!query.trim()) return messages;
  
  const searchQuery = query.toLowerCase();
  return messages.filter(message => 
    message.content.toLowerCase().includes(searchQuery) ||
    message.metadata?.attachment?.filename?.toLowerCase().includes(searchQuery)
  );
};

/**
 * تجميع الرسائل حسب التاريخ
 */
export const groupMessagesByDate = (messages: Message[]): Record<string, Message[]> => {
  return messages.reduce((groups, message) => {
    const date = format(new Date(message.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);
};

/**
 * الحصول على اسم العرض للعميل
 */
export const getDisplayName = (lead: Lead): string => {
  if (lead.name && lead.name.trim()) {
    return lead.name;
  }
  
  if (lead.email && lead.email.trim()) {
    return lead.email;
  }
  
  if (lead.phone && lead.phone.trim()) {
    return lead.phone;
  }
  
  return 'عميل غير محدد';
};

/**
 * التحقق من وجود رسائل جديدة
 */
export const hasNewMessages = (messages: Message[], lastCheckedAt?: string): boolean => {
  if (!lastCheckedAt) return messages.length > 0;
  
  const lastChecked = new Date(lastCheckedAt);
  return messages.some(message => new Date(message.created_at) > lastChecked);
};

/**
 * تحديد ما إذا كانت المحادثة تحتاج انتباه
 */
export const needsAttention = (
  conversation: Conversation, 
  lastAgentMessage?: Message,
  avgResponseTime?: number
): boolean => {
  // إذا كانت المحادثة غير نشطة
  if (conversation.status !== 'active') return false;
  
  // إذا لم يكن هناك رد من الوكيل مؤخراً
  const hoursSinceLastAgentMessage = lastAgentMessage 
    ? (new Date().getTime() - new Date(lastAgentMessage.created_at).getTime()) / (1000 * 60 * 60)
    : Infinity;
  
  // إذا مر أكثر من متوسط وقت الاستجابة
  const threshold = avgResponseTime ? avgResponseTime * 2 : 60; // افتراضي ساعة واحدة
  
  return hoursSinceLastAgentMessage * 60 > threshold;
};

/**
 * حساب النقاط للمحادثة
 */
export const calculateConversationScore = (
  conversation: Conversation,
  messages: Message[],
  customerSatisfaction?: number
): number => {
  let score = 50; // نقاط أساسية
  
  // نقاط لاستجابة سريعة
  const avgResponse = calculateAverageResponseTime(messages);
  if (avgResponse < 15) score += 20;
  else if (avgResponse < 30) score += 10;
  else if (avgResponse > 120) score -= 10;
  
  // نقاط لتفاعل العميل
  const inboundMessages = messages.filter(m => m.direction === 'inbound').length;
  const outboundMessages = messages.filter(m => m.direction === 'outbound').length;
  
  if (inboundMessages > 0 && outboundMessages > 0) {
    score += Math.min(20, Math.floor((inboundMessages / outboundMessages) * 10));
  }
  
  // نقاط لرضا العميل
  if (customerSatisfaction) {
    score += (customerSatisfaction - 3) * 5; // مقياس 1-5
  }
  
  // نقاط لانتهاء المحادثة إيجابياً
  if (conversation.status === 'closed') {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
};

/**
 * تصدير المحادثة كملف
 */
export const exportConversation = (
  conversation: Conversation,
  messages: Message[],
  lead: Lead,
  format: 'json' | 'csv' | 'pdf' = 'json'
): string => {
  const data = {
    conversation: {
      id: conversation.id,
      status: conversation.status,
      created_at: conversation.created_at,
      last_message_at: conversation.last_message_at,
      message_count: conversation.message_count
    },
    lead: {
      name: getDisplayName(lead),
      email: lead.email,
      phone: lead.phone,
      company: lead.company
    },
    messages: messages.map(message => ({
      id: message.id,
      content: message.content,
      direction: message.direction,
      type: message.type,
      status: message.status,
      created_at: message.created_at,
      metadata: message.metadata
    }))
  };
  
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      // تحويل إلى CSV (تبسيط)
      const headers = ['الوقت', 'الاتجاه', 'النوع', 'المحتوى', 'الحالة'];
      const rows = data.messages.map(msg => [
        formatMessageTime(msg.created_at),
        msg.direction === 'inbound' ? 'وارد' : 'صادر',
        msg.type,
        msg.content,
        getMessageStatusText(msg.status, msg.direction)
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    default:
      return JSON.stringify(data, null, 2);
  }
};