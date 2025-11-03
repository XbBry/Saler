import { z } from 'zod';
import { 
  idSchema, 
  dateSchema, 
  createStatusEnum, 
  searchSchema,
  urlSchema,
  paginationSchema 
} from './common';

// ==================== INTEGRATIONS SCHEMAS ====================

// Integration Types
export const integrationTypeEnum = createStatusEnum([
  'email',
  'sms',
  'whatsapp',
  'crm',
  'calendar',
  'webhook',
  'api',
  'database',
  'social',
  'payment',
  'analytics',
  'storage',
  'communication',
  'productivity',
  'automation',
  'custom'
] as const);

// Integration Status
export const integrationStatusEnum = createStatusEnum([
  'configured',
  'expired',
  'missing',
  'connected',
  'disconnected',
  'error',
  'connecting',
  'syncing',
  'paused'
] as const);

// Integration Provider
export const integrationProviderEnum = createStatusEnum([
  'google',
  'microsoft',
  'apple',
  'facebook',
  'instagram',
  'twitter',
  'linkedin',
  'whatsapp',
  'telegram',
  'slack',
  'discord',
  'salesforce',
  'hubspot',
  'pipedrive',
  'zoho',
  'shopify',
  'woocommerce',
  'magento',
  'stripe',
  'paypal',
  'square',
  'aws',
  'google_cloud',
  'azure',
  'dropbox',
  'box',
  'custom'
] as const);

// Integration Sync Direction
export const syncDirectionEnum = createStatusEnum([
  'pull',
  'push',
  'bidirectional'
] as const);

// Integration Sync Status
export const syncStatusEnum = createStatusEnum([
  'idle',
  'running',
  'completed',
  'failed',
  'paused'
] as const);

// Basic Integration Configuration Schema
export const integrationConfigSchema = z.object({
  name: z.string().min(1, 'اسم التكامل مطلوب').max(100, 'اسم التكامل يجب أن يكون أقل من 100 حرف'),
  description: z.string().max(500, 'وصف التكامل يجب أن يكون أقل من 500 حرف').optional(),
  type: integrationTypeEnum,
  provider: integrationProviderEnum,
  credentials: z.object({
    apiKey: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    privateKey: z.string().optional(),
    certificate: z.string().optional(),
    webhookUrl: z.string().url().optional(),
    webhookSecret: z.string().optional(),
  }),
  settings: z.object({
    baseUrl: urlSchema.optional(),
    timeout: z.number().min(1).max(300).default(30), // seconds
    retryAttempts: z.number().min(0).max(10).default(3),
    retryDelay: z.number().min(100).max(10000).default(1000), // milliseconds
    rateLimit: z.object({
      requests: z.number().min(1).max(1000).default(100),
      window: z.number().min(1).max(3600).default(60), // seconds
    }).optional(),
    sync: z.object({
      enabled: z.boolean().default(false),
      interval: z.number().min(1).max(1440).default(60), // minutes
      direction: syncDirectionEnum.default('bidirectional'),
      autoStart: z.boolean().default(false),
    }).optional(),
    notifications: z.object({
      enabled: z.boolean().default(true),
      email: z.boolean().default(true),
      webhook: z.boolean().default(false),
      criticalOnly: z.boolean().default(false),
    }).optional(),
  }),
  mappings: z.record(z.string(), z.object({
    source: z.string(),
    target: z.string(),
    transform: z.string().optional(),
    required: z.boolean().default(false),
  })).optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

// Integration Schema (Complete)
export const integrationSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string().optional(),
  type: integrationTypeEnum,
  provider: integrationProviderEnum,
  status: integrationStatusEnum,
  isActive: z.boolean(),
  credentialsStatus: integrationStatusEnum,
  lastSyncAt: dateSchema.optional(),
  lastError: z.string().optional(),
  metrics: z.object({
    successRate: z.number().min(0).max(100),
    averageResponseTime: z.number().min(0), // milliseconds
    totalRequests: z.number().min(0),
    errorCount: z.number().min(0),
    lastHealthCheck: dateSchema.optional(),
  }),
  config: integrationConfigSchema,
  createdBy: idSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
  tags: z.array(z.string()).optional(),
  version: z.string().optional(),
});

// Create Integration Schema
export const createIntegrationSchema = integrationConfigSchema;

// Update Integration Schema
export const updateIntegrationSchema = integrationConfigSchema.partial();

// Integration Test Schema
export const integrationTestSchema = z.object({
  integrationId: idSchema,
  testData: z.record(z.string(), z.any()).optional(),
  testType: z.enum(['connection', 'authentication', 'data_fetch', 'webhook']).default('connection'),
});

// Integration Health Check Schema
export const integrationHealthCheckSchema = z.object({
  id: idSchema,
  integrationId: idSchema,
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  responseTime: z.number().min(0), // milliseconds
  checkedAt: dateSchema,
  details: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
});

// Integration Sync Operation Schema
export const integrationSyncSchema = z.object({
  id: idSchema,
  integrationId: idSchema,
  status: syncStatusEnum,
  direction: syncDirectionEnum,
  startedAt: dateSchema,
  completedAt: dateSchema.optional(),
  progress: z.number().min(0).max(100),
  recordsProcessed: z.number().min(0),
  recordsSuccess: z.number().min(0),
  recordsFailed: z.number().min(0),
  error: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
});

// Integration Mapping Schema
export const integrationMappingSchema = z.object({
  id: idSchema,
  integrationId: idSchema,
  name: z.string().min(1, 'اسم المخطط مطلوب').max(100, 'اسم المخطط يجب أن يكون أقل من 100 حرف'),
  description: z.string().max(500, 'وصف المخطط يجب أن يكون أقل من 500 حرف').optional(),
  sourceSchema: z.object({
    type: z.enum(['api', 'database', 'file', 'webhook']),
    config: z.record(z.string(), z.any()),
  }),
  targetSchema: z.object({
    type: z.enum(['api', 'database', 'file']),
    config: z.record(z.string(), z.any()),
  }),
  transformations: z.array(z.object({
    sourceField: z.string(),
    targetField: z.string(),
    transformType: z.enum(['direct', 'format', 'calculate', 'lookup', 'custom']),
    transformConfig: z.record(z.string(), z.any()).optional(),
    required: z.boolean().default(false),
  })),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'startsWith', 'endsWith']),
    value: z.string(),
  })).optional(),
  isActive: z.boolean().default(true),
  createdBy: idSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
});

// Integration Statistics Schema
export const integrationStatisticsSchema = z.object({
  totalIntegrations: z.number().min(0),
  activeIntegrations: z.number().min(0),
  failedIntegrations: z.number().min(0),
  totalOperations: z.number().min(0),
  successfulOperations: z.number().min(0),
  failedOperations: z.number().min(0),
  averageResponseTime: z.number().min(0),
  successRate: z.number().min(0).max(100),
  byType: z.record(integrationTypeEnum, z.number()),
  byProvider: z.record(integrationProviderEnum, z.number()),
  byStatus: z.record(integrationStatusEnum, z.number()),
  topPerforming: z.array(z.object({
    integrationId: idSchema,
    name: z.string(),
    successRate: z.number().min(0).max(100),
  })),
  recentErrors: z.array(z.object({
    integrationId: idSchema,
    name: z.string(),
    error: z.string(),
    timestamp: dateSchema,
  })),
});

// Integration Webhook Schema
export const integrationWebhookSchema = z.object({
  id: idSchema,
  integrationId: idSchema,
  name: z.string().min(1, 'اسم الـ webhook مطلوب').max(100, 'اسم الـ webhook يجب أن يكون أقل من 100 حرف'),
  url: urlSchema,
  secret: z.string().min(1, 'الـ secret مطلوب'),
  events: z.array(z.string()),
  isActive: z.boolean().default(true),
  lastTriggered: dateSchema.optional(),
  lastError: z.string().optional(),
  retryCount: z.number().min(0).default(0),
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
});

// ==================== FORM DATA TYPES ====================

export type CreateIntegrationFormData = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationFormData = z.infer<typeof updateIntegrationSchema>;
export type IntegrationConfigFormData = z.infer<typeof integrationConfigSchema>;
export type IntegrationTestFormData = z.infer<typeof integrationTestSchema>;
export type IntegrationMappingFormData = z.infer<typeof integrationMappingSchema>;
export type IntegrationWebhookFormData = z.infer<typeof integrationWebhookSchema>;

// API Response Types
export type IntegrationData = z.infer<typeof integrationSchema>;
export type IntegrationConfigData = z.infer<typeof integrationConfigSchema>;
export type IntegrationStatisticsData = z.infer<typeof integrationStatisticsSchema>;
export type IntegrationHealthCheckData = z.infer<typeof integrationHealthCheckSchema>;
export type IntegrationSyncData = z.infer<typeof integrationSyncSchema>;
export type IntegrationMappingData = z.infer<typeof integrationMappingSchema>;
export type IntegrationWebhookData = z.infer<typeof integrationWebhookSchema>;

// ==================== VALIDATION HELPERS ====================

// Integration configuration validator
export const validateIntegrationConfig = (config: IntegrationConfigData): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} => {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check API key security
  if (config.credentials.apiKey && config.credentials.apiKey.length < 10) {
    warnings.push('مفتاح API يبدو قصير جداً');
  }

  // Check timeout settings
  if (config.settings.timeout && config.settings.timeout < 10) {
    warnings.push('timeout منخفض جداً قد يسبب فشل في الاتصال');
  }

  // Check retry attempts
  if (config.settings.retryAttempts && config.settings.retryAttempts > 5) {
    warnings.push('عدد المحاولات كبير قد يسبب تأخير');
  }

  // Check webhook URL
  if (config.credentials.webhookUrl && !config.credentials.webhookUrl.startsWith('https://')) {
    warnings.push('يُنصح باستخدام HTTPS للـ webhooks');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
};

// Integration health score calculator
export const calculateIntegrationHealth = (integration: IntegrationData): {
  score: number; // 0-100
  status: 'healthy' | 'degraded' | 'unhealthy';
  factors: Array<{
    name: string;
    score: number;
    weight: number;
  }>;
} => {
  const factors = [
    {
      name: 'connection_status',
      score: integration.credentialsStatus === 'connected' ? 100 : 
             integration.credentialsStatus === 'error' ? 0 : 50,
      weight: 30,
    },
    {
      name: 'success_rate',
      score: integration.metrics.successRate,
      weight: 25,
    },
    {
      name: 'response_time',
      score: integration.metrics.averageResponseTime > 5000 ? 0 :
             integration.metrics.averageResponseTime > 2000 ? 50 : 100,
      weight: 20,
    },
    {
      name: 'error_count',
      score: integration.metrics.errorCount > 10 ? 0 :
             integration.metrics.errorCount > 5 ? 50 : 100,
      weight: 15,
    },
    {
      name: 'last_sync',
      score: !integration.lastSyncAt ? 50 :
             new Date(integration.lastSyncAt) < new Date(Date.now() - 24 * 60 * 60 * 1000) ? 30 :
             new Date(integration.lastSyncAt) < new Date(Date.now() - 60 * 60 * 1000) ? 70 : 100,
      weight: 10,
    },
  ];

  const weightedScore = factors.reduce((total, factor) => 
    total + (factor.score * factor.weight / 100), 0
  );

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (weightedScore >= 80) status = 'healthy';
  else if (weightedScore >= 50) status = 'degraded';
  else status = 'unhealthy';

  return {
    score: Math.round(weightedScore),
    status,
    factors,
  };
};

// Integration sync estimation helper
export const estimateSyncDuration = (
  integration: IntegrationData,
  recordCount: number
): {
  estimatedMinutes: number;
  estimatedHours: number;
  factors: string[];
} => {
  const factors: string[] = [];
  let baseTime = 1; // base time in minutes

  // Adjust based on response time
  if (integration.metrics.averageResponseTime > 3000) {
    baseTime *= 2;
    factors.push('زمن استجابة بطيء');
  } else if (integration.metrics.averageResponseTime < 500) {
    baseTime *= 0.5;
    factors.push('زمن استجابة سريع');
  }

  // Adjust based on integration type
  const typeMultipliers: Record<string, number> = {
    'api': 1,
    'database': 0.5,
    'webhook': 2,
    'custom': 1.5,
  };
  baseTime *= typeMultipliers[integration.type] || 1;

  // Adjust based on record count
  const recordsPerMinute = integration.metrics.successRate > 90 ? 100 : 50;
  const estimatedMinutes = Math.ceil(recordCount / recordsPerMinute);
  const estimatedHours = Math.ceil(estimatedMinutes / 60);

  if (estimatedMinutes > 60) {
    factors.push('كمية بيانات كبيرة');
  }

  return {
    estimatedMinutes,
    estimatedHours,
    factors,
  };
};

// Credential encryption helper (client-side validation)
export const validateCredentialsFormat = (
  type: string,
  credentials: Record<string, string>
): {
  isValid: boolean;
  requiredFields: string[];
  missingFields: string[];
  invalidFields: string[];
} => {
  const requiredFieldsMap: Record<string, string[]> = {
    'api': ['apiKey'],
    'oauth2': ['clientId', 'clientSecret'],
    'webhook': ['webhookUrl', 'webhookSecret'],
    'database': ['connectionString'],
    'email': ['username', 'password'],
    'custom': [],
  };

  const requiredFields = requiredFieldsMap[type] || [];
  const missingFields: string[] = [];
  const invalidFields: string[] = [];

  // Check required fields
  requiredFields.forEach(field => {
    if (!credentials[field] || credentials[field].trim() === '') {
      missingFields.push(field);
    }
  });

  // Validate field formats
  if (credentials.apiKey && credentials.apiKey.length < 10) {
    invalidFields.push('apiKey');
  }

  if (credentials.webhookUrl && !urlSchema.safeParse(credentials.webhookUrl).success) {
    invalidFields.push('webhookUrl');
  }

  return {
    isValid: missingFields.length === 0 && invalidFields.length === 0,
    requiredFields,
    missingFields,
    invalidFields,
  };
};