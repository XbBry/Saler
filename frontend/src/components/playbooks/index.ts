// 🎯 Advanced Playbooks System Exports
// =====================================

// Core Components
export { default as PlaybookBuilder } from './PlaybookBuilder';
export type { PlaybookNode, PlaybookConnection, PlaybookFlow } from './PlaybookBuilder';

// Advanced Features
export { default as AdvancedConditionsBuilder } from './AdvancedConditionsBuilder';
export type { ConditionGroup, Condition } from './AdvancedConditionsBuilder';

export { default as TaskAutomationManager } from './TaskAutomationManager';
export type { TaskAutomation, Task, TaskTemplate } from './TaskAutomationManager';

export { default as AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
export type { PlaybookAnalytics, ABTestResult, AIInsight } from './AdvancedAnalyticsDashboard';

// Additional Components
export { default as PlaybookCard } from './PlaybookCard';

// 🎨 Component Configurations
export const PLAYBOOK_CONFIG = {
  NODE_TYPES: {
    TRIGGER: 'trigger',
    ACTION: 'action', 
    CONDITION: 'condition',
    DELAY: 'delay',
    END: 'end'
  },
  
  ACTION_TYPES: {
    SEND_MESSAGE: 'SEND_MESSAGE',
    WAIT: 'WAIT',
    CONDITION: 'CONDITION',
    TAG: 'TAG',
    UNTAG: 'UNTAG',
    CHANGE_STATUS: 'CHANGE_STATUS',
    ASSIGN: 'ASSIGN',
    WEBHOOK: 'WEBHOOK',
    API_CALL: 'API_CALL',
    DELAY: 'DELAY',
    BRANCH: 'BRANCH',
    END: 'END'
  },
  
  TRIGGER_TYPES: {
    NEW_LEAD: 'NEW_LEAD',
    LEAD_STATUS_CHANGED: 'LEAD_STATUS_CHANGED',
    NO_RESPONSE: 'NO_RESPONSE',
    PURCHASED: 'PURCHASED',
    TIME_BASED: 'TIME_BASED',
    CONDITION_MET: 'CONDITION_MET',
    CUSTOM_EVENT: 'CUSTOM_EVENT',
    WEBHOOK_RECEIVED: 'WEBHOOK_RECEIVED'
  },
  
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium', 
    HIGH: 'high',
    URGENT: 'urgent'
  },
  
  STATUS: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PAUSED: 'paused',
    CANCELLED: 'cancelled'
  }
};

// 🔧 Utility Functions
export const playbookUtils = {
  // Validation
  validateFlow: (flow: PlaybookFlow): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!flow.nodes.length) {
      errors.push('يجب وجود عقدة واحدة على الأقل');
    }
    
    const triggers = flow.nodes.filter(node => node.type === 'trigger');
    if (triggers.length === 0) {
      errors.push('يجب وجود نقطة تفعيل واحدة على الأقل');
    }
    
    const ends = flow.nodes.filter(node => node.type === 'end');
    if (ends.length === 0) {
      errors.push('يجب وجود نقطة نهاية واحدة على الأقل');
    }
    
    // Check for unreachable nodes
    const reachableNodes = new Set<string>();
    const queue = [...triggers.map(t => t.id)];
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (reachableNodes.has(nodeId)) continue;
      
      reachableNodes.add(nodeId);
      const connections = flow.connections.filter(c => c.source === nodeId);
      
      for (const conn of connections) {
        if (!reachableNodes.has(conn.target)) {
          queue.push(conn.target);
        }
      }
    }
    
    const unreachableNodes = flow.nodes.filter(node => 
      !reachableNodes.has(node.id) && node.type !== 'trigger'
    );
    
    if (unreachableNodes.length > 0) {
      errors.push(`يوجد ${unreachableNodes.length} عقدة غير قابلة للوصول`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  // Flow Analysis
  analyzeFlow: (flow: PlaybookFlow) => {
    const nodes = flow.nodes;
    const connections = flow.connections;
    
    // Count node types
    const nodeCounts = {
      trigger: nodes.filter(n => n.type === 'trigger').length,
      action: nodes.filter(n => n.type === 'action').length,
      condition: nodes.filter(n => n.type === 'condition').length,
      delay: nodes.filter(n => n.type === 'delay').length,
      end: nodes.filter(n => n.type === 'end').length
    };
    
    // Calculate complexity score
    const complexityScore = (
      nodeCounts.action * 1 +
      nodeCounts.condition * 2 +
      nodeCounts.delay * 1 +
      connections.length * 1.5
    );
    
    // Estimate execution time
    const estimatedTime = nodes
      .filter(n => n.type === 'delay')
      .reduce((total, node) => {
        // Extract delay from config
        const delay = node.data.config?.delay || 0;
        return total + delay;
      }, 0);
    
    return {
      nodeCounts,
      complexityScore,
      estimatedTime,
      totalNodes: nodes.length,
      totalConnections: connections.length,
      hasBranching: connections.some(conn => conn.condition),
      hasLoops: false // Would need cycle detection
    };
  },
  
  // Export/Import
  exportFlow: (flow: PlaybookFlow): string => {
    return JSON.stringify({
      ...flow,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    }, null, 2);
  },
  
  importFlow: (jsonString: string): PlaybookFlow | null => {
    try {
      const data = JSON.parse(jsonString);
      return data as PlaybookFlow;
    } catch (error) {
      console.error('Failed to import flow:', error);
      return null;
    }
  }
};

// 🎭 Icon Mappings
export const PLAYBOOK_ICONS = {
  triggers: {
    'NEW_LEAD': 'Plus',
    'LEAD_STATUS_CHANGED': 'Activity', 
    'NO_RESPONSE': 'Clock',
    'PURCHASED': 'CheckCircle',
    'TIME_BASED': 'Calendar',
    'CUSTOM_EVENT': 'Zap'
  },
  
  actions: {
    'SEND_MESSAGE': 'MessageSquare',
    'WAIT': 'Timer',
    'CONDITION': 'GitBranch',
    'TAG': 'Tag',
    'ASSIGN': 'User',
    'WEBHOOK': 'Globe',
    'API_CALL': 'ExternalLink',
    'END': 'CheckCircle'
  },
  
  nodes: {
    trigger: 'Zap',
    action: 'Play',
    condition: 'GitBranch',
    delay: 'Clock',
    end: 'Flag'
  }
};

// 📊 Analytics Helpers
export const analyticsHelpers = {
  calculateROI: (revenue: number, cost: number): number => {
    if (cost === 0) return 0;
    return ((revenue - cost) / cost) * 100;
  },
  
  calculateConversionRate: (conversions: number, total: number): number => {
    if (total === 0) return 0;
    return (conversions / total) * 100;
  },
  
  calculateSuccessRate: (successful: number, total: number): number => {
    if (total === 0) return 0;
    return (successful / total) * 100;
  },
  
  formatMetric: (value: number, type: 'percentage' | 'currency' | 'number' | 'time'): string => {
    switch (type) {
      case 'percentage':
        return `${Math.round(value * 10) / 10}%`;
      case 'currency':
        return new Intl.NumberFormat('ar-SA', {
          style: 'currency',
          currency: 'SAR',
          minimumFractionDigits: 0
        }).format(value);
      case 'time':
        if (value < 60) return `${Math.round(value)} دقيقة`;
        if (value < 1440) return `${Math.round(value / 60)} ساعة`;
        return `${Math.round(value / 1440)} يوم`;
      default:
        return new Intl.NumberFormat('ar-SA').format(Math.round(value));
    }
  }
};

// 🚀 Quick Start Templates
export const QUICK_START_TEMPLATES = {
  lead_qualification: {
    name: 'تأهيل العملاء الجدد',
    description: 'سلسلة تأهيل تلقائية للعملاء الجدد',
    nodes: [
      {
        type: 'trigger',
        label: 'عميل جديد',
        config: { source: 'website' }
      },
      {
        type: 'action',
        label: 'إرسال رسالة ترحيب',
        config: { channel: 'whatsapp', template: 'welcome' }
      },
      {
        type: 'delay',
        label: 'انتظار 24 ساعة',
        config: { duration: 1440 }
      },
      {
        type: 'condition',
        label: 'تحقق من التفاعل',
        config: { field: 'email_opened', operator: 'equals', value: true }
      },
      {
        type: 'action',
        label: 'تعيين لمسؤول المبيعات',
        config: { assignee: 'auto' }
      },
      {
        type: 'end',
        label: 'إنهاء',
        config: { status: 'success' }
      }
    ]
  },
  
  hot_lead_response: {
    name: 'الاستجابة السريعة للعملاء الساخنين',
    description: 'تفعيل العملاء الساخنين للإغلاق السريع',
    nodes: [
      {
        type: 'trigger',
        label: 'عميل ساخن',
        config: { temperature: 'hot' }
      },
      {
        type: 'action',
        label: 'إشعار فوري',
        config: { type: 'urgent_alert', recipients: ['sales_manager'] }
      },
      {
        type: 'delay',
        label: 'انتظار 30 دقيقة',
        config: { duration: 30 }
      },
      {
        type: 'action',
        label: 'مكالمة فورية',
        config: { assignee: 'senior_sales', priority: 'urgent' }
      },
      {
        type: 'end',
        label: 'إنهاء',
        config: { status: 'success' }
      }
    ]
  }
};

// Export everything as default for easy importing
export default {
  PlaybookBuilder,
  AdvancedConditionsBuilder,
  TaskAutomationManager,
  AdvancedAnalyticsDashboard,
  PlaybookCard,
  playbookUtils,
  analyticsHelpers,
  PLAYBOOK_CONFIG,
  PLAYBOOK_ICONS,
  QUICK_START_TEMPLATES
};