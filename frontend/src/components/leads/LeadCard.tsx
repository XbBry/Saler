'use client';

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Thermometer,
  Activity,
  Target,
  Users,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  Clock,
  Star,
  Award,
  AlertTriangle,
  CheckCircle,
  Timer,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  LeadWithIntelligence,
  LeadCardProps,
  LoadingState,
} from '../../types/lead-intelligence';
import {
  formatScore,
  formatTemperature,
  getTemperatureColor,
  getScoreColor,
  getPriorityLevel,
} from '../../lib/lead-intelligence';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  showScore = true,
  showTemperature = true,
  showActivity = true,
  showPredictions = true,
  compact = false,
  interactive = true,
  onClick,
  onAction,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = useCallback(() => {
    if (interactive && onClick) {
      onClick(lead);
    }
  }, [interactive, onClick, lead]);

  const handleAction = useCallback((action: string) => {
    if (onAction) {
      onAction(action, lead);
    }
  }, [onAction, lead]);

  const priority = getPriorityLevel(lead.intelligence);
  const intelligence = lead.intelligence;
  const temperature = intelligence.temperature;
  const score = intelligence.score;
  const predictions = intelligence.predictions;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    hover: {
      scale: compact ? 1.02 : 1.01,
      transition: { duration: 0.2 }
    }
  };

  const scoreVariants = {
    animate: { 
      scale: [1, 1.1, 1],
      transition: { duration: 0.6, ease: 'easeInOut' }
    }
  };

  if (compact) {
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
        <Card className={`p-4 ${isHovered ? 'shadow-lg' : 'shadow-md'} transition-all duration-200`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {lead.firstName[0]}{lead.lastName[0]}
                </div>
                {priority === 'high' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {lead.firstName} {lead.lastName}
                </h3>
                <p className="text-sm text-gray-500 truncate">{lead.company || lead.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              {showScore && (
                <motion.div 
                  variants={scoreVariants}
                  animate="animate"
                  className="text-center"
                >
                  <div className={`text-lg font-bold ${getScoreColor(score.overall)}`}>
                    {score.overall}
                  </div>
                  <div className="text-xs text-gray-400">نقاط</div>
                </motion.div>
              )}
              
              {showTemperature && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTemperatureColor(temperature.level)}`}>
                  {formatTemperature(temperature.level)}
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

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
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {lead.firstName[0]}{lead.lastName[0]}
                </div>
                <AnimatePresence>
                  {priority === 'high' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <Star className="w-2.5 h-2.5 text-white fill-current" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {lead.firstName} {lead.lastName}
                </h3>
                <p className="text-sm text-gray-600">{lead.position}</p>
                <p className="text-sm text-gray-500">{lead.company}</p>
                <div className="flex items-center mt-1 space-x-2 space-x-reverse">
                  <span className="text-xs text-gray-400">
                    آخر نشاط: {formatDistanceToNow(new Date(lead.updatedAt), { 
                      addSuffix: true, 
                      locale: ar 
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {lead.value?.toLocaleString('ar-SA')} ريال
                </div>
                <div className="text-xs text-gray-500">القيمة المتوقعة</div>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Metrics */}
        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Lead Score */}
            {showScore && (
              <motion.div 
                className="text-center p-3 bg-white rounded-lg shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  variants={scoreVariants}
                  animate="animate"
                  className={`text-2xl font-bold ${getScoreColor(score.overall)} mb-1`}
                >
                  {score.overall}
                </motion.div>
                <div className="text-xs text-gray-600 mb-1">نقاط الجودة</div>
                <div className="flex items-center justify-center space-x-1 space-x-reverse">
                  {score.trend === 'improving' && <TrendingUp className="w-3 h-3 text-green-500" />}
                  {score.trend === 'declining' && <TrendingDown className="w-3 h-3 text-red-500" />}
                  {score.trend === 'stable' && <Minus className="w-3 h-3 text-gray-500" />}
                  <span className="text-xs text-gray-500">
                    {formatScore(score.overall)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Temperature */}
            {showTemperature && (
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getTemperatureColor(temperature.level)} mb-1`}>
                  <Thermometer className="w-4 h-4 ml-1" />
                  {formatTemperature(temperature.level)}
                </div>
                <div className="text-xs text-gray-600 mb-1">درجة الاهتمام</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${temperature.percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  ></motion.div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{temperature.percentage}%</div>
              </div>
            )}

            {/* Conversion Probability */}
            {showPredictions && (
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {predictions.conversion_probability}%
                </div>
                <div className="text-xs text-gray-600 mb-1">احتمالية التحويل</div>
                <div className="flex items-center justify-center space-x-1 space-x-reverse">
                  <Target className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-gray-500">
                    {predictions.conversion_probability >= 70 ? 'عالي' : 
                     predictions.conversion_probability >= 40 ? 'متوسط' : 'منخفض'}
                  </span>
                </div>
              </div>
            )}

            {/* Time to Close */}
            {showPredictions && (
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {predictions.time_to_close}
                </div>
                <div className="text-xs text-gray-600 mb-1">يوم للإغلاق</div>
                <div className="flex items-center justify-center space-x-1 space-x-reverse">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span className="text-xs text-gray-500">
                    {predictions.time_to_close <= 14 ? 'سريع' : 
                     predictions.time_to_close <= 30 ? 'متوسط' : 'طويل'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Heat Sources */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">مصادر الدفء</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              <Eye className="w-4 h-4 ml-1" />
              {isExpanded ? 'إخفاء' : 'تفاصيل'}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {temperature.heatSources.slice(0, isExpanded ? undefined : 2).map((source, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
              >
                <Activity className="w-3 h-3 ml-1" />
                {source.description}
              </motion.div>
            ))}
            {temperature.heatSources.length > 2 && !isExpanded && (
              <span className="text-xs text-gray-500">+{temperature.heatSources.length - 2} المزيد</span>
            )}
          </div>
        </div>

        {/* Next Action */}
        {showPredictions && (
          <div className="px-4 pb-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 space-x-reverse mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">التوصية التالية</span>
                  </div>
                  <p className="text-sm text-green-700 mb-2">{predictions.next_action.action}</p>
                  <div className="flex items-center space-x-4 space-x-reverse text-xs text-green-600">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Timer className="w-3 h-3" />
                      <span>{predictions.next_action.timing}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Phone className="w-3 h-3" />
                      <span>{predictions.next_action.channel}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Award className="w-3 h-3" />
                      <span>{predictions.next_action.success_probability}% نجاح</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-4 pb-4">
          <div className="flex space-x-2 space-x-reverse">
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('call');
              }}
              className="flex-1"
            >
              <Phone className="w-4 h-4 ml-1" />
              اتصال
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('email');
              }}
              className="flex-1"
            >
              <Mail className="w-4 h-4 ml-1" />
              إيميل
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('message');
              }}
              className="flex-1"
            >
              <MessageSquare className="w-4 h-4 ml-1" />
              رسالة
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('more');
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-1">
              {lead.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default memo(LeadCard);