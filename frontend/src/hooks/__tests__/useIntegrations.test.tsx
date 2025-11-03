/**
 * Tests for useIntegrations hook
 * اختبارات لاستخدام التكاملات
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIntegrations } from '../useIntegrations';
import { TestUtils } from '../../lib/integration-utils';

// Create a test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useIntegrations', () => {
  beforeEach(() => {
    // Mock global fetch
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should return empty integrations array initially', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ integrations: [] }),
      });

      const { result } = renderHook(() => useIntegrations(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.integrations).toEqual([]);
      expect(result.current.allIntegrations).toEqual([]);
      expect(result.current.stats).toBeNull();
    });

    it('should handle loading state', () => {
      (fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useIntegrations(), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.integrations).toEqual([]);
    });
  });

  describe('data fetching', () => {
    it('should fetch integrations successfully', async () => {
      const mockIntegrations = [
        {
          id: '1',
          name: 'Test Integration',
          type: 'crm' as const,
          status: 'connected' as const,
          config: {},
          metrics: {
            successRate: 95,
            averageResponseTime: 250,
            totalRequests: 100,
            errorCount: 5,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ integrations: mockIntegrations }),
      });

      const { result } = renderHook(() => useIntegrations(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.allIntegrations).toEqual(mockIntegrations);
      expect(result.current.stats?.totalIntegrations).toBe(1);
      expect(result.current.stats?.activeIntegrations).toBe(1);
    });

    it('should handle fetch error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useIntegrations(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('filtering', () => {
    it('should filter integrations by type', async () => {
      const mockIntegrations = [
        {
          id: '1',
          name: 'CRM Integration',
          type: 'crm' as const,
          status: 'connected' as const,
          config: {},
          metrics: { successRate: 95, averageResponseTime: 250, totalRequests: 100, errorCount: 5 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Email Integration',
          type: 'email' as const,
          status: 'connected' as const,
          config: {},
          metrics: { successRate: 90, averageResponseTime: 300, totalRequests: 50, errorCount: 5 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ integrations: mockIntegrations }),
      });

      const { result } = renderHook(() => useIntegrations(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Apply filter
      result.current.setFilters({ type: 'crm' });

      expect(result.current.integrations).toHaveLength(1);
      expect(result.current.integrations[0].type).toBe('crm');
    });

    it('should filter integrations by status', async () => {
      const mockIntegrations = [
        {
          id: '1',
          name: 'Connected Integration',
          type: 'crm' as const,
          status: 'connected' as const,
          config: {},
          metrics: { successRate: 95, averageResponseTime: 250, totalRequests: 100, errorCount: 5 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Error Integration',
          type: 'email' as const,
          status: 'error' as const,
          config: {},
          metrics: { successRate: 0, averageResponseTime: 0, totalRequests: 10, errorCount: 10 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ integrations: mockIntegrations }),
      });

      const { result } = renderHook(() => useIntegrations(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Apply filter
      result.current.setFilters({ status: 'error' });

      expect(result.current.integrations).toHaveLength(1);
      expect(result.current.integrations[0].status).toBe('error');
    });

    it('should search integrations by name', async () => {
      const mockIntegrations = [
        {
          id: '1',
          name: 'Salesforce CRM',
          type: 'crm' as const,
          status: 'connected' as const,
          config: {},
          metrics: { successRate: 95, averageResponseTime: 250, totalRequests: 100, errorCount: 5 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Gmail Integration',
          type: 'email' as const,
          status: 'connected' as const,
          config: {},
          metrics: { successRate: 90, averageResponseTime: 300, totalRequests: 50, errorCount: 5 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ integrations: mockIntegrations }),
      });

      const { result } = renderHook(() => useIntegrations(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Apply search filter
      result.current.setFilters({ search: 'sales' });

      expect(result.current.integrations).toHaveLength(1);
      expect(result.current.integrations[0].name).toBe('Salesforce CRM');
    });
  });

  describe('operations', () => {
    it('should track active operations', async () => {
      const mockIntegration = {
        id: '1',
        name: 'Test Integration',
        type: 'crm' as const,
        status: 'connected' as const,
        config: {},
        metrics: { successRate: 95, averageResponseTime: 250, totalRequests: 100, errorCount: 5 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ integrations: [mockIntegration] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ integrations: [mockIntegration] }),
        });

      const { result } = renderHook(() => useIntegrations(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start a sync operation
      const syncPromise = result.current.syncIntegration('1');

      await waitFor(() => {
        expect(result.current.activeOperations).toHaveLength(1);
      });

      // Wait for operation to complete
      await syncPromise;

      await waitFor(() => {
        expect(result.current.activeOperations).toHaveLength(0);
      });
    });
  });

  describe('statistics', () => {
    it('should calculate correct statistics', async () => {
      const mockIntegrations = [
        {
          id: '1',
          name: 'Connected Integration',
          type: 'crm' as const,
          status: 'connected' as const,
          config: {},
          metrics: { successRate: 95, averageResponseTime: 250, totalRequests: 100, errorCount: 5 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Error Integration',
          type: 'email' as const,
          status: 'error' as const,
          config: {},
          metrics: { successRate: 0, averageResponseTime: 0, totalRequests: 10, errorCount: 10 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Disconnected Integration',
          type: 'sms' as const,
          status: 'disconnected' as const,
          config: {},
          metrics: { successRate: 80, averageResponseTime: 400, totalRequests: 20, errorCount: 4 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ integrations: mockIntegrations }),
      });

      const { result } = renderHook(() => useIntegrations(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stats = result.current.stats;

      expect(stats?.totalIntegrations).toBe(3);
      expect(stats?.activeIntegrations).toBe(1);
      expect(stats?.failedIntegrations).toBe(1);
      expect(stats?.averageResponseTime).toBeCloseTo(216.67, 1); // (250 + 0 + 400) / 3
    });
  });

  describe('error handling', () => {
    it('should handle connection test failures', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ integrations: [] }),
        })
        .mockRejectedValueOnce(new Error('Connection failed'));

      const { result } = renderHook(() => useIntegrations(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.testConnection('1')).rejects.toThrow('Connection failed');
    });

    it('should handle rate limit errors correctly', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ integrations: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: {
            'retry-after': '60',
            'x-ratelimit-limit': '100',
          },
        });

      const { result } = renderHook(() => useIntegrations(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.syncIntegration('1')).rejects.toThrow();
    });
  });

  describe('development helpers', () => {
    it('should provide mock utilities in development', async () => {
      const mockIntegration = {
        id: '1',
        name: 'Test Integration',
        type: 'crm' as const,
        status: 'connected' as const,
        config: {},
        metrics: { successRate: 95, averageResponseTime: 250, totalRequests: 100, errorCount: 5 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ integrations: [mockIntegration] }),
      });

      const { result } = renderHook(() => useIntegrations(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      if (process.env.NODE_ENV === 'development') {
        expect(result.current.mockError).toBeDefined();
        expect(result.current.simulateDelay).toBeDefined();

        const mockError = result.current.mockError('connection');
        expect(mockError).toBeInstanceOf(Error);
      }
    });
  });
});

describe('Specialized Hooks', () => {
  describe('useIntegration', () => {
    it('should return specific integration by id', () => {
      // This would need the full hook setup
      // Implementation depends on how we want to structure this test
    });
  });

  describe('useIntegrationOperations', () => {
    it('should filter operations by integration id', () => {
      // This would test the filtered operations hook
    });
  });

  describe('useIntegrationStats', () => {
    it('should return integration statistics', () => {
      // This would test the stats-only hook
    });
  });
});

describe('Integration Error Classes', () => {
  it('should create correct error instances', () => {
    const integrationError = new IntegrationError('Test error');
    expect(integrationError.code).toBe('INTEGRATION_ERROR');
    expect(integrationError.isRetryable).toBe(false);

    const connectionError = new ConnectionError('Connection failed');
    expect(connectionError.code).toBe('CONNECTION_ERROR');
    expect(connectionError.isRetryable).toBe(true);

    const rateLimitError = new RateLimitError('Too many requests', 60, 100);
    expect(rateLimitError.code).toBe('RATE_LIMIT_ERROR');
    expect(rateLimitError.statusCode).toBe(429);
    expect(rateLimitError.isRetryable).toBe(true);
    expect(rateLimitError.retryAfter).toBe(60);
    expect(rateLimitError.limit).toBe(100);
  });
});

describe('Retry Logic', () => {
  it('should retry failed operations correctly', async () => {
    const retryManager = {
      executeWithRetry: jest.fn(),
    };

    retryManager.executeWithRetry.mockResolvedValue('success');

    const operation = async () => 'success';
    const config = {
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      jitter: false,
    };

    // This would test the actual retry logic
    // Implementation depends on the retry manager structure
  });
});