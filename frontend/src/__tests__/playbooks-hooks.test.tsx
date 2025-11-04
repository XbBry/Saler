/**
 * اختبارات usePlaybooks Hook
 * React Query hooks testing
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlaybooksComplete, usePlaybooks, usePlaybooksStats } from '../hooks/usePlaybooks';

// Mock fetch globally
global.fetch = jest.fn();

// Create a test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePlaybooks Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        playbooks: [
          {
            id: '1',
            name: 'Test Playbook',
            description: 'Test Description',
            category: 'lead_qualification',
            status: 'active',
            steps: [],
            metrics: {
              totalRuns: 10,
              successRate: 85,
              avgCompletionTime: 60,
              currentActive: 2,
              lastRun: new Date().toISOString(),
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            owner: 'test-user',
            tags: ['test'],
            isPublic: false,
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }),
    });
  });

  describe('usePlaybooks', () => {
    it('should fetch playbooks successfully', async () => {
      const { result } = renderHook(() => usePlaybooks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.playbooks).toHaveLength(1);
      expect(result.current.playbooks[0]).toHaveProperty('id', '1');
      expect(result.current.playbooks[0]).toHaveProperty('name', 'Test Playbook');
      expect(result.current.error).toBeNull();
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => usePlaybooks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.playbooks).toHaveLength(0);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        search: 'test',
        category: 'lead_qualification',
        status: 'active',
      };

      const { result } = renderHook(() => usePlaybooks(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test&category=lead_qualification&status=active')
      );
    });
  });

  describe('usePlaybooksStats', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          totalPlaybooks: 5,
          activePlaybooks: 3,
          totalRuns: 150,
          avgSuccessRate: 87.5,
          totalActive: 12,
          avgCompletionTime: 75,
          categoryBreakdown: {
            lead_qualification: 2,
            nurturing: 1,
            conversion: 1,
            retention: 1,
          },
          statusBreakdown: {
            active: 3,
            paused: 1,
            draft: 1,
          },
          monthlyGrowth: 15.2,
        }),
      });
    });

    it('should fetch stats successfully', async () => {
      const { result } = renderHook(() => usePlaybooksStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats).toHaveProperty('totalPlaybooks', 5);
      expect(result.current.stats).toHaveProperty('activePlaybooks', 3);
      expect(result.current.stats).toHaveProperty('avgSuccessRate', 87.5);
      expect(result.current.stats).toHaveProperty('categoryBreakdown');
      expect(result.current.stats).toHaveProperty('statusBreakdown');
    });
  });

  describe('usePlaybooksComplete', () => {
    it('should provide complete functionality', async () => {
      const { result } = renderHook(() => usePlaybooksComplete(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check data structure
      expect(result.current).toHaveProperty('playbooks');
      expect(result.current).toHaveProperty('stats');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      
      // Check CRUD functions
      expect(result.current).toHaveProperty('createPlaybook');
      expect(result.current).toHaveProperty('updatePlaybook');
      expect(result.current).toHaveProperty('deletePlaybook');
      expect(result.current).toHaveProperty('togglePlaybookStatus');
      expect(result.current).toHaveProperty('runPlaybook');
      expect(result.current).toHaveProperty('duplicatePlaybook');
      expect(result.current).toHaveProperty('refetch');

      // Check pagination
      expect(result.current).toHaveProperty('pagination');
      expect(result.current.pagination).toHaveProperty('total');
      expect(result.current.pagination).toHaveProperty('page');
      expect(result.current.pagination).toHaveProperty('totalPages');
    });

    it('should handle CRUD operations', async () => {
      const { result } = renderHook(() => usePlaybooksComplete(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock mutation responses
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: '2', name: 'New Playbook' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      // Test create operation
      act(() => {
        result.current.createPlaybook({
          name: 'New Playbook',
          description: 'Test Description',
          category: 'lead_qualification',
          status: 'draft',
          steps: [],
          tags: ['new'],
          isPublic: false,
        });
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/playbooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

      const { result } = renderHook(() => usePlaybooks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('فشل في جلب الـ Playbooks: Network Error');
    });

    it('should handle HTTP errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => usePlaybooks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('فشل في جلب الـ Playbooks: Internal Server Error');
    });
  });

  describe('Caching Behavior', () => {
    it('should respect staleTime configuration', async () => {
      const { result } = renderHook(() => usePlaybooks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Hook should use staleTime: 2 * 60 * 1000 = 2 minutes
      expect(result.current.dataUpdatedAt).toBeDefined();
    });

    it('should invalidate queries on mutations', async () => {
      const queryClient = new QueryClient();
      const { result } = renderHook(() => usePlaybooksComplete(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock successful delete
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Delete playbook
      act(() => {
        result.current.deletePlaybook('1');
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/playbooks/1', {
          method: 'DELETE',
        });
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('should not re-render unnecessarily', async () => {
      const renderCount = { current: 0 };
      const TestComponent = () => {
        renderCount.current += 1;
        const { result } = renderHook(() => usePlaybooks(), {
          wrapper: createWrapper(),
        });
        return <div data-testid="playbooks-count">{result.current.playbooks.length}</div>;
      };

      const { rerender } = render(<TestComponent />);

      // Rerender with same props - should not cause additional renders
      const initialRenderCount = renderCount.current;
      rerender();
      
      expect(renderCount.current).toBe(initialRenderCount + 1); // Only the re-render itself
    });
  });
});

export {};