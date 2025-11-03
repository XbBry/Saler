/**
 * HeatMap Component - خريطة حرارية لتحليل الارتباط والتوزيع
 * مخصص لعرض البيانات الترسمية والارتباطات
 */

import React, { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

interface HeatMapData {
  category: string;
  [metric: string]: number | string;
}

interface HeatMapProps {
  data: HeatMapData[];
  xAxisKey: string;
  yAxisKey: string;
  valueKey: string;
  colorScheme?: 'blues' | 'greens' | 'reds' | 'purples' | 'viridis';
  height?: number;
  width?: number;
  showLabels?: boolean;
  onCellClick?: (data: any, index: number) => void;
}

const colorSchemes = {
  blues: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  greens: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'],
  reds: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  purples: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7c3aed', '#6d28d9', '#5b21b6'],
  viridis: ['#440154', '#482374', '#414487', '#355f8d', '#2a788e', '#21908c', '#22a884', '#42be71', '#7ad151', '#bddf26', '#fde725'],
};

const getHeatMapColor = (value: number, maxValue: number, scheme: string = 'blues') => {
  const colors = colorSchemes[scheme as keyof typeof colorSchemes] || colorSchemes.blues;
  const ratio = Math.min(Math.max(value / maxValue, 0), 0.999);
  const index = Math.floor(ratio * (colors.length - 1));
  return colors[index];
};

export const HeatMap: React.FC<HeatMapProps> = ({
  data,
  xAxisKey,
  yAxisKey,
  valueKey,
  colorScheme = 'blues',
  height = 400,
  width,
  showLabels = true,
  onCellClick,
}) => {
  const processedData = useMemo(() => {
    const categories = data.map(item => item[xAxisKey]);
    const metrics = Object.keys(data[0] || {}).filter(key => key !== xAxisKey && key !== yAxisKey);
    
    const maxValue = Math.max(...data.map(item => 
      Math.max(...metrics.map(metric => Number(item[metric]) || 0))
    ));

    return {
      categories,
      metrics,
      maxValue,
      formattedData: data.map((item, index) => ({
        ...item,
        index,
        categoryIndex: index,
      })),
    };
  }, [data, xAxisKey, yAxisKey, valueKey]);

  const CustomHeatMapCell = (props: any) => {
    const { payload, x, y, width, height, index } = props;
    const value = Number(payload[valueKey]) || 0;
    const color = getHeatMapColor(value, processedData.maxValue, colorScheme);
    
    return (
      <g onClick={() => onCellClick?.(payload, index)} className="cursor-pointer">
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          stroke="#fff"
          strokeWidth={1}
        />
        {showLabels && value > 0 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={value > processedData.maxValue * 0.5 ? '#fff' : '#000'}
            fontSize={12}
            fontWeight="bold"
          >
            {value}
          </text>
        )}
      </g>
    );
  };

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={processedData.formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            dataKey={yAxisKey} 
            tick={{ fontSize: 12 }}
            width={80}
          />
          <Tooltip 
            formatter={(value: any, name: string) => [value.toLocaleString('ar-SA'), name]}
            labelFormatter={(label) => `${label}`}
          />
          {processedData.metrics.length > 0 && (
            <Legend />
          )}
          {processedData.metrics.map((metric, index) => (
            <Bar
              key={metric}
              dataKey={metric}
              fill={colorSchemes[colorScheme as keyof typeof colorSchemes][index % 10]}
              shape={(props: any) => {
                const { payload, x, y, width, height } = props;
                const value = Number(payload[metric]) || 0;
                const fillColor = getHeatMapColor(value, processedData.maxValue, colorScheme);
                
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fillColor}
                    stroke="#fff"
                    strokeWidth={1}
                    onClick={() => onCellClick?.(payload, index)}
                    className="cursor-pointer"
                  />
                );
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HeatMap;