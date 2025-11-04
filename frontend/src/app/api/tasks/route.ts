import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// مخطط التحقق من بيانات المهمة
const taskSchema = z.object({
  title: z.string().min(1, 'عنوان المهمة مطلوب'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).default('todo'),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  leadId: z.string().optional(),
})

// بيانات وهمية للمهام
let mockTasks = [
  {
    id: 'task_001',
    title: 'متابعة العميل المحتمل - أحمد محمد',
    description: 'التواصل مع العميل المحتمل لمناقشة التفاصيل النهائية',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2025-11-05T14:00:00.000Z',
    assigneeId: 'user_001',
    assigneeName: 'سارة أحمد',
    tags: ['follow-up', 'hot-lead'],
    estimatedHours: 2,
    actualHours: 1.5,
    leadId: 'lead_001',
    createdAt: '2025-11-01T09:00:00.000Z',
    updatedAt: '2025-11-03T15:30:00.000Z',
  },
  {
    id: 'task_002',
    title: 'إعداد عرض سعر - مشروع التقنية',
    description: 'تحضير عرض سعر تفصيلي لمشروع تطوير التطبيق',
    priority: 'medium',
    status: 'todo',
    dueDate: '2025-11-06T16:00:00.000Z',
    assigneeId: 'user_002',
    assigneeName: 'محمد علي',
    tags: ['quote', 'development'],
    estimatedHours: 4,
    actualHours: 0,
    leadId: 'lead_002',
    createdAt: '2025-11-02T10:00:00.000Z',
    updatedAt: '2025-11-02T10:00:00.000Z',
  },
  {
    id: 'task_003',
    title: 'اتصال مع عميل - شركة المستقبل',
    description: 'مناقشة متطلبات المشروع الجديد',
    priority: 'urgent',
    status: 'todo',
    dueDate: '2025-11-04T11:00:00.000Z',
    assigneeId: 'user_003',
    assigneeName: 'فاطمة حسن',
    tags: ['call', 'new-project'],
    estimatedHours: 1,
    actualHours: 0,
    leadId: 'lead_003',
    createdAt: '2025-11-03T08:00:00.000Z',
    updatedAt: '2025-11-03T08:00:00.000Z',
  },
  {
    id: 'task_004',
    title: 'مراجعة العقد - خدمة الاستضافة',
    description: 'مراجعة الشروط والأحكام لخدمة الاستضافة الجديدة',
    priority: 'medium',
    status: 'completed',
    dueDate: '2025-11-03T17:00:00.000Z',
    assigneeId: 'user_001',
    assigneeName: 'سارة أحمد',
    tags: ['contract', 'hosting'],
    estimatedHours: 2,
    actualHours: 1.5,
    leadId: null,
    createdAt: '2025-11-01T14:00:00.000Z',
    updatedAt: '2025-11-03T16:45:00.000Z',
  },
  {
    id: 'task_005',
    title: 'إعداد عرض تقديمي - معرض التجارة',
    description: 'تحضير العرض التقديمي لمعرض التجارة السنوي',
    priority: 'low',
    status: 'cancelled',
    dueDate: '2025-11-10T12:00:00.000Z',
    assigneeId: 'user_002',
    assigneeName: 'محمد علي',
    tags: ['presentation', 'event'],
    estimatedHours: 8,
    actualHours: 0,
    leadId: null,
    createdAt: '2025-10-28T09:00:00.000Z',
    updatedAt: '2025-11-02T11:30:00.000Z',
  },
]

// إحصائيات المهام
const getTaskStats = () => {
  const stats = {
    total: mockTasks.length,
    todo: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0,
    completedThisWeek: 0,
    completedThisMonth: 0,
  }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  mockTasks.forEach(task => {
    // إحصائيات الحالة
    stats[task.status as keyof typeof stats]++
    
    // المهام المتأخرة
    if (task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < now) {
      stats.overdue++
    }
    
    // المهام المكتملة هذا الأسبوع
    if (task.status === 'completed' && new Date(task.updatedAt) > weekAgo) {
      stats.completedThisWeek++
    }
    
    // المهام المكتملة هذا الشهر
    if (task.status === 'completed' && new Date(task.updatedAt) > monthAgo) {
      stats.completedThisMonth++
    }
  })

  return stats
}

// GET handler - جلب قائمة المهام
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assigneeId = searchParams.get('assigneeId')
    const search = searchParams.get('search')

    // فلترة المهام
    let filteredTasks = [...mockTasks]

    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status)
    }
    if (priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === priority)
    }
    if (assigneeId) {
      filteredTasks = filteredTasks.filter(task => task.assigneeId === assigneeId)
    }
    if (search) {
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // ترتيب حسب تاريخ التحديث (الأحدث أولاً)
    filteredTasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    // تطبيق التصفح
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: {
        tasks: paginatedTasks,
        pagination: {
          page,
          limit,
          total: filteredTasks.length,
          pages: Math.ceil(filteredTasks.length / limit),
        },
        stats: getTaskStats(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('خطأ في جلب المهام:', error)
    return NextResponse.json(
      { error: 'خطأ في جلب المهام' },
      { status: 500 }
    )
  }
}

// POST handler - إنشاء مهمة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // التحقق من البيانات
    const validatedData = taskSchema.parse(body)

    // إنشاء مهمة جديدة
    const newTask = {
      id: `task_${Date.now()}`,
      ...validatedData,
      assigneeName: validatedData.assigneeId ? 'مستخدم' : null,
      estimatedHours: validatedData.estimatedHours || 0,
      actualHours: 0,
      leadId: validatedData.leadId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // إضافة المهمة للقائمة
    mockTasks.unshift(newTask)

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المهمة بنجاح',
      data: newTask,
    })

  } catch (error) {
    console.error('خطأ في إنشاء المهمة:', error)
    
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
      { error: 'خطأ في إنشاء المهمة' },
      { status: 500 }
    )
  }
}