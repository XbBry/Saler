import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  IntegrationError,
  ConnectionError,
  retryManager,
  type ApiResponse
} from '../lib/integration-utils';

// ===============================
// Types
// ===============================

export interface ShopifyConfig {
  apiKey: string;
  storeUrl: string;
  privateAppName: string;
  permissions: string[];
  webhooks: {
    enabled: boolean;
    events: string[];
    secret: string;
  };
  syncSettings: {
    autoSync: boolean;
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    conflictResolution: 'shopify' | 'saler' | 'manual';
    importProducts: boolean;
    importCustomers: boolean;
    importOrders: boolean;
  };
  fieldMapping: {
    customer: Record<string, string>;
    order: Record<string, string>;
    product: Record<string, string>;
  };
}

export interface ShopifyConnection {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastTestAt?: string;
  error?: string;
  storeInfo?: {
    name: string;
    currency: string;
    timezone: string;
    country: string;
  };
}

export interface ShopifySyncStatus {
  lastSync: string;
  syncProgress: number;
  activeSyncs: number;
  failedSyncs: number;
  totalRecords: number;
  syncHistory: Array<{
    id: string;
    type: 'products' | 'customers' | 'orders';
    status: 'success' | 'failed' | 'in_progress';
    startedAt: string;
    completedAt?: string;
    recordsProcessed: number;
    error?: string;
  }>;
}

export interface ShopifyWebhookConfig {
  orders: string;
  customers: string;
  products: string;
}

export interface UseShopifyIntegrationOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ===============================
// Default Configurations
// ===============================

export const defaultShopifyConfig: ShopifyConfig = {
  apiKey: '',
  storeUrl: '',
  privateAppName: 'Saler Integration',
  permissions: ['read_products', 'read_orders', 'read_customers', 'write_orders'],
  webhooks: {
    enabled: true,
    events: [
      'orders/create', 
      'orders/updated', 
      'customers/create', 
      'customers/update', 
      'products/create', 
      'products/update'
    ],
    secret: ''
  },
  syncSettings: {
    autoSync: true,
    frequency: 'realtime',
    conflictResolution: 'shopify',
    importProducts: true,
    importCustomers: true,
    importOrders: true
  },
  fieldMapping: {
    customer: {
      'first_name': 'first_name',
      'last_name': 'last_name',
      'email': 'email',
      'phone': 'phone',
      'total_spent': 'score'
    },
    order: {
      'name': 'source',
      'total_price': 'score',
      'financial_status': 'status',
      'fulfillment_status': 'status'
    },
    product: {
      'title': 'name',
      'vendor': 'source',
      'product_type': 'tags'
    }
  }
};

// ===============================
// Custom Hook
// ===============================

export function useShopifyIntegration(options: UseShopifyIntegrationOptions = {}) {
  const queryClient = useQueryClient();
  const {
    autoRefresh = true,
    refreshInterval = 30000
  } = options;

  // State
  const [config, setConfig] = useState<ShopifyConfig>(defaultShopifyConfig);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ShopifyConnection['status']>('disconnected');

  // ===============================
  // API Functions
  // ===============================

  const fetchShopifyConfig = useCallback(async (): Promise<ShopifyConfig> => {
    try {
      const response = await fetch('/api/integrations/shopify/config');
      
      if (!response.ok) {
        throw new IntegrationError(
          `Failed to fetch Shopify config: ${response.statusText}`,
          'FETCH_CONFIG_ERROR',
          response.status
        );
      }

      const data = await response.json();
      return data.config || defaultShopifyConfig;
    } catch (error) {
      console.error('Error fetching Shopify config:', error);
      return defaultShopifyConfig;
    }
  }, []);

  const saveShopifyConfig = useCallback(async (newConfig: ShopifyConfig): Promise<ShopifyConfig> => {
    try {
      const response = await fetch('/api/integrations/shopify/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: newConfig }),
      });

      if (!response.ok) {
        throw new IntegrationError(
          `Failed to save Shopify config: ${response.statusText}`,
          'SAVE_CONFIG_ERROR',
          response.status
        );
      }

      const data = await response.json();
      return data.config;
    } catch (error) {
      console.error('Error saving Shopify config:', error);
      throw error;
    }
  }, []);

  const testConnection = useCallback(async (configData: ShopifyConfig): Promise<ShopifyConnection> => {
    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      const result = await retryManager.executeWithRetry(
        async () => {
          const response = await fetch('/api/integrations/shopify/test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(configData),
          });

          if (!response.ok) {
            throw new ConnectionError(`Connection test failed: ${response.statusText}`);
          }

          return await response.json();
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          jitter: true
        },
        'shopify-connection-test'
      );

      const connection: ShopifyConnection = {
        status: 'connected',
        lastTestAt: new Date().toISOString(),
        storeInfo: result.storeInfo
      };

      setConnectionStatus('connected');
      toast.success('تم الاتصال بـ Shopify بنجاح');
      return connection;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل الاتصال بـ Shopify';
      const connection: ShopifyConnection = {
        status: 'error',
        lastTestAt: new Date().toISOString(),
        error: errorMessage
      };

      setConnectionStatus('error');
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const getSyncStatus = useCallback(async (): Promise<ShopifySyncStatus> => {
    try {
      const response = await fetch('/api/integrations/shopify/sync-status');
      
      if (!response.ok) {
        throw new IntegrationError(
          `Failed to fetch sync status: ${response.statusText}`,
          'FETCH_SYNC_ERROR',
          response.status
        );
      }

      const data = await response.json();
      return data.syncStatus;
    } catch (error) {
      console.error('Error fetching sync status:', error);
      // Return default sync status
      return {
        lastSync: 'لم يتم المزامنة بعد',
        syncProgress: 0,
        activeSyncs: 0,
        failedSyncs: 0,
        totalRecords: 0,
        syncHistory: []
      };
    }
  }, []);

  const triggerSync = useCallback(async (dataTypes: string[] = ['products', 'customers', 'orders']): Promise<void> => {
    try {
      const response = await fetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataTypes }),
      });

      if (!response.ok) {
        throw new IntegrationError(
          `Sync failed: ${response.statusText}`,
          'SYNC_ERROR',
          response.status
        );
      }

      toast.success('بدء عملية المزامنة');
      // Invalidate sync status to refresh
      queryClient.invalidateQueries({ queryKey: ['shopify-sync-status'] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في بدء المزامنة';
      toast.error(errorMessage);
      throw error;
    }
  }, [queryClient]);

  const getWebhookUrls = useCallback((): ShopifyWebhookConfig => {
    // Generate webhook URLs based on current domain
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://saler.app';
    
    return {
      orders: `${baseUrl}/api/integrations/shopify/webhooks/orders`,
      customers: `${baseUrl}/api/integrations/shopify/webhooks/customers`,
      products: `${baseUrl}/api/integrations/shopify/webhooks/products`
    };
  }, []);

  // ===============================
  // Query Management
  // ===============================

  const configQuery = useQuery({
    queryKey: ['shopify-config'],
    queryFn: fetchShopifyConfig,
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
  });

  const syncStatusQuery = useQuery({
    queryKey: ['shopify-sync-status'],
    queryFn: getSyncStatus,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
    enabled: connectionStatus === 'connected',
  });

  // ===============================
  // Mutations
  // ===============================

  const saveConfigMutation = useMutation({
    mutationFn: saveShopifyConfig,
    onSuccess: (newConfig) => {
      setConfig(newConfig);
      queryClient.setQueryData(['shopify-config'], newConfig);
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'فشل في حفظ الإعدادات';
      toast.error(errorMessage);
    },
  });

  // ===============================
  // Auto Refresh
  // ===============================

  if (autoRefresh) {
    // Auto refresh config when component mounts
    useQuery({
      queryKey: ['shopify-config'],
      queryFn: fetchShopifyConfig,
      refetchInterval: refreshInterval,
    });

    // Auto refresh sync status when connected
    useQuery({
      queryKey: ['shopify-sync-status'],
      queryFn: getSyncStatus,
      refetchInterval: refreshInterval,
      enabled: connectionStatus === 'connected',
    });
  }

  // ===============================
  // Computed Values
  // ===============================

  const webhookUrls = useMemo(() => getWebhookUrls(), [getWebhookUrls]);

  const isConfigValid = useMemo(() => {
    return config.apiKey.trim() !== '' && config.storeUrl.trim() !== '';
  }, [config]);

  // ===============================
  // Return Value
  // ===============================

  return {
    // Config data
    config,
    setConfig,
    webhookUrls,
    
    // Connection status
    connectionStatus,
    isConnecting,
    
    // Sync status
    syncStatus: syncStatusQuery.data,
    isLoadingSyncStatus: syncStatusQuery.isLoading,
    
    // API data
    isLoadingConfig: configQuery.isLoading,
    isError: configQuery.isError,
    error: configQuery.error,
    
    // Actions
    testConnection,
    saveConfig: saveConfigMutation.mutate,
    triggerSync,
    
    // Loading states
    isSaving: saveConfigMutation.isPending,
    
    // Utils
    isConfigValid,
    refreshConfig: () => queryClient.invalidateQueries({ queryKey: ['shopify-config'] }),
    refreshSyncStatus: () => queryClient.invalidateQueries({ queryKey: ['shopify-sync-status'] }),
  };
}

// ===============================
// Specialized Hooks
// ===============================

export function useShopifyConfig() {
  const { config, setConfig, isLoadingConfig, isError, error, saveConfig } = useShopifyIntegration();
  return { config, setConfig, isLoadingConfig, isError, error, saveConfig };
}

export function useShopifyConnection() {
  const { connectionStatus, isConnecting, testConnection } = useShopifyIntegration();
  return { connectionStatus, isConnecting, testConnection };
}

export function useShopifySync() {
  const { syncStatus, triggerSync, isLoadingSyncStatus, refreshSyncStatus } = useShopifyIntegration();
  return { syncStatus, triggerSync, isLoadingSyncStatus, refreshSyncStatus };
}