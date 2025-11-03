/**
 * AI Lead Scoring - React Components Index
 * ========================================
 * 
 * الملف الرئيسي لتهيئة وتصدير جميع مكونات التقييم الذكي
 * يتضمن التسجيل الآلي وتحديث القوائم والمكونات
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import all scoring components
import { 
  ScoringDashboard, 
  ScoreCard, 
  OverviewTab, 
  InsightsTab, 
  TrendsTab, 
  ABTestsTab 
} from './ScoringDashboard';

import {
  LeadScoreCard,
  ScoreGauge,
  ComponentScoresChart,
  ScoreDistributionChart,
  ConfidenceIndicator,
  ScoreInsightsPanel,
  ScoringLoadingCard,
  ScoringErrorCard
} from './AIScoringComponents';

// Import hooks
import { 
  useAdvancedScoring, 
  useLeadScoring, 
  useBatchScoring, 
  useScoringAnalytics 
} from '../../hooks/useAdvancedScoring';

// ==================== LEGACY COMPONENTS (Backward Compatibility) ====================

export { default as LeadCard } from './LeadCard';
export { default as LeadActivityTimeline } from './LeadActivityTimeline';
export { default as LeadScoreVisualization } from './LeadScoreVisualization';

// Re-export legacy types
export type {
  LeadWithIntelligence,
  LeadIntelligence,
  LeadScore,
  LeadTemperature,
  EngagementMetrics,
  PredictiveInsights,
  LeadCardProps,
  LeadActivityTimelineProps,
  LeadScoreVisualizationProps,
} from '../../types/lead-intelligence';

// ==================== NEW AI SCORING COMPONENTS ====================

export {
  // Main dashboard
  ScoringDashboard,
  
  // Individual components
  LeadScoreCard,
  ScoreGauge,
  ComponentScoresChart,
  ScoreDistributionChart,
  ConfidenceIndicator,
  ScoreInsightsPanel,
  
  // Loading and error states
  ScoringLoadingCard,
  ScoringErrorCard,
  
  // Dashboard tabs
  OverviewTab,
  InsightsTab,
  TrendsTab,
  ABTestsTab
};

// ==================== HOOKS ====================

export {
  useAdvancedScoring,
  useLeadScoring,
  useBatchScoring,
  useScoringAnalytics
};

// ==================== REACT QUERY SETUP ====================

// Create a client for caching
export const scoringQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: 'always'
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
});

// ==================== PROVIDER COMPONENT ====================

interface ScoringProviderProps {
  children: React.ReactNode;
  workspaceId: string;
  enableRealTime?: boolean;
  enableAnalytics?: boolean;
  enableABTesting?: boolean;
  config?: {
    cacheTimeout?: number;
    batchSize?: number;
    maxRetries?: number;
    enableDevTools?: boolean;
  };
}

export const ScoringProvider: React.FC<ScoringProviderProps> = ({
  children,
  workspaceId,
  enableRealTime = true,
  enableAnalytics = true,
  enableABTesting = true,
  config = {}
}) => {
  const {
    cacheTimeout = 300000, // 5 minutes
    batchSize = 50,
    maxRetries = 3,
    enableDevTools = process.env.NODE_ENV === 'development'
  } = config;

  return (
    <QueryClientProvider client={scoringQueryClient}>
      <div 
        id="ai-scoring-provider" 
        data-workspace-id={workspaceId}
        data-features={`real-time:${enableRealTime},analytics:${enableAnalytics},ab-testing:${enableABTesting}`}
      >
        {children}
      </div>
    </QueryClientProvider>
  );
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Register scoring components globally for debugging
 */
export const registerScoringComponents = () => {
  if (typeof window !== 'undefined') {
    (window as any).ScoringComponents = {
      ScoringDashboard,
      LeadScoreCard,
      ScoreGauge,
      ComponentScoresChart,
      ScoreDistributionChart,
      ConfidenceIndicator,
      ScoreInsightsPanel
    };
    (window as any).ScoringHooks = {
      useAdvancedScoring,
      useLeadScoring,
      useBatchScoring,
      useScoringAnalytics
    };
  }
};

/**
 * Initialize scoring system
 */
export const initializeScoringSystem = async (config?: {
  workspaceId: string;
  userId?: string;
  apiKey?: string;
  enableRealTime?: boolean;
}) => {
  try {
    registerScoringComponents();
    
    if (config?.enableRealTime) {
      console.log('✅ Real-time scoring initialized');
    }
    
    console.log('✅ AI Scoring System initialized successfully');
    
    return {
      success: true,
      components: {
        ScoringDashboard,
        LeadScoreCard,
        ScoreGauge,
        ComponentScoresChart
      },
      hooks: {
        useAdvancedScoring,
        useLeadScoring,
        useBatchScoring,
        useScoringAnalytics
      }
    };
  } catch (error) {
    console.error('❌ Failed to initialize scoring system:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Check scoring system health
 */
export const checkScoringHealth = async () => {
  try {
    const response = await fetch('/api/ai/scoring/health');
    const health = await response.json();
    
    return {
      status: health.status,
      modelsLoaded: health.models_loaded,
      version: health.version,
      metrics: health.metrics
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Health check failed'
    };
  }
};

/**
 * Batch score multiple leads
 */
export const batchScoreLeads = async (
  leadIds: string[],
  workspaceId: string,
  options?: {
    experiment_id?: string;
    priority?: 'low' | 'normal' | 'high';
  }
) => {
  try {
    const response = await fetch('/api/ai/scoring/score/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        leads: leadIds.map(id => ({ lead_id: id })),
        workspace_id: workspaceId,
        ...options
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Batch scoring failed');
    }
    
    return result;
  } catch (error) {
    console.error('Batch scoring failed:', error);
    throw error;
  }
};

// ==================== DEFAULT EXPORT ====================

export default ScoringProvider;

// ==================== AUTO-INITIALIZATION ====================

// Register components on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerScoringComponents);
  } else {
    registerScoringComponents();
  }
}