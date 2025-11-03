'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useT, useCurrentLocale } from '../../../hooks/useI18n';
import { 
  AnalyticsData, 
  Lead, 
  Message, 
  Conversation,
  MessageType,
  LeadStatus,
  ConversationStatus 
} from '../../../types';
import { handleApiError } from '../../../lib/api';

// Icons
import { 
  FileText, 
  Download, 
  Upload, 
  Filter, 
  Calendar,
  TrendingUp,
  Users,
  MessageSquare,
  Phone,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Search,
  Settings,
  Play,
  Pause,
  Save,
  FolderOpen,
  Share2,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Trash2,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Clock,
  Zap,
  Globe,
  Smartphone,
  MessageCircle,
  MapPin,
  Star,
  Award,
  Trophy,
  Activity,
  Database,
  Pie,
  TrendingDown
} from 'lucide-react';

// Chart Components (مبسطة - في التطبيق الحقيقي ستستخدم مكتبة مثل Chart.js أو Recharts)
const SimpleBarChart = ({ data, title, color = '#3B82F6' }: { data: any[], title: string, color?: string }) => (
  <div className="bg-white p-4 rounded-lg border">
    <h3 className="text-sm font-medium text-gray-900 mb-4">{title}</h3>
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{item.label}</span>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div 
              className="h-2 rounded-full transition-all duration-300" 
              style={{ 
                width: `${Math.max((item.value / Math.max(...data.map(d => d.value))) * 100, 10)}%`,
                backgroundColor: color
              }}
            />
            <span className="text-sm font-medium text-gray-900 w-16 text-left">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SimpleLineChart = ({ data, title }: { data: any[], title: string }) => (
  <div className="bg-white p-4 rounded-lg border">
    <h3 className="text-sm font-medium text-gray-900 mb-4">{title}</h3>
    <div className="relative h-32">
      <div className="absolute inset-0 flex items-end justify-between px-2">
        {data.map((point, index) => (
          <div 
            key={index} 
            className="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
            style={{ 
              height: `${(point.value / Math.max(...data.map(d => d.value))) * 100}%`,
              width: `${100 / data.length - 2}%`
            }}
            title={`${point.label}: ${point.value}`}
          />
        ))}
      </div>
    </div>
    <div className="flex justify-between text-xs text-gray-500 mt-2">
      {data.map((point, index) => (
        <span key={index}>{point.label}</span>
      ))}
    </div>
  </div>
);

const SimplePieChart = ({ data, title }: { data: any[], title: string }) => (
  <div className="bg-white p-4 rounded-lg border">
    <h3 className="text-sm font-medium text-gray-900 mb-4">{title}</h3>
    <div className="space-y-3">
      {data.map((item, index) => {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
        const color = colors[index % colors.length];
        const percentage = ((item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1);
        
        return (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm font-medium text-gray-900">{item.value}</span>
              <span className="text-xs text-gray-500">({percentage}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// KPI Card Component
const KPICard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  format = 'number',
  loading = false 
}: {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: any;
  format?: 'number' | 'percentage' | 'currency' | 'time';
  loading?: boolean;
}) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${val}%`;
      case 'currency':
        return `${val.toLocaleString('ar-SA')} ريال`;
      case 'time':
        return `${val} دقيقة`;
      default:
        return val.toLocaleString('ar-SA');
    }
  };

  const getChangeIcon = () => {
    if (changeType === 'increase') return <ArrowUp className="w-3 h-3" />;
    if (changeType === 'decrease') return <ArrowDown className="w-3 h-3" />;
    return null;
  };

  const getChangeColor = () => {
    if (changeType === 'increase') return 'text-green-600 bg-green-50';
    if (changeType === 'decrease') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>
          {change !== undefined && (
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChangeColor()}`}>
              {getChangeIcon()}
              <span className="mr-1">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  );
};

// Data Table Component
const DataTable = ({ 
  data, 
  columns, 
  loading = false,
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10
}: {
  data: any[];
  columns: { key: string; label: string; sortable?: boolean; format?: (value: any) => string }[];
  loading?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState(columns[0]?.key || '');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortable) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder, sortable]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4 space-x-reverse">
              <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          البيانات ({sortedData.length})
        </h3>
        {searchable && (
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.label}</span>
                    {sortable && column.sortable !== false && sortKey === column.key && (
                      <div className="flex items-center">
                        {sortOrder === 'asc' ? (
                          <ArrowUp className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.format ? column.format(row[column.key]) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-6 py-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            الصفحة {(currentPage - 1) * pageSize + 1} إلى {Math.min(currentPage * pageSize, sortedData.length)} من {sortedData.length}
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700">
              {currentPage} من {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsPage: React.FC = () => {
  const router = useRouter();
  const t = useT();
  const locale = useCurrentLocale();
  const isRTL = locale === 'ar';

  // State
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['all']);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['all']);
  const [showFilters, setShowFilters] = useState(false);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  // Mock Analytics Data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    leads: {
      total: 1250,
      new_this_month: 89,
      conversion_rate: 15.2,
      by_status: {
        'جديد': 450,
        'تم الاتصال': 320,
        'مؤهل': 280,
        'اقتراح': 120,
        'مفاوضات': 45,
        'مكتمل': 35
      },
      by_source: {
        'موقع ويب': 520,
        'وسائل التواصل': 380,
        'إعلانات': 250,
        'توصيات': 100
      },
      trends: [
        { date: 'يناير', count: 85 },
        { date: 'فبراير', count: 92 },
        { date: 'مارس', count: 78 },
        { date: 'أبريل', count: 95 },
        { date: 'مايو', count: 110 },
        { date: 'يونيو', count: 89 }
      ]
    },
    conversations: {
      total: 850,
      active: 125,
      response_rate: 87.5,
      avg_response_time: 12
    },
    messages: {
      total: 4200,
      by_type: {
        'واتساب': 1800,
        'إيميل': 1200,
        'رسالة نصية': 800,
        'رسالة مباشرة': 400
      },
      delivery_rate: 94.2
    },
    performance: {
      leads_per_day: 28.5,
      conversations_per_day: 19.2,
      messages_per_day: 95.3
    }
  });

  // Mock Table Data
  const performanceTableData = [
    { metric: 'إجمالي العملاء المحتملين', value: 1250, change: 8.5, target: 1500 },
    { metric: 'معدل التحويل', value: 15.2, change: -2.1, target: 18.0 },
    { metric: 'متوسط وقت الاستجابة', value: 12, change: -15.3, target: 10 },
    { metric: 'معدل التسليم', value: 94.2, change: 1.8, target: 95.0 },
    { metric: 'الاستجابة السريعة', value: 87.5, change: 5.2, target: 90.0 }
  ];

  const customerTableData = [
    { segment: 'عميل جديد', count: 450, conversion: 12.5, retention: 78.2 },
    { segment: 'عميل متكرر', count: 320, conversion: 25.8, retention: 89.1 },
    { segment: 'عميل VIP', count: 85, conversion: 45.2, retention: 95.6 },
    { segment: 'عملاء غير نشطين', count: 395, conversion: 5.8, retention: 45.2 }
  ];

  const messageTableData = [
    { type: 'واتساب', sent: 1800, delivered: 1725, rate: 95.8, response: 82.5 },
    { type: 'إيميل', sent: 1200, delivered: 1140, rate: 95.0, response: 65.2 },
    { type: 'رسالة نصية', sent: 800, delivered: 760, rate: 95.0, response: 45.8 },
    { type: 'رسالة مباشرة', sent: 400, delivered: 385, rate: 96.3, response: 78.9 }
  ];

  const salesTableData = [
    { channel: 'المبيعات المباشرة', revenue: 250000, deals: 45, avg_deal: 5556 },
    { channel: 'المبيعات الرقمية', revenue: 180000, deals: 32, avg_deal: 5625 },
    { channel: 'شراكات', revenue: 95000, deals: 18, avg_deal: 5278 },
    { channel: 'الإعادة البيع', revenue: 75000, deals: 28, avg_deal: 2679 }
  ];

  // Effects
  useEffect(() => {
    loadAnalyticsData();
    loadSavedReports();
  }, [dateRange, selectedChannels]);

  // Handlers
  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // محاكاة استدعاء API
      await new Promise(resolve => setTimeout(resolve, 1000));
      // البيانات موجودة بالفعل في الـ state
    } catch (error) {
      console.error('خطأ في تحميل بيانات التحليلات:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedReports = async () => {
    try {
      // محاكاة استدعاء API
      const mockSavedReports = [
        { id: 1, name: 'تقرير الأداء الشهري', created_at: '2025-10-01', filters: {} },
        { id: 2, name: 'تحليل العملاء الربعي', created_at: '2025-09-15', filters: {} },
        { id: 3, name: 'تقرير المبيعات الأسبوعي', created_at: '2025-10-28', filters: {} }
      ];
      setSavedReports(mockSavedReports);
    } catch (error) {
      console.error('خطأ في تحميل التقارير المحفوظة:', error);
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`تصدير التقرير بصيغة ${format}`);
    alert(`سيتم تصدير التقرير بصيغة ${format.toUpperCase()}`);
  };

  const handleSaveReport = () => {
    const reportName = prompt('اسم التقرير:');
    if (reportName) {
      console.log('حفظ التقرير:', reportName);
      alert('تم حفظ التقرير بنجاح');
    }
  };

  const handleLoadReport = (reportId: number) => {
    const report = savedReports.find(r => r.id === reportId);
    if (report) {
      console.log('تحميل التقرير:', report.name);
      alert(`تم تحميل تقرير: ${report.name}`);
    }
  };

  const handleScheduleReport = () => {
    const frequency = prompt('تكرار التقرير (يومي/أسبوعي/شهري):');
    if (frequency) {
      console.log('جدولة التقرير:', frequency);
      alert(`تم جدولة التقرير ${frequency}`);
    }
  };

  // Tabs Configuration
  const reportTabs = [
    { id: 'performance', label: 'الأداء العام', icon: TrendingUp },
    { id: 'customers', label: 'تحليل العملاء', icon: Users },
    { id: 'messages', label: 'تقارير الرسائل', icon: MessageSquare },
    { id: 'channels', label: 'تقارير القنوات', icon: Phone },
    { id: 'sales', label: 'تقارير المبيعات', icon: DollarSign }
  ];

  // Channel Options
  const channelOptions = [
    { value: 'all', label: 'جميع القنوات' },
    { value: 'whatsapp', label: 'واتساب' },
    { value: 'email', label: 'إيميل' },
    { value: 'sms', label: 'رسالة نصية' },
    { value: 'social', label: 'وسائل التواصل' }
  ];

  // Render Functions
  const renderPerformanceReport = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="إجمالي العملاء المحتملين"
          value={analyticsData.leads.total}
          change={8.5}
          changeType="increase"
          icon={Users}
          loading={loading}
        />
        <KPICard
          title="معدل التحويل"
          value={analyticsData.leads.conversion_rate}
          change={-2.1}
          changeType="decrease"
          icon={Target}
          format="percentage"
          loading={loading}
        />
        <KPICard
          title="متوسط وقت الاستجابة"
          value={analyticsData.conversations.avg_response_time}
          change={-15.3}
          changeType="increase"
          icon={Clock}
          format="time"
          loading={loading}
        />
        <KPICard
          title="معدل التسليم"
          value={analyticsData.messages.delivery_rate}
          change={1.8}
          changeType="increase"
          icon={CheckCircle}
          format="percentage"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleLineChart 
          data={analyticsData.leads.trends} 
          title="اتجاهات العملاء المحتملين" 
        />
        <SimpleBarChart 
          data={Object.entries(analyticsData.leads.by_status).map(([label, value]) => ({ label, value }))} 
          title="العملاء حسب الحالة" 
        />
      </div>

      {/* Performance Table */}
      <DataTable
        data={performanceTableData}
        columns={[
          { key: 'metric', label: 'المؤشر', sortable: true },
          { key: 'value', label: 'القيمة الحالية', sortable: true, format: (val) => val.toLocaleString('ar-SA') },
          { key: 'change', label: 'التغيير %', sortable: true, format: (val) => `${val > 0 ? '+' : ''}${val}%` },
          { key: 'target', label: 'الهدف', sortable: true, format: (val) => val.toLocaleString('ar-SA') }
        ]}
        loading={loading}
      />
    </div>
  );

  const renderCustomerAnalysis = () => (
    <div className="space-y-6">
      {/* Customer KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="إجمالي العملاء"
          value={1520}
          change={12.3}
          changeType="increase"
          icon={Users}
          loading={loading}
        />
        <KPICard
          title="معدل الاحتفاظ"
          value={78.5}
          change={3.2}
          changeType="increase"
          icon={Activity}
          format="percentage"
          loading={loading}
        />
        <KPICard
          title="القيمة المتوسطة للعميل"
          value={3450}
          change={8.7}
          changeType="increase"
          icon={DollarSign}
          format="currency"
          loading={loading}
        />
        <KPICard
          title="رضا العملاء"
          value={4.6}
          change={-1.2}
          changeType="decrease"
          icon={Star}
          loading={loading}
        />
      </div>

      {/* Customer Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimplePieChart 
          data={Object.entries(analyticsData.leads.by_source).map(([label, value]) => ({ label, value }))} 
          title="مصادر العملاء" 
        />
        <SimpleBarChart 
          data={customerTableData.map(item => ({ label: item.segment, value: item.count }))} 
          title="شرائح العملاء" 
        />
      </div>

      {/* Customer Table */}
      <DataTable
        data={customerTableData}
        columns={[
          { key: 'segment', label: 'الشرائح', sortable: true },
          { key: 'count', label: 'العدد', sortable: true, format: (val) => val.toLocaleString('ar-SA') },
          { key: 'conversion', label: 'معدل التحويل %', sortable: true, format: (val) => `${val}%` },
          { key: 'retention', label: 'معدل الاحتفاظ %', sortable: true, format: (val) => `${val}%` }
        ]}
        loading={loading}
      />
    </div>
  );

  const renderMessageReports = () => (
    <div className="space-y-6">
      {/* Message KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="إجمالي الرسائل"
          value={analyticsData.messages.total}
          change={15.8}
          changeType="increase"
          icon={MessageSquare}
          loading={loading}
        />
        <KPICard
          title="معدل التسليم"
          value={analyticsData.messages.delivery_rate}
          change={1.8}
          changeType="increase"
          icon={CheckCircle}
          format="percentage"
          loading={loading}
        />
        <KPICard
          title="معدل الاستجابة"
          value={87.5}
          change={5.2}
          changeType="increase"
          icon={Zap}
          format="percentage"
          loading={loading}
        />
        <KPICard
          title="متوسط وقت القراءة"
          value={5.2}
          change={-8.3}
          changeType="increase"
          icon={Clock}
          format="time"
          loading={loading}
        />
      </div>

      {/* Message Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimplePieChart 
          data={Object.entries(analyticsData.messages.by_type).map(([label, value]) => ({ label, value }))} 
          title="الرسائل حسب النوع" 
        />
        <SimpleBarChart 
          data={messageTableData.map(item => ({ label: item.type, value: item.sent }))} 
          title="إحصائيات الإرسال" 
        />
      </div>

      {/* Message Table */}
      <DataTable
        data={messageTableData}
        columns={[
          { key: 'type', label: 'نوع الرسالة', sortable: true },
          { key: 'sent', label: 'المرسلة', sortable: true, format: (val) => val.toLocaleString('ar-SA') },
          { key: 'delivered', label: 'المسلمة', sortable: true, format: (val) => val.toLocaleString('ar-SA') },
          { key: 'rate', label: 'معدل التسليم %', sortable: true, format: (val) => `${val}%` },
          { key: 'response', label: 'معدل الاستجابة %', sortable: true, format: (val) => `${val}%` }
        ]}
        loading={loading}
      />
    </div>
  );

  const renderSalesReports = () => (
    <div className="space-y-6">
      {/* Sales KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="إجمالي الإيرادات"
          value={600000}
          change={18.5}
          changeType="increase"
          icon={DollarSign}
          format="currency"
          loading={loading}
        />
        <KPICard
          title="عدد الصفقات"
          value={123}
          change={8.2}
          changeType="increase"
          icon={Trophy}
          loading={loading}
        />
        <KPICard
          title="متوسط قيمة الصفقة"
          value={4878}
          change={9.1}
          changeType="increase"
          icon={Award}
          format="currency"
          loading={loading}
        />
        <KPICard
          title="معدل نجاح الصفقات"
          value={32.5}
          change={-2.8}
          changeType="decrease"
          icon={Target}
          format="percentage"
          loading={loading}
        />
      </div>

      {/* Sales Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart 
          data={salesTableData.map(item => ({ label: item.channel, value: item.revenue }))} 
          title="الإيرادات حسب القناة" 
        />
        <SimpleLineChart 
          data={[
            { date: 'يناير', value: 85000 },
            { date: 'فبراير', value: 92000 },
            { date: 'مارس', value: 78000 },
            { date: 'أبريل', value: 105000 },
            { date: 'مايو', value: 118000 },
            { date: 'يونيو', value: 95000 }
          ]} 
          title="اتجاه الإيرادات الشهرية" 
        />
      </div>

      {/* Sales Table */}
      <DataTable
        data={salesTableData}
        columns={[
          { key: 'channel', label: 'القناة', sortable: true },
          { key: 'revenue', label: 'الإيرادات', sortable: true, format: (val) => `${val.toLocaleString('ar-SA')} ريال` },
          { key: 'deals', label: 'عدد الصفقات', sortable: true, format: (val) => val.toLocaleString('ar-SA') },
          { key: 'avg_deal', label: 'متوسط الصفقة', sortable: true, format: (val) => `${val.toLocaleString('ar-SA')} ريال` }
        ]}
        loading={loading}
      />
    </div>
  );

  const renderChannelReports = () => (
    <div className="space-y-6">
      {/* Channel KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="قنوات الاتصال النشطة"
          value={8}
          change={14.3}
          changeType="increase"
          icon={Globe}
          loading={loading}
        />
        <KPICard
          title="معدل استخدام واتساب"
          value={68.5}
          change={5.8}
          changeType="increase"
          icon={MessageCircle}
          format="percentage"
          loading={loading}
        />
        <KPICard
          title="معدل استخدام الإيميل"
          value={22.1}
          change={-3.2}
          changeType="decrease"
          icon={Mail}
          format="percentage"
          loading={loading}
        />
        <KPICard
          title="معدل استخدام الرسائل النصية"
          value={9.4}
          change={1.2}
          changeType="increase"
          icon={Smartphone}
          format="percentage"
          loading={loading}
        />
      </div>

      {/* Channel Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimplePieChart 
          data={[
            { label: 'واتساب', value: 1800 },
            { label: 'إيميل', value: 1200 },
            { label: 'رسالة نصية', value: 800 },
            { label: 'وسائل التواصل', value: 400 }
          ]} 
          title="توزيع الرسائل حسب القناة" 
        />
        <SimpleBarChart 
          data={[
            { label: 'واتساب', value: 95.8 },
            { label: 'إيميل', value: 95.0 },
            { label: 'رسالة نصية', value: 95.0 },
            { label: 'وسائل التواصل', value: 96.3 }
          ]} 
          title="معدل التسليم حسب القناة" 
        />
      </div>
    </div>
  );

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'performance':
        return renderPerformanceReport();
      case 'customers':
        return renderCustomerAnalysis();
      case 'messages':
        return renderMessageReports();
      case 'sales':
        return renderSalesReports();
      case 'channels':
        return renderChannelReports();
      default:
        return renderPerformanceReport();
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Title and Description */}
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  التقارير التفصيلية
                </h1>
                <p className="text-gray-600">
                  تحليل شامل لأداء المبيعات والاتصالات والعمليات
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4 ml-2" />
                  المرشحات
                </button>

                <button
                  onClick={() => handleSaveReport()}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التقرير
                </button>

                <button
                  onClick={() => handleScheduleReport()}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                >
                  <Clock className="w-4 h-4 ml-2" />
                  جدولة التقرير
                </button>

                <div className="relative">
                  <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                    <Download className="w-4 h-4 ml-2" />
                    تصدير
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 hidden group-hover:block">
                    <button onClick={() => handleExport('pdf')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right">
                      تصدير PDF
                    </button>
                    <button onClick={() => handleExport('excel')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right">
                      تصدير Excel
                    </button>
                    <button onClick={() => handleExport('csv')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right">
                      تصدير CSV
                    </button>
                  </div>
                </div>

                <button
                  onClick={loadAnalyticsData}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white border-b p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الفترة الزمنية
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Channels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  القنوات
                </label>
                <select
                  multiple
                  value={selectedChannels}
                  onChange={(e) => setSelectedChannels(Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {channelOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Saved Reports */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التقارير المحفوظة
                </label>
                <div className="flex space-x-2 space-x-reverse">
                  <select 
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">اختر تقرير محفوظ</option>
                    {savedReports.map(report => (
                      <option key={report.id} value={report.id}>
                        {report.name}
                      </option>
                    ))}
                  </select>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <FolderOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  فلاتر سريعة
                </label>
                <div className="flex space-x-2 space-x-reverse">
                  <button className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                    اليوم
                  </button>
                  <button className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                    الأسبوع
                  </button>
                  <button className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                    الشهر
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="px-6">
            <nav className="flex space-x-8 space-x-reverse" aria-label="Tabs">
              {reportTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 space-x-reverse py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {renderActiveTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;