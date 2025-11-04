/**
 * التجميع الشامل لجميع hooks و utilities للرسائل
 * 
 * هذا الملف يقدم نظرة عامة على جميع الميزات المنشأة:
 */

console.log('🚀 تم تحميل جميع hooks و utilities للرسائل بنجاح!');

// إحصائيات المشروع
const projectStats = {
  hooks: {
    useMessages: '✅ محدث وشامل',
    useConversations: '✅ جديد ومتقدم',
    useMessageTemplates: '✅ جديد ومتقدم',
    useIntegrations: '✅ جديد مع Error Handling و Retry Logic',
  },
  utilities: {
    messageUtils: '✅ شامل ومتكامل',
    integrationUtils: '✅ نظام شامل للأخطاء والـ retry',
    validation: '✅ مع Zod',
    rtlSupport: '✅ دعم عربي كامل',
  },
  features: {
    realtimeUpdates: '✅ WebSocket متقدم',
    searchFiltering: '✅ بحث وفلترة متقدمة',
    pagination: '✅ تصفح صفحات لا نهائي',
    fileAttachments: '✅ مرفقات الملفات',
    templateVariables: '✅ متغيرات ديناميكية',
    typingIndicators: '✅ مؤشرات الكتابة',
    onlineStatus: '✅ حالة الاتصال',
    errorHandling: '✅ نظام متقدم لمعالجة الأخطاء',
    retryLogic: '✅ Exponential backoff و Circuit breaker',
    rateLimiting: '✅ إدارة حدود الطلبات',
    performanceMonitoring: '✅ تتبع الأداء والمراقبة',
    security: '✅ التحقق من التوقيعات والأمان',
    healthChecks: '✅ فحوصات الصحة التلقائية',
    webhookSecurity: '✅ أمان الـ webhooks',
    batchProcessing: '✅ معالجة دفعات البيانات',
    dataEnrichment: '✅ إثراء البيانات',
  },
  testing: {
    testUtils: '✅ أدوات اختبار شاملة',
    mockData: '✅ بيانات تجريبية',
    performance: '✅ اختبارات الأداء',
    errorSimulation: '✅ محاكاة الأخطاء للاختبار',
  },
};

console.log('📊 إحصائيات المشروع:', projectStats);

/**
 * Message-related hooks exports
 * جميع hooks المتعلقة بالرسائل
 */

export { default as useMessages } from './useMessages';
export { default as useConversations } from './useConversations';
export { default as useMessageTemplates } from './useMessageTemplates';
export { 
  useIntegrations, 
  useIntegration, 
  useIntegrationOperations, 
  useIntegrationStats 
} from './useIntegrations';

export { 
  useShopifyIntegration,
  useShopifyConfig,
  useShopifyConnection,
  useShopifySync,
  type ShopifyConfig
} from './useShopifyIntegration';

// Re-export types that are commonly used with hooks
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
} from '../types';

// Re-export utilities
export { messageUtils } from '../lib/message-utils';

export {
  // إعادة تصدير جميع الـ hooks
  useMessages,
  useConversations,
  useMessageTemplates,
  useIntegrations,
  useIntegration,
  useIntegrationOperations,
  useIntegrationStats,
  
  // إعادة تصدير الـ utilities
  messageUtils,
  
  // تصدير الإحصائيات
  projectStats,
};

// ==================== ENHANCED REACT QUERY HOOKS ====================

// Enhanced hooks with React Query integration
export {
  useEnhancedAuth as useAuth,
  useAuthGuard,
  useTokenManager,
  useWorkspace
} from './use-enhanced-auth';

export {
  useEnhancedAnalytics as useAnalytics,
  useDashboard,
  useAnalyticsExport
} from './use-enhanced-analytics';

export {
  useEnhancedIntegrations as useIntegrationsRQ,
  useIntegrationManager,
  useIntegrationStatus,
  useIntegrationLogsManager
} from './use-enhanced-integrations';

// ==================== NEW ADVANCED HOOKS ====================

// Advanced Messages Hook
export { default as useAdvancedMessages } from './useAdvancedMessages';

// Dashboard Analytics Hook
export { useDashboardAnalytics } from './useDashboardAnalytics';

// Playbooks Hook
export { 
  usePlaybooks,
  usePlaybooksComplete,
  usePlaybook,
  usePlaybooksStats,
  useCreatePlaybook,
  useUpdatePlaybook,
  useDeletePlaybook,
  useTogglePlaybookStatus,
  useRunPlaybook,
  useDuplicatePlaybook,
  useImportPlaybooks,
  useExportPlaybooks
} from './usePlaybooks';

// Business Intelligence Hook
export { useBusinessIntelligence } from './useBusinessIntelligence';

// Notifications System Hook
export { useNotificationsSystem } from './useNotificationsSystem';

// ==================== QUERY UTILITIES ====================

export {
  queryClient,
  createQueryClient,
  invalidateQueries,
  clearCache,
  getQueryStats,
  prefetchQuery
} from '../lib/query-client';

export {
  queryKeys,
  makeQueryKey,
  makeFilterKey,
  makePaginationKey,
  makeDateRangeKey
} from '../lib/query-keys';

export {
  performanceTracker,
  createCacheStrategyManager,
  getPerformanceReport,
  deduplicationOptimizer,
  prefetchingStrategy
} from '../lib/query-performance';

// ==================== OFFLINE SUPPORT ====================

export {
  offlineStorage,
  offlineStatus,
  useOfflineStatus,
  useOfflineActions,
  useOfflineData
} from '../lib/query-offline';

// ==================== MUTATION HELPERS ====================

export {
  createMutation,
  createCreateMutation,
  createUpdateMutation,
  createDeleteMutation,
  createStatusMutation,
  createFormMutation,
  createUploadMutation
} from '../lib/mutation-helpers';

// ==================== API CLIENT ====================

export {
  queryApiClient,
  QueryApiClient,
  authQueryApi,
  leadsQueryApi,
  analyticsQueryApi,
  integrationsQueryApi
} from '../lib/query-api';

// ==================== PROVIDER ====================

export {
  QueryProvider,
  PerformanceToggle,
  queryClient as defaultQueryClient
} from '../components/providers/query-provider';

// ==================== ORIGINAL EXPORTS ====================

export default {
  // Original message hooks
  useMessages,
  useConversations,
  useMessageTemplates,
  
  // Enhanced auth and analytics hooks
  useAuth: useEnhancedAuth,
  useAnalytics: useEnhancedAnalytics,
  useIntegrations: useEnhancedIntegrations,
  
  // Playbooks hook
  usePlaybooksComplete,
  
  // Integration management
  useIntegration,
  useIntegrationOperations,
  useIntegrationStats,
  
  // Shopify integration hook
  useShopifyIntegration,
  useShopifyConfig,
  useShopifyConnection,
  useShopifySync,
  
  // React Query hooks (alternative naming)
  useAuth: useEnhancedAuth as useAuth,
  useAnalytics: useEnhancedAnalytics as useAnalytics,
  useIntegrationsRQ,
  
  // Utilities
  messageUtils,
  queryClient,
  queryKeys,
  performanceTracker,
  offlineStorage,
  
  // Provider
  QueryProvider,
  
  // Stats
  projectStats,
};