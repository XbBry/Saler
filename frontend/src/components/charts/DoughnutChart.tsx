import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { ChartWrapper, CustomTooltip } from './ChartWrapper';

interface DoughnutChartProps {
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
  innerRadius?: number; // Default is larger for donut
  centerText?: {
    value: string | number;
    subValue?: string | number;
    formatter?: (value: any) => string;
  };
  
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
  activeShape?: React.ReactNode;
  onClick?: (data: any, index: number) => void;
  onMouseEnter?: (data: any, index: number) => void;
  onMouseLeave?: (data: any, index: number) => void;
  
  // Legend
  showLegend?: boolean;
  legendFormatter?: (value: string, entry: any) => string;
  legendPosition?: 'bottom' | 'top' | 'left' | 'right';
  
  // Animations
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  
  // Custom tooltip
  tooltipFormatter?: (value: any, name: string) => [string, string];
  tooltipLabelFormatter?: (label: string) => string;
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

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  data,
  title,
  description,
  loading = false,
  error = null,
  height = 300,
  className,
  
  dataKey,
  nameKey = 'name',
  valueKey = 'value',
  
  colors = defaultColors,
  outerRadius = 80,
  innerRadius = 50, // Default donut radius
  
  centerText,
  
  cx = '50%',
  cy = '45%',
  paddingAngle = 2,
  
  strokeWidth = 2,
  strokeColor = '#ffffff',
  showLabel = false,
  labelFormatter,
  labelLine = false,
  
  activeIndex,
  activeShape,
  onClick,
  onMouseEnter,
  onMouseLeave,
  
  showLegend = true,
  legendFormatter,
  legendPosition = 'bottom',
  
  animationDuration = 800,
  animationEasing = 'ease-out',
  
  tooltipFormatter,
  tooltipLabelFormatter
}) => {
  const isDark = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('dark');

  // Format data to ensure proper structure
  const formattedData = data.map((item, index) => ({
    ...item,
    name: item[nameKey],
    value: item[valueKey],
    fill: colors[index % colors.length]
  }));

  // Calculate percentages and totals
  const total = formattedData.reduce((sum, item) => sum + (item.value || 0), 0);
  const dataWithPercentage = formattedData.map(item => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
  }));

  // Center text calculations
  const centerYOffset = innerRadius > 0 ? 0 : 20;
  const centerXOffset = 0;

  // Formatter for center text
  const formatCenterText = (value: any) => {
    if (centerText?.formatter) {
      return centerText.formatter(value);
    }
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value.toString();
  };

  const renderCenterText = () => {
    if (!centerText || !innerRadius || innerRadius <= 0) return null;
    
    const cxNum = typeof cx === 'string' ? parseFloat(cx.replace('%', '')) : cx;
    const cyNum = typeof cy === 'string' ? parseFloat(cy.replace('%', '')) : cy;
    
    return (
      <foreignObject
        x={`calc(${cxNum}% - ${innerRadius}px)`}
        y={`calc(${cyNum}% - ${innerRadius}px + ${centerYOffset}px)`}
        width={innerRadius * 2}
        height={innerRadius * 2}
        style={{ pointerEvents: 'none' }}
      >
        <div 
          className="flex flex-col items-center justify-center h-full w-full text-center"
          style={{ 
            direction: 'rtl',
            color: isDark ? '#F9FAFB' : '#111827'
          }}
        >
          {centerText.value && (
            <div className="font-bold text-lg leading-tight">
              {formatCenterText(centerText.value)}
            </div>
          )}
          {centerText.subValue && (
            <div 
              className="text-sm font-medium mt-1 opacity-70"
              style={{ color: isDark ? '#D1D5DB' : '#6B7280' }}
            >
              {formatCenterText(centerText.subValue)}
            </div>
          )}
        </div>
      </foreignObject>
    );
  };

  const renderCustomizedLabel = (entry: any) => {
    if (!showLabel) return null;
    
    const percent = parseFloat(entry.percentage);
    if (percent < 5) return null; // Don't show labels for slices < 5%
    
    if (labelFormatter) {
      return labelFormatter(entry.value, entry);
    }
    
    return `${percent}%`;
  };

  const renderActiveShape = (props: any) => {
    if (activeShape) return activeShape;
    
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill
    } = props;

    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my + (sin >= 0 ? 1 : -1) * 22;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <path
          d={`M ${sx},${sy} L ${mx},${my} L ${ex},${ey}`}
          stroke={fill}
          fill="none"
          strokeWidth={2}
        />
        <circle cx={ex} cy={ey} r={3} fill={fill} />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 8}
          y={ey}
          textAnchor={textAnchor}
          fill={isDark ? '#F9FAFB' : '#111827'}
          fontSize={12}
          fontWeight={600}
        >
          {`${props.payload.name}: ${props.payload.percentage}%`}
        </text>
      </g>
    );
  };

  const isHorizontalLegend = legendPosition === 'left' || legendPosition === 'right';
  const legendSettings = {
    verticalAlign: isHorizontalLegend ? 'middle' : (legendPosition === 'top' ? 'top' : 'bottom'),
    align: isHorizontalLegend ? (legendPosition === 'left' ? 'left' : 'right') : 'center',
    wrapperStyle: {
      padding: isHorizontalLegend ? '0 0 0 20px' : '20px 0 0 0',
      fontSize: '14px',
      color: isDark ? '#D1D5DB' : '#6B7280'
    },
    formatter: legendFormatter,
    iconSize: 12,
    iconType: 'circle'
  };

  return (
    <ChartWrapper
      title={title}
      description={description}
      loading={loading}
      error={error}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={dataWithPercentage}
            cx={cx}
            cy={typeof cy === 'string' ? cy : `calc(${cy}% + ${centerYOffset}px)`}
            labelLine={labelLine}
            label={renderCustomizedLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            paddingAngle={paddingAngle}
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            startAngle={90}
            endAngle={-270}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            animationDuration={animationDuration}
            animationEasing={animationEasing}
          >
            {dataWithPercentage.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fill}
                stroke={isDark ? '#1F2937' : '#ffffff'}
                strokeWidth={1}
              />
            ))}
          </Pie>
          
          <Tooltip
            content={
              <CustomTooltip
                formatter={(value, name) => {
                  if (tooltipFormatter) {
                    return tooltipFormatter(value, name);
                  }
                  return [value.toLocaleString(), name];
                }}
                labelFormatter={tooltipLabelFormatter}
              />
            }
          />
          
          {showLegend && (
            <Legend {...legendSettings} />
          )}
          
          {renderCenterText()}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export default DoughnutChart;