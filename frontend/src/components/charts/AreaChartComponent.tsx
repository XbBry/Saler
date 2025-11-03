'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AreaChartComponentProps {
  data: any[];
  dataKeys: { key: string; color?: string; name?: string }[];
  xAxisKey: string;
  title?: string;
  className?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  dateFormat?: string;
}

export const AreaChartComponent: React.FC<AreaChartComponentProps> = ({
  data,
  dataKeys,
  xAxisKey,
  title,
  className = '',
  height = 300,
  showGrid = true,
  showLegend = true,
  stacked = false,
  dateFormat,
}) => {
  const defaultColors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(6, 182, 212, 0.8)',
  ];

  const formatXAxis = (tickItem: any) => {
    if (dateFormat && xAxisKey === 'date') {
      try {
        return new Date(tickItem).toLocaleDateString('ar-SA', {
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return tickItem;
      }
    }
    return tickItem;
  };

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12 }}
            tickFormatter={formatXAxis}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            labelFormatter={formatXAxis}
            formatter={(value: any, name: string) => [value, name]}
          />
          {showLegend && <Legend />}
          {dataKeys.map((item, index) => (
            <Area
              key={item.key}
              type="monotone"
              dataKey={item.key}
              stackId={stacked ? 'stack' : undefined}
              stroke={item.color || defaultColors[index].replace('0.8', '1')}
              fill={item.color || defaultColors[index]}
              strokeWidth={2}
              name={item.name}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};