/**
 * API Routes للعملاء المحتملين
 * HTTP handlers للـ CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - سيتم استبدالها بـ real API calls
const mockLeads = [
  {
    id: '1',
    firstName: 'أحمد',
    lastName: 'محمد',
    email: 'ahmed.mohammed@example.com',
    phone: '+966501234567',
    company: 'شركة التقنية المتقدمة',
    position: 'مدير تقنية المعلومات',
    source: 'الموقع الإلكتروني',
    status: 'qualified',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    owner: 'current-user',
    value: 150000,
    stage: 'evaluation',
    priority: 'high',
    tags: ['مستهدف', 'تقني', 'كبير'],
    temperature: 'hot',
    score: 92,
    lastActivity: new Date(Date.now() - 3600000).toISOString(),
    nextFollowUp: new Date(Date.now() + 86400000).toISOString(),
    notes: 'عميل مهم جداً - يحتاج متابعة فورية',
  },
  {
    id: '2',
    firstName: 'سارة',
    lastName: 'أحمد',
    email: 'sara.ahmed@example.com',
    phone: '+966502345678',
    company: 'مؤسسة البناء الحديث',
    position: 'مدير مشاريع',
    source: 'مراجعة مباشرة',
    status: 'proposal',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    owner: 'current-user',
    value: 95000,
    stage: 'proposal_sent',
    priority: 'medium',
    tags: ['بناء', 'مشاريع'],
    temperature: 'warm',
    score: 78,
    lastActivity: new Date(Date.now() - 7200000).toISOString(),
    nextFollowUp: new Date(Date.now() + 172800000).toISOString(),
    notes: 'مقدمة لعرض خلال أسبوع',
  },
  {
    id: '3',
    firstName: 'خالد',
    lastName: 'العلي',
    email: 'khalid.ali@example.com',
    phone: '+966503456789',
    company: 'مجموعة الاستثمار الذكي',
    position: 'مدير تنفيذي',
    source: 'LinkedIn',
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner: 'current-user',
    value: 250000,
    stage: 'new_lead',
    priority: 'high',
    tags: ['استثمار', 'رئيسي'],
    temperature: 'cold',
    score: 45,
    lastActivity: new Date().toISOString(),
    nextFollowUp: new Date(Date.now() + 86400000).toISOString(),
    notes: 'عميل محتمل عالي القيمة',
  },
  {
    id: '4',
    firstName: 'فاطمة',
    lastName: 'أحمد',
    email: 'fatima.ahmed@example.com',
    phone: '+966504567890',
    company: 'شركة التسويق الإبداعي',
    position: 'مديرة التسويق',
    source: 'إحالة',
    status: 'contacted',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
    owner: 'current-user',
    value: 75000,
    stage: 'discovery',
    priority: 'medium',
    tags: ['تسويق', 'إبداع'],
    temperature: 'warm',
    score: 65,
    lastActivity: new Date(Date.now() - 14400000).toISOString(),
    nextFollowUp: new Date(Date.now() + 172800000).toISOString(),
    notes: 'مبدعة في مجال التسويق',
  },
  {
    id: '5',
    firstName: 'عبدالله',
    lastName: 'السعيد',
    email: 'abdullah.saeed@example.com',
    phone: '+966505678901',
    company: 'مؤسسة التجارة الإلكترونية',
    position: 'مدير التطوير',
    source: 'الموقع الإلكتروني',
    status: 'converted',
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    updatedAt: new Date(Date.now() - 28800000).toISOString(),
    owner: 'current-user',
    value: 180000,
    stage: 'closed_won',
    priority: 'high',
    tags: ['تجارة', 'تقنية'],
    temperature: 'hot',
    score: 95,
    lastActivity: new Date(Date.now() - 28800000).toISOString(),
    nextFollowUp: new Date(Date.now() + 604800000).toISOString(),
    notes: 'محول بنجاح - عميل ممتاز',
  },
];

const mockPipelineStages = [
  { id: 'new_lead', name: 'جديد', order: 1, color: '#3B82F6', leads: [mockLeads[2]] },
  { id: 'discovery', name: 'اكتشاف', order: 2, color: '#8B5CF6', leads: [mockLeads[3]] },
  { id: 'evaluation', name: 'تقييم', order: 3, color: '#10B981', leads: [mockLeads[0]] },
  { id: 'proposal_sent', name: 'عرض سعر', order: 4, color: '#F59E0B', leads: [mockLeads[1]] },
  { id: 'closed_won', name: 'مربح', order: 5, color: '#059669', leads: [mockLeads[4]] },
  { id: 'closed_lost', name: 'غير مناسب', order: 6, color: '#DC2626', leads: [] },
];

// ==================== GET /api/leads ====================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const stage = searchParams.get('stage') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const source = searchParams.get('source') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Filter leads based on query parameters
    let filteredLeads = [...mockLeads];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredLeads = filteredLeads.filter(lead =>
        lead.firstName.toLowerCase().includes(searchLower) ||
        lead.lastName.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        lead.company.toLowerCase().includes(searchLower)
      );
    }

    if (status) {
      filteredLeads = filteredLeads.filter(lead => lead.status === status);
    }

    if (stage) {
      filteredLeads = filteredLeads.filter(lead => lead.stage === stage);
    }

    if (source) {
      filteredLeads = filteredLeads.filter(lead => lead.source === source);
    }

    // Sort leads
    filteredLeads.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a] || '';
      const bValue = b[sortBy as keyof typeof b] || '';
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const total = filteredLeads.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

    const response = {
      leads: paginatedLeads,
      pipelineStages: mockPipelineStages,
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
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'فشل في جلب العملاء المحتملين' },
      { status: 500 }
    );
  }
}

// ==================== POST /api/leads ====================

export async function POST(request: NextRequest) {
  try {
    const leadData = await request.json();
    
    // Generate new ID
    const newId = String(mockLeads.length + 1);
    
    // Create new lead
    const newLead = {
      id: newId,
      ...leadData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      score: leadData.score || 50,
      temperature: leadData.temperature || 'cold',
      owner: 'current-user', // Current user ID
    };

    // Add to mock data (in real app, save to database)
    mockLeads.push(newLead);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json(newLead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء العميل المحتمل' },
      { status: 500 }
    );
  }
}
