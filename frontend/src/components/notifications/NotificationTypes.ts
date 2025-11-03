// أنواع التنبيهات المختلفة
export type NotificationType = 
  | 'lead'
  | 'message'
  | 'system'
  | 'sale'
  | 'error'
  | 'warning'
  | 'success'
  | 'info';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

export interface NotificationData {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  channels: NotificationChannel[];
}

// أنواع التنبيهات المحددة
export interface LeadNotificationData extends NotificationData {
  type: 'lead';
  metadata: {
    leadId: string;
    leadName: string;
    leadEmail?: string;
    action: 'new_lead' | 'lead_updated' | 'lead_assigned' | 'lead_responded' | 'lead_converted';
    priority: 'medium' | 'high' | 'urgent';
  };
}

export interface MessageNotificationData extends NotificationData {
  type: 'message';
  metadata: {
    conversationId: string;
    senderName: string;
    senderAvatar?: string;
    messagePreview: string;
    unreadCount: number;
  };
}

export interface SystemNotificationData extends NotificationData {
  type: 'system';
  metadata: {
    component: 'dashboard' | 'api' | 'database' | 'auth' | 'notifications';
    action: 'maintenance' | 'update' | 'backup' | 'error_recovery';
  };
}

export interface SaleNotificationData extends NotificationData {
  type: 'sale';
  metadata: {
    dealId: string;
    dealName: string;
    dealValue: number;
    customerName: string;
    stage: string;
    milestone: 'deal_created' | 'deal_won' | 'payment_received' | 'milestone_achieved';
  };
}

// إعدادات التنبيهات
export interface NotificationSettings {
  userId: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
    timezone: string;
  };
  preferences: {
    leadUpdates: boolean;
    messageAlerts: boolean;
    systemNotifications: boolean;
    salesMilestones: boolean;
    marketingEmails: boolean;
  };
  frequency: {
    immediate: NotificationType[];
    daily: NotificationType[];
    weekly: NotificationType[];
    never: NotificationType[];
  };
}

// إحصائيات التنبيهات
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// إجراءات التنبيهات
export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: () => void;
  loading?: boolean;
}

// فلاتر التنبيهات
export interface NotificationFilters {
  type?: NotificationType[];
  priority?: NotificationPriority[];
  read?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}