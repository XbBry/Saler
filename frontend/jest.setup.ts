import '@testing-library/jest-dom';

// إعداد عام لبيئة الاختبار
beforeEach(() => {
  // تنظيف جميع DOM elements
  document.body.innerHTML = '';
  
  // إعادة تعيين localStorage
  localStorage.clear();
  
  // إعادة تعيين sessionStorage  
  sessionStorage.clear();
  
  // إعادة تعيين mocks
  jest.clearAllMocks();
});

// إعداد mocks للـ icons
jest.mock('lucide-react', () => ({
  TrendingUp: (props: any) => <div data-testid="trending-up" {...props} />,
  TrendingDown: (props: any) => <div data-testid="trending-down" {...props} />,
  Minus: (props: any) => <div data-testid="minus" {...props} />,
  Thermometer: (props: any) => <div data-testid="thermometer" {...props} />,
  Activity: (props: any) => <div data-testid="activity" {...props} />,
  Target: (props: any) => <div data-testid="target" {...props} />,
  Users: (props: any) => <div data-testid="users" {...props} />,
  Phone: (props: any) => <div data-testid="phone" {...props} />,
  Mail: (props: any) => <div data-testid="mail" {...props} />,
  MessageSquare: (props: any) => <div data-testid="message-square" {...props} />,
  Calendar: (props: any) => <div data-testid="calendar" {...props} />,
  DollarSign: (props: any) => <div data-testid="dollar-sign" {...props} />,
  Clock: (props: any) => <div data-testid="clock" {...props} />,
  Star: (props: any) => <div data-testid="star" {...props} />,
  Award: (props: any) => <div data-testid="award" {...props} />,
  AlertTriangle: (props: any) => <div data-testid="alert-triangle" {...props} />,
  CheckCircle: (props: any) => <div data-testid="check-circle" {...props} />,
  Timer: (props: any) => <div data-testid="timer" {...props} />,
  Eye: (props: any) => <div data-testid="eye" {...props} />,
  MoreHorizontal: (props: any) => <div data-testid="more-horizontal" {...props} />,
  RefreshCw: (props: any) => <div data-testid="refresh-cw" {...props} />,
  Download: (props: any) => <div data-testid="download" {...props} />,
  Bell: (props: any) => <div data-testid="bell" {...props} />,
  Settings: (props: any) => <div data-testid="settings" {...props} />,
  Search: (props: any) => <div data-testid="search" {...props} />,
  Plus: (props: any) => <div data-testid="plus" {...props} />,
  Filter: (props: any) => <div data-testid="filter" {...props} />,
  Grid3X3: (props: any) => <div data-testid="grid-3x3" {...props} />,
  List: (props: any) => <div data-testid="list" {...props} />,
  BarChart3: (props: any) => <div data-testid="bar-chart-3" {...props} />,
  PieChart: (props: any) => <div data-testid="pie-chart" {...props} />,
  Sun: (props: any) => <div data-testid="sun" {...props} />,
  Moon: (props: any) => <div data-testid="moon" {...props} />,
  Monitor: (props: any) => <div data-testid="monitor" {...props} />,
  Zap: (props: any) => <div data-testid="zap" {...props} />,
  Brain: (props: any) => <div data-testid="brain" {...props} />,
  Play: (props: any) => <div data-testid="play" {...props} />,
  Pause: (props: any) => <div data-testid="pause" {...props} />,
  Maximize2: (props: any) => <div data-testid="maximize-2" {...props} />,
  Minimize2: (props: any) => <div data-testid="minimize-2" {...props} />,
  X: (props: any) => <div data-testid="x" {...props} />,
  ArrowUpRight: (props: any) => <div data-testid="arrow-up-right" {...props} />,
  ArrowDownRight: (props: any) => <div data-testid="arrow-down-right" {...props} />,
  Copy: (props: any) => <div data-testid="copy" {...props} />,
  Trash2: (props: any) => <div data-testid="trash-2" {...props} />,
  Edit: (props: any) => <div data-testid="edit" {...props} />,
  Share: (props: any) => <div data-testid="share" {...props} />,
  Download: (props: any) => <div data-testid="download" {...props} />,
}));

// إعداد mock لـ date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => '2023-12-01'),
  formatDistanceToNow: jest.fn(() => 'منذ يوم واحد'),
  subDays: jest.fn(() => new Date()),
  subWeeks: jest.fn(() => new Date()),
  subMonths: jest.fn(() => new Date()),
  subYears: jest.fn(() => new Date()),
}));

// إعداد mock لـ date-fns/locale
jest.mock('date-fns/locale', () => ({
  ar: jest.fn(),
}));

// إعداد mock لـ framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// إعداد mock لـ next/router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
}));

// إعداد mocks للـ APIs
jest.mock('../src/lib/api', () => ({
  analyticsApi: {
    getDashboard: jest.fn(() => Promise.resolve({})),
  },
}));

// إعداد mocks للـ lead-intelligence
jest.mock('../src/lib/lead-intelligence', () => ({
  formatScore: jest.fn((score: number) => score.toString()),
  formatTemperature: jest.fn((level: string) => level),
  getTemperatureColor: jest.fn(() => 'text-blue-500'),
  getScoreColor: jest.fn(() => 'text-green-500'),
  getPriorityLevel: jest.fn(() => 'medium'),
  LeadScoringEngine: {
    calculateScore: jest.fn(() => ({
      overall: 85,
      trend: 'stable',
    })),
  },
  TemperatureEngine: {
    calculateTemperature: jest.fn(() => ({
      level: 'warm',
      percentage: 65,
      heatSources: [],
    })),
  },
  PredictiveEngine: {
    generateInsights: jest.fn(() => ({
      conversion_probability: 75,
      time_to_close: '14 days',
      next_action: {
        action: 'Follow up with email',
        timing: '2 hours',
        channel: 'email',
        success_probability: 85,
      },
    })),
  },
  RealTimeTracker: {
    subscribe: jest.fn(),
  },
}));

// إعداد mock للنماذج والـ UI components
jest.mock('../src/components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('../src/components/ui/Card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('../src/components/ui/Input', () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}));

// إعداد mocks للـ React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: {},
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useInfiniteQuery: jest.fn(() => ({
    data: { pages: [] },
    isLoading: false,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}));

// إعداد mock للـ hooks
jest.mock('../src/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: '1', name: 'Test User' },
    isAuthenticated: true,
  })),
}));

// إعداد globals للـ window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// إعداد mock للـ ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// إعداد مولد البيانات الوهمية للاختبارات
export const createMockLead = (overrides = {}) => ({
  id: '1',
  firstName: 'أحمد',
  lastName: 'محمد',
  email: 'ahmed@example.com',
  phone: '+966501234567',
  company: 'شركة التقنية المتقدمة',
  position: 'مدير تقنية المعلومات',
  source: 'الموقع الإلكتروني',
  status: 'qualified' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  owner: 'current-user',
  value: 150000,
  stage: 'proposal' as const,
  priority: 'high' as const,
  tags: ['مستهدف', 'تقني'],
  customFields: { budget: 200000, timeline: '3 months' },
  intelligence: {
    id: 'intel-1',
    leadId: '1',
    score: { overall: 85, trend: 'stable' },
    temperature: { level: 'warm', percentage: 65, heatSources: [] },
    engagement: {
      email: { opens: 45, clicks: 23, replies: 8, forwards: 2, lastActivity: new Date().toISOString(), engagementRate: 78, trend: 'up' },
      calls: { opens: 0, clicks: 0, replies: 0, forwards: 0, lastActivity: new Date().toISOString(), engagementRate: 0, trend: 'stable' },
      website: { opens: 0, clicks: 0, replies: 0, forwards: 0, lastActivity: new Date().toISOString(), engagementRate: 0, trend: 'stable' },
      social: { opens: 0, clicks: 0, replies: 0, forwards: 0, lastActivity: new Date().toISOString(), engagementRate: 0, trend: 'stable' },
      overall: {
        totalTouchpoints: 78,
        averageResponseTime: 2.5,
        preferredChannel: 'email',
        engagementQuality: 85,
        attentionSpan: 45,
      },
      realTime: {
        isOnline: false,
        sessionDuration: 0,
        lastSeen: new Date().toISOString(),
        pagesViewed: 3,
        timeOnSite: 120,
      },
    },
    activity: {
      timeline: [],
      recent: [],
      patterns: [],
      triggers: [],
      score: { frequency: 85, quality: 90, recency: 95, consistency: 80, responsiveness: 85 },
    },
    predictions: {
      conversion_probability: 75,
      time_to_close: '14 days',
      next_action: {
        action: 'Follow up with email',
        timing: '2 hours',
        channel: 'email',
        success_probability: 85,
      },
    },
    insights: {
      personality_insights: {
        type: 'analytical',
        traits: ['منطقي', 'مفصل', 'دقيق'],
        motivations: ['الكفاءة', 'الجودة', 'الابتكار'],
        decision_style: 'منهجي',
        communication_style: 'مهني مباشر',
      },
      communication_preferences: {
        preferred_channels: ['email', 'video_call'],
        best_contact_times: ['10:00-12:00', '14:00-16:00'],
        response_speed: 'سريع',
        tone_preference: 'مهني',
        language_preference: ['العربية', 'الإنجليزية'],
      },
      buying_signals: {
        signals: [
          { signal: 'طلب عرض توضيحي', strength: 90, frequency: 'high', significance: 'high', timestamp: new Date().toISOString() },
          { signal: 'أسئلة تقنية مفصلة', strength: 85, frequency: 'medium', significance: 'high', timestamp: new Date().toISOString() },
        ],
        urgency_level: 80,
        decision_stage: 'evaluation',
        buying_readiness: 85,
      },
      objections: {
        likely_objections: [
          { objection: 'التكلفة', frequency: 70, impact: 60, overcome_strategy: 'إظهار ROI والتوفير طويل المدى' },
        ],
        overcome_strategies: ['دراسات حالة', 'عروض توضيحية مجانية', 'فترة تجريبية'],
        success_rate: 75,
      },
      competitor_analysis: {
        competing_companies: ['شركة أ', 'شركة ب'],
        competitive_advantages: ['دعم فني متميز', 'تكلفة أقل', 'تنفيذ أسرع'],
        switching_factors: ['جودة الخدمة', 'سهولة الاستخدام', 'الدعم'],
        market_position: 'قائد محلي',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  ...overrides,
});

export const createMockPlaybook = (overrides = {}) => ({
  id: '1',
  title: 'استراتيجية العملاء الجديدة',
  description: 'دليل شامل للعملاء الجدد',
  category: 'lead-generation',
  status: 'active' as const,
  triggerConditions: [],
  actions: [],
  metrics: {
    totalLeads: 150,
    conversionRate: 25.5,
    averageScore: 82,
    revenue: 250000,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockDashboardData = (overrides = {}) => ({
  leads: {
    total: 245,
    new: 45,
    qualified: 85,
    proposal: 35,
    negotiation: 25,
    closed_won: 35,
    closed_lost: 20,
  },
  messages: {
    total: 1250,
    sent: 890,
    replied: 360,
  },
  analytics: {
    conversion_rate: 18.5,
    average_response_time: '2.3 hours',
    customer_satisfaction: 4.7,
  },
  ...overrides,
});

// إعداد مولد mock للـ user events
export const mockUserEvent = {
  click: jest.fn(),
  type: jest.fn(),
  clear: jest.fn(),
  selectOptions: jest.fn(),
  deselectOptions: jest.fn(),
  upload: jest.fn(),
};

// إعداد timeout للاختبارات
jest.setTimeout(30000);