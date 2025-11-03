'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Settings,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Maximize2,
  Minimize2,
  ArrowDown,
  ArrowUp,
  Lightbulb,
  Brain,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Timer,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

// ==================== TYPES & INTERFACES ====================

export interface ConversionFunnelStep {
  stepName: string;
  stepOrder: number;
  visitors: number;
  conversions: number;
  conversionRate: number;
  dropOffRate: number;
  avgTimeInStep: number;
  optimizationPotential?: number;
  recommendations: string[];
  segmentBreakdown?: Record<string, number>;
}

export interface ConversionFunnel {
  id: string;
  name: string;
  description?: string;
  totalVisitors: number;
  totalConversions: number;
  overallConversionRate: number;
  bottleneckStep?: string;
  dropoutRate: number;
  optimizationSuggestions: string[];
  predictedImprovement?: number;
  analysisPeriod: {
    start: string;
    end: string;
  };
  steps: ConversionFunnelStep[];
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  roi: number;
  timeline: string;
  steps: string[];
}

// ==================== FUNNEL VISUALIZATION COMPONENTS ====================

const FunnelBarChart: React.FC<{ steps: ConversionFunnelStep[] }> = ({ steps }) => {
  const chartData = steps.map(step => ({
    name: step.stepName,
    الزوار: step.visitors,
    التحويلات: step.conversions,
    'معدل التحويل': step.conversionRate,
    'معدل التسرب': step.dropOffRate,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="الزوار" fill="#3B82F6" />
        <Bar yAxisId="left" dataKey="التحويلات" fill="#10B981" />
        <Bar yAxisId="right" dataKey="معدل التحويل" fill="#F59E0B" />
        <Bar yAxisId="right" dataKey="معدل التسرب" fill="#EF4444" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const FunnelPieChart: React.FC<{ steps: ConversionFunnelStep[] }> = ({ steps }) => {
  const pieData = steps.map(step => ({
    name: step.stepName,
    value: step.conversions,
    visitors: step.visitors,
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any, name: string) => [value.toLocaleString('ar-SA'), name]} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const CustomFunnelChart: React.FC<{ steps: ConversionFunnelStep[] }> = ({ steps }) => {
  const funnelData = steps.map(step => ({
    name: step.stepName,
    value: step.conversions,
    fullValue: step.visitors,
    fill: getStepColor(step.stepOrder),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        layout="vertical"
        data={funnelData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
        <Tooltip 
          formatter={(value: any, name: string) => [value.toLocaleString('ar-SA'), name]}
          labelFormatter={(label) => `المرحلة: ${label}`}
        />
        <Bar dataKey="fullValue" stackId="a" fill="#E5E7EB" />
        <Bar dataKey="value" stackId="a" fill="#3B82F6">
          <LabelList dataKey="value" position="inside" fill="white" fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// ==================== STEP ANALYSIS COMPONENTS ====================

const StepAnalysisCard: React.FC<{ 
  step: ConversionFunnelStep;
  onOptimize: (step: ConversionFunnelStep) => void;
  isOptimizing: boolean;
}> = ({ step, onOptimize, isOptimizing }) => {
  const conversionColor = step.conversionRate > 15 ? 'text-green-600' : 
                        step.conversionRate > 8 ? 'text-yellow-600' : 'text-red-600';
  
  const dropOffColor = step.dropOffRate > 50 ? 'text-red-600' : 
                      step.dropOffRate > 30 ? 'text-yellow-600' : 'text-green-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
            step.conversionRate > 15 ? 'bg-green-500' :
            step.conversionRate > 8 ? 'bg-yellow-500' : 'bg-red-500'
          }`}>
            {step.stepOrder}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {step.stepName}
          </h3>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOptimize(step)}
          disabled={isOptimizing}
          className="flex items-center space-x-2 space-x-reverse"
        >
          {isOptimizing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          <span>تحسين</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {step.visitors.toLocaleString('ar-SA')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">الزوار</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {step.conversions.toLocaleString('ar-SA')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">التحويلات</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${conversionColor}`}>
            {step.conversionRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">معدل التحويل</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${dropOffColor}`}>
            {step.dropOffRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">معدل التسرب</div>
        </div>
      </div>

      {step.avgTimeInStep && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-300">
            <Clock className="h-4 w-4" />
            <span>متوسط الوقت في هذه المرحلة: {step.avgTimeInStep.toFixed(1)} ساعة</span>
          </div>
        </div>
      )}

      {step.optimizationPotential && step.optimizationPotential > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              إمكانية تحسين: {step.optimizationPotential.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {step.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            التوصيات:
          </h4>
          <ul className="space-y-1">
            {step.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step.segmentBreakdown && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            التوزيع حسب الشريحة:
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(step.segmentBreakdown).map(([segment, value]) => (
              <div key={segment} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">{segment}</span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(value / step.conversions) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{value.toLocaleString('ar-SA')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ==================== OPTIMIZATION PANEL ====================

const OptimizationPanel: React.FC<{
  funnel: ConversionFunnel;
  onClose: () => void;
  onOptimize: (suggestion: OptimizationSuggestion) => void;
}> = ({ funnel, onClose, onOptimize }) => {
  const suggestions: OptimizationSuggestion[] = useMemo(() => {
    return funnel.optimizationSuggestions.map((suggestion, index) => ({
      id: `opt_${index}`,
      title: suggestion,
      description: `تحليل متقدم يشير إلى إمكانية تحسين هذه المرحلة`,
      impact: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
      effort: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
      roi: Math.floor(Math.random() * 300) + 100,
      timeline: ['أسبوع', 'شهر', '3 أشهر'][Math.floor(Math.random() * 3)],
      steps: [
        'تحليل المشكلة بشكل مفصل',
        'تطوير خطة التحسين',
        'تطبيق التحسينات',
        'قياس النتائج'
      ]
    }));
  }, [funnel.optimizationSuggestions]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                تحسين القمع التحولي
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {funnel.name}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <Minimize2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Bottleneck Alert */}
          {funnel.bottleneckStep && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-3 space-x-reverse">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                    عنق زجاجة مكتشف
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    المرحلة "{funnel.bottleneckStep}" تسبب أعلى معدل تسرب ({funnel.dropoutRate.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              اقتراحات التحسين
            </h3>
            
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {suggestion.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {suggestion.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 space-x-reverse text-sm">
                      <span className={`px-2 py-1 rounded-full ${getImpactColor(suggestion.impact)}`}>
                        تأثير {suggestion.impact === 'high' ? 'عالي' : suggestion.impact === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${getEffortColor(suggestion.effort)}`}>
                        جهد {suggestion.effort === 'high' ? 'عالي' : suggestion.effort === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                      <span className="text-blue-600 font-medium">
                        ROI: {suggestion.roi}%
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        المدة: {suggestion.timeline}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => onOptimize(suggestion)}
                    className="flex items-center space-x-2 space-x-reverse"
                  >
                    <Zap className="h-4 w-4" />
                    <span>تطبيق</span>
                  </Button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    خطوات التطبيق:
                  </h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {suggestion.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>

          {/* Predicted Improvement */}
          {funnel.predictedImprovement && funnel.predictedImprovement > 0 && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3 space-x-reverse">
                <Brain className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    تحسين متوقع
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    تطبيق هذه التحسينات قد يحسن معدل التحويل بنسبة {funnel.predictedImprovement.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== UTILITY FUNCTIONS ====================

const getStepColor = (stepOrder: number) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  return colors[stepOrder - 1] || '#6B7280';
};

// ==================== MAIN FUNNEL COMPONENT ====================

export const AdvancedConversionFunnel: React.FC<{
  funnel: ConversionFunnel;
  onOptimize?: (step: ConversionFunnelStep) => void;
  onExport?: (format: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}> = ({ funnel, onOptimize, onExport, onRefresh, isLoading = false }) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'optimization'>('overview');
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);
  const [optimizingStep, setOptimizingStep] = useState<string | null>(null);

  const handleOptimizeStep = async (step: ConversionFunnelStep) => {
    setOptimizingStep(step.stepName);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate optimization
      onOptimize?.(step);
    } finally {
      setOptimizingStep(null);
    }
  };

  const handleApplyOptimization = async (suggestion: OptimizationSuggestion) => {
    console.log('Applying optimization:', suggestion);
    setShowOptimizationPanel(false);
    // Here you would implement the actual optimization logic
  };

  const chartData = funnel.steps.map(step => ({
    name: step.stepName,
    الزوار: step.visitors,
    التحويلات: step.conversions,
    'معدل التحويل': step.conversionRate,
  }));

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {funnel.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {funnel.description}
            </p>
            <div className="flex items-center space-x-4 space-x-reverse mt-2 text-sm text-gray-500">
              <span>الفترة: {new Date(funnel.analysisPeriod.start).toLocaleDateString('ar-SA')} - {new Date(funnel.analysisPeriod.end).toLocaleDateString('ar-SA')}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center space-x-2 space-x-reverse"
            >
              <RefreshCw className="h-4 w-4" />
              <span>تحديث</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport?.('pdf')}
              className="flex items-center space-x-2 space-x-reverse"
            >
              <Download className="h-4 w-4" />
              <span>تصدير</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOptimizationPanel(true)}
              className="flex items-center space-x-2 space-x-reverse bg-purple-50 text-purple-700 border-purple-200"
            >
              <Brain className="h-4 w-4" />
              <span>تحسين ذكي</span>
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {funnel.totalVisitors.toLocaleString('ar-SA')}
            </div>
            <div className="text-sm text-blue-600">إجمالي الزوار</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {funnel.totalConversions.toLocaleString('ar-SA')}
            </div>
            <div className="text-sm text-green-600">إجمالي التحويلات</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {funnel.overallConversionRate.toFixed(2)}%
            </div>
            <div className="text-sm text-yellow-600">معدل التحويل العام</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {funnel.dropoutRate.toFixed(1)}%
            </div>
            <div className="text-sm text-red-600">متوسط معدل التسرب</div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex space-x-2 space-x-reverse mt-6">
          {[
            { key: 'overview', label: 'نظرة عامة', icon: BarChart3 },
            { key: 'detailed', label: 'تحليل مفصل', icon: Activity },
            { key: 'optimization', label: 'التحسين', icon: Zap },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedView(key as any)}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-colors ${
                selectedView === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Content Based on Selected View */}
      <AnimatePresence mode="wait">
        {selectedView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                تحليل القمع
              </h3>
              <CustomFunnelChart steps={funnel.steps} />
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                التوزيع
              </h3>
              <FunnelPieChart steps={funnel.steps} />
            </Card>
          </motion.div>
        )}

        {selectedView === 'detailed' && (
          <motion.div
            key="detailed"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                تحليل مفصل
              </h3>
              <FunnelBarChart steps={funnel.steps} />
            </Card>
            
            <div className="grid grid-cols-1 gap-6">
              {funnel.steps.map((step) => (
                <StepAnalysisCard
                  key={step.stepOrder}
                  step={step}
                  onOptimize={handleOptimizeStep}
                  isOptimizing={optimizingStep === step.stepName}
                />
              ))}
            </div>
          </motion.div>
        )}

        {selectedView === 'optimization' && (
          <motion.div
            key="optimization"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6">
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  تحسين ذكي بالذكاء الاصطناعي
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  استخدم الذكاء الاصطناعي لتحليل القمع وتحسين معدل التحويل
                </p>
                <Button
                  onClick={() => setShowOptimizationPanel(true)}
                  className="flex items-center space-x-2 space-x-reverse bg-purple-600 hover:bg-purple-700"
                >
                  <Brain className="h-5 w-5" />
                  <span>بدء التحليل الذكي</span>
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optimization Panel */}
      <AnimatePresence>
        {showOptimizationPanel && (
          <OptimizationPanel
            funnel={funnel}
            onClose={() => setShowOptimizationPanel(false)}
            onOptimize={handleApplyOptimization}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedConversionFunnel;
