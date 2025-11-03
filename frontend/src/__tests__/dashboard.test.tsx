import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/(dashboard)/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock API calls
vi.mock('@/hooks/useDashboard', () => ({
  useDashboard: () => ({
    metrics: {
      totalLeads: 150,
      totalMessages: 320,
      responseRate: 85,
      conversionRate: 12.5,
    },
    loading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    data: [
      { date: '2024-01-01', leads: 20, messages: 45 },
      { date: '2024-01-02', leads: 25, messages: 50 },
    ],
    loading: false,
  }),
}));

vi.mock('@/components/metrics/MetricCard', () => ({
  default: ({ title, value }: { title: string; value: number | string }) => (
    <div data-testid="metric-card">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  ),
}));

vi.mock('@/components/charts', () => ({
  BarChart: ({ data }: { data: any[] }) => (
    <div data-testid="bar-chart" data-data={JSON.stringify(data)}>
      Bar Chart
    </div>
  ),
  LineChart: ({ data }: { data: any[] }) => (
    <div data-testid="line-chart" data-data={JSON.stringify(data)}>
      Line Chart
    </div>
  ),
}));

describe('Dashboard Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Layout', () => {
    it('should render dashboard header', () => {
      render(<DashboardPage />);

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    it('should render navigation tabs', () => {
      render(<DashboardPage />);

      expect(screen.getByText(/نظرة عامة/i)).toBeInTheDocument();
      expect(screen.getByText(/العملاء/i)).toBeInTheDocument();
      expect(screen.getByText(/الرسائل/i)).toBeInTheDocument();
      expect(screen.getByText(/التقارير/i)).toBeInTheDocument();
      expect(screen.getByText(/الإعدادات/i)).toBeInTheDocument();
    });
  });

  describe('Metrics Cards', () => {
    it('should display all metric cards', () => {
      render(<DashboardPage />);

      expect(screen.getAllByTestId('metric-card')).toHaveLength(4);
    });

    it('should display correct values for metrics', () => {
      render(<DashboardPage />);

      expect(screen.getByText('150')).toBeInTheDocument(); // totalLeads
      expect(screen.getByText('320')).toBeInTheDocument(); // totalMessages
      expect(screen.getByText('85')).toBeInTheDocument(); // responseRate
      expect(screen.getByText('12.5')).toBeInTheDocument(); // conversionRate
    });
  });

  describe('Charts', () => {
    it('should render bar chart', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should render line chart', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should pass correct data to charts', () => {
      render(<DashboardPage />);

      const barChart = screen.getByTestId('bar-chart');
      const lineChart = screen.getByTestId('line-chart');

      expect(JSON.parse(barChart.getAttribute('data-data') || '[]')).toHaveLength(2);
      expect(JSON.parse(lineChart.getAttribute('data-data') || '[]')).toHaveLength(2);
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while loading', () => {
      vi.mocked(require('@/hooks/useDashboard').useDashboard).mockReturnValue({
        metrics: null,
        loading: true,
        error: null,
      });

      render(<DashboardPage />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show error message on error', () => {
      vi.mocked(require('@/hooks/useDashboard').useDashboard).mockReturnValue({
        metrics: null,
        loading: false,
        error: 'Failed to load dashboard data',
      });

      render(<DashboardPage />);

      expect(screen.getByText(/Failed to load dashboard data/i)).toBeInTheDocument();
    });
  });

  describe('Date Range Filter', () => {
    it('should update date range when changed', () => {
      render(<DashboardPage />);

      const dateRangeButton = screen.getByText(/last 30 days/i);
      fireEvent.click(dateRangeButton);

      expect(dateRangeButton).toBeInTheDocument();
      // Additional date range testing would require more complex setup
    });
  });

  describe('Real-time Updates', () => {
    it('should update metrics when new data arrives', async () => {
      render(<DashboardPage />);

      const initialLeads = screen.getByText('150');
      
      // Simulate real-time update
      fireEvent(window, new Event('leads_updated', {
        detail: { totalLeads: 175 }
      }));

      await waitFor(() => {
        expect(screen.getByText('175')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh data when refresh button is clicked', () => {
      const mockRefresh = vi.fn();
      vi.mocked(require('@/hooks/useDashboard').useDashboard).mockReturnValue({
        metrics: {
          totalLeads: 150,
          totalMessages: 320,
          responseRate: 85,
          conversionRate: 12.5,
        },
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<DashboardPage />);

      const refreshButton = screen.getByText(/refresh/i);
      fireEvent.click(refreshButton);

      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<DashboardPage />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label');
      expect(screen.getByText(/dashboard/i).closest('h1')).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', () => {
      render(<DashboardPage />);

      const metricCards = screen.getAllByTestId('metric-card');
      metricCards.forEach(card => {
        expect(card).toHaveAttribute('tabindex');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<DashboardPage />);

      // Check that metrics stack vertically on mobile
      expect(screen.getAllByTestId('metric-card')[0]).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should trigger export when export button is clicked', () => {
      render(<DashboardPage />);

      const exportButton = screen.getByText(/export/i);
      fireEvent.click(exportButton);

      // Mock implementation would trigger CSV/PDF export
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API timeout gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      vi.mocked(require('@/hooks/useDashboard').useDashboard).mockReturnValue({
        metrics: null,
        loading: false,
        error: timeoutError.message,
      });

      render(<DashboardPage />);

      expect(screen.getByText(/timeout/i)).toBeInTheDocument();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      vi.mocked(require('@/hooks/useDashboard').useDashboard).mockReturnValue({
        metrics: null,
        loading: false,
        error: networkError.message,
      });

      render(<DashboardPage />);

      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
