/**
 * Advanced AI Lead Scoring Hook
 * ============================
 * 
 * React Hook متقدم لإدارة التقييم الذكي للعملاء المحتملين
 * يتضمن real-time updates، caching، A/B testing، وتحليلات الأداء
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Activity
} from 'lucide-react';

// ==================== TYPES AND INTERFACES ====================

export interface ScoringFeatures {
  // Behavioral Features
  website_visits: number;
  page_views: number;
  session_duration: number;
  email_opens: number;
  email_clicks: number;
  form_submissions: number;
  content_downloads: number;
  
  // Demographic Features
  company_size: number;
  industry: string;
  job_title: string;
  country: string;
  revenue_range: string;
  
  // Engagement Features
  response_rate: number;
  avg_response_time: number;
  call_frequency: number;
  meeting_attendance: number;
  demo_requests: number;
  
  // Temporal Features
  days_since_creation: number;
  last_activity_days: number;
  activity_frequency: number;
  engagement_recency: number;
  
  // Interaction Features
  social_media_activity: number;
  referral_count: number;
  previous_conversions: number;
  campaign_engagement: number;
  
  // Quality Features
  source_quality_score: number;
  contact_completeness: number;
  intent_signals: number;
  buying_signals: number;
}

export interface ScoringResult {
  lead_id: string;
  overall_score: number;
  probability: number;
  confidence: number;
  
  // Component scores
  behavioral_score: number;
  demographic_score: number;
  engagement_score: number;
  temporal_score: number;
  interaction_score: number;
  quality_score: number;
  
  // Insights
  key_factors: string[];
  risk_factors: Array<{
    factor: string;
    severity: 'high' | 'medium' | 'low';
    probability: number;
    impact: number;
    mitigation: string;
  }>;
  opportunities: Array<{
    type: string;
    description: string;
    value: number;
    probability: number;
    timeframe: string;
    requirements: string[];
  }>;
  recommendations: string[];
  
  // Model details
  model_version: string;
  features_used: string[];
  scoring_strategy: string;
  timestamp: string;
  
  // A/B Testing
  variant?: string;
  experiment_id?: string;
}

export interface ScoringOptions {
  include_insights?: boolean;
  force_recalculation?: boolean;
  experiment_id?: string;
  custom_features?: Partial<ScoringFeatures>;
  cache_ttl?: number; // Time to live in milliseconds
}

export interface ScoringAnalytics {
  total_leads_scored: number;
  avg_score: number;
  score_distribution: {
    high: number; // 70-100
    medium: number; // 40-69
    low: number; // 0-39
  };
  top_performing_factors: Array<{
    factor: string;
    importance: number;
    impact_on_conversion: number;
  }>;
  trends: Array<{
    date: string;
    avg_score: number;
    total_leads: number;
    conversion_rate: number;
  }>;
  model_performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    last_updated: string;
  };
}

export interface ABTestResult {
  experiment_id: string;
  variant: string;
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  total_value: number;
  average_value: number;
  revenue_per_lead: number;
  confidence_interval: [number, number];
  statistical_significance: boolean;
  p_value: number;
}

export interface UseAdvancedScoringReturn {
  // Data
  scoringResult: ScoringResult | null;
  analytics: ScoringAnalytics | null;
  abTestResults: ABTestResult[];
  
  // States
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isComputing: boolean;
  
  // Actions
  scoreLead: (leadId: string, options?: ScoringOptions) => Promise<void>;
  batchScoreLeads: (leadIds: string[], options?: ScoringOptions) => Promise<void>;
  refreshScore: (leadId: string) => Promise<void>;
  
  // Utilities
  getScoreColor: (score: number) => string;
  getScoreLabel: (score: number) => string;
  getConfidenceLevel: (confidence: number) => 'high' | 'medium' | 'low';
  
  // Analytics
  analytics: {
    refresh: () => void;
    isLoading: boolean;
  };
  
  // Performance
  performance: {
    avg_response_time: number;
    cache_hit_rate: number;
    total_requests: number;
    error_rate: number;
  };
  
  // Real-time updates
  subscribe: (leadId: string, callback: (result: ScoringResult) => void) => () => void;
}

// ==================== CUSTOM HOOK ====================

export const useAdvancedScoring = (
  workspaceId: string,
  enableRealTime: boolean = true
): UseAdvancedScoringReturn => {
  // State
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [analytics, setAnalytics] = useState<ScoringAnalytics | null>(null);
  const [abTestResults, setAbTestResults] = useState<ABTestResult[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avg_response_time: 0,
    cache_hit_rate: 0,
    total_requests: 0,
    error_rate: 0
  });
  
  // Refs for performance tracking
  const requestStartTime = useRef<number>(0);
  const cache = useRef<Map<string, { data: ScoringResult; timestamp: number }>>(new Map());
  const subscribers = useRef<Map<string, Set<(result: ScoringResult) => void>>>(new Map());
  
  // Query Client for caching
  const queryClient = useQueryClient();
  
  // ==================== API FUNCTIONS ====================
  
  const scoreLeadAPI = async (
    leadId: string, 
    options: ScoringOptions = {}
  ): Promise<ScoringResult> => {
    const response = await fetch('/api/ai/scoring/score/single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        lead_id: leadId,
        ...options
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Scoring failed');
    }
    
    return result.data;
  };
  
  const batchScoreLeadsAPI = async (
    leadIds: string[],
    options: ScoringOptions = {}
  ): Promise<ScoringResult[]> => {
    const response = await fetch('/api/ai/scoring/score/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        leads: leadIds.map(id => ({ lead_id: id })),
        ...options
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Batch scoring failed');
    }
    
    return result.data || [];
  };
  
  const getAnalyticsAPI = async (): Promise<ScoringAnalytics> => {
    const response = await fetch('/api/ai/scoring/analytics/overview', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch analytics');
    }
    
    return result.data;
  };
  
  const getABTestResultsAPI = async (): Promise<ABTestResult[]> => {
    const response = await fetch('/api/ai/scoring/abtest/results', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch A/B test results');
    }
    
    return Object.entries(result.data).flatMap(([experiment_id, variants]: [string, any]) =>
      Object.entries(variants).map(([variant, data]: [string, any]) => ({
        experiment_id,
        variant,
        ...data
      }))
    );
  };
  
  // ==================== MUTATIONS ====================
  
  const scoreLeadMutation = useMutation({
    mutationFn: ({ leadId, options }: { leadId: string; options?: ScoringOptions }) =>
      scoreLeadAPI(leadId, options),
    onMutate: () => {
      requestStartTime.current = Date.now();
      setIsComputing(true);
    },
    onSuccess: (result) => {
      // Cache the result
      const cacheKey = `${result.lead_id}_${result.model_version}`;
      cache.current.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      setScoringResult(result);
      
      // Update performance metrics
      const responseTime = Date.now() - requestStartTime.current;
      setPerformanceMetrics(prev => ({
        ...prev,
        avg_response_time: (prev.avg_response_time * prev.total_requests + responseTime) / (prev.total_requests + 1),
        total_requests: prev.total_requests + 1
      }));
      
      // Notify subscribers
      const leadSubscribers = subscribers.current.get(result.lead_id);
      if (leadSubscribers) {
        leadSubscribers.forEach(callback => callback(result));
      }
    },
    onError: (error) => {
      console.error('Lead scoring failed:', error);
      setPerformanceMetrics(prev => ({
        ...prev,
        error_rate: (prev.error_rate * prev.total_requests + 1) / (prev.total_requests + 1),
        total_requests: prev.total_requests + 1
      }));
    },
    onSettled: () => {
      setIsComputing(false);
    }
  });
  
  const batchScoreLeadsMutation = useMutation({
    mutationFn: ({ leadIds, options }: { leadIds: string[]; options?: ScoringOptions }) =>
      batchScoreLeadsAPI(leadIds, options),
    onSuccess: (results) => {
      // Cache all results
      results.forEach(result => {
        const cacheKey = `${result.lead_id}_${result.model_version}`;
        cache.current.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      });
      
      // Invalidate analytics queries
      queryClient.invalidateQueries({ queryKey: ['scoring-analytics'] });
    }
  });
  
  const analyticsQuery = useQuery({
    queryKey: ['scoring-analytics', workspaceId],
    queryFn: getAnalyticsAPI,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000 // Consider stale after 10 seconds
  });
  
  const abTestQuery = useQuery({
    queryKey: ['ab-test-results', workspaceId],
    queryFn: getABTestResultsAPI,
    refetchInterval: 60000 // Refresh every minute
  });
  
  // ==================== ACTIONS ====================
  
  const scoreLead = useCallback(async (leadId: string, options: ScoringOptions = {}) => {
    // Check cache first
    const cacheKey = `${leadId}_${options.experiment_id || 'default'}`;
    const cached = cache.current.get(cacheKey);
    
    if (cached && !options.force_recalculation) {
      const age = Date.now() - cached.timestamp;
      const ttl = options.cache_ttl || 300000; // 5 minutes default
      
      if (age < ttl) {
        setScoringResult(cached.data);
        
        // Update cache hit rate
        setPerformanceMetrics(prev => ({
          ...prev,
          cache_hit_rate: (prev.cache_hit_rate * prev.total_requests + 1) / (prev.total_requests + 1),
          total_requests: prev.total_requests + 1
        }));
        
        return;
      }
    }
    
    // Cache miss or force recalculation
    setPerformanceMetrics(prev => ({
      ...prev,
      cache_hit_rate: (prev.cache_hit_rate * prev.total_requests) / (prev.total_requests + 1),
      total_requests: prev.total_requests + 1
    }));
    
    await scoreLeadMutation.mutateAsync({ leadId, options });
  }, [scoreLeadMutation]);
  
  const batchScoreLeads = useCallback(async (leadIds: string[], options: ScoringOptions = {}) => {
    await batchScoreLeadsMutation.mutateAsync({ leadIds, options });
  }, [batchScoreLeadsMutation]);
  
  const refreshScore = useCallback(async (leadId: string) => {
    await scoreLead(leadId, { force_recalculation: true });
  }, [scoreLead]);
  
  // ==================== REAL-TIME UPDATES ====================
  
  const subscribe = useCallback((leadId: string, callback: (result: ScoringResult) => void) => {
    if (!subscribers.current.has(leadId)) {
      subscribers.current.set(leadId, new Set());
    }
    
    subscribers.current.get(leadId)!.add(callback);
    
    // Cleanup function
    return () => {
      const leadSubscribers = subscribers.current.get(leadId);
      if (leadSubscribers) {
        leadSubscribers.delete(callback);
        if (leadSubscribers.size === 0) {
          subscribers.current.delete(leadId);
        }
      }
    };
  }, []);
  
  // ==================== UTILITY FUNCTIONS ====================
  
  const getScoreColor = useCallback((score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, []);
  
  const getScoreLabel = useCallback((score: number): string => {
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد';
    if (score >= 40) return 'مقبول';
    return 'يحتاج تحسين';
  }, []);
  
  const getConfidenceLevel = useCallback((confidence: number): 'high' | 'medium' | 'low' => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }, []);
  
  // ==================== EFFECTS ====================
  
  // Update analytics when query data changes
  useEffect(() => {
    if (analyticsQuery.data) {
      setAnalytics(analyticsQuery.data);
    }
  }, [analyticsQuery.data]);
  
  // Update A/B test results when query data changes
  useEffect(() => {
    if (abTestQuery.data) {
      setAbTestResults(abTestQuery.data);
    }
  }, [abTestQuery.data]);
  
  // Real-time WebSocket connection for live updates
  useEffect(() => {
    if (!enableRealTime) return;
    
    const ws = new WebSocket(`wss://api.example.com/ws/scoring/${workspaceId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'score_update') {
        const result: ScoringResult = data.payload;
        
        // Update cache
        const cacheKey = `${result.lead_id}_${result.model_version}`;
        cache.current.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        // Update state if this is the current lead
        if (scoringResult?.lead_id === result.lead_id) {
          setScoringResult(result);
        }
        
        // Notify subscribers
        const leadSubscribers = subscribers.current.get(result.lead_id);
        if (leadSubscribers) {
          leadSubscribers.forEach(callback => callback(result));
        }
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
  }, [enableRealTime, workspaceId, scoringResult?.lead_id]);
  
  // ==================== MEMOIZED VALUES ====================
  
  const derivedStates = useMemo(() => ({
    isLoading: scoreLeadMutation.isPending || batchScoreLeadsMutation.isPending,
    isError: scoreLeadMutation.isError || batchScoreLeadsMutation.isError || analyticsQuery.isError || abTestQuery.isError,
    error: scoreLeadMutation.error?.message || batchScoreLeadsMutation.error?.message || analyticsQuery.error?.message || abTestQuery.error?.message || null
  }), [
    scoreLeadMutation.isPending,
    batchScoreLeadsMutation.isPending,
    scoreLeadMutation.isError,
    batchScoreLeadsMutation.isError,
    analyticsQuery.isError,
    abTestQuery.isError,
    scoreLeadMutation.error,
    batchScoreLeadsMutation.error,
    analyticsQuery.error,
    abTestQuery.error
  ]);
  
  // ==================== RETURN ====================
  
  return {
    // Data
    scoringResult,
    analytics,
    abTestResults,
    
    // States
    ...derivedStates,
    isComputing,
    
    // Actions
    scoreLead,
    batchScoreLeads,
    refreshScore,
    
    // Utilities
    getScoreColor,
    getScoreLabel,
    getConfidenceLevel,
    
    // Analytics
    analytics: {
      refresh: analyticsQuery.refetch,
      isLoading: analyticsQuery.isLoading
    },
    
    // Performance
    performance: performanceMetrics,
    
    // Real-time updates
    subscribe
  };
};

// ==================== SPECIALIZED HOOKS ====================

/**
 * Hook for scoring a single lead with real-time updates
 */
export const useLeadScoring = (
  leadId: string,
  workspaceId: string,
  options: ScoringOptions = {}
) => {
  const {
    scoringResult,
    isLoading,
    isError,
    error,
    isComputing,
    scoreLead,
    refreshScore,
    getScoreColor,
    getScoreLabel,
    getConfidenceLevel,
    subscribe
  } = useAdvancedScoring(workspaceId);
  
  // Auto-score on leadId change
  useEffect(() => {
    if (leadId) {
      scoreLead(leadId, options);
    }
  }, [leadId, scoreLead]);
  
  // Set up real-time subscription
  useEffect(() => {
    if (leadId) {
      const unsubscribe = subscribe(leadId, (result) => {
        // Handle real-time updates
        console.log('Real-time score update:', result);
      });
      
      return unsubscribe;
    }
  }, [leadId, subscribe]);
  
  return {
    scoringResult,
    isLoading,
    isError,
    error,
    isComputing,
    scoreLead: () => scoreLead(leadId, options),
    refreshScore: () => refreshScore(leadId),
    getScoreColor,
    getScoreLabel,
    getConfidenceLevel
  };
};

/**
 * Hook for batch scoring operations
 */
export const useBatchScoring = (workspaceId: string) => {
  const {
    batchScoreLeads,
    isLoading,
    isError,
    error,
    performance
  } = useAdvancedScoring(workspaceId);
  
  const batchScore = useCallback(async (
    leadIds: string[], 
    options: ScoringOptions = {}
  ) => {
    // Process in chunks to avoid overwhelming the server
    const chunkSize = 50;
    const results = [];
    
    for (let i = 0; i < leadIds.length; i += chunkSize) {
      const chunk = leadIds.slice(i, i + chunkSize);
      const chunkResults = await batchScoreLeads(chunk, options);
      results.push(...chunkResults);
    }
    
    return results;
  }, [batchScoreLeads]);
  
  return {
    batchScore,
    isLoading,
    isError,
    error,
    performance
  };
};

/**
 * Hook for scoring analytics and insights
 */
export const useScoringAnalytics = (workspaceId: string) => {
  const {
    analytics,
    abTestResults,
    performance,
    isLoading,
    isError,
    error,
    analytics: { refresh }
  } = useAdvancedScoring(workspaceId);
  
  const insights = useMemo(() => {
    if (!analytics) return null;
    
    return {
      topFactors: analytics.top_performing_factors.slice(0, 5),
      recentTrend: analytics.trends.slice(-7), // Last 7 days
      scoreDistribution: analytics.score_distribution,
      modelAccuracy: analytics.model_performance.accuracy
    };
  }, [analytics]);
  
  return {
    analytics,
    abTestResults,
    insights,
    performance,
    isLoading,
    isError,
    error,
    refresh
  };
};

export default useAdvancedScoring;
