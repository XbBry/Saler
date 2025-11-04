/**
 * API Routes للـ Playbook المحدد
 * /api/playbooks/[id]/*
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

// ==================== GET /api/playbooks/[id] ====================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playbook = mockPlaybooks.find(p => p.id === params.id);
    
    if (!playbook) {
      return NextResponse.json(
        { error: 'الـ Playbook غير موجود' },
        { status: 404 }
      );
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return NextResponse.json(playbook);
  } catch (error) {
    console.error('Error fetching playbook:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الـ Playbook' },
      { status: 500 }
    );
  }
}

// ==================== PATCH /api/playbooks/[id] ====================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    const playbookIndex = mockPlaybooks.findIndex(p => p.id === params.id);
    
    if (playbookIndex === -1) {
      return NextResponse.json(
        { error: 'الـ Playbook غير موجود' },
        { status: 404 }
      );
    }

    // Update the playbook
    mockPlaybooks[playbookIndex] = {
      ...mockPlaybooks[playbookIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json(mockPlaybooks[playbookIndex]);
  } catch (error) {
    console.error('Error updating playbook:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث الـ Playbook' },
      { status: 500 }
    );
  }
}

// ==================== DELETE /api/playbooks/[id] ====================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playbookIndex = mockPlaybooks.findIndex(p => p.id === params.id);
    
    if (playbookIndex === -1) {
      return NextResponse.json(
        { error: 'الـ Playbook غير موجود' },
        { status: 404 }
      );
    }

    // Remove the playbook
    mockPlaybooks.splice(playbookIndex, 1);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return NextResponse.json({ success: true, message: 'تم حذف الـ Playbook بنجاح' });
  } catch (error) {
    console.error('Error deleting playbook:', error);
    return NextResponse.json(
      { error: 'فشل في حذف الـ Playbook' },
      { status: 500 }
    );
  }
}