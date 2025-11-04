'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { ar } from 'date-fns/locale';
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
} from 'recharts';
import {
  RefreshCw,
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
  Bell,
  Search,
  Plus,
  Grid3X3,
  List,
  Filter as FilterIcon,
  X,
} from 'lucide-react';

// استيراد Hook الجديد
import { useDashboardComplete } from '../../hooks/useDashboardData';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import LeadCard from '../../components/leads/LeadCard';
import NotificationCenter from '../../components/notifications/NotificationCenter';
import { 
  LeadWithIntelligence, 
  NotificationCount,
  KPIMetric,
  ConversionTrend
} from '../../types/lead-intelligence';

// ==================== ENHANCED TYPES ====================

type DateRange = 'today' | 'week' | 'month' | 'year';
type ViewMode = 'grid' | 'list' | 'cards';
type ThemeMode = 'light' | 'dark' | 'auto';
type DensityMode = 'compact' | 'comfortable' | 'spacious';

interface MetricCardProps {
  title: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  format?: 'number' | 'currency' | 'percentage';
}

interface DashboardFilters {
  dateRange: DateRange;
  viewMode: ViewMode;
  theme: ThemeMode;
  density: DensityMode;
  autoRefresh: boolean;
  refreshInterval: number;
}

// ==================== UTILITY FUNCTIONS ====================

function getDateRange(range: DateRange) {
  const now = new Date();
  switch (range) {
    case 'today':
      return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()), to: now };
    case 'week':
      return { from: subWeeks(now, 1), to: now };
    case 'month':
      return { from: subMonths(now, 1), to: now };
    case 'year':
      return { from: subYears(now, 1), to: now };
    default:
      return { from: subMonths(now, 1), to: now };
  }
}

function formatMetricValue(value: number, format: 'number' | 'currency' | 'percentage' = 'number'): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return new Intl.NumberFormat('ar-SA').format(value);
  }
}

function getTrendColor(trend?: 'up' | 'down' | 'stable', change?: number): string {
  if (!trend || change === undefined) return 'text-gray-500';
  
  if (trend === 'up') return change > 0 ? 'text-green-500' : 'text-red-500';
  if (trend === 'down') return change < 0 ? 'text-green-500' : 'text-red-500';
  return 'text-gray-500';
}

// ==================== DASHBOARD COMPONENTS ====================

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = 'primary',
  format = 'number',
}) => {
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    success: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    warning: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colorClasses[color]} p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatMetricValue(value, format)}
          </p>
          {(change !== undefined) && (
            <div className={`flex items-center mt-2 text-sm ${getTrendColor(trend, change)}`}>
              {trend === 'up' ? <ArrowUpRight size={16} /> : trend === 'down' ? <ArrowDownRight size={16} /> : <Activity size={16} />}
              <span className="mr-1">{Math.abs(change).toFixed(1)}%</span>
              <span className="text-gray-500">
                {trend === 'up' ? 'زيادة' : trend === 'down' ? 'انخفاض' : 'مستقر'}
              </span>
            </div>
          )}
        </div>
        <Icon size={32} className="opacity-80" />
      </div>
    </motion.div>
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-32" />
      ))}
    </div>
  </div>
);

const ErrorMessage: React.FC<{ error: Error; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
    <div className="flex items-center">
      <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
      <span className="text-red-700 dark:text-red-400">{error.message}</span>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mr-auto text-red-600 border-red-300 hover:bg-red-100"
        >
          إعادة المحاولة
        </Button>
      )}
    </div>
  </div>
);

// ==================== MAIN DASHBOARD COMPONENT ====================

export default function DashboardUpdated() {
  // State management
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: 'month',
    viewMode: 'grid',
    theme: 'light',
    density: 'comfortable',
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  // استخدام الـ Hook الجديد لجلب البيانات
  const {
    dashboardData,
    dashboardLoading,
    dashboardError,
    leadsData,
    leadsLoading,
    leadsError,
    tasksData,
    tasksLoading,
    tasksError,
    messagesData,
    messagesLoading,
    messagesError,
    analyticsData,
    analyticsLoading,
    analyticsError,
    isLoading,
    error,
    refreshAll,
    fetchNextPage,
    hasNextPage,
  } = useDashboardComplete({
    dateRange: getDateRange(filters.dateRange),
    period: filters.dateRange,
  });

  // معالجة تغيير الفلتر
  const handleFilterChange = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // معالجة إعادة التحميل
  const handleRefresh = useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  // معالجة تحميل المزيد من العملاء المحتملين
  const handleLoadMore = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  // معالجة الخطأ العام
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorMessage 
          error={error instanceof Error ? error : new Error('حدث خطأ غير متوقع')} 
          onRetry={handleRefresh} 
        />
      </div>
    );
  }

  // بيانات الكارديت الرئيسية
  const metricsData = dashboardData?.kpis || [
    { 
      id: '1', 
      title: 'العملاء المحتملين', 
      value: 2847, 
      change: 12.5, 
      trend: 'up' as const,
      icon: Users,
      format: 'number' as const 
    },
    { 
      id: '2', 
      title: 'المبيعات المحولة', 
      value: 892, 
      change: 8.3, 
      trend: 'up' as const,
      icon: Target,
      format: 'number' as const 
    },
    { 
      id: '3', 
      title: 'معدل التحويل', 
      value: 31.4, 
      change: 2.1, 
      trend: 'up' as const,
      icon: TrendingUp,
      format: 'percentage' as const 
    },
    { 
      id: '4', 
      title: 'قيمة المبيعات', 
      value: 456000, 
      change: 15.7, 
      trend: 'up' as const,
      icon: DollarSign,
      format: 'currency' as const 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                لوحة التحكم
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                نظرة شاملة على أداء مبيعاتك وعملةاءك المحتملين
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Date Range Selector */}
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange({ dateRange: e.target.value as DateRange })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
                <option value="year">هذا العام</option>
              </select>

              {/* Refresh Button */}
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metricsData.map((metric, index) => (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MetricCard {...metric} />
                </motion.div>
              ))}
            </div>

            {/* Leads Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Leads */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    العملاء المحتملين الأحدث
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {leadsData?.pages[0]?.items?.length || 0} عميل
                  </span>
                </div>
                
                {leadsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : leadsError ? (
                  <ErrorMessage 
                    error={leadsError instanceof Error ? leadsError : new Error('فشل في جلب العملاء المحتملين')}
                    onRetry={() => window.location.reload()} 
                  />
                ) : (
                  <div className="space-y-4">
                    {leadsData?.pages.flatMap(page => page.items)?.slice(0, 5).map((lead: LeadWithIntelligence) => (
                      <div key={lead.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {lead.firstName} {lead.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{lead.company}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Thermometer size={16} className="text-orange-500" />
                            <span className="text-sm font-medium">{lead.intelligence?.temperature || 'غير محدد'}</span>
                          </div>
                          <p className="text-xs text-gray-500">{lead.status}</p>
                        </div>
                      </div>
                    ))}
                    
                    {hasNextPage && (
                      <div className="text-center pt-4">
                        <Button
                          onClick={handleLoadMore}
                          variant="outline"
                          size="sm"
                          disabled={leadsLoading}
                        >
                          {leadsLoading ? 'جاري التحميل...' : 'تحميل المزيد'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Notifications */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    الإشعارات والتنبيهات
                  </h3>
                  <Bell className="h-5 w-5 text-gray-500" />
                </div>
                
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messagesError ? (
                  <ErrorMessage 
                    error={messagesError instanceof Error ? messagesError : new Error('فشل في جلب الرسائل')}
                  />
                ) : (
                  <div className="space-y-4">
                    {messagesData?.slice(0, 5).map((message: any) => (
                      <div key={message.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                          {message.type === 'email' ? <Mail size={16} className="text-green-600" /> :
                           message.type === 'sms' ? <MessageSquare size={16} className="text-blue-600" /> :
                           <Phone size={16} className="text-purple-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{message.subject}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{message.preview}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                الإجراءات السريعة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Plus className="h-6 w-6" />
                  <span>عميل محتمل جديد</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <MessageSquare className="h-6 w-6" />
                  <span>إرسال رسالة</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>عرض التقارير</span>
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
