/**
 * API Routes للـ Playbooks
 * HTTP handlers للـ CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - سيتم استبدالها بـ real API calls
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
        delay: 1440, // 24 hours in minutes
        isActive: true,
      },
      {
        id: 'step-3',
        type: 'condition',
        name: 'تحقق من التفاعل',
        description: 'التحقق من تفاعل العميل مع الرسالة',
        order: 3,
        conditions: [
          { field: 'email_opened', operator: 'equals', value: true }
        ],
        isActive: true,
      },
      {
        id: 'step-4',
        type: 'assign',
        name: 'تعيين لمسؤول المبيعات',
        description: 'تعيين العميل لمسؤول مبيعات متخصص',
        order: 4,
        assignee: 'sales_rep_1',
        isActive: true,
      },
    ],
    target_audience: {
      tags: ['مستهدف', 'جديد'],
      source: ['website', 'social_media'],
      status: ['new'],
      temperature: ['cold', 'warm'],
      priority: ['high', 'urgent'],
    },
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
      {
        id: 'step-2',
        type: 'wait',
        name: 'انتظار 2 ساعة',
        description: 'انتظار استجابة العميل',
        order: 2,
        delay: 120, // 2 hours in minutes
        isActive: true,
      },
      {
        id: 'step-3',
        type: 'email',
        name: 'إرسال عرض شخصي',
        description: 'إرسال عرض مخصص بناءً على احتياجات العميل',
        order: 3,
        template: 'hot_lead_offer_template',
        isActive: true,
      },
      {
        id: 'step-4',
        type: 'condition',
        name: 'متابعة الإغلاق',
        description: 'متابعة عملية الإغلاق',
        order: 4,
        isActive: true,
      },
    ],
    target_audience: {
      temperature: ['hot'],
      priority: ['high', 'urgent'],
    },
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
      {
        id: 'step-2',
        type: 'wait',
        name: 'انتظار أسبوع',
        description: 'انتظار فترة كافية للتكيف',
        order: 2,
        delay: 10080, // 1 week in minutes
        isActive: true,
      },
      {
        id: 'step-3',
        type: 'call',
        name: 'مكالمة متابعة',
        description: 'مكالمة متابعة للتأكد من الرضا',
        order: 3,
        isActive: true,
      },
      {
        id: 'step-4',
        type: 'condition',
        name: 'تقييم الرضا',
        description: 'تقييم مستوى رضا العميل',
        order: 4,
        isActive: true,
      },
    ],
    target_audience: {
      status: ['closed_won'],
    },
    metrics: {
      totalRuns: 234,
      successRate: 95.3,
      avgCompletionTime: 168, // 1 week in hours
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
      {
        id: 'step-2',
        type: 'wait',
        name: 'انتظار 3 أيام',
        description: 'انتظار وقت كافي للتفاعل',
        order: 2,
        delay: 4320, // 3 days in minutes
        isActive: true,
      },
      {
        id: 'step-3',
        type: 'condition',
        name: 'تقييم التفاعل',
        description: 'تقييم مستوى تفاعل العميل',
        order: 3,
        isActive: true,
      },
    ],
    target_audience: {
      temperature: ['cold'],
    },
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

// ==================== GET /api/playbooks ====================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const owner = searchParams.get('owner') || '';
    const isPublic = searchParams.get('isPublic') === 'true';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

    // Filter playbooks based on query parameters
    let filteredPlaybooks = [...mockPlaybooks];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPlaybooks = filteredPlaybooks.filter(playbook =>
        playbook.name.toLowerCase().includes(searchLower) ||
        playbook.description.toLowerCase().includes(searchLower) ||
        playbook.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (category && category !== 'all') {
      filteredPlaybooks = filteredPlaybooks.filter(playbook => playbook.category === category);
    }

    if (status && status !== 'all') {
      filteredPlaybooks = filteredPlaybooks.filter(playbook => playbook.status === status);
    }

    if (owner) {
      filteredPlaybooks = filteredPlaybooks.filter(playbook => playbook.owner === owner);
    }

    if (isPublic !== undefined) {
      filteredPlaybooks = filteredPlaybooks.filter(playbook => playbook.isPublic === isPublic);
    }

    if (tags.length > 0) {
      filteredPlaybooks = filteredPlaybooks.filter(playbook =>
        tags.some(tag => playbook.tags.includes(tag))
      );
    }

    // Sort playbooks
    filteredPlaybooks.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';
      
      // Handle nested properties like metrics.totalRuns
      if (sortBy.includes('.')) {
        const [parent, child] = sortBy.split('.');
        aValue = a[parent as keyof typeof a]?.[child] || '';
        bValue = b[parent as keyof typeof b]?.[child] || '';
      } else {
        aValue = a[sortBy as keyof typeof a] || '';
        bValue = b[sortBy as keyof typeof b] || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const total = filteredPlaybooks.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPlaybooks = filteredPlaybooks.slice(startIndex, endIndex);

    const response = {
      playbooks: paginatedPlaybooks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: endIndex < total,
      hasPreviousPage: page > 1,
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching playbooks:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الـ Playbooks' },
      { status: 500 }
    );
  }
}

// ==================== POST /api/playbooks ====================

export async function POST(request: NextRequest) {
  try {
    const playbookData = await request.json();
    
    // Generate new ID
    const newId = String(mockPlaybooks.length + 1);
    
    // Create new playbook
    const newPlaybook = {
      id: newId,
      ...playbookData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metrics: {
        totalRuns: 0,
        successRate: 0,
        avgCompletionTime: 0,
        currentActive: 0,
        lastRun: new Date().toISOString(),
      },
      owner: 'current-user', // Current user ID
    };

    // Add to mock data (in real app, save to database)
    mockPlaybooks.push(newPlaybook);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json(newPlaybook, { status: 201 });
  } catch (error) {
    console.error('Error creating playbook:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء الـ Playbook' },
      { status: 500 }
    );
  }
}