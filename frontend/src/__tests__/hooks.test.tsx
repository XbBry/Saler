import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '@/hooks/use-auth';
import { useDashboard } from '@/hooks/useDashboard';
import { useMessages } from '@/hooks/useMessages';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useNotifications } from '@/hooks/useNotifications';

// Mock API functions
const mockApi = {
  login: vi.fn(),
  logout: vi.fn(),
  getDashboardData: vi.fn(),
  sendMessage: vi.fn(),
  getIntegrations: vi.fn(),
  syncIntegration: vi.fn(),
  getAnalytics: vi.fn(),
  showNotification: vi.fn(),
};

vi.mock('@/lib/api', () => ({
  api: mockApi,
}));

vi.mock('@/lib/auth-store', () => ({
  authStore: {
    getUser: vi.fn(),
    setUser: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('Custom Hooks Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuth Hook', () => {
    it('should return user data when authenticated', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      vi.mocked(mockApi.login).mockResolvedValue({
        user: mockUser,
        token: 'fake-token',
      });

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login('test@example.com', 'password');
      });

      waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should handle login errors', async () => {
      const mockError = new Error('Invalid credentials');
      vi.mocked(mockApi.login).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrongpassword');
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle logout', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockApi.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should check authentication status', () => {
      vi.mocked(require('@/lib/auth-store').authStore.getUser).mockReturnValue({
        id: '1',
        email: 'test@example.com',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('useDashboard Hook', () => {
    it('should load dashboard data', async () => {
      const mockDashboardData = {
        metrics: {
          totalLeads: 150,
          totalMessages: 320,
          responseRate: 85,
          conversionRate: 12.5,
        },
        recentActivity: [
          { id: '1', type: 'lead', message: 'New lead created' },
        ],
      };

      vi.mocked(mockApi.getDashboardData).mockResolvedValue(mockDashboardData);

      const { result } = renderHook(() => useDashboard());

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.metrics).toEqual(mockDashboardData.metrics);
      expect(result.current.recentActivity).toEqual(mockDashboardData.recentActivity);
      expect(result.current.loading).toBe(false);
    });

    it('should handle loading state', async () => {
      vi.mocked(mockApi.getDashboardData).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { result } = renderHook(() => useDashboard());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle errors', async () => {
      const mockError = new Error('Failed to load dashboard');
      vi.mocked(mockApi.getDashboardData).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDashboard());

      await act(async () => {
        try {
          await result.current.refresh();
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.error).toBe('Failed to load dashboard');
    });

    it('should provide filter methods', () => {
      const { result } = renderHook(() => useDashboard());

      expect(result.current.setDateRange).toBeDefined();
      expect(result.current.setMetricFilter).toBeDefined();
      expect(result.current.exportData).toBeDefined();
    });
  });

  describe('useMessages Hook', () => {
    it('should load conversations', async () => {
      const mockConversations = [
        {
          id: '1',
          name: 'أحمد محمد',
          lastMessage: 'مرحباً',
          unreadCount: 2,
        },
      ];

      const mockMessages = [
        {
          id: '1',
          content: 'مرحباً',
          sender: 'user',
          timestamp: '2024-01-01T10:00:00Z',
        },
      ];

      vi.mocked(mockApi.getIntegrations).mockResolvedValue({
        conversations: mockConversations,
        messages: { '1': mockMessages },
      });

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.loadConversations();
      });

      expect(result.current.conversations).toEqual(mockConversations);
    });

    it('should send messages', async () => {
      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.sendMessage('1', 'مرحباً، كيف حالك؟');
      });

      expect(mockApi.sendMessage).toHaveBeenCalledWith({
        conversationId: '1',
        content: 'مرحباً، كيف حالك؟',
      });
    });

    it('should handle message errors', async () => {
      const mockError = new Error('Failed to send message');
      vi.mocked(mockApi.sendMessage).mockRejectedValue(mockError);

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        try {
          await result.current.sendMessage('1', 'test message');
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.error).toBe('Failed to send message');
    });

    it('should search messages', () => {
      const mockConversations = [
        { id: '1', name: 'أحمد', messages: [{ content: 'مرحباً' }] },
        { id: '2', name: 'فاطمة', messages: [{ content: 'شكراً' }] },
      ];

      const { result } = renderHook(() => useMessages());

      act(() => {
        result.current.searchConversations('مرحباً');
      });

      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.searchResults[0].name).toBe('أحمد');
    });
  });

  describe('useIntegrations Hook', () => {
    it('should load integrations', async () => {
      const mockIntegrations = [
        {
          id: 'shopify',
          name: 'Shopify',
          status: 'connected',
          config: { storeUrl: 'mystore.myshopify.com' },
        },
      ];

      vi.mocked(mockApi.getIntegrations).mockResolvedValue(mockIntegrations);

      const { result } = renderHook(() => useIntegrations());

      await act(async () => {
        await result.current.loadIntegrations();
      });

      expect(result.current.integrations).toEqual(mockIntegrations);
    });

    it('should sync integration', async () => {
      const mockSyncResult = { success: true, synced: 150 };

      vi.mocked(mockApi.syncIntegration).mockResolvedValue(mockSyncResult);

      const { result } = renderHook(() => useIntegrations());

      await act(async () => {
        const result = await result.current.syncIntegration('shopify');
        expect(result.success).toBe(true);
      });

      expect(mockApi.syncIntegration).toHaveBeenCalledWith('shopify');
    });

    it('should disconnect integration', async () => {
      const { result } = renderHook(() => useIntegrations());

      await act(async () => {
        await result.current.disconnectIntegration('shopify');
      });

      expect(mockApi.getIntegrations).toHaveBeenCalled();
      expect(result.current.integrations.find(i => i.id === 'shopify')?.status).toBe('disconnected');
    });

    it('should handle sync errors', async () => {
      const mockError = new Error('Sync failed');
      vi.mocked(mockApi.syncIntegration).mockRejectedValue(mockError);

      const { result } = renderHook(() => useIntegrations());

      await act(async () => {
        try {
          await result.current.syncIntegration('shopify');
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.syncError).toBe('Sync failed');
    });
  });

  describe('useAnalytics Hook', () => {
    it('should load analytics data', async () => {
      const mockAnalyticsData = [
        { date: '2024-01-01', leads: 20, messages: 45, revenue: 1000 },
        { date: '2024-01-02', leads: 25, messages: 50, revenue: 1200 },
      ];

      vi.mocked(mockApi.getAnalytics).mockResolvedValue(mockAnalyticsData);

      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.loadAnalytics({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });
      });

      expect(result.current.data).toEqual(mockAnalyticsData);
      expect(result.current.loading).toBe(false);
    });

    it('should calculate derived metrics', () => {
      const mockData = [
        { date: '2024-01-01', leads: 20, messages: 45, revenue: 1000 },
        { date: '2024-01-02', leads: 30, messages: 60, revenue: 1500 },
      ];

      vi.mocked(mockApi.getAnalytics).mockResolvedValue(mockData);

      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.loadAnalytics({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });
      });

      expect(result.current.summary).toEqual({
        totalLeads: 50,
        totalMessages: 105,
        totalRevenue: 2500,
        avgConversionRate: expect.any(Number),
      });
    });

    it('should filter data by date range', async () => {
      const allData = [
        { date: '2024-01-01', leads: 20 },
        { date: '2024-01-15', leads: 30 },
        { date: '2024-02-01', leads: 25 },
      ];

      vi.mocked(mockApi.getAnalytics).mockResolvedValue(allData);

      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.loadAnalytics({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });
      });

      expect(result.current.filteredData).toHaveLength(2);
    });

    it('should export data', () => {
      const mockData = [
        { date: '2024-01-01', leads: 20, messages: 45 },
      ];

      vi.mocked(mockApi.getAnalytics).mockResolvedValue(mockData);

      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.exportData('csv');
      });

      // Mock implementation would trigger CSV export
      expect(result.current.isExporting).toBe(true);
    });
  });

  describe('useNotifications Hook', () => {
    it('should show notification', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.showNotification({
          type: 'success',
          title: 'Success!',
          message: 'Operation completed',
        });
      });

      expect(mockApi.showNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'Success!',
        message: 'Operation completed',
      });
    });

    it('should handle different notification types', () => {
      const { result } = renderHook(() => useNotifications());

      const notificationTypes = ['info', 'success', 'warning', 'error'];

      notificationTypes.forEach(type => {
        act(() => {
          result.current.showNotification({
            type: type as any,
            title: `${type} notification`,
            message: 'Test message',
          });
        });
      });

      expect(mockApi.showNotification).toHaveBeenCalledTimes(4);
    });

    it('should remove notification', () => {
      const { result } = renderHook(() => useNotifications());

      const notificationId = 'test-id';

      act(() => {
        result.current.removeNotification(notificationId);
      });

      expect(result.current.notifications.find(n => n.id === notificationId)).toBeUndefined();
    });

    it('should clear all notifications', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.clearAllNotifications();
      });

      expect(result.current.notifications).toHaveLength(0);
    });
  });

  describe('Hook Performance', () => {
    it('should memoize expensive operations', async () => {
      const mockExpensiveOperation = vi.fn().mockReturnValue('expensive-result');
      mockExpensiveOperation.mockClear();

      const { result } = renderHook(() => {
        const { useDashboard } = require('@/hooks/useDashboard');
        return useDashboard();
      });

      // Call expensive operation multiple times
      await act(async () => {
        await result.current.refresh();
      });

      await act(async () => {
        await result.current.refresh();
      });

      // Mock implementation should use memoization
      expect(mockExpensiveOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent updates', async () => {
      const { result } = renderHook(() => useMessages());

      // Simulate concurrent updates
      await act(async () => {
        Promise.all([
          result.current.sendMessage('1', 'Message 1'),
          result.current.sendMessage('2', 'Message 2'),
        ]);
      });

      expect(mockApi.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Hook Error Boundaries', () => {
    it('should handle hook errors gracefully', async () => {
      vi.mocked(mockApi.getDashboardData).mockRejectedValue(new Error('Hook error'));

      const { result } = renderHook(() => useDashboard());

      await act(async () => {
        try {
          await result.current.refresh();
        } catch (error) {
          expect(error.message).toBe('Hook error');
        }
      });

      expect(result.current.error).toBe('Hook error');
      expect(result.current.loading).toBe(false);
    });

    it('should provide error recovery', async () => {
      vi.mocked(mockApi.getDashboardData)
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({ metrics: {}, recentActivity: [] });

      const { result } = renderHook(() => useDashboard());

      // First call fails
      await act(async () => {
        try {
          await result.current.refresh();
        } catch (error) {
          expect(error.message).toBe('Temporary error');
        }
      });

      // Retry succeeds
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Hook Cleanup', () => {
    it('should cleanup resources on unmount', () => {
      const mockCleanup = vi.fn();
      vi.mocked(mockApi.getDashboardData).mockImplementation(() => {
        return new Promise(resolve => {
          const timeout = setTimeout(() => {
            mockCleanup();
            resolve({ metrics: {}, recentActivity: [] });
          }, 100);
        });
      });

      const { unmount } = renderHook(() => useDashboard());

      unmount();

      // Cleanup should be called
      expect(mockCleanup).toHaveBeenCalled();
    });
  });
});
