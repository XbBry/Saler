import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { ChartWrapper, CustomTooltip, CustomLegend, CustomCartesianGrid } from './ChartWrapper';

interface LineChartProps {
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

export const LineChart: React.FC<LineChartProps> = ({
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
  dotSize = 4,
  smooth = true,
  
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  
  strokeDasharray = '',
  strokeOpacity = 1,
  connectNulls = false,
  
  referenceLines = [],
  
  yAxisDomain,
  
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
      <RechartsLineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        {showGrid && (
          <CustomCartesianGrid 
            stroke={isDark ? '#374151' : '#E5E7EB'}
            strokeDasharray="3 3"
          />
        )}
        
        {showXAxis && <XAxis {...xAxisSettings} />}
        {showYAxis && <YAxis {...yAxisSettings} />}
        
        {yAxisKeys.map((key, index) => (
          <Line
            key={key}
            type={smooth ? 'monotone' : 'linear'}
            dataKey={key}
            stroke={colors[index % colors.length]}
            strokeWidth={strokeWidth}
            strokeOpacity={strokeOpacity}
            strokeDasharray={strokeDasharray}
            dot={{
              fill: colors[index % colors.length],
              strokeWidth: 2,
              r: dotSize,
              stroke: '#ffffff',
              strokeWidth: 2
            }}
            activeDot={{
              r: dotSize + 2,
              fill: colors[index % colors.length],
              stroke: '#ffffff',
              strokeWidth: 2
            }}
            connectNulls={connectNulls}
            name={yAxisLabels?.[key] || key}
          />
        ))}
        
        {referenceLines.map((refLine, index) => (
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
        ))}
        
        <Tooltip
          content={
            <CustomTooltip
              formatter={tooltipFormatter}
              labelFormatter={labelFormatter}
            />
          }
        />
        
        <CustomLegend payload={yAxisKeys.map((key, index) => ({
          id: key,
          value: yAxisLabels?.[key] || key,
          type: 'circle',
          color: colors[index % colors.length]
        }))} />
      </RechartsLineChart>
    </ChartWrapper>
  );
};

export default LineChart;