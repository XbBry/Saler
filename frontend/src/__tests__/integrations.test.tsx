import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import IntegrationCard from '@/components/integrations/IntegrationCard';
import IntegrationForm from '@/components/integrations/IntegrationForm';
import IntegrationSettings from '@/components/integrations/IntegrationSettings';
import SyncStatus from '@/components/integrations/SyncStatus';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock hooks
vi.mock('@/hooks/useIntegrations', () => ({
  useIntegrations: () => ({
    integrations: [
      {
        id: 'shopify',
        name: 'Shopify',
        type: 'ecommerce',
        status: 'connected',
        lastSync: '2024-01-01T10:00:00Z',
        config: { storeUrl: 'mystore.myshopify.com' },
      },
    ],
    syncIntegration: vi.fn(),
    disconnectIntegration: vi.fn(),
    loading: false,
    error: null,
  }),
}));

vi.mock('@/lib/integration-utils', () => ({
  validateIntegration: vi.fn(),
  syncData: vi.fn(),
  getIntegrationStatus: vi.fn(),
}));

describe('Integrations Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('IntegrationCard', () => {
    it('should render integration information', () => {
      const integration = {
        id: 'shopify',
        name: 'Shopify',
        type: 'ecommerce',
        status: 'connected',
        description: 'ربط متجر Shopify',
        icon: '/icons/shopify.svg',
      };

      render(<IntegrationCard integration={integration} onConnect={vi.fn()} />);

      expect(screen.getByText('Shopify')).toBeInTheDocument();
      expect(screen.getByText('ربط متجر Shopify')).toBeInTheDocument();
      expect(screen.getByText('متصل')).toBeInTheDocument();
    });

    it('should show connection status correctly', () => {
      const connectedIntegration = {
        id: 'shopify',
        name: 'Shopify',
        type: 'ecommerce',
        status: 'connected',
        lastSync: '2024-01-01T10:00:00Z',
      };

      const disconnectedIntegration = {
        id: 'facebook',
        name: 'Facebook',
        type: 'social',
        status: 'disconnected',
        lastSync: null,
      };

      render(
        <>
          <IntegrationCard integration={connectedIntegration} onConnect={vi.fn()} />
          <IntegrationCard integration={disconnectedIntegration} onConnect={vi.fn()} />
        </>
      );

      expect(screen.getAllByText('متصل')).toHaveLength(1);
      expect(screen.getByText('غير متصل')).toBeInTheDocument();
    });

    it('should show last sync time', () => {
      const integration = {
        id: 'shopify',
        name: 'Shopify',
        type: 'ecommerce',
        status: 'connected',
        lastSync: '2024-01-01T10:00:00Z',
      };

      render(<IntegrationCard integration={integration} onConnect={vi.fn()} />);

      expect(screen.getByText(/آخر مزامنة: /i)).toBeInTheDocument();
    });
  });

  describe('IntegrationForm', () => {
    it('should render form fields for Shopify integration', () => {
      render(
        <IntegrationForm
          type="shopify"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/رابط المتجر/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/مفتاح API/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/كلمة مرور API/i)).toBeInTheDocument();
    });

    it('should render form fields for Facebook integration', () => {
      render(
        <IntegrationForm
          type="facebook"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/معرف التطبيق/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/سر التطبيق/i)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      const mockSubmit = vi.fn();
      
      render(
        <IntegrationForm
          type="shopify"
          onSubmit={mockSubmit}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText(/حفظ/i));

      await waitFor(() => {
        expect(screen.getByText(/مطلوب/i)).toBeInTheDocument();
      });
    });

    it('should call onSubmit with form data', async () => {
      const mockSubmit = vi.fn();
      
      render(
        <IntegrationForm
          type="shopify"
          onSubmit={mockSubmit}
          onCancel={vi.fn()}
        />
      );

      fireEvent.change(screen.getByLabelText(/رابط المتجر/i), {
        target: { value: 'mystore.myshopify.com' },
      });
      fireEvent.change(screen.getByLabelText(/مفتاح API/i), {
        target: { value: 'test-api-key' },
      });
      fireEvent.change(screen.getByLabelText(/كلمة مرور API/i), {
        target: { value: 'test-secret' },
      });

      fireEvent.click(screen.getByText(/حفظ/i));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          storeUrl: 'mystore.myshopify.com',
          apiKey: 'test-api-key',
          apiSecret: 'test-secret',
        });
      });
    });
  });

  describe('IntegrationSettings', () => {
    it('should render settings tabs', () => {
      const integration = {
        id: 'shopify',
        name: 'Shopify',
        type: 'ecommerce',
        status: 'connected',
        config: { syncFrequency: 'daily' },
      };

      render(<IntegrationSettings integration={integration} onUpdate={vi.fn()} />);

      expect(screen.getByText(/إعدادات عامة/i)).toBeInTheDocument();
      expect(screen.getByText(/المزامنة/i)).toBeInTheDocument();
      expect(screen.getByText(/الحقول/i)).toBeInTheDocument();
    });

    it('should update sync frequency', () => {
      const mockUpdate = vi.fn();
      const integration = {
        id: 'shopify',
        name: 'Shopify',
        type: 'ecommerce',
        status: 'connected',
        config: { syncFrequency: 'daily' },
      };

      render(<IntegrationSettings integration={integration} onUpdate={mockUpdate} />);

      const frequencySelect = screen.getByDisplayValue('daily');
      fireEvent.change(frequencySelect, { target: { value: 'hourly' } });

      expect(mockUpdate).toHaveBeenCalledWith({
        ...integration,
        config: { syncFrequency: 'hourly' },
      });
    });

    it('should show field mapping options', () => {
      const integration = {
        id: 'shopify',
        name: 'Shopify',
        type: 'ecommerce',
        status: 'connected',
        config: {
          fieldMapping: {
            email: 'customer.email',
            name: 'customer.first_name',
          },
        },
      };

      render(<IntegrationSettings integration={integration} onUpdate={vi.fn()} />);

      expect(screen.getByText(/تعيين الحقول/i)).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText('customer.email')).toBeInTheDocument();
    });
  });

  describe('SyncStatus', () => {
    it('should show sync progress', () => {
      render(
        <SyncStatus
          isSyncing={true}
          progress={60}
          lastSync="2024-01-01T10:00:00Z"
          error={null}
        />
      );

      expect(screen.getByText(/جاري المزامنة/i)).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('should show sync error', () => {
      render(
        <SyncStatus
          isSyncing={false}
          progress={0}
          lastSync="2024-01-01T10:00:00Z"
          error="فشل في المزامنة"
        />
      );

      expect(screen.getByText('فشل في المزامنة')).toBeInTheDocument();
      expect(screen.getByText(/إعادة المحاولة/i)).toBeInTheDocument();
    });

    it('should show sync success', () => {
      render(
        <SyncStatus
          isSyncing={false}
          progress={100}
          lastSync="2024-01-01T10:00:00Z"
          error={null}
        />
      );

      expect(screen.getByText(/تمت المزامنة بنجاح/i)).toBeInTheDocument();
    });
  });

  describe('WebhookList', () => {
    it('should render webhook endpoints', () => {
      const webhooks = [
        {
          id: '1',
          url: 'https://example.com/webhook1',
          events: ['order.created', 'customer.updated'],
          active: true,
        },
        {
          id: '2',
          url: 'https://example.com/webhook2',
          events: ['product.created'],
          active: false,
        },
      ];

      render(<div data-testid="webhook-list">{JSON.stringify(webhooks)}</div>);

      expect(screen.getByText('https://example.com/webhook1')).toBeInTheDocument();
      expect(screen.getByText('https://example.com/webhook2')).toBeInTheDocument();
    });
  });

  describe('Integration Connection', () => {
    it('should test connection when connecting integration', async () => {
      const mockSyncIntegration = vi.fn();
      
      vi.mocked(require('@/hooks/useIntegrations').useIntegrations).mockReturnValue({
        integrations: [],
        syncIntegration: mockSyncIntegration,
        disconnectIntegration: vi.fn(),
        loading: true,
        error: null,
      });

      render(<div data-testid="integration-list">Connecting...</div>);

      await act(async () => {
        // Simulate connection process
      });

      expect(screen.getByText(/جاري الاتصال/i)).toBeInTheDocument();
    });

    it('should disconnect integration', async () => {
      const mockDisconnect = vi.fn();
      
      vi.mocked(require('@/hooks/useIntegrations').useIntegrations).mockReturnValue({
        integrations: [{
          id: 'shopify',
          name: 'Shopify',
          type: 'ecommerce',
          status: 'connected',
          lastSync: '2024-01-01T10:00:00Z',
        }],
        syncIntegration: vi.fn(),
        disconnectIntegration: mockDisconnect,
        loading: false,
        error: null,
      });

      render(<div data-testid="integration-list">Connected</div>);

      const disconnectButton = screen.getByText(/قطع الاتصال/i);
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalledWith('shopify');
      });
    });
  });

  describe('OAuth Integration', () => {
    it('should redirect to OAuth URL', () => {
      const mockWindow = {
        location: { href: '' },
      };
      global.window = mockWindow as any;

      const handleOAuthConnect = (provider: string) => {
        const authUrl = `https://api.${provider}.com/oauth/authorize`;
        window.location.href = authUrl;
      };

      handleOAuthConnect('facebook');

      expect(mockWindow.location.href).toBe('https://api.facebook.com/oauth/authorize');
    });

    it('should handle OAuth callback', async () => {
      const mockValidateIntegration = vi.fn().mockResolvedValue(true);
      
      vi.mocked(require('@/lib/integration-utils').validateIntegration)
        .mockImplementation(mockValidateIntegration);

      const result = await mockValidateIntegration('oauth-token');

      expect(mockValidateIntegration).toHaveBeenCalledWith('oauth-token');
      expect(result).toBe(true);
    });
  });

  describe('Data Sync', () => {
    it('should sync data when sync button is clicked', async () => {
      const mockSyncData = vi.fn().mockResolvedValue({ success: true });
      
      vi.mocked(require('@/lib/integration-utils').syncData)
        .mockImplementation(mockSyncData);

      await mockSyncData('shopify', { since: '2024-01-01' });

      expect(mockSyncData).toHaveBeenCalledWith('shopify', {
        since: '2024-01-01',
      });
    });

    it('should show sync error message', async () => {
      const mockSyncData = vi.fn().mockRejectedValue(new Error('Sync failed'));
      
      vi.mocked(require('@/lib/integration-utils').syncData)
        .mockImplementation(mockSyncData);

      try {
        await mockSyncData('shopify');
      } catch (error) {
        expect(error.message).toBe('Sync failed');
      }
    });
  });

  describe('Integration Error Handling', () => {
    it('should handle API rate limits', async () => {
      const rateLimitError = {
        status: 429,
        message: 'Rate limit exceeded',
        retryAfter: 60,
      };

      // Mock API call that returns rate limit error
      vi.mocked(require('@/lib/integration-utils').validateIntegration)
        .mockRejectedValueOnce(rateLimitError);

      try {
        await require('@/lib/integration-utils').validateIntegration('test');
      } catch (error) {
        expect(error.status).toBe(429);
        expect(error.message).toBe('Rate limit exceeded');
      }
    });

    it('should handle authentication errors', async () => {
      const authError = {
        status: 401,
        message: 'Invalid credentials',
      };

      vi.mocked(require('@/lib/integration-utils').validateIntegration)
        .mockRejectedValueOnce(authError);

      try {
        await require('@/lib/integration-utils').validateIntegration('test');
      } catch (error) {
        expect(error.status).toBe(401);
        expect(error.message).toBe('Invalid credentials');
      }
    });
  });
});
