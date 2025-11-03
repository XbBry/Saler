'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartComponentProps {
  data: any[];
  dataKeys: { key: string; color?: string; name?: string }[];
  xAxisKey: string;
  title?: string;
  className?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  dataKeys,
  xAxisKey,
  title,
  className = '',
  height = 300,
  showGrid = true,
  showLegend = true,
  stacked = false,
  horizontal = false,
}) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout={horizontal ? 'horizontal' : 'vertical'}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          {horizontal ? (
            <>
              <XAxis type="number" />
              <YAxis dataKey={xAxisKey} type="category" width={80} />
            </>
          ) : (
            <>
              <XAxis dataKey={xAxisKey} />
              <YAxis />
            </>
          )}
          <Tooltip />
          {showLegend && <Legend />}
          {dataKeys.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              stackId={stacked ? 'stack' : undefined}
              fill={item.color || colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
              name={item.name}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};