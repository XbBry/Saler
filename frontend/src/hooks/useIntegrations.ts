import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  IntegrationError,
  ConnectionError,
  RateLimitError,
  retryManager,
  rateLimitManager,
  PerformanceMonitor,
  HealthChecker,
  TestUtils,
  type ApiResponse,
  type RetryConfig
} from '../lib/integration-utils';

// ===============================
// Types
// ===============================

export interface Integration {
  id: string;
  name: string;
  type: 'crm' | 'email' | 'sms' | 'webhook' | 'api' | 'database';
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

export interface UseIntegrationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableMetrics?: boolean;
  enableHealthChecks?: boolean;
  retryConfig?: RetryConfig;
}

export interface IntegrationFilters {
  type?: Integration['type'];
  status?: Integration['status'];
  search?: string;
}

// ===============================
// Custom Hook
// ===============================

export function useIntegrations(options: UseIntegrationsOptions = {}) {
  const queryClient = useQueryClient();
  const operationsRef = useRef<Map<string, IntegrationOperation>>(new Map());
  
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    enableMetrics = true,
    enableHealthChecks = true,
    retryConfig: customRetryConfig
  } = options;

  // State
  const [filters, setFilters] = useState<IntegrationFilters>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);

  // ===============================
  // API Functions
  // ===============================

  const fetchIntegrations = useCallback(async (): Promise<Integration[]> => {
    try {
      const response = await fetch('/api/integrations', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new IntegrationError(
          `Failed to fetch integrations: ${response.statusText}`,
          'FETCH_ERROR',
          response.status
        );
      }

      const data = await response.json();
      return data.integrations || [];
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw error;
    }
  }, []);

  const createIntegration = useCallback(async (integration: Partial<Integration>): Promise<Integration> => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(integration),
      });

      if (!response.ok) {
        throw new IntegrationError(
          `Failed to create integration: ${response.statusText}`,
          'CREATE_ERROR',
          response.status
        );
      }

      const data = await response.json();
      return data.integration;
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    }
  }, []);

  const updateIntegration = useCallback(async (id: string, updates: Partial<Integration>): Promise<Integration> => {
    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new IntegrationError(
          `Failed to update integration: ${response.statusText}`,
          'UPDATE_ERROR',
          response.status
        );
      }

      const data = await response.json();
      return data.integration;
    } catch (error) {
      console.error('Error updating integration:', error);
      throw error;
    }
  }, []);

  const deleteIntegration = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new IntegrationError(
          `Failed to delete integration: ${response.statusText}`,
          'DELETE_ERROR',
          response.status
        );
      }
    } catch (error) {
      console.error('Error deleting integration:', error);
      throw error;
    }
  }, []);

  const testConnection = useCallback(async (id: string): Promise<boolean> => {
    try {
      const startTime = Date.now();
      
      const result = await retryManager.executeWithRetry(
        async () => {
          const response = await fetch(`/api/integrations/${id}/test`, {
            method: 'POST',
          });

          if (!response.ok) {
            throw new ConnectionError(`Connection test failed: ${response.statusText}`);
          }

          const data = await response.json();
          return data.success;
        },
        customRetryConfig || {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          jitter: true
        },
        `connection-test-${id}`
      );

      if (enableMetrics) {
        PerformanceMonitor.recordMetric({
          operation: 'connection-test',
          duration: Date.now() - startTime,
          timestamp: Date.now(),
          status: 'success',
          metadata: { integrationId: id }
        });
      }

      return result;
    } catch (error) {
      if (enableMetrics) {
        PerformanceMonitor.recordMetric({
          operation: 'connection-test',
          duration: Date.now() - startTime,
          timestamp: Date.now(),
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: { integrationId: id }
        });
      }
      
      throw error;
    }
  }, [customRetryConfig, enableMetrics]);

  const syncIntegration = useCallback(async (id: string, options?: { 
    direction?: 'pull' | 'push' | 'both';
    dataTypes?: string[];
  }): Promise<IntegrationOperation> => {
    const operationId = `sync-${id}-${Date.now()}`;
    const operation: IntegrationOperation = {
      id: operationId,
      integrationId: id,
      type: 'sync',
      status: 'pending',
      progress: 0,
      retryCount: 0,
      startedAt: new Date().toISOString(),
    };

    operationsRef.current.set(operationId, operation);

    try {
      operation.status = 'running';
      setProgress(operationId, 10);

      // Test connection first
      await testConnection(id);
      setProgress(operationId, 30);

      // Perform sync
      const result = await retryManager.executeWithRetry(
        async () => {
          const response = await fetch(`/api/integrations/${id}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(options || {}),
          });

          if (!response.ok) {
            throw new IntegrationError(
              `Sync failed: ${response.statusText}`,
              'SYNC_ERROR',
              response.status
            );
          }

          return await response.json();
        },
        customRetryConfig || {
          maxAttempts: 3,
          initialDelay: 2000,
          maxDelay: 30000,
          backoffMultiplier: 2,
          jitter: true
        },
        `sync-${id}`
      );

      setProgress(operationId, 80);

      // Update integration
      await queryClient.invalidateQueries({ queryKey: ['integrations'] });

      operation.status = 'completed';
      operation.progress = 100;
      operation.result = result;
      operation.completedAt = new Date().toISOString();

      toast.success('Integration synced successfully');
      
      return operation;
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      operation.completedAt = new Date().toISOString();

      toast.error(`Sync failed: ${operation.error}`);
      throw error;
    }
  }, [testConnection, customRetryConfig, queryClient]);

  const pushData = useCallback(async (
    id: string, 
    data: any, 
    endpoint?: string
  ): Promise<any> => {
    return await retryManager.executeWithRetry(
      async () => {
        const response = await fetch(`/api/integrations/${id}/push${endpoint ? `/${endpoint}` : ''}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new IntegrationError(
            `Push failed: ${response.statusText}`,
            'PUSH_ERROR',
            response.status
          );
        }

        return await response.json();
      },
      customRetryConfig || {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 15000,
        backoffMultiplier: 2,
        jitter: true
      },
      `push-${id}`
    );
  }, [customRetryConfig]);

  const pullData = useCallback(async (
    id: string, 
    endpoint?: string,
    params?: Record<string, any>
  ): Promise<any> => {
    return await retryManager.executeWithRetry(
      async () => {
        const searchParams = new URLSearchParams(params);
        const queryString = searchParams.toString();
        
        const response = await fetch(
          `/api/integrations/${id}/pull${endpoint ? `/${endpoint}` : ''}${queryString ? `?${queryString}` : ''}`
        );

        if (!response.ok) {
          throw new IntegrationError(
            `Pull failed: ${response.statusText}`,
            'PULL_ERROR',
            response.status
          );
        }

        return await response.json();
      },
      customRetryConfig || {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 15000,
        backoffMultiplier: 2,
        jitter: true
      },
      `pull-${id}`
    );
  }, [customRetryConfig]);

  const cancelOperation = useCallback((operationId: string): void => {
    const operation = operationsRef.current.get(operationId);
    if (operation && operation.status === 'running') {
      operation.status = 'cancelled';
      operation.completedAt = new Date().toISOString();
      toast.info('Operation cancelled');
    }
  }, []);

  const retryOperation = useCallback(async (operationId: string): Promise<IntegrationOperation> => {
    const operation = operationsRef.current.get(operationId);
    if (!operation) {
      throw new Error('Operation not found');
    }

    operation.retryCount++;
    operation.status = 'pending';
    operation.error = undefined;

    try {
      switch (operation.type) {
        case 'sync':
          return await syncIntegration(operation.integrationId);
        case 'push':
          if (operation.data) {
            const result = await pushData(operation.integrationId, operation.data);
            operation.result = result;
            operation.status = 'completed';
            return operation;
          }
          break;
        case 'pull':
          const data = await pullData(operation.integrationId);
          operation.result = data;
          operation.status = 'completed';
          return operation;
      }
      
      throw new Error('Unsupported operation type');
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      operation.completedAt = new Date().toISOString();
      throw error;
    }
  }, [syncIntegration, pushData, pullData]);

  // ===============================
  // Helpers
  // ===============================

  const setProgress = useCallback((operationId: string, progress: number): void => {
    const operation = operationsRef.current.get(operationId);
    if (operation) {
      operation.progress = progress;
    }
  }, []);

  const getFilteredIntegrations = useCallback((integrations: Integration[]): Integration[] => {
    return integrations.filter(integration => {
      if (filters.type && integration.type !== filters.type) return false;
      if (filters.status && integration.status !== filters.status) return false;
      if (filters.search && !integration.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [filters]);

  const getIntegrationStats = useCallback((integrations: Integration[]): IntegrationStats => {
    const totalIntegrations = integrations.length;
    const activeIntegrations = integrations.filter(i => i.status === 'connected').length;
    const failedIntegrations = integrations.filter(i => i.status === 'error').length;
    
    const allOperations = Array.from(operationsRef.current.values());
    const totalOperations = allOperations.length;
    const successfulOperations = allOperations.filter(o => o.status === 'completed').length;
    const failedOperations = allOperations.filter(o => o.status === 'failed').length;
    
    const avgResponseTime = integrations.reduce((sum, i) => sum + i.metrics.averageResponseTime, 0) / totalIntegrations;
    const successRate = totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0;

    return {
      totalIntegrations,
      activeIntegrations,
      failedIntegrations,
      totalOperations,
      successfulOperations,
      failedOperations,
      averageResponseTime: avgResponseTime,
      successRate
    };
  }, []);

  // ===============================
  // Query Management
  // ===============================

  const integrationsQuery = useQuery({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    retry: (failureCount, error) => {
      if (error instanceof RateLimitError) {
        return false; // Don't retry rate limit errors
      }
      return failureCount < 3;
    },
  });

  const createMutation = useMutation({
    mutationFn: createIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Integration> }) =>
      updateIntegration(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // ===============================
  // Auto Refresh & Health Checks
  // ===============================

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, queryClient]);

  useEffect(() => {
    if (!enableHealthChecks) return;

    const interval = setInterval(async () => {
      try {
        const isHealthy = await HealthChecker.isHealthy();
        if (!isHealthy) {
          console.warn('Some integrations are unhealthy');
          // Could trigger notifications or auto-healing here
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [enableHealthChecks]);

  // ===============================
  // Computed Values
  // ===============================

  const filteredIntegrations = useMemo(() => {
    return integrationsQuery.data ? getFilteredIntegrations(integrationsQuery.data) : [];
  }, [integrationsQuery.data, getFilteredIntegrations]);

  const stats = useMemo(() => {
    return integrationsQuery.data ? getIntegrationStats(integrationsQuery.data) : null;
  }, [integrationsQuery.data, getIntegrationStats]);

  const activeOperations = useMemo(() => {
    return Array.from(operationsRef.current.values()).filter(
      op => op.status === 'pending' || op.status === 'running'
    );
  }, []);

  // ===============================
  // Return Value
  // ===============================

  return {
    // Data
    integrations: filteredIntegrations,
    allIntegrations: integrationsQuery.data || [],
    stats,
    operations: Array.from(operationsRef.current.values()),
    activeOperations,
    
    // Loading states
    isLoading: integrationsQuery.isLoading,
    isError: integrationsQuery.isError,
    error: integrationsQuery.error,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Filters
    filters,
    setFilters,
    
    // Connection
    isConnecting,
    connectionProgress,
    
    // Actions
    createIntegration: createMutation.mutate,
    updateIntegration: (id: string, updates: Partial<Integration>) => 
      updateMutation.mutate({ id, updates }),
    deleteIntegration: deleteMutation.mutate,
    testConnection,
    syncIntegration,
    pushData,
    pullData,
    cancelOperation,
    retryOperation,
    
    // Utilities
    refresh: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
    clearError: () => queryClient.resetQueries({ queryKey: ['integrations'] }),
    
    // Development helpers
    ...(process.env.NODE_ENV === 'development' && {
      mockError: TestUtils.createMockError,
      simulateDelay: TestUtils.simulateNetworkDelay,
    }),
  };
}

// ===============================
// Specialized Hooks
// ===============================

export function useIntegration(id: string) {
  return useIntegrations().allIntegrations.find(integration => integration.id === id);
}

export function useIntegrationOperations(integrationId?: string) {
  const { operations } = useIntegrations();
  return integrationId 
    ? operations.filter(op => op.integrationId === integrationId)
    : operations;
}

export function useIntegrationStats() {
  return useIntegrations().stats;
}