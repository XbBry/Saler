'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import { analyticsApi } from '../../lib/api';
import { AnalyticsData } from '../../types';
import { 
  DashboardIntelligence, 
  LeadWithIntelligence, 
  NotificationCount,
  LeadCardProps,
  QuickActionsDashboardProps
} from '../../types/lead-intelligence';
import { 
  LeadScoringEngine, 
  TemperatureEngine, 
  PredictiveEngine,
  RealTimeTracker 
} from '../../lib/lead-intelligence';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import LeadCard from '../../components/leads/LeadCard';
import LeadActivityTimeline from '../../components/leads/LeadActivityTimeline';
import LeadScoreVisualization from '../../components/leads/LeadScoreVisualization';
import NotificationCenter from '../../components/notifications/NotificationCenter';

// ==================== ENHANCED TYPES ====================

type DateRange = 'today' | 'week' | 'month' | 'year';
type ViewMode = 'grid' | 'list' | 'cards';
type ThemeMode = 'light' | 'dark' | 'auto';
type DensityMode = 'compact' | 'comfortable' | 'spacious';

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
  loading?: boolean;
  description?: string;
  color?: string;
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface ActivityItem {
  id: string;
  type: 'lead' | 'message' | 'conversion' | 'revenue';
  description: string;
  timestamp: string;
  amount?: number;
  temperature?: 'hot' | 'warm' | 'cold';
  score?: number;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
  priority?: 'high' | 'medium' | 'low';
  actions?: Array<{ label: string; action: string }>;
}

interface DashboardPreferences {
  viewMode: ViewMode;
  theme: ThemeMode;
  density: DensityMode;
  autoRefresh: boolean;
  refreshInterval: number;
  visibleWidgets: string[];
  layout: string[];
}

// ==================== DASHBOARD COMPONENTS ====================

const EnhancedMetricCard: React.FC<MetricCardProps & { 
  description?: string; 
  color?: string; 
  temperature?: 'hot' | 'warm' | 'cold';
  intelligence?: number;
}> = ({
  title,
  value,
  change,
  icon,
  trend,
  loading = false,
  description,
  color = 'blue',
  temperature,
  intelligence,
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    red: 'from-red-50 to-red-100 border-red-200',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200',
    green: 'from-green-50 to-green-100 border-green-200',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200',
  };

  const iconColorClasses = {
    blue: 'text-blue-600 bg-blue-500',
    red: 'text-red-600 bg-red-500',
    yellow: 'text-yellow-600 bg-yellow-500',
    purple: 'text-purple-600 bg-purple-500',
    orange: 'text-orange-600 bg-orange-500',
    green: 'text-green-600 bg-green-500',
    emerald: 'text-emerald-600 bg-emerald-500',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`p-6 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} hover:shadow-xl transition-all duration-300 border-2`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 space-x-reverse mb-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-800">{title}</p>
              {temperature && (
                <div className={`flex items-center space-x-1 space-x-reverse px-2 py-1 rounded-full text-xs font-medium ${
                  temperature === 'hot' ? 'bg-red-200 text-red-800' :
                  temperature === 'warm' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-blue-200 text-blue-800'
                }`}>
                  <Thermometer className="w-3 h-3" />
                  {temperature === 'hot' ? 'ساخن' : temperature === 'warm' ? 'دافئ' : 'بارد'}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <motion.h3 
                className={`text-3xl font-bold ${
                  color === 'red' ? 'text-red-700' :
                  color === 'yellow' ? 'text-yellow-700' :
                  color === 'purple' ? 'text-purple-700' :
                  color === 'orange' ? 'text-orange-700' :
                  color === 'green' ? 'text-green-700' :
                  color === 'emerald' ? 'text-emerald-700' :
                  'text-blue-700'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {typeof value === 'number' ? formatNumber(value) : value}
                  </motion.span>
                )}
              </motion.h3>
              
              <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 ml-1" />
                )}
                <motion.span 
                  className="text-sm font-medium"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {Math.abs(change)}%
                </motion.span>
              </div>
            </div>
            
            {description && (
              <motion.p 
                className="text-xs text-gray-600 dark:text-gray-700 mb-2"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {description}
              </motion.p>
            )}
            
            {intelligence && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="flex items-center space-x-1 space-x-reverse">
                  <Brain className="w-3 h-3 text-purple-600" />
                  <span className="text-xs text-purple-600">ذكاء: {intelligence}%</span>
                </div>
              </div>
            )}
          </div>
          
          <motion.div 
            className={`p-3 rounded-lg ${iconColorClasses[color as keyof typeof iconColorClasses]} text-white shadow-lg`}
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

const LoadingCard: React.FC = () => (
  <Card className="p-6">
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-10 w-10 bg-gray-200 rounded"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </div>
  </Card>
);

const ChartCard: React.FC<{
  title: string;
  children: React.ReactNode;
  loading?: boolean;
}> = ({ title, children, loading }) => (
  <Card className="p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {loading ? (
      <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
    ) : (
      <div className="h-64">{children}</div>
    )}
  </Card>
);

const ActivityItemComponent: React.FC<{ activity: ActivityItem }> = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'lead':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'conversion':
        return <Target className="h-4 w-4 text-purple-600" />;
      case 'revenue':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex items-center space-x-3 space-x-reverse p-3 hover:bg-gray-50 rounded-lg">
      <div className="p-2 bg-gray-50 rounded-full">{getActivityIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{activity.description}</p>
        <p className="text-xs text-gray-500">{format(new Date(activity.timestamp), 'HH:mm', { locale: ar })}</p>
      </div>
      {activity.amount && (
        <div className="text-sm font-semibold text-green-600">
          {activity.amount.toLocaleString('ar-SA')} ريال
        </div>
      )}
    </div>
  );
};

const NotificationComponent: React.FC<{ notification: NotificationItem }> = ({ notification }) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-start space-x-3 space-x-reverse">
        {getNotificationIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-2">
            {format(new Date(notification.timestamp), 'dd MMM yyyy, HH:mm', { locale: ar })}
          </p>
        </div>
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
        )}
      </div>
    </div>
  );
};

// ==================== ENHANCED MAIN DASHBOARD COMPONENT ====================

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('leads');
  
  // Enhanced state management
  const [preferences, setPreferences] = useState<DashboardPreferences>({
    viewMode: 'cards',
    theme: 'light',
    density: 'comfortable',
    autoRefresh: true,
    refreshInterval: 30000,
    visibleWidgets: ['metrics', 'charts', 'leads', 'activities', 'notifications', 'insights'],
    layout: ['metrics', 'charts', 'leads'],
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTemperature, setFilterTemperature] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  const queryClient = useQueryClient();
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Calculate date range based on selection
  const getDateRange = useCallback(() => {
    const now = new Date();
    const endDate = format(now, 'yyyy-MM-dd');
    
    let startDate: string;
    switch (dateRange) {
      case 'today':
        startDate = format(now, 'yyyy-MM-dd');
        break;
      case 'week':
        startDate = format(subWeeks(now, 1), 'yyyy-MM-dd');
        break;
      case 'month':
        startDate = format(subMonths(now, 1), 'yyyy-MM-dd');
        break;
      case 'year':
        startDate = format(subYears(now, 1), 'yyyy-MM-dd');
        break;
      default:
        startDate = format(subMonths(now, 1), 'yyyy-MM-dd');
    }
    
    return { startDate, endDate };
  }, [dateRange]);

  const { startDate, endDate } = getDateRange();

  // Enhanced analytics data query with real-time updates
  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useQuery<AnalyticsData>({
    queryKey: ['dashboard', dateRange, startDate, endDate],
    queryFn: () => analyticsApi.getDashboard({ start_date: startDate, end_date: endDate }),
    refetchInterval: preferences.autoRefresh ? preferences.refreshInterval : false,
    staleTime: 30000,
    gcTime: 300000, // 5 minutes
  });

  // Lead intelligence data
  const {
    data: leadsWithIntelligence = [],
    isLoading: leadsLoading,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['leads-intelligence', dateRange],
    queryFn: async ({ pageParam = 0 }) => {
      // Mock data for demonstration
      const mockLeads: LeadWithIntelligence[] = [
        {
          id: '1',
          firstName: 'أحمد',
          lastName: 'محمد',
          email: 'ahmed@example.com',
          phone: '+966501234567',
          company: 'شركة التقنية المتقدمة',
          position: 'مدير تقنية المعلومات',
          source: 'الموقع الإلكتروني',
          status: 'qualified',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          owner: 'current-user',
          value: 150000,
          stage: 'proposal',
          intelligence: {
            id: 'intel-1',
            leadId: '1',
            score: LeadScoringEngine.calculateScore({
              engagement: { responseRate: 0.8, openRate: 0.7, clickRate: 0.5 },
              activities: [{ timestamp: new Date().toISOString() }],
              lastActivity: new Date().toISOString(),
              companySize: 500,
              position: 'مدير تقنية المعلومات',
              createdAt: new Date().toISOString(),
              referrals: [],
              companyRating: 4,
            }),
            temperature: TemperatureEngine.calculateTemperature({
              engagement: { responseRate: 0.8 },
              lastActivity: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              referrals: [],
              companyRating: 4,
            }),
            engagement: {
              email: { opens: 45, clicks: 23, replies: 8, forwards: 2, lastActivity: new Date().toISOString(), engagementRate: 78, trend: 'up' },
              calls: { opens: 0, clicks: 0, replies: 0, forwards: 0, lastActivity: new Date(Date.now() - 3600000).toISOString(), engagementRate: 0, trend: 'stable' },
              website: { opens: 0, clicks: 0, replies: 0, forwards: 0, lastActivity: new Date(Date.now() - 7200000).toISOString(), engagementRate: 0, trend: 'stable' },
              social: { opens: 0, clicks: 0, replies: 0, forwards: 0, lastActivity: new Date(Date.now() - 10800000).toISOString(), engagementRate: 0, trend: 'stable' },
              overall: {
                totalTouchpoints: 78,
                averageResponseTime: 2.5,
                preferredChannel: 'email',
                engagementQuality: 85,
                attentionSpan: 45,
              },
              realTime: {
                isOnline: false,
                sessionDuration: 0,
                lastSeen: new Date(Date.now() - 3600000).toISOString(),
                pagesViewed: 3,
                timeOnSite: 120,
              },
            },
            activity: {
              timeline: [],
              recent: [],
              patterns: [],
              triggers: [],
              score: { frequency: 85, quality: 90, recency: 95, consistency: 80, responsiveness: 85 },
            },
            predictions: PredictiveEngine.generateInsights({
              intelligence: {
                score: LeadScoringEngine.calculateScore({}),
                temperature: TemperatureEngine.calculateTemperature({}),
              },
              value: 150000,
              createdAt: new Date().toISOString(),
            }),
            insights: {
              personality_insights: {
                type: 'analytical',
                traits: ['منطقي', 'مفصل', 'دقيق'],
                motivations: ['الكفاءة', 'الجودة', 'الابتكار'],
                decision_style: 'منهجي',
                communication_style: 'مهني مباشر',
              },
              communication_preferences: {
                preferred_channels: ['email', 'video_call'],
                best_contact_times: ['10:00-12:00', '14:00-16:00'],
                response_speed: 'سريع',
                tone_preference: 'مهني',
                language_preference: ['العربية', 'الإنجليزية'],
              },
              buying_signals: {
                signals: [
                  { signal: 'طلب عرض توضيحي', strength: 90, frequency: 'high', significance: 'high', timestamp: new Date().toISOString() },
                  { signal: 'أسئلة تقنية مفصلة', strength: 85, frequency: 'medium', significance: 'high', timestamp: new Date().toISOString() },
                ],
                urgency_level: 80,
                decision_stage: 'evaluation',
                buying_readiness: 85,
              },
              objections: {
                likely_objections: [
                  { objection: 'التكلفة', frequency: 70, impact: 60, overcome_strategy: 'إظهار ROI والتوفير طويل المدى' },
                ],
                overcome_strategies: ['دراسات حالة', 'عروض توضيحية مجانية', 'فترة تجريبية'],
                success_rate: 75,
              },
              competitor_analysis: {
                competing_companies: ['شركة أ', 'شركة ب'],
                competitive_advantages: ['دعم فني متميز', 'تكلفة أقل', 'تنفيذ أسرع'],
                switching_factors: ['جودة الخدمة', 'سهولة الاستخدام', 'الدعم'],
                market_position: 'قائد محلي',
              },
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          priority: 'high',
          tags: ['مستهدف', 'تقني', 'كبير'],
          customFields: { budget: 200000, timeline: '3 months' },
        },
      ];
      return mockLeads;
    },
    getNextPageParam: (lastPage) => lastPage.length >= 10 ? lastPage.length : undefined,
  });

  // Real-time activity tracking
  useEffect(() => {
    if (!realTimeEnabled) return;

    // Subscribe to real-time updates
    RealTimeTracker.subscribe('activity', (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['leads-intelligence'] });
    });

    RealTimeTracker.subscribe('intelligence', (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads-intelligence', data.leadId] });
    });

    return () => {
      // Cleanup subscriptions
    };
  }, [realTimeEnabled, queryClient]);

  // Filtered leads based on search and filters
  const filteredLeads = useMemo(() => {
    const allLeads = leadsWithIntelligence.flat();
    return allLeads.filter(lead => {
      const matchesSearch = searchQuery === '' || 
        lead.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
      const matchesTemperature = filterTemperature === 'all' || 
        lead.intelligence.temperature.level === filterTemperature;

      return matchesSearch && matchesStatus && matchesTemperature;
    });
  }, [leadsWithIntelligence, searchQuery, filterStatus, filterTemperature]);

  // Dashboard intelligence summary
  const dashboardIntelligence = useMemo(() => {
    const allLeads = filteredLeads;
    const hotLeads = allLeads.filter(lead => lead.intelligence.temperature.level === 'hot');
    const avgScore = allLeads.length > 0 
      ? Math.round(allLeads.reduce((sum, lead) => sum + lead.intelligence.score.overall, 0) / allLeads.length)
      : 0;
    const avgConversionProb = allLeads.length > 0
      ? Math.round(allLeads.reduce((sum, lead) => sum + lead.intelligence.predictions.conversion_probability, 0) / allLeads.length)
      : 0;

    return {
      totalLeads: allLeads.length,
      hotLeads: hotLeads.length,
      avgScore,
      avgConversionProb,
      highPriorityLeads: allLeads.filter(lead => lead.priority === 'high').length,
    };
  }, [filteredLeads]);

  // Enhanced activities with intelligence
  const enhancedActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'lead',
      description: 'عميل ساخن جديد: أحمد محمد - شركة التقنية',
      timestamp: new Date().toISOString(),
      temperature: 'hot',
      score: 92,
    },
    {
      id: '2',
      type: 'message',
      description: 'رد سريع من سارة أحمد (درجة حرارة: دافئ)',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      temperature: 'warm',
      score: 78,
    },
    {
      id: '3',
      type: 'conversion',
      description: 'تحويل عميل من مرحلة التأهيل إلى المقترح - نقاط عالية',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      temperature: 'hot',
      score: 88,
    },
    {
      id: '4',
      type: 'revenue',
      description: 'إغلاق صفقة بقيمة 150,000 ريال - عميل ذكي',
      timestamp: new Date(Date.now() - 5400000).toISOString(),
      amount: 150000,
      temperature: 'hot',
      score: 95,
    },
    {
      id: '5',
      type: 'lead',
      description: 'نشاط مكثف من محمد علي - يتطلب متابعة',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      temperature: 'warm',
      score: 72,
    },
  ];

  // Enhanced notifications with intelligence
  const enhancedNotifications: NotificationItem[] = [
    {
      id: '1',
      title: 'عميل ساخن جديد',
      message: 'أحمد محمد أظهر اهتماماً عالياً - احتمالية تحويل 85%',
      type: 'success',
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'high',
      actions: [
        { label: 'اتصل الآن', action: 'call' },
        { label: 'إرسال عرض', action: 'proposal' },
      ],
    },
    {
      id: '2',
      title: 'تنبؤ: إغلاق قريب',
      message: '3 عملاء مرشحين للإغلاق خلال أسبوع (احتمالية > 70%)',
      type: 'info',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      isRead: false,
      priority: 'medium',
    },
    {
      id: '3',
      title: 'تحذير: خطر فقدان عميل',
      message: 'العميل سارة أحمد لم تتفاعل لمدة 7 أيام - انخفاض درجة الحرارة',
      type: 'warning',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: true,
      priority: 'high',
    },
    {
      id: '4',
      title: 'فرصة ذكية',
      message: 'محمد علي قد يحتاج مشروع إضافي - تقدير قيمة: 80,000 ريال',
      type: 'success',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isRead: false,
      priority: 'medium',
      actions: [
        { label: 'عرض إضافي', action: 'additional_offer' },
      ],
    },
  ];

  // Enhanced refresh handler with intelligent data updates
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['leads-intelligence'] });
      
      // Simulate real-time intelligence updates
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }, 1000);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Performance optimizations
  const handleVirtualScroll = useCallback(() => {
    if (filteredLeads.length > 100) {
      // Implement virtual scrolling for large datasets
      console.log('Virtual scrolling enabled for', filteredLeads.length, 'leads');
    }
  }, [filteredLeads.length]);

  // Theme management
  const themeClasses = useMemo(() => {
    switch (preferences.theme) {
      case 'dark':
        return 'bg-gray-900 text-white';
      case 'auto':
        return 'bg-gray-50 dark:bg-gray-900';
      default:
        return 'bg-gray-50';
    }
  }, [preferences.theme]);

  // Chart data
  const trendChartData = analyticsData?.leads?.trends || [];
  
  const statusChartData = analyticsData?.leads?.by_status 
    ? Object.entries(analyticsData.leads.by_status).map(([status, count]) => ({
        name: status === 'new' ? 'جديد' : 
              status === 'contacted' ? 'تم التواصل' :
              status === 'qualified' ? 'مؤهل' :
              status === 'proposal' ? 'عرض سعر' :
              status === 'negotiation' ? 'تفاوض' :
              status === 'closed_won' ? 'مغلق - ناجح' :
              status === 'closed_lost' ? 'مغلق - فاشل' : status,
        value: count,
      }))
    : [];

  const sourceChartData = analyticsData?.leads?.by_source
    ? Object.entries(analyticsData.leads.by_source).map(([source, count]) => ({
        name: source,
        value: count,
      }))
    : [];

  const performanceChartData = [
    { name: 'يناير', العملاء: 45, المحادثات: 32, الرسائل: 156 },
    { name: 'فبراير', العملاء: 52, المحادثات: 38, الرسائل: 189 },
    { name: 'مارس', العملاء: 48, المحادثات: 35, الرسائل: 167 },
    { name: 'أبريل', العملاء: 61, المحادثات: 45, الرسائل: 203 },
    { name: 'مايو', العملاء: 55, المحادثات: 42, الرسائل: 178 },
    { name: 'يونيو', العملاء: 67, المحادثات: 51, الرسائل: 234 },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <motion.div 
      className={`min-h-screen ${themeClasses}`}
      dir="rtl"
      ref={dashboardRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Dashboard Header with Intelligence */}
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
                  لوحة التحكم الذكية
                </h1>
                <motion.div
                  className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 rounded-full"
                  whileHover={{ scale: 1.05 }}
                >
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">مدعومة بالذكاء الاصطناعي</span>
                </motion.div>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                مرحباً بك في منصة سالير المتطورة - إدارة ذكية للمبيعات والعملاء المحتملين
              </p>
              
              {/* Intelligence Summary */}
              <div className="flex items-center space-x-6 space-x-reverse mt-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Zap className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {dashboardIntelligence.hotLeads} عميل ساخن
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    متوسط النقاط: {dashboardIntelligence.avgScore}
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    احتمالية التحويل: {dashboardIntelligence.avgConversionProb}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
                <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                  <Input
                    placeholder="البحث في العملاء..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 text-sm"
                  />
                  <Search className="w-4 h-4 text-gray-400 ml-2 mt-2" />
                </div>
                
                {/* Date Range Selector */}
                <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                  {(['today', 'week', 'month', 'year'] as DateRange[]).map((range) => (
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
                      {range === 'year' && 'السنة'}
                    </button>
                  ))}
                </div>
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
                
                <Button
                  onClick={() => setShowNotifications(!showNotifications)}
                  variant="outline"
                  size="sm"
                  className="flex items-center relative"
                >
                  <Bell className="h-4 w-4 ml-2" />
                  التنبيهات
                  {enhancedNotifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {enhancedNotifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </Button>
                
                <Button
                  onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                  variant={realTimeEnabled ? "default" : "outline"}
                  size="sm"
                  className="flex items-center"
                >
                  {realTimeEnabled ? <Pause className="h-4 w-4 ml-2" /> : <Play className="h-4 w-4 ml-2" />}
                  {realTimeEnabled ? 'إيقاف مباشر' : 'تشغيل مباشر'}
                </Button>
                
                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  variant="outline"
                  size="sm"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Intelligence Metrics */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {isLoading ? (
            Array.from({ length: 7 }).map((_, i) => <LoadingCard key={i} />)
          ) : (
            <>
              <EnhancedMetricCard
                title="إجمالي العملاء"
                value={dashboardIntelligence.totalLeads}
                change={12.5}
                icon={<Users className="h-6 w-6" />}
                trend="up"
                description="جميع العملاء مع الذكاء الاصطناعي"
                color="blue"
                intelligence={85}
              />
              <EnhancedMetricCard
                title="العملاء الساخنة"
                value={dashboardIntelligence.hotLeads}
                change={8.3}
                icon={<Zap className="h-6 w-6" />}
                trend="up"
                description="مستعدين للإغلاق الفوري"
                color="red"
                temperature="hot"
              />
              <EnhancedMetricCard
                title="متوسط النقاط"
                value={dashboardIntelligence.avgScore}
                change={5.7}
                icon={<Star className="h-6 w-6" />}
                trend="up"
                description="جودة العملاء المحتملين"
                color="yellow"
                intelligence={92}
              />
              <EnhancedMetricCard
                title="احتمالية التحويل"
                value={dashboardIntelligence.avgConversionProb}
                change={-2.1}
                icon={<Target className="h-6 w-6" />}
                trend="down"
                description="نسبة الذكاء الاصطناعي"
                color="purple"
                intelligence={88}
              />
              <EnhancedMetricCard
                title="العملاء عالية الأولوية"
                value={dashboardIntelligence.highPriorityLeads}
                change={15.2}
                icon={<AlertCircle className="h-6 w-6" />}
                trend="up"
                description="يحتاجون متابعة فورية"
                color="orange"
                temperature="hot"
              />
              <EnhancedMetricCard
                title="الرسائل الذكية"
                value={analyticsData?.messages?.total || 0}
                change={18.9}
                icon={<MessageSquare className="h-6 w-6" />}
                trend="up"
                description="مع تحليل ذكي للتفاعل"
                color="green"
              />
              <EnhancedMetricCard
                title="الإيرادات المتوقعة"
                value={285000}
                change={24.6}
                icon={<DollarSign className="h-6 w-6" />}
                trend="up"
                description="بناءً على التنبؤات الذكية"
                color="emerald"
              />
            </>
          )}
        </motion.div>

        {/* Lead Intelligence Section */}
        <motion.div 
          className="mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Brain className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">العملاء المحتملون الذكيون</h2>
              <div className="flex items-center space-x-2 space-x-reverse bg-purple-100 dark:bg-purple-900 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  مدعوم بالذكاء الاصطناعي
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              {/* Filters */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">جميع الحالات</option>
                <option value="new">جديد</option>
                <option value="qualified">مؤهل</option>
                <option value="proposal">عرض سعر</option>
                <option value="negotiation">تفاوض</option>
              </select>
              
              <select
                value={filterTemperature}
                onChange={(e) => setFilterTemperature(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">جميع درجات الحرارة</option>
                <option value="hot">ساخن</option>
                <option value="warm">دافئ</option>
                <option value="cold">بارد</option>
              </select>
              
              <Button size="sm">
                <Plus className="w-4 h-4 ml-2" />
                إضافة عميل
              </Button>
            </div>
          </div>
          
          {/* Leads Grid with Intelligence */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredLeads.slice(0, 6).map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <LeadCard
                    lead={lead}
                    showScore={true}
                    showTemperature={true}
                    showActivity={false}
                    showPredictions={true}
                    compact={false}
                    interactive={true}
                    onClick={(lead) => console.log('Lead clicked:', lead)}
                    onAction={(action, lead) => console.log('Action:', action, 'Lead:', lead)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Load More */}
          {filteredLeads.length > 6 && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={!hasNextPage}
              >
                عرض المزيد من العملاء ({filteredLeads.length - 6} متبقي)
              </Button>
            </div>
          )}
        </motion.div>
          {/* Trends Line Chart */}
          <ChartCard title="اتجاهات العملاء" loading={isLoading}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: ar })}
                  formatter={(value: any) => [value, 'عدد العملاء']}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Performance Bar Chart */}
          <ChartCard title="الأداء الشهري" loading={isLoading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="العملاء" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="المحادثات" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="الرسائل" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Status Distribution Pie Chart */}
          <ChartCard title="توزيع حالات العملاء" loading={isLoading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Source Distribution Area Chart */}
          <ChartCard title="مصادر العملاء" loading={isLoading}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sourceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">آخر الأنشطة</h3>
                <Button variant="outline" size="sm">
                  عرض الكل
                </Button>
              </div>
              <div className="space-y-2">
                {mockActivities.map((activity) => (
                  <ActivityItemComponent key={activity.id} activity={activity} />
                ))}
              </div>
            </Card>
          </div>

          {/* Notifications */}
          <div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">التنبيهات</h3>
              <div className="space-y-4">
                {mockNotifications.map((notification) => (
                  <NotificationComponent key={notification.id} notification={notification} />
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Top Performing Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Customers */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">أفضل العملاء</h3>
            <div className="space-y-3">
              {[
                { name: 'شركة التقنية المتقدمة', score: 95, value: '250,000 ريال' },
                { name: 'مؤسسة البناء الحديث', score: 88, value: '180,000 ريال' },
                { name: 'شركة التجارة الذكية', score: 82, value: '165,000 ريال' },
                { name: 'مجموعة التطوير الشامل', score: 76, value: '140,000 ريال' },
              ].map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <div className="flex items-center space-x-2 space-x-reverse mt-1">
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-600 rounded-full" 
                            style={{ width: `${customer.score}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{customer.score}%</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{customer.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Sources */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">أفضل المصادر</h3>
            <div className="space-y-3">
              {[
                { name: 'وسائل التواصل الاجتماعي', count: 245, percentage: 35 },
                { name: 'محركات البحث', count: 198, percentage: 28 },
                { name: 'المراجع المباشرة', count: 156, percentage: 22 },
                { name: 'الإعلانات المدفوعة', count: 89, percentage: 15 },
              ].map((source, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{source.name}</span>
                    <span className="text-sm font-semibold text-blue-600">{source.count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" 
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xs text-gray-500">{source.percentage}% من الإجمالي</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Channels */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">أفضل القنوات</h3>
            <div className="space-y-3">
              {[
                { name: 'WhatsApp', messages: 1234, response: 89 },
                { name: 'البريد الإلكتروني', messages: 987, response: 76 },
                { name: 'الرسائل النصية', messages: 543, response: 82 },
                { name: 'المحادثة المباشرة', messages: 321, response: 94 },
              ].map((channel, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{channel.name}</span>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-semibold text-gray-700">{channel.response}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{channel.messages} رسالة</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-green-500 rounded-full" 
                        style={{ width: `${channel.response}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="flex flex-col items-center p-6 h-auto">
                <Users className="h-8 w-8 mb-2 text-blue-600" />
                <span className="text-sm font-medium">إضافة عميل</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center p-6 h-auto">
                <MessageSquare className="h-8 w-8 mb-2 text-green-600" />
                <span className="text-sm font-medium">إرسال رسالة</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center p-6 h-auto">
                <Target className="h-8 w-8 mb-2 text-purple-600" />
                <span className="text-sm font-medium">إنشاء هدف</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center p-6 h-auto">
                <Activity className="h-8 w-8 mb-2 text-orange-600" />
                <span className="text-sm font-medium">تقارير مفصلة</span>
              </Button>
            </div>
          </Card>
        </div>
        
        {/* Real-time Notifications Overlay */}
        <AnimatePresence>
          {showNotifications && (
            <NotificationCenter
              notifications={enhancedNotifications}
              alertConfigs={[]}
              onMarkAsRead={(id) => console.log('Mark as read:', id)}
              onMarkAllAsRead={() => console.log('Mark all as read')}
              onDeleteNotification={(id) => console.log('Delete:', id)}
              onNotificationClick={(notification) => console.log('Notification clicked:', notification)}
              onCreateAlert={(config) => console.log('Create alert:', config)}
              isOpen={showNotifications}
              onToggle={() => setShowNotifications(false)}
              maxHeight={500}
              showFilters={true}
            />
          )}
        </AnimatePresence>

        {/* Dashboard Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
              onClick={() => setShowSettings(false)}
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
                    إعدادات لوحة التحكم
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Theme Settings */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      المظهر
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'فاتح', icon: Sun },
                        { value: 'dark', label: 'داكن', icon: Moon },
                        { value: 'auto', label: 'تلقائي', icon: Monitor },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setPreferences(prev => ({ ...prev, theme: value as ThemeMode }))}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                            preferences.theme === value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-6 h-6 mb-2 text-gray-600 dark:text-gray-300" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* View Mode */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      وضع العرض
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'cards', label: 'بطاقات', icon: Grid3X3 },
                        { value: 'list', label: 'قائمة', icon: List },
                        { value: 'grid', label: 'شبكة', icon: BarChart3 },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setPreferences(prev => ({ ...prev, viewMode: value as ViewMode }))}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                            preferences.viewMode === value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-6 h-6 mb-2 text-gray-600 dark:text-gray-300" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto Refresh */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      التحديث التلقائي
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          تحديث البيانات تلقائياً
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          مناسب للبيانات المباشرة
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.autoRefresh}
                          onChange={(e) => setPreferences(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {preferences.autoRefresh && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          فترة التحديث (ثانية)
                        </label>
                        <select
                          value={preferences.refreshInterval / 1000}
                          onChange={(e) => setPreferences(prev => ({ 
                            ...prev, 
                            refreshInterval: parseInt(e.target.value) * 1000 
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="10">10 ثوانٍ</option>
                          <option value="30">30 ثانية</option>
                          <option value="60">دقيقة واحدة</option>
                          <option value="300">5 دقائق</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Performance Settings */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      إعدادات الأداء
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            البيانات المباشرة
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            عرض التحديثات فورياً
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={realTimeEnabled}
                            onChange={(e) => setRealTimeEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            الوضع المكثف
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            عرض المزيد من المعلومات
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.density === 'compact'}
                            onChange={(e) => setPreferences(prev => ({ 
                              ...prev, 
                              density: e.target.checked ? 'compact' : 'comfortable' 
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('Save settings:', preferences);
                      setShowSettings(false);
                    }}
                  >
                    حفظ الإعدادات
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