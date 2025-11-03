/**
 * AI Lead Scoring Dashboard Components
 * ================================
 * 
 * مكونات React متقدمة لعرض وتحليل نتائج التقييم الذكي
 * تتضمن الرسوم البيانية التفاعلية، مؤشرات الأداء، والتحليلات المفصلة
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Brain, TrendingUp, Target, Clock, AlertTriangle, 
  CheckCircle, XCircle, Activity, Zap, Eye,
  Filter, Download, RefreshCw, Settings, Info
} from 'lucide-react';

// ==================== SCORING DASHBOARD MAIN COMPONENT ====================

interface ScoringDashboardProps {
  leadId?: string;
  workspaceId: string;
  showTrends?: boolean;
  showABTests?: boolean;
  height?: string;
}

export const ScoringDashboard: React.FC<ScoringDashboardProps> = ({
  leadId,
  workspaceId,
  showTrends = true,
  showABTests = true,
  height = '600px'
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'trends' | 'abtests'>('overview');
  const [scoringData, setScoringData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScoringData();
  }, [leadId, workspaceId]);

  const loadScoringData = async () => {
    try {
      setLoading(true);
      // API call would go here
      // const response = await api.getLeadScore(leadId, workspaceId);
      // setScoringData(response.data);
      
      // Mock data for demonstration
      setTimeout(() => {
        setScoringData({
          overall_score: 78.5,
          confidence: 0.89,
          component_scores: {
            behavioral: 82.0,
            demographic: 75.0,
            engagement: 80.0,
            temporal: 85.0,
            interaction: 70.0,
            quality: 88.0
          },
          key_factors: ['نشاط سلوكي عالي', 'تفاعل ممتاز', 'نية شراء قوية'],
          risk_factors: [
            {
              factor: 'قلة النشاط الحديث',
              severity: 'medium',
              probability: 0.3,
              impact: 50
            }
          ],
          opportunities: [
            {
              type: 'quick_close',
              description: 'فرصة إغلاق سريع',
              value: 15000,
              probability: 0.85
            }
          ],
          recommendations: ['عرض توضيحي', 'متابعة شخصية'],
          trends: generateMockTrends(),
          ab_test_results: generateMockABTests()
        });
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      setError('فشل في تحميل بيانات التقييم');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
        <span className="mr-2">جاري تحميل بيانات التقييم...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        <XCircle className="h-8 w-8 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={`scoring-dashboard bg-white rounded-lg shadow-lg ${height}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="h-6 w-6 text-purple-500 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">لوحة التقييم الذكي</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadScoringData}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Score Overview */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <ScoreCard
            title="النقاط الإجمالية"
            value={scoringData.overall_score}
            icon={<Target className="h-5 w-5" />}
            color="blue"
            format="percentage"
          />
          <ScoreCard
            title="مستوى الثقة"
            value={scoringData.confidence}
            icon={<Eye className="h-5 w-5" />}
            color="green"
            format="percentage"
          />
          <ScoreCard
            title="العوامل الرئيسية"
            value={scoringData.key_factors.length}
            icon={<CheckCircle className="h-5 w-5" />}
            color="purple"
          />
          <ScoreCard
            title="الفرص المتاحة"
            value={scoringData.opportunities.length}
            icon={<TrendingUp className="h-5 w-5" />}
            color="orange"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { key: 'overview', label: 'نظرة عامة', icon: <Activity className="h-4 w-4" /> },
            { key: 'insights', label: 'الرؤى والتحليلات', icon: <Brain className="h-4 w-4" /> },
            ...(showTrends ? [{ key: 'trends', label: 'الاتجاهات', icon: <TrendingUp className="h-4 w-4" /> }] : []),
            ...(showABTests ? [{ key: 'abtests', label: 'اختبارات A/B', icon: <Zap className="h-4 w-4" /> }] : [])
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab data={scoringData} />
        )}
        {activeTab === 'insights' && (
          <InsightsTab data={scoringData} />
        )}
        {activeTab === 'trends' && showTrends && (
          <TrendsTab data={scoringData.trends} />
        )}
        {activeTab === 'abtests' && showABTests && (
          <ABTestsTab data={scoringData.ab_test_results} />
        )}
      </div>
    </div>
  );
};

// ==================== SCORE CARD COMPONENT ====================

interface ScoreCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  format?: 'number' | 'percentage';
  subtitle?: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  value,
  icon,
  color,
  format = 'number',
  subtitle
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  const formatValue = (val: number) => {
    if (format === 'percentage') {
      return `${Math.round(val * 100)}%`;
    }
    return Math.round(val).toString();
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold">{formatValue(value)}</p>
          {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-full bg-white/50">
          {icon}
        </div>
      </div>
    </div>
  );
};

// ==================== OVERVIEW TAB ====================

const OverviewTab: React.FC<{ data: any }> = ({ data }) => {
  const componentData = useMemo(() => {
    return [
      { name: 'سلوكي', score: data.component_scores.behavioral, fill: '#8884d8' },
      { name: 'ديموغرافي', score: data.component_scores.demographic, fill: '#82ca9d' },
      { name: 'تفاعلي', score: data.component_scores.engagement, fill: '#ffc658' },
      { name: 'زمني', score: data.component_scores.temporal, fill: '#ff7300' },
      { name: 'تفاعل متقدم', score: data.component_scores.interaction, fill: '#0088fe' },
      { name: 'جودة', score: data.component_scores.quality, fill: '#00c49f' }
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Component Scores Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">توزيع النقاط حسب المكون</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={componentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${Math.round(value as number)}%`, 'النقاط']}
                labelFormatter={(label) => `المكون: ${label}`}
              />
              <Bar dataKey="score" fill="#8884d8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">المؤشر العام (Radar)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={componentData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="النقاط"
                dataKey="score"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip formatter={(value) => [`${Math.round(value as number)}%`, 'النقاط']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-500" />
          الرؤى الرئيسية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-green-700 mb-2">العوامل الإيجابية</h4>
            <ul className="space-y-2">
              {data.key_factors.map((factor: string, index: number) => (
                <li key={index} className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-red-700 mb-2">عوامل المخاطر</h4>
            <ul className="space-y-2">
              {data.risk_factors.map((risk: any, index: number) => (
                <li key={index} className="flex items-center text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                  {risk.factor} (مستوى {risk.severity})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== INSIGHTS TAB ====================

const InsightsTab: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Opportunities */}
      <div className="bg-green-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-green-800">
          <TrendingUp className="h-5 w-5 mr-2" />
          الفرص المتاحة
        </h3>
        <div className="space-y-4">
          {data.opportunities.map((opportunity: any, index: number) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-green-900">{opportunity.type}</h4>
                <span className="text-sm text-green-600">
                  {Math.round(opportunity.probability * 100)}% احتمالية
                </span>
              </div>
              <p className="text-gray-700 mb-2">{opportunity.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 font-medium">
                  قيمة متوقعة: {opportunity.value.toLocaleString()} ريال
                </span>
                <span className="text-gray-500">الإطار الزمني: {opportunity.probability}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-800">
          <Target className="h-5 w-5 mr-2" />
          التوصيات الذكية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recommendations.map((recommendation: string, index: number) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-blue-200 flex items-start">
              <Clock className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
              <div>
                <p className="text-gray-900">{recommendation}</p>
                <span className="text-xs text-blue-600 mt-1 block">إجراء موصى به</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">التحليل المفصل</h3>
        <div className="prose max-w-none text-gray-700">
          <p className="mb-4">
            بناءً على تحليل البيانات والسلوك، يتمتع هذا العميل المحتمل بإمكانية عالية للتحويل. 
            النقاط الإجمالية البالغة {Math.round(data.overall_score)}% تشير إلى جودة عالية مع 
            ثقة بنسبة {Math.round(data.confidence * 100)}%.
          </p>
          <p>
            العوامل الرئيسية المساهمة تشمل {data.key_factors.slice(0, 2).join(' و')}، 
            بينما يجب مراقبة {data.risk_factors.length > 0 ? 'عوامل المخاطر' : 'عدم وجود مخاطر واضحة'}.
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================== TRENDS TAB ====================

const TrendsTab: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Score Trends Chart */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">اتجاهات النقاط عبر الزمن</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                `${Math.round(value as number)}%`, 
                name === 'avg_score' ? 'متوسط النقاط' : name
              ]}
              labelFormatter={(label) => `التاريخ: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="avg_score" 
              stroke="#8884d8" 
              strokeWidth={3}
              name="متوسط النقاط"
            />
            <Line 
              type="monotone" 
              dataKey="high_quality_percentage" 
              stroke="#82ca9d" 
              strokeWidth={2}
              name="العملاء عاليو الجودة"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">متوسط النقاط</h4>
          <p className="text-2xl font-bold text-blue-600">
            {Math.round(data.reduce((sum, d) => sum + d.avg_score, 0) / data.length)}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">إجمالي العملاء</h4>
          <p className="text-2xl font-bold text-green-600">
            {data.reduce((sum, d) => sum + d.total_leads, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">معدل الجودة</h4>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round(data.reduce((sum, d) => sum + d.high_quality_percentage, 0) / data.length)}%
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================== A/B TESTS TAB ====================

const ABTestsTab: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {data.map((test, index) => (
        <div key={index} className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">اختبار A/B: {test.experiment_id}</h3>
            <span className={`px-3 py-1 rounded-full text-sm ${
              test.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
              test.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {test.status}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {test.variants.map((variant: any, vIndex: number) => (
              <div key={vIndex} className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-3">{variant.name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">معدل التحويل:</span>
                    <span className="font-medium">{variant.conversion_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">عدد العملاء:</span>
                    <span className="font-medium">{variant.leads_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">القيمة الإجمالية:</span>
                    <span className="font-medium">{variant.total_value.toLocaleString()} ريال</span>
                  </div>
                </div>
                
                {/* Performance Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>الأداء</span>
                    <span>{variant.confidence}% ثقة</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${variant.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== UTILITY FUNCTIONS ====================

const generateMockTrends = () => {
  const trends = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trends.push({
      date: date.toISOString().split('T')[0],
      avg_score: Math.random() * 20 + 60, // 60-80
      total_leads: Math.floor(Math.random() * 50) + 20,
      high_quality_leads: Math.floor(Math.random() * 20) + 5,
      low_quality_leads: Math.floor(Math.random() * 10) + 2,
      high_quality_percentage: Math.random() * 30 + 40 // 40-70
    });
  }
  return trends;
};

const generateMockABTests = () => [
  {
    experiment_id: 'scoring_algorithm_v2',
    status: 'running',
    variants: [
      {
        name: 'التحكم',
        conversion_rate: 12.5,
        leads_count: 1250,
        total_value: 187500,
        confidence: 85
      },
      {
        name: 'الخوارزمية الجديدة',
        conversion_rate: 15.2,
        leads_count: 1180,
        total_value: 212000,
        confidence: 82
      }
    ]
  },
  {
    experiment_id: 'feature_weights_test',
    status: 'completed',
    variants: [
      {
        name: 'الأوزان التقليدية',
        conversion_rate: 11.8,
        leads_count: 980,
        total_value: 165000,
        confidence: 91
      },
      {
        name: 'الأوزان المحسنة',
        conversion_rate: 13.7,
        leads_count: 1020,
        total_value: 189000,
        confidence: 89
      }
    ]
  }
];

// ==================== EXPORT ====================

export default ScoringDashboard;

// Export individual components
export {
  ScoreCard,
  OverviewTab,
  InsightsTab,
  TrendsTab,
  ABTestsTab
};
