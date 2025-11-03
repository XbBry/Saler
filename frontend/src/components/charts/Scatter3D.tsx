/**
 * Scatter3D Component - مخطط نقاط ثلاثي الأبعاد
 * مخصص لعرض البيانات في فضاء ثلاثي الأبعاد
 */

import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

interface Scatter3DData {
  x: number;
  y: number;
  z: number;
  name?: string;
  category?: string;
  [key: string]: any;
}

interface Scatter3DProps {
  data: Scatter3DData[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  zAxisLabel?: string;
  width?: number;
  height?: number;
  colors?: string[];
  colorScale?: 'linear' | 'categorical';
  sizeScale?: number;
  opacity?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
  onPointClick?: (data: Scatter3DData, index: number) => void;
  onPointHover?: (data: Scatter3DData, index: number) => void;
}

const defaultColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', 
  '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
];

const getColorByValue = (value: number, maxValue: number, colors: string[]) => {
  const ratio = Math.min(Math.max(value / maxValue, 0), 0.999);
  const index = Math.floor(ratio * (colors.length - 1));
  return colors[index];
};

const getCategoryColor = (category: string, categoryMap: Map<string, string>, colors: string[]) => {
  if (categoryMap.has(category)) {
    return categoryMap.get(category);
  }
  
  const color = colors[categoryMap.size % colors.length];
  categoryMap.set(category, color);
  return color;
};

export const Scatter3D: React.FC<Scatter3DProps> = ({
  data,
  xAxisLabel = 'المحور X',
  yAxisLabel = 'المحور Y',
  zAxisLabel = 'المحور Z',
  width,
  height = 400,
  colors = defaultColors,
  colorScale = 'linear',
  sizeScale = 5,
  opacity = 0.8,
  showGrid = true,
  showLegend = true,
  showLabels = false,
  onPointClick,
  onPointHover,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const processedData = useMemo(() => {
    const maxX = Math.max(...data.map(d => d.x));
    const maxY = Math.max(...data.map(d => d.y));
    const maxZ = Math.max(...data.map(d => d.z));

    const categoryMap = new Map<string, string>();
    
    return data.map((point, index) => {
      const category = point.category || 'default';
      const color = colorScale === 'categorical' 
        ? getCategoryColor(category, categoryMap, colors)
        : getColorByValue(point.z, maxZ, colors);
      
      const size = Math.max(3, Math.min(20, (point.z / maxZ) * sizeScale * 5));
      
      return {
        ...point,
        index,
        color,
        size,
        opacity: selectedCategory === null || selectedCategory === category ? opacity : 0.3,
      };
    });
  }, [data, colors, colorScale, sizeScale, opacity, selectedCategory]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(data.map(d => d.category || 'default'))];
    return uniqueCategories;
  }, [data]);

  const maxValues = useMemo(() => ({
    x: Math.max(...data.map(d => d.x)),
    y: Math.max(...data.map(d => d.y)),
    z: Math.max(...data.map(d => d.z)),
  }), [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            {data.name || `النقطة ${data.index + 1}`}
          </p>
          {data.category && (
            <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
              {data.category}
            </p>
          )}
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">{xAxisLabel}:</span> {data.x.toFixed(2)}
            </p>
            <p className="text-sm">
              <span className="font-medium">{yAxisLabel}:</span> {data.y.toFixed(2)}
            </p>
            <p className="text-sm">
              <span className="font-medium">{zAxisLabel}:</span> {data.z.toFixed(2)}
            </p>
          </div>
          {onPointHover && (
            <button
              onClick={() => onPointHover(data, data.index)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              انقر للتفاصيل
            </button>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    const isHovered = hoveredPoint === index;
    const isSelected = selectedCategory === null || selectedCategory === payload.category;
    
    if (!isSelected) return null;

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? payload.size * 1.5 : payload.size}
          fill={payload.color}
          fillOpacity={payload.opacity}
          stroke={isHovered ? '#fff' : 'none'}
          strokeWidth={isHovered ? 2 : 0}
          className="cursor-pointer transition-all duration-200"
          onClick={() => onPointClick?.(payload, index)}
          onMouseEnter={() => setHoveredPoint(index)}
          onMouseLeave={() => setHoveredPoint(null)}
        />
        {showLabels && isHovered && payload.name && (
          <text
            x={cx}
            y={cy - payload.size - 5}
            textAnchor="middle"
            fontSize={12}
            fontWeight="bold"
            fill="#333"
            className="pointer-events-none"
          >
            {payload.name}
          </text>
        )}
      </g>
    );
  };

  const LegendItem = ({ payload }: any) => {
    const color = payload.color;
    const category = payload.category;
    
    return (
      <div
        className={`flex items-center space-x-2 space-x-reverse cursor-pointer p-2 rounded transition-colors ${
          selectedCategory === category || selectedCategory === null
            ? 'bg-gray-100 dark:bg-gray-700'
            : 'opacity-50'
        }`}
        onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
      >
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium">{category}</span>
        <span className="text-xs text-gray-500">
          ({data.filter(d => (d.category || 'default') === category).length})
        </span>
      </div>
    );
  };

  return (
    <div style={{ width: width || '100%', height }}>
      {/* Legend and Controls */}
      {showLegend && categories.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              selectedCategory === null
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            الكل ({data.length})
          </button>
          {categories.map(category => {
            const categoryData = data.filter(d => (d.category || 'default') === category);
            const color = getCategoryColor(category, new Map(), colors);
            
            return (
              <LegendItem
                key={category}
                payload={[{ color, category }]}
              />
            );
          })}
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
          data={processedData}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            type="number"
            dataKey="x"
            name={xAxisLabel}
            tick={{ fontSize: 12 }}
            label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
            domain={[0, maxValues.x * 1.1]}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yAxisLabel}
            tick={{ fontSize: 12 }}
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            domain={[0, maxValues.y * 1.1]}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && categories.length > 1 && (
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>
                  {value} ({data.filter(d => (d.category || 'default') === value).length})
                </span>
              )}
            />
          )}
          <Scatter
            data={processedData}
            shape={(props: any) => <CustomDot {...props} />}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Z-Axis Scale Reference */}
      <div className="mt-4 flex items-center justify-center space-x-4 space-x-reverse text-xs text-gray-500">
        <span>{zAxisLabel}</span>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span>{maxValues.z.toFixed(0)}</span>
          <div className="w-32 h-2 bg-gradient-to-r from-blue-200 via-yellow-200 to-red-200 rounded"></div>
          <span>0</span>
        </div>
      </div>
    </div>
  );
};

// Utility functions for generating test data
export const generateScatter3DData = (count: number = 100): Scatter3DData[] => {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 100,
    name: `نقطة ${i + 1}`,
    category: ['الفئة أ', 'الفئة ب', 'الفئة ج', 'الفئة د'][Math.floor(Math.random() * 4)],
  }));
};

export const generateCorrelatedScatter3DData = (count: number = 100, correlation: number = 0.7): Scatter3DData[] => {
  return Array.from({ length: count }, (_, i) => {
    const x = Math.random() * 100;
    const correlationNoise = correlation * Math.random() * 50;
    const x2 = Math.min(100, Math.max(0, x * correlation + correlationNoise));
    const x3 = Math.min(100, Math.max(0, x * correlation + Math.random() * 30));
    
    return {
      x,
      y: x2,
      z: x3,
      name: `نقطة ${i + 1}`,
      category: ['منخفض', 'متوسط', 'عالي'][Math.floor(Math.random() * 3)],
    };
  });
};

export default Scatter3D;