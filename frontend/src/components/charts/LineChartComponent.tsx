'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LineChartComponentProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  title?: string;
  color?: string;
  className?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  dateFormat?: string;
  formatter?: (value: any, name: string) => [any, string];
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  dataKey,
  xAxisKey,
  title,
  color = '#3B82F6',
  className = '',
  height = 300,
  showGrid = true,
  showLegend = false,
  dateFormat,
  formatter,
}) => {
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

  const defaultFormatter = (value: any, name: string) => {
    return [value, name || dataKey];
  };

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12 }}
            tickFormatter={formatXAxis}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            labelFormatter={formatXAxis}
            formatter={formatter || defaultFormatter}
          />
          {showLegend && <Legend />}
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};