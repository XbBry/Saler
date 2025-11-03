import { z } from 'zod';
import { 
  idSchema, 
  dateSchema, 
  createStatusEnum, 
  paginationSchema 
} from './common';

// ==================== MESSAGES SCHEMAS ====================

// Message Types
export const messageTypeEnum = createStatusEnum([
  'text',
  'email', 
  'sms',
  'whatsapp',
  'push',
  'voice'
] as const);

// Message Direction
export const messageDirectionEnum = createStatusEnum([
  'inbound',
  'outbound'
] as const);

// Message Status
export const messageStatusEnum = createStatusEnum([
  'draft',
  'sent',
  'delivered',
  'read',
  'failed',
  'bounced'
] as const);

// Conversation Status
export const conversationStatusEnum = createStatusEnum([
  'active',
  'closed',
  'paused',
  'archived'
] as const);

// Message Priority
export const messagePriorityEnum = createStatusEnum([
  'low',
  'normal',
  'high',
  'urgent'
] as const);

// Message Channel
export const messageChannelEnum = createStatusEnum([
  'email',
  'sms', 
  'whatsapp',
  'facebook',
  'instagram',
  'twitter',
  'telegram',
  'push',
  'in_app'
] as const);

// Send Message Schema
export const sendMessageSchema = z.object({
  conversationId: idSchema,
  content: z.string().min(1, 'محتوى الرسالة مطلوب').max(4000, 'الرسالة يجب أن تكون أقل من 4000 حرف'),
  type: messageTypeEnum,
  priority: messagePriorityEnum.default('normal'),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string().url(),
    mimeType: z.string(),
    size: z.number().positive(),
  })).max(5, 'يمكن إرسال 5 مرفقات كحد أقصى').optional(),
  scheduledAt: dateSchema.optional(),
  replyToId: idSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Message Schema (Complete)
export const messageSchema = z.object({
  id: idSchema,
  conversationId: idSchema,
  content: z.string(),
  type: messageTypeEnum,
  direction: messageDirectionEnum,
  status: messageStatusEnum,
  priority: messagePriorityEnum,
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
  sentAt: dateSchema.optional(),
  deliveredAt: dateSchema.optional(),
  readAt: dateSchema.optional(),
  failedAt: dateSchema.optional(),
  attachments: z.array(z.object({
    id: idSchema,
    filename: z.string(),
    url: z.string().url(),
    mimeType: z.string(),
    size: z.number().positive(),
    createdAt: dateSchema,
  })).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  senderId: idSchema,
  sender: z.object({
    id: idSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }),
  replyToId: idSchema.optional(),
  replyTo: z.object({
    id: idSchema,
    content: z.string(),
    createdAt: dateSchema,
  }).optional(),
  readBy: z.array(z.object({
    userId: idSchema,
    readAt: dateSchema,
  })).optional(),
  reactions: z.array(z.object({
    userId: idSchema,
    emoji: z.string(),
    createdAt: dateSchema,
  })).optional(),
  isDeleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: idSchema.optional(),
});

// Conversation Schema
export const conversationSchema = z.object({
  id: idSchema,
  leadId: idSchema,
  status: conversationStatusEnum,
  priority: messagePriorityEnum.default('normal'),
  subject: z.string().max(200, 'موضوع المحادثة يجب أن يكون أقل من 200 حرف').optional(),
  lastMessageAt: dateSchema,
  lastMessagePreview: z.string().max(100).optional(),
  messageCount: z.number().min(0),
  unreadCount: z.number().min(0),
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
  createdBy: idSchema,
  assignedTo: idSchema.optional(),
  assignedToUser: z.object({
    id: idSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }).optional(),
  lead: z.object({
    id: idSchema,
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    company: z.string().optional(),
  }),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  archivedAt: dateSchema.optional(),
  archivedBy: idSchema.optional(),
});

// Message Template Schema
export const messageTemplateSchema = z.object({
  id: idSchema,
  name: z.string().min(1, 'اسم القالب مطلوب').max(100, 'اسم القالب يجب أن يكون أقل من 100 حرف'),
  subject: z.string().max(200, 'موضوع القالب يجب أن يكون أقل من 200 حرف').optional(),
  content: z.string().min(1, 'محتوى القالب مطلوب').max(4000, 'محتوى القالب يجب أن يكون أقل من 4000 حرف'),
  type: messageTypeEnum,
  category: z.string().max(50, 'فئة القالب يجب أن تكون أقل من 50 حرف').optional(),
  variables: z.array(z.object({
    name: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['text', 'number', 'date', 'boolean']),
    required: z.boolean().default(false),
    defaultValue: z.string().optional(),
    validation: z.object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      options: z.array(z.string()).optional(),
    }).optional(),
  })),
  isActive: z.boolean().default(true),
  createdBy: idSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
  usageCount: z.number().min(0).default(0),
});

// Conversation Filters Schema
export const conversationFiltersSchema = z.object({
  status: z.array(conversationStatusEnum).optional(),
  priority: z.array(messagePriorityEnum).optional(),
  assignedTo: idSchema.optional(),
  leadId: idSchema.optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  hasUnread: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  messageType: z.array(messageTypeEnum).optional(),
});

// Message Filters Schema
export const messageFiltersSchema = z.object({
  type: z.array(messageTypeEnum).optional(),
  direction: z.array(messageDirectionEnum).optional(),
  status: z.array(messageStatusEnum).optional(),
  priority: z.array(messagePriorityEnum).optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  senderId: idSchema.optional(),
  hasAttachments: z.boolean().optional(),
  searchQuery: z.string().max(100).optional(),
});

// Bulk Message Schema
export const bulkMessageSchema = z.object({
  conversationIds: z.array(idSchema).min(1).max(100, 'يمكن إرسال رسالة لـ 100 محادثة كحد أقصى'),
  templateId: idSchema.optional(),
  content: z.string().min(1, 'محتوى الرسالة مطلوب').max(4000, 'الرسالة يجب أن تكون أقل من 4000 حرف'),
  type: messageTypeEnum,
  variables: z.record(z.string(), z.string()).optional(),
  scheduledAt: dateSchema.optional(),
  priority: messagePriorityEnum.default('normal'),
});

// Message Automation Schema
export const messageAutomationSchema = z.object({
  id: idSchema,
  name: z.string().min(1, 'اسم الأتمتة مطلوب').max(100, 'اسم الأتمتة يجب أن يكون أقل من 100 حرف'),
  trigger: z.object({
    type: z.enum(['lead_created', 'message_received', 'status_changed', 'time_based']),
    conditions: z.record(z.string(), z.any()),
  }),
  actions: z.array(z.object({
    type: z.enum(['send_message', 'assign_conversation', 'update_status', 'add_tag']),
    config: z.record(z.string(), z.any()),
    delay: z.number().min(0).default(0), // in minutes
  })),
  isActive: z.boolean().default(true),
  createdBy: idSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
});

// Message Statistics Schema
export const messageStatisticsSchema = z.object({
  totalSent: z.number().min(0),
  totalReceived: z.number().min(0),
  deliveryRate: z.number().min(0).max(100),
  openRate: z.number().min(0).max(100),
  responseRate: z.number().min(0).max(100),
  averageResponseTime: z.number().min(0), // in minutes
  byChannel: z.record(messageChannelEnum, z.object({
    sent: z.number().min(0),
    received: z.number().min(0),
    deliveryRate: z.number().min(0).max(100),
  })),
  byType: z.record(messageTypeEnum, z.number()),
  byStatus: z.record(messageStatusEnum, z.number()),
});

// Typing Indicator Schema
export const typingIndicatorSchema = z.object({
  userId: idSchema,
  conversationId: idSchema,
  isTyping: z.boolean(),
  startedAt: dateSchema,
});

// Online Status Schema
export const onlineStatusSchema = z.object({
  userId: idSchema,
  isOnline: z.boolean(),
  lastSeen: dateSchema,
  device: z.object({
    type: z.enum(['web', 'mobile', 'tablet']),
    browser: z.string().optional(),
    os: z.string().optional(),
  }).optional(),
});

// ==================== FORM DATA TYPES ====================

export type SendMessageFormData = z.infer<typeof sendMessageSchema>;
export type MessageFiltersFormData = z.infer<typeof messageFiltersSchema>;
export type ConversationFiltersFormData = z.infer<typeof conversationFiltersSchema>;
export type BulkMessageFormData = z.infer<typeof bulkMessageSchema>;
export type MessageTemplateFormData = z.infer<typeof messageTemplateSchema>;
export type MessageAutomationFormData = z.infer<typeof messageAutomationSchema>;

// API Response Types
export type MessageData = z.infer<typeof messageSchema>;
export type ConversationData = z.infer<typeof conversationSchema>;
export type MessageTemplateData = z.infer<typeof messageTemplateSchema>;
export type MessageStatisticsData = z.infer<typeof messageStatisticsSchema>;
export type TypingIndicatorData = z.infer<typeof typingIndicatorSchema>;
export type OnlineStatusData = z.infer<typeof onlineStatusSchema>;

// ==================== VALIDATION HELPERS ====================

// Message character counting helper
export const countMessageCharacters = (content: string, type: string): {
  characters: number;
  remaining: number;
  isValid: boolean;
} => {
  const limits: Record<string, number> = {
    'sms': 160,
    'whatsapp': 4096,
    'email': 4000,
    'text': 4000,
  };

  const limit = limits[type] || 4000;
  const characters = content.length;
  const remaining = limit - characters;

  return {
    characters,
    remaining,
    isValid: characters <= limit
  };
};

// Message template variable helper
export const extractTemplateVariables = (template: string): string[] => {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = template.match(regex);
  return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
};

// Response time calculator
export const calculateResponseTime = (message1: MessageData, message2: MessageData): number => {
  if (message1.direction === 'outbound' && message2.direction === 'inbound') {
    const responseTime = new Date(message2.createdAt).getTime() - new Date(message1.createdAt).getTime();
    return Math.max(0, responseTime / (1000 * 60)); // return in minutes
  }
  return 0;
};

// Conversation priority calculator
export const calculateConversationPriority = (conversation: ConversationData): 'low' | 'normal' | 'high' | 'urgent' => {
  let priority = 'normal';

  // Check if conversation has urgent messages
  const unreadCount = conversation.unreadCount;
  const messageCount = conversation.messageCount;

  if (unreadCount === 0 && messageCount > 20) {
    priority = 'urgent'; // Very active conversation with no recent activity
  } else if (unreadCount > 5) {
    priority = 'high'; // Many unread messages
  } else if (unreadCount > 2) {
    priority = 'high'; // Several unread messages
  } else if (messageCount > 50) {
    priority = 'high'; // Very active conversation
  }

  return priority;
};

// Message validation helper
export const validateMessageContent = (content: string, type: string): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} => {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check length
  const charCount = countMessageCharacters(content, type);
  if (charCount.characters > charCount.remaining * 0.9) {
    warnings.push(`اقتراب من الحد الأقصى لعدد الأحرف (${charCount.remaining} حرف متبقي)`);
  }

  // Check for potential spam indicators
  const spamPatterns = [
    /(.)\1{4,}/, // Repeated characters
    /[A-Z]{10,}/, // Too many uppercase letters
    /!{3,}/, // Multiple exclamation marks
  ];

  spamPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      warnings.push('قد يحتوي النص على مؤشرات سبام');
      suggestions.push('تجنب التكرار المفرط للاحتفاظ بجودة الرسالة');
    }
  });

  // Check for personalization
  if (type === 'email' && !content.includes('{{name}}') && !content.includes('{{firstName}}')) {
    suggestions.push('إضافة متغير الاسم قد يحسن من التفاعل');
  }

  return {
    isValid: charCount.isValid,
    warnings,
    suggestions
  };
};