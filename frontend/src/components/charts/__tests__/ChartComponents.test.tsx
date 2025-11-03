/**
 * اختبارات بسيطة للتأكد من صحة المكونات
 * Simple tests to verify component correctness
 */

import React from 'react';

// Mock for Recharts components since we can't render them in Node.js
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => children,
  LineChart: ({ children }: any) => children,
  BarChart: ({ children }: any) => children,
  PieChart: ({ children }: any) => children,
  AreaChart: ({ children }: any) => children,
  Line: () => null,
  Bar: () => null,
  Pie: () => null,
  Area: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
  Brush: () => null,
}));

// Import components after mocking
import {
  ChartWrapper,
  LineChart,
  BarChart,
  PieChart,
  DoughnutChart,
  AreaChart,
  MetricCard,
  chartColors,
  formatNumber,
  formatPercentage,
  formatCurrency,
  generateTimeSeriesData,
  generateComparisonData,
  generateMetricData,
} from './index';

describe('Chart Components', () => {
  // Test utility functions
  describe('Utility Functions', () => {
    test('formatNumber formats large numbers correctly', () => {
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(1234.56)).toBe('1,234.6');
      expect(formatNumber(999)).toBe('999');
    });

    test('formatPercentage formats percentages correctly', () => {
      expect(formatPercentage(15.2)).toBe('+15.2%');
      expect(formatPercentage(-5.8)).toBe('-5.8%');
      expect(formatPercentage(0)).toBe('+0.0%');
    });

    test('formatCurrency formats currency correctly', () => {
      const result = formatCurrency(1250);
      expect(typeof result).toBe('string');
      expect(result).toContain('1250');
    });

    test('generateTimeSeriesData creates correct data structure', () => {
      const data = generateTimeSeriesData(7);
      expect(data).toHaveLength(7);
      expect(data[0]).toHaveProperty('date');
      expect(data[0]).toHaveProperty('value');
      expect(data[0]).toHaveProperty('label');
    });

    test('generateComparisonData creates correct data structure', () => {
      const categories = ['A', 'B', 'C'];
      const data = generateComparisonData(categories);
      expect(data).toHaveLength(3);
      data.forEach(item => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('value');
        expect(item).toHaveProperty('percentage');
      });
    });

    test('generateMetricData creates correct data structure', () => {
      const metric = generateMetricData(1000);
      expect(metric).toHaveProperty('current');
      expect(metric).toHaveProperty('previous');
      expect(metric).toHaveProperty('growth');
      expect(typeof metric.growth).toBe('string');
    });
  });

  // Test chart colors
  describe('Chart Colors', () => {
    test('chartColors has correct structure', () => {
      expect(chartColors).toHaveProperty('default');
      expect(chartColors).toHaveProperty('pastel');
      expect(chartColors).toHaveProperty('warm');
      expect(chartColors).toHaveProperty('cool');
      expect(chartColors).toHaveProperty('monochrome');
      
      expect(Array.isArray(chartColors.default)).toBe(true);
      expect(chartColors.default.length).toBeGreaterThan(0);
    });
  });

  // Test component rendering
  describe('Component Rendering', () => {
    test('ChartWrapper renders with title', () => {
      const { container } = render(
        <ChartWrapper title="Test Chart" height={300}>
          <div>Chart Content</div>
        </ChartWrapper>
      );
      expect(container.querySelector('h3')?.textContent).toBe('Test Chart');
    });

    test('ChartWrapper renders with loading state', () => {
      const { container } = render(
        <ChartWrapper title="Loading Chart" loading={true}>
          <div>Chart Content</div>
        </ChartWrapper>
      );
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('ChartWrapper renders with error state', () => {
      const { container } = render(
        <ChartWrapper title="Error Chart" error="Test error">
          <div>Chart Content</div>
        </ChartWrapper>
      );
      expect(container.textContent).toContain('Test error');
    });

    test('MetricCard renders with all props', () => {
      const { container } = render(
        <MetricCard
          title="Test Metric"
          value={1000}
          trend="up"
          trendValue={15.5}
          icon={TrendingUp}
          iconColor="green"
        />
      );
      expect(container.querySelector('h3')?.textContent).toBe('Test Metric');
    });

    test('LineChart renders with basic props', () => {
      const data = [{ date: '2024-01-01', value: 100 }];
      const { container } = render(
        <LineChart
          data={data}
          xAxisKey="date"
          yAxisKeys={["value"]}
          height={300}
        />
      );
      expect(container).toBeInTheDocument();
    });

    test('BarChart renders with basic props', () => {
      const data = [{ category: 'A', value: 100 }];
      const { container } = render(
        <BarChart
          data={data}
          xAxisKey="category"
          yAxisKey="value"
          height={300}
        />
      );
      expect(container).toBeInTheDocument();
    });

    test('PieChart renders with basic props', () => {
      const data = [{ name: 'A', value: 100 }];
      const { container } = render(
        <PieChart
          data={data}
          dataKey="value"
          height={300}
        />
      );
      expect(container).toBeInTheDocument();
    });

    test('DoughnutChart renders with basic props', () => {
      const data = [{ name: 'A', value: 100 }];
      const { container } = render(
        <DoughnutChart
          data={data}
          dataKey="value"
          height={300}
        />
      );
      expect(container).toBeInTheDocument();
    });

    test('AreaChart renders with basic props', () => {
      const data = [{ date: '2024-01-01', value: 100 }];
      const { container } = render(
        <AreaChart
          data={data}
          xAxisKey="date"
          yAxisKeys={["value"]}
          height={300}
        />
      );
      expect(container).toBeInTheDocument();
    });
  });

  // Test prop combinations
  describe('Prop Combinations', () => {
    test('MetricCard handles different trend values', () => {
      const { container: upContainer } = render(
        <MetricCard title="Up" value={100} trend="up" trendValue={5} />
      );
      
      const { container: downContainer } = render(
        <MetricCard title="Down" value={100} trend="down" trendValue={-5} />
      );
      
      const { container: neutralContainer } = render(
        <MetricCard title="Neutral" value={100} trend="neutral" trendValue={0} />
      );

      expect(upContainer.querySelector('.text-green-600')).toBeInTheDocument();
      expect(downContainer.querySelector('.text-red-600')).toBeInTheDocument();
      expect(neutralContainer.querySelector('.text-gray-600')).toBeInTheDocument();
    });

    test('ChartWrapper handles different variants', () => {
      const variants: Array<'default' | 'gradient' | 'outline' | 'minimal'> = 
        ['default', 'gradient', 'outline', 'minimal'];
      
      variants.forEach(variant => {
        const { container } = render(
          <ChartWrapper title={`Test ${variant}`} variant={variant}>
            <div>Content</div>
          </ChartWrapper>
        );
        expect(container).toBeInTheDocument();
      });
    });

    test('MetricCard handles different sizes', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
      
      sizes.forEach(size => {
        const { container } = render(
          <MetricCard title={`Test ${size}`} value={100} size={size} />
        );
        expect(container).toBeInTheDocument();
      });
    });
  });

  // Test data validation
  describe('Data Validation', () => {
    test('LineChart handles empty data', () => {
      const { container } = render(
        <LineChart
          data={[]}
          xAxisKey="date"
          yAxisKeys={["value"]}
          height={300}
        />
      );
      expect(container).toBeInTheDocument();
    });

    test('BarChart handles empty data', () => {
      const { container } = render(
        <BarChart
          data={[]}
          xAxisKey="category"
          yAxisKey="value"
          height={300}
        />
      );
      expect(container).toBeInTheDocument();
    });

    test('PieChart handles empty data', () => {
      const { container } = render(
        <PieChart
          data={[]}
          dataKey="value"
          height={300}
        />
      );
      expect(container).toBeInTheDocument();
    });

    test('MetricCard handles undefined values gracefully', () => {
      const { container } = render(
        <MetricCard title="Test" value={undefined as any} />
      );
      expect(container).toBeInTheDocument();
    });
  });

  // Test RTL support
  describe('RTL Support', () => {
    test('MetricCard renders in RTL context', () => {
      document.documentElement.dir = 'rtl';
      const { container } = render(
        <MetricCard title="اختبار" value={100} />
      );
      expect(container.querySelector('h3')?.textContent).toBe('اختبار');
      document.documentElement.dir = 'ltr'; // Reset
    });
  });

  // Test dark mode compatibility
  describe('Dark Mode Support', () => {
    test('MetricCard works with dark mode classes', () => {
      document.documentElement.classList.add('dark');
      const { container } = render(
        <MetricCard title="Dark Mode Test" value={100} />
      );
      expect(container.querySelector('.dark\\:text-gray-100')).toBeInTheDocument();
      document.documentElement.classList.remove('dark');
    });
  });
});

// Performance tests
describe('Performance Tests', () => {
  test('ChartWrapper renders efficiently', () => {
    const startTime = performance.now();
    
    const { container } = render(
      <ChartWrapper title="Performance Test">
        <div>Content</div>
      </ChartWrapper>
    );
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms
  });

  test('formatNumber performs efficiently', () => {
    const startTime = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      formatNumber(Math.random() * 1000000);
    }
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(50); // Should complete 1000 operations in under 50ms
  });
});

// Integration tests
describe('Integration Tests', () => {
  test('Chart components work together', () => {
    const salesData = generateTimeSeriesData(30);
    const categoryData = generateComparisonData(['A', 'B', 'C']);
    
    const { container } = render(
      <div>
        <MetricCard title="Total Sales" value={formatNumber(125000)} />
        <LineChart
          data={salesData}
          xAxisKey="date"
          yAxisKeys={["value"]}
          height={300}
        />
        <BarChart
          data={categoryData}
          xAxisKey="name"
          yAxisKey="value"
          height={300}
        />
      </div>
    );
    
    expect(container.querySelector('h3')?.textContent).toContain('Sales');
  });
});

// Accessibility tests
describe('Accessibility Tests', () => {
  test('MetricCard has proper semantic structure', () => {
    const { container } = render(
      <MetricCard title="Accessible Metric" value={100} />
    );
    
    const title = container.querySelector('h3');
    expect(title).toBeInTheDocument();
    expect(title?.tagName).toBe('H3');
  });

  test('ChartWrapper provides proper ARIA attributes', () => {
    const { container } = render(
      <ChartWrapper title="Accessible Chart" ariaLabel="Chart description">
        <div>Chart Content</div>
      </ChartWrapper>
    );
    
    expect(container.getAttribute('aria-label')).toBe('Chart description');
  });
});