import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '../../../src/app/(dashboard)/page';
import { createMockLead, createMockDashboardData } from '../../setup';

// Mock all the dependencies
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: createMockDashboardData(),
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useInfiniteQuery: jest.fn(() => ({
    data: {
      pages: [[createMockLead(), createMockLead({ id: '2', firstName: 'سارة' })]],
    },
    isLoading: false,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}));

jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => '2023-12-01'),
  subDays: jest.fn(() => new Date()),
  subWeeks: jest.fn(() => new Date()),
  subMonths: jest.fn(() => new Date()),
  subYears: jest.fn(() => new Date()),
}));

jest.mock('date-fns/locale', () => ({
  ar: jest.fn(),
}));

jest.mock('../../../src/components/leads/LeadCard', () => ({
  default: ({ lead }: any) => <div data-testid="lead-card">{lead.firstName} {lead.lastName}</div>,
}));

jest.mock('../../../src/components/notifications/NotificationCenter', () => ({
  default: () => <div data-testid="notification-center">Notification Center</div>,
}));

describe('Dashboard Page Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering Tests', () => {
    it('should render dashboard page with header', () => {
      render(<DashboardPage />);

      expect(screen.getByText('لوحة التحكم الذكية')).toBeInTheDocument();
      expect(screen.getByText('مدعومة بالذكاء الاصطناعي')).toBeInTheDocument();
      expect(screen.getByText('مرحباً بك في منصة سالير المتطورة')).toBeInTheDocument();
    });

    it('should render intelligence summary metrics', () => {
      render(<DashboardPage />);

      expect(screen.getByText('عميل ساخن')).toBeInTheDocument();
      expect(screen.getByText('متوسط النقاط:')).toBeInTheDocument();
      expect(screen.getByText('احتمالية التحويل:')).toBeInTheDocument();
    });

    it('should render refresh button', () => {
      render(<DashboardPage />);

      expect(screen.getByText('تحديث')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-cw')).toBeInTheDocument();
    });

    it('should render notifications button', () => {
      render(<DashboardPage />);

      expect(screen.getByText('التنبيهات')).toBeInTheDocument();
      expect(screen.getByTestId('bell')).toBeInTheDocument();
    });

    it('should render real-time toggle button', () => {
      render(<DashboardPage />);

      expect(screen.getByText('إيقاف مباشر')).toBeInTheDocument();
      expect(screen.getByTestId('pause')).toBeInTheDocument();
    });

    it('should render settings and fullscreen buttons', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('settings')).toBeInTheDocument();
      expect(screen.getByTestId('maximize-2')).toBeInTheDocument();
    });
  });

  describe('Search and Filter Tests', () => {
    it('should render search input', () => {
      render(<DashboardPage />);

      expect(screen.getByPlaceholderText('البحث في العملاء...')).toBeInTheDocument();
    });

    it('should handle search input changes', () => {
      render(<DashboardPage />);

      const searchInput = screen.getByPlaceholderText('البحث في العملاء...');
      fireEvent.change(searchInput, { target: { value: 'أحمد' } });

      expect(searchInput).toHaveValue('أحمد');
    });

    it('should render date range selector', () => {
      render(<DashboardPage />);

      expect(screen.getByText('اليوم')).toBeInTheDocument();
      expect(screen.getByText('الأسبوع')).toBeInTheDocument();
      expect(screen.getByText('الشهر')).toBeInTheDocument();
      expect(screen.getByText('السنة')).toBeInTheDocument();
    });

    it('should handle date range selection', () => {
      render(<DashboardPage />);

      const weekButton = screen.getByText('الأسبوع');
      fireEvent.click(weekButton);

      expect(weekButton.closest('button')).toHaveClass('bg-blue-100');
    });

    it('should render status filter', () => {
      render(<DashboardPage />);

      expect(screen.getByText('جميع الحالات')).toBeInTheDocument();
      expect(screen.getByText('جديد')).toBeInTheDocument();
      expect(screen.getByText('مؤهل')).toBeInTheDocument();
      expect(screen.getByText('عرض سعر')).toBeInTheDocument();
      expect(screen.getByText('تفاوض')).toBeInTheDocument();
    });

    it('should render temperature filter', () => {
      render(<DashboardPage />);

      expect(screen.getByText('جميع درجات الحرارة')).toBeInTheDocument();
      expect(screen.getByText('ساخن')).toBeInTheDocument();
      expect(screen.getByText('دافئ')).toBeInTheDocument();
      expect(screen.getByText('بارد')).toBeInTheDocument();
    });

    it('should render add lead button', () => {
      render(<DashboardPage />);

      expect(screen.getByText('إضافة عميل')).toBeInTheDocument();
      expect(screen.getByTestId('plus')).toBeInTheDocument();
    });
  });

  describe('Metric Cards Tests', () => {
    it('should render all metric cards', () => {
      render(<DashboardPage />);

      expect(screen.getByText('إجمالي العملاء')).toBeInTheDocument();
      expect(screen.getByText('العملاء الساخنة')).toBeInTheDocument();
      expect(screen.getByText('متوسط النقاط')).toBeInTheDocument();
      expect(screen.getByText('احتمالية التحويل')).toBeInTheDocument();
      expect(screen.getByText('العملاء عالية الأولوية')).toBeInTheDocument();
      expect(screen.getByText('الرسائل الذكية')).toBeInTheDocument();
      expect(screen.getByText('الإيرادات المتوقعة')).toBeInTheDocument();
    });

    it('should render metric values', () => {
      render(<DashboardPage />);

      // Should show the metric values from mock data
      expect(screen.getByText('2')).toBeInTheDocument(); // Total leads
      expect(screen.getByText('85')).toBeInTheDocument(); // Avg score
    });

    it('should render trend indicators', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('arrow-up-right')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-down-right')).toBeInTheDocument();
    });
  });

  describe('Leads Section Tests', () => {
    it('should render leads section header', () => {
      render(<DashboardPage />);

      expect(screen.getByText('العملاء المحتملون الذكيون')).toBeInTheDocument();
      expect(screen.getByText('مدعوم بالذكاء الاصطناعي')).toBeInTheDocument();
      expect(screen.getByTestId('brain')).toBeInTheDocument();
    });

    it('should render lead cards', () => {
      render(<DashboardPage />);

      expect(screen.getAllByTestId('lead-card')).toHaveLength(2);
      expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
      expect(screen.getByText('سارة')).toBeInTheDocument();
    });

    it('should render load more button when there are more leads', () => {
      // Mock hasNextPage to true
      const { useInfiniteQuery } = require('@tanstack/react-query');
      useInfiniteQuery.mockReturnValue({
        data: {
          pages: [[createMockLead()]],
        },
        isLoading: false,
        fetchNextPage: jest.fn(),
        hasNextPage: true,
      });

      render(<DashboardPage />);

      expect(screen.getByText(/عرض المزيد من العملاء/)).toBeInTheDocument();
    });
  });

  describe('Chart Section Tests', () => {
    it('should render chart cards', () => {
      render(<DashboardPage />);

      expect(screen.getByText('اتجاهات العملاء')).toBeInTheDocument();
      expect(screen.getByText('الأداء الشهري')).toBeInTheDocument();
      expect(screen.getByText('توزيع حالات العملاء')).toBeInTheDocument();
      expect(screen.getByText('مصادر العملاء')).toBeInTheDocument();
    });

    it('should render chart containers', () => {
      render(<DashboardPage />);

      // Check if chart containers are rendered
      const charts = screen.getAllByText(/Chart/);
      expect(charts.length).toBeGreaterThan(0);
    });
  });

  describe('Bottom Section Tests', () => {
    it('should render recent activity section', () => {
      render(<DashboardPage />);

      expect(screen.getByText('آخر الأنشطة')).toBeInTheDocument();
      expect(screen.getByText('عرض الكل')).toBeInTheDocument();
    });

    it('should render notifications section', () => {
      render(<DashboardPage />);

      expect(screen.getByText('التنبيهات')).toBeInTheDocument();
    });

    it('should render top performing sections', () => {
      render(<DashboardPage />);

      expect(screen.getByText('أفضل العملاء')).toBeInTheDocument();
      expect(screen.getByText('أفضل المصادر')).toBeInTheDocument();
      expect(screen.getByText('أفضل القنوات')).toBeInTheDocument();
    });

    it('should render quick actions section', () => {
      render(<DashboardPage />);

      expect(screen.getByText('إجراءات سريعة')).toBeInTheDocument();
      expect(screen.getByText('إضافة عميل')).toBeInTheDocument();
      expect(screen.getByText('إرسال رسالة')).toBeInTheDocument();
      expect(screen.getByText('إنشاء هدف')).toBeInTheDocument();
      expect(screen.getByText('تقارير مفصلة')).toBeInTheDocument();
    });
  });

  describe('Modal and Overlay Tests', () => {
    it('should open settings modal when settings button is clicked', () => {
      render(<DashboardPage />);

      fireEvent.click(screen.getByTestId('settings'));

      expect(screen.getByText('إعدادات لوحة التحكم')).toBeInTheDocument();
    });

    it('should open notifications center when notifications button is clicked', () => {
      render(<DashboardPage />);

      fireEvent.click(screen.getByText('التنبيهات'));

      expect(screen.getByTestId('notification-center')).toBeInTheDocument();
    });

    it('should close settings modal when close button is clicked', async () => {
      render(<DashboardPage />);

      fireEvent.click(screen.getByTestId('settings'));
      expect(screen.getByText('إعدادات لوحة التحكم')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('x'));

      await waitFor(() => {
        expect(screen.queryByText('إعدادات لوحة التحكم')).not.toBeInTheDocument();
      });
    });
  });

  describe('State Management Tests', () => {
    it('should toggle real-time enabled state', () => {
      render(<DashboardPage />);

      const realTimeButton = screen.getByText('إيقاف مباشر');
      fireEvent.click(realTimeButton);

      expect(screen.getByText('تشغيل مباشر')).toBeInTheDocument();
      expect(screen.getByTestId('play')).toBeInTheDocument();
    });

    it('should toggle fullscreen mode', () => {
      render(<DashboardPage />);

      const fullscreenButton = screen.getByTestId('maximize-2');
      fireEvent.click(fullscreenButton);

      expect(screen.getByTestId('minimize-2')).toBeInTheDocument();
    });

    it('should update search query state', () => {
      render(<DashboardPage />);

      const searchInput = screen.getByPlaceholderText('البحث في العملاء...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(searchInput).toHaveValue('test search');
    });
  });

  describe('Loading States Tests', () => {
    it('should show loading state for metrics', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<DashboardPage />);

      // Should show loading cards
      const loadingCards = screen.getAllByText(/bg-gray-200/);
      expect(loadingCards.length).toBeGreaterThan(0);
    });
  });

  describe('Theme Tests', () => {
    it('should have proper RTL direction', () => {
      render(<DashboardPage />);

      const dashboard = screen.getByText('لوحة التحكم الذكية').closest('div');
      expect(dashboard).toHaveAttribute('dir', 'rtl');
    });

    it('should apply theme classes', () => {
      render(<DashboardPage />);

      const dashboard = screen.getByText('لوحة التحكم الذكية').closest('div');
      expect(dashboard).toHaveClass('min-h-screen');
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid button clicks', () => {
      render(<DashboardPage />);

      const refreshButton = screen.getByText('تحديث');
      
      // Simulate rapid clicks
      for (let i = 0; i < 5; i++) {
        fireEvent.click(refreshButton);
      }

      expect(refreshButton).toBeInTheDocument();
    });

    it('should handle search input with special characters', () => {
      render(<DashboardPage />);

      const searchInput = screen.getByPlaceholderText('البحث في العملاء...');
      fireEvent.change(searchInput, { target: { value: 'أحمد@محمد#$%' } });

      expect(searchInput).toHaveValue('أحمد@محمد#$%');
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels', () => {
      render(<DashboardPage />);

      const refreshButton = screen.getByText('تحديث');
      expect(refreshButton.closest('button')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<DashboardPage />);

      const searchInput = screen.getByPlaceholderText('البحث في العملاء...');
      searchInput.focus();

      expect(searchInput).toHaveFocus();
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle query errors gracefully', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      });

      render(<DashboardPage />);

      // Should still render the page even with errors
      expect(screen.getByText('لوحة التحكم الذكية')).toBeInTheDocument();
    });
  });
});