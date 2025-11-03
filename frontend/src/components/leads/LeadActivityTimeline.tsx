'use client';

import React, { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Download,
  Globe,
  Users,
  Target,
  FileText,
  Award,
  TrendingUp,
  Clock,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Star,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  LeadActivityTimelineProps,
  ActivityEvent,
  ActivityType,
} from '../../types/lead-intelligence';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const LeadActivityTimeline: React.FC<LeadActivityTimelineProps> = ({
  leadId,
  activities,
  showPredictions = false,
  interactive = true,
  maxItems = 50,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  // Activity type configuration
  const activityConfig: Record<ActivityType, {
    icon: React.ComponentType<any>;
    color: string;
    label: string;
    description: string;
  }> = {
    email_open: {
      icon: Mail,
      color: 'text-blue-600 bg-blue-100',
      label: 'فتح الإيميل',
      description: 'تم فتح رسالة البريد الإلكتروني',
    },
    email_click: {
      icon: Mail,
      color: 'text-blue-700 bg-blue-200',
      label: 'نقر على رابط',
      description: 'تم النقر على رابط في البريد الإلكتروني',
    },
    email_reply: {
      icon: Mail,
      color: 'text-green-600 bg-green-100',
      label: 'رد على الإيميل',
      description: 'تم الرد على رسالة البريد الإلكتروني',
    },
    call_made: {
      icon: Phone,
      color: 'text-purple-600 bg-purple-100',
      label: 'مكالمة صادرة',
      description: 'تم إجراء مكالمة للعميل',
    },
    call_received: {
      icon: Phone,
      color: 'text-purple-700 bg-purple-200',
      label: 'مكالمة واردة',
      description: 'تم استقبال مكالمة من العميل',
    },
    website_visit: {
      icon: Globe,
      color: 'text-orange-600 bg-orange-100',
      label: 'زيارة الموقع',
      description: 'تم زيارة الموقع الإلكتروني',
    },
    form_submission: {
      icon: FileText,
      color: 'text-indigo-600 bg-indigo-100',
      label: 'إرسال نموذج',
      description: 'تم ملء وإرسال نموذج',
    },
    download: {
      icon: Download,
      color: 'text-cyan-600 bg-cyan-100',
      label: 'تحميل ملف',
      description: 'تم تحميل ملف أو مستند',
    },
    social_engagement: {
      icon: Users,
      color: 'text-pink-600 bg-pink-100',
      label: 'تفاعل اجتماعي',
      description: 'تفاعل مع المحتوى على وسائل التواصل',
    },
    meeting_scheduled: {
      icon: Calendar,
      color: 'text-red-600 bg-red-100',
      label: 'جدولة اجتماع',
      description: 'تم تحديد موعد للاجتماع',
    },
    proposal_sent: {
      icon: FileText,
      color: 'text-yellow-600 bg-yellow-100',
      label: 'إرسال عرض سعر',
      description: 'تم إرسال اقتراح أو عرض سعر',
    },
    contract_signed: {
      icon: Award,
      color: 'text-green-700 bg-green-200',
      label: 'توقيع العقد',
      description: 'تم توقيع العقد والاتفاق',
    },
  };

  // Filter and search logic
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(activity => activity.type === filter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.channel.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by timestamp
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

    // Limit items if not expanded
    if (!isExpanded) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [activities, filter, searchQuery, sortOrder, maxItems, isExpanded]);

  // Get unique activity types for filter
  const availableFilters = useMemo(() => {
    const types = Array.from(new Set(activities.map(a => a.type)));
    return types.map(type => ({
      type,
      ...activityConfig[type],
    }));
  }, [activities]);

  // Calculate timeline statistics
  const timelineStats = useMemo(() => {
    const total = activities.length;
    const lastActivity = activities[0];
    const uniqueChannels = new Set(activities.map(a => a.channel)).size;
    const responseActivities = activities.filter(a => 
      ['email_reply', 'call_received', 'message_reply'].includes(a.type)
    ).length;

    return {
      total,
      uniqueChannels,
      responseRate: total > 0 ? Math.round((responseActivities / total) * 100) : 0,
      lastActivity,
    };
  }, [activities]);

  const ActivityItem: React.FC<{ activity: ActivityEvent; index: number }> = ({ 
    activity, 
    index 
  }) => {
    const config = activityConfig[activity.type];
    const Icon = config.icon;
    const isSelected = selectedActivity === activity.id;

    const itemVariants = {
      hidden: { opacity: 0, x: -20 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { duration: 0.3, delay: index * 0.05 }
      }
    };

    return (
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className={`relative flex items-start space-x-4 space-x-reverse group ${
          interactive ? 'cursor-pointer' : ''
        }`}
        onClick={() => setSelectedActivity(isSelected ? null : activity.id)}
      >
        {/* Timeline line */}
        <div className="relative flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color} shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
          {index < filteredActivities.length - 1 && (
            <div className="w-px h-12 bg-gray-200 mt-2"></div>
          )}
        </div>

        {/* Activity content */}
        <div className={`flex-1 pb-8 ${interactive ? 'hover:bg-gray-50' : ''} rounded-lg p-3 transition-colors`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 space-x-reverse mb-1">
                <h4 className="font-medium text-gray-900">{config.label}</h4>
                {activity.temperature === 'hot' && (
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <TrendingUp className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-600">ساخن</span>
                  </div>
                )}
                {activity.leadScore && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {activity.leadScore} نقطة
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
              
              <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
                <div className="flex items-center space-x-1 space-x-reverse">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true, 
                      locale: ar 
                    })}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1 space-x-reverse">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>{activity.channel}</span>
                </div>
                
                {activity.duration && (
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <PlayCircle className="w-3 h-3" />
                    <span>{Math.round(activity.duration / 60)} دقيقة</span>
                  </div>
                )}
              </div>

              {activity.outcome && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Award className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-green-800">النتيجة:</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">{activity.outcome}</p>
                </div>
              )}
            </div>

            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="ml-4"
                >
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                </motion.div>
              )}
              {!isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="ml-4"
                >
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expanded details */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 pt-3 border-t border-gray-200"
              >
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">الوقت المحدد:</span>
                    <p className="font-medium">{format(new Date(activity.timestamp), 'PPpp', { locale: ar })}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">القناة:</span>
                    <p className="font-medium">{activity.channel}</p>
                  </div>
                  {activity.duration && (
                    <div>
                      <span className="text-gray-500">مدة النشاط:</span>
                      <p className="font-medium">{Math.round(activity.duration / 60)} دقيقة</p>
                    </div>
                  )}
                  {activity.leadScore && (
                    <div>
                      <span className="text-gray-500">تأثير النقاط:</span>
                      <p className="font-medium">{activity.leadScore > 0 ? '+' : ''}{activity.leadScore}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">سجل الأنشطة</h3>
          <div className="flex items-center space-x-4 space-x-reverse mt-1 text-sm text-gray-500">
            <span>{timelineStats.total} نشاط</span>
            <span>•</span>
            <span>{timelineStats.uniqueChannels} قناة</span>
            <span>•</span>
            <span>{timelineStats.responseRate}% معدل الرد</span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Eye className="w-4 h-4 ml-1" />
          {isExpanded ? 'عرض أقل' : 'عرض المزيد'}
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="البحث في الأنشطة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Sort */}
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant={sortOrder === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('desc')}
            >
              الأحدث أولاً
            </Button>
            <Button
              variant={sortOrder === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('asc')}
            >
              الأقدم أولاً
            </Button>
          </div>
        </div>

        {/* Activity Type Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            الكل ({activities.length})
          </Button>
          {availableFilters.map(({ type, label, color, icon: Icon }) => {
            const count = activities.filter(a => a.type === type).length;
            return (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(type)}
                className="flex items-center space-x-1 space-x-reverse"
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
                <span className="text-xs bg-gray-100 px-1 rounded">({count})</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {filteredActivities.length > 0 ? (
          <AnimatePresence>
            {filteredActivities.map((activity, index) => (
              <ActivityItem key={activity.id} activity={activity} index={index} />
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أنشطة</h3>
            <p className="text-gray-500">لم يتم العثور على أنشطة تطابق المرشحات المحددة</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredActivities.length >= maxItems && !isExpanded && (
        <div className="mt-6 text-center">
          <Button 
            variant="outline" 
            onClick={() => setIsExpanded(true)}
          >
            عرض جميع الأنشطة ({activities.length})
          </Button>
        </div>
      )}
    </Card>
  );
};

export default memo(LeadActivityTimeline);