/**
 * Type definitions for chart components
 * تعريفات الأنواع لمكونات الرسوم البيانية
 */

import { ReactNode, MouseEvent } from 'react';
import { LucideIcon } from 'lucide-react';

// Chart Wrapper Types
export interface ChartWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  ariaLabel?: string;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  labelFormatter?: (label: string) => string;
  formatter?: (value: any, name: string) => [string, string];
}

// Line Chart Types
export interface LineChartProps {
  data: any[];
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  height?: number;
  className?: string;
  
  // Data mapping
  xAxisKey: string;
  yAxisKeys: string[];
  yAxisLabels?: { [key: string]: string };
  
  // Styling
  colors?: string[];
  strokeWidth?: number;
  dotSize?: number;
  smooth?: boolean;
  
  // Grid and axes
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  
  // Lines
  strokeDasharray?: string;
  strokeOpacity?: number;
  connectNulls?: boolean;
  
  // Reference lines
  referenceLines?: Array<{
    y: number;
    label?: string;
    stroke?: string;
    strokeDasharray?: string;
  }>;
  
  // Range
  yAxisDomain?: [number | string, number | string];
  
  // Custom tooltip
  tooltipFormatter?: (value: any, name: string) => [string, string];
  labelFormatter?: (label: string) => string;
}

// Bar Chart Types
export interface BarChartProps {
  data: any[];
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  height?: number;
  className?: string;
  
  // Data mapping
  xAxisKey: string;
  yAxisKey?: string;
  yAxisKeys?: string[];
  yAxisLabels?: { [key: string]: string };
  
  // Styling
  colors?: string[];
  barSize?: number;
  barRadius?: [number, number, number, number];
  
  // Layout
  orientation?: 'vertical' | 'horizontal';
  stacked?: boolean;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  
  // Customization
  strokeWidth?: number;
  strokeOpacity?: number;
  
  // Range
  yAxisDomain?: [number | string, number | string];
  xAxisDomain?: [number | string, number | string];
  
  // Reference lines
  referenceLines?: Array<{
    x?: number;
    y?: number;
    label?: string;
    stroke?: string;
    strokeDasharray?: string;
  }>;
  
  // Custom tooltip
  tooltipFormatter?: (value: any, name: string) => [string, string];
  labelFormatter?: (label: string) => string;
}

// Pie Chart Types
export interface PieChartProps {
  data: any[];
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  height?: number;
  className?: string;
  
  // Data mapping
  dataKey: string;
  nameKey?: string;
  valueKey?: string;
  
  // Styling
  colors?: string[];
  outerRadius?: number;
  innerRadius?: number;
  
  // Layout
  cx?: string | number;
  cy?: string | number;
  paddingAngle?: number;
  
  // Customization
  strokeWidth?: number;
  strokeColor?: string;
  showLabel?: boolean;
  labelFormatter?: (value: any, entry: any) => string;
  labelLine?: boolean;
  
  // Interactivity
  activeIndex?: number;
  activeShape?: ReactNode;
  onClick?: (data: any, index: number) => void;
  onMouseEnter?: (data: any, index: number) => void;
  onMouseLeave?: (data: any, index: number) => void;
  
  // Legend
  showLegend?: boolean;
  legendFormatter?: (value: string, entry: any) => string;
  legendPosition?: 'bottom' | 'top' | 'left' | 'right';
  
  // Custom tooltip
  tooltipFormatter?: (value: any, name: string) => [string, string];
  tooltipLabelFormatter?: (label: string) => string;
}

// Doughnut Chart Types
export interface DoughnutChartProps extends Omit<PieChartProps, 'innerRadius'> {
  innerRadius?: number; // Default is larger for donut
  centerText?: {
    value: string | number;
    subValue?: string | number;
    formatter?: (value: any) => string;
  };
  
  // Animations
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}

// Area Chart Types
export interface AreaChartProps {
  data: any[];
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  height?: number;
  className?: string;
  
  // Data mapping
  xAxisKey: string;
  yAxisKeys: string[];
  yAxisLabels?: { [key: string]: string };
  
  // Styling
  colors?: Array<{ fill: string; stroke: string }>;
  strokeWidth?: number;
  fillOpacity?: number;
  strokeOpacity?: number;
  
  // Layout
  stacked?: boolean;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  
  // Customization
  curveType?: 'basis' | 'linear' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'simple' | 'step' | 'stepBefore' | 'stepAfter';
  strokeLinecap?: 'butt' | 'round' | 'square';
  
  // Range
  yAxisDomain?: [number | string, number | string];
  
  // Brush (slider at bottom)
  showBrush?: boolean;
  brushHeight?: number;
  brushMargin?: { top?: number; left?: number; right?: number; bottom?: number };
  
  // Reference lines
  referenceLines?: Array<{
    y: number;
    label?: string;
    stroke?: string;
    strokeDasharray?: string;
  }>;
  
  // Custom tooltip
  tooltipFormatter?: (value: any, name: string) => [string, string];
  labelFormatter?: (label: string) => string;
}

// Metric Card Types
export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  
  // Trend analysis
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  trendLabel?: string;
  
  // Visual
  icon?: LucideIcon;
  iconColor?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'pink' | 'gray' | 'indigo';
  bgColor?: string;
  textColor?: string;
  
  // States
  loading?: boolean;
  error?: string | null;
  
  // Actions
  onClick?: () => void;
  onTrendClick?: () => void;
  
  // Formatting
  valueFormatter?: (value: string | number) => string;
  trendFormatter?: (value: number) => string;
  precision?: number;
  
  // Styling
  className?: string;
  variant?: 'default' | 'gradient' | 'outline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
}

// Color Palette Types
export interface ColorPalette {
  default: string[];
  pastel: string[];
  warm: string[];
  cool: string[];
  monochrome: string[];
}

// Data Generation Types
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label: string;
}

export interface ComparisonDataPoint {
  name: string;
  value: number;
  percentage: string;
}

export interface MetricData {
  current: number;
  previous: number;
  growth: string;
}

// Chart Preset Types
export interface ChartPreset {
  colors: string[];
  title: string;
  description: string;
}

export interface ChartPresets {
  sales: ChartPreset;
  analytics: ChartPreset;
  performance: ChartPreset;
  users: ChartPreset;
}

// Event Handler Types
export type ChartClickHandler = (data: any, index: number) => void;
export type ChartHoverHandler = (data: any, index: number) => void;
export type MetricClickHandler = () => void;
export type TrendClickHandler = (value: number, title: string) => void;

// Formatter Types
export type NumberFormatter = (value: number, precision?: number) => string;
export type PercentageFormatter = (value: number, precision?: number) => string;
export type CurrencyFormatter = (value: number, currency?: string, precision?: number) => string;
export type ValueFormatter = (value: string | number) => string;
export type TrendFormatter = (value: number) => string;
export type LabelFormatter = (value: any, entry: any) => string;
export type TooltipFormatter = (value: any, name: string) => [string, string];

// Utility Types
export type IconColor = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'pink' | 'gray' | 'indigo';
export type MetricTrend = 'up' | 'down' | 'neutral';
export type ChartVariant = 'default' | 'gradient' | 'outline' | 'minimal';
export type MetricSize = 'sm' | 'md' | 'lg';
export type ChartOrientation = 'vertical' | 'horizontal';
export type LegendPosition = 'bottom' | 'top' | 'left' | 'right';
export type CurveType = 'basis' | 'linear' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'simple' | 'step' | 'stepBefore' | 'stepAfter';
export type StrokeLinecap = 'butt' | 'round' | 'square';
export type AnimationEasing = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';

// Component Props Extensions
export interface BaseChartProps {
  data: any[];
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  height?: number;
  className?: string;
  onClick?: () => void;
}

export interface ChartDataProps {
  data: any[];
  dataKey: string;
  nameKey?: string;
  valueKey?: string;
}

export interface ChartAxisProps {
  xAxisKey: string;
  yAxisKey?: string;
  yAxisKeys?: string[];
  yAxisLabels?: { [key: string]: string };
  xAxisDomain?: [number | string, number | string];
  yAxisDomain?: [number | string, number | string];
}

export interface ChartStylingProps {
  colors?: string[];
  strokeWidth?: number;
  strokeOpacity?: number;
  fillOpacity?: number;
  className?: string;
}

export interface ChartInteractiveProps {
  onClick?: ChartClickHandler;
  onMouseEnter?: ChartHoverHandler;
  onMouseLeave?: ChartHoverHandler;
  activeIndex?: number;
  activeShape?: ReactNode;
}

// Re-export commonly used types
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
};