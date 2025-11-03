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
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                تصدير
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
    </div>
  );
}
