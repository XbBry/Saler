'use client';

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertTriangle,
  CheckCircle,
  Info,
  Star,
  Zap,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import {
  LeadScoreVisualizationProps,
  LeadScore,
  LeadTemperature,
  PredictiveInsights,
} from '../../types/lead-intelligence';
import { formatScore, getScoreColor, formatTemperature, getTemperatureColor } from '../../lib/lead-intelligence';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const LeadScoreVisualization: React.FC<LeadScoreVisualizationProps> = ({
  score,
  temperature,
  predictions,
  size = 'medium',
  showDetails = true,
  interactive = true,
}) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'factors' | 'predictions' | 'temperature'>('overview');

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'p-4',
      scoreSize: 'text-2xl',
      gaugeSize: 80,
      factorGrid: 'grid-cols-1 gap-2',
      iconSize: 'w-4 h-4',
    },
    medium: {
      container: 'p-6',
      scoreSize: 'text-3xl',
      gaugeSize: 120,
      factorGrid: 'grid-cols-2 gap-3',
      iconSize: 'w-5 h-5',
    },
    large: {
      container: 'p-8',
      scoreSize: 'text-4xl',
      gaugeSize: 160,
      factorGrid: 'grid-cols-3 gap-4',
      iconSize: 'w-6 h-6',
    },
  };

  const config = sizeConfig[size];

  // Score gauge component
  const ScoreGauge: React.FC<{ score: number; size: number }> = ({ score, size }) => {
    const radius = size / 2 - 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
        
        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`font-bold ${getScoreColor(score)} ${config.scoreSize}`}>
              {score}
            </div>
            <div className="text-xs text-gray-500">نقاط</div>
          </div>
        </div>
      </div>
    );
  };

  // Temperature gauge component
  const TemperatureGauge: React.FC<{ temperature: LeadTemperature }> = ({ temperature }) => {
    const getTemperatureGradient = (level: string) => {
      switch (level) {
        case 'hot':
          return 'from-red-400 to-red-600';
        case 'warm':
          return 'from-yellow-400 to-orange-500';
        case 'cold':
          return 'from-blue-400 to-blue-600';
        default:
          return 'from-gray-400 to-gray-600';
      }
    };

    return (
      <div className="relative">
        <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${getTemperatureGradient(temperature.level)}`}
            initial={{ width: 0 }}
            animate={{ width: `${temperature.percentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
        <div className="mt-2 text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTemperatureColor(temperature.level)}`}>
            <Zap className="w-3 h-3 ml-1" />
            {formatTemperature(temperature.level)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{temperature.percentage}%</div>
        </div>
      </div>
    );
  };

  // Prediction chart component
  const PredictionChart: React.FC<{ predictions: PredictiveInsights }> = ({ predictions }) => {
    const chartData = [
      { name: 'احتمالية التحويل', value: predictions.conversion_probability, color: 'bg-green-500' },
      { name: 'سرعة الإغلاق', value: 100 - (predictions.time_to_close / 60) * 100, color: 'bg-blue-500' },
      { name: 'مستوى المخاطر', value: 100 - predictions.churn_risk, color: 'bg-yellow-500' },
    ];

    return (
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between"
          >
            <span className="text-sm text-gray-600">{item.name}</span>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${item.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-8 text-right">
                {Math.round(item.value)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <Card className={config.container}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">تحليل الذكاء المتقدم</h3>
          <p className="text-sm text-gray-500">تحليل شامل لعميلك المحتمل</p>
        </div>
        
        {interactive && (
          <div className="flex space-x-1 space-x-reverse">
            <Button
              variant={selectedView === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedView('overview')}
            >
              <BarChart3 className="w-4 h-4 ml-1" />
              نظرة عامة
            </Button>
            <Button
              variant={selectedView === 'factors' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedView('factors')}
            >
              <Target className="w-4 h-4 ml-1" />
              العوامل
            </Button>
            <Button
              variant={selectedView === 'predictions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedView('predictions')}
            >
              <TrendingUp className="w-4 h-4 ml-1" />
              التنبؤات
            </Button>
            <Button
              variant={selectedView === 'temperature' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedView('temperature')}
            >
              <Activity className="w-4 h-4 ml-1" />
              درجة الحرارة
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {selectedView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Score and Temperature */}
            <div className="text-center space-y-6">
              <div>
                <ScoreGauge score={score.overall} size={config.gaugeSize} />
                <div className="mt-4">
                  <div className="flex items-center justify-center space-x-2 space-x-reverse">
                    {score.trend === 'improving' && <TrendingUp className="w-5 h-5 text-green-500" />}
                    {score.trend === 'declining' && <TrendingDown className="w-5 h-5 text-red-500" />}
                    {score.trend === 'stable' && <Minus className="w-5 h-5 text-gray-500" />}
                    <span className="font-medium text-gray-900">
                      {formatScore(score.overall)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">معدل الثقة: {Math.round(score.confidence * 100)}%</p>
                </div>
              </div>
              
              <TemperatureGauge temperature={temperature} />
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Target className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">احتمالية التحويل</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {predictions.conversion_probability}%
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">وقت الإغلاق المتوقع</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {predictions.time_to_close}
                  </div>
                  <div className="text-xs text-blue-600">يوم</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">حجم الصفقة المتوقع</span>
                </div>
                <div className="text-lg font-bold text-purple-900">
                  {predictions.deal_size.most_likely.toLocaleString('ar-SA')} ريال
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  نطاق: {predictions.deal_size.minimum.toLocaleString('ar-SA')} - {predictions.deal_size.maximum.toLocaleString('ar-SA')}
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">مستوى المخاطر</span>
                </div>
                <div className="text-lg font-bold text-orange-900">
                  {predictions.churn_risk}%
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  {predictions.churn_risk < 30 ? 'منخفض' : predictions.churn_risk < 60 ? 'متوسط' : 'عالي'}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {selectedView === 'factors' && showDetails && (
          <motion.div
            key="factors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {score.factors.map((factor, index) => (
                <motion.div
                  key={factor.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 p-4 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{factor.name}</h4>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {factor.impact === 'positive' && (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                      {factor.impact === 'negative' && (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`font-bold ${getScoreColor(factor.score)}`}>
                        {factor.score}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{factor.description}</p>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${factor.score >= 70 ? 'bg-green-500' : factor.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${factor.score}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>الوزن: {Math.round(factor.weight * 100)}%</span>
                    <span>التأثير: {factor.impact === 'positive' ? 'إيجابي' : factor.impact === 'negative' ? 'سلبي' : 'محايد'}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {selectedView === 'predictions' && (
          <motion.div
            key="predictions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <PredictionChart predictions={predictions} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Next Action */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">الإجراء التالي الموصى به</h4>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-blue-900">{predictions.next_action.action}</p>
                  <div className="flex items-center justify-between text-sm text-blue-700">
                    <span>القناة: {predictions.next_action.channel}</span>
                    <span>الأولوية: {predictions.next_action.priority === 'high' ? 'عالية' : predictions.next_action.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</span>
                  </div>
                  <div className="text-sm text-blue-600">
                    التوقيت: {predictions.next_action.timing}
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-100 rounded p-2">
                    {predictions.next_action.reason}
                  </div>
                </div>
              </div>

              {/* Opportunities */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <Star className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-900">الفرص المتاحة</h4>
                </div>
                {predictions.opportunities.length > 0 ? (
                  <div className="space-y-2">
                    {predictions.opportunities.map((opportunity, index) => (
                      <div key={index} className="bg-green-100 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-green-800 text-sm">{opportunity.type}</span>
                          <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                            {opportunity.probability}%
                          </span>
                        </div>
                        <p className="text-xs text-green-700">{opportunity.description}</p>
                        <div className="text-xs text-green-600 mt-1">
                          القيمة: {opportunity.value.toLocaleString('ar-SA')} ريال
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-600">لا توجد فرص محددة حالياً</p>
                )}
              </div>
            </div>

            {/* Risk Factors */}
            {predictions.risk_factors.length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h4 className="font-medium text-red-900">عوامل المخاطر</h4>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {predictions.risk_factors.map((risk, index) => (
                    <div key={index} className="bg-red-100 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-red-800 text-sm">{risk.factor}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          risk.severity === 'high' ? 'bg-red-200 text-red-700' :
                          risk.severity === 'medium' ? 'bg-yellow-200 text-yellow-700' :
                          'bg-green-200 text-green-700'
                        }`}>
                          {risk.severity === 'high' ? 'عالي' : risk.severity === 'medium' ? 'متوسط' : 'منخفض'}
                        </span>
                      </div>
                      <p className="text-xs text-red-700">{risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {selectedView === 'temperature' && (
          <motion.div
            key="temperature"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center">
              <TemperatureGauge temperature={temperature} />
              <p className="text-sm text-gray-600 mt-4">{temperature.reason}</p>
            </div>

            {/* Heat Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">مصادر الدفء</h4>
                <div className="space-y-3">
                  {temperature.heatSources.map((source, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{source.description}</div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(source.timestamp), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-orange-600">+{source.value}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">توصيات الحرارة</h4>
                <div className="space-y-3">
                  {temperature.level === 'hot' && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <Zap className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">سرعة في الإجراءات</span>
                      </div>
                      <p className="text-sm text-green-700">
                        العميل في حالة اهتمام عالي. يُنصح بالاتصال الفوري وجدولة عرض توضيحي.
                      </p>
                    </div>
                  )}
                  
                  {temperature.level === 'warm' && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <Activity className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">تحافظ على الدفء</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        العميل مهتم ولكن يحتاج لمزيد من التحفيز. إرسال محتوى مفيد ومتابعة منتظمة.
                      </p>
                    </div>
                  )}
                  
                  {temperature.level === 'cold' && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800">بناء الثقة</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        العميل في مرحلة مبكرة. التركيز على بناء العلاقة وتقديم القيمة.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default memo(LeadScoreVisualization);