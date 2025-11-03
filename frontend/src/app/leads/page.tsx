'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Thermometer,
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  Eye,
  MessageSquare,
  Calendar,
  User,
  Building,
  Globe,
  Zap,
  BarChart3,
  Settings,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  BrainCircuit,
  UserCheck,
  GitBranch,
  Activity,
  Bot,
  Shuffle,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Workflow,
  Timer,
  ArrowUpRight,
  Database,
  FileText,
  Sparkles,
  Move,
  Grid3X3,
  List,
  Table,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/DropdownMenu';
import LeadCard from '../../components/leads/LeadCard';
import LeadActivityTimeline from '../../components/leads/LeadActivityTimeline';
import LeadScoreVisualization from '../../components/leads/LeadScoreVisualization';
import { leadsApi, analyticsApi } from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { useToast } from '../../hooks/useToast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  createdAt: string;
  updatedAt: string;
  owner: string;
  value?: number;
  stage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  temperature: 'cold' | 'warm' | 'hot';
  score: number;
  lastActivity?: string;
  nextFollowUp?: string;
  notes?: string;
}

// Mock data for demonstration
const mockLeads: Lead[] = [
  {
    id: '1',
    firstName: 'أحمد',
    lastName: 'محمد',
    email: 'ahmed.mohammed@example.com',
    phone: '+966501234567',
    company: 'شركة التقنية المتقدمة',
    position: 'مدير تقنية المعلومات',
    source: 'الموقع الإلكتروني',
    status: 'qualified',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    owner: 'current-user',
    value: 150000,
    stage: 'evaluation',
    priority: 'high',
    tags: ['مستهدف', 'تقني', 'كبير'],
    temperature: 'hot',
    score: 92,
    lastActivity: new Date(Date.now() - 3600000).toISOString(),
    nextFollowUp: new Date(Date.now() + 86400000).toISOString(),
    notes: 'عميل مهم جداً - يحتاج متابعة فورية',
  },
  {
    id: '2',
    firstName: 'سارة',
    lastName: 'أحمد',
    email: 'sara.ahmed@example.com',
    phone: '+966502345678',
    company: 'مؤسسة البناء الحديث',
    position: 'مدير مشاريع',
    source: 'مراجعة مباشرة',
    status: 'proposal',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    owner: 'current-user',
    value: 95000,
    stage: 'proposal_sent',
    priority: 'medium',
    tags: ['بناء', 'مشاريع'],
    temperature: 'warm',
    score: 78,
    lastActivity: new Date(Date.now() - 7200000).toISOString(),
    nextFollowUp: new Date(Date.now() + 172800000).toISOString(),
    notes: 'مقدمة لعرض خلال أسبوع',
  },
  {
    id: '3',
    firstName: 'محمد',
    lastName: 'علي',
    email: 'mohamed.ali@example.com',
    phone: '+966503456789',
    company: 'شركة التجارة الذكية',
    position: 'مدير عام',
    source: 'وسائل التواصل الاجتماعي',
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner: 'current-user',
    value: 200000,
    stage: 'initial_contact',
    priority: 'urgent',
    tags: ['جديد', 'تجارة', 'كبير'],
    temperature: 'cold',
    score: 45,
    lastActivity: new Date().toISOString(),
    nextFollowUp: new Date(Date.now() + 3600000).toISOString(),
    notes: 'عميل جديد - يحتاج اتصال سريع',
  },
  {
    id: '4',
    firstName: 'فاطمة',
    lastName: 'سعد',
    email: 'fatima.saad@example.com',
    phone: '+966504567890',
    company: 'مجموعة التطوير الشامل',
    position: 'مديرة تطوير الأعمال',
    source: 'إحالة',
    status: 'negotiation',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    owner: 'current-user',
    value: 180000,
    stage: 'negotiation',
    priority: 'high',
    tags: ['تطوير', 'أعمال', 'مفاوض'],
    temperature: 'hot',
    score: 88,
    lastActivity: new Date(Date.now() - 1800000).toISOString(),
    nextFollowUp: new Date(Date.now() + 86400000).toISOString(),
    notes: 'في مرحلة مفاوضة نهائية',
  },
];

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  
  // New features state
  const [activeTab, setActiveTab] = useState<'overview' | 'csv' | 'scoring' | 'assignment' | 'pipeline' | 'activities'>('overview');
  const [showCsvDialog, setShowCsvDialog] = useState(false);
  const [csvProgress, setCsvProgress] = useState<number>(0);
  const [csvStatus, setCsvStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [showScoringDashboard, setShowScoringDashboard] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showPipelineManager, setShowPipelineManager] = useState(false);
  const [pipelineStages, setPipelineStages] = useState([
    { id: '1', name: 'جديد', order: 1, color: '#3B82F6', leads: [mockLeads[2]] },
    { id: '2', name: 'تم التواصل', order: 2, color: '#F59E0B', leads: [] },
    { id: '3', name: 'مؤهل', order: 3, color: '#8B5CF6', leads: [mockLeads[0]] },
    { id: '4', name: 'عرض سعر', order: 4, color: '#10B981', leads: [mockLeads[1]] },
    { id: '5', name: 'تفاوض', order: 5, color: '#F97316', leads: [mockLeads[3]] },
  ]);
  const [draggedStage, setDraggedStage] = useState<string | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<'auto' | 'manual'>('auto');
  const [selectedAssignmentRule, setSelectedAssignmentRule] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch leads with filters
  const {
    data: leads = mockLeads,
    isLoading,
    error,
    refetch,
  } = useQuery<Lead[]>({
    queryKey: ['leads', searchQuery, statusFilter, priorityFilter, temperatureFilter],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      let filteredLeads = [...mockLeads];

      if (searchQuery) {
        filteredLeads = filteredLeads.filter(lead =>
          lead.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.company?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filteredLeads = filteredLeads.filter(lead => lead.status === statusFilter);
      }

      if (priorityFilter !== 'all') {
        filteredLeads = filteredLeads.filter(lead => lead.priority === priorityFilter);
      }

      if (temperatureFilter !== 'all') {
        filteredLeads = filteredLeads.filter(lead => lead.temperature === temperatureFilter);
      }

      return filteredLeads;
    },
    staleTime: 30000,
  });

  // Analytics data
  const {
    data: analytics,
    isLoading: analyticsLoading,
  } = useQuery({
    queryKey: ['leads-analytics'],
    queryFn: async () => {
      return {
        totalLeads: mockLeads.length,
        hotLeads: mockLeads.filter(l => l.temperature === 'hot').length,
        warmLeads: mockLeads.filter(l => l.temperature === 'warm').length,
        coldLeads: mockLeads.filter(l => l.temperature === 'cold').length,
        avgScore: Math.round(mockLeads.reduce((sum, lead) => sum + lead.score, 0) / mockLeads.length),
        totalValue: mockLeads.reduce((sum, lead) => sum + (lead.value || 0), 0),
        statusBreakdown: mockLeads.reduce((acc, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات العملاء بنجاح',
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

  const handleDeleteLead = async (leadId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف العميل بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ في الحذف',
        description: 'فشل في حذف العميل',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة العميل بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ في التحديث',
        description: 'فشل في تحديث حالة العميل',
        variant: 'destructive',
      });
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadDetails(true);
  };

  // New features functions
  const handleCsvUpload = async () => {
    if (!csvFile) return;
    
    setCsvStatus('uploading');
    setCsvProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setCsvProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          setCsvStatus('processing');
          return prev;
        }
        return prev + 10;
      });
    }, 200);
    
    // Simulate processing
    setTimeout(() => {
      clearInterval(progressInterval);
      setCsvProgress(100);
      setCsvStatus('completed');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'تم الاستيراد بنجاح',
        description: 'تم استيراد البيانات بنجاح',
      });
    }, 3000);
  };

  const handleCsvExport = () => {
    // Simulate CSV export
    const csvContent = "data:text/csv;charset=utf-8," + 
      "الاسم,البريد الإلكتروني,الشركة,الحالة,النقاط\n" +
      leads.map(lead => `${lead.firstName} ${lead.lastName},${lead.email},${lead.company},${lead.status},${lead.score}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'تم التصدير',
      description: 'تم تصدير البيانات بنجاح',
    });
  };

  const handleRecalculateScores = async () => {
    toast({
      title: 'جاري إعادة حساب النقاط',
      description: 'يتم تحديث نقاط العملاء بالذكاء الاصطناعي',
    });
    
    // Simulate score recalculation
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث النقاط بنجاح',
      });
    }, 2000);
  };

  const handleAutoAssignment = async (rule: string) => {
    toast({
      title: 'جاري التوزيع التلقائي',
      description: 'يتم توزيع العملاء تلقائياً',
    });
    
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'تم التوزيع',
        description: 'تم توزيع العملاء بنجاح',
      });
    }, 1500);
  };

  const handleMoveLeadToStage = (leadId: string, stageId: string) => {
    // Move lead between pipeline stages
    const updatedStages = pipelineStages.map(stage => ({
      ...stage,
      leads: stage.id === stageId 
        ? [...stage.leads, leads.find(l => l.id === leadId)!].filter(Boolean)
        : stage.leads.filter(l => l.id !== leadId)
    }));
    
    setPipelineStages(updatedStages);
    
    toast({
      title: 'تم النقل',
      description: 'تم نقل العميل للمرحلة الجديدة',
    });
  };

  const handleDragStart = (stageId: string) => {
    setDraggedStage(stageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStageId: string) => {
    if (draggedStage && draggedStage !== targetStageId) {
      // Get leads from dragged stage
      const draggedStageData = pipelineStages.find(s => s.id === draggedStage);
      if (draggedStageData && draggedStageData.leads.length > 0) {
        const leadToMove = draggedStageData.leads[0]; // Move first lead for demo
        handleMoveLeadToStage(leadToMove.id, targetStageId);
      }
    }
    setDraggedStage(null);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-purple-100 text-purple-800',
      proposal: 'bg-indigo-100 text-indigo-800',
      negotiation: 'bg-orange-100 text-orange-800',
      closed_won: 'bg-green-100 text-green-800',
      closed_lost: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTemperatureIcon = (temperature: string) => {
    switch (temperature) {
      case 'hot':
        return <Zap className="w-4 h-4 text-red-500" />;
      case 'warm':
        return <Thermometer className="w-4 h-4 text-orange-500" />;
      case 'cold':
        return <Thermometer className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTemperatureLabel = (temperature: string) => {
    switch (temperature) {
      case 'hot':
        return 'ساخن';
      case 'warm':
        return 'دافئ';
      case 'cold':
        return 'بارد';
      default:
        return temperature;
    }
  };

  const getTemperatureColor = (temperature: string) => {
    switch (temperature) {
      case 'hot':
        return 'bg-red-100 text-red-800';
      case 'warm':
        return 'bg-yellow-100 text-yellow-800';
      case 'cold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'new', label: 'جديد' },
    { value: 'contacted', label: 'تم التواصل' },
    { value: 'qualified', label: 'مؤهل' },
    { value: 'proposal', label: 'عرض سعر' },
    { value: 'negotiation', label: 'تفاوض' },
    { value: 'closed_won', label: 'مغلق - ناجح' },
    { value: 'closed_lost', label: 'مغلق - فاشل' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'جميع الأولويات' },
    { value: 'low', label: 'منخفضة' },
    { value: 'medium', label: 'متوسطة' },
    { value: 'high', label: 'عالية' },
    { value: 'urgent', label: 'عاجلة' },
  ];

  const temperatureOptions = [
    { value: 'all', label: 'جميع درجات الحرارة' },
    { value: 'hot', label: 'ساخن' },
    { value: 'warm', label: 'دافئ' },
    { value: 'cold', label: 'بارد' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <h1 className="text-3xl font-bold text-gray-900">
                  إدارة العملاء المحتملين
                </h1>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {leads.length} عميل
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                إدارة وتتبع العملاء المحتملين مع الذكاء الاصطناعي
              </p>
              
              {analytics && (
                <div className="flex items-center space-x-6 space-x-reverse mt-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Zap className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-700">
                      {analytics.hotLeads} عميل ساخن
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-700">
                      متوسط النقاط: {analytics.avgScore}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">
                      إجمالي القيمة: {analytics.totalValue.toLocaleString('ar-SA')} ريال
                    </span>
                  </div>
                </div>
              )}
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
              
              <Button variant="outline" size="sm" onClick={handleCsvExport}>
                <Download className="h-4 w-4 ml-2" />
                تصدير CSV
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => setShowCsvDialog(true)}>
                <Upload className="h-4 w-4 ml-2" />
                استيراد CSV
              </Button>
              
              <Button size="sm">
                <Plus className="h-4 w-4 ml-2" />
                إضافة عميل
              </Button>
            </div>
          </div>
        </motion.div>

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
                      placeholder="البحث في العملاء..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                
                {/* Filters */}
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
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
                  
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={temperatureFilter} onValueChange={setTemperatureFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="درجة الحرارة" />
                    </SelectTrigger>
                    <SelectContent>
                      {temperatureOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 ml-2" />
                    المزيد
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Features Tabs */}
        <motion.div
          className="mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <div className="flex items-center justify-between">
                  <TabsList className="grid w-auto grid-cols-6">
                    <TabsTrigger value="overview" className="flex items-center">
                      <BarChart3 className="w-4 h-4 ml-2" />
                      نظرة عامة
                    </TabsTrigger>
                    <TabsTrigger value="csv" className="flex items-center">
                      <FileSpreadsheet className="w-4 h-4 ml-2" />
                      CSV
                    </TabsTrigger>
                    <TabsTrigger value="scoring" className="flex items-center">
                      <Brain className="w-4 h-4 ml-2" />
                      النقاط
                    </TabsTrigger>
                    <TabsTrigger value="assignment" className="flex items-center">
                      <UserCheck className="w-4 h-4 ml-2" />
                      التوزيع
                    </TabsTrigger>
                    <TabsTrigger value="pipeline" className="flex items-center">
                      <GitBranch className="w-4 h-4 ml-2" />
                      الخط
                    </TabsTrigger>
                    <TabsTrigger value="activities" className="flex items-center">
                      <Activity className="w-4 h-4 ml-2" />
                      الأنشطة
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="text-sm text-gray-600">
                    إدارة متقدمة للعملاء المحتملين
                  </div>
                </div>
                
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                  <div className="space-y-6">
                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <Users className="h-8 w-8 text-blue-600 ml-3" />
                            <div>
                              <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
                              <p className="text-xs text-gray-600">إجمالي العملاء</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <Zap className="h-8 w-8 text-red-600 ml-3" />
                            <div>
                              <p className="text-2xl font-bold text-gray-900">{leads.filter(l => l.temperature === 'hot').length}</p>
                              <p className="text-xs text-gray-600">عملاء ساخنين</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <Star className="h-8 w-8 text-yellow-600 ml-3" />
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                {Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length)}
                              </p>
                              <p className="text-xs text-gray-600">متوسط النقاط</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <Target className="h-8 w-8 text-green-600 ml-3" />
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                {leads.reduce((sum, lead) => sum + (lead.value || 0), 0).toLocaleString('ar-SA')}
                              </p>
                              <p className="text-xs text-gray-600">إجمالي القيمة (ريال)</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle>الإجراءات السريعة</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Button 
                            variant="outline" 
                            className="h-20 flex flex-col"
                            onClick={() => setShowCsvDialog(true)}
                          >
                            <Upload className="w-6 h-6 mb-2" />
                            استيراد CSV
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="h-20 flex flex-col"
                            onClick={() => setShowScoringDashboard(true)}
                          >
                            <Brain className="w-6 h-6 mb-2" />
                            حساب النقاط
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="h-20 flex flex-col"
                            onClick={() => setShowAssignmentDialog(true)}
                          >
                            <UserCheck className="w-6 h-6 mb-2" />
                            توزيع العملاء
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="h-20 flex flex-col"
                            onClick={() => setShowPipelineManager(true)}
                          >
                            <GitBranch className="w-6 h-6 mb-2" />
                            إدارة المراحل
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* CSV Management Tab */}
                <TabsContent value="csv" className="mt-6">
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <Star className="h-8 w-8 text-yellow-600 ml-3" />
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                {Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length)}
                              </p>
                              <p className="text-xs text-gray-600">متوسط النقاط</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <Target className="h-8 w-8 text-green-600 ml-3" />
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                {leads.reduce((sum, lead) => sum + (lead.value || 0), 0).toLocaleString('ar-SA')}
                              </p>
                              <p className="text-xs text-gray-600">إجمالي القيمة (ريال)</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle>الإجراءات السريعة</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Button 
                            variant="outline" 
                            className="h-20 flex flex-col"
                            onClick={() => setShowCsvDialog(true)}
                          >
                            <Upload className="w-6 h-6 mb-2" />
                            استيراد CSV
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="h-20 flex flex-col"
                            onClick={() => setShowScoringDashboard(true)}
                          >
                            <Brain className="w-6 h-6 mb-2" />
                            حساب النقاط
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="h-20 flex flex-col"
                            onClick={() => setShowAssignmentDialog(true)}
                          >
                            <UserCheck className="w-6 h-6 mb-2" />
                            توزيع العملاء
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="h-20 flex flex-col"
                            onClick={() => setShowPipelineManager(true)}
                          >
                            <GitBranch className="w-6 h-6 mb-2" />
                            إدارة المراحل
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* CSV Management Tab */}
                <TabsContent value="csv" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <UploadCloud className="w-5 h-5 ml-2" />
                          استيراد البيانات
                        </CardTitle>
                        <CardDescription>
                          رفع ملفات CSV للاستيراد الجماعي للعملاء
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <div className="mb-4">
                            <p className="text-lg font-medium">اسحب ملف CSV هنا</p>
                            <p className="text-sm text-gray-600">أو انقر للاختيار</p>
                          </div>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="csv-upload"
                          />
                          <label htmlFor="csv-upload">
                            <Button variant="outline" className="cursor-pointer">
                              اختيار ملف
                            </Button>
                          </label>
                          {csvFile && (
                            <p className="mt-2 text-sm text-green-600">
                              الملف المختار: {csvFile.name}
                            </p>
                          )}
                        </div>
                        
                        {csvFile && (
                          <Button onClick={handleCsvUpload} className="w-full" size="lg">
                            <Upload className="w-4 h-4 ml-2" />
                            بدء الاستيراد
                          </Button>
                        )}
                        
                        {csvStatus !== 'idle' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>حالة الاستيراد</span>
                              <span>
                                {csvStatus === 'uploading' && 'جاري الرفع...'}
                                {csvStatus === 'processing' && 'جاري المعالجة...'}
                                {csvStatus === 'completed' && 'مكتمل'}
                                {csvStatus === 'error' && 'خطأ'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${csvProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-600">{csvProgress}%</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Download className="w-5 h-5 ml-2" />
                          تصدير البيانات
                        </CardTitle>
                        <CardDescription>
                          تصدير بيانات العملاء إلى ملف CSV
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" onClick={handleCsvExport}>
                            <Download className="w-4 h-4 ml-2" />
                            تصدير الكل
                          </Button>
                          <Button variant="outline">
                            <FileText className="w-4 h-4 ml-2" />
                            تصدير القالب
                          </Button>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">خيارات التصدير</h4>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input type="checkbox" className="ml-2" defaultChecked />
                              البيانات الأساسية
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="ml-2" />
                              النقاط والتقييمات
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="ml-2" />
                              سجل الأنشطة
                            </label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Scoring Dashboard Tab */}
                <TabsContent value="scoring" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Brain className="w-5 h-5 ml-2" />
                            لوحة النقاط الذكية
                          </div>
                          <Button variant="outline" size="sm" onClick={handleRecalculateScores}>
                            <Bot className="w-4 h-4 ml-2" />
                            إعادة الحساب
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Score Distribution */}
                          <div>
                            <h4 className="font-medium mb-3">توزيع النقاط</h4>
                            <div className="grid grid-cols-4 gap-4">
                              {[
                                { label: 'عالية (80-100)', color: 'bg-green-500', count: leads.filter(l => l.score >= 80).length },
                                { label: 'متوسطة (60-79)', color: 'bg-yellow-500', count: leads.filter(l => l.score >= 60 && l.score < 80).length },
                                { label: 'منخفضة (40-59)', color: 'bg-orange-500', count: leads.filter(l => l.score >= 40 && l.score < 60).length },
                                { label: 'ضعيفة (0-39)', color: 'bg-red-500', count: leads.filter(l => l.score < 40).length },
                              ].map((range, index) => (
                                <div key={index} className="text-center">
                                  <div className={`w-16 h-16 ${range.color} rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2`}>
                                    {range.count}
                                  </div>
                                  <p className="text-xs text-gray-600">{range.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Top Scored Leads */}
                          <div>
                            <h4 className="font-medium mb-3">أعلى النقاط</h4>
                            <div className="space-y-3">
                              {leads
                                .sort((a, b) => b.score - a.score)
                                .slice(0, 5)
                                .map((lead, index) => (
                                  <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                      <div className="text-lg font-bold text-blue-600">#{index + 1}</div>
                                      <div>
                                        <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                                        <p className="text-sm text-gray-600">{lead.company}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                      <Star className="w-4 h-4 text-yellow-500" />
                                      <span className="font-bold">{lead.score}</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Sparkles className="w-5 h-5 ml-2" />
                          إحصائيات سريعة
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length)}
                            </div>
                            <div className="text-sm text-gray-600">متوسط النقاط</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {Math.round(leads.filter(l => l.score >= 80).length / leads.length * 100)}%
                            </div>
                            <div className="text-sm text-gray-600">عملاء عالي الجودة</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {leads.filter(l => l.temperature === 'hot').length}
                            </div>
                            <div className="text-sm text-gray-600">عميل ساخن</div>
                          </div>
                          
                          <div className="pt-4 border-t">
                            <Button className="w-full" variant="outline" size="sm">
                              <TrendingUp className="w-4 h-4 ml-2" />
                              تقرير مفصل
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Assignment Management Tab */}
                <TabsContent value="assignment" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Shuffle className="w-5 h-5 ml-2" />
                          التوزيع التلقائي
                        </CardTitle>
                        <CardDescription>
                          قواعد التوزيع الذكية للعملاء
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">التوزيع حسب المنطقة</h4>
                              <p className="text-sm text-gray-600">توزيع العملاء حسب المناطق الجغرافية</p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleAutoAssignment('territory')}
                              variant="outline"
                            >
                              تفعيل
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">التوزيع بالتناوب</h4>
                              <p className="text-sm text-gray-600">توزيع متساوي بين أعضاء الفريق</p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleAutoAssignment('round_robin')}
                              variant="outline"
                            >
                              تفعيل
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">التوزيع حسب الحمل</h4>
                              <p className="text-sm text-gray-600">إرسال للعملاء الأقل حملاً</p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleAutoAssignment('load_based')}
                              variant="outline"
                            >
                              تفعيل
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <UserCheck className="w-5 h-5 ml-2" />
                          التوزيع اليدوي
                        </CardTitle>
                        <CardDescription>
                          توزيع محدد للعملاء المختارين
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">العملاء المختارين ({selectedLeads.length})</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedLeads.map(leadId => {
                              const lead = leads.find(l => l.id === leadId);
                              return lead ? (
                                <div key={leadId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm">{lead.firstName} {lead.lastName}</span>
                                  <Button size="sm" variant="ghost">
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر عضو الفريق" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user1">أحمد محمد</SelectItem>
                              <SelectItem value="user2">سارة أحمد</SelectItem>
                              <SelectItem value="user3">محمد علي</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button className="w-full">
                            <UserCheck className="w-4 h-4 ml-2" />
                            توزيع محدد
                          </Button>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <Button variant="outline" className="w-full" size="sm">
                            <Settings className="w-4 h-4 ml-2" />
                            قواعد مخصصة
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Pipeline Management Tab */}
                <TabsContent value="pipeline" className="mt-6">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center">
                            <GitBranch className="w-5 h-5 ml-2" />
                            إدارة مراحل العمل
                          </div>
                          <Button size="sm" onClick={() => setShowPipelineManager(true)}>
                            <Settings className="w-4 h-4 ml-2" />
                            إدارة المراحل
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          {pipelineStages
                            .sort((a, b) => a.order - b.order)
                            .map((stage) => (
                              <div
                                key={stage.id}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-48 transition-colors"
                                style={{
                                  borderColor: draggedStage === stage.id ? stage.color : undefined,
                                  backgroundColor: draggedStage === stage.id ? `${stage.color}10` : undefined
                                }}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(stage.id)}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-3 h-3 rounded-full ml-2" 
                                      style={{ backgroundColor: stage.color }}
                                    ></div>
                                    <h3 className="font-medium text-sm">{stage.name}</h3>
                                  </div>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {stage.leads.length}
                                  </span>
                                </div>
                                
                                <div className="space-y-2">
                                  {stage.leads.map((lead) => (
                                    <div
                                      key={lead.id}
                                      draggable
                                      onDragStart={() => handleDragStart(stage.id)}
                                      className="bg-white border border-gray-200 rounded p-2 cursor-move hover:shadow-sm transition-shadow"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-xs font-medium">{lead.firstName} {lead.lastName}</p>
                                          <p className="text-xs text-gray-600">{lead.company}</p>
                                        </div>
                                        <div className="flex items-center space-x-1 space-x-reverse">
                                          <Star className="w-3 h-3 text-yellow-500" />
                                          <span className="text-xs font-medium">{lead.score}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {stage.leads.length === 0 && (
                                    <div className="text-center text-gray-400 text-xs py-4">
                                      لا توجد عملاء
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Activities Timeline Tab */}
                <TabsContent value="activities" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Activity className="w-5 h-5 ml-2" />
                          خط الأنشطة الزمني
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {leads.map((lead) => (
                            <div key={lead.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                              <div className="flex items-center space-x-3 space-x-reverse mb-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                  {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-medium">{lead.firstName} {lead.lastName}</h4>
                                  <p className="text-sm text-gray-600">{lead.company}</p>
                                </div>
                                <Badge className={getTemperatureColor(lead.temperature)}>
                                  {getTemperatureLabel(lead.temperature)}
                                </Badge>
                              </div>
                              
                              <div className="space-y-3">
                                {/* Sample activities for each lead */}
                                <div className="flex items-center space-x-3 space-x-reverse p-3 bg-blue-50 rounded-lg">
                                  <Mail className="w-4 h-4 text-blue-600" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">تم إرسال بريد إلكتروني</p>
                                    <p className="text-xs text-gray-600">رسالة ترحيبية - قبل يومين</p>
                                  </div>
                                  <Clock className="w-4 h-4 text-gray-400" />
                                </div>
                                
                                <div className="flex items-center space-x-3 space-x-reverse p-3 bg-green-50 rounded-lg">
                                  <Phone className="w-4 h-4 text-green-600" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">مكالمة هاتفية</p>
                                    <p className="text-xs text-gray-600">مناقشة المتطلبات - قبل 3 أيام</p>
                                  </div>
                                  <Clock className="w-4 h-4 text-gray-400" />
                                </div>
                                
                                <div className="flex items-center space-x-3 space-x-reverse p-3 bg-purple-50 rounded-lg">
                                  <Calendar className="w-4 h-4 text-purple-600" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">اجتماع مُحدد</p>
                                    <p className="text-xs text-gray-600">عرض المنتج - غداً</p>
                                  </div>
                                  <Timer className="w-4 h-4 text-orange-500" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Timer className="w-5 h-5 ml-2" />
                          إحصائيات الأنشطة
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">47</div>
                            <div className="text-sm text-gray-600">مكالمة هذا الشهر</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">23</div>
                            <div className="text-sm text-gray-600">بريد إلكتروني</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">8</div>
                            <div className="text-sm text-gray-600">اجتماع</div>
                          </div>
                          
                          <div className="pt-4 border-t">
                            <Button className="w-full" variant="outline" size="sm">
                              <Plus className="w-4 h-4 ml-2" />
                              إضافة نشاط
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
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
              <TabsList className="grid w-auto grid-cols-3">
                <TabsTrigger value="grid" className="flex items-center">
                  <BarChart3 className="w-4 h-4 ml-2" />
                  بطاقات
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center">
                  <Users className="w-4 h-4 ml-2" />
                  قائمة
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center">
                  <Target className="w-4 h-4 ml-2" />
                  جدول
                </TabsTrigger>
              </TabsList>
              
              <div className="text-sm text-gray-600">
                عرض {leads.length} من {mockLeads.length} عميل
              </div>
            </div>
            
            <TabsContent value="grid" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {leads.map((lead, index) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <LeadCard
                        lead={{
                          ...lead,
                          intelligence: {
                            id: `intel-${lead.id}`,
                            leadId: lead.id,
                            score: { overall: lead.score, engagement: 85, quality: 90, recency: 95 },
                            temperature: { level: lead.temperature, score: 88, trend: 'up' },
                            predictions: { conversion_probability: Math.min(95, lead.score + 10) },
                            createdAt: lead.createdAt,
                            updatedAt: lead.updatedAt,
                          },
                        }}
                        showScore={true}
                        showTemperature={true}
                        showActivity={true}
                        showPredictions={true}
                        compact={false}
                        interactive={true}
                        onClick={() => handleLeadClick(lead)}
                        onAction={(action, lead) => {
                          console.log('Action:', action, 'Lead:', lead);
                        }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </TabsContent>
            
            <TabsContent value="list" className="mt-6">
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200">
                    {leads.map((lead, index) => (
                      <motion.div
                        key={lead.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleLeadClick(lead)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 space-x-reverse mb-1">
                                <h3 className="text-sm font-medium text-gray-900">
                                  {lead.firstName} {lead.lastName}
                                </h3>
                                {getTemperatureIcon(lead.temperature)}
                                <Badge className={getPriorityColor(lead.priority)}>
                                  {lead.priority === 'low' ? 'منخفضة' :
                                   lead.priority === 'medium' ? 'متوسطة' :
                                   lead.priority === 'high' ? 'عالية' : 'عاجلة'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
                                <span>{lead.company}</span>
                                <span>•</span>
                                <span>{lead.email}</span>
                                <span>•</span>
                                <span>نقاط: {lead.score}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status === 'new' ? 'جديد' :
                               lead.status === 'contacted' ? 'تم التواصل' :
                               lead.status === 'qualified' ? 'مؤهل' :
                               lead.status === 'proposal' ? 'عرض سعر' :
                               lead.status === 'negotiation' ? 'تفاوض' :
                               lead.status === 'closed_won' ? 'مغلق - ناجح' : 'مغلق - فاشل'}
                            </Badge>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleLeadClick(lead)}>
                                  <Eye className="w-4 h-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Phone className="w-4 h-4 ml-2" />
                                  اتصال
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="w-4 h-4 ml-2" />
                                  إرسال رسالة
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteLead(lead.id)}
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
            
            <TabsContent value="table" className="mt-6">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            العميل
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الشركة
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الحالة
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الأولوية
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            النقاط
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            درجة الحرارة
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            القيمة
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            آخر نشاط
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            إجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leads.map((lead, index) => (
                          <motion.tr
                            key={lead.id}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleLeadClick(lead)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                                </div>
                                <div className="mr-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {lead.firstName} {lead.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {lead.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{lead.company}</div>
                              <div className="text-sm text-gray-500">{lead.position}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Badge className={getStatusColor(lead.status)}>
                                {lead.status === 'new' ? 'جديد' :
                                 lead.status === 'contacted' ? 'تم التواصل' :
                                 lead.status === 'qualified' ? 'مؤهل' :
                                 lead.status === 'proposal' ? 'عرض سعر' :
                                 lead.status === 'negotiation' ? 'تفاوض' :
                                 lead.status === 'closed_won' ? 'مغلق - ناجح' : 'مغلق - فاشل'}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Badge className={getPriorityColor(lead.priority)}>
                                {lead.priority === 'low' ? 'منخفضة' :
                                 lead.priority === 'medium' ? 'متوسطة' :
                                 lead.priority === 'high' ? 'عالية' : 'عاجلة'}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {lead.score}
                                </div>
                                <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                                  <div 
                                    className="h-2 bg-blue-600 rounded-full" 
                                    style={{ width: `${lead.score}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1 space-x-reverse">
                                {getTemperatureIcon(lead.temperature)}
                                <span className="text-sm text-gray-900">
                                  {getTemperatureLabel(lead.temperature)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {lead.value ? `${lead.value.toLocaleString('ar-SA')} ريال` : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lead.lastActivity 
                                ? format(new Date(lead.lastActivity), 'dd MMM, HH:mm', { locale: ar })
                                : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLeadClick(lead);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle edit
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Lead Details Dialog */}
        <Dialog open={showLeadDetails} onOpenChange={setShowLeadDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                تفاصيل العميل: {selectedLead?.firstName} {selectedLead?.lastName}
              </DialogTitle>
              <DialogDescription>
                معلومات شاملة عن العميل المحتمل
              </DialogDescription>
            </DialogHeader>
            
            {selectedLead && (
              <div className="space-y-6">
                {/* Lead Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">المعلومات الشخصية</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">الاسم</label>
                        <p className="text-sm text-gray-900">{selectedLead.firstName} {selectedLead.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                        <p className="text-sm text-gray-900">{selectedLead.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">رقم الهاتف</label>
                        <p className="text-sm text-gray-900">{selectedLead.phone || '-'}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">معلومات العمل</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">الشركة</label>
                        <p className="text-sm text-gray-900">{selectedLead.company || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">المنصب</label>
                        <p className="text-sm text-gray-900">{selectedLead.position || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">المصدر</label>
                        <p className="text-sm text-gray-900">{selectedLead.source}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Lead Intelligence */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">الذكاء الاصطناعي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedLead.score}</div>
                        <div className="text-sm text-gray-600">النقاط الإجمالية</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 space-x-reverse">
                          {getTemperatureIcon(selectedLead.temperature)}
                          <span className="text-lg font-semibold text-gray-900">
                            {getTemperatureLabel(selectedLead.temperature)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">درجة الحرارة</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.min(95, selectedLead.score + 10)}%
                        </div>
                        <div className="text-sm text-gray-600">احتمالية التحويل</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">الحالة والأولوية</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">الحالة الحالية</label>
                        <div className="mt-1">
                          <Select
                            value={selectedLead.status}
                            onValueChange={(value) => handleStatusChange(selectedLead.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.filter(opt => opt.value !== 'all').map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">الأولوية</label>
                        <div className="mt-1">
                          <Badge className={getPriorityColor(selectedLead.priority)}>
                            {selectedLead.priority === 'low' ? 'منخفضة' :
                             selectedLead.priority === 'medium' ? 'متوسطة' :
                             selectedLead.priority === 'high' ? 'عالية' : 'عاجلة'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">القيمة المقدرة</label>
                        <p className="text-sm text-gray-900">
                          {selectedLead.value ? `${selectedLead.value.toLocaleString('ar-SA')} ريال` : '-'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">الملاحظات والمتابعة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">الملاحظات</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedLead.notes || 'لا توجد ملاحظات'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">آخر نشاط</label>
                        <p className="text-sm text-gray-900">
                          {selectedLead.lastActivity 
                            ? format(new Date(selectedLead.lastActivity), 'dd MMMM yyyy, HH:mm', { locale: ar })
                            : 'لا يوجد نشاط'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">المتابعة التالية</label>
                        <p className="text-sm text-gray-900">
                          {selectedLead.nextFollowUp 
                            ? format(new Date(selectedLead.nextFollowUp), 'dd MMMM yyyy', { locale: ar })
                            : 'لم يتم تحديد متابعة'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">العلامات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Actions */}
                <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={() => setShowLeadDetails(false)}>
                    إغلاق
                  </Button>
                  <Button>
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل العميل
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Empty State */}
        {leads.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد عملاء</h3>
            <p className="text-gray-600 mb-4">
              لم يتم العثور على عملاء يحطون على معايير البحث الحالية
            </p>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إضافة أول عميل
            </Button>
          </motion.div>
        )}
      </div>

      {/* CSV Import Dialog */}
      <Dialog open={showCsvDialog} onOpenChange={setShowCsvDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileSpreadsheet className="w-5 h-5 ml-2" />
              استيراد بيانات العملاء
            </DialogTitle>
            <DialogDescription>
              رفع ملف CSV لاستيراد بيانات العملاء المحتملين
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <UploadCloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">اسحب ملف CSV هنا</p>
                <p className="text-sm text-gray-600">أو انقر لاختيار الملف من جهازك</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="hidden"
                id="csv-upload-dialog"
              />
              <label htmlFor="csv-upload-dialog">
                <Button variant="outline" className="mt-4 cursor-pointer">
                  اختيار ملف CSV
                </Button>
              </label>
            </div>
            
            {csvFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                  <div>
                    <p className="text-sm font-medium text-green-800">تم اختيار الملف</p>
                    <p className="text-sm text-green-600">{csvFile.name}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">متطلبات الملف:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• يجب أن يكون الملف بتنسيق CSV</li>
                <li>• يجب أن يحتوي على الأعمدة: الاسم، البريد الإلكتروني، الشركة</li>
                <li>• الحد الأقصى لحجم الملف 10 ميجابايت</li>
              </ul>
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse">
              <Button variant="outline" onClick={() => setShowCsvDialog(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={() => {
                  handleCsvUpload();
                  setShowCsvDialog(false);
                }}
                disabled={!csvFile}
              >
                <Upload className="w-4 h-4 ml-2" />
                بدء الاستيراد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
