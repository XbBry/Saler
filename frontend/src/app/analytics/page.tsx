'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  Treemap,
  Sankey,
  ComposedChart,
} from 'recharts';
import { format, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Star,
  DollarSign,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Thermometer,
  Zap,
  Brain,
  BarChart3,
  PieChart as PieChartIcon,
  Settings,
  Sun,
  Moon,
  Monitor,
  Bell,
  Search,
  Plus,
  Eye,
  EyeOff,
  Grid3X3,
  List,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Filter as FilterIcon,
  Layers,
  Scatter3D,
  Share2,
  BookOpen,
  TrendingDown as TrendingDownIcon,
  MousePointer,
  Layers3,
  Timer,
  Gauge,
  Archive,
  FileSpreadsheet,
  FileImage,
  FileText,
  Layout,
  Sliders,
  Bookmark,
  BookmarkCheck,
  Copy,
  Share,
  X,
  MoreVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import {
  LineChart,
  BarChart as ChartBar,
  PieChart as ChartPie,
  DoughnutChart,
  AreaChart as ChartArea,
  MetricCard as ChartMetricCard,
} from '../../components/charts';
import { useEnhancedAnalytics } from '../../hooks/use-enhanced-analytics';

// ==================== ENHANCED TYPES ====================

type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
type ChartType = 'line' | 'area' | 'bar' | 'pie' | 'doughnut' | 'scatter' | 'radar' | 'treemap' | 'sankey' | 'heatmap';
type ViewMode = 'grid' | 'list' | 'chart' | 'table';
type DashboardTheme = 'light' | 'dark' | 'auto';
type TimeResolution = 'hour' | 'day' | 'week' | 'month' | 'quarter';

interface AnalyticsWidget {
  id: string;
  type: ChartType;
  title: string;
  subtitle?: string;
  data: any[];
  config: WidgetConfig;
  position: { x: number; y: number; w: number; h: number };
  isExpanded?: boolean;
  isEditing?: boolean;
  isFavorite?: boolean;
}

interface WidgetConfig {
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  showAnimation?: boolean;
  xAxisKey?: string;
  yAxisKey?: string;
  fillArea?: boolean;
  strokeWidth?: number;
  dotRadius?: number;
  opacity?: number;
}

interface DashboardFilters {
  dateRange: { start: Date; end: Date };
  timeResolution: TimeResolution;
  metrics: string[];
  segments: string[];
  customFilters: Record<string, any>;
}

interface KPIMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  target?: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  trend: 'up' | 'down' | 'stable';
  progress?: number;
}

interface BusinessIntelligence {
  leadScoring: {
    totalLeads: number;
    hotLeads: number;
    avgScore: number;
    conversionProbability: number;
  };
  funnelAnalysis: {
    stages: Array<{ name: string; value: number; conversionRate: number }>;
    dropoffRate: number;
    bottleneck: string;
  };
  cohortAnalysis: {
    periods: Array<{ period: string; retention: number; customers: number }>;
  };
  revenueAttribution: {
    channels: Array<{ name: string; revenue: number; percentage: number }>;
    marketingROI: number;
  };
  churnPrediction: {
    riskScore: number;
    predictedChurnRate: number;
    atRiskCustomers: number;
  };
}

// ==================== UTILITY FUNCTIONS ====================

const generateRandomData = (days: number) => {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      label: format(date, 'dd MMM', { locale: ar }),
      value: Math.floor(Math.random() * 1000) + 500,
      value2: Math.floor(Math.random() * 800) + 300,
      value3: Math.floor(Math.random() * 600) + 200,
    });
  }
  return data;
};

const generateScatterData = () => {
  return Array.from({ length: 50 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 50 + 10,
    name: `نقطة ${i + 1}`,
  }));
};

const generateFunnelData = () => [
  { name: 'الزوار', value: 10000, conversionRate: 100 },
  { name: 'العملاء المحتملين', value: 3000, conversionRate: 30 },
  { name: 'المؤهلون', value: 1200, conversionRate: 12 },
  { name: 'العروض المقدمة', value: 480, conversionRate: 4.8 },
  { name: 'المغلقون', value: 144, conversionRate: 1.44 },
];

const generateCohortData = () => [
  { period: 'يناير 2024', retention: 100, customers: 1200 },
  { period: 'فبراير 2024', retention: 85, customers: 1350 },
  { period: 'مارس 2024', retention: 78, customers: 1280 },
  { period: 'أبريل 2024', retention: 72, customers: 1420 },
  { period: 'مايو 2024', retention: 69, customers: 1380 },
  { period: 'يونيو 2024', retention: 64, customers: 1450 },
];

const generateRevenueData = () => [
  { name: 'وسائل التواصل', revenue: 245000, percentage: 35 },
  { name: 'محركات البحث', revenue: 198000, percentage: 28 },
  { name: 'المراجع', revenue: 156000, percentage: 22 },
  { name: 'الإعلانات المدفوعة', revenue: 89000, percentage: 15 },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

const METRIC_COLORS = {
  blue: 'from-blue-50 to-blue-100 border-blue-200',
  green: 'from-green-50 to-green-100 border-green-200',
  yellow: 'from-yellow-50 to-yellow-100 border-yellow-200',
  red: 'from-red-50 to-red-100 border-red-200',
  purple: 'from-purple-50 to-purple-100 border-purple-200',
  orange: 'from-orange-50 to-orange-100 border-orange-200',
  emerald: 'from-emerald-50 to-emerald-100 border-emerald-200',
};

// ==================== ANALYTICS COMPONENTS ====================

const KPICard: React.FC<{
  metric: KPIMetric;
  onClick?: () => void;
}> = ({ metric, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ duration: 0.2 }}
    className="cursor-pointer"
    onClick={onClick}
  >
    <Card className={`p-6 bg-gradient-to-br ${METRIC_COLORS[metric.color as keyof typeof METRIC_COLORS]} hover:shadow-xl transition-all duration-300 border-2`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 space-x-reverse mb-1">
            <p className="text-sm font-medium text-gray-700">{metric.title}</p>
            <div className={`flex items-center ${
              metric.trend === 'up' ? 'text-green-600' : 
              metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {metric.trend === 'up' && <TrendingUp className="h-3 w-3 ml-1" />}
              {metric.trend === 'down' && <TrendingDownIcon className="h-3 w-3 ml-1" />}
              <span className="text-xs font-medium">{Math.abs(metric.change)}%</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <motion.h3 
              className="text-3xl font-bold text-gray-900"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {typeof metric.value === 'number' 
                ? metric.value.toLocaleString('ar-SA') 
                : metric.value
              }
              <span className="text-sm text-gray-500 mr-1">{metric.unit}</span>
            </motion.h3>
          </div>

          {metric.target && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>الهدف</span>
                <span>{metric.target.toLocaleString('ar-SA')} {metric.unit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <motion.div
                  className="bg-blue-600 h-1.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((metric.progress || 0), 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>
        
        <motion.div 
          className={`p-3 rounded-lg bg-white shadow-lg`}
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          {metric.icon}
        </motion.div>
      </div>
    </Card>
  </motion.div>
);

const AdvancedChart: React.FC<{
  type: ChartType;
  data: any[];
  title: string;
  config?: WidgetConfig;
  onDataPointClick?: (data: any) => void;
  isLoading?: boolean;
}> = ({ type, data, title, config = {}, onDataPointClick, isLoading }) => {
  const chartConfig = {
    showLegend: config.showLegend ?? true,
    showTooltip: config.showTooltip ?? true,
    showGrid: config.showGrid ?? true,
    showAnimation: config.showAnimation ?? true,
    colors: config.colors || COLORS,
  };

  const LoadingSkeleton = () => (
    <div className="h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
        <p className="text-gray-400">جاري التحميل...</p>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} onClick={onDataPointClick}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              {chartConfig.showTooltip && (
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: ar })}
                  formatter={(value: any) => [value.toLocaleString('ar-SA'), 'القيمة']}
                />
              )}
              {chartConfig.showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={chartConfig.colors[0]} 
                strokeWidth={config.strokeWidth || 2}
                dot={{ fill: chartConfig.colors[0], strokeWidth: 2, r: config.dotRadius || 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="value2" 
                stroke={chartConfig.colors[1]} 
                strokeWidth={config.strokeWidth || 2}
                dot={{ fill: chartConfig.colors[1], strokeWidth: 2, r: config.dotRadius || 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              {chartConfig.showTooltip && <Tooltip />}
              {chartConfig.showLegend && <Legend />}
              <Area 
                type="monotone" 
                dataKey="value" 
                stackId="1"
                stroke={chartConfig.colors[0]} 
                fill={chartConfig.colors[0]}
                fillOpacity={config.opacity || 0.3}
              />
              <Area 
                type="monotone" 
                dataKey="value2" 
                stackId="1"
                stroke={chartConfig.colors[1]} 
                fill={chartConfig.colors[1]}
                fillOpacity={config.opacity || 0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              {chartConfig.showTooltip && <Tooltip />}
              {chartConfig.showLegend && <Legend />}
              <Bar dataKey="value" fill={chartConfig.colors[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="value2" fill={chartConfig.colors[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
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
                onClick={onDataPointClick}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartConfig.colors[index % chartConfig.colors.length]} />
                ))}
              </Pie>
              {chartConfig.showTooltip && <Tooltip />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                onClick={onDataPointClick}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartConfig.colors[index % chartConfig.colors.length]} />
                ))}
              </Pie>
              {chartConfig.showTooltip && <Tooltip />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={data}>
              <CartesianGrid />
              <XAxis type="number" dataKey="x" name="X" />
              <YAxis type="number" dataKey="y" name="Y" />
              {chartConfig.showTooltip && (
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: any, name: string) => [value.toFixed(2), name]}
                />
              )}
              <Scatter dataKey="z" fill={chartConfig.colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} />
              <Radar
                name="القيم"
                dataKey="value"
                stroke={chartConfig.colors[0]}
                fill={chartConfig.colors[0]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              {chartConfig.showTooltip && <Tooltip />}
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'heatmap':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis dataKey="category" tick={{ fontSize: 12 }} />
              {chartConfig.showTooltip && <Tooltip />}
              <Bar dataKey="value" fill={(entry: any) => {
                const intensity = entry.value / 100;
                return `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`;
              }} />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return <div>نوع الرسم البياني غير مدعوم</div>;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="h-64">{renderChart()}</div>
    </Card>
  );
};

const DashboardBuilder: React.FC<{
  widgets: AnalyticsWidget[];
  onWidgetUpdate: (id: string, updates: Partial<AnalyticsWidget>) => void;
  onWidgetDelete: (id: string) => void;
  onWidgetAdd: (widget: Omit<AnalyticsWidget, 'id'>) => void;
}> = ({ widgets, onWidgetUpdate, onWidgetDelete, onWidgetAdd }) => {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);

  const availableWidgets = [
    { type: 'line' as ChartType, title: 'الخط الزمني', icon: TrendingUp },
    { type: 'bar' as ChartType, title: 'الأعمدة', icon: BarChart3 },
    { type: 'pie' as ChartType, title: 'الدائرة', icon: PieChartIcon },
    { type: 'area' as ChartType, title: 'المساحة', icon: Layers3 },
    { type: 'scatter' as ChartType, title: 'النقاط', icon: Scatter3D },
    { type: 'radar' as ChartType, title: 'الرادار', icon: Gauge },
  ];

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedWidget && draggedWidget !== targetId) {
      // Swap positions
      const sourceWidget = widgets.find(w => w.id === draggedWidget);
      const targetWidget = widgets.find(w => w.id === targetId);
      
      if (sourceWidget && targetWidget) {
        onWidgetUpdate(draggedWidget, { position: targetWidget.position });
        onWidgetUpdate(targetId, { position: sourceWidget.position });
      }
    }
    setDraggedWidget(null);
  };

  const addNewWidget = (type: ChartType) => {
    const widgetData = generateRandomData(30);
    const newWidget = {
      type,
      title: `رسم بياني جديد (${type})`,
      data: widgetData,
      config: {
        showLegend: true,
        showTooltip: true,
        showGrid: true,
        showAnimation: true,
      },
      position: { x: 0, y: 0, w: 12, h: 4 },
    };
    onWidgetAdd(newWidget);
    setShowWidgetSelector(false);
  };

  return (
    <div className="space-y-6">
      {/* Widget Selector */}
      <AnimatePresence>
        {showWidgetSelector && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-dashed border-blue-300"
          >
            <h3 className="text-lg font-semibold mb-4">إضافة رسم بياني جديد</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {availableWidgets.map(({ type, title, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => addNewWidget(type)}
                  className="flex flex-col items-center p-4 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Icon className="h-8 w-8 mb-2 text-blue-600" />
                  <span className="text-sm font-medium">{title}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Widget Button */}
      <div className="text-center">
        <Button
          onClick={() => setShowWidgetSelector(!showWidgetSelector)}
          variant="outline"
          className="flex items-center"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة رسم بياني
        </Button>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {widgets.map((widget, index) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              draggable
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, widget.id)}
              className="relative"
            >
              <div className="relative">
                <AdvancedChart
                  type={widget.type}
                  data={widget.data}
                  title={widget.title}
                  config={widget.config}
                />
                
                {/* Widget Controls */}
                <div className="absolute top-2 left-2 flex items-center space-x-1 space-x-reverse">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onWidgetUpdate(widget.id, { isFavorite: !widget.isFavorite })}
                    className="h-6 w-6 p-0"
                  >
                    {widget.isFavorite ? (
                      <BookmarkCheck className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <Bookmark className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onWidgetDelete(widget.id)}
                    className="h-6 w-6 p-0 hover:bg-red-100"
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ==================== MAIN ANALYTICS DASHBOARD ====================

export default function AnalyticsDashboard() {
  // State Management
  const [currentView, setCurrentView] = useState<'overview' | 'business' | 'performance' | 'custom'>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [timeResolution, setTimeResolution] = useState<TimeResolution>('day');
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: { start: subDays(new Date(), 30), end: new Date() },
    timeResolution: 'day',
    metrics: [],
    segments: [],
    customFilters: {},
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [theme, setTheme] = useState<DashboardTheme>('light');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Widget Management
  const [widgets, setWidgets] = useState<AnalyticsWidget[]>([
    {
      id: '1',
      type: 'line',
      title: 'اتجاهات العملاء',
      data: generateRandomData(30),
      config: { showLegend: true, showTooltip: true },
      position: { x: 0, y: 0, w: 12, h: 4 },
    },
    {
      id: '2',
      type: 'bar',
      title: 'الأداء الشهري',
      data: generateRandomData(12),
      config: { showLegend: true, showTooltip: true },
      position: { x: 0, y: 4, w: 6, h: 4 },
    },
    {
      id: '3',
      type: 'pie',
      title: 'توزيع المصادر',
      data: generateRevenueData(),
      config: { showLegend: true, showTooltip: true },
      position: { x: 6, y: 4, w: 6, h: 4 },
    },
  ]);

  const analytics = useEnhancedAnalytics({
    autoRefresh: true,
    refreshInterval: 30000,
    enableRealtime: true,
  });

  // KPI Metrics
  const kpiMetrics: KPIMetric[] = [
    {
      id: 'total-leads',
      title: 'إجمالي العملاء المحتملين',
      value: 1247,
      change: 12.5,
      changeType: 'increase',
      unit: '',
      icon: <Users className="h-6 w-6 text-blue-600" />,
      color: 'blue',
      trend: 'up',
      target: 1500,
      progress: 83,
    },
    {
      id: 'conversion-rate',
      title: 'معدل التحويل',
      value: 3.2,
      change: 8.7,
      changeType: 'increase',
      unit: '%',
      icon: <Target className="h-6 w-6 text-green-600" />,
      color: 'green',
      trend: 'up',
      target: 4.0,
      progress: 80,
    },
    {
      id: 'revenue',
      title: 'إجمالي الإيرادات',
      value: 285000,
      change: 24.6,
      changeType: 'increase',
      unit: 'ريال',
      icon: <DollarSign className="h-6 w-6 text-emerald-600" />,
      color: 'emerald',
      trend: 'up',
      target: 350000,
      progress: 81,
    },
    {
      id: 'response-time',
      title: 'متوسط وقت الاستجابة',
      value: 2.3,
      change: -15.2,
      changeType: 'decrease',
      unit: 'ساعة',
      icon: <Clock className="h-6 w-6 text-orange-600" />,
      color: 'orange',
      trend: 'down',
      target: 2.0,
      progress: 87,
    },
    {
      id: 'customer-satisfaction',
      title: 'رضا العملاء',
      value: 4.6,
      change: 3.1,
      changeType: 'increase',
      unit: '/5',
      icon: <Star className="h-6 w-6 text-yellow-600" />,
      color: 'yellow',
      trend: 'up',
      target: 4.8,
      progress: 96,
    },
    {
      id: 'active-channels',
      title: 'القنوات النشطة',
      value: 8,
      change: 0,
      changeType: 'increase',
      unit: '',
      icon: <MessageSquare className="h-6 w-6 text-purple-600" />,
      color: 'purple',
      trend: 'stable',
    },
  ];

  // Business Intelligence Data
  const businessIntelligence: BusinessIntelligence = {
    leadScoring: {
      totalLeads: 1247,
      hotLeads: 156,
      avgScore: 73,
      conversionProbability: 68,
    },
    funnelAnalysis: {
      stages: generateFunnelData(),
      dropoffRate: 85.6,
      bottleneck: 'العملاء المؤهلون',
    },
    cohortAnalysis: {
      periods: generateCohortData(),
    },
    revenueAttribution: {
      channels: generateRevenueData(),
      marketingROI: 320,
    },
    churnPrediction: {
      riskScore: 23,
      predictedChurnRate: 4.2,
      atRiskCustomers: 52,
    },
  };

  // Export Functions
  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setShowExportOptions(false);
    setIsRefreshing(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`تصدير البيانات بصيغة ${format.toUpperCase()}`);
    } catch (error) {
      console.error('خطأ في التصدير:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Widget Management
  const updateWidget = (id: string, updates: Partial<AnalyticsWidget>) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const deleteWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const addWidget = (widget: Omit<AnalyticsWidget, 'id'>) => {
    const newWidget = {
      ...widget,
      id: Date.now().toString(),
    };
    setWidgets(prev => [...prev, newWidget]);
  };

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await analytics.refetchDashboard();
    } catch (error) {
      console.error('خطأ في التحديث:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Apply theme
  const themeClasses = useMemo(() => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900 text-white';
      case 'auto':
        return 'bg-gray-50 dark:bg-gray-900';
      default:
        return 'bg-gray-50';
    }
  }, [theme]);

  return (
    <motion.div 
      className={`min-h-screen ${themeClasses}`}
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <motion.div 
          className="mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  لوحة التحكم التحليلية المتقدمة
                </h1>
                <motion.div
                  className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-purple-100 to-blue-100 px-3 py-1 rounded-full"
                  whileHover={{ scale: 1.05 }}
                >
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">ذكي ومتطور</span>
                </motion.div>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                تحليلات متقدمة مع مؤشرات الأداء الرئيسية والذكاء الاصطناعي
              </p>
            </div>
            
            {/* Control Panel */}
            <div className="flex flex-col space-y-3">
              {/* Date Range Selector */}
              <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                {(['today', 'week', 'month', 'quarter', 'year'] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      dateRange === range
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {range === 'today' && 'اليوم'}
                    {range === 'week' && 'الأسبوع'}
                    {range === 'month' && 'الشهر'}
                    {range === 'quarter' && 'الربع'}
                    {range === 'year' && 'السنة'}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
                
                <div className="relative">
                  <Button
                    onClick={() => setShowExportOptions(!showExportOptions)}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تصدير
                  </Button>
                  
                  <AnimatePresence>
                    {showExportOptions && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                      >
                        <div className="py-1">
                          <button
                            onClick={() => handleExport('pdf')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <FileImage className="h-4 w-4 ml-2" />
                            تصدير PDF
                          </button>
                          <button
                            onClick={() => handleExport('excel')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <FileSpreadsheet className="h-4 w-4 ml-2" />
                            تصدير Excel
                          </button>
                          <button
                            onClick={() => handleExport('csv')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <FileText className="h-4 w-4 ml-2" />
                            تصدير CSV
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <FilterIcon className="h-4 w-4 ml-2" />
                  تصفية
                </Button>

                <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-2 rounded ${theme === 'light' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                  >
                    <Sun className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-2 rounded ${theme === 'dark' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                  >
                    <Moon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setTheme('auto')}
                    className={`p-2 rounded ${theme === 'auto' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div 
          className="mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            {[
              { key: 'overview', label: 'نظرة عامة', icon: Layout },
              { key: 'business', label: 'ذكاء الأعمال', icon: Brain },
              { key: 'performance', label: 'الأداء', icon: Activity },
              { key: 'custom', label: 'مخصص', icon: Sliders },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCurrentView(key as any)}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  currentView === key
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 ml-2" />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Based on Current View */}
        <AnimatePresence mode="wait">
          {currentView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              {/* KPI Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
                <AnimatePresence>
                  {kpiMetrics.map((metric, index) => (
                    <motion.div
                      key={metric.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <KPICard
                        metric={metric}
                        onClick={() => console.log('KPI clicked:', metric)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Overview Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <AdvancedChart
                  type="line"
                  data={generateRandomData(30)}
                  title="اتجاهات النمو"
                  config={{ showLegend: true, showTooltip: true }}
                />
                <AdvancedChart
                  type="area"
                  data={generateRandomData(30)}
                  title="الأداء التراكمي"
                  config={{ showLegend: true, showTooltip: true }}
                />
                <AdvancedChart
                  type="bar"
                  data={generateRandomData(12)}
                  title="الأداء الشهري"
                  config={{ showLegend: true, showTooltip: true }}
                />
                <AdvancedChart
                  type="pie"
                  data={generateRevenueData()}
                  title="توزيع الإيرادات"
                  config={{ showLegend: true, showTooltip: true }}
                />
              </div>
            </motion.div>
          )}

          {currentView === 'business' && (
            <motion.div
              key="business"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Business Intelligence KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  metric={{
                    id: 'hot-leads',
                    title: 'العملاء الساخنة',
                    value: businessIntelligence.leadScoring.hotLeads,
                    change: 15.3,
                    changeType: 'increase',
                    unit: '',
                    icon: <Zap className="h-6 w-6 text-red-600" />,
                    color: 'red',
                    trend: 'up',
                  }}
                />
                <KPICard
                  metric={{
                    id: 'avg-score',
                    title: 'متوسط النقاط',
                    value: businessIntelligence.leadScoring.avgScore,
                    change: 5.7,
                    changeType: 'increase',
                    unit: '/100',
                    icon: <Star className="h-6 w-6 text-yellow-600" />,
                    color: 'yellow',
                    trend: 'up',
                  }}
                />
                <KPICard
                  metric={{
                    id: 'conversion-prob',
                    title: 'احتمالية التحويل',
                    value: businessIntelligence.leadScoring.conversionProbability,
                    change: 8.2,
                    changeType: 'increase',
                    unit: '%',
                    icon: <Target className="h-6 w-6 text-green-600" />,
                    color: 'green',
                    trend: 'up',
                  }}
                />
                <KPICard
                  metric={{
                    id: 'marketing-roi',
                    title: 'عائد التسويق',
                    value: businessIntelligence.revenueAttribution.marketingROI,
                    change: 12.4,
                    changeType: 'increase',
                    unit: '%',
                    icon: <DollarSign className="h-6 w-6 text-emerald-600" />,
                    color: 'emerald',
                    trend: 'up',
                  }}
                />
              </div>

              {/* Business Intelligence Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">تحليل القمع التحويلي</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={businessIntelligence.funnelAnalysis.stages}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          value.toLocaleString('ar-SA'), 
                          name === 'value' ? 'العدد' : 'معدل التحويل'
                        ]}
                      />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>عنق الزجاجة:</strong> {businessIntelligence.funnelAnalysis.bottleneck}
                    </p>
                    <p className="text-sm text-yellow-700">
                      معدل التسرب: {businessIntelligence.funnelAnalysis.dropoffRate}%
                    </p>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">تحليل الجيل (Cohort)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={businessIntelligence.cohortAnalysis.periods}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="retention" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      معدل الاحتفاظ المتوسط: {
                        Math.round(
                          businessIntelligence.cohortAnalysis.periods.reduce((acc, period) => acc + period.retention, 0) / 
                          businessIntelligence.cohortAnalysis.periods.length
                        )
                      }%
                    </p>
                  </div>
                </Card>
              </div>

              {/* Revenue Attribution */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">إسناد الإيرادات</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={businessIntelligence.revenueAttribution.channels}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {businessIntelligence.revenueAttribution.channels.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [value.toLocaleString('ar-SA') + ' ريال', 'الإيرادات']} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-3">
                    {businessIntelligence.revenueAttribution.channels.map((channel, index) => (
                      <div key={channel.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{channel.revenue.toLocaleString('ar-SA')} ريال</div>
                          <div className="text-sm text-gray-500">{channel.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {currentView === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AdvancedChart
                  type="scatter"
                  data={generateScatterData()}
                  title="تحليل الأداء - الوقت مقابل الجودة"
                  config={{ showLegend: true, showTooltip: true }}
                />
                <AdvancedChart
                  type="radar"
                  data={[
                    { name: 'السرعة', value: 85 },
                    { name: 'الدقة', value: 92 },
                    { name: 'الموثوقية', value: 88 },
                    { name: 'الجودة', value: 95 },
                    { name: 'الرضا', value: 89 },
                    { name: 'الكفاءة', value: 91 },
                  ]}
                  title="تقييم الأداء الشامل"
                  config={{ showLegend: true, showTooltip: true }}
                />
                <AdvancedChart
                  type="doughnut"
                  data={[
                    { name: 'ممتاز', value: 45 },
                    { name: 'جيد جداً', value: 35 },
                    { name: 'جيد', value: 15 },
                    { name: 'يحتاج تحسين', value: 5 },
                  ]}
                  title="توزيع مستويات الأداء"
                  config={{ showLegend: true, showTooltip: true }}
                />
              </div>

              {/* Performance Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AdvancedChart
                  type="line"
                  data={generateRandomData(30)}
                  title="اتجاهات الأداء الزمنية"
                  config={{ showLegend: true, showTooltip: true }}
                />
                <AdvancedChart
                  type="area"
                  data={generateRandomData(30)}
                  title="الحجم التراكمي للأداء"
                  config={{ showLegend: true, showTooltip: true }}
                />
              </div>
            </motion.div>
          )}

          {currentView === 'custom' && (
            <motion.div
              key="custom"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              <DashboardBuilder
                widgets={widgets}
                onWidgetUpdate={updateWidget}
                onWidgetDelete={deleteWidget}
                onWidgetAdd={addWidget}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
              onClick={() => setShowFilters(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    تخصيص الفلاتر
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Date Range */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">النطاق الزمني</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">من</label>
                        <input
                          type="date"
                          value={format(customDateRange.start, 'yyyy-MM-dd')}
                          onChange={(e) => setCustomDateRange(prev => ({ 
                            ...prev, 
                            start: new Date(e.target.value) 
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">إلى</label>
                        <input
                          type="date"
                          value={format(customDateRange.end, 'yyyy-MM-dd')}
                          onChange={(e) => setCustomDateRange(prev => ({ 
                            ...prev, 
                            end: new Date(e.target.value) 
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resolution */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">دقة الوقت</h3>
                    <select
                      value={timeResolution}
                      onChange={(e) => setTimeResolution(e.target.value as TimeResolution)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="hour">بالساعة</option>
                      <option value="day">يومياً</option>
                      <option value="week">أسبوعياً</option>
                      <option value="month">شهرياً</option>
                      <option value="quarter">ربع سنوي</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        dateRange: customDateRange,
                        timeResolution,
                      }));
                      setShowFilters(false);
                    }}
                  >
                    تطبيق الفلاتر
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}