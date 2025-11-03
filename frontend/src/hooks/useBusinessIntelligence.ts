/**
 * useBusinessIntelligence Hook - نظام ذكي للتحليلات التجارية
 * يوفر تحليلات متقدمة مع AI وML
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

// ==================== TYPES & SCHEMAS ====================

export interface BusinessIntelligenceConfig {
  enableML: boolean;
  enablePredictiveAnalytics: boolean;
  enableRealTimeScoring: boolean;
  refreshInterval: number;
  enableNotifications: boolean;
}

export interface LeadIntelligence {
  score: {
    overall: number;
    engagement: number;
    qualification: number;
    conversion: number;
  };
  temperature: {
    level: 'hot' | 'warm' | 'cold';
    score: number;
    trend: 'rising' | 'stable' | 'falling';
  };
  predictions: {
    conversion_probability: number;
    close_date: string | null;
    deal_size: number | null;
    next_action: string;
  };
  insights: {
    personality_insights: {
      type: 'analytical' | 'driver' | 'expressive' | 'amiable';
      traits: string[];
      motivations: string[];
      decision_style: string;
      communication_style: string;
    };
    communication_preferences: {
      preferred_channels: string[];
      best_contact_times: string[];
      response_speed: string;
      tone_preference: string;
      language_preference: string[];
    };
    buying_signals: {
      signals: Array<{
        signal: string;
        strength: number;
        frequency: 'high' | 'medium' | 'low';
        significance: 'high' | 'medium' | 'low';
        timestamp: string;
      }>;
      urgency_level: number;
      decision_stage: string;
      buying_readiness: number;
    };
    objections: {
      likely_objections: Array<{
        objection: string;
        frequency: number;
        impact: number;
        overcome_strategy: string;
      }>;
      overcome_strategies: string[];
      success_rate: number;
    };
    competitor_analysis: {
      competing_companies: string[];
      competitive_advantages: string[];
      switching_factors: string[];
      market_position: string;
    };
  };
  realTimeMetrics: {
    lastActivity: string;
    engagementRate: number;
    responseTime: number;
    attentionSpan: number;
    preferredChannel: string;
  };
}

export interface FunnelAnalysis {
  stages: Array<{
    name: string;
    count: number;
    value: number;
    conversion_rate: number;
    dropoff_rate: number;
    avg_time_in_stage: number;
  }>;
  bottleneck: {
    stage: string;
    severity: 'low' | 'medium' | 'high';
    impact: number;
    suggestions: string[];
  };
  optimization_potential: {
    estimated_improvement: number;
    cost: number;
    timeline: string;
    roi: number;
  };
}

export interface CohortAnalysis {
  periods: Array<{
    cohort: string;
    period_start: string;
    customers: number;
    retention_rates: number[];
    churn_rates: number[];
    avg_ltv: number;
    avg_cac: number;
  }>;
  insights: {
    best_cohort: string;
    worst_cohort: string;
    avg_retention_improvement: number;
    churn_prediction: number;
  };
}

export interface RevenueAttribution {
  channels: Array<{
    name: string;
    revenue: number;
    percentage: number;
    customers: number;
    avg_deal_size: number;
    ltv: number;
    cac: number;
    roi: number;
  }};
  campaigns: Array<{
    name: string;
    spend: number;
    revenue: number;
    roi: number;
    attribution_model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay';
  }];
  touchpoints: {
    avg_touchpoints: number;
    touchpoint_effectiveness: Array<{
      touchpoint: string;
      conversion_impact: number;
      optimal_position: number;
    }>;
  };
}

export interface ChurnPrediction {
  risk_score: number;
  at_risk_customers: Array<{
    id: string;
    name: string;
    risk_level: 'low' | 'medium' | 'high';
    risk_factors: string[];
    probability: number;
    intervention_suggestions: string[];
    last_activity: string;
    value: number;
  }>;
  patterns: {
    common_churn_signals: Array<{
      signal: string;
      correlation: number;
      lead_time: number;
    }>;
    seasonal_trends: Array<{
      month: string;
      churn_rate: number;
      historical_avg: number;
    }>;
  };
  prevention_strategies: Array<{
    strategy: string;
    effectiveness: number;
    cost: number;
    implementation_effort: 'low' | 'medium' | 'high';
  }>;
}

export interface PredictiveAnalytics {
  sales_forecast: Array<{
    period: string;
    predicted_revenue: number;
    confidence_interval: [number, number];
    factors: string[];
  }>;
  demand_forecast: Array<{
    product: string;
    predicted_demand: number;
    seasonality_factor: number;
    trend_direction: 'up' | 'down' | 'stable';
  }>;
  capacity_planning: Array<{
    resource: string;
    current_utilization: number;
    predicted_utilization: number;
    recommended_action: string;
  }>;
  market_trends: Array<{
    trend: string;
    probability: number;
    impact: number;
    timeframe: string;
    opportunities: string[];
  }>;
}

export interface KIPredictions {
  metric: string;
  current_value: number;
  predicted_value: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
  action_recommendations: string[];
}

export interface BusinessIntelligenceData {
  lead_intelligence: Record<string, LeadIntelligence>;
  funnel_analysis: FunnelAnalysis;
  cohort_analysis: CohortAnalysis;
  revenue_attribution: RevenueAttribution;
  churn_prediction: ChurnPrediction;
  predictive_analytics: PredictiveAnalytics;
  ki_predictions: KIPredictions[];
  last_updated: string;
  data_quality_score: number;
}

// ==================== UTILITY FUNCTIONS ====================

const generateMockLeadIntelligence = (leadId: string): LeadIntelligence => {
  const score = Math.floor(Math.random() * 100);
  const engagement = Math.floor(Math.random() * 100);
  const qualification = Math.floor(Math.random() * 100);
  const conversion = Math.floor(Math.random() * 100);
  
  const temperature = score > 70 ? 'hot' : score > 40 ? 'warm' : 'cold';
  const conversionProb = Math.min(95, Math.max(5, score + (Math.random() - 0.5) * 20));
  
  return {
    score: { overall: score, engagement, qualification, conversion },
    temperature: {
      level: temperature,
      score,
      trend: ['rising', 'stable', 'falling'][Math.floor(Math.random() * 3)] as any
    },
    predictions: {
      conversion_probability: conversionProb,
      close_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      deal_size: Math.floor(Math.random() * 500000) + 50000,
      next_action: ['متابعة', 'عرض توضيحي', 'عرض سعر', 'اتصال'][Math.floor(Math.random() * 4)]
    },
    insights: {
      personality_insights: {
        type: ['analytical', 'driver', 'expressive', 'amiable'][Math.floor(Math.random() * 4)] as any,
        traits: ['منطقي', 'مفصل', 'دقيق', 'سريع'][Math.floor(Math.random() * 4)] as any,
        motivations: ['الكفاءة', 'الجودة', 'الابتكار'][Math.floor(Math.random() * 3)],
        decision_style: 'منهجي',
        communication_style: 'مهني مباشر',
      },
      communication_preferences: {
        preferred_channels: ['email', 'phone', 'whatsapp'][Math.floor(Math.random() * 3)] as any,
        best_contact_times: ['10:00-12:00', '14:00-16:00'],
        response_speed: 'سريع',
        tone_preference: 'مهني',
        language_preference: ['العربية', 'الإنجليزية'],
      },
      buying_signals: {
        signals: [
          {
            signal: 'طلب عرض توضيحي',
            strength: Math.floor(Math.random() * 40) + 60,
            frequency: 'high',
            significance: 'high',
            timestamp: new Date().toISOString()
          }
        ],
        urgency_level: Math.floor(Math.random() * 100),
        decision_stage: 'evaluation',
        buying_readiness: conversionProb,
      },
      objections: {
        likely_objections: [
          {
            objection: 'التكلفة',
            frequency: 70,
            impact: 60,
            overcome_strategy: 'إظهار ROI والتوفير طويل المدى'
          }
        ],
        overcome_strategies: ['دراسات حالة', 'عروض توضيحية مجانية'],
        success_rate: 75,
      },
      competitor_analysis: {
        competing_companies: ['شركة أ', 'شركة ب'],
        competitive_advantages: ['دعم فني متميز', 'تكلفة أقل'],
        switching_factors: ['جودة الخدمة', 'سهولة الاستخدام'],
        market_position: 'قائد محلي',
      },
    },
    realTimeMetrics: {
      lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      engagementRate: Math.floor(Math.random() * 100),
      responseTime: Math.floor(Math.random() * 24),
      attentionSpan: Math.floor(Math.random() * 100),
      preferredChannel: ['email', 'phone', 'whatsapp'][Math.floor(Math.random() * 3)],
    },
  };
};

const generateMockBusinessData = (): BusinessIntelligenceData => {
  const leads = Array.from({ length: 50 }, (_, i) => 
    generateMockLeadIntelligence(`lead_${i + 1}`)
  );
  
  const lead_intelligence = leads.reduce((acc, intelligence, index) => {
    acc[`lead_${index + 1}`] = intelligence;
    return acc;
  }, {} as Record<string, LeadIntelligence>);

  return {
    lead_intelligence,
    funnel_analysis: {
      stages: [
        { name: 'زوار', count: 10000, value: 10000, conversion_rate: 100, dropoff_rate: 0, avg_time_in_stage: 0 },
        { name: 'عملاء محتملون', count: 3000, value: 3000, conversion_rate: 30, dropoff_rate: 70, avg_time_in_stage: 2 },
        { name: 'مؤهلون', count: 1200, value: 1200, conversion_rate: 12, dropoff_rate: 60, avg_time_in_stage: 7 },
        { name: 'عروض', count: 480, value: 480, conversion_rate: 4.8, dropoff_rate: 60, avg_time_in_stage: 14 },
        { name: 'مغلقون', count: 144, value: 144, conversion_rate: 1.44, dropoff_rate: 70, avg_time_in_stage: 21 },
      ],
      bottleneck: {
        stage: 'عملاء محتملون',
        severity: 'high',
        impact: 25,
        suggestions: ['تحسين عملية التأهيل', 'تدريب فريق المبيعات', 'أتمتة التقييم الأولي']
      },
      optimization_potential: {
        estimated_improvement: 15,
        cost: 50000,
        timeline: '3 أشهر',
        roi: 300,
      }
    },
    cohort_analysis: {
      periods: [
        { cohort: 'يناير 2024', period_start: '2024-01-01', customers: 1200, retention_rates: [100, 85, 78, 72, 69], churn_rates: [0, 15, 22, 28, 31], avg_ltv: 45000, avg_cac: 8000 },
        { cohort: 'فبراير 2024', period_start: '2024-02-01', customers: 1350, retention_rates: [100, 82, 75, 70], churn_rates: [0, 18, 25, 30], avg_ltv: 42000, avg_cac: 7500 },
        { cohort: 'مارس 2024', period_start: '2024-03-01', customers: 1280, retention_rates: [100, 88, 82], churn_rates: [0, 12, 18], avg_ltv: 38000, avg_cac: 7000 },
      ],
      insights: {
        best_cohort: 'مارس 2024',
        worst_cohort: 'فبراير 2024',
        avg_retention_improvement: 8.5,
        churn_prediction: 15.2,
      }
    },
    revenue_attribution: {
      channels: [
        { name: 'وسائل التواصل', revenue: 245000, percentage: 35, customers: 150, avg_deal_size: 1633, ltv: 12000, cac: 800, roi: 1400 },
        { name: 'محركات البحث', revenue: 198000, percentage: 28, customers: 120, avg_deal_size: 1650, ltv: 11000, cac: 900, roi: 1122 },
        { name: 'المراجع', revenue: 156000, percentage: 22, customers: 85, avg_deal_size: 1835, ltv: 15000, cac: 600, roi: 2400 },
        { name: 'الإعلانات المدفوعة', revenue: 89000, percentage: 15, customers: 65, avg_deal_size: 1369, ltv: 9000, cac: 1200, roi: 650 },
      ],
      campaigns: [
        { name: 'حملة年春', spend: 25000, revenue: 75000, roi: 200, attribution_model: 'last_touch' },
        { name: 'حملة الصيف', spend: 30000, revenue: 95000, roi: 216, attribution_model: 'linear' },
      ],
      touchpoints: {
        avg_touchpoints: 7.2,
        touchpoint_effectiveness: [
          { touchpoint: 'موقع ويب', conversion_impact: 25, optimal_position: 1 },
          { touchpoint: 'مكالمة مبيعات', conversion_impact: 40, optimal_position: 3 },
          { touchpoint: 'عرض توضيحي', conversion_impact: 60, optimal_position: 4 },
        ]
      }
    },
    churn_prediction: {
      risk_score: 23,
      at_risk_customers: Array.from({ length: 15 }, (_, i) => ({
        id: `customer_${i + 1}`,
        name: `عميل ${i + 1}`,
        risk_level: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
        risk_factors: ['انخفاض التفاعل', 'عدم الرد على الرسائل'],
        probability: Math.random() * 80 + 10,
        intervention_suggestions: ['اتصال شخصي', 'عرض خاص'],
        last_activity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        value: Math.floor(Math.random() * 50000) + 10000,
      })),
      patterns: {
        common_churn_signals: [
          { signal: 'انخفاض التفاعل', correlation: 0.8, lead_time: 14 },
          { signal: 'عدم الدفع', correlation: 0.9, lead_time: 7 },
          { signal: 'شكوى دعم فني', correlation: 0.6, lead_time: 21 },
        ],
        seasonal_trends: [
          { month: 'يناير', churn_rate: 5.2, historical_avg: 4.8 },
          { month: 'فبراير', churn_rate: 4.1, historical_avg: 4.8 },
          { month: 'مارس', churn_rate: 3.8, historical_avg: 4.8 },
        ]
      },
      prevention_strategies: [
        { strategy: 'برنامج ولاء', effectiveness: 85, cost: 15000, implementation_effort: 'medium' },
        { strategy: 'دعم فني محسن', effectiveness: 70, cost: 25000, implementation_effort: 'high' },
      ]
    },
    predictive_analytics: {
      sales_forecast: Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        const baseValue = 50000;
        const variation = (Math.random() - 0.5) * 20000;
        return {
          period: date.toISOString().split('T')[0],
          predicted_revenue: Math.max(0, baseValue + variation),
          confidence_interval: [baseValue + variation - 5000, baseValue + variation + 5000],
          factors: ['الاتجاه العام', 'الموسمية', 'الحملات التسويقية'],
        };
      }),
      demand_forecast: [
        { product: 'المنتج أ', predicted_demand: 150, seasonality_factor: 1.2, trend_direction: 'up' as const },
        { product: 'المنتج ب', predicted_demand: 200, seasonality_factor: 0.8, trend_direction: 'down' as const },
        { product: 'المنتج ج', predicted_demand: 180, seasonality_factor: 1.0, trend_direction: 'stable' as const },
      ],
      capacity_planning: [
        { resource: 'فريق المبيعات', current_utilization: 75, predicted_utilization: 85, recommended_action: 'توظيف إضافي' },
        { resource: 'الدعم الفني', current_utilization: 90, predicted_utilization: 95, recommended_action: 'تطوير أتمتة' },
      ],
      market_trends: [
        { trend: 'زيادة الطلب على الحلول السحابية', probability: 85, impact: 90, timeframe: '6 أشهر', opportunities: ['تطوير منتجات جديدة'] },
        { trend: 'تحول نحو الذكاء الاصطناعي', probability: 70, impact: 95, timeframe: '12 شهر', opportunities: ['شراكات تقنية'] },
      ]
    },
    ki_predictions: [
      {
        metric: 'معدل التحويل',
        current_value: 3.2,
        predicted_value: 3.8,
        confidence: 85,
        trend: 'up',
        factors: ['تحسين جودة العملاء', 'تدريب فريق المبيعات'],
        action_recommendations: ['زيادة الاستثمار في التسويق', 'تحسين عملية التأهيل']
      },
      {
        metric: 'متوسط قيمة الصفقة',
        current_value: 45000,
        predicted_value: 52000,
        confidence: 78,
        trend: 'up',
        factors: ['تحسين عروض القيمة', 'بيع متقاطع'],
        action_recommendations: ['تطوير حزم شاملة', 'تحسين استراتيجيات التسعير']
      }
    ],
    last_updated: new Date().toISOString(),
    data_quality_score: 92,
  };
};

// ==================== MAIN HOOK ====================

export function useBusinessIntelligence(config: Partial<BusinessIntelligenceConfig> = {}) {
  const queryClient = useQueryClient();
  
  const defaultConfig: BusinessIntelligenceConfig = {
    enableML: true,
    enablePredictiveAnalytics: true,
    enableRealTimeScoring: true,
    refreshInterval: 30000, // 30 seconds
    enableNotifications: true,
    ...config,
  };

  const [filters, setFilters] = useState({
    dateRange: { start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), end: new Date() },
    segments: [],
    leadIds: [],
    metrics: [],
  });

  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);
  const [mlModelsStatus, setMlModelsStatus] = useState<Record<string, 'training' | 'ready' | 'error'>>({});

  // Main Business Intelligence Data Query
  const {
    data: biData,
    isLoading,
    error,
    refetch,
  } = useQuery<BusinessIntelligenceData>({
    queryKey: ['business-intelligence', filters],
    queryFn: async () => {
      // Simulate API call with realistic delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateMockBusinessData();
    },
    staleTime: 30000,
    refetchInterval: realTimeUpdates ? defaultConfig.refreshInterval : false,
  });

  // Lead Intelligence Real-time Updates
  const leadIntelSubscription = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!realTimeUpdates || !defaultConfig.enableRealTimeScoring) return;

    // Simulate real-time lead intelligence updates
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['business-intelligence'] });
    }, defaultConfig.refreshInterval);

    return () => clearInterval(interval);
  }, [realTimeUpdates, defaultConfig.refreshInterval, queryClient]);

  // Mutations for Business Intelligence Actions
  const updateLeadScore = useMutation({
    mutationFn: async ({ leadId, score, factors }: { 
      leadId: string; 
      score: number; 
      factors: string[];
    }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { leadId, newScore: score, updatedAt: new Date().toISOString() };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['business-intelligence'] });
    },
  });

  const generateInsights = useMutation({
    mutationFn: async (leadId: string) => {
      // Simulate ML insight generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateMockLeadIntelligence(leadId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['business-intelligence'], (old: BusinessIntelligenceData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          lead_intelligence: {
            ...old.lead_intelligence,
            [Object.keys(old.lead_intelligence)[0]]: data
          }
        };
      });
    },
  });

  const optimizeFunnel = useMutation({
    mutationFn: async ({ stage, optimization }: { 
      stage: string; 
      optimization: string;
    }) => {
      // Simulate funnel optimization
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { stage, newConversionRate: Math.random() * 10 + 5, optimization };
    },
  });

  // Computed Analytics
  const computedAnalytics = useMemo(() => {
    if (!biData) return null;

    const totalLeads = Object.keys(biData.lead_intelligence).length;
    const avgScore = totalLeads > 0 
      ? Object.values(biData.lead_intelligence).reduce((sum, lead) => sum + lead.score.overall, 0) / totalLeads
      : 0;
    
    const hotLeads = Object.values(biData.lead_intelligence).filter(lead => lead.temperature.level === 'hot').length;
    const warmLeads = Object.values(biData.lead_intelligence).filter(lead => lead.temperature.level === 'warm').length;
    const coldLeads = Object.values(biData.lead_intelligence).filter(lead => lead.temperature.level === 'cold').length;

    const totalRevenue = biData.revenue_attribution.channels.reduce((sum, channel) => sum + channel.revenue, 0);
    const avgDealSize = totalLeads > 0 ? totalRevenue / totalLeads : 0;

    const atRiskCustomers = biData.churn_prediction.at_risk_customers.length;
    const highRiskCustomers = biData.churn_prediction.at_risk_customers.filter(c => c.risk_level === 'high').length;

    return {
      totalLeads,
      avgScore: Math.round(avgScore),
      hotLeads,
      warmLeads,
      coldLeads,
      totalRevenue,
      avgDealSize: Math.round(avgDealSize),
      atRiskCustomers,
      highRiskCustomers,
      dataQualityScore: biData.data_quality_score,
      lastUpdated: biData.last_updated,
    };
  }, [biData]);

  // Performance Insights
  const performanceInsights = useMemo(() => {
    if (!biData) return [];

    const insights = [];

    // Conversion Rate Insights
    const avgConversion = biData.ki_predictions.find(k => k.metric.includes('تحويل'))?.current_value || 3.2;
    if (avgConversion < 5) {
      insights.push({
        type: 'warning' as const,
        title: 'معدل التحويل منخفض',
        description: 'معدل التحويل الحالي أقل من 5%. يُنصح بمراجعة عملية التأهيل وتدريب فريق المبيعات.',
        impact: 'high',
        recommendations: [
          'تحسين عملية تأهيل العملاء المحتملين',
          'تدريب فريق المبيعات على مهارات البيع الاستشاري',
          'مراجعة محتوى العروض التقديمية'
        ],
      });
    }

    // Churn Risk Insights
    if (biData.churn_prediction.risk_score > 25) {
      insights.push({
        type: 'error' as const,
        title: 'مخاطر فقدان العملاء مرتفعة',
        description: `هناك ${biData.churn_prediction.at_risk_customers.length} عميل معرض للخطر`,
        impact: 'high',
        recommendations: [
          'تواصل فوري مع العملاء المعرضين للخطر',
          'مراجعة جودة الخدمة والدعم',
          'تقديم عروض ولاء للعملاء المميزين'
        ],
      });
    }

    // Funnel Optimization Insights
    if (biData.funnel_analysis.bottleneck.severity === 'high') {
      insights.push({
        type: 'info' as const,
        title: 'عنق زجاجة في مسار التحويل',
        description: `مرحلة "${biData.funnel_analysis.bottleneck.stage}" تسبب أعلى نسبة تسرب`,
        impact: 'medium',
        recommendations: biData.funnel_analysis.bottleneck.suggestions,
      });
    }

    return insights;
  }, [biData]);

  // Actions
  const refreshData = useCallback(async () => {
    await refetch();
    setProcessingQueue([]);
  }, [refetch]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const toggleRealTime = useCallback(() => {
    setRealTimeUpdates(prev => !prev);
  }, []);

  const processLeadIntelligence = useCallback(async (leadId: string) => {
    setProcessingQueue(prev => [...prev, leadId]);
    try {
      await generateInsights.mutateAsync(leadId);
    } finally {
      setProcessingQueue(prev => prev.filter(id => id !== leadId));
    }
  }, [generateInsights]);

  const optimizeConversionFunnel = useCallback(async (stage: string) => {
    await optimizeFunnel.mutateAsync({ 
      stage, 
      optimization: 'تحسين تلقائي' 
    });
  }, [optimizeFunnel]);

  const exportInsights = useCallback(async (format: 'pdf' | 'excel' | 'csv') => {
    if (!biData) return;
    
    // Simulate export process
    const data = {
      insights: performanceInsights,
      analytics: computedAnalytics,
      funnel: biData.funnel_analysis,
      predictions: biData.predictive_analytics,
    };
    
    console.log(`تصدير التحليلات بصيغة ${format.toUpperCase()}:`, data);
    return data;
  }, [biData, performanceInsights, computedAnalytics]);

  return {
    // Data
    biData,
    computedAnalytics,
    performanceInsights,
    isLoading,
    error,
    
    // State
    filters,
    realTimeUpdates,
    processingQueue,
    mlModelsStatus,
    
    // Actions
    refreshData,
    updateFilters,
    toggleRealTime,
    processLeadIntelligence,
    optimizeConversionFunnel,
    updateLeadScore: updateLeadScore.mutateAsync,
    exportInsights,
    
    // Computed
    totalLeads: computedAnalytics?.totalLeads || 0,
    avgScore: computedAnalytics?.avgScore || 0,
    hotLeads: computedAnalytics?.hotLeads || 0,
    warmLeads: computedAnalytics?.warmLeads || 0,
    coldLeads: computedAnalytics?.coldLeads || 0,
    totalRevenue: computedAnalytics?.totalRevenue || 0,
    avgDealSize: computedAnalytics?.avgDealSize || 0,
    atRiskCustomers: computedAnalytics?.atRiskCustomers || 0,
    highRiskCustomers: computedAnalytics?.highRiskCustomers || 0,
    dataQualityScore: computedAnalytics?.dataQualityScore || 0,
    lastUpdated: computedAnalytics?.lastUpdated || '',
    
    // Mutations State
    isProcessing: generateInsights.isPending || updateLeadScore.isPending || optimizeFunnel.isPending,
    processingError: generateInsights.error || updateLeadScore.error || optimizeFunnel.error,
  };
}

export default useBusinessIntelligence;