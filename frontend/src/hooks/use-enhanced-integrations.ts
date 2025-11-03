import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { integrationsQueryApi } from '../lib/query-api';
import { queryKeys } from '../lib/query-keys';
import { 
  createMutation,
  createCreateMutation,
  createUpdateMutation,
  createDeleteMutation,
  createStatusMutation,
  createOptimisticUpdater 
} from '../lib/mutation-helpers';
import { Integration, IntegrationConfig } from '../types';

// ===============================================
// Enhanced Integrations Hook
// ===============================================

/**
 * Enhanced Integrations Hook with React Query integration
 */
export const useEnhancedIntegrations = () => {
  const queryClient = useQueryClient();

  // ==================== QUERIES ====================
  
  /**
   * Get all integrations with caching
   */
  const {
    data: integrations,
    isLoading: isLoadingIntegrations,
    error: integrationsError,
    refetch: refetchIntegrations,
  } = useQuery({
    queryKey: queryKeys.integrations.list(),
    queryFn: () => integrationsQueryApi.getIntegrations(),
    staleTime: 1000 * 60 * 10, // 10 minutes - integrations don't change frequently
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 3,
  });

  /**
   * Get integration providers
   */
  const {
    data: providers,
    isLoading: isLoadingProviders,
  } = useQuery({
    queryKey: queryKeys.integrations.providers(),
    queryFn: () => integrationsQueryApi.getProviders(),
    staleTime: 1000 * 60 * 60, // 1 hour - providers rarely change
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  /**
   * Get single integration
   */
  const useIntegration = (id: string) => {
    return useQuery({
      queryKey: queryKeys.integrations.detail(id),
      queryFn: () => integrationsQueryApi.getIntegration(id),
      enabled: !!id,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    });
  };

  /**
   * Get integration logs
   */
  const useIntegrationLogs = (integrationId: string, options?: {
    limit?: number;
    offset?: number;
    level?: 'info' | 'warning' | 'error';
  }) => {
    return useQuery({
      queryKey: queryKeys.integrations.logs(integrationId),
      queryFn: () => integrationsQueryApi.getIntegrationLogs(integrationId, options),
      enabled: !!integrationId,
      staleTime: 1000 * 60 * 2, // 2 minutes for logs
      gcTime: 1000 * 60 * 15, // 15 minutes
      refetchInterval: 30000, // 30 seconds for recent logs
    });
  };

  /**
   * Get integration webhooks
   */
  const useIntegrationWebhooks = (integrationId: string) => {
    return useQuery({
      queryKey: queryKeys.integrations.webhooks(integrationId),
      queryFn: () => integrationsQueryApi.getIntegrationWebhooks(integrationId),
      enabled: !!integrationId,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    });
  };

  // ==================== MUTATIONS ====================
  
  /**
   * Create integration
   */
  const createIntegrationMutation = useCreateMutation(
    integrationsQueryApi.createIntegration,
    queryKeys.integrations.list(),
    () => integrations,
    {
      onSuccessMessage: 'تم إنشاء التكامل بنجاح',
      onErrorMessage: 'فشل في إنشاء التكامل',
    }
  );

  /**
   * Update integration
   */
  const updateIntegrationMutation = useUpdateMutation(
    ({ id, ...data }: { id: string } & Partial<IntegrationConfig>) =>
      integrationsQueryApi.updateIntegration(id, data),
    queryKeys.integrations.list(),
    () => integrations,
    {
      onSuccessMessage: 'تم تحديث التكامل بنجاح',
      onErrorMessage: 'فشل في تحديث التكامل',
    }
  );

  /**
   * Delete integration
   */
  const deleteIntegrationMutation = useDeleteMutation(
    (id: string) => integrationsQueryApi.deleteIntegration(id),
    queryKeys.integrations.list(),
    () => integrations,
    {
      onSuccessMessage: 'تم حذف التكامل بنجاح',
      onErrorMessage: 'فشل في حذف التكامل',
    }
  );

  /**
   * Activate/Deactivate integration
   */
  const toggleIntegrationMutation = useStatusMutation(
    ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
      if (status === 'active') {
        return integrationsQueryApi.activateIntegration(id);
      } else {
        return integrationsQueryApi.deactivateIntegration(id);
      }
    },
    queryKeys.integrations.list(),
    () => integrations
  );

  /**
   * Test integration
   */
  const testIntegrationMutation = useMutation({
    mutationFn: ({ id, testData }: { id: string; testData?: any }) =>
      integrationsQueryApi.testIntegration(id, testData),
    onSuccess: (data) => {
      if (data.success) {
        // Update integration status cache
        queryClient.setQueryData(queryKeys.integrations.detail(data.integrationId), (old: any) =>
          old ? { ...old, status: 'active', lastTested: new Date().toISOString() } : old
        );
      }
    },
  });

  /**
   * Sync integration data
   */
  const syncIntegrationMutation = useMutation({
    mutationFn: (id: string) => integrationsQueryApi.syncIntegration(id),
    onSuccess: () => {
      // Invalidate logs after sync
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.logs('').slice(0, -1) });
    },
  });

  // ==================== ACTION FUNCTIONS ====================
  
  const createIntegration = useCallback(async (config: IntegrationConfig) => {
    return await createIntegrationMutation.mutateAsync(config);
  }, [createIntegrationMutation]);

  const updateIntegration = useCallback(async (id: string, config: Partial<IntegrationConfig>) => {
    return await updateIntegrationMutation.mutateAsync({ id, ...config });
  }, [updateIntegrationMutation]);

  const deleteIntegration = useCallback(async (id: string) => {
    return await deleteIntegrationMutation.mutateAsync(id);
  }, [deleteIntegrationMutation]);

  const toggleIntegrationStatus = useCallback(async (id: string, status: 'active' | 'inactive') => {
    return await toggleIntegrationMutation.mutateAsync({ id, status });
  }, [toggleIntegrationMutation]);

  const testIntegration = useCallback(async (id: string, testData?: any) => {
    return await testIntegrationMutation.mutateAsync({ id, testData });
  }, [testIntegrationMutation]);

  const syncIntegration = useCallback(async (id: string) => {
    return await syncIntegrationMutation.mutateAsync(id);
  }, [syncIntegrationMutation]);

  // ==================== COMPUTED VALUES ====================
  
  /**
   * Get active integrations
   */
  const activeIntegrations = useMemo(() => {
    return integrations?.filter(integration => integration.status === 'active') || [];
  }, [integrations]);

  /**
   * Get integrations by type
   */
  const integrationsByType = useMemo(() => {
    if (!integrations) return {};
    
    return integrations.reduce((acc, integration) => {
      const type = integration.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(integration);
      return acc;
    }, {} as Record<string, Integration[]>);
  }, [integrations]);

  /**
   * Get integration statistics
   */
  const integrationStats = useMemo(() => {
    if (!integrations) return {
      total: 0,
      active: 0,
      inactive: 0,
      byType: {},
      successRate: 0,
    };
    
    const activeCount = integrations.filter(i => i.status === 'active').length;
    const byType = integrations.reduce((acc, integration) => {
      acc[integration.type] = (acc[integration.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate success rate from recent logs
    const successLogs = integrations
      .flatMap(i => i.recentLogs || [])
      .filter(log => log.level === 'info').length;
    const totalLogs = integrations
      .flatMap(i => i.recentLogs || [])
      .length;
    
    return {
      total: integrations.length,
      active: activeCount,
      inactive: integrations.length - activeCount,
      byType,
      successRate: totalLogs > 0 ? (successLogs / totalLogs) * 100 : 100,
    };
  }, [integrations]);

  /**
   * Get providers by category
   */
  const providersByCategory = useMemo(() => {
    if (!providers) return {};
    
    return providers.reduce((acc, provider) => {
      const category = provider.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(provider);
      return acc;
    }, {} as Record<string, any[]>);
  }, [providers]);

  // ==================== CACHE MANAGEMENT ====================
  
  /**
   * Clear integration cache
   */
  const clearIntegrationCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: queryKeys.integrations.all });
  }, [queryClient]);

  /**
   * Refresh specific integration
   */
  const refreshIntegration = useCallback(async (id: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.integrations.detail(id) });
  }, [queryClient]);

  /**
   * Prefetch integration data
   */
  const prefetchIntegrations = useCallback(async () => {
    if (!queryClient.getQueryData(queryKeys.integrations.list())) {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.integrations.list(),
        queryFn: () => integrationsQueryApi.getIntegrations(),
        staleTime: 1000 * 60 * 10,
      });
    }
  }, [queryClient]);

  // ==================== RETURN ====================
  
  return {
    // Data
    integrations,
    activeIntegrations,
    integrationsByType,
    providers,
    providersByCategory,
    integrationStats,
    
    // State
    isLoadingIntegrations,
    isLoadingProviders,
    integrationsError,
    
    // Actions
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegrationStatus,
    testIntegration,
    syncIntegration,
    
    // Cache management
    clearIntegrationCache,
    refreshIntegration,
    prefetchIntegrations,
    refetchIntegrations,
    
    // Individual hooks
    useIntegration,
    useIntegrationLogs,
    useIntegrationWebhooks,
  };
};

// ===============================================
// Integration Management Hook
// ===============================================

/**
 * Hook for managing specific integration
 */
export const useIntegrationManager = (integrationId: string) => {
  const queryClient = useQueryClient();
  const {
    useIntegration,
    useIntegrationLogs,
    useIntegrationWebhooks,
    testIntegration,
    updateIntegration,
    syncIntegration,
  } = useEnhancedIntegrations();

  // Get integration details
  const {
    data: integration,
    isLoading: isLoadingIntegration,
    error: integrationError,
    refetch: refetchIntegration,
  } = useIntegration(integrationId);

  // Get logs
  const {
    data: logs,
    isLoading: isLoadingLogs,
    error: logsError,
  } = useIntegrationLogs(integrationId, {
    limit: 50,
  });

  // Get webhooks
  const {
    data: webhooks,
    isLoading: isLoadingWebhooks,
  } = useIntegrationWebhooks(integrationId);

  // Update integration mutation
  const updateIntegrationMutation = useMutation({
    mutationFn: (data: Partial<IntegrationConfig>) => 
      updateIntegration(integrationId, data),
    onSuccess: () => {
      refetchIntegration();
    },
  });

  // Test integration mutation
  const testIntegrationMutation = useMutation({
    mutationFn: (testData?: any) => testIntegration(integrationId, testData),
  });

  // Sync integration mutation
  const syncIntegrationMutation = useMutation({
    mutationFn: () => syncIntegration(integrationId),
    onSuccess: () => {
      refetchIntegration();
    },
  });

  return {
    // Data
    integration,
    logs,
    webhooks,
    
    // State
    isLoadingIntegration,
    isLoadingLogs,
    isLoadingWebhooks,
    integrationError,
    logsError,
    
    // Actions
    updateIntegration: updateIntegrationMutation.mutate,
    updateIntegrationAsync: updateIntegrationMutation.mutateAsync,
    testIntegration: testIntegrationMutation.mutate,
    testIntegrationAsync: testIntegrationMutation.mutateAsync,
    syncIntegration: syncIntegrationMutation.mutate,
    syncIntegrationAsync: syncIntegrationMutation.mutateAsync,
    
    // Mutation state
    isUpdating: updateIntegrationMutation.isPending,
    isTesting: testIntegrationMutation.isPending,
    isSyncing: syncIntegrationMutation.isPending,
    updateError: updateIntegrationMutation.error,
    testError: testIntegrationMutation.error,
    syncError: syncIntegrationMutation.error,
    
    // Utils
    refetch: refetchIntegration,
    refreshLogs: () => queryClient.invalidateQueries({ 
      queryKey: queryKeys.integrations.logs(integrationId) 
    }),
  };
};

// ===============================================
// Integration Status Hook
// ===============================================

/**
 * Hook for monitoring integration status
 */
export const useIntegrationStatus = (integrationId: string) => {
  const { refreshIntegration } = useEnhancedIntegrations();
  
  const {
    data: integration,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.integrations.detail(integrationId), 'status'],
    queryFn: () => refreshIntegration(integrationId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 30000, // 30 seconds
  });

  const isActive = integration?.status === 'active';
  const lastSynced = integration?.lastSynced;
  const isHealthy = integration?.health === 'healthy';
  const isConnecting = integration?.connectionStatus === 'connecting';

  return {
    integration,
    isActive,
    isHealthy,
    isConnecting,
    lastSynced,
    isLoading,
    error,
    refetch,
  };
};

// ===============================================
// Integration Logs Hook
// ===============================================

/**
 * Hook for managing integration logs with filtering
 */
export const useIntegrationLogsManager = (integrationId: string) => {
  const { useIntegrationLogs } = useEnhancedIntegrations();
  
  const [filters, setFilters] = useState<{
    level?: 'info' | 'warning' | 'error';
    startDate?: string;
    endDate?: string;
    search?: string;
  }>({});

  const {
    data: logs,
    isLoading,
    error,
    refetch,
  } = useIntegrationLogs(integrationId, {
    level: filters.level,
    limit: 100,
  });

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    return logs.filter(log => {
      if (filters.startDate && new Date(log.timestamp) < new Date(filters.startDate)) {
        return false;
      }
      if (filters.endDate && new Date(log.timestamp) > new Date(filters.endDate)) {
        return false;
      }
      if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [logs, filters]);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    logs: filteredLogs,
    rawLogs: logs,
    isLoading,
    error,
    refetch,
    filters,
    setFilters,
    clearFilters,
  };
};

// Export all hooks
export default useEnhancedIntegrations;
