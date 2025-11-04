import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// مخطط التحقق من تحديث المهمة
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  leadId: z.string().optional(),
})

// دالة للعثور على المهمة (في التطبيق الحقيقي ستكون من قاعدة البيانات)
function findTask(taskId: string) {
  // محاكاة قاعدة البيانات
  const tasks = [
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
  ]
  
  return tasks.find(task => task.id === taskId)
}

// GET handler - جلب مهمة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id
    
    // البحث عن المهمة
    const task = findTask(taskId)
    
    if (!task) {
      return NextResponse.json(
        { error: 'المهمة غير موجودة' },
        { status: 404 }
      )
    }

    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))

    // حساب الحالة والوقت المتبقي
    const now = new Date()
    const dueDate = task.dueDate ? new Date(task.dueDate) : null
    const isOverdue = dueDate && task.status !== 'completed' && dueDate < now
    const timeRemaining = dueDate ? dueDate.getTime() - now.getTime() : null

    const taskWithMeta = {
      ...task,
      isOverdue: !!isOverdue,
      timeRemaining: timeRemaining ? Math.max(0, timeRemaining) : null,
      progress: task.estimatedHours > 0 
        ? Math.min((task.actualHours / task.estimatedHours) * 100, 100)
        : 0,
      formattedDueDate: dueDate ? dueDate.toLocaleDateString('ar-SA') : null,
      statusText: {
        todo: 'قائمة الانتظار',
        in_progress: 'قيد التنفيذ',
        completed: 'مكتملة',
        cancelled: 'ملغية'
      }[task.status],
      priorityText: {
        low: 'منخفضة',
        medium: 'متوسطة',
        high: 'عالية',
        urgent: 'عاجلة'
      }[task.priority],
    }

    return NextResponse.json({
      success: true,
      data: taskWithMeta,
      meta: {
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('خطأ في جلب المهمة:', error)
    return NextResponse.json(
      { error: 'خطأ في جلب المهمة' },
      { status: 500 }
    )
  }
}

// PUT handler - تحديث مهمة محددة
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id
    const body = await request.json()
    
    // التحقق من البيانات
    const validatedData = updateTaskSchema.parse(body)
    
    // البحث عن المهمة
    const task = findTask(taskId)
    
    if (!task) {
      return NextResponse.json(
        { error: 'المهمة غير موجودة' },
        { status: 404 }
      )
    }

    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))

    // تحديث المهمة
    const updatedTask = {
      ...task,
      ...validatedData,
      updatedAt: new Date().toISOString(),
    }

    // إضافة سجل للتغييرات
    const changes: string[] = []
    Object.keys(validatedData).forEach(key => {
      const oldValue = task[key as keyof typeof task]
      const newValue = validatedData[key as keyof typeof validatedData]
      if (oldValue !== newValue) {
        changes.push(`تغيير ${key} من "${oldValue}" إلى "${newValue}"`)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تم تحديث المهمة بنجاح',
      data: {
        task: updatedTask,
        changes,
        updatedAt: new Date().toISOString(),
      },
    })

  } catch (error) {
    console.error('خطأ في تحديث المهمة:', error)
    
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
      { error: 'خطأ في تحديث المهمة' },
      { status: 500 }
    )
  }
}

// DELETE handler - حذف مهمة
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id
    
    // البحث عن المهمة
    const task = findTask(taskId)
    
    if (!task) {
      return NextResponse.json(
        { error: 'المهمة غير موجودة' },
        { status: 404 }
      )
    }

    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))

    // في التطبيق الحقيقي، سيتم حذف المهمة من قاعدة البيانات هنا
    
    return NextResponse.json({
      success: true,
      message: 'تم حذف المهمة بنجاح',
      data: {
        deletedTaskId: taskId,
        deletedAt: new Date().toISOString(),
      },
    })

  } catch (error) {
    console.error('خطأ في حذف المهمة:', error)
    return NextResponse.json(
      { error: 'خطأ في حذف المهمة' },
      { status: 500 }
    )
  }
}