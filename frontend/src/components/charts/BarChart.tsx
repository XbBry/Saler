import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ChartWrapper, CustomTooltip, CustomCartesianGrid } from './ChartWrapper';

interface BarChartProps {
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

const defaultColors = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#6B7280', // gray-500
  '#14B8A6', // teal-500
];

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  description,
  loading = false,
  error = null,
  height = 300,
  className,
  
  xAxisKey,
  yAxisKey,
  yAxisKeys,
  yAxisLabels,
  
  colors = defaultColors,
  barSize = 30,
  barRadius = [2, 2, 0, 0],
  
  orientation = 'vertical',
  stacked = false,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  
  strokeWidth = 1,
  strokeOpacity = 0.8,
  
  yAxisDomain,
  xAxisDomain,
  
  referenceLines = [],
  
  tooltipFormatter,
  labelFormatter
}) => {
  const isDark = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('dark');

  // Determine if we have multiple bars or single bar
  const barsData = yAxisKey 
    ? [{ key: yAxisKey, label: yAxisLabels?.[yAxisKey] || yAxisKey }]
    : (yAxisKeys || []).map(key => ({
        key,
        label: yAxisLabels?.[key] || key
      }));

  const formatAxisTick = (value: number | string) => {
    if (typeof value === 'number' && value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (typeof value === 'number' && value >= 1000) {
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
      formatter: formatAxisTick
    },
    domain: xAxisDomain,
    label: {
      value: orientation === 'horizontal' ? 'القيمة' : 'الفئات',
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
      formatter: formatAxisTick
    },
    domain: yAxisDomain,
    label: {
      value: orientation === 'horizontal' ? 'الفئات' : 'القيمة',
      angle: -90,
      position: 'insideLeft',
      style: { textAnchor: 'middle' }
    }
  };

  const barsConfig = barsData.map((bar, index) => (
    <Bar
      key={bar.key}
      dataKey={bar.key}
      fill={colors[index % colors.length]}
      fillOpacity={strokeOpacity}
      stroke={colors[index % colors.length]}
      strokeWidth={strokeWidth}
      barSize={barSize}
      radius={barRadius}
      stackId={stacked ? 'stack' : undefined}
      name={bar.label}
    />
  ));

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
        <RechartsBarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
          layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
        >
          {showGrid && (
            <CustomCartesianGrid 
              stroke={isDark ? '#374151' : '#E5E7EB'}
              strokeDasharray="3 3"
            />
          )}
          
          {orientation === 'horizontal' ? (
            <>
              <YAxis {...yAxisSettings} />
              <XAxis {...xAxisSettings} />
            </>
          ) : (
            <>
              <XAxis {...xAxisSettings} />
              <YAxis {...yAxisSettings} />
            </>
          )}
          
          {barsConfig}
          
          {referenceLines.map((refLine, index) => {
            if (orientation === 'horizontal' && refLine.x !== undefined) {
              return (
                <ReferenceLine
                  key={index}
                  x={refLine.x}
                  stroke={refLine.stroke || colors[index % colors.length]}
                  strokeDasharray={refLine.strokeDasharray || '5 5'}
                  label={{
                    value: refLine.label,
                    position: 'top',
                    style: {
                      fill: refLine.stroke || colors[index % colors.length],
                      fontSize: '12px'
                    }
                  }}
                />
              );
            } else if (refLine.y !== undefined) {
              return (
                <ReferenceLine
                  key={index}
                  y={refLine.y}
                  stroke={refLine.stroke || colors[index % colors.length]}
                  strokeDasharray={refLine.strokeDasharray || '5 5'}
                  label={{
                    value: refLine.label,
                    position: 'left',
                    style: {
                      fill: refLine.stroke || colors[index % colors.length],
                      fontSize: '12px'
                    }
                  }}
                />
              );
            }
            return null;
          })}
          
          <Tooltip
            content={
              <CustomTooltip
                formatter={tooltipFormatter}
                labelFormatter={labelFormatter}
              />
            }
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export default BarChart;