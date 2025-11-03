/**
 * Treemap Component - خريطة شجرية
 * مخصص لعرض البيانات الهرمية بشكل بصري جذاب
 */

import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, Treemap as RechartsTreemap } from 'recharts';

interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
  color?: string;
  [key: string]: any;
}

interface TreemapProps {
  data: TreemapNode[];
  width?: number;
  height?: number;
  colors?: string[];
  showLabels?: boolean;
  labelKey?: string;
  dataKey?: string;
  colorScale?: 'linear' | 'categorical' | 'hierarchy';
  maxColor?: string;
  minColor?: string;
  borderColor?: string;
  borderWidth?: number;
  onNodeClick?: (node: TreemapNode, index: number) => void;
  onNodeHover?: (node: TreemapNode, index: number) => void;
}

const defaultColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', 
  '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
];

const getColorByValue = (value: number, minValue: number, maxValue: number, colors: string[]) => {
  if (maxValue === minValue) return colors[0];
  
  const ratio = (value - minValue) / (maxValue - minValue);
  const index = Math.floor(ratio * (colors.length - 1));
  return colors[index];
};

const getCategoryColor = (name: string, categoryMap: Map<string, string>, colors: string[]) => {
  if (categoryMap.has(name)) {
    return categoryMap.get(name);
  }
  
  const color = colors[categoryMap.size % colors.length];
  categoryMap.set(name, color);
  return color;
};

const getHierarchyColor = (depth: number, colors: string[]) => {
  return colors[depth % colors.length];
};

export const Treemap: React.FC<TreemapProps> = ({
  data,
  width,
  height = 400,
  colors = defaultColors,
  showLabels = true,
  labelKey = 'name',
  dataKey = 'value',
  colorScale = 'linear',
  maxColor = '#3B82F6',
  minColor = '#D1D5DB',
  borderColor = '#fff',
  borderWidth = 1,
  onNodeClick,
  onNodeHover,
}) => {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(new Set());

  const flatData = useMemo(() => {
    const flatten = (nodes: TreemapNode[], level: number = 0, parentIndex: number = -1): Array<TreemapNode & { level: number; parentIndex: number; index: number }> => {
      let result: Array<TreemapNode & { level: number; parentIndex: number; index: number }> = [];
      
      nodes.forEach((node, index) => {
        const flatNode = {
          ...node,
          level,
          parentIndex,
          index: result.length,
        };
        result.push(flatNode);
        
        if (node.children && node.children.length > 0) {
          result = result.concat(flatten(node.children, level + 1, flatNode.index));
        }
      });
      
      return result;
    };
    
    return flatten(data);
  }, [data]);

  const { minValue, maxValue } = useMemo(() => {
    const values = flatData.map(node => node[dataKey] as number);
    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
    };
  }, [flatData, dataKey]);

  const categoryMap = useMemo(() => new Map<string, string>(), []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            {data[labelKey]}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">القيمة:</span> {Number(data[dataKey]).toLocaleString('ar-SA')}
          </p>
          {data.level > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">المستوى:</span> {data.level}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">النسبة:</span> {((Number(data[dataKey]) / maxValue) * 100).toFixed(1)}%
          </p>
          {onNodeHover && (
            <button
              onClick={() => onNodeHover(data, data.index)}
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

  const CustomContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload } = props;
    
    const getNodeColor = () => {
      switch (colorScale) {
        case 'categorical':
          return getCategoryColor(payload[labelKey], categoryMap, colors);
        case 'hierarchy':
          return getHierarchyColor(depth, colors);
        case 'linear':
        default:
          return getColorByValue(Number(payload[dataKey]), minValue, maxValue, colors);
      }
    };

    const color = getNodeColor();
    const isHovered = hoveredNode === index;
    const isSelected = selectedNodes.has(index);
    
    const opacity = isHovered || isSelected ? 0.9 : 0.7;
    const strokeWidth = isHovered || isSelected ? 3 : borderWidth;
    const strokeColor = isHovered ? '#2563EB' : isSelected ? '#7C3AED' : borderColor;

    const shouldShowLabel = showLabels && width > 60 && height > 40;
    const fontSize = Math.min(width / 10, height / 3, 12);
    const textColor = color === minColor ? '#374151' : '#fff';

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          fillOpacity={opacity}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          rx={4}
          className="cursor-pointer transition-all duration-200"
          onClick={() => onNodeClick?.(payload, index)}
          onMouseEnter={() => setHoveredNode(index)}
          onMouseLeave={() => setHoveredNode(null)}
        />
        {shouldShowLabel && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - fontSize / 3}
              textAnchor="middle"
              fontSize={fontSize}
              fontWeight="bold"
              fill={textColor}
              className="pointer-events-none select-none"
            >
              {payload[labelKey]}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + fontSize / 3}
              textAnchor="middle"
              fontSize={fontSize * 0.8}
              fill={textColor}
              className="pointer-events-none select-none"
            >
              {Number(payload[dataKey]).toLocaleString('ar-SA')}
            </text>
          </>
        )}
        {depth > 0 && (
          <text
            x={x + 5}
            y={y + 15}
            fontSize={10}
            fill={textColor}
            opacity={0.7}
            className="pointer-events-none"
          >
            مستوى {depth}
          </text>
        )}
      </g>
    );
  };

  const handleNodeClick = (node: TreemapNode, index: number) => {
    const newSelected = new Set(selectedNodes);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedNodes(newSelected);
    onNodeClick?.(node, index);
  };

  const clearSelection = () => {
    setSelectedNodes(new Set());
  };

  return (
    <div style={{ width: width || '100%', height }} className="relative">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2 space-x-reverse">
        {selectedNodes.size > 0 && (
          <button
            onClick={clearSelection}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
          >
            إلغاء التحديد ({selectedNodes.size})
          </button>
        )}
        
        <div className="flex items-center space-x-2 space-x-reverse px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
          <div className="w-16 h-3 bg-gradient-to-r from-gray-200 to-blue-500 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {minValue.toLocaleString('ar-SA')} - {maxValue.toLocaleString('ar-SA')}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <RechartsTreemap
          data={flatData}
          dataKey={dataKey}
          ratio={4/3}
          stroke={borderColor}
          fill={colors[0]}
          content={<CustomContent />}
        />
      </ResponsiveContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          التسلسل اللوني
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="text-xs text-gray-600">{minValue.toLocaleString('ar-SA')}</span>
          <div className="w-24 h-3 bg-gradient-to-r from-gray-200 via-blue-300 to-blue-600 rounded"></div>
          <span className="text-xs text-gray-600">{maxValue.toLocaleString('ar-SA')}</span>
        </div>
      </div>
    </div>
  );
};

// Utility functions for common use cases
export const createCategoryTreemap = (categories: Array<{ name: string; value: number; color?: string }>): TreemapNode[] => {
  return categories.map(category => ({
    name: category.name,
    value: category.value,
    color: category.color,
  }));
};

export const createHierarchicalTreemap = (rootName: string, children: Array<{ name: string; value: number; children?: Array<{ name: string; value: number }> }>): TreemapNode => {
  return {
    name: rootName,
    value: children.reduce((sum, child) => sum + child.value, 0),
    children: children.map(child => ({
      ...child,
      children: child.children || undefined,
    })),
  };
};

export const generateSalesTreemap = (): TreemapNode => {
  const regions = [
    {
      name: 'المنطقة الشمالية',
      children: [
        { name: 'الرياض', value: 850000 },
        { name: 'القصيم', value: 420000 },
        { name: 'حائل', value: 280000 },
        { name: 'تبوك', value: 320000 },
      ],
    },
    {
      name: 'المنطقة الغربية',
      children: [
        { name: 'جدة', value: 920000 },
        { name: 'مكة', value: 680000 },
        { name: 'المدينة', value: 540000 },
        { name: 'الطائف', value: 390000 },
      ],
    },
    {
      name: 'المنطقة الشرقية',
      children: [
        { name: 'الدمام', value: 780000 },
        { name: 'الخبر', value: 560000 },
        { name: 'القطيف', value: 340000 },
        { name: 'الأحساء', value: 450000 },
      ],
    },
    {
      name: 'المنطقة الجنوبية',
      children: [
        { name: 'أبها', value: 620000 },
        { name: 'خميس مشيط', value: 480000 },
        { name: 'جازان', value: 370000 },
        { name: 'نجران', value: 290000 },
      ],
    },
  ];

  return createHierarchicalTreemap('المبيعات الإجمالية', regions);
};

export default Treemap;