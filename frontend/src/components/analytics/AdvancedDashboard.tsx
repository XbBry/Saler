'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  Users,
  MessageSquare,
  DollarSign,
  Brain,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Settings,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Eye,
  Maximize2,
  Bell,
  Search,
  Plus,
  Grid3X3,
  List,
  MoreVertical,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sun,
  Moon,
  Monitor,
  Filter as FilterIcon,
  Layers,
  Scatter3D,
  Share2,
  Bookmark,
  BookmarkCheck,
  Timer,
  Gauge,
  Archive,
  FileSpreadsheet,
  FileImage,
  FileText,
  Sliders,
  Timer as TimerIcon,
} from 'lucide-react';
import { useAdvancedAnalytics } from '../../hooks/useAdvancedAnalytics';
import { AdvancedKPICard, KPICardGrid } from './AdvancedKPICard';
import { AdvancedChart, AdvancedChartGrid } from './AdvancedChart';
import { AdvancedConversionFunnel } from './AdvancedConversionFunnel';

// ==================== TYPES & INTERFACES ====================

export type DashboardView = 'overview' | 'analytics' | 'funnel' | 'team' | 'predictions' | 'custom';
export type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';
export type DashboardTheme = 'light' | 'dark' | 'auto';
export type LayoutMode = 'grid' | 'list' | 'cards';

interface DashboardConfig {
  layout: LayoutMode;
  theme: DashboardTheme;
  refreshInterval: number;
  enableRealTime: boolean;
  autoSave: boolean;
  compactMode: boolean;
  showTrends: boolean;
  timeRange: TimeRange;
}

// ==================== HEADER COMPONENT ====================

const DashboardHeader: React.FC<{
  view: DashboardView;
  onViewChange: (view: DashboardView) => void;
  config: DashboardConfig;
  onConfigChange: (config: Partial<DashboardConfig>) => void;
  onRefresh: () => void;
  onExport: (format: string) => void;
  isRefreshing: boolean;
  notifications: number;
}> = ({ 
  view, 
  onViewChange, 
  config, 
  onConfigChange, 
  onRefresh, 
  onExport, 
  isRefreshing,
  notifications 
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const viewIcons = {
    overview: LayoutDashboard,
    analytics: BarChart3,
    funnel: Target,
    team: Users,
    predictions: Brain,
    custom: Sliders,
  };

  const viewLabels = {
    overview: 'نظرة عامة',
    analytics: 'التحليلات',
    funnel: 'القمع التحويلي',
    team: 'أداء الفريق',
    predictions: 'التوقعات',
    custom: 'مخصص',
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
    >
      {/* Main Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-3 space-x-reverse">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg"
            >
              <LayoutDashboard className="h-6 w-6" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                لوحة التحكم المتقدمة
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                تحليلات شاملة مع الذكاء الاصطناعي والتوقعات المتقدمة
              </p>
            </div>
          </div>
          
          {/* AI Badge */}
          <motion.div
            animate={{ 
              boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.4)', '0 0 0 10px rgba(59, 130, 246, 0)', '0 0 0 0 rgba(59, 130, 246, 0.4)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 px-3 py-1 rounded-full flex items-center space-x-2 space-x-reverse border border-purple-200 dark:border-purple-800"
          >
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">مدعوم بالذكاء الاصطناعي</span>
          </motion.div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center space-x-3 space-x-reverse">
          {/* Real-time indicator */}
          {config.enableRealTime && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center space-x-2 space-x-reverse text-sm text-green-600"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>مباشر</span>
            </motion.div>
          )}

          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          {/* Export Menu */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            >
              <Download className="h-5 w-5" />
            </motion.button>

            <AnimatePresence>
              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20"
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onExport('pdf');
                          setShowExportMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FileImage className="h-4 w-4 ml-2" />
                        تصدير PDF
                      </button>
                      <button
                        onClick={() => {
                          onExport('excel');
                          setShowExportMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FileSpreadsheet className="h-4 w-4 ml-2" />
                        تصدير Excel
                      </button>
                      <button
                        onClick={() => {
                          onExport('csv');
                          setShowExportMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FileText className="h-4 w-4 ml-2" />
                        تصدير CSV
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
              >
                {notifications > 9 ? '9+' : notifications}
              </motion.span>
            )}
          </motion.button>

          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {/* Open settings */}}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* View Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {Object.entries(viewLabels).map(([key, label]) => {
            const Icon = viewIcons[key as DashboardView];
            return (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onViewChange(key as DashboardView)}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-colors ${
                  view === key
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2 space-x-reverse">
          {['1h', '24h', '7d', '30d', '90d', '1y'].map((range) => (
            <motion.button
              key={range}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onConfigChange({ timeRange: range as TimeRange })}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                config.timeRange === range
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {range === '1h' && 'ساعة'}
              {range === '24h' && 'يوم'}
              {range === '7d' && 'أسبوع'}
              {range === '30d' && 'شهر'}
              {range === '90d' && '3 أشهر'}
              {range === '1y' && 'سنة'}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ==================== KPI DASHBOARD COMPONENT ====================

const KPIDashboard: React.FC<{
  analyticsData: any;
  onMetricClick: (metric: any) => void;
  config: DashboardConfig;
}> = ({ analyticsData, onMetricClick, config }) => {
  const [favorites, setFavorites] = useState<string[]>(['kpi_1', 'kpi_2']);

  if (!analyticsData?.dashboard?.kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-blue-500 rounded-lg text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {analyticsData.dashboard.summaryMetrics.totalLeads.toLocaleString('ar-SA')}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">إجمالي العملاء</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-green-500 rounded-lg text-white">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {analyticsData.dashboard.summaryMetrics.conversionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">معدل التحويل</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-purple-500 rounded-lg text-white">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {(analyticsData.dashboard.summaryMetrics.totalRevenue / 1000).toFixed(0)}k
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">الإيرادات</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-orange-500 rounded-lg text-white">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {analyticsData.dashboard.summaryMetrics.avgTeamScore.toFixed(1)}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">متوسط الأداء</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* KPI Cards Grid */}
      <KPICardGrid
        metrics={analyticsData.dashboard.kpis}
        onMetricClick={onMetricClick}
        layout={config.layout}
        compact={config.compactMode}
        showTrends={config.showTrends}
        enableRealTime={config.enableRealTime}
      />
    </div>
  );
};

// ==================== ANALYTICS VIEW COMPONENT ====================

const AnalyticsView: React.FC<{
  analyticsData: any;
  onChartClick: (chartId: string, data: any) => void;
  config: DashboardConfig;
}> = ({ analyticsData, onChartClick, config }) => {
  const chartData = useMemo(() => {
    if (!analyticsData?.dashboard?.kpis) return [];

    return analyticsData.dashboard.kpis.slice(0, 6).map((kpi: any, index: number) => ({
      id: `chart_${index}`,
      title: kpi.name,
      type: ['line', 'area', 'bar', 'pie', 'scatter', 'radar'][index] as any,
      data: kpi.trend.map((point: any) => ({
        date: point.date,
        label: new Date(point.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
        value: point.value,
        value2: Math.floor(point.value * (0.8 + Math.random() * 0.4))
      })),
      config: {
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
        showLegend: true,
        showTooltip: true,
        showGrid: true,
      }
    }));
  }, [analyticsData]);

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <AdvancedChartGrid
        charts={chartData}
        columns={3}
        onChartClick={onChartClick}
        enableRealTime={config.enableRealTime}
      />

      {/* Team Performance Summary */}
      {analyticsData?.teamPerformance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ملخص أداء الفريق
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData.teamPerformance.teamSummary.totalMembers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">أعضاء الفريق</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.teamPerformance.teamSummary.avgConversionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">متوسط التحويل</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {analyticsData.teamPerformance.teamSummary.avgResponseTime.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">متوسط الاستجابة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analyticsData.teamPerformance.teamSummary.avgOverallScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">متوسط الأداء</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(analyticsData.teamPerformance.teamSummary.totalRevenue / 1000).toFixed(0)}k
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">إجمالي الإيرادات</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ==================== FUNNEL VIEW COMPONENT ====================

const FunnelView: React.FC<{
  analyticsData: any;
  config: DashboardConfig;
}> = ({ analyticsData, config }) => {
  if (!analyticsData?.funnels || analyticsData.funnels.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          لا توجد بيانات القمع التحويلي
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          قم بإعداد قمع تحويل لمراقبة الأداء
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {analyticsData.funnels.map((funnel: any, index: number) => (
        <AdvancedConversionFunnel
          key={funnel.id || index}
          funnel={funnel}
          enableRealTime={config.enableRealTime}
        />
      ))}
    </div>
  );
};

// ==================== TEAM PERFORMANCE VIEW ====================

const TeamPerformanceView: React.FC<{
  analyticsData: any;
  config: DashboardConfig;
}> = ({ analyticsData, config }) => {
  if (!analyticsData?.teamPerformance) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          لا توجد بيانات أداء الفريق
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          سيتم عرض بيانات أداء الفريق هنا
        </p>
      </div>
    );
  }

  const teamData = analyticsData.teamPerformance;

  return (
    <div className="space-y-6">
      {/* Team Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {teamData.teamSummary.totalMembers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">إجمالي الأعضاء</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <Target className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {teamData.teamSummary.avgConversionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">متوسط التحويل</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {teamData.teamSummary.avgResponseTime.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">متوسط الاستجابة</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <Star className="h-8 w-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {teamData.teamSummary.avgOverallScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">متوسط الأداء</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Performers */}
      {teamData.topPerformers && teamData.topPerformers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            أفضل المتخصصين
          </h3>
          <div className="space-y-3">
            {teamData.topPerformers.slice(0, 5).map((performer: any, index: number) => (
              <div key={performer.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      المتخصص {performer.userId.split('_')[1]}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {performer.keyStrengths.join(' • ')}
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {performer.overallScore}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    النقاط
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ==================== PREDICTIONS VIEW ====================

const PredictionsView: React.FC<{
  analyticsData: any;
  config: DashboardConfig;
}> = ({ analyticsData, config }) => {
  const predictionsData = analyticsData?.predictions;

  if (!predictionsData) {
    return (
      <div className="text-center py-12">
        <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          لا توجد بيانات التوقعات
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          سيتم عرض التوقعات والتوصيات الذكية هنا
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prediction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <Brain className="h-8 w-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {predictionsData.predictionSummary.totalModels}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">النماذج النشطة</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <Target className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {predictionsData.predictionSummary.totalPredictions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">إجمالي التوقعات</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <Gauge className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(predictionsData.predictionSummary.avgConfidenceScore * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">متوسط الثقة</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <CheckCircle className="h-8 w-8 text-orange-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {predictionsData.predictionSummary.highConfidencePredictions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">توقعات عالية الثقة</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Insights */}
      {predictionsData.businessInsights && predictionsData.businessInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            الرؤى الذكية
          </h3>
          <div className="space-y-4">
            {predictionsData.businessInsights.slice(0, 5).map((insight: any, index: number) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {insight.title}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    insight.priorityLevel === 'high' ? 'bg-red-100 text-red-800' :
                    insight.priorityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {insight.priorityLevel === 'high' ? 'عالي' :
                     insight.priorityLevel === 'medium' ? 'متوسط' : 'منخفض'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {insight.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    تأثير: {insight.impactScore}% • ثقة: {(insight.confidenceLevel * 100).toFixed(0)}%
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    {insight.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ==================== MAIN DASHBOARD COMPONENT ====================

export const AdvancedDashboard: React.FC = () => {
  const [view, setView] = useState<DashboardView>('overview');
  const [config, setConfig] = useState<DashboardConfig>({
    layout: 'grid',
    theme: 'auto',
    refreshInterval: 30000,
    enableRealTime: true,
    autoSave: true,
    compactMode: false,
    showTrends: true,
    timeRange: '30d',
  });
  const [notifications, setNotifications] = useState(3);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    analyticsData,
    isLoading,
    error,
    refreshData,
    exportAnalytics,
    computedAnalytics,
    performanceInsights
  } = useAdvancedAnalytics({
    enableRealTime: config.enableRealTime,
    refreshInterval: config.refreshInterval,
  });

  // Simulate notifications
  useEffect(() => {
    if (performanceInsights && performanceInsights.length > 0) {
      setNotifications(performanceInsights.length);
    }
  }, [performanceInsights]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleExport = async (format: string) => {
    await exportAnalytics(format as 'csv' | 'excel' | 'pdf');
  };

  const handleMetricClick = (metric: any) => {
    console.log('Metric clicked:', metric);
    // Navigate to detailed view or open modal
  };

  const handleChartClick = (chartId: string, data: any) => {
    console.log('Chart clicked:', chartId, data);
    // Navigate to detailed view or open modal
  };

  // Apply theme
  const themeClasses = useMemo(() => {
    switch (config.theme) {
      case 'dark':
        return 'dark bg-gray-900 text-white';
      case 'light':
        return 'bg-gray-50';
      default:
        return 'bg-gray-50 dark:bg-gray-900';
    }
  }, [config.theme]);

  if (error) {
    return (
      <div className={`min-h-screen ${themeClasses} flex items-center justify-center`}>
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            خطأ في تحميل البيانات
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error.message}
          </p>
          <Button onClick={handleRefresh}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${themeClasses} transition-colors duration-300`}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <DashboardHeader
          view={view}
          onViewChange={setView}
          config={config}
          onConfigChange={setConfig}
          onRefresh={handleRefresh}
          onExport={handleExport}
          isRefreshing={isRefreshing}
          notifications={notifications}
        />

        {/* Content Based on Current View */}
        <AnimatePresence mode="wait">
          {view === 'overview' && analyticsData && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <KPIDashboard
                analyticsData={analyticsData}
                onMetricClick={handleMetricClick}
                config={config}
              />
            </motion.div>
          )}

          {view === 'analytics' && analyticsData && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <AnalyticsView
                analyticsData={analyticsData}
                onChartClick={handleChartClick}
                config={config}
              />
            </motion.div>
          )}

          {view === 'funnel' && analyticsData && (
            <motion.div
              key="funnel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <FunnelView
                analyticsData={analyticsData}
                config={config}
              />
            </motion.div>
          )}

          {view === 'team' && analyticsData && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <TeamPerformanceView
                analyticsData={analyticsData}
                config={config}
              />
            </motion.div>
          )}

          {view === 'predictions' && analyticsData && (
            <motion.div
              key="predictions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <PredictionsView
                analyticsData={analyticsData}
                config={config}
              />
            </motion.div>
          )}

          {view === 'custom' && (
            <motion.div
              key="custom"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center py-12"
            >
              <Sliders className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                لوحة تحكم مخصصة
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                قم بتخصيص لوحة التحكم حسب احتياجاتك
              </p>
              <Button className="flex items-center space-x-2 space-x-reverse mx-auto">
                <Plus className="h-4 w-4" />
                <span>إنشاء لوحة مخصصة</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Performance Insights Notification */}
        <AnimatePresence>
          {performanceInsights && performanceInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 left-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm z-50"
            >
              <div className="flex items-start space-x-3 space-x-reverse">
                <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    رؤى جديدة
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    تم اكتشاف {performanceInsights.length} رؤى جديدة
                  </p>
                  <button
                    onClick={() => setNotifications(0)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    عرض التفاصيل
                  </button>
                </div>
                <button
                  onClick={() => setNotifications(0)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AdvancedDashboard;
