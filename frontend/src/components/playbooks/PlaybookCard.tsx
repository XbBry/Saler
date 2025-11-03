'use client';

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Settings,
  Activity,
  Zap,
  Star,
  Eye,
  Share,
  Download,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface PlaybookMetrics {
  totalLeads: number;
  conversionRate: number;
  averageScore: number;
  revenue: number;
}

interface PlaybookAction {
  id: string;
  name: string;
  type: 'email' | 'call' | 'message' | 'task' | 'delay';
  delay?: number;
  conditions?: string[];
}

interface PlaybookTrigger {
  id: string;
  condition: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

interface Playbook {
  id: string;
  title: string;
  description: string;
  category: 'lead-generation' | 'nurturing' | 'conversion' | 'retention';
  status: 'active' | 'paused' | 'draft';
  triggerConditions: PlaybookTrigger[];
  actions: PlaybookAction[];
  metrics: PlaybookMetrics;
  createdAt: string;
  updatedAt: string;
  isTemplate?: boolean;
}

interface PlaybookCardProps {
  playbook: Playbook;
  showMetrics?: boolean;
  showActions?: boolean;
  interactive?: boolean;
  onClick?: (playbook: Playbook) => void;
  onEdit?: (playbook: Playbook) => void;
  onDuplicate?: (playbook: Playbook) => void;
  onDelete?: (playbook: Playbook) => void;
  onToggleStatus?: (playbook: Playbook) => void;
  onExecute?: (playbook: Playbook) => void;
}

const PlaybookCard: React.FC<PlaybookCardProps> = ({
  playbook,
  showMetrics = true,
  showActions = true,
  interactive = true,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
  onExecute,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = useCallback(() => {
    if (interactive && onClick) {
      onClick(playbook);
    }
  }, [interactive, onClick, playbook]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(playbook);
    }
  }, [onEdit, playbook]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDuplicate) {
      onDuplicate(playbook);
    }
  }, [onDuplicate, playbook]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(playbook);
    }
  }, [onDelete, playbook]);

  const handleToggleStatus = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleStatus) {
      onToggleStatus(playbook);
    }
  }, [onToggleStatus, playbook]);

  const handleExecute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExecute) {
      onExecute(playbook);
    }
  }, [onExecute, playbook]);

  const getStatusColor = (status: Playbook['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Playbook['status']) => {
    switch (status) {
      case 'active':
        return <Play className="w-3 h-3" />;
      case 'paused':
        return <Pause className="w-3 h-3" />;
      case 'draft':
        return <Edit className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getCategoryIcon = (category: Playbook['category']) => {
    switch (category) {
      case 'lead-generation':
        return <Users className="w-4 h-4" />;
      case 'nurturing':
        return <Activity className="w-4 h-4" />;
      case 'conversion':
        return <Target className="w-4 h-4" />;
      case 'retention':
        return <Star className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: Playbook['category']) => {
    switch (category) {
      case 'lead-generation':
        return 'bg-blue-100 text-blue-700';
      case 'nurturing':
        return 'bg-purple-100 text-purple-700';
      case 'conversion':
        return 'bg-green-100 text-green-700';
      case 'retention':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryName = (category: Playbook['category']) => {
    switch (category) {
      case 'lead-generation':
        return 'توليد العملاء';
      case 'nurturing':
        return 'رعاية العملاء';
      case 'conversion':
        return 'التحويل';
      case 'retention':
        return 'الاحتفاظ';
      default:
        return category;
    }
  };

  const formatMetric = (value: number, type: 'number' | 'percentage' | 'currency') => {
    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return `${value.toLocaleString('ar-SA')} ريال`;
      default:
        return value.toLocaleString('ar-SA');
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    hover: {
      scale: 1.01,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={`${interactive ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={`overflow-hidden ${isHovered ? 'shadow-xl' : 'shadow-lg'} transition-all duration-300`}>
        {/* Header Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 space-x-reverse">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg text-white">
                {getCategoryIcon(playbook.category)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {playbook.title}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(playbook.status)}`}>
                    {getStatusIcon(playbook.status)}
                    <span className="mr-1">
                      {playbook.status === 'active' ? 'نشط' :
                       playbook.status === 'paused' ? 'متوقف' :
                       playbook.status === 'draft' ? 'مسودة' : playbook.status}
                    </span>
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {playbook.description}
                </p>
                
                <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Clock className="w-3 h-3" />
                    <span>
                      آخر تحديث: {formatDistanceToNow(new Date(playbook.updatedAt), { 
                        addSuffix: true, 
                        locale: ar 
                      })}
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(playbook.category)}`}>
                    {getCategoryIcon(playbook.category)}
                    <span className="mr-1">{getCategoryName(playbook.category)}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleEdit}
                className="p-2"
              >
                <Edit className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-2"
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="p-2"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        {showMetrics && (
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Leads */}
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {formatMetric(playbook.metrics.totalLeads, 'number')}
                </div>
                <div className="text-xs text-gray-600">إجمالي العملاء</div>
              </div>

              {/* Conversion Rate */}
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
                  <Target className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {formatMetric(playbook.metrics.conversionRate, 'percentage')}
                </div>
                <div className="text-xs text-gray-600">معدل التحويل</div>
              </div>

              {/* Average Score */}
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-2">
                  <Star className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {formatMetric(playbook.metrics.averageScore, 'number')}
                </div>
                <div className="text-xs text-gray-600">متوسط النقاط</div>
              </div>

              {/* Revenue */}
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mx-auto mb-2">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {formatMetric(playbook.metrics.revenue, 'currency')}
                </div>
                <div className="text-xs text-gray-600">الإيرادات</div>
              </div>
            </div>
          </div>
        )}

        {/* Trigger Conditions */}
        {isExpanded && (
          <div className="p-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-900 mb-3">شروط التشغيل</h4>
            <div className="space-y-2">
              {playbook.triggerConditions.map((trigger, index) => (
                <div key={trigger.id} className="flex items-center space-x-2 space-x-reverse p-2 bg-blue-50 rounded text-xs">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">{trigger.condition}</span>
                  <span className="text-gray-500">{trigger.operator}</span>
                  <span className="font-medium text-gray-900">{trigger.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {isExpanded && showActions && (
          <div className="p-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-900 mb-3">الإجراءات</h4>
            <div className="space-y-2">
              {playbook.actions.map((action, index) => (
                <div key={action.id} className="flex items-center space-x-3 space-x-reverse p-2 bg-green-50 rounded text-xs">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{index + 1}</span>
                  </div>
                  <span className="text-gray-700">{action.name}</span>
                  <span className="text-gray-500">({action.type})</span>
                  {action.delay && (
                    <span className="text-orange-500">تأخير: {action.delay} دقيقة</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-4 pb-4">
          <div className="flex space-x-2 space-x-reverse">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleToggleStatus}
              className="flex-1"
            >
              {playbook.status === 'active' ? (
                <>
                  <Pause className="w-4 h-4 ml-1" />
                  إيقاف
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 ml-1" />
                  تشغيل
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExecute}
              className="flex-1"
            >
              <Zap className="w-4 h-4 ml-1" />
              تنفيذ
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDuplicate}
              className="px-3"
            >
              <Copy className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDelete}
              className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-1 space-x-reverse">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span>أداء ممتاز</span>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>نشط</span>
              </div>
            </div>
            
            {playbook.isTemplate && (
              <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                <Settings className="w-3 h-3 ml-1" />
                قالب
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default memo(PlaybookCard);