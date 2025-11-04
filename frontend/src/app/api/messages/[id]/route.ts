import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const conversationSchema = z.object({
  lead_id: z.string().min(1, 'معرف العميل مطلوب'),
  status: z.enum(['active', 'paused', 'ended', 'archived']).default('active'),
  metadata: z.object({}).optional(),
});

const messageSchema = z.object({
  content: z.string().min(1, 'محتوى الرسالة مطلوب'),
  type: z.enum(['text', 'image', 'file', 'audio', 'video']).default('text'),
  metadata: z.object({}).optional(),
  reply_to: z.string().optional(),
});

// Mock data for conversations
const mockConversations = [
  {
    id: 'conv_001',
    lead_id: 'lead_001',
    status: 'active' as const,
    last_message_at: '2025-11-03T15:30:00.000Z',
    message_count: 42,
    created_at: '2025-11-02T10:00:00.000Z',
    updated_at: '2025-11-03T15:30:00.000Z',
  },
  {
    id: 'conv_002', 
    lead_id: 'lead_002',
    status: 'active' as const,
    last_message_at: '2025-11-03T14:45:00.000Z',
    message_count: 28,
    created_at: '2025-11-02T14:30:00.000Z',
    updated_at: '2025-11-03T14:45:00.000Z',
  },
  {
    id: 'conv_003',
    lead_id: 'lead_003',
    status: 'paused' as const,
    last_message_at: '2025-11-03T12:00:00.000Z',
    message_count: 15,
    created_at: '2025-11-01T09:15:00.000Z',
    updated_at: '2025-11-03T12:00:00.000Z',
  },
];

// Mock data for leads
const mockLeads = [
  {
    id: 'lead_001',
    name: 'أحمد محمد',
    email: 'ahmed@example.com',
    phone: '+966501234567',
    company: 'شركة التقنية المتقدمة',
    status: 'qualified' as const,
    score: 85,
    created_at: '2025-11-02T10:00:00.000Z',
  },
  {
    id: 'lead_002',
    name: 'سارة أحمد',
    email: 'sara@example.com',
    phone: '+966507654321',
    company: 'شركة البناء الحديث',
    status: 'contacted' as const,
    score: 72,
    created_at: '2025-11-02T14:30:00.000Z',
  },
  {
    id: 'lead_003',
    name: 'محمد علي',
    email: 'mohamed@example.com',
    phone: '+966509876543',
    company: 'شركة التجارة الإلكترونية',
    status: 'new' as const,
    score: 65,
    created_at: '2025-11-01T09:15:00.000Z',
  },
];

// Mock data for messages
const mockMessages = [
  {
    id: 'msg_001',
    conversation_id: 'conv_001',
    content: 'مرحباً بك، كيف يمكنني مساعدتك؟',
    type: 'text' as const,
    direction: 'inbound' as const,
    status: 'read' as const,
    created_at: '2025-11-03T15:30:00.000Z',
  },
  {
    id: 'msg_002',
    conversation_id: 'conv_001',
    content: 'أريد معرفة المزيد عن خدماتكم',
    type: 'text' as const,
    direction: 'outbound' as const,
    status: 'sent' as const,
    created_at: '2025-11-03T15:32:00.000Z',
  },
  {
    id: 'msg_003',
    conversation_id: 'conv_001',
    content: 'بالطبع! نحن نقدم حلول تقنية متكاملة للشركات',
    type: 'text' as const,
    direction: 'inbound' as const,
    status: 'read' as const,
    created_at: '2025-11-03T15:33:00.000Z',
  },
  {
    id: 'msg_004',
    conversation_id: 'conv_002',
    content: 'مرحباً',
    type: 'text' as const,
    direction: 'inbound' as const,
    status: 'delivered' as const,
    created_at: '2025-11-03T14:45:00.000Z',
  },
  {
    id: 'msg_005',
    conversation_id: 'conv_002',
    content: 'أهلا وسهلا بك! كيف يمكنني مساعدتك اليوم؟',
    type: 'text' as const,
    direction: 'outbound' as const,
    status: 'sent' as const,
    created_at: '2025-11-03T14:46:00.000Z',
  },
];

// Helper function to get lead by ID
function getLeadById(leadId: string) {
  return mockLeads.find(lead => lead.id === leadId);
}

// Helper function to get conversation by ID
function getConversationById(conversationId: string) {
  return mockConversations.find(conv => conv.id === conversationId);
}

// Helper function to get messages for conversation
function getMessagesByConversation(conversationId: string, page = 1, limit = 50) {
  const messages = mockMessages
    .filter(msg => msg.conversation_id === conversationId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedMessages = messages.slice(startIndex, endIndex);

  return {
    items: paginatedMessages,
    total: messages.length,
    page,
    limit,
    has_next: endIndex < messages.length,
    has_previous: startIndex > 0,
    total_pages: Math.ceil(messages.length / limit),
  };
}

// GET handler - Get conversation details with messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const conversation = getConversationById(conversationId);
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'المحادثة غير موجودة' },
        { status: 404 }
      );
    }

    const lead = getLeadById(conversation.lead_id);
    
    if (!lead) {
      return NextResponse.json(
        { error: 'العميل غير موجود' },
        { status: 404 }
      );
    }

    // Get messages for this conversation
    const messagesData = getMessagesByConversation(conversationId, 1, 50);

    return NextResponse.json({
      success: true,
      data: {
        ...conversation,
        lead,
        messages: messagesData.items,
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('خطأ في جلب تفاصيل المحادثة:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب تفاصيل المحادثة' },
      { status: 500 }
    );
  }
}

// PATCH handler - Update conversation status or metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const body = await request.json();
    
    // Validate request body
    const validatedData = conversationSchema.parse(body);
    
    // Find conversation
    const conversationIndex = mockConversations.findIndex(conv => conv.id === conversationId);
    
    if (conversationIndex === -1) {
      return NextResponse.json(
        { error: 'المحادثة غير موجودة' },
        { status: 404 }
      );
    }

    // Update conversation
    mockConversations[conversationIndex] = {
      ...mockConversations[conversationIndex],
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: mockConversations[conversationIndex],
      message: 'تم تحديث المحادثة بنجاح',
    });

  } catch (error) {
    console.error('خطأ في تحديث المحادثة:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'بيانات غير صحيحة', 
          details: error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'خطأ في تحديث المحادثة' },
      { status: 500 }
    );
  }
}

// DELETE handler - Archive or delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    
    // Find conversation
    const conversationIndex = mockConversations.findIndex(conv => conv.id === conversationId);
    
    if (conversationIndex === -1) {
      return NextResponse.json(
        { error: 'المحادثة غير موجودة' },
        { status: 404 }
      );
    }

    // Soft delete - mark as archived instead of actually deleting
    mockConversations[conversationIndex] = {
      ...mockConversations[conversationIndex],
      status: 'archived' as const,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'تم أرشفة المحادثة بنجاح',
    });

  } catch (error) {
    console.error('خطأ في أرشفة المحادثة:', error);
    return NextResponse.json(
      { error: 'خطأ في أرشفة المحادثة' },
      { status: 500 }
    );
  }
}