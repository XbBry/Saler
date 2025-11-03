// ==================== LEAD INTELLIGENCE TYPES ====================

export interface LeadIntelligence {
  id: string;
  leadId: string;
  score: LeadScore;
  temperature: LeadTemperature;
  engagement: EngagementMetrics;
  activity: LeadActivity;
  predictions: PredictiveInsights;
  insights: LeadInsights;
  createdAt: string;
  updatedAt: string;
}

export interface LeadScore {
  overall: number; // 0-100
  factors: ScoreFactor[];
  confidence: number; // 0-1
  trend: 'improving' | 'stable' | 'declining';
  lastCalculated: string;
}

export interface ScoreFactor {
  name: string;
  weight: number; // 0-1
  score: number; // 0-100
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface LeadTemperature {
  level: 'hot' | 'warm' | 'cold';
  percentage: number; // 0-100
  reason: string;
  lastUpdate: string;
  heatSource: HeatSource[];
}

export interface HeatSource {
  type: 'activity' | 'engagement' | 'timing' | 'social_proof' | 'personalization';
  value: number;
  description: string;
  timestamp: string;
}

export interface EngagementMetrics {
  email: EngagementData;
  calls: EngagementData;
  website: EngagementData;
  social: EngagementData;
  overall: EngagementSummary;
  realTime: RealTimeEngagement;
}

export interface EngagementData {
  opens: number;
  clicks: number;
  replies: number;
  forwards: number;
  lastActivity: string;
  engagementRate: number; // 0-100
  trend: 'up' | 'down' | 'stable';
}

export interface EngagementSummary {
  totalTouchpoints: number;
  averageResponseTime: number; // in hours
  preferredChannel: string;
  engagementQuality: number; // 0-100
  attentionSpan: number; // in minutes
}

export interface RealTimeEngagement {
  isOnline: boolean;
  currentActivity?: string;
  sessionDuration: number;
  lastSeen: string;
  pagesViewed: number;
  timeOnSite: number;
}

export interface LeadActivity {
  timeline: ActivityEvent[];
  recent: ActivityEvent[];
  patterns: ActivityPattern[];
  triggers: ActivityTrigger[];
  score: ActivityScore;
}

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  channel: string;
  description: string;
  timestamp: string;
  duration?: number;
  outcome?: string;
  leadScore?: number;
  temperature?: LeadTemperature['level'];
}

export type ActivityType = 
  | 'email_open' 
  | 'email_click' 
  | 'email_reply' 
  | 'call_made' 
  | 'call_received' 
  | 'website_visit' 
  | 'form_submission' 
  | 'download' 
  | 'social_engagement'
  | 'meeting_scheduled'
  | 'proposal_sent'
  | 'contract_signed';

export interface ActivityPattern {
  type: 'frequency' | 'timing' | 'channel_preference' | 'response_pattern';
  pattern: string;
  confidence: number; // 0-1
  insight: string;
  recommendation: string;
}

export interface ActivityTrigger {
  event: string;
  condition: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  status: 'active' | 'paused' | 'completed';
}

export interface ActivityScore {
  frequency: number; // 0-100
  quality: number; // 0-100
  recency: number; // 0-100
  consistency: number; // 0-100
  responsiveness: number; // 0-100
}

export interface PredictiveInsights {
  conversion_probability: number; // 0-100
  time_to_close: number; // in days
  deal_size: DealSizeEstimate;
  next_action: NextActionRecommendation;
  risk_factors: RiskFactor[];
  opportunities: Opportunity[];
  churn_risk: number; // 0-100
}

export interface DealSizeEstimate {
  minimum: number;
  maximum: number;
  most_likely: number;
  confidence: number; // 0-1
  factors: string[];
}

export interface NextActionRecommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  channel: string;
  timing: string;
  reason: string;
  success_probability: number; // 0-100
}

export interface RiskFactor {
  factor: string;
  severity: 'high' | 'medium' | 'low';
  probability: number; // 0-1
  impact: number; // 0-100
  mitigation: string;
}

export interface Opportunity {
  type: string;
  description: string;
  value: number;
  probability: number; // 0-100
  timeframe: string;
  requirements: string[];
}

export interface LeadInsights {
  personality_insights: PersonalityInsights;
  communication_preferences: CommunicationPreferences;
  buying_signals: BuyingSignals;
  objections: ObjectionInsights;
  competitor_analysis: CompetitorAnalysis;
}

export interface PersonalityInsights {
  type: string; // analytical, driver, expressive, amiable
  traits: string[];
  motivations: string[];
  decision_style: string;
  communication_style: string;
}

export interface CommunicationPreferences {
  preferred_channels: string[];
  best_contact_times: string[];
  response_speed: string;
  tone_preference: 'formal' | 'casual' | 'mixed';
  language_preference: string[];
}

export interface BuyingSignals {
  signals: BuyingSignal[];
  urgency_level: number; // 0-100
  decision_stage: string;
  buying_readiness: number; // 0-100
}

export interface BuyingSignal {
  signal: string;
  strength: number; // 0-100
  frequency: 'high' | 'medium' | 'low';
  significance: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface ObjectionInsights {
  likely_objections: Objection[];
  overcome_strategies: string[];
  success_rate: number; // 0-100
}

export interface Objection {
  objection: string;
  frequency: number; // 0-100
  impact: number; // 0-100
  overcome_strategy: string;
}

export interface CompetitorAnalysis {
  competing_companies: string[];
  competitive_advantages: string[];
  switching_factors: string[];
  market_position: string;
}

// ==================== DASHBOARD ENHANCEMENT TYPES ====================

export interface DashboardIntelligence {
  overview: DashboardOverview;
  realTime: RealTimeDashboard;
  widgets: DashboardWidget[];
  alerts: AlertConfig[];
  customization: DashboardCustomization;
}

export interface DashboardOverview {
  totalLeads: number;
  newLeads: number;
  hotLeads: number;
  conversionRate: number;
  averageDealSize: number;
  timeToClose: number;
  pipelineHealth: PipelineHealth;
  performance: PerformanceMetrics;
}

export interface PipelineHealth {
  score: number; // 0-100
  stages: PipelineStage[];
  bottlenecks: Bottleneck[];
  recommendations: string[];
}

export interface PipelineStage {
  name: string;
  count: number;
  conversionRate: number;
  averageTime: number; // in days
  healthScore: number; // 0-100
}

export interface Bottleneck {
  stage: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  impact: number; // 0-100
  solution: string;
}

export interface PerformanceMetrics {
  leadsPerDay: number;
  responseTime: number; // in minutes
  followUpRate: number; // 0-100
  closeRate: number; // 0-100
  customerSatisfaction: number; // 0-100
}

export interface RealTimeDashboard {
  activeUsers: number;
  liveActivities: LiveActivity[];
  alerts: LiveAlert[];
  notifications: NotificationCount;
}

export interface LiveActivity {
  id: string;
  type: string;
  lead: string;
  timestamp: string;
  description: string;
}

export interface LiveAlert {
  id: string;
  type: 'hot_lead' | 'activity' | 'deadline' | 'opportunity';
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  actionRequired: boolean;
}

export interface NotificationCount {
  unread: number;
  urgent: number;
  opportunities: number;
  risks: number;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
  visible: boolean;
  data: any;
}

export type WidgetType = 
  | 'lead_score_chart'
  | 'temperature_gauge'
  | 'activity_timeline'
  | 'conversion_funnel'
  | 'performance_metrics'
  | 'predictive_insights'
  | 'real_time_feed'
  | 'conversion_predictions';

export interface WidgetConfig {
  refreshInterval?: number;
  filters?: Record<string, any>;
  chartType?: string;
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark' | 'auto';
}

export interface AlertConfig {
  id: string;
  name: string;
  conditions: AlertCondition[];
  actions: AlertAction[];
  isActive: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '=' | '!=' | '>=' | '<=';
  value: number | string;
  timeframe: string;
}

export interface AlertAction {
  type: 'email' | 'sms' | 'push' | 'slack' | 'webhook';
  recipient: string;
  template: string;
}

export interface DashboardCustomization {
  layout: 'grid' | 'list' | 'cards';
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'comfortable' | 'spacious';
  animations: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  savedFilters: SavedFilter[];
}

export interface SavedFilter {
  id: string;
  name: string;
  description: string;
  conditions: Record<string, any>;
  isDefault: boolean;
  createdAt: string;
}

// ==================== ENHANCED COMPONENT PROPS ====================

export interface LeadCardProps {
  lead: LeadWithIntelligence;
  showScore?: boolean;
  showTemperature?: boolean;
  showActivity?: boolean;
  showPredictions?: boolean;
  compact?: boolean;
  interactive?: boolean;
  onClick?: (lead: LeadWithIntelligence) => void;
  onAction?: (action: string, lead: LeadWithIntelligence) => void;
}

export interface LeadWithIntelligence extends Lead {
  intelligence: LeadIntelligence;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  customFields: Record<string, any>;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  owner: string;
  value?: number;
  stage: string;
}

export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface LeadActivityTimelineProps {
  leadId: string;
  activities: ActivityEvent[];
  showPredictions?: boolean;
  interactive?: boolean;
  maxItems?: number;
}

export interface LeadScoreVisualizationProps {
  score: LeadScore;
  temperature: LeadTemperature;
  predictions: PredictiveInsights;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  interactive?: boolean;
}

export interface QuickActionsDashboardProps {
  user: string;
  permissions: string[];
  actions: QuickAction[];
  context: 'dashboard' | 'lead_detail' | 'list_view';
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  shortcut?: string;
  category: string;
  priority: number;
}

// ==================== PERFORMANCE TYPES ====================

export interface PerformanceConfig {
  virtualScrolling: boolean;
  chunkSize: number;
  lazyLoading: boolean;
  cacheSize: number;
  maxItems: number;
  realTimeSync: boolean;
  optimisticUpdates: boolean;
  backgroundSync: boolean;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  progress?: number;
  skeleton?: boolean;
}

export interface AccessibilityConfig {
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  focusManagement: boolean;
  ariaLabels: boolean;
}