'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Clock,
  Users,
  Zap,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Share,
  Settings,
  Calendar,
  Filter,
  Search,
  Eye,
  Play,
  Pause,
  BarChart,
  PieChart as PieChartIcon,
  Scatter3D,
  Treemap,
  HeatMap,
  SankeyDiagram,
  Sparkles,
  Brain,
  GitBranch,
  Timer,
  Award,
  Star,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  User,
  Building,
  Target as TargetIcon,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Progress } from '../ui/Progress';
import { useToast } from '../../hooks/useToast';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';

// Analytics Types
export interface PlaybookAnalytics {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'paused' | 'draft';
  metrics: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    successRate: number;
    avgExecutionTime: number;
    totalRevenue: number;
    conversionValue: number;
    roi: number;
    completionRate: number;
    currentActive: number;
    avgStepsPerRun: number;
    mostUsedStep: string;
    leastEfficientStep: string;
  };
  trends: {
    daily: DailyMetric[];
    weekly: WeeklyMetric[];
    monthly: MonthlyMetric[];
  };
  comparisons: {
    previousPeriod: ComparisonMetric;
    industryAverage: number;
    bestInClass: number;
  };
  segments: {
    byLeadSource: SegmentMetric[];
    byTemperature: SegmentMetric[];
    byPriority: SegmentMetric[];
    byAssignee: SegmentMetric[];
  };
  aiInsights: AIInsight[];
}

export interface DailyMetric {
  date: string;
  runs: number;
  successRate: number;
  avgTime: number;
  revenue: number;
}

export interface WeeklyMetric {
  week: string;
  runs: number;
  successRate: number;
  avgTime: number;
  revenue: number;
}

export interface MonthlyMetric {
  month: string;
  runs: number;
  successRate: number;
  avgTime: number;
  revenue: number;
}

export interface ComparisonMetric {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SegmentMetric {
  segment: string;
  runs: number;
  successRate: number;
  avgTime: number;
  revenue: number;
  percentage: number;
}

export interface AIInsight {
  type: 'optimization' | 'alert' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
  potentialImprovement?: number;
  confidence: number;
}

export interface ABTestResult {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  variants: {
    id: string;
    name: string;
    description: string;
    steps: any[];
    metrics: {
      participants: number;
      conversions: number;
      conversionRate: number;
      avgTime: number;
      confidence: number;
    };
  }[];
  winner?: string;
  significance: number;
  startedAt: Date;
  endedAt?: Date;
}

interface AdvancedAnalyticsDashboardProps {
  playbookId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  onShare?: (analytics: PlaybookAnalytics) => void;
}

// Mock data generator
const generateMockAnalytics = (): PlaybookAnalytics => {
  const dailyData: DailyMetric[] = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = subDays(now, i);
    const baseRuns = 50 + Math.random() * 30;
    const successRate = 70 + Math.random() * 20;
    
    dailyData.push({
      date: format(date, 'yyyy-MM-dd'),
      runs: Math.floor(baseRuns),
      successRate: Math.round(successRate * 100) / 100,
      avgTime: Math.floor(120 + Math.random() * 60),
      revenue: Math.floor(baseRuns * successRate * 0.1 * 100)
    });
  }

  return {
    id: 'playbook-1',
    name: 'تأهيل العملاء الجدد',
    category: 'تأهيل العملاء',
    status: 'active',
    metrics: {
      totalRuns: 1523,
      successfulRuns: 1245,
      failedRuns: 278,
      successRate: 81.7,
      avgExecutionTime: 145,
      totalRevenue: 45680,
      conversionValue: 8500,
      roi: 340,
      completionRate: 95.2,
      currentActive: 23,
      avgStepsPerRun: 4.2,
      mostUsedStep: 'إرسال رسالة ترحيب',
      leastEfficientStep: 'مكالمة متابعة'
    },
    trends: {
      daily: dailyData,
      weekly: [],
      monthly: []
    },
    comparisons: {
      previousPeriod: {
        metric: 'success_rate',
        current: 81.7,
        previous: 78.2,
        change: 3.5,
        changePercent: 4.5,
        trend: 'up'
      },
      industryAverage: 75.3,
      bestInClass: 89.1
    },
    segments: {
      byLeadSource: [
        { segment: 'الموقع الإلكتروني', runs: 567, successRate: 85.2, avgTime: 132, revenue: 18500, percentage: 37.2 },
        { segment: 'فيسبوك', runs: 423, successRate: 78.9, avgTime: 156, revenue: 12300, percentage: 27.8 },
        { segment: 'جوجل', runs: 289, successRate: 82.1, avgTime: 145, revenue: 8900, percentage: 19.0 },
        { segment: 'إحالات', runs: 244, successRate: 88.3, avgTime: 128, revenue: 5980, percentage: 16.0 }
      ],
      byTemperature: [
        { segment: 'ساخن', runs: 298, successRate: 92.1, avgTime: 98, revenue: 22100, percentage: 19.6 },
        { segment: 'دافئ', runs: 756, successRate: 84.3, avgTime: 142, revenue: 18400, percentage: 49.6 },
        { segment: 'بارد', runs: 469, successRate: 68.7, avgTime: 178, revenue: 5180, percentage: 30.8 }
      ],
      byPriority: [
        { segment: 'عالية', runs: 445, successRate: 88.9, avgTime: 125, revenue: 28900, percentage: 29.2 },
        { segment: 'متوسطة', runs: 789, successRate: 80.1, avgTime: 148, revenue: 14200, percentage: 51.8 },
        { segment: 'منخفضة', runs: 289, successRate: 73.2, avgTime: 167, revenue: 2580, percentage: 19.0 }
      ],
      byAssignee: [
        { segment: 'أحمد محمد', runs: 412, successRate: 86.2, avgTime: 138, revenue: 15600, percentage: 27.1 },
        { segment: 'سارة أحمد', runs: 387, successRate: 84.1, avgTime: 142, revenue: 14200, percentage: 25.4 },
        { segment: 'محمد علي', runs: 356, successRate: 79.8, avgTime: 156, revenue: 12300, percentage: 23.4 },
        { segment: 'فاطمة حسن', runs: 368, successRate: 76.9, avgTime: 145, revenue: 3580, percentage: 24.1 }
      ]
    },
    aiInsights: [
      {
        type: 'optimization',
        title: 'تحسين خطوة إرسال رسالة الترحيب',
        description: 'يمكن تحسين معدل التفاعل بنسبة 15% عن طريق تخصيص الرسالة',
        impact: 'high',
        recommendation: 'تطبيق نظام تخصيص الرسائل بناءً على مصدر العميل',
        potentialImprovement: 15,
        confidence: 0.89
      },
      {
        type: 'opportunity',
        title: 'فتح السوق السعودي',
        description: 'العملاء من السعودية يظهرون معدل نجاح أعلى بـ 12%',
        impact: 'medium',
        recommendation: 'زيادة الاستثمار في التسويق للسوق السعودي',
        confidence: 0.76
      },
      {
        type: 'alert',
        title: 'تراجع في كفاءة خطوة المكالمات',
        description: 'معدل النجاح في خطوة المكالمات انخفض بنسبة 8% هذا الشهر',
        impact: 'medium',
        recommendation: 'مراجعة نص المكالمات وتدريب الفريق',
        confidence: 0.92
      }
    ]
  };
};

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  playbookId,
  timeRange,
  onExport,
  onShare
}) => {
  const [analytics, setAnalytics] = useState<PlaybookAnalytics>(generateMockAnalytics());
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('successRate');
  const [showABTests, setShowABTests] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { toast } = useToast();

  // Refresh analytics
  const refreshAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, this would fetch new data
      setAnalytics(generateMockAnalytics());
      
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث البيانات بنجاح'
      });
    } catch (error) {
      toast({
        title: 'خطأ في التحديث',
        description: 'فشل في تحديث البيانات',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]);

  // Get trend icon and color
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  // Format number
  const formatNumber = (num: number, decimals = 0) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get insight type color
  const getInsightTypeColor = (type: AIInsight['type']) => {
    const colors = {
      optimization: 'bg-blue-100 text-blue-800 border-blue-200',
      alert: 'bg-red-100 text-red-800 border-red-200',
      opportunity: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Mock AB Test data
  const abTestResults: ABTestResult[] = [
    {
      id: 'ab-1',
      name: 'اختبار رسالة الترحيب',
      status: 'completed',
      variants: [
        {
          id: 'control',
          name: 'التحكم',
          description: 'الرسالة الحالية',
          steps: [],
          metrics: {
            participants: 500,
            conversions: 187,
            conversionRate: 37.4,
            avgTime: 145,
            confidence: 0.95
          }
        },
        {
          id: 'variant-a',
          name: 'النص A',
          description: 'رسالة أكثر شخصية',
          steps: [],
          metrics: {
            participants: 520,
            conversions: 223,
            conversionRate: 42.9,
            avgTime: 138,
            confidence: 0.97
          }
        }
      ],
      winner: 'variant-a',
      significance: 95,
      startedAt: subWeeks(new Date(), 2),
      endedAt: subDays(new Date(), 3)
    }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">لوحة التحليلات المتقدمة</h2>
          <p className="text-gray-600">تحليلات شاملة وذكاء اصطناعي لتحسين الأداء</p>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 أيام</SelectItem>
              <SelectItem value="30d">30 يوم</SelectItem>
              <SelectItem value="90d">90 يوم</SelectItem>
              <SelectItem value="1y">سنة</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowABTests(true)}
          >
            <GitBranch className="w-4 h-4 ml-2" />
            اختبارات A/B
          </Button>
          
          {onShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShare(analytics)}
            >
              <Share className="w-4 h-4 ml-2" />
              مشاركة
            </Button>
          )}
          
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('pdf')}
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير
            </Button>
          )}
          
          <Button
            size="sm"
            onClick={refreshAnalytics}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">معدل النجاح</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatNumber(analytics.metrics.successRate, 1)}%
                </p>
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                  {getTrendIcon(analytics.comparisons.previousPeriod.trend)}
                  <span className="text-sm text-gray-600">
                    {formatNumber(analytics.comparisons.previousPeriod.changePercent, 1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي التشغيل</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatNumber(analytics.metrics.totalRuns)}
                </p>
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {analytics.metrics.currentActive} نشط
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">العائد على الاستثمار</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatNumber(analytics.metrics.roi)}%
                </p>
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formatCurrency(analytics.metrics.totalRevenue)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">متوسط وقت التنفيذ</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatNumber(analytics.metrics.avgExecutionTime)} دقيقة
                </p>
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formatNumber(analytics.metrics.avgStepsPerRun, 1)} خطوة
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Timer className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance vs Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Target className="w-5 h-5" />
            <span>مقارنة الأداء مع المعايير</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">معدل النجاح</span>
                <span className="text-sm text-gray-600">
                  {formatNumber(analytics.metrics.successRate, 1)}%
                </span>
              </div>
              <div className="relative">
                <Progress value={analytics.metrics.successRate} className="h-2" />
                <div className="absolute inset-0 flex justify-between text-xs text-gray-500 mt-1">
                  <span>متوسط الصناعة: {formatNumber(analytics.comparisons.industryAverage, 1)}%</span>
                  <span>الأفضل: {formatNumber(analytics.comparisons.bestInClass, 1)}%</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">معدل التحويل</span>
                <span className="text-sm text-gray-600">85.2%</span>
              </div>
              <div className="relative">
                <Progress value={85.2} className="h-2" />
                <div className="absolute inset-0 flex justify-between text-xs text-gray-500 mt-1">
                  <span>متوسط الصناعة: 78.5%</span>
                  <span>الأفضل: 92.1%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
          <TabsTrigger value="segments">التقسيم</TabsTrigger>
          <TabsTrigger value="steps">تحليل الخطوات</TabsTrigger>
          <TabsTrigger value="ai-insights">الرؤى الذكية</TabsTrigger>
          <TabsTrigger value="ab-testing">اختبارات A/B</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Daily Trends Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>اتجاه الأداء اليومي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">مخطط الاتجاهات اليومي</p>
                  <p className="text-sm text-gray-500">
                    يظهر البيانات خلال الـ {selectedTimeRange} الماضية
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance by Segment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الأداء حسب المصدر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.segments.byLeadSource.map((segment, index) => (
                    <div key={segment.segment} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                        }`} />
                        <span className="text-sm font-medium">{segment.segment}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {formatNumber(segment.successRate, 1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatNumber(segment.runs)} تشغيل
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الأداء حسب درجة الحرارة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.segments.byTemperature.map((segment, index) => (
                    <div key={segment.segment} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className={`w-3 h-3 rounded-full ${
                          segment.segment === 'ساخن' ? 'bg-red-500' :
                          segment.segment === 'دافئ' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <span className="text-sm font-medium">{segment.segment}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {formatNumber(segment.successRate, 1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatNumber(segment.runs)} تشغيل
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تحليل الاتجاهات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Chart Placeholders */}
                <div className="lg:col-span-2">
                  <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">مخطط الاتجاهات الزمني</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">أفضل يوم</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {format(subDays(new Date(), 5), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-2xl font-bold text-green-800">
                      {formatNumber(94.2, 1)}% نجاح
                    </p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-800">أضعف يوم</span>
                    </div>
                    <p className="text-sm text-red-700">
                      {format(subDays(new Date(), 12), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-2xl font-bold text-red-800">
                      {formatNumber(68.5, 1)}% نجاح
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Segment Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>تحليل التقسيم المفصل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <PieChartIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">مخطط دائري للتقسيم</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الأداء حسب المسؤول</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.segments.byAssignee.map((assignee, index) => (
                    <div key={assignee.segment} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{assignee.segment}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {formatNumber(assignee.successRate, 1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(assignee.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تحليل أداء الخطوات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">الخطوة الأكثر فعالية</span>
                  </div>
                  <p className="text-lg font-bold text-green-800">
                    {analytics.metrics.mostUsedStep}
                  </p>
                  <p className="text-sm text-green-700">معدل نجاح: 96.2%</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">الخطوة الأقل كفاءة</span>
                  </div>
                  <p className="text-lg font-bold text-red-800">
                    {analytics.metrics.leastEfficientStep}
                  </p>
                  <p className="text-sm text-red-700">معدل نجاح: 72.8%</p>
                </div>
                
                {/* Step Analysis Table Placeholder */}
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">جدول تحليل الخطوات</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Brain className="w-5 h-5" />
                <span>رؤى الذكاء الاصطناعي</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.aiInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-4 border rounded-lg ${getInsightTypeColor(insight.type)}`}
                  >
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className="flex-shrink-0">
                        {insight.type === 'optimization' && <Sparkles className="w-5 h-5" />}
                        {insight.type === 'alert' && <AlertTriangle className="w-5 h-5" />}
                        {insight.type === 'opportunity' && <TargetIcon className="w-5 h-5" />}
                        {insight.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{insight.title}</h3>
                        <p className="text-sm opacity-90 mb-2">{insight.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Badge variant="outline" className="text-xs">
                              تأثير {insight.impact === 'high' ? 'عالي' : 
                                   insight.impact === 'medium' ? 'متوسط' : 'منخفض'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ثقة {formatNumber(insight.confidence * 100, 0)}%
                            </Badge>
                            {insight.potentialImprovement && (
                              <Badge variant="outline" className="text-xs">
                                تحسن محتمل +{insight.potentialImprovement}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-sm">
                          <strong>التوصية:</strong> {insight.recommendation}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ab-testing" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">اختبارات A/B الجارية</h3>
            <Button size="sm">
              <Plus className="w-4 h-4 ml-2" />
              اختبار جديد
            </Button>
          </div>
          
          <div className="space-y-4">
            {abTestResults.map((test) => (
              <Card key={test.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-lg">{test.name}</h4>
                      <p className="text-sm text-gray-600">
                        {format(test.startedAt, 'dd/MM/yyyy')} - {
                          test.endedAt ? format(test.endedAt, 'dd/MM/yyyy') : 'جاري'
                        }
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge className={
                        test.status === 'completed' ? 'bg-green-100 text-green-800' :
                        test.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {test.status === 'completed' ? 'مكتمل' :
                         test.status === 'running' ? 'جاري' : 'متوقف'}
                      </Badge>
                      
                      {test.status === 'completed' && test.winner && (
                        <Badge className="bg-purple-100 text-purple-800">
                          الفائز: {test.variants.find(v => v.id === test.winner)?.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {test.variants.map((variant) => (
                      <div key={variant.id} className={`p-4 border rounded-lg ${
                        variant.id === test.winner ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{variant.name}</h5>
                          {variant.id === test.winner && (
                            <Star className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{variant.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">المشاركون:</span>
                            <div className="font-semibold">{formatNumber(variant.metrics.participants)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">معدل التحويل:</span>
                            <div className="font-semibold">{formatNumber(variant.metrics.conversionRate, 1)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">الوقت المتوسط:</span>
                            <div className="font-semibold">{formatNumber(variant.metrics.avgTime)} دقيقة</div>
                          </div>
                          <div>
                            <span className="text-gray-600">مستوى الثقة:</span>
                            <div className="font-semibold">{formatNumber(variant.metrics.confidence * 100, 0)}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {test.status === 'completed' && (
                    <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Award className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-800">
                          نتيجة الاختبار: الفائز هو "{test.variants.find(v => v.id === test.winner)?.name}" 
                          بمستوى ثقة {test.significance}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;