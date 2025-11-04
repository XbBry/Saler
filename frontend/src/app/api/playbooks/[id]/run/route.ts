/**
 * API Route لتشغيل الـ Playbook
 * POST /api/playbooks/[id]/run
 */

import { NextRequest, NextResponse } from 'next/server';

// Import from main route file to reuse mock data
const mockPlaybooks = [
  {
    id: '1',
    name: 'تأهيل العملاء الجدد',
    description: 'سلسلة تأهيل تلقائية للعملاء الجدد مع نقاط مراقبة ذكية',
    category: 'lead_qualification',
    status: 'active',
    trigger: {
      type: 'lead_created',
      conditions: [
        { field: 'source', operator: 'equals', value: 'website' },
        { field: 'priority', operator: 'equals', value: 'high' }
      ]
    },
    steps: [
      {
        id: 'step-1',
        type: 'email',
        name: 'رسالة ترحيب شخصية',
        description: 'إرسال رسالة ترحيب شخصية مع معلومات المنتج',
        order: 1,
        template: 'welcome_email_template',
        isActive: true,
      },
      {
        id: 'step-2',
        type: 'wait',
        name: 'انتظار 24 ساعة',
        description: 'انتظار تفاعل العميل لمدة 24 ساعة',
        order: 2,
        delay: 1440,
        isActive: true,
      },
    ],
    metrics: {
      totalRuns: 156,
      successRate: 87.5,
      avgCompletionTime: 48,
      currentActive: 12,
      lastRun: new Date(Date.now() - 3600000).toISOString(),
    },
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date().toISOString(),
    owner: 'current-user',
    tags: ['تأهيل', 'جديد', 'تلقائي'],
    isPublic: true,
  },
  {
    id: '2',
    name: 'استعادة العملاء الساخنين',
    description: 'تفعيل العملاء ذوي درجة الحرارة العالية للإغلاق السريع',
    category: 'conversion',
    status: 'active',
    trigger: {
      type: 'temperature_change',
      conditions: [
        { field: 'temperature', operator: 'equals', value: 'hot' }
      ]
    },
    steps: [
      {
        id: 'step-1',
        type: 'call',
        name: 'اتصال فوري',
        description: 'اتصال هاتفي فوري مع العميل الساخن',
        order: 1,
        isActive: true,
      },
    ],
    metrics: {
      totalRuns: 89,
      successRate: 92.1,
      avgCompletionTime: 12,
      currentActive: 8,
      lastRun: new Date(Date.now() - 1800000).toISOString(),
    },
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    owner: 'current-user',
    tags: ['ساخن', 'إغلاق', 'عاجل'],
    isPublic: false,
  },
  {
    id: '3',
    name: 'العناية بالعملاء الموجودين',
    description: 'حفظ وتفعيل العملاء الموجودين لتعزيز العلاقة',
    category: 'retention',
    status: 'active',
    trigger: {
      type: 'status_changed',
      conditions: [
        { field: 'status', operator: 'equals', value: 'closed_won' }
      ]
    },
    steps: [
      {
        id: 'step-1',
        type: 'email',
        name: 'رسالة شكر وترحيب',
        description: 'رسالة شكر للعمل الجديد مع مرحب',
        order: 1,
        template: 'customer_welcome_template',
        isActive: true,
      },
    ],
    metrics: {
      totalRuns: 234,
      successRate: 95.3,
      avgCompletionTime: 168,
      currentActive: 15,
      lastRun: new Date(Date.now() - 86400000).toISOString(),
    },
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    owner: 'current-user',
    tags: ['عملاء', 'رعاية', 'رضا'],
    isPublic: true,
  },
  {
    id: '4',
    name: 'تتبع العملاء الباردين',
    description: 'إعادة تفعيل العملاء ذوي درجة الحرارة المنخفضة',
    category: 'nurturing',
    status: 'paused',
    trigger: {
      type: 'temperature_change',
      conditions: [
        { field: 'temperature', operator: 'equals', value: 'cold' }
      ]
    },
    steps: [
      {
        id: 'step-1',
        type: 'email',
        name: 'محتوى قيم',
        description: 'إرسال محتوى قيم وعملي',
        order: 1,
        template: 'cold_lead_nurturing_template',
        isActive: true,
      },
    ],
    metrics: {
      totalRuns: 67,
      successRate: 34.3,
      avgCompletionTime: 72,
      currentActive: 0,
      lastRun: new Date(Date.now() - 172800000).toISOString(),
    },
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
    owner: 'current-user',
    tags: ['بارد', 'إعادة تفعيل', 'رعاية'],
    isPublic: false,
  },
];

// ==================== POST /api/playbooks/[id]/run ====================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const playbookIndex = mockPlaybooks.findIndex(p => p.id === params.id);
    
    if (playbookIndex === -1) {
      return NextResponse.json(
        { error: 'الـ Playbook غير موجود' },
        { status: 404 }
      );
    }

    // Simulate playbook execution
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update metrics to simulate execution
    mockPlaybooks[playbookIndex] = {
      ...mockPlaybooks[playbookIndex],
      metrics: {
        ...mockPlaybooks[playbookIndex].metrics,
        totalRuns: mockPlaybooks[playbookIndex].metrics.totalRuns + 1,
        currentActive: mockPlaybooks[playbookIndex].metrics.currentActive + 1,
        lastRun: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    const runResult = {
      success: true,
      runId: `run_${Date.now()}`,
      playbookId: params.id,
      data: data,
      message: 'تم تشغيل الـ Playbook بنجاح',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(runResult);
  } catch (error) {
    console.error('Error running playbook:', error);
    return NextResponse.json(
      { error: 'فشل في تشغيل الـ Playbook' },
      { status: 500 }
    );
  }
}