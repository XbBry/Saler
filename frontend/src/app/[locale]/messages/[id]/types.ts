// ==================== MESSAGE EXTENSIONS ====================

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface MessageThread {
  id: string;
  parent_message_id: string;
  messages: Message[];
  participants: string[];
  created_at: string;
  updated_at: string;
}

export interface MessageDraft {
  id: string;
  conversation_id: string;
  content: string;
  type: MessageType;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ==================== CONVERSATION EXTENSIONS ====================

export interface ConversationMetrics {
  total_messages: number;
  unread_count: number;
  avg_response_time: number;
  customer_satisfaction?: number;
  conversion_rate?: number;
  revenue_generated?: number;
  last_activity: string;
}

export interface ConversationTags {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface ConversationAssignment {
  assigned_to: string;
  assigned_by: string;
  assigned_at: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface ConversationSettings {
  notifications_enabled: boolean;
  auto_assignment: boolean;
  escalation_rules: EscalationRule[];
  working_hours: WorkingHours;
  integration_settings: Record<string, any>;
}

export interface EscalationRule {
  id: string;
  condition: string;
  action: string;
  delay_minutes: number;
  assigned_to?: string;
  is_active: boolean;
}

export interface WorkingHours {
  timezone: string;
  schedule: {
    [key: string]: {
      start: string;
      end: string;
      is_working_day: boolean;
    };
  };
  holidays: string[];
}

// ==================== PARTICIPANT EXTENSIONS ====================

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'agent' | 'supervisor' | 'customer';
  joined_at: string;
  left_at?: string;
  is_online: boolean;
  last_seen?: string;
  permissions: string[];
}

export interface AgentStatus {
  user_id: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  current_conversations: number;
  max_conversations: number;
  skills: string[];
  languages: string[];
}

// ==================== ACTIVITY LOG ====================

export interface ConversationActivity {
  id: string;
  conversation_id: string;
  type: 'message' | 'note' | 'assignment' | 'status_change' | 'tag_added' | 'file_upload';
  description: string;
  performed_by: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ==================== INTEGRATION EXTENSIONS ====================

export interface ConversationIntegration {
  id: string;
  conversation_id: string;
  integration_type: 'whatsapp' | 'telegram' | 'facebook' | 'email' | 'sms';
  external_id: string;
  channel_data: Record<string, any>;
  sync_status: 'pending' | 'synced' | 'failed';
  last_sync_at?: string;
}

export interface MessageDeliveryStatus {
  message_id: string;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  delivery_details?: Record<string, any>;
  attempted_at: string;
  delivered_at?: string;
}

// ==================== ANALYTICS EXTENSIONS ====================

export interface ConversationAnalytics {
  conversation_id: string;
  duration_minutes: number;
  message_count: number;
  response_time_avg: number;
  customer_satisfaction_score?: number;
  resolution_status: 'resolved' | 'escalated' | 'abandoned' | 'pending';
  resolution_time_minutes?: number;
  agent_performance?: AgentPerformanceMetrics;
  customer_feedback?: CustomerFeedback;
}

export interface AgentPerformanceMetrics {
  agent_id: string;
  response_time_avg: number;
  resolution_rate: number;
  customer_satisfaction: number;
  messages_handled: number;
}

export interface CustomerFeedback {
  rating: number; // 1-5
  comment?: string;
  feedback_type: 'resolution' | 'agent' | 'overall';
  submitted_at: string;
}

// ==================== NOTIFICATION EXTENSIONS ====================

export interface ConversationNotification {
  id: string;
  conversation_id: string;
  type: 'new_message' | 'assignment' | 'escalation' | 'timeout';
  recipient: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  metadata?: Record<string, any>;
}

// ==================== SEARCH EXTENSIONS ====================

export interface ConversationSearchResult {
  conversation_id: string;
  lead: Lead;
  last_message: Message;
  relevance_score: number;
  matched_fields: string[];
  highlights: {
    [key: string]: string[];
  };
}

export interface MessageSearchResult {
  message_id: string;
  conversation_id: string;
  content: string;
  matched_fields: string[];
  relevance_score: number;
  context: {
    previous_messages: Message[];
    next_messages: Message[];
  };
}

// ==================== EXPORT ENHANCED TYPES ====================

// Extend existing types
export interface EnhancedConversation extends Conversation {
  metrics?: ConversationMetrics;
  tags?: ConversationTags[];
  assignment?: ConversationAssignment;
  settings?: ConversationSettings;
  participants?: ConversationParticipant[];
  activities?: ConversationActivity[];
  integrations?: ConversationIntegration[];
  notifications?: ConversationNotification[];
  analytics?: ConversationAnalytics;
  draft?: MessageDraft;
}

export interface EnhancedMessage extends Message {
  reactions?: MessageReaction[];
  thread?: MessageThread;
  delivery_status?: MessageDeliveryStatus;
  search_highlights?: string[];
}

export interface EnhancedLead extends Lead {
  conversation_metrics?: ConversationMetrics;
  total_conversations?: number;
  avg_satisfaction_score?: number;
  lifetime_value?: number;
  preferred_channels?: string[];
  last_contact_date?: string;
}

// ==================== UTILITY TYPES ====================

export type ConversationFilter = {
  status?: ConversationStatus[];
  assigned_to?: string[];
  tags?: string[];
  date_range?: {
    from: string;
    to: string;
  };
  metrics?: {
    response_time_max?: number;
    unread_only?: boolean;
    satisfaction_min?: number;
  };
};

export type ConversationSort = {
  field: 'last_message_at' | 'created_at' | 'response_time' | 'satisfaction_score';
  order: 'asc' | 'desc';
};

export type BulkAction = 
  | 'assign'
  | 'tag'
  | 'close'
  | 'archive'
  | 'export'
  | 'delete';

// ==================== API TYPES ====================

export interface ConversationListRequest {
  filters?: ConversationFilter;
  sort?: ConversationSort;
  pagination?: {
    page: number;
    limit: number;
  };
  search?: string;
}

export interface ConversationListResponse {
  conversations: EnhancedConversation[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ConversationUpdateRequest {
  status?: ConversationStatus;
  tags?: string[];
  assignment?: ConversationAssignment;
  settings?: Partial<ConversationSettings>;
}

export interface BulkConversationActionRequest {
  conversation_ids: string[];
  action: BulkAction;
  parameters?: Record<string, any>;
}

// ==================== CONSTANTS ====================

export const CONVERSATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  VOICE: 'voice',
  VIDEO: 'video',
  LOCATION: 'location',
  CONTACT: 'contact'
} as const;

export const CONVERSATION_EVENTS = {
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_SENT: 'message_sent',
  USER_TYPING: 'user_typing',
  USER_STOPPED_TYPING: 'user_stopped_typing',
  CONVERSATION_ASSIGNED: 'conversation_assigned',
  CONVERSATION_CLOSED: 'conversation_closed',
  AGENT_STATUS_CHANGED: 'agent_status_changed'
} as const;

export const NOTIFICATION_TYPES = {
  NEW_MESSAGE: 'new_message',
  ASSIGNMENT: 'assignment',
  ESCALATION: 'escalation',
  TIMEOUT: 'timeout',
  CUSTOMER_REPLY: 'customer_reply',
  AGENT_REPLY: 'agent_reply'
} as const;

// ==================== DEFAULT EXPORTS ====================

export type ConversationPriority = typeof CONVERSATION_PRIORITIES[keyof typeof CONVERSATION_PRIORITIES];
export type MessageContentType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
export type ConversationEventType = typeof CONVERSATION_EVENTS[keyof typeof CONVERSATION_EVENTS];
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];