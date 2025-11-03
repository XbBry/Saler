'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  FunnelChart,
  ComposedChart,
  ReferenceLine,
  ReferenceArea,
  Brush,
  ReferenceDot,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Layers,
  Zap,
  Brain,
  Settings,
  Download,
  Maximize2,
  Eye,
  Filter,
  RefreshCw,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Maximize,
  Minimize,
  RotateCcw,
  Save,
  Share2,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

// ==================== CHART TYPES & INTERFACES ====================

export type ChartType = 
  | 'line' 
  | 'area' 
  | 'bar' 
  | 'column'
  | 'pie' 
  | 'doughnut'
  | 'scatter' 
  | 'radar'
  | 'funnel'
  | 'heatmap'
  | 'bubble'
  | 'treemap';

export type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';

export interface ChartDataPoint {
  [key: string]: any;
  date?: string;
  label?: string;
  value?: number;
  name?: string;
}

export interface ChartConfig {
  colors: string[];
  showLegend: boolean;
  showTooltip: boolean;
  showGrid: boolean;
  showAnimation: boolean;
  xAxisKey?: string;
  yAxisKey?: string;
  fillArea?: boolean;
  strokeWidth?: number;
  dotRadius?: number;
  opacity?: number;
  enableBrush?: boolean;
  enableZoom?: boolean;
  responsive?: boolean;
}

export interface AdvancedChartProps {
  id: string;
  title: string;
  subtitle?: string;
  type: ChartType;
  data: ChartDataPoint[];
  config?: Partial<ChartConfig>;
  onDataPointClick?: (data: ChartDataPoint) => void;
  onRefresh?: () => void;
  onExport?: (format: string) => void;
  onSettings?: () => void;
  isLoading?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  height?: number;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  enableRealTime?: boolean;
  realTimeInterval?: number;
  customTooltip?: React.ComponentType<any>;
  customLegend?: React.ComponentType<any>;
}

// ==================== CHART COLORS & UTILITIES ====================

const CHART_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green  
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6366F1', // Indigo
];

const DEFAULT_CONFIG: ChartConfig = {
  colors: CHART_COLORS,
  showLegend: true,
  showTooltip: true,
  showGrid: true,
  showAnimation: true,
  fillArea: false,
  strokeWidth: 2,
  dotRadius: 4,
  opacity: 0.8,
  enableBrush: false,
  enableZoom: false,
  responsive: true,
};

const generateSampleData = (days: number = 30) => {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
      value: Math.floor(Math.random() * 1000) + 500,
      value2: Math.floor(Math.random() * 800) + 300,
      value3: Math.floor(Math.random() * 600) + 200,
      category: ['مبيعات', 'تسويق', 'دعم'][Math.floor(Math.random() * 3)],
      trend: Math.random() > 0.5 ? 'up' : 'down'
    });
  }
  
  return data;
};

const formatTooltipValue = (value: any, name: string) => {
  if (typeof value === 'number') {
    return [value.toLocaleString('ar-SA'), name];
  }
  return [value, name];
};

// ==================== CUSTOM TOOLTIP ====================

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatTooltipValue(entry.value, entry.name)[0]}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ==================== CHART RENDERERS ====================

const renderLineChart = (data: ChartDataPoint[], config: ChartConfig, onClick?: (data: ChartDataPoint) => void) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} onClick={onClick}>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis 
        dataKey={config.xAxisKey || 'label'} 
        tick={{ fontSize: 12 }}
        axisLine={{ stroke: '#E5E7EB' }}
      />
      <YAxis 
        tick={{ fontSize: 12 }}
        axisLine={{ stroke: '#E5E7EB' }}
      />
      {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
      {config.showLegend && <Legend />}
      
      <Line 
        type="monotone" 
        dataKey={config.yAxisKey || 'value'} 
        stroke={config.colors[0]} 
        strokeWidth={config.strokeWidth}
        dot={{ 
          fill: config.colors[0], 
          strokeWidth: 2, 
          r: config.dotRadius 
        }}
        activeDot={{ r: 6, fill: config.colors[0] }}
        animationDuration={config.showAnimation ? 1000 : 0}
      />
      
      {data[0]?.value2 && (
        <Line 
          type="monotone" 
          dataKey="value2" 
          stroke={config.colors[1]} 
          strokeWidth={config.strokeWidth}
          dot={{ 
            fill: config.colors[1], 
            strokeWidth: 2, 
            r: config.dotRadius 
          }}
          animationDuration={config.showAnimation ? 1200 : 0}
        />
      )}
    </LineChart>
  </ResponsiveContainer>
);

const renderAreaChart = (data: ChartDataPoint[], config: ChartConfig) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data}>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={config.xAxisKey || 'label'} tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
      {config.showLegend && <Legend />}
      
      <Area 
        type="monotone" 
        dataKey={config.yAxisKey || 'value'} 
        stackId="1"
        stroke={config.colors[0]} 
        fill={config.colors[0]}
        fillOpacity={config.opacity}
        animationDuration={config.showAnimation ? 1000 : 0}
      />
      
      {data[0]?.value2 && (
        <Area 
          type="monotone" 
          dataKey="value2" 
          stackId="1"
          stroke={config.colors[1]} 
          fill={config.colors[1]}
          fillOpacity={config.opacity}
          animationDuration={config.showAnimation ? 1200 : 0}
        />
      )}
    </AreaChart>
  </ResponsiveContainer>
);

const renderBarChart = (data: ChartDataPoint[], config: ChartConfig) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={config.xAxisKey || 'label'} tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
      {config.showLegend && <Legend />}
      
      <Bar 
        dataKey={config.yAxisKey || 'value'} 
        fill={config.colors[0]} 
        radius={[4, 4, 0, 0]}
        animationDuration={config.showAnimation ? 800 : 0}
      />
      
      {data[0]?.value2 && (
        <Bar 
          dataKey="value2" 
          fill={config.colors[1]} 
          radius={[4, 4, 0, 0]}
          animationDuration={config.showAnimation ? 1000 : 0}
        />
      )}
    </BarChart>
  </ResponsiveContainer>
);

const renderPieChart = (data: ChartDataPoint[], config: ChartConfig, onClick?: (data: ChartDataPoint) => void) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
        onClick={onClick}
        animationDuration={config.showAnimation ? 1000 : 0}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={config.colors[index % config.colors.length]} />
        ))}
      </Pie>
      {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
    </PieChart>
  </ResponsiveContainer>
);

const renderScatterChart = (data: ChartDataPoint[], config: ChartConfig) => (
  <ResponsiveContainer width="100%" height="100%">
    <ScatterChart data={data}>
      <CartesianGrid />
      <XAxis type="number" dataKey="x" name="X" />
      <YAxis type="number" dataKey="y" name="Y" />
      {config.showTooltip && (
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value: any, name: string) => [value.toFixed(2), name]}
        />
      )}
      <Scatter 
        dataKey="z" 
        fill={config.colors[0]}
        animationDuration={config.showAnimation ? 1000 : 0}
      />
    </ScatterChart>
  </ResponsiveContainer>
);

const renderRadarChart = (data: ChartDataPoint[], config: ChartConfig) => (
  <ResponsiveContainer width="100%" height="100%">
    <RadarChart data={data}>
      <PolarGrid />
      <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
      <PolarRadiusAxis tick={{ fontSize: 10 }} />
      <Radar
        name="القيم"
        dataKey="value"
        stroke={config.colors[0]}
        fill={config.colors[0]}
        fillOpacity={config.opacity}
        strokeWidth={2}
        animationDuration={config.showAnimation ? 1000 : 0}
      />
      {config.showTooltip && <Tooltip />}
    </RadarChart>
  </ResponsiveContainer>
);

// ==================== MAIN CHART COMPONENT ====================

export const AdvancedChart: React.FC<AdvancedChartProps> = ({
  id,
  title,
  subtitle,
  type,
  data,
  config = {},
  onDataPointClick,
  onRefresh,
  onExport,
  onSettings,
  isLoading = false,
  isExpanded = false,
  onToggleExpand,
  height = 400,
  className = '',
  theme = 'auto',
  enableRealTime = true,
  realTimeInterval = 30000,
  customTooltip,
  customLegend,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartConfig, setChartConfig] = useState({ ...DEFAULT_CONFIG, ...config });
  const [localData, setLocalData] = useState(data);

  // Update data when props change
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Real-time updates simulation
  useEffect(() => {
    if (!enableRealTime || type === 'pie' || type === 'radar') return;

    const interval = setInterval(() => {
      setLocalData(prevData => {
        const newData = [...prevData];
        const randomIndex = Math.floor(Math.random() * newData.length);
        const variation = (Math.random() - 0.5) * 0.1; // ±10% variation
        
        if (newData[randomIndex]) {
          newData[randomIndex] = {
            ...newData[randomIndex],
            value: Math.max(0, (newData[randomIndex].value || 0) * (1 + variation))
          };
        }
        
        return newData;
      });
    }, realTimeInterval);

    return () => clearInterval(interval);
  }, [enableRealTime, realTimeInterval, type]);

  const handleDataPointClick = (data: any, index: number) => {
    onDataPointClick?.(data);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    onToggleExpand?.();
  };

  const handleRefresh = () => {
    // Simulate refresh with new data
    setLocalData(generateSampleData(30));
    onRefresh?.();
  };

  const handleExport = (format: string) => {
    console.log(`تصدير الرسم البياني ${title} بصيغة ${format}`);
    onExport?.(format);
  };

  const renderChart = () => {
    const chartData = localData.length > 0 ? localData : generateSampleData(30);
    
    switch (type) {
      case 'line':
        return renderLineChart(chartData, chartConfig, handleDataPointClick);
      case 'area':
        return renderAreaChart(chartData, chartConfig);
      case 'bar':
        return renderBarChart(chartData, chartConfig);
      case 'column':
        return renderBarChart(chartData, chartConfig);
      case 'pie':
        return renderPieChart(chartData, chartConfig, handleDataPointClick);
      case 'doughnut':
        return renderPieChart(chartData, chartConfig, handleDataPointClick);
      case 'scatter':
        return renderScatterChart(chartData, chartConfig);
      case 'radar':
        return renderRadarChart(chartData, chartConfig);
      default:
        return renderLineChart(chartData, chartConfig);
    }
  };

  const LoadingSkeleton = () => (
    <div className="h-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mx-auto mb-4"></div>
        <p className="text-gray-400 dark:text-gray-500">جاري التحميل...</p>
      </div>
    </div>
  );

  const chartContainer = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`relative ${className}`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          {/* Real-time indicator */}
          {enableRealTime && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-green-500 rounded-full"
              title="تحديثات فورية"
            />
          )}

          {/* Chart controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport('csv')}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSettings}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="relative flex-1" style={{ height: isFullscreen ? 'calc(100vh - 80px)' : height - 80 }}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${type}-${localData.length}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderChart()}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Chart Stats */}
      {!isLoading && localData.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-1">
          <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-600 dark:text-gray-300">
            <span>البيانات: {localData.length}</span>
            <span>النوع: {type}</span>
            {type === 'line' && (
              <span>
                الاتجاه: {localData[localData.length - 1]?.value > localData[0]?.value ? (
                  <ArrowUpRight className="inline h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="inline h-3 w-3 text-red-500" />
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );

  if (isFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-white dark:bg-gray-900 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title} - ملء الشاشة
          </h2>
          <Button
            variant="outline"
            onClick={toggleFullscreen}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <Minimize className="h-4 w-4" />
            <span>خروج</span>
          </Button>
        </div>
        {chartContainer}
      </motion.div>
    );
  }

  return (
    <Card className="p-6 h-full">
      {chartContainer}
    </Card>
  );
};

// ==================== CHART GRID COMPONENT ====================

interface ChartGridProps {
  charts: Array<{
    id: string;
    title: string;
    type: ChartType;
    data: ChartDataPoint[];
    config?: Partial<ChartConfig>;
  }>;
  layout?: 'grid' | 'masonry';
  columns?: number;
  onChartClick?: (chartId: string, data: ChartDataPoint) => void;
  onChartRefresh?: (chartId: string) => void;
  onChartExport?: (chartId: string, format: string) => void;
  enableRealTime?: boolean;
  className?: string;
}

export const AdvancedChartGrid: React.FC<ChartGridProps> = ({
  charts,
  layout = 'grid',
  columns = 3,
  onChartClick,
  onChartRefresh,
  onChartExport,
  enableRealTime = true,
  className = ''
}) => {
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns as keyof typeof gridCols] || gridCols[3]} gap-6 ${className}`}>
      <AnimatePresence>
        {charts.map((chart, index) => (
          <motion.div
            key={chart.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={selectedChart === chart.id ? 'ring-2 ring-blue-500' : ''}
          >
            <AdvancedChart
              id={chart.id}
              title={chart.title}
              type={chart.type}
              data={chart.data}
              config={chart.config}
              onDataPointClick={(data) => onChartClick?.(chart.id, data)}
              onRefresh={() => onChartRefresh?.(chart.id)}
              onExport={(format) => onChartExport?.(chart.id, format)}
              enableRealTime={enableRealTime}
              height={300}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedChart;
