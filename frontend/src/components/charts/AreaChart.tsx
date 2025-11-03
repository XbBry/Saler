import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Brush,
  Tooltip
} from 'recharts';
import { ChartWrapper, CustomTooltip, CustomLegend, CustomCartesianGrid } from './ChartWrapper';

interface AreaChartProps {
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

const defaultColors = [
  {
    fill: '#3B82F6',
    stroke: '#2563EB'
  }, // blue
  {
    fill: '#EF4444',
    stroke: '#DC2626'
  }, // red
  {
    fill: '#10B981',
    stroke: '#059669'
  }, // emerald
  {
    fill: '#F59E0B',
    stroke: '#D97706'
  }, // amber
  {
    fill: '#8B5CF6',
    stroke: '#7C3AED'
  }, // violet
  {
    fill: '#EC4899',
    stroke: '#DB2777'
  }, // pink
  {
    fill: '#6B7280',
    stroke: '#4B5563'
  }, // gray
  {
    fill: '#14B8A6',
    stroke: '#0D9488'
  }, // teal
];

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  title,
  description,
  loading = false,
  error = null,
  height = 300,
  className,
  
  xAxisKey,
  yAxisKeys,
  yAxisLabels,
  
  colors = defaultColors,
  strokeWidth = 2,
  fillOpacity = 0.3,
  strokeOpacity = 1,
  
  stacked = false,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  
  curveType = 'monotone',
  strokeLinecap = 'round',
  
  yAxisDomain,
  
  showBrush = false,
  brushHeight = 20,
  brushMargin = { top: 20, right: 30, bottom: 0, left: 0 },
  
  referenceLines = [],
  
  tooltipFormatter,
  labelFormatter
}) => {
  const isDark = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('dark');

  const formatYAxisTick = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const xAxisSettings = {
    dataKey: xAxisKey,
    axisLine: false,
    tickLine: false,
    tickMargin: 10,
    tick: {
      fontSize: 12,
      fill: isDark ? '#9CA3AF' : '#6B7280',
    },
    label: {
      value: 'الوقت',
      position: 'insideBottom',
      offset: -10,
      style: { textAnchor: 'middle' }
    }
  };

  const yAxisSettings = {
    axisLine: false,
    tickLine: false,
    tickMargin: 10,
    tick: {
      fontSize: 12,
      fill: isDark ? '#9CA3AF' : '#6B7280',
      formatter: formatYAxisTick
    },
    domain: yAxisDomain || ['dataMin - 10', 'dataMax + 10'],
    label: {
      value: 'القيمة',
      angle: -90,
      position: 'insideLeft',
      style: { textAnchor: 'middle' }
    }
  };

  // Define gradients for areas
  const renderGradient = (colorIndex: number, opacity: number) => {
    const color = colors[colorIndex % colors.length];
    return (
      <linearGradient id={`areaGradient${colorIndex}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={color.fill} stopOpacity={opacity} />
        <stop offset="95%" stopColor={color.fill} stopOpacity={opacity * 0.1} />
      </linearGradient>
    );
  };

  const brushSettings = showBrush ? {
    height: brushHeight,
    margin: brushMargin,
    stroke: isDark ? '#6B7280' : '#9CA3AF',
    fill: isDark ? '#374151' : '#F3F4F6'
  } : undefined;

  return (
    <ChartWrapper
      title={title}
      description={description}
      loading={loading}
      error={error}
      height={height}
      className={className}
      showGrid={showGrid}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: showBrush ? 40 : 20,
          }}
        >
          <defs>
            {yAxisKeys.map((_, index) => (
              <React.Fragment key={index}>
                {renderGradient(index, fillOpacity)}
                <linearGradient id={`strokeGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[index % colors.length].stroke} stopOpacity={strokeOpacity} />
                  <stop offset="95%" stopColor={colors[index % colors.length].stroke} stopOpacity={strokeOpacity} />
                </linearGradient>
              </React.Fragment>
            ))}
          </defs>
          
          {showGrid && (
            <CustomCartesianGrid 
              stroke={isDark ? '#374151' : '#E5E7EB'}
              strokeDasharray="3 3"
            />
          )}
          
          {showXAxis && <XAxis {...xAxisSettings} />}
          {showYAxis && <YAxis {...yAxisSettings} />}
          
          {yAxisKeys.map((key, index) => (
            <Area
              key={key}
              type={curveType}
              dataKey={key}
              stroke={`url(#strokeGradient${index})`}
              strokeWidth={strokeWidth}
              fill={`url(#areaGradient${index})`}
              fillOpacity={1}
              strokeLinecap={strokeLinecap}
              stackId={stacked ? 'stack' : undefined}
              name={yAxisLabels?.[key] || key}
              dot={{
                fill: colors[index % colors.length].stroke,
                strokeWidth: 2,
                r: 4,
                stroke: '#ffffff',
                strokeWidth: 2
              }}
              activeDot={{
                r: 6,
                fill: colors[index % colors.length].stroke,
                stroke: '#ffffff',
                strokeWidth: 2
              }}
              connectNulls={false}
            />
          ))}
          
          {referenceLines.map((refLine, index) => (
            <ReferenceLine
              key={index}
              y={refLine.y}
              stroke={refLine.stroke || colors[index % colors.length].stroke}
              strokeDasharray={refLine.strokeDasharray || '5 5'}
              label={{
                value: refLine.label,
                position: 'left',
                style: {
                  fill: refLine.stroke || colors[index % colors.length].stroke,
                  fontSize: '12px'
                }
              }}
            />
          ))}
          
          <Tooltip
            content={
              <CustomTooltip
                formatter={tooltipFormatter}
                labelFormatter={labelFormatter}
              />
            }
          />
          
          {showBrush && <Brush {...brushSettings} />}
          
          <CustomLegend payload={yAxisKeys.map((key, index) => ({
            id: key,
            value: yAxisLabels?.[key] || key,
            type: 'circle',
            color: colors[index % colors.length].stroke
          }))} />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export default AreaChart;