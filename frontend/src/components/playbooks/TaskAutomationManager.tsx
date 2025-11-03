'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Clock,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RefreshCw,
  Settings,
  BarChart3,
  TrendingUp,
  Mail,
  Phone,
  MessageSquare,
  Bell,
  Target,
  Zap,
  GitBranch,
  Timer,
  MapPin,
  Globe,
  Code,
  Database,
  Activity,
  Filter,
  Search,
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  Eye,
  Star,
  Flag,
  AlertTriangle,
  Info,
  Send,
  Users,
  Layers,
  Brain,
  ExternalLink,
  FileText,
  Image,
  Video,
  File,
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
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';

// Task Types
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'call' | 'meeting' | 'follow_up' | 'assignment' | 'notification' | 'webhook' | 'api_call' | 'sla' | 'escalation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  icon: React.ComponentType;
  color: string;
  config: {
    duration?: number; // in minutes
    estimatedTime?: number; // in minutes
    requiredSkills?: string[];
    automationRules?: AutomationRule[];
    slaConfig?: SLAConfig;
    escalationConfig?: EscalationConfig;
  };
  templates: {
    title?: string;
    description?: string;
    message?: string;
    emailTemplate?: string;
    subject?: string;
  };
}

export interface TaskAutomation {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'lead_status_change' | 'lead_created' | 'no_response' | 'temperature_change' | 'score_threshold' | 'manual' | 'time_based' | 'event_based';
    conditions: any[];
  };
  actions: TaskAction[];
  schedule: {
    type: 'immediate' | 'delayed' | 'scheduled' | 'recurring';
    delay?: number; // in minutes
    schedule?: {
      time?: string;
      days?: string[];
      timezone?: string;
    };
    recurring?: {
      pattern: 'daily' | 'weekly' | 'monthly';
      interval: number;
      endDate?: string;
    };
  };
  filters: {
    leadTags?: string[];
    leadSources?: string[];
    temperature?: string[];
    priority?: string[];
    location?: string[];
  };
  isActive: boolean;
  stats: {
    totalRuns: number;
    successRate: number;
    avgCompletionTime: number;
    lastRun?: string;
  };
}

export interface TaskAction {
  id: string;
  type: 'create_task' | 'assign_user' | 'send_notification' | 'update_status' | 'trigger_webhook' | 'send_email' | 'schedule_follow_up';
  config: any;
  conditions?: any[];
  template?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  isActive: boolean;
}

export interface SLAConfig {
  responseTime: number; // in hours
  resolutionTime: number; // in hours
  escalationTime?: number; // in hours
  escalationUsers?: string[];
  notifications: {
    beforeDue: number[]; // in minutes
    onDue: boolean;
    afterDue: number[]; // in minutes
  };
}

export interface EscalationConfig {
  levels: {
    level: number;
    condition: string;
    action: string;
    users: string[];
    delay: number; // in minutes
  }[];
  finalAction: 'close' | 'reassign' | 'notify_manager';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskTemplate['type'];
  priority: TaskTemplate['priority'];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'overdue';
  assignedTo?: string;
  createdBy: string;
  leadId?: string;
  playbookRunId?: string;
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  progress: number; // 0-100
  tags: string[];
  metadata: any;
  automationId?: string;
  slaStatus?: {
    isBreached: boolean;
    responseTimeLeft?: number;
    resolutionTimeLeft?: number;
    escalationLevel?: number;
  };
}

// Task Templates
const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'email-follow-up',
    name: 'متابعة بالإيميل',
    description: 'إرسال متابعة تلقائية بالإيميل',
    type: 'email',
    priority: 'medium',
    category: 'متابعة',
    icon: Mail,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    config: {
      duration: 15,
      estimatedTime: 5,
      automationRules: [
        {
          id: 'auto-send',
          name: 'إرسال تلقائي',
          condition: 'lead.no_response > 24h',
          action: 'send_email',
          priority: 1,
          isActive: true
        }
      ]
    },
    templates: {
      subject: 'متابعة: {{lead.name}}',
      description: 'إرسال متابعة إلى {{lead.name}}',
      emailTemplate: 'follow_up_template'
    }
  },
  {
    id: 'call-scheduling',
    name: 'جدولة مكالمة',
    description: 'إنشاء مهمة مكالمة مع العميل',
    type: 'call',
    priority: 'high',
    category: 'اتصال',
    icon: Phone,
    color: 'bg-green-100 text-green-800 border-green-200',
    config: {
      duration: 60,
      estimatedTime: 30,
      requiredSkills: ['communication', 'sales'],
      automationRules: [
        {
          id: 'smart-scheduling',
          name: 'جدولة ذكية',
          condition: 'lead.temperature = hot',
          action: 'schedule_call',
          priority: 1,
          isActive: true
        }
      ]
    },
    templates: {
      title: 'مكالمة مع {{lead.name}}',
      description: 'مكالمة لمناقشة احتياجات العميل'
    }
  },
  {
    id: 'meeting-setup',
    name: 'ترتيب اجتماع',
    description: 'ترتيب اجتماع مع العميل',
    type: 'meeting',
    priority: 'medium',
    category: 'اجتماع',
    icon: Calendar,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    config: {
      duration: 90,
      estimatedTime: 60,
      requiredSkills: ['meeting_management'],
      automationRules: [
        {
          id: 'auto-invite',
          name: 'دعوة تلقائية',
          condition: 'lead.status = proposal',
          action: 'send_meeting_invite',
          priority: 1,
          isActive: true
        }
      ]
    },
    templates: {
      title: 'اجتماع مع {{lead.name}}',
      description: 'اجتماع لمناقشة التفاصيل النهائية'
    }
  },
  {
    id: 'hot-lead-assignment',
    name: 'تعيين عميل ساخن',
    description: 'تعيين العميل الساخن لمسؤول مبيعات متمرس',
    type: 'assignment',
    priority: 'urgent',
    category: 'تعيين',
    icon: User,
    color: 'bg-red-100 text-red-800 border-red-200',
    config: {
      duration: 5,
      estimatedTime: 2,
      requiredSkills: ['hot_lead_management'],
      automationRules: [
        {
          id: 'immediate-assign',
          name: 'تعيين فوري',
          condition: 'lead.temperature = hot',
          action: 'assign_to_senior_sales',
          priority: 1,
          isActive: true
        }
      ],
      slaConfig: {
        responseTime: 0.5, // 30 minutes
        resolutionTime: 2, // 2 hours
        escalationTime: 1, // 1 hour
        notifications: {
          beforeDue: [15, 5],
          onDue: true,
          afterDue: [15, 30, 60]
        }
      }
    },
    templates: {
      title: 'عميل ساخن: {{lead.name}}',
      description: 'تعيين عاجل لعميل ساخن يتطلب متابعة فورية'
    }
  },
  {
    id: 'no-response-alert',
    name: 'تنبيه عدم الرد',
    description: 'تنبيه عند عدم رد العميل',
    type: 'notification',
    priority: 'medium',
    category: 'تنبيه',
    icon: Bell,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    config: {
      duration: 5,
      estimatedTime: 1,
      automationRules: [
        {
          id: 'monitor-response',
          name: 'مراقبة الردود',
          condition: 'lead.last_activity < 48h',
          action: 'send_alert',
          priority: 1,
          isActive: true
        }
      ]
    },
    templates: {
      title: 'تنبيه: {{lead.name}} لم يرد',
      description: 'العميل لم يرد خلال الـ 48 ساعة الماضية'
    }
  },
  {
    id: 'webhook-trigger',
    name: 'تشغيل webhook',
    description: 'تشغيل webhook خارجي',
    type: 'webhook',
    priority: 'low',
    category: 'تكامل',
    icon: Globe,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    config: {
      duration: 30,
      estimatedTime: 5,
      automationRules: []
    },
    templates: {
      description: 'تشغيل webhook إلى {{config.url}}'
    }
  }
];

interface TaskAutomationManagerProps {
  leadId?: string;
  onTaskCreate?: (task: Task) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskComplete?: (taskId: string, result?: any) => void;
}

export const TaskAutomationManager: React.FC<TaskAutomationManagerProps> = ({
  leadId,
  onTaskCreate,
  onTaskUpdate,
  onTaskComplete
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [automations, setAutomations] = useState<TaskAutomation[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showAutomationDialog, setShowAutomationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [filter, setFilter] = useState<{
    status: string;
    priority: string;
    type: string;
    assignedTo: string;
  }>({
    status: 'all',
    priority: 'all',
    type: 'all',
    assignedTo: 'all'
  });

  const { toast } = useToast();

  // Generate mock tasks
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: 'task-1',
        title: 'مكالمة متابعة مع أحمد محمد',
        description: 'متابعة العميل بعد إرسال العرض',
        type: 'call',
        priority: 'high',
        status: 'pending',
        assignedTo: 'user-1',
        createdBy: 'user-admin',
        leadId: 'lead-1',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        estimatedTime: 30,
        progress: 0,
        tags: ['متابعة', 'عرض'],
        metadata: {
          template: TASK_TEMPLATES[1].id,
          config: {}
        },
        automationId: 'auto-1',
        slaStatus: {
          isBreached: false,
          responseTimeLeft: 90,
          resolutionTimeLeft: 150
        }
      },
      {
        id: 'task-2',
        title: 'إرسال عرض أسعار',
        description: 'إرسال عرض مفصل للعملية',
        type: 'email',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: 'user-2',
        createdBy: 'user-admin',
        leadId: 'lead-2',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        estimatedTime: 15,
        progress: 60,
        tags: ['عرض', 'سعر'],
        metadata: {
          template: TASK_TEMPLATES[0].id,
          config: {}
        }
      },
      {
        id: 'task-3',
        title: 'اجتماع نهائي مع سارة أحمد',
        description: 'اجتماع لمناقشة التفاصيل النهائية',
        type: 'meeting',
        priority: 'urgent',
        status: 'pending',
        assignedTo: 'user-1',
        createdBy: 'user-admin',
        leadId: 'lead-3',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        estimatedTime: 60,
        progress: 0,
        tags: ['اجتماع', 'نهائي'],
        metadata: {
          template: TASK_TEMPLATES[2].id,
          config: {}
        }
      }
    ];

    setTasks(mockTasks);
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter.status !== 'all' && task.status !== filter.status) return false;
      if (filter.priority !== 'all' && task.priority !== filter.priority) return false;
      if (filter.type !== 'all' && task.type !== filter.type) return false;
      if (filter.assignedTo !== 'all' && task.assignedTo !== filter.assignedTo) return false;
      if (leadId && task.leadId !== leadId) return false;
      return true;
    });
  }, [tasks, filter, leadId]);

  // Task statistics
  const taskStats = useMemo(() => {
    const total = filteredTasks.length;
    const pending = filteredTasks.filter(t => t.status === 'pending').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const overdue = filteredTasks.filter(t => 
      t.dueDate && new Date() > t.dueDate && t.status !== 'completed'
    ).length;

    return { total, pending, inProgress, completed, overdue };
  }, [filteredTasks]);

  // Create task from template
  const createTaskFromTemplate = useCallback((template: TaskTemplate, leadId?: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: template.templates.title || template.name,
      description: template.templates.description || template.description,
      type: template.type,
      priority: template.priority,
      status: 'pending',
      createdBy: 'current-user',
      leadId,
      createdAt: new Date(),
      estimatedTime: template.config.estimatedTime,
      progress: 0,
      tags: [template.category],
      metadata: {
        template: template.id,
        config: template.config
      }
    };

    setTasks(prev => [...prev, newTask]);
    if (onTaskCreate) {
      onTaskCreate(newTask);
    }

    toast({
      title: 'تم إنشاء المهمة',
      description: `تم إنشاء مهمة "${template.name}" بنجاح`
    });

    setShowTaskDialog(false);
  }, [onTaskCreate, toast]);

  // Update task status
  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status,
            progress: status === 'completed' ? 100 : task.progress,
            completedAt: status === 'completed' ? new Date() : undefined
          }
        : task
    ));

    if (onTaskUpdate) {
      onTaskUpdate(taskId, { status });
    }

    if (status === 'completed' && onTaskComplete) {
      onTaskComplete(taskId);
    }

    toast({
      title: 'تم تحديث المهمة',
      description: `تم تحديث حالة المهمة إلى "${status}"`
    });
  }, [onTaskUpdate, onTaskComplete, toast]);

  // Get task status color
  const getTaskStatusColor = (status: Task['status']) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-600',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get priority color
  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  // Format due date
  const formatDueDate = (date: Date) => {
    if (isToday(date)) {
      return `اليوم ${format(date, 'HH:mm')}`;
    } else if (isTomorrow(date)) {
      return `غداً ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `أمس ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd/MM/yyyy HH:mm');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة الأتمتة والمهام</h2>
          <p className="text-gray-600">أتمتة المهام والمتابعة الذكية</p>
        </div>
        
        <div className="flex space-x-3 space-x-reverse">
          <Button
            variant="outline"
            onClick={() => setShowTaskDialog(true)}
          >
            <Plus className="w-4 h-4 ml-2" />
            مهمة جديدة
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowAutomationDialog(true)}
          >
            <Zap className="w-4 h-4 ml-2" />
            أتمتة جديدة
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{taskStats.total}</div>
            <div className="text-sm text-gray-600">إجمالي المهام</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{taskStats.pending}</div>
            <div className="text-sm text-gray-600">في الانتظار</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
            <div className="text-sm text-gray-600">قيد التنفيذ</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
            <div className="text-sm text-gray-600">مكتملة</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
            <div className="text-sm text-gray-600">متأخرة</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">التصفية:</span>
            </div>
            
            <Select value={filter.status} onValueChange={(value) => 
              setFilter(prev => ({ ...prev, status: value }))
            }>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="failed">فاشلة</SelectItem>
                <SelectItem value="cancelled">ملغية</SelectItem>
                <SelectItem value="overdue">متأخرة</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filter.priority} onValueChange={(value) => 
              setFilter(prev => ({ ...prev, priority: value }))
            }>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="urgent">عاجلة</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filter.type} onValueChange={(value) => 
              setFilter(prev => ({ ...prev, type: value }))
            }>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="email">إيميل</SelectItem>
                <SelectItem value="call">مكالمة</SelectItem>
                <SelectItem value="meeting">اجتماع</SelectItem>
                <SelectItem value="follow_up">متابعة</SelectItem>
                <SelectItem value="assignment">تعيين</SelectItem>
                <SelectItem value="notification">تنبيه</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في المهام..."
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredTasks.map((task, index) => {
                const TemplateIcon = TASK_TEMPLATES.find(t => t.id === task.metadata.template)?.icon || Activity;
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <TemplateIcon className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 space-x-reverse mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </h3>
                          
                          <Badge className={getTaskStatusColor(task.status)}>
                            {task.status === 'pending' ? 'في الانتظار' :
                             task.status === 'in_progress' ? 'قيد التنفيذ' :
                             task.status === 'completed' ? 'مكتملة' :
                             task.status === 'failed' ? 'فاشلة' :
                             task.status === 'cancelled' ? 'ملغية' :
                             task.status === 'overdue' ? 'متأخرة' : task.status}
                          </Badge>
                          
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority === 'low' ? 'منخفضة' :
                             task.priority === 'medium' ? 'متوسطة' :
                             task.priority === 'high' ? 'عالية' :
                             task.priority === 'urgent' ? 'عاجلة' : task.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 truncate">
                          {task.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {task.dueDate ? formatDueDate(task.dueDate) : 'لا يوجد موعد نهائي'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimatedTime || 0} دقيقة</span>
                          </div>
                          
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <User className="w-3 h-3" />
                            <span>{task.assignedTo || 'غير معين'}</span>
                          </div>
                          
                          {task.slaStatus?.isBreached && (
                            <div className="flex items-center space-x-1 space-x-reverse text-red-600">
                              <AlertTriangle className="w-3 h-3" />
                              <span>SLA منتهك</span>
                            </div>
                          )}
                        </div>
                        
                        {task.progress > 0 && task.status === 'in_progress' && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>التقدم</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-1" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskStatus(task.id, 'in_progress');
                            }}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskStatus(task.id, 'completed');
                            }}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Task Templates Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>اختيار قالب المهمة</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TASK_TEMPLATES.map((template) => {
              const IconComponent = template.icon;
              
              return (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => createTaskFromTemplate(template, leadId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className={`p-2 rounded-lg ${template.color}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {template.description}
                        </p>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          <Badge className={getPriorityColor(template.priority)}>
                            {template.priority === 'low' ? 'منخفضة' :
                             template.priority === 'medium' ? 'متوسطة' :
                             template.priority === 'high' ? 'عالية' :
                             template.priority === 'urgent' ? 'عاجلة' : template.priority}
                          </Badge>
                        </div>
                        
                        {template.config.estimatedTime && (
                          <div className="flex items-center space-x-1 space-x-reverse mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{template.config.estimatedTime} دقيقة</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل المهمة</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{selectedTask.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">الحالة</label>
                  <div className="mt-1">
                    <Badge className={getTaskStatusColor(selectedTask.status)}>
                      {selectedTask.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">الأولوية</label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(selectedTask.priority)}>
                      {selectedTask.priority}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">المسؤول</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedTask.assignedTo || 'غير معين'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">الوقت المقدر</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedTask.estimatedTime || 0} دقيقة
                  </p>
                </div>
              </div>
              
              {selectedTask.dueDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">الموعد النهائي</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDueDate(selectedTask.dueDate)}
                  </p>
                </div>
              )}
              
              {selectedTask.slaStatus && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">معلومات SLA</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">انتهاك SLA:</span>
                      <Badge className={selectedTask.slaStatus.isBreached ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {selectedTask.slaStatus.isBreached ? 'نعم' : 'لا'}
                      </Badge>
                    </div>
                    {selectedTask.slaStatus.responseTimeLeft && (
                      <div>
                        <span className="text-gray-600">الوقت المتبقي للرد:</span>
                        <span className="text-gray-900">
                          {selectedTask.slaStatus.responseTimeLeft} دقيقة
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 space-x-reverse pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setSelectedTask(null)}>
                  إغلاق
                </Button>
                
                {selectedTask.status === 'pending' && (
                  <Button onClick={() => {
                    updateTaskStatus(selectedTask.id, 'in_progress');
                    setSelectedTask(null);
                  }}>
                    <Play className="w-4 h-4 ml-2" />
                    بدء التنفيذ
                  </Button>
                )}
                
                {selectedTask.status === 'in_progress' && (
                  <Button onClick={() => {
                    updateTaskStatus(selectedTask.id, 'completed');
                    setSelectedTask(null);
                  }}>
                    <CheckCircle className="w-4 h-4 ml-2" />
                    إكمال
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TaskAutomationManager;