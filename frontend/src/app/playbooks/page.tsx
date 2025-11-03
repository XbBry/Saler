'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Copy,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users,
  Target,
  Clock,
  Zap,
  Settings,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Lightbulb,
  Brain,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  User,
  Building,
  Globe,
  Workflow,
  GitBranch,
  Cog,
  FileText,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/DropdownMenu';
import { Progress } from '../../components/ui/Progress';
import { useAuthStore } from '../../lib/authStore';
import { useToast } from '../../hooks/useToast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  PlaybookBuilder,
  AdvancedConditionsBuilder,
  TaskAutomationManager,
  AdvancedAnalyticsDashboard
} from '../../components/playbooks';

interface PlaybookStep {
  id: string;
  type: 'email' | 'sms' | 'call' | 'wait' | 'condition' | 'assign' | 'update_field';
  name: string;
  description: string;
  order: number;
  delay?: number; // in minutes
  conditions?: any[];
  template?: string;
  assignee?: string;
  field?: string;
  value?: any;
  isActive: boolean;
}

interface Playbook {
  id: string;
  name: string;
  description: string;
  category: 'lead_qualification' | 'nurturing' | 'conversion' | 'retention' | 'follow_up';
  status: 'active' | 'paused' | 'draft' | 'archived';
  trigger: {
    type: 'lead_created' | 'status_changed' | 'temperature_change' | 'manual' | 'score_threshold';
    conditions?: any[];
  };
  steps: PlaybookStep[];
  target_audience?: {
    tags?: string[];
    source?: string;
    status?: string[];
    temperature?: string[];
    priority?: string[];
  };
  metrics: {
    totalRuns: number;
    successRate: number;
    avgCompletionTime: number;
    currentActive: number;
    lastRun: string;
  };
  createdAt: string;
  updatedAt: string;
  owner: string;
  tags: string[];
  isPublic: boolean;
}

// Mock data for demonstration
const mockPlaybooks: Playbook[] = [
  {
    id: '1',
    name: 'تأهيل العملاء الجدد',
    description: 'سلسلة تأهيل تلقائية للعملاء الجدد مع نقاط مراقبة ذكية',
    category: 'lead_qualification',
    status: 'active',
    trigger: {
      type: 'lead_created',
      conditions: [
        { field: 'source', operator: 'equals', value: 'website' },
        { field: 'priority', operator: 'equals', value: 'high' }
      ]
    },
    steps: [
      {
        id: 'step-1',
        type: 'email',
        name: 'رسالة ترحيب شخصية',
        description: 'إرسال رسالة ترحيب شخصية مع معلومات المنتج',
        order: 1,
        template: 'welcome_email_template',
        isActive: true,
      },
      {
        id: 'step-2',
        type: 'wait',
        name: 'انتظار 24 ساعة',
        description: 'انتظار تفاعل العميل لمدة 24 ساعة',
        order: 2,
        delay: 1440, // 24 hours in minutes
        isActive: true,
      },
      {
        id: 'step-3',
        type: 'condition',
        name: 'تحقق من التفاعل',
        description: 'التحقق من تفاعل العميل مع الرسالة',
        order: 3,
        conditions: [
          { field: 'email_opened', operator: 'equals', value: true }
        ],
        isActive: true,
      },
      {
        id: 'step-4',
        type: 'assign',
        name: 'تعيين لمسؤول المبيعات',
        description: 'تعيين العميل لمسؤول مبيعات متخصص',
        order: 4,
        assignee: 'sales_rep_1',
        isActive: true,
      },
    ],
    target_audience: {
      tags: ['مستهدف', 'جديد'],
      source: ['website', 'social_media'],
      status: ['new'],
      temperature: ['cold', 'warm'],
      priority: ['high', 'urgent'],
    },
    metrics: {
      totalRuns: 156,
      successRate: 87.5,
      avgCompletionTime: 48,
      currentActive: 12,
      lastRun: new Date(Date.now() - 3600000).toISOString(),
    },
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date().toISOString(),
    owner: 'current-user',
    tags: ['تأهيل', 'جديد', 'تلقائي'],
    isPublic: true,
  },
  {
    id: '2',
    name: 'استعادة العملاء الساخنين',
    description: 'تفعيل العملاء ذوي درجة الحرارة العالية للإغلاق السريع',
    category: 'conversion',
    status: 'active',
    trigger: {
      type: 'temperature_change',
      conditions: [
        { field: 'temperature', operator: 'equals', value: 'hot' }
      ]
    },
    steps: [
      {
        id: 'step-1',
        type: 'call',
        name: 'اتصال فوري',
        description: 'اتصال هاتفي فوري مع العميل الساخن',
        order: 1,
        isActive: true,
      },
      {
        id: 'step-2',
        type: 'wait',
        name: 'انتظار 2 ساعة',
        description: 'انتظار استجابة العميل',
        order: 2,
        delay: 120, // 2 hours in minutes
        isActive: true,
      },
      {
        id: 'step-3',
        type: 'email',
        name: 'إرسال عرض شخصي',
        description: 'إرسال عرض مخصص بناءً على احتياجات العميل',
        order: 3,
        template: 'hot_lead_offer_template',
        isActive: true,
      },
      {
        id: 'step-4',
        type: 'condition',
        name: 'متابعة الإغلاق',
        description: 'متابعة عملية الإغلاق',
        order: 4,
        isActive: true,
      },
    ],
    target_audience: {
      temperature: ['hot'],
      priority: ['high', 'urgent'],
    },
    metrics: {
      totalRuns: 89,
      successRate: 92.1,
      avgCompletionTime: 12,
      currentActive: 8,
      lastRun: new Date(Date.now() - 1800000).toISOString(),
    },
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    owner: 'current-user',
    tags: ['ساخن', 'إغلاق', 'عاجل'],
    isPublic: false,
  },
  {
    id: '3',
    name: 'العناية بالعملاء الموجودين',
    description: 'حفظ وتفعيل العملاء الموجودين لتعزيز العلاقة',
    category: 'retention',
    status: 'active',
    trigger: {
      type: 'status_changed',
      conditions: [
        { field: 'status', operator: 'equals', value: 'closed_won' }
      ]
    },
    steps: [
      {
        id: 'step-1',
        type: 'email',
        name: 'رسالة شكر وترحيب',
        description: 'رسالة شكر للعمل الجديد مع مرحب',
        order: 1,
        template: 'customer_welcome_template',
        isActive: true,
      },
      {
        id: 'step-2',
        type: 'wait',
        name: 'انتظار أسبوع',
        description: 'انتظار فترة كافية للتكيف',
        order: 2,
        delay: 10080, // 1 week in minutes
        isActive: true,
      },
      {
        id: 'step-3',
        type: 'call',
        name: 'مكالمة متابعة',
        description: 'مكالمة متابعة للتأكد من الرضا',
        order: 3,
        isActive: true,
      },
      {
        id: 'step-4',
        type: 'condition',
        name: 'تقييم الرضا',
        description: 'تقييم مستوى رضا العميل',
        order: 4,
        isActive: true,
      },
    ],
    target_audience: {
      status: ['closed_won'],
    },
    metrics: {
      totalRuns: 234,
      successRate: 95.3,
      avgCompletionTime: 168, // 1 week in hours
      currentActive: 15,
      lastRun: new Date(Date.now() - 86400000).toISOString(),
    },
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    owner: 'current-user',
    tags: ['عملاء', 'رعاية', 'رضا'],
    isPublic: true,
  },
  {
    id: '4',
    name: 'تتبع العملاء الباردين',
    description: 'إعادة تفعيل العملاء ذوي درجة الحرارة المنخفضة',
    category: 'nurturing',
    status: 'paused',
    trigger: {
      type: 'temperature_change',
      conditions: [
        { field: 'temperature', operator: 'equals', value: 'cold' }
      ]
    },
    steps: [
      {
        id: 'step-1',
        type: 'email',
        name: 'محتوى قيم',
        description: 'إرسال محتوى قيم وعملي',
        order: 1,
        template: 'cold_lead_nurturing_template',
        isActive: true,
      },
      {
        id: 'step-2',
        type: 'wait',
        name: 'انتظار 3 أيام',
        description: 'انتظار وقت كافي للتفاعل',
        order: 2,
        delay: 4320, // 3 days in minutes
        isActive: true,
      },
      {
        id: 'step-3',
        type: 'condition',
        name: 'تقييم التفاعل',
        description: 'تقييم مستوى تفاعل العميل',
        order: 3,
        isActive: true,
      },
    ],
    target_audience: {
      temperature: ['cold'],
    },
    metrics: {
      totalRuns: 67,
      successRate: 34.3,
      avgCompletionTime: 72,
      currentActive: 0,
      lastRun: new Date(Date.now() - 172800000).toISOString(),
    },
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
    owner: 'current-user',
    tags: ['بارد', 'إعادة تفعيل', 'رعاية'],
    isPublic: false,
  },
];

export default function PlaybooksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [showPlaybookDetails, setShowPlaybookDetails] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('overview');
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);

  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch playbooks with filters
  const {
    data: playbooks = mockPlaybooks,
    isLoading,
    error,
    refetch,
  } = useQuery<Playbook[]>({
    queryKey: ['playbooks', searchQuery, categoryFilter, statusFilter],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      let filteredPlaybooks = [...mockPlaybooks];

      if (searchQuery) {
        filteredPlaybooks = filteredPlaybooks.filter(playbook =>
          playbook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          playbook.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          playbook.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      if (categoryFilter !== 'all') {
        filteredPlaybooks = filteredPlaybooks.filter(playbook => playbook.category === categoryFilter);
      }

      if (statusFilter !== 'all') {
        filteredPlaybooks = filteredPlaybooks.filter(playbook => playbook.status === statusFilter);
      }

      return filteredPlaybooks;
    },
    staleTime: 30000,
  });

  // Analytics data
  const {
    data: analytics,
    isLoading: analyticsLoading,
  } = useQuery({
    queryKey: ['playbooks-analytics'],
    queryFn: async () => {
      const totalRuns = mockPlaybooks.reduce((sum, p) => sum + p.metrics.totalRuns, 0);
      const avgSuccessRate = mockPlaybooks.reduce((sum, p) => sum + p.metrics.successRate, 0) / mockPlaybooks.length;
      const totalActive = mockPlaybooks.reduce((sum, p) => sum + p.metrics.currentActive, 0);
      const avgCompletionTime = mockPlaybooks.reduce((sum, p) => sum + p.metrics.avgCompletionTime, 0) / mockPlaybooks.length;

      return {
        totalPlaybooks: mockPlaybooks.length,
        activePlaybooks: mockPlaybooks.filter(p => p.status === 'active').length,
        totalRuns,
        avgSuccessRate: Math.round(avgSuccessRate * 10) / 10,
        totalActive,
        avgCompletionTime: Math.round(avgCompletionTime),
      };
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات الـ Playbooks بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ في التحديث',
        description: 'فشل في تحديث البيانات',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleTogglePlaybook = async (playbookId: string, newStatus: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      toast({
        title: 'تم التحديث',
        description: `تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} الـ Playbook بنجاح`,
      });
    } catch (error) {
      toast({
        title: 'خطأ في التحديث',
        description: 'فشل في تحديث حالة الـ Playbook',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlaybook = async (playbookId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الـ Playbook بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ في الحذف',
        description: 'فشل في حذف الـ Playbook',
        variant: 'destructive',
      });
    }
  };

  const handlePlaybookClick = (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setShowPlaybookDetails(true);
  };

  const handleCreatePlaybook = () => {
    setEditingPlaybook(null);
    setActiveTab('builder');
  };

  const handleEditPlaybook = (playbook: Playbook) => {
    setEditingPlaybook(playbook);
    setActiveTab('builder');
  };

  const handlePlaybookSaved = (playbook: Playbook) => {
    queryClient.invalidateQueries({ queryKey: ['playbooks'] });
    toast({
      title: editingPlaybook ? 'تم التحديث' : 'تم الإنشاء',
      description: `تم ${editingPlaybook ? 'تحديث' : 'إنشاء'} الـ Playbook بنجاح`,
    });
    setActiveTab('overview');
    setEditingPlaybook(null);
  };

  const handleConditionsSave = (conditions: any[]) => {
    toast({
      title: 'تم الحفظ',
      description: 'تم حفظ الشروط المتقدمة بنجاح',
    });
  };

  const handleTaskAutomationSave = (config: any) => {
    toast({
      title: 'تم الحفظ',
      description: 'تم حفظ إعدادات أتمتة المهام بنجاح',
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
      archived: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      lead_qualification: 'تأهيل العملاء',
      nurturing: 'العناية والرعاية',
      conversion: 'التحويل',
      retention: 'الاحتفاظ',
      follow_up: 'المتابعة',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'نشط',
      paused: 'متوقف',
      draft: 'مسودة',
      archived: 'مؤرشف',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'call':
        return <Phone className="w-4 h-4 text-purple-500" />;
      case 'wait':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'condition':
        return <Target className="w-4 h-4 text-orange-500" />;
      case 'assign':
        return <User className="w-4 h-4 text-indigo-500" />;
      case 'update_field':
        return <Settings className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatCompletionTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} دقيقة`;
    } else if (minutes < 1440) {
      return `${Math.round(minutes / 60)} ساعة`;
    } else {
      return `${Math.round(minutes / 1440)} يوم`;
    }
  };

  const categoryOptions = [
    { value: 'all', label: 'جميع الفئات' },
    { value: 'lead_qualification', label: 'تأهيل العملاء' },
    { value: 'nurturing', label: 'العناية والرعاية' },
    { value: 'conversion', label: 'التحويل' },
    { value: 'retention', label: 'الاحتفاظ' },
    { value: 'follow_up', label: 'المتابعة' },
  ];

  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'active', label: 'نشط' },
    { value: 'paused', label: 'متوقف' },
    { value: 'draft', label: 'مسودة' },
    { value: 'archived', label: 'مؤرشف' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Navigation Tabs */}
        <motion.div
          className="mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                إدارة الـ Playbooks المتطورة
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                نظام متكامل لبناء وإدارة وسير العمل الآلي للعملاء المحتملين
              </p>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              
              <Button
                size="sm"
                onClick={handleCreatePlaybook}
              >
                <Plus className="h-4 w-4 ml-2" />
                إنشاء playbook متطور
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center">
                <BarChart3 className="w-4 h-4 ml-2" />
                نظرة عامة
              </TabsTrigger>
              <TabsTrigger value="builder" className="flex items-center">
                <Workflow className="w-4 h-4 ml-2" />
                البناء البصري
              </TabsTrigger>
              <TabsTrigger value="conditions" className="flex items-center">
                <Brain className="w-4 h-4 ml-2" />
                الشروط المتقدمة
              </TabsTrigger>
              <TabsTrigger value="automation" className="flex items-center">
                <Cog className="w-4 h-4 ml-2" />
                أتمتة المهام
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center">
                <TrendingUp className="w-4 h-4 ml-2" />
                التحليلات المتقدمة
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Tab Content */}
        <Tabs value={activeTab} className="w-full">
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Analytics Overview */}
            {analytics && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">إجمالي Playbooks</p>
                        <p className="text-3xl font-bold text-gray-900">{analytics.totalPlaybooks}</p>
                        <p className="text-sm text-green-600 flex items-center mt-1">
                          <TrendingUp className="w-3 h-3 ml-1" />
                          {analytics.activePlaybooks} نشط
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">إجمالي التشغيل</p>
                        <p className="text-3xl font-bold text-gray-900">{analytics.totalRuns}</p>
                        <p className="text-sm text-blue-600 flex items-center mt-1">
                          <Activity className="w-3 h-3 ml-1" />
                          هذا الشهر
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <PlayCircle className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">معدل النجاح</p>
                        <p className="text-3xl font-bold text-gray-900">{analytics.avgSuccessRate}%</p>
                        <p className="text-sm text-green-600 flex items-center mt-1">
                          <TrendingUp className="w-3 h-3 ml-1" />
                          +2.1% عن الشهر الماضي
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Target className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">الوقت المتوسط</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {formatCompletionTime(analytics.avgCompletionTime)}
                        </p>
                        <p className="text-sm text-orange-600 flex items-center mt-1">
                          <Clock className="w-3 h-3 ml-1" />
                          للإنجاز
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

        {/* Filters */}
        <motion.div
          className="mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4 lg:space-x-reverse">
                {/* Search */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="البحث في الـ Playbooks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                
                {/* Filters */}
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* View Mode Tabs */}
        <motion.div
          className="mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <div className="flex items-center justify-between">
              <TabsList className="grid w-auto grid-cols-2">
                <TabsTrigger value="grid" className="flex items-center">
                  <BarChart3 className="w-4 h-4 ml-2" />
                  بطاقات
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center">
                  <Activity className="w-4 h-4 ml-2" />
                  قائمة
                </TabsTrigger>
              </TabsList>
              
              <div className="text-sm text-gray-600">
                عرض {playbooks.length} من {mockPlaybooks.length} playbook
              </div>
            </div>
            
            <TabsContent value="grid" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {playbooks.map((playbook, index) => (
                    <motion.div
                      key={playbook.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handlePlaybookClick(playbook)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2">{playbook.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {playbook.description}
                              </CardDescription>
                            </div>
                            <Badge className={getStatusColor(playbook.status)}>
                              {getStatusLabel(playbook.status)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse mt-2">
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(playbook.category)}
                            </Badge>
                            <div className="flex items-center space-x-1 space-x-reverse">
                              <Zap className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-gray-600">
                                {playbook.steps.length} خطوة
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          {/* Metrics */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {playbook.metrics.totalRuns}
                              </div>
                              <div className="text-xs text-gray-600">تشغيل</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-green-600">
                                {playbook.metrics.successRate}%
                              </div>
                              <div className="text-xs text-gray-600">نجاح</div>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>معدل النجاح</span>
                              <span>{playbook.metrics.successRate}%</span>
                            </div>
                            <Progress value={playbook.metrics.successRate} className="h-2" />
                          </div>
                          
                          {/* Additional Info */}
                          <div className="space-y-2 text-xs text-gray-600">
                            <div className="flex items-center justify-between">
                              <span>التشغيل الحالي:</span>
                              <span className="font-medium">{playbook.metrics.currentActive}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>الوقت المتوسط:</span>
                              <span className="font-medium">
                                {formatCompletionTime(playbook.metrics.avgCompletionTime)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>آخر تشغيل:</span>
                              <span className="font-medium">
                                {playbook.metrics.lastRun 
                                  ? format(new Date(playbook.metrics.lastRun), 'dd MMM, HH:mm', { locale: ar })
                                  : 'لا يوجد'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {playbook.tags.slice(0, 3).map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {playbook.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{playbook.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </TabsContent>
            
            <TabsContent value="list" className="mt-6">
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200">
                    {playbooks.map((playbook, index) => (
                      <motion.div
                        key={playbook.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handlePlaybookClick(playbook)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-medium">
                                <BookOpen className="w-5 h-5" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 space-x-reverse mb-1">
                                <h3 className="text-sm font-medium text-gray-900">
                                  {playbook.name}
                                </h3>
                                <Badge className={getStatusColor(playbook.status)}>
                                  {getStatusLabel(playbook.status)}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                {playbook.description}
                              </p>
                              
                              <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
                                <span>{getCategoryLabel(playbook.category)}</span>
                                <span>•</span>
                                <span>{playbook.steps.length} خطوة</span>
                                <span>•</span>
                                <span>{playbook.metrics.totalRuns} تشغيل</span>
                                <span>•</span>
                                <span>{playbook.metrics.successRate}% نجاح</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className="text-left text-xs">
                              <div className="font-medium text-gray-900">
                                {playbook.metrics.currentActive} نشط
                              </div>
                              <div className="text-gray-500">
                                {formatCompletionTime(playbook.metrics.avgCompletionTime)}
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handlePlaybookClick(playbook)}>
                                  <Eye className="w-4 h-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditPlaybook(playbook)}>
                                  <Edit className="w-4 h-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="w-4 h-4 ml-2" />
                                  نسخ
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {playbook.status === 'active' ? (
                                  <DropdownMenuItem 
                                    onClick={() => handleTogglePlaybook(playbook.id, 'paused')}
                                  >
                                    <PauseCircle className="w-4 h-4 ml-2" />
                                    إيقاف
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleTogglePlaybook(playbook.id, 'active')}
                                  >
                                    <PlayCircle className="w-4 h-4 ml-2" />
                                    تفعيل
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeletePlaybook(playbook.id)}
                                >
                                  <Trash2 className="w-4 h-4 ml-2" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Playbook Details Dialog */}
        <Dialog open={showPlaybookDetails} onOpenChange={setShowPlaybookDetails}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                تفاصيل الـ Playbook: {selectedPlaybook?.name}
              </DialogTitle>
              <DialogDescription>
                معلومات شاملة عن الـ Playbook ومراحل تنفيذه
              </DialogDescription>
            </DialogHeader>
            
            {selectedPlaybook && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">معلومات أساسية</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">الاسم</label>
                        <p className="text-sm text-gray-900">{selectedPlaybook.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">الوصف</label>
                        <p className="text-sm text-gray-900">{selectedPlaybook.description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">الفئة</label>
                        <Badge variant="outline" className="mt-1">
                          {getCategoryLabel(selectedPlaybook.category)}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">الحالة</label>
                        <div className="mt-1">
                          <Badge className={getStatusColor(selectedPlaybook.status)}>
                            {getStatusLabel(selectedPlaybook.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">الإحصائيات</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedPlaybook.metrics.totalRuns}
                          </div>
                          <div className="text-sm text-gray-600">إجمالي التشغيل</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedPlaybook.metrics.successRate}%
                          </div>
                          <div className="text-sm text-gray-600">معدل النجاح</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {selectedPlaybook.metrics.currentActive}
                          </div>
                          <div className="text-sm text-gray-600">التشغيل الحالي</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-lg font-bold text-orange-600">
                            {formatCompletionTime(selectedPlaybook.metrics.avgCompletionTime)}
                          </div>
                          <div className="text-sm text-gray-600">الوقت المتوسط</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Trigger */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">شروط التفعيل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {selectedPlaybook.trigger.type === 'lead_created' ? 'عند إنشاء عميل جديد' :
                         selectedPlaybook.trigger.type === 'status_changed' ? 'عند تغيير الحالة' :
                         selectedPlaybook.trigger.type === 'temperature_change' ? 'عند تغيير درجة الحرارة' :
                         selectedPlaybook.trigger.type === 'manual' ? 'يدوي' :
                         selectedPlaybook.trigger.type === 'score_threshold' ? 'عند تجاوز نقاط محددة' : selectedPlaybook.trigger.type}
                      </span>
                    </div>
                    
                    {selectedPlaybook.trigger.conditions && selectedPlaybook.trigger.conditions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">الشروط الإضافية:</p>
                        <div className="space-y-1">
                          {selectedPlaybook.trigger.conditions.map((condition, index) => (
                            <div key={index} className="flex items-center space-x-2 space-x-reverse text-sm">
                              <Badge variant="outline" className="text-xs">
                                {condition.field}
                              </Badge>
                              <span className="text-gray-600">{condition.operator}</span>
                              <Badge variant="secondary" className="text-xs">
                                {condition.value}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Steps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">مراحل التنفيذ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedPlaybook.steps.map((step, index) => (
                        <div key={step.id} className="flex items-start space-x-3 space-x-reverse p-4 border border-gray-200 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                            {index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 space-x-reverse mb-1">
                              <h4 className="text-sm font-medium text-gray-900">{step.name}</h4>
                              {getStepIcon(step.type)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                            
                            <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
                              <span>النوع: {step.type}</span>
                              {step.delay && (
                                <span>الانتظار: {formatCompletionTime(step.delay)}</span>
                              )}
                              {step.assignee && (
                                <span>المسؤول: {step.assignee}</span>
                              )}
                              {step.isActive && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  نشط
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">العلامات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlaybook.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Actions */}
                <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={() => setShowPlaybookDetails(false)}>
                    إغلاق
                  </Button>
                  <Button onClick={() => handleEditPlaybook(selectedPlaybook)}>
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل الـ Playbook
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

          {/* Quick Actions */}
          <motion.div
            className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ابدأ بإنشاء playbook متطور
                </h3>
                <p className="text-gray-600">
                  استخدم الأدوات المتقدمة لبناء سير عمل ذكي وشامل
                </p>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('conditions')}
                  className="flex items-center"
                >
                  <Brain className="w-4 h-4 ml-2" />
                  الشروط المتقدمة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('automation')}
                  className="flex items-center"
                >
                  <Cog className="w-4 h-4 ml-2" />
                  أتمتة المهام
                </Button>
                <Button
                  onClick={handleCreatePlaybook}
                  className="flex items-center bg-purple-600 hover:bg-purple-700"
                >
                  <Workflow className="w-4 h-4 ml-2" />
                  البناء البصري
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

          {/* Visual Builder Tab */}
          <TabsContent value="builder" className="mt-6">
            <PlaybookBuilder
              playbook={editingPlaybook}
              onSave={handlePlaybookSaved}
              onCancel={() => setActiveTab('overview')}
            />
          </TabsContent>

          {/* Advanced Conditions Tab */}
          <TabsContent value="conditions" className="mt-6">
            <AdvancedConditionsBuilder
              playbook={editingPlaybook}
              onSave={handleConditionsSave}
              onCancel={() => setActiveTab('overview')}
            />
          </TabsContent>

          {/* Task Automation Tab */}
          <TabsContent value="automation" className="mt-6">
            <TaskAutomationManager
              playbook={editingPlaybook}
              onSave={handleTaskAutomationSave}
              onCancel={() => setActiveTab('overview')}
            />
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <AdvancedAnalyticsDashboard
              playbooks={playbooks}
              onClose={() => setActiveTab('overview')}
            />
          </TabsContent>
        </Tabs>

        {/* Empty State for Overview Tab */}
        {playbooks.length === 0 && activeTab === 'overview' && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد Playbooks</h3>
            <p className="text-gray-600 mb-4">
              ابدأ بإنشاء أول playbook متطور الخاص بك
            </p>
            <Button onClick={handleCreatePlaybook}>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء أول playbook متطور
            </Button>
          </motion.div>
        )}
        
        {/* Dialog for Legacy Actions (if needed) */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء playbook جديد</DialogTitle>
              <DialogDescription>
                اختر طريقة الإنشاء المفضلة لديك
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Button 
                variant="outline" 
                className="h-24 flex-col space-y-2"
                onClick={() => {
                  setShowCreateDialog(false);
                  setActiveTab('builder');
                }}
              >
                <Workflow className="w-8 h-8 text-purple-600" />
                <span>البناء البصري</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-24 flex-col space-y-2"
                onClick={() => {
                  setShowCreateDialog(false);
                  setActiveTab('conditions');
                }}
              >
                <Brain className="w-8 h-8 text-blue-600" />
                <span>الشروط المتقدمة</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
  );
}
