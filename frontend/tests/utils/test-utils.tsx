// Test Utilities and Helper Functions

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Type definitions for test utilities
export interface TestProvidersProps {
  children: React.ReactNode;
}

export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  providers?: React.ComponentType<TestProvidersProps>;
}

// Mock data generators
export class TestDataGenerator {
  static generateLead(overrides = {}) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      firstName: 'أحمد',
      lastName: 'محمد',
      email: 'ahmed@example.com',
      phone: '+966501234567',
      company: 'شركة التقنية المتقدمة',
      position: 'مدير تقنية المعلومات',
      source: 'الموقع الإلكتروني',
      status: 'qualified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: 'current-user',
      value: 150000,
      stage: 'proposal',
      priority: 'high',
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
    };
  }

  static generatePlaybook(overrides = {}) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      title: 'استراتيجية العملاء الجديدة',
      description: 'دليل شامل للعملاء الجدد',
      category: 'lead-generation',
      status: 'active',
      triggerConditions: [
        {
          id: '1',
          condition: 'حالة العميل',
          operator: 'equals',
          value: 'جديد',
        },
      ],
      actions: [
        {
          id: '1',
          name: 'إرسال رسالة ترحيب',
          type: 'email',
        },
        {
          id: '2',
          name: 'انتظار 24 ساعة',
          type: 'delay',
          delay: 1440,
        },
        {
          id: '3',
          name: 'إجراء مكالمة متابعة',
          type: 'call',
        },
      ],
      metrics: {
        totalLeads: 150,
        conversionRate: 25.5,
        averageScore: 82,
        revenue: 250000,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  static generateMultipleLeads(count: number, baseLead = {}) {
    return Array.from({ length: count }, (_, index) =>
      this.generateLead({
        id: `lead-${index + 1}`,
        firstName: `أحمد${index + 1}`,
        lastName: `محمد${index + 1}`,
        ...baseLead,
      })
    );
  }

  static generateDashboardData(overrides = {}) {
    return {
      leads: {
        total: 245,
        new: 45,
        qualified: 85,
        proposal: 35,
        negotiation: 25,
        closed_won: 35,
        closed_lost: 20,
        trends: [
          { date: '2023-11-01', count: 12 },
          { date: '2023-11-02', count: 19 },
          { date: '2023-11-03', count: 15 },
        ],
        by_status: {
          new: 45,
          qualified: 85,
          proposal: 35,
          negotiation: 25,
          closed_won: 35,
          closed_lost: 20,
        },
        by_source: {
          'الموقع الإلكتروني': 85,
          'وسائل التواصل': 60,
          'المراجع': 45,
          'الإعلانات': 35,
          'مباشر': 20,
        },
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
    };
  }
}

// Mock helper functions
export class MockHelpers {
  static createMockIntersectionObserver() {
    return {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  static createMockResizeObserver() {
    return {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  static createMockIntersectionObserverEntry(isIntersecting = false) {
    return {
      isIntersecting,
      boundingClientRect: {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: 100,
        height: 100,
      },
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: 100,
        height: 100,
      },
      rootBounds: {
        top: 0,
        left: 0,
        bottom: 600,
        right: 800,
        width: 800,
        height: 600,
      },
      target: document.createElement('div'),
      time: Date.now(),
    };
  }

  static createMockEvent(type: string, options = {}) {
    return {
      type,
      target: {
        value: '',
        checked: false,
        ...options,
      },
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      ...options,
    };
  }
}

// Assertion helpers
export class TestAssertions {
  static toBeVisible(element: HTMLElement) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  static toHaveRTLDirection(element: HTMLElement) {
    return element.getAttribute('dir') === 'rtl';
  }

  static toHaveArabicText(text: string) {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text);
  }

  static toBeValidSaudiPhoneNumber(phone: string) {
    const saudiPhoneRegex = /^(\+966|0)?[5][0-9]{8}$/;
    return saudiPhoneRegex.test(phone.replace(/\s/g, ''));
  }

  static toBeValidSaudiRiyal(amount: number) {
    return typeof amount === 'number' && amount >= 0;
  }
}

// Event simulation helpers
export class EventSimulators {
  static click(element: HTMLElement) {
    fireEvent.click(element);
  }

  static doubleClick(element: HTMLElement) {
    fireEvent.doubleClick(element);
  }

  static changeInput(element: HTMLInputElement, value: string) {
    fireEvent.change(element, { target: { value } });
  }

  static typeInInput(element: HTMLInputElement, text: string) {
    fireEvent.change(element, { target: { value: text } });
    fireEvent.input(element, { target: { value: text } });
  }

  static submitForm(element: HTMLFormElement) {
    fireEvent.submit(element);
  }

  static focus(element: HTMLElement) {
    fireEvent.focus(element);
  }

  static blur(element: HTMLElement) {
    fireEvent.blur(element);
  }

  static keyPress(element: HTMLElement, key: string) {
    fireEvent.keyPress(element, { key });
  }

  static keyDown(element: HTMLElement, key: string) {
    fireEvent.keyDown(element, { key });
  }

  static keyUp(element: HTMLElement, key: string) {
    fireEvent.keyUp(element, { key });
  }

  static mouseEnter(element: HTMLElement) {
    fireEvent.mouseEnter(element);
  }

  static mouseLeave(element: HTMLElement) {
    fireEvent.mouseLeave(element);
  }

  static mouseOver(element: HTMLElement) {
    fireEvent.mouseOver(element);
  }

  static scroll(element: HTMLElement, scrollTop: number = 100) {
    fireEvent.scroll(element, { target: { scrollTop } });
  }

  static resize(element: HTMLElement, width: number = 800, height: number = 600) {
    fireEvent.resize(element, { target: { innerWidth: width, innerHeight: height } });
  }
}

// Query helpers
export class QueryHelpers {
  static getByTestId(container: HTMLElement, id: string) {
    return container.querySelector(`[data-testid="${id}"]`) as HTMLElement;
  }

  static getAllByTestId(container: HTMLElement, id: string) {
    return Array.from(container.querySelectorAll(`[data-testid="${id}"]`)) as HTMLElement[];
  }

  static getByDataAttribute(container: HTMLElement, attribute: string, value: string) {
    return container.querySelector(`[data-${attribute}="${value}"]`) as HTMLElement;
  }

  static getAllByDataAttribute(container: HTMLElement, attribute: string, value: string) {
    return Array.from(container.querySelectorAll(`[data-${attribute}="${value}"]`)) as HTMLElement[];
  }

  static getByRole(container: HTMLElement, role: string, name?: string) {
    if (name) {
      return container.querySelector(`[role="${role}"][aria-label*="${name}"], [role="${role}"][title*="${name}"]`) as HTMLElement;
    }
    return container.querySelector(`[role="${role}"]`) as HTMLElement;
  }

  static getAllByRole(container: HTMLElement, role: string) {
    return Array.from(container.querySelectorAll(`[role="${role}"]`)) as HTMLElement[];
  }

  static getByText(container: HTMLElement, text: string) {
    return container.querySelector(`*:not(script):not(style)`) as HTMLElement;
  }

  static waitForElementToBeRemoved(element: HTMLElement) {
    return waitFor(() => {
      expect(element.parentNode).toBeNull();
    });
  }
}

// Performance testing helpers
export class PerformanceHelpers {
  static measureRenderTime(fn: () => void): number {
    const start = performance.now();
    fn();
    const end = performance.now();
    return end - start;
  }

  static async measureAsyncRenderTime(fn: () => Promise<void>): Promise<number> {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  }

  static createLargeDataset(size: number) {
    return TestDataGenerator.generateMultipleLeads(size);
  }

  static measureMemoryUsage() {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
}

// Custom render function with providers
export function renderWithProviders(
  ui: ReactElement,
  {
    providers: Providers = ({ children }: TestProvidersProps) => <>{children}</>,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: TestProvidersProps) {
    return <Providers>{children}</Providers>;
  }
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Default export for convenience
export default renderWithProviders;