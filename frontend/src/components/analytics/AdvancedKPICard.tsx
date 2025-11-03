'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  TrendingDown as TrendingStable,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Activity,
  Zap,
  Brain,
  Eye,
  Settings,
  Maximize2,
  Download,
  RefreshCw,
  Filter,
  MoreHorizontal,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  changePercentage: number;
  changeDirection: 'up' | 'down' | 'stable';
  target?: number;
  category: string;
  description?: string;
  trend: Array<{
    date: string;
    value: number;
  }>;
  alerts?: Array<{
    type: 'warning' | 'critical' | 'info';
    message: string;
    timestamp: string;
  }>;
}

interface AdvancedKPICardProps {
  metric: KPIMetric;
  onClick?: (metric: KPIMetric) => void;
  onSettings?: (metric: KPIMetric) => void;
  onExport?: (metric: KPIMetric, format: string) => void;
  isCompact?: boolean;
  showTrend?: boolean;
  enableRealTime?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

// ==================== KPICARD COMPONENTS ====================

const getCategoryIcon = (category: string) => {
  const icons = {
    sales: Target,
    financial: BarChart3,
    operational: Activity,
    customer_service: CheckCircle,
    marketing: Zap,
    general: BarChart3,
  };
  return icons[category as keyof typeof icons] || BarChart3;
};

const getCategoryColor = (category: string) => {
  const colors = {
    sales: 'from-red-50 to-red-100 border-red-200 text-red-700',
    financial: 'from-green-50 to-green-100 border-green-200 text-green-700',
    operational: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    customer_service: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
    marketing: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
    general: 'from-gray-50 to-gray-100 border-gray-200 text-gray-700',
  };
  return colors[category as keyof typeof colors] || colors.general;
};

const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
  switch (direction) {
    case 'up':
      return TrendingUp;
    case 'down':
      return TrendingDown;
    case 'stable':
      return TrendingStable;
    default:
      return TrendingStable;
  }
};

const getTrendColor = (direction: 'up' | 'down' | 'stable', value: number) => {
  if (direction === 'stable') return 'text-gray-600';
  const isPositive = (direction === 'up' && value > 0) || (direction === 'down' && value < 0);
  return isPositive ? 'text-green-600' : 'text-red-600';
};

const MiniTrendChart: React.FC<{ trend: Array<{ date: string; value: number }> }> = ({ trend }) => {
  if (trend.length < 2) return null;

  const values = trend.map(t => t.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <div className="h-8 w-full flex items-end space-x-1 space-x-reverse mt-2">
      {trend.map((point, index) => {
        const height = ((point.value - min) / range) * 100;
        const isLast = index === trend.length - 1;
        const isFirst = index === 0;
        
        return (
          <motion.div
            key={point.date}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(height, 5)}%` }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`flex-1 rounded-sm ${
              isLast ? 'bg-blue-500' : 'bg-blue-300'
            } ${isFirst ? 'opacity-60' : 'opacity-80'}`}
            style={{ minHeight: '4px' }}
          />
        );
      })}
    </div>
  );
};

const KPIMenu: React.FC<{
  metric: KPIMetric;
  onSettings: (metric: KPIMetric) => void;
  onExport: (metric: KPIMetric, format: string) => void;
  onRefresh: (metric: KPIMetric) => void;
}> = ({ metric, onSettings, onExport, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: string) => {
    onExport(metric, format);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20"
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    onRefresh(metric);
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  تحديث البيانات
                </button>
                <button
                  onClick={() => {
                    onSettings(metric);
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings className="h-4 w-4 ml-2" />
                  الإعدادات
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <p className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400">تصدير</p>
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== MAIN KpiCard COMPONENT ====================

export const AdvancedKPICard: React.FC<AdvancedKPICardProps> = ({
  metric,
  onClick,
  onSettings,
  onExport,
  isCompact = false,
  showTrend = true,
  enableRealTime = true,
  theme = 'auto'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeValue, setRealTimeValue] = useState(metric.value);
  
  const IconComponent = getCategoryIcon(metric.category);
  const categoryColorClass = getCategoryColor(metric.category);
  const TrendIcon = getTrendIcon(metric.changeDirection);
  const trendColorClass = getTrendColor(metric.changeDirection, metric.changePercentage);

  // Real-time updates simulation
  useEffect(() => {
    if (!enableRealTime) return;

    const interval = setInterval(() => {
      // Simulate small random changes in real-time
      const variation = (Math.random() - 0.5) * metric.value * 0.02; // ±2% variation
      setRealTimeValue(prev => prev + variation);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [enableRealTime, metric.value]);

  const handleRefresh = async (metricToRefresh: KPIMetric) => {
    setIsLoading(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}م`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}ك`;
    }
    return value.toLocaleString('ar-SA');
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (isCompact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="cursor-pointer"
        onClick={() => onClick?.(metric)}
      >
        <Card className={`p-4 bg-gradient-to-br ${categoryColorClass} border-2`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 space-x-reverse mb-1">
                <IconComponent className="h-4 w-4" />
                <p className="text-sm font-medium truncate">{metric.name}</p>
              </div>
              <div className="flex items-baseline space-x-2 space-x-reverse">
                <h3 className="text-lg font-bold">
                  {formatValue(realTimeValue)}
                </h3>
                <div className={`flex items-center text-xs ${trendColorClass}`}>
                  <TrendIcon className="h-3 w-3 ml-1" />
                  {formatPercentage(metric.changePercentage)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.3 }}
      className="cursor-pointer group"
      onClick={() => onClick?.(metric)}
    >
      <Card className={`p-6 bg-gradient-to-br ${categoryColorClass} border-2 hover:shadow-xl transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-md"
            >
              <IconComponent className="h-5 w-5" />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {metric.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {metric.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            {enableRealTime && (
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-green-500 rounded-full"
                title="تحديثات فورية"
              />
            )}
            <KPIMenu
              metric={metric}
              onSettings={onSettings || (() => {})}
              onExport={onExport || (() => {})}
              onRefresh={handleRefresh}
            />
          </div>
        </div>

        {/* Main Value */}
        <div className="mb-4">
          <div className="flex items-baseline space-x-3 space-x-reverse">
            <motion.h1
              className="text-3xl font-bold text-gray-900 dark:text-white"
              key={realTimeValue}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {formatValue(realTimeValue)}
            </motion.h1>
            
            <div className={`flex items-center space-x-1 space-x-reverse ${trendColorClass}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {formatPercentage(metric.changePercentage)}
              </span>
              <span className="text-xs text-gray-500">من الفترة السابقة</span>
            </div>
          </div>

          {/* Target Progress */}
          {metric.target && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                <span>الهدف: {formatValue(metric.target)}</span>
                <span>{((realTimeValue / metric.target) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((realTimeValue / metric.target) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {metric.alerts && metric.alerts.length > 0 && (
          <div className="mb-4">
            <AnimatePresence>
              {metric.alerts.map((alert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center space-x-2 space-x-reverse p-2 rounded-lg ${
                    alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}
                >
                  {alert.type === 'critical' && <AlertTriangle className="h-4 w-4" />}
                  {alert.type === 'warning' && <Clock className="h-4 w-4" />}
                  {alert.type === 'info' && <Eye className="h-4 w-4" />}
                  <span className="text-sm">{alert.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Trend Chart */}
        {showTrend && metric.trend.length > 1 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">الاتجاه</span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-xs text-gray-500">
                  آخر {metric.trend.length} فترة
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.(metric);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <MiniTrendChart trend={metric.trend} />
          </div>
        )}

        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-lg flex items-center justify-center"
            >
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// ==================== KPICARD GRID COMPONENT ====================

interface KPICardGridProps {
  metrics: KPIMetric[];
  onMetricClick?: (metric: KPIMetric) => void;
  onMetricSettings?: (metric: KPIMetric) => void;
  onMetricExport?: (metric: KPIMetric, format: string) => void;
  layout?: 'grid' | 'list';
  showTrends?: boolean;
  compact?: boolean;
  maxColumns?: number;
  enableRealTime?: boolean;
}

export const KPICardGrid: React.FC<KPICardGridProps> = ({
  metrics,
  onMetricClick,
  onMetricSettings,
  onMetricExport,
  layout = 'grid',
  showTrends = true,
  compact = false,
  maxColumns = 6,
  enableRealTime = true
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(layout);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'change'>('value');

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(metrics.map(m => m.category)))];

  // Filter and sort metrics
  const filteredMetrics = metrics
    .filter(metric => filterCategory === 'all' || metric.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'ar');
        case 'value':
          return b.value - a.value;
        case 'change':
          return Math.abs(b.changePercentage) - Math.abs(a.changePercentage);
        default:
          return 0;
      }
    });

  const gridCols = compact 
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'جميع الفئات' : category}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="value">ترتيب حسب القيمة</option>
            <option value="change">ترتيب حسب التغيير</option>
            <option value="name">ترتيب حسب الاسم</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid/List */}
      <div className={viewMode === 'grid' ? `${gridCols} gap-6` : 'space-y-4'}>
        <AnimatePresence>
          {filteredMetrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <AdvancedKPICard
                metric={metric}
                onClick={onMetricClick}
                onSettings={onMetricSettings}
                onExport={onMetricExport}
                isCompact={compact}
                showTrend={showTrends}
                enableRealTime={enableRealTime}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredMetrics.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد مؤشرات
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            لا توجد مؤشرات أداء متاحة للفئة المختارة
          </p>
        </div>
      )}
    </div>
  );
};

export default AdvancedKPICard;
