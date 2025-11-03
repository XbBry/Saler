// مكونات إدارة التكاملات
export { IntegrationCard } from './IntegrationCard';
export { IntegrationStatus, StatusIndicator } from './IntegrationStatus';
export { WebhookList, AddWebhookForm } from './WebhookList';
export { IntegrationForm } from './IntegrationForm';
export { SyncStatus, SyncStatusIndicator } from './SyncStatus';
export { IntegrationSettings } from './IntegrationSettings';

// أنواع البيانات المشتركة
export interface Integration {
  id: string;
  name: string;
  description: string;
  icon?: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: Date;
  successCount: number;
  failureCount: number;
  autoSync?: boolean;
  type: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  status: 'active' | 'inactive' | 'failed';
  lastDelivery?: Date;
  successCount: number;
  failureCount: number;
  nextRetry?: Date;
  headers?: Record<string, string>;
  description?: string;
}

export interface IntegrationConfig {
  id?: string;
  name: string;
  description: string;
  type: string;
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  webhookUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  autoSync?: boolean;
  syncInterval?: number;
  fields?: Record<string, any>;
}

export interface SyncItem {
  id: string;
  type: 'contact' | 'deal' | 'message' | 'note' | 'activity';
  action: 'create' | 'update' | 'delete';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: Date;
  errorMessage?: string;
  data?: any;
}

export interface SyncStats {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  pending: number;
}

export interface FieldMapping {
  id: string;
  source: string;
  target: string;
  required: boolean;
  defaultValue?: string;
  transformation?: string;
}

export interface Filter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  active: boolean;
}