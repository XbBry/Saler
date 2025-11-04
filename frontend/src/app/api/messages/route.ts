import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// مخطط التحقق من بيانات الرسالة
const messageSchema = z.object({
  recipient: z.string().min(1, 'مستقبل الرسالة مطلوب'),
  content: z.string().min(1, 'محتوى الرسالة مطلوب'),
  type: z.enum(['sms', 'whatsapp', 'email', 'push']).default('sms'),
  subject: z.string().optional(), // للإيميل
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  scheduledTime: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.object({}).optional(),
})

// بيانات وهمية للرسائل
let mockMessages = [
  {
    id: 'msg_001',
    recipient: '+966501234567',
    content: 'مرحباً، نود إعلامكم بأن عرضكم جاهز للمراجعة',
    type: 'sms',
    status: 'sent',
    priority: 'normal',
    senderId: 'user_001',
    senderName: 'سارة أحمد',
    leadId: 'lead_001',
    scheduledTime: null,
    sentAt: '2025-11-03T10:30:00.000Z',
    deliveredAt: '2025-11-03T10:30:15.000Z',
    tags: ['welcome', 'quote'],
    metadata: {},
    createdAt: '2025-11-03T10:30:00.000Z',
    updatedAt: '2025-11-03T10:30:15.000Z',
  },
  {
    id: 'msg_002',
    recipient: 'ahmed@email.com',
    content: 'شكراً لتواصلكم معنا. سيتم الرد على استفساركم خلال 24 ساعة.',
    type: 'email',
    subject: 'رد على استفسارك',
    status: 'delivered',
    priority: 'high',
    senderId: 'user_002',
    senderName: 'محمد علي',
    leadId: 'lead_002',
    scheduledTime: null,
    sentAt: '2025-11-03T14:15:00.000Z',
    deliveredAt: '2025-11-03T14:15:03.000Z',
    tags: ['response', 'customer-service'],
    metadata: { emailTemplate: 'standard-response' },
    createdAt: '2025-11-03T14:15:00.000Z',
    updatedAt: '2025-11-03T14:15:03.000Z',
  },
  {
    id: 'msg_003',
    recipient: '+966507654321',
    content: '🎉 عرض خاص لفترة محدودة! خصم 20% على جميع خدماتنا',
    type: 'whatsapp',
    status: 'pending',
    priority: 'normal',
    senderId: 'user_003',
    senderName: 'فاطمة حسن',
    leadId: null,
    scheduledTime: '2025-11-04T09:00:00.000Z',
    sentAt: null,
    deliveredAt: null,
    tags: ['promotion', 'special-offer'],
    metadata: {},
    createdAt: '2025-11-03T16:45:00.000Z',
    updatedAt: '2025-11-03T16:45:00.000Z',
  },
  {
    id: 'msg_004',
    recipient: 'عميل_001',
    content: 'تم تأكيد موعد الاجتماع غداً في الساعة 10:00 صباحاً',
    type: 'push',
    status: 'failed',
    priority: 'normal',
    senderId: 'user_001',
    senderName: 'سارة أحمد',
    leadId: 'lead_003',
    scheduledTime: null,
    sentAt: '2025-11-03T18:20:00.000Z',
    deliveredAt: null,
    tags: ['reminder', 'meeting'],
    metadata: { pushToken: 'device_token_123' },
    createdAt: '2025-11-03T18:20:00.000Z',
    updatedAt: '2025-11-03T18:20:05.000Z',
    error: 'فشل في الإرسال - الجهاز غير متصل بالإنترنت',
  },
  {
    id: 'msg_005',
    recipient: 'client@company.com',
    content: 'نود دعوتكم لحضور معرض التجارة السنوي',
    type: 'email',
    subject: 'دعوة لحضور معرض التجارة',
    status: 'draft',
    priority: 'low',
    senderId: 'user_002',
    senderName: 'محمد علي',
    leadId: null,
    scheduledTime: null,
    sentAt: null,
    deliveredAt: null,
    tags: ['invitation', 'event'],
    metadata: { draftId: 'draft_456' },
    createdAt: '2025-11-02T11:00:00.000Z',
    updatedAt: '2025-11-02T11:00:00.000Z',
  },
]

// إحصائيات الرسائل
const getMessageStats = () => {
  const stats = {
    total: mockMessages.length,
    sent: 0,
    delivered: 0,
    pending: 0,
    failed: 0,
    draft: 0,
    byType: {
      sms: 0,
      whatsapp: 0,
      email: 0,
      push: 0,
    },
    responseRate: 0,
    averageDeliveryTime: 0,
  }

  let totalDeliveryTime = 0
  let deliveryCount = 0

  mockMessages.forEach(message => {
    // إحصائيات الحالة
    stats[message.status as keyof typeof stats]++
    
    // إحصائيات النوع
    stats.byType[message.type as keyof typeof stats.byType]++
    
    // حساب متوسط وقت التسليم
    if (message.sentAt && message.deliveredAt) {
      const sentTime = new Date(message.sentAt).getTime()
      const deliveredTime = new Date(message.deliveredAt).getTime()
      totalDeliveryTime += (deliveredTime - sentTime) / 1000 // بالثواني
      deliveryCount++
    }
  })

  stats.averageDeliveryTime = deliveryCount > 0 ? totalDeliveryTime / deliveryCount : 0

  return stats
}

// GET handler - جلب قائمة الرسائل
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const senderId = searchParams.get('senderId')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // فلترة الرسائل
    let filteredMessages = [...mockMessages]

    if (status) {
      filteredMessages = filteredMessages.filter(msg => msg.status === status)
    }
    if (type) {
      filteredMessages = filteredMessages.filter(msg => msg.type === type)
    }
    if (senderId) {
      filteredMessages = filteredMessages.filter(msg => msg.senderId === senderId)
    }
    if (search) {
      filteredMessages = filteredMessages.filter(msg => 
        msg.content.toLowerCase().includes(search.toLowerCase()) ||
        msg.recipient.toLowerCase().includes(search.toLowerCase()) ||
        msg.subject?.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (dateFrom) {
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.createdAt) >= new Date(dateFrom)
      )
    }
    if (dateTo) {
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.createdAt) <= new Date(dateTo)
      )
    }

    // ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
    filteredMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // تطبيق التصفح
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: {
        messages: paginatedMessages,
        pagination: {
          page,
          limit,
          total: filteredMessages.length,
          pages: Math.ceil(filteredMessages.length / limit),
        },
        stats: getMessageStats(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('خطأ في جلب الرسائل:', error)
    return NextResponse.json(
      { error: 'خطأ في جلب الرسائل' },
      { status: 500 }
    )
  }
}

// POST handler - إرسال رسالة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // التحقق من البيانات
    const validatedData = messageSchema.parse(body)

    // محاكاة إرسال الرسالة
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // محاكاة نسبة النجاح (90%)
    const success = Math.random() > 0.1
    
    // إنشاء رسالة جديدة
    const newMessage = {
      id: `msg_${Date.now()}`,
      ...validatedData,
      status: success ? 'sent' : 'failed',
      senderId: 'user_001', // في التطبيق الحقيقي من session
      senderName: 'مستخدم النظام',
      leadId: validatedData.metadata?.leadId || null,
      sentAt: success ? new Date().toISOString() : null,
      deliveredAt: success && Math.random() > 0.3 ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      error: success ? null : 'فشل في الإرسال - خطأ في الاتصال',
    }

    // إضافة الرسالة للقائمة
    mockMessages.unshift(newMessage)

    return NextResponse.json({
      success: true,
      message: success ? 'تم إرسال الرسالة بنجاح' : 'فشل في إرسال الرسالة',
      data: {
        message: newMessage,
        deliveryStatus: success ? 'sent' : 'failed',
      },
    })

  } catch (error) {
    console.error('خطأ في إرسال الرسالة:', error)
    
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
      )
    }

    return NextResponse.json(
      { error: 'خطأ في إرسال الرسالة' },
      { status: 500 }
    )
  }
}