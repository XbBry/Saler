// Main chart components
export { default as ChartWrapper, type ChartWrapperProps, type CustomTooltipProps } from './ChartWrapper';
export { default as LineChart } from './LineChart';
export { default as BarChart } from './BarChart';
export { default as PieChart } from './PieChart';
export { default as DoughnutChart } from './DoughnutChart';
export { default as AreaChart } from './AreaChart';
export { default as MetricCard } from './MetricCard';

// Advanced chart components
export { default as HeatMap, type HeatMapProps } from './HeatMap';
export { default as SankeyDiagram, type SankeyDiagramProps, createFunnelData, createUserJourneyData, createRevenueFlowData } from './SankeyDiagram';
export { default as Scatter3D, type Scatter3DProps, generateScatter3DData, generateCorrelatedScatter3DData } from './Scatter3D';
export { default as Treemap, type TreemapProps, createCategoryTreemap, createHierarchicalTreemap, generateSalesTreemap } from './Treemap';

// Legacy exports for backward compatibility
export { LineChartComponent } from './LineChartComponent';
export { BarChartComponent } from './BarChartComponent';
export { PieChartComponent } from './PieChartComponent';
export { AreaChartComponent } from './AreaChartComponent';

// Utility exports for shared types and functions
export type {
  ChartWrapperProps,
  CustomTooltipProps,
  LineChartProps,
  BarChartProps,
  PieChartProps,
  DoughnutChartProps,
  AreaChartProps,
  MetricCardProps,
  ColorPalette,
  TimeSeriesDataPoint,
  ComparisonDataPoint,
  MetricData,
  ChartPresets,
  ChartPreset,
  NumberFormatter,
  PercentageFormatter,
  CurrencyFormatter,
  ValueFormatter,
  TrendFormatter,
  LabelFormatter,
  TooltipFormatter,
  ChartClickHandler,
  ChartHoverHandler,
  MetricClickHandler,
  TrendClickHandler,
  IconColor,
  MetricTrend,
  ChartVariant,
  MetricSize,
  ChartOrientation,
  LegendPosition,
  CurveType,
  StrokeLinecap,
  AnimationEasing,
  BaseChartProps,
  ChartDataProps,
  ChartAxisProps,
  ChartStylingProps,
  ChartInteractiveProps,
} from './types';

// Color schemes for charts
export const chartColors = {
  default: [
    '#3B82F6', // blue-500
    '#EF4444', // red-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#6B7280', // gray-500
    '#14B8A6', // teal-500
  ],
  pastel: [
    '#93C5FD', // blue-300
    '#FCA5A5', // red-300
    '#6EE7B7', // emerald-300
    '#FCD34D', // amber-300
    '#C4B5FD', // violet-300
    '#F9A8D4', // pink-300
    '#D1D5DB', // gray-300
    '#5EEAD4', // teal-300
  ],
  warm: [
    '#FB923C', // orange-400
    '#F87171', // red-400
    '#FBBF24', // amber-400
    '#F472B6', // pink-400
    '#A78BFA', // violet-400
    '#60A5FA', // blue-400
    '#34D399', // emerald-400
    '#F59E0B', // amber-500
  ],
  cool: [
    '#0EA5E9', // sky-500
    '#6366F1', // indigo-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#F43F5E', // rose-500
    '#EF4444', // red-500
    '#F97316', // orange-500
    '#EAB308', // yellow-500
  ],
  monochrome: [
    '#1F2937', // gray-800
    '#374151', // gray-700
    '#4B5563', // gray-600
    '#6B7280', // gray-500
    '#9CA3AF', // gray-400
    '#D1D5DB', // gray-300
    '#E5E7EB', // gray-200
    '#F3F4F6', // gray-100
  ]
};

// Utility functions for data formatting
export const formatNumber = (value: number, precision: number = 1): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(precision)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(precision)}K`;
  }
  return value.toLocaleString('ar-EG', { 
    maximumFractionDigits: precision 
  });
};

export const formatPercentage = (value: number, precision: number = 1): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(precision)}%`;
};

export const formatCurrency = (
  value: number, 
  currency: string = 'SAR', 
  precision: number = 0
): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(value);
};

// Sample data generators for demo purposes
export const generateTimeSeriesData = (days: number = 30) => {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 1000) + 100,
      label: date.toLocaleDateString('ar-SA', { 
        month: 'short', 
        day: 'numeric' 
      })
    });
  }
  
  return data;
};

export const generateComparisonData = (categories: string[] = []) => {
  return categories.map(category => ({
    name: category,
    value: Math.floor(Math.random() * 100) + 10,
    percentage: Math.floor(Math.random() * 100)
  }));
};

export const generateMetricData = (baseValue: number = 1000) => {
  return {
    current: baseValue,
    previous: Math.floor(baseValue * (0.8 + Math.random() * 0.4)),
    growth: ((Math.random() - 0.5) * 20).toFixed(1)
  };
};

// Chart configuration presets
export const chartPresets = {
  sales: {
    colors: chartColors.warm,
    title: 'المبيعات',
    description: 'أداء المبيعات الشهري'
  },
  analytics: {
    colors: chartColors.cool,
    title: 'التحليلات',
    description: 'مؤشرات الأداء الرئيسية'
  },
  performance: {
    colors: chartColors.default,
    title: 'الأداء',
    description: 'مقاييس الأداء المختلفة'
  },
  users: {
    colors: chartColors.pastel,
    title: 'المستخدمين',
    description: 'إحصائيات المستخدمين'
  }
};

// Example exports for documentation
export { ChartsExample, SalesDashboard } from './Examples';