/**
 * AI Scoring UI Components
 * =======================
 * 
 * مكونات واجهة المستخدم المتقدمة لعرض نتائج التقييم الذكي
 * تتضمن مؤشرات بصرية تفاعلية وتحليلات مفصلة
 */

import React, { useState, useMemo } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Activity,
  Eye,
  BarChart3,
  PieChart,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

// ==================== LEAD SCORE CARD ====================

interface LeadScoreCardProps {
  leadId: string;
  leadName: string;
  company?: string;
  score: number;
  confidence: number;
  temperature: 'hot' | 'warm' | 'cold';
  keyFactors?: string[];
  riskFactors?: string[];
  opportunities?: string[];
  recommendations?: string[];
  lastUpdated?: string;
  onViewDetails?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  showActions?: boolean;
}

export const LeadScoreCard: React.FC<LeadScoreCardProps> = ({
  leadId,
  leadName,
  company,
  score,
  confidence,
  temperature,
  keyFactors = [],
  riskFactors = [],
  opportunities = [],
  recommendations = [],
  lastUpdated,
  onViewDetails,
  onRefresh,
  isLoading = false,
  showActions = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const scoreColor = useMemo(() => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, [score]);

  const temperatureConfig = {
    hot: { color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', label: 'ساخن' },
    warm: { color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200', label: 'دافئ' },
    cold: { color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', label: 'بارد' }
  };

  const tempConfig = temperatureConfig[temperature];

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 ${tempConfig.border} p-6 transition-all duration-200 hover:shadow-lg`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Brain className="h-5 w-5 text-purple-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">{leadName}</h3>
          </div>
          {company && (
            <p className="text-sm text-gray-600">{company}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">ID: {leadId}</p>
        </div>

        {/* Score Display */}
        <div className="text-right">
          <div className={`text-3xl font-bold ${scoreColor}`}>
            {Math.round(score)}
          </div>
          <div className="text-xs text-gray-500">النقاط</div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Confidence */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Eye className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-sm font-medium text-gray-700">الثقة</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(confidence * 100)}%
          </div>
        </div>

        {/* Temperature */}
        <div className="text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${tempConfig.color} ${tempConfig.bg} border ${tempConfig.border}`}>
            <Activity className="h-4 w-4 mr-1" />
            {tempConfig.label}
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      {(keyFactors.length > 0 || opportunities.length > 0) && (
        <div className="space-y-2 mb-4">
          {keyFactors.slice(0, 2).map((factor, index) => (
            <div key={index} className="flex items-center text-sm">
              <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-gray-700">{factor}</span>
            </div>
          ))}
          {opportunities.slice(0, 1).map((opportunity, index) => (
            <div key={index} className="flex items-center text-sm">
              <TrendingUp className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
              <span className="text-gray-700">{opportunity}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expandable Details */}
      {isExpanded && (
        <div className="border-t pt-4 space-y-4">
          {/* Risk Factors */}
          {riskFactors.length > 0 && (
            <div>
              <h4 className="flex items-center text-sm font-medium text-red-700 mb-2">
                <AlertTriangle className="h-4 w-4 mr-1" />
                عوامل المخاطر
              </h4>
              <div className="space-y-1">
                {riskFactors.map((risk, index) => (
                  <div key={index} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                    {risk}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h4 className="flex items-center text-sm font-medium text-blue-700 mb-2">
                <Target className="h-4 w-4 mr-1" />
                التوصيات
              </h4>
              <div className="space-y-1">
                {recommendations.map((rec, index) => (
                  <div key={index} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                إخفاء التفاصيل
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                عرض التفاصيل
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
              >
                عرض التحليل
              </button>
            )}
          </div>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs text-gray-400 mt-2">
          آخر تحديث: {new Date(lastUpdated).toLocaleString('ar-SA')}
        </div>
      )}
    </div>
  );
};

// ==================== SCORE GAUGE COMPONENT ====================

interface ScoreGaugeProps {
  score: number;
  confidence: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showConfidence?: boolean;
  animated?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  confidence,
  size = 'medium',
  showLabel = true,
  showConfidence = true,
  animated = true
}) => {
  const sizeConfig = {
    small: { container: 'w-20 h-20', text: 'text-lg', label: 'text-xs' },
    medium: { container: 'w-32 h-32', text: 'text-2xl', label: 'text-sm' },
    large: { container: 'w-48 h-48', text: 'text-4xl', label: 'text-base' }
  };

  const config = sizeConfig[size];

  // Convert score to circle data for radial bar chart
  const circleData = [
    {
      name: 'score',
      value: score,
      fill: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
    }
  ];

  return (
    <div className={`${config.container} relative`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="90%"
          barSize={8}
          data={circleData}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={4}
            className={animated ? 'transition-all duration-1000 ease-out' : ''}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`${config.text} font-bold text-gray-900`}>
          {Math.round(score)}
        </div>
        {showLabel && (
          <div className={`${config.label} text-gray-500`}>النقاط</div>
        )}
        {showConfidence && confidence && (
          <div className={`${config.label} text-gray-400 mt-1`}>
            {Math.round(confidence * 100)}%
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== COMPONENT SCORES CHART ====================

interface ComponentScoresChartProps {
  scores: {
    behavioral: number;
    demographic: number;
    engagement: number;
    temporal: number;
    interaction: number;
    quality: number;
  };
  height?: number;
}

export const ComponentScoresChart: React.FC<ComponentScoresChartProps> = ({
  scores,
  height = 300
}) => {
  const data = [
    { name: 'سلوكي', score: scores.behavioral, fill: '#8b5cf6' },
    { name: 'ديموغرافي', score: scores.demographic, fill: '#06b6d4' },
    { name: 'تفاعلي', score: scores.engagement, fill: '#10b981' },
    { name: 'زمني', score: scores.temporal, fill: '#f59e0b' },
    { name: 'تفاعل متقدم', score: scores.interaction, fill: '#ef4444' },
    { name: 'جودة', score: scores.quality, fill: '#6366f1' }
  ];

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
        توزيع النقاط حسب المكون
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value) => [`${Math.round(value as number)}%`, 'النقاط']}
            labelFormatter={(label) => `المكون: ${label}`}
          />
          <Bar 
            dataKey="score" 
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==================== SCORE DISTRIBUTION CHART ====================

interface ScoreDistributionChartProps {
  distribution: {
    high: number; // 70-100
    medium: number; // 40-69
    low: number; // 0-39
  };
  total: number;
}

export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  distribution,
  total
}) => {
  const data = [
    { name: 'عالية (70-100)', value: distribution.high, fill: '#10b981' },
    { name: 'متوسطة (40-69)', value: distribution.medium, fill: '#f59e0b' },
    { name: 'منخفضة (0-39)', value: distribution.low, fill: '#ef4444' }
  ];

  const percentageData = data.map(item => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0
  }));

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <PieChart className="h-5 w-5 mr-2 text-purple-500" />
        توزيع النقاط
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={percentageData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="percentage"
                label={({ name, percentage }) => `${Math.round(percentage)}%`}
                labelLine={false}
              >
                {percentageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${Math.round(value as number)}%`, 'النسبة']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3" 
                  style={{ backgroundColor: item.fill }}
                ></div>
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-500">
                  {Math.round((item.value / total) * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== CONFIDENCE INDICATOR ====================

interface ConfidenceIndicatorProps {
  confidence: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  size = 'medium',
  showLabel = true
}) => {
  const getConfidenceLevel = (conf: number) => {
    if (conf >= 0.8) return { level: 'عالي', color: 'text-green-600', bg: 'bg-green-100' };
    if (conf >= 0.6) return { level: 'متوسط', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'منخفض', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const confidenceLevel = getConfidenceLevel(confidence);
  const percentage = Math.round(confidence * 100);

  const sizeConfig = {
    small: { container: 'w-16 h-16', text: 'text-sm', label: 'text-xs' },
    medium: { container: 'w-24 h-24', text: 'text-lg', label: 'text-sm' },
    large: { container: 'w-32 h-32', text: 'text-xl', label: 'text-base' }
  };

  const config = sizeConfig[size];

  return (
    <div className={`${config.container} relative`}>
      {/* Circular Progress */}
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        {/* Background circle */}
        <path
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        {/* Progress circle */}
        <path
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={`${percentage}, 100`}
          className={confidenceLevel.color}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`${config.text} font-bold ${confidenceLevel.color}`}>
          {percentage}%
        </div>
        {showLabel && (
          <div className={`${config.label} text-gray-500`}>
            الثقة
          </div>
        )}
      </div>

      {/* Confidence Level Badge */}
      {showLabel && (
        <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 ${config.label}`}>
          <span className={`px-2 py-1 rounded-full ${confidenceLevel.bg} ${confidenceLevel.color}`}>
            {confidenceLevel.level}
          </span>
        </div>
      )}
    </div>
  );
};

// ==================== SCORE INSIGHTS PANEL ====================

interface ScoreInsightsPanelProps {
  insights: {
    keyFactors?: string[];
    riskFactors?: string[];
    opportunities?: string[];
    recommendations?: string[];
    predictions?: {
      conversion_probability: number;
      time_to_close: number;
      deal_size: {
        minimum: number;
        maximum: number;
        most_likely: number;
      };
    };
  };
  expanded?: boolean;
  onToggle?: () => void;
}

export const ScoreInsightsPanel: React.FC<ScoreInsightsPanelProps> = ({
  insights,
  expanded = false,
  onToggle
}) => {
  return (
    <div className="bg-white border rounded-lg">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center">
          <Brain className="h-5 w-5 text-purple-500 mr-2" />
          <h3 className="text-lg font-semibold">الرؤى والتحليلات</h3>
        </div>
        <div className="flex items-center space-x-2">
          {insights.predictions && (
            <div className="text-sm text-gray-600">
              احتمالية التحويل: {Math.round(insights.predictions.conversion_probability * 100)}%
            </div>
          )}
          {onToggle && (
            expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-6">
          {/* Key Factors */}
          {insights.keyFactors && insights.keyFactors.length > 0 && (
            <div>
              <h4 className="flex items-center text-sm font-medium text-green-700 mb-3">
                <CheckCircle className="h-4 w-4 mr-2" />
                العوامل الإيجابية
              </h4>
              <div className="space-y-2">
                {insights.keyFactors.map((factor, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Factors */}
          {insights.riskFactors && insights.riskFactors.length > 0 && (
            <div>
              <h4 className="flex items-center text-sm font-medium text-red-700 mb-3">
                <AlertTriangle className="h-4 w-4 mr-2" />
                عوامل المخاطر
              </h4>
              <div className="space-y-2">
                {insights.riskFactors.map((risk, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {insights.opportunities && insights.opportunities.length > 0 && (
            <div>
              <h4 className="flex items-center text-sm font-medium text-blue-700 mb-3">
                <TrendingUp className="h-4 w-4 mr-2" />
                الفرص المتاحة
              </h4>
              <div className="space-y-2">
                {insights.opportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{opportunity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predictions */}
          {insights.predictions && (
            <div>
              <h4 className="flex items-center text-sm font-medium text-purple-700 mb-3">
                <Target className="h-4 w-4 mr-2" />
                التنبؤات
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm text-purple-600 mb-1">احتمالية التحويل</div>
                  <div className="text-lg font-semibold text-purple-900">
                    {Math.round(insights.predictions.conversion_probability * 100)}%
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm text-purple-600 mb-1">الوقت المتوقع للإغلاق</div>
                  <div className="text-lg font-semibold text-purple-900">
                    {insights.predictions.time_to_close} يوم
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg col-span-1 md:col-span-2">
                  <div className="text-sm text-purple-600 mb-1">حجم الصفقة المتوقع</div>
                  <div className="text-lg font-semibold text-purple-900">
                    {insights.predictions.deal_size.most_likely.toLocaleString()} ريال
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    (بين {insights.predictions.deal_size.minimum.toLocaleString()} و {insights.predictions.deal_size.maximum.toLocaleString()} ريال)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <div>
              <h4 className="flex items-center text-sm font-medium text-orange-700 mb-3">
                <Clock className="h-4 w-4 mr-2" />
                التوصيات
              </h4>
              <div className="space-y-2">
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== LOADING COMPONENTS ====================

export const ScoringLoadingCard: React.FC<{ height?: string }> = ({ height = '200px' }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 animate-pulse ${height}`}>
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="text-right">
        <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="h-12 bg-gray-200 rounded"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
    </div>
    
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

// ==================== ERROR COMPONENTS ====================

export const ScoringErrorCard: React.FC<{ 
  error: string; 
  onRetry?: () => void;
  leadName?: string;
}> = ({ error, onRetry, leadName }) => (
  <div className="bg-white rounded-lg shadow-md border border-red-200 p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
        <div>
          <h3 className="text-lg font-semibold text-red-700">
            خطأ في تقييم العميل المحتمل
          </h3>
          {leadName && (
            <p className="text-sm text-gray-600 mt-1">{leadName}</p>
          )}
          <p className="text-sm text-red-600 mt-2">{error}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          إعادة المحاولة
        </button>
      )}
    </div>
  </div>
);

// ==================== EXPORT ====================

export {
  LeadScoreCard,
  ScoreGauge,
  ComponentScoresChart,
  ScoreDistributionChart,
  ConfidenceIndicator,
  ScoreInsightsPanel,
  ScoringLoadingCard,
  ScoringErrorCard
};
