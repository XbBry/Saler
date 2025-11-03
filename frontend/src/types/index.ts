// ==================== COMMON TYPES ====================

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp?: string;
}

export interface ApiError {
  message: string;
  detail?: string;
  status_code: number;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export class ApiErrorException extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiErrorException';
  }
}

// ==================== AUTH TYPES ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ==================== LEAD TYPES ====================

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  status: LeadStatus;
  score?: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  notes?: Note[];
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  tags?: string[];
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {
  status?: LeadStatus;
}

// ==================== NOTE TYPES ====================

export interface Note {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
  lead_id: string;
}

// ==================== MESSAGE TYPES ====================

export type MessageType = 'text' | 'email' | 'sms' | 'whatsapp';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  type: MessageType;
  direction: MessageDirection;
  status: MessageStatus;
  created_at: string;
  metadata?: Record<string, any>;
}

export type ConversationStatus = 'active' | 'closed' | 'paused';

export interface Conversation {
  id: string;
  lead_id: string;
  status: ConversationStatus;
  last_message_at: string;
  message_count: number;
  created_at: string;
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  type: MessageType;
}

// ==================== PLAYBOOK TYPES ====================

export interface Playbook {
  id: string;
  name: string;
  description?: string;
  steps: PlaybookStep[];
  trigger_conditions: Record<string, any>;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PlaybookStep {
  id: string;
  order: number;
  type: 'wait' | 'message' | 'condition' | 'assignment';
  config: Record<string, any>;
  next_steps?: string[];
}

export interface CreatePlaybookRequest {
  name: string;
  description?: string;
  steps: Omit<PlaybookStep, 'id'>[];
  trigger_conditions: Record<string, any>;
  is_active?: boolean;
}

export interface UpdatePlaybookRequest extends Partial<CreatePlaybookRequest> {}

// ==================== WORKFLOW TYPES ====================

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed';
export type WorkflowTriggerType = 'manual' | 'automatic' | 'scheduled';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  trigger_type: WorkflowTriggerType;
  trigger_config: Record<string, any>;
  steps: WorkflowStep[];
  execution_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  order: number;
  type: 'condition' | 'action' | 'delay';
  config: Record<string, any>;
  next_steps?: string[];
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  trigger_type: WorkflowTriggerType;
  trigger_config: Record<string, any>;
  steps: Omit<WorkflowStep, 'id'>[];
}

export interface ExecuteWorkflowRequest {
  workflow_id: string;
  input_data?: Record<string, any>;
}

// ==================== ANALYTICS TYPES ====================

export interface AnalyticsData {
  leads: {
    total: number;
    new_this_month: number;
    conversion_rate: number;
    by_status: Record<string, number>;
    by_source: Record<string, number>;
    trends: {
      date: string;
      count: number;
    }[];
  };
  conversations: {
    total: number;
    active: number;
    response_rate: number;
    avg_response_time: number;
  };
  messages: {
    total: number;
    by_type: Record<string, number>;
    delivery_rate: number;
  };
  performance: {
    leads_per_day: number;
    conversations_per_day: number;
    messages_per_day: number;
  };
}

// ==================== INTEGRATION TYPES ====================

export type IntegrationType = 'email' | 'sms' | 'whatsapp' | 'crm' | 'calendar' | 'webhook' | 'api' | 'database';
export type IntegrationStatus = 'configured' | 'expired' | 'missing' | 'connected' | 'disconnected' | 'error' | 'connecting';

// Basic Integration (existing)
export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  config: Record<string, any>;
  is_active: boolean;
  credentials_status: IntegrationStatus;
  created_at: string;
  updated_at: string;
}

// Advanced Integration with Error Handling
export interface AdvancedIntegration {
  id: string;
  name: string;
  type: Integration['type'];
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  config: Record<string, any>;
  credentials?: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
  };
  lastSyncAt?: string;
  lastError?: string;
  metrics: {
    successRate: number;
    averageResponseTime: number;
    totalRequests: number;
    errorCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationOperation {
  id: string;
  integrationId: string;
  type: 'sync' | 'push' | 'pull' | 'webhook';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  data?: any;
  result?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
}

export interface IntegrationStats {
  totalIntegrations: number;
  activeIntegrations: number;
  failedIntegrations: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  successRate: number;
}

export interface IntegrationFilters {
  type?: IntegrationType;
  status?: IntegrationStatus;
  search?: string;
}

export interface SyncOptions {
  direction?: 'pull' | 'push' | 'both';
  dataTypes?: string[];
}

export interface IntegrationConfig {
  name: string;
  type: IntegrationType;
  provider: string;
  config: Record<string, any>;
}

export interface TestIntegrationRequest {
  integration_id: string;
  test_data?: Record<string, any>;
}

export interface IntegrationProvider {
  provider: string;
  type: IntegrationType;
  name: string;
}

// ==================== ERROR HANDLING TYPES ====================

export interface ErrorContext {
  operation: string;
  integrationId?: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  signature?: string;
  timestamp?: string;
  payload?: any;
  error?: string;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  status: 'success' | 'error';
  error?: string;
  metadata?: Record<string, any>;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}

// ==================== EXPORT ALL TYPES ====================

export * from './api';

// Re-export types that are commonly used
export type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
  Lead,
  LeadStatus,
  CreateLeadRequest,
  UpdateLeadRequest,
  Note,
  Message,
  MessageType,
  MessageDirection,
  MessageStatus,
  Conversation,
  ConversationStatus,
  SendMessageRequest,
  Playbook,
  PlaybookStep,
  CreatePlaybookRequest,
  UpdatePlaybookRequest,
  Workflow,
  WorkflowStatus,
  WorkflowTriggerType,
  WorkflowStep,
  CreateWorkflowRequest,
  ExecuteWorkflowRequest,
  AnalyticsData,
  Integration,
  IntegrationType,
  IntegrationStatus,
  IntegrationConfig,
  TestIntegrationRequest,
  IntegrationProvider,
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginatedResponse,
  ApiErrorException,
};// ==================== MESSAGE TEMPLATES TYPES ====================

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: MessageTemplateVariable[];
  category: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  default_value?: string;
  required: boolean;
}

export interface CreateMessageTemplateRequest {
  name: string;
  content: string;
  variables: Omit<MessageTemplateVariable, 'name'>[];
  category: string;
  is_active?: boolean;
}

export interface UpdateMessageTemplateRequest extends Partial<CreateMessageTemplateRequest> {}

export interface MessageAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mime_type: string;
  created_at: string;
}

export interface MessageContent {
  type: 'text' | 'html' | 'rich';
  text: string;
  html?: string;
  attachments?: MessageAttachment[];
}

export interface TypingIndicator {
  user_id: string;
  conversation_id: string;
  is_typing: boolean;
  started_at: string;
}

export interface OnlineStatus {
  user_id: string;
  is_online: boolean;
  last_seen: string;
}

// ==================== SEARCH AND FILTERING ====================

export interface MessageSearchParams {
  query?: string;
  conversation_id?: string;
  type?: MessageType[];
  direction?: MessageDirection[];
  status?: MessageStatus[];
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface ConversationSearchParams {
  query?: string;
  status?: ConversationStatus[];
  lead_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface MessageValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface SendMessageValidation {
  content: string;
  type: MessageType;
  conversation_id: string;
}

// Re-export existing message types
export * from './api';

// Add new message-related types to existing exports
export type {
  Message,
  MessageType,
  MessageDirection,
  MessageStatus,
  MessageContent,
  MessageAttachment,
  Conversation,
  ConversationStatus,
  SendMessageRequest,
  MessageTemplate,
  MessageTemplateVariable,
  CreateMessageTemplateRequest,
  UpdateMessageTemplateRequest,
  TypingIndicator,
  OnlineStatus,
  MessageSearchParams,
  ConversationSearchParams,
  MessageValidationResult,
  SendMessageValidation,
};

// Add advanced integration types
export type {
  AdvancedIntegration,
  IntegrationOperation,
  IntegrationStats,
  IntegrationFilters,
  SyncOptions,
  ErrorContext,
  RetryOptions,
  CircuitBreakerConfig,
  RateLimitInfo,
  WebhookVerificationResult,
  PerformanceMetrics,
  HealthCheck,
};