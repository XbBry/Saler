import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// مخطط التحقق من معاملات التقرير
const reportQuerySchema = z.object({
  type: z.enum(['leads', 'conversions', 'revenue', 'tasks', 'performance']),
  period: z.enum(['today', 'week', 'month', 'quarter', 'year']).default('month'),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  filters: z.string().optional(), // JSON string for complex filters
})

// أنواع التقارير المدعومة
const reportTypes = {
  leads: {
    title: 'تقرير العملاء المحتملين',
    description: 'تحليل شامل للعملاء المحتملين',
    metrics: ['totalLeads', 'newLeads', 'qualifiedLeads', 'leadSources', 'conversionFunnel'],
  },
  conversions: {
    title: 'تقرير التحويلات',
    description: 'تتبع معدلات التحويل والأداء',
    metrics: ['conversionRate', 'totalConversions', 'timeToConversion', 'conversionSources'],
  },
  revenue: {
    title: 'تقرير الإيرادات',
    description: 'تحليل الإيرادات والصفقات',
    metrics: ['totalRevenue', 'averageDealSize', 'revenueGrowth', 'pipelineValue'],
  },
  tasks: {
    title: 'تقرير المهام',
    description: 'إدارة المهام والإنتاجية',
    metrics: ['totalTasks', 'completedTasks', 'overdueTasks', 'averageCompletionTime'],
  },
  performance: {
    title: 'تقرير الأداء',
    description: 'مؤشرات الأداء الرئيسية',
    metrics: ['responseTime', 'customerSatisfaction', 'teamProductivity', 'goalAchievement'],
  },
}

// دالة لإنشاء بيانات تقرير مولدة عشوائياً
function generateReportData(type: string, period: string, groupBy: string) {
  const baseValue = {
    leads: 100,
    conversions: 30,
    revenue: 100000,
    tasks: 50,
    performance: 75,
  }[type] || 50

  const data = []
  const now = new Date()
  
  let dateRange: Date[] = []
  if (groupBy === 'day') {
    const days = period === 'today' ? 1 : period === 'week' ? 7 : 30
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      dateRange.push(date)
    }
  } else if (groupBy === 'week') {
    const weeks = period === 'month' ? 4 : 12
    for (let i = weeks - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - (i * 7))
      dateRange.push(date)
    }
  } else {
    const months = period === 'year' ? 12 : 6
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      dateRange.push(date)
    }
  }

  dateRange.forEach((date, index) => {
    const variation = 0.3 // 30% variation
    const multiplier = 1 + (Math.sin(index * 0.5) * variation)
    const randomFactor = 0.7 + Math.random() * 0.6 // 0.7 to 1.3
    
    data.push({
      date: date.toISOString().split('T')[0],
      period: date.toLocaleDateString('ar-SA'),
      value: Math.round(baseValue * multiplier * randomFactor),
      target: Math.round(baseValue * 1.1), // 10% higher target
      change: Math.round(((Math.random() - 0.5) * 20) * 10) / 10, // -10% to +10%
      metrics: {
        leads: Math.round((baseValue * 0.8) * multiplier * randomFactor),
        conversions: Math.round((baseValue * 0.3) * multiplier * randomFactor),
        revenue: Math.round((baseValue * 1000) * multiplier * randomFactor),
        tasks: Math.round((baseValue * 0.5) * multiplier * randomFactor),
        performance: Math.round((baseValue * 0.7) * multiplier * randomFactor),
      },
    })
  })

  return data
}

// دالة لحساب الإحصائيات
function calculateStatistics(data: any[]) {
  const values = data.map(item => item.value)
  const total = values.reduce((sum, val) => sum + val, 0)
  const average = total / values.length
  
  const sortedValues = [...values].sort((a, b) => a - b)
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)]

  const min = Math.min(...values)
  const max = Math.max(...values)
  
  // حساب الانحراف المعياري
  const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length
  const standardDeviation = Math.sqrt(variance)

  return {
    total,
    average: Math.round(average),
    median,
    min,
    max,
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    count: values.length,
  }
}

// GET handler - جلب بيانات التقرير
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // التحقق من المعاملات
    const query = reportQuerySchema.parse({
      type: searchParams.get('type'),
      period: searchParams.get('period') || 'month',
      groupBy: searchParams.get('groupBy') || 'day',
      filters: searchParams.get('filters') || undefined,
    })

    if (!query.type) {
      return NextResponse.json(
        { error: 'نوع التقرير مطلوب' },
        { status: 400 }
      )
    }

    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))

    // إنشاء البيانات الوهمية
    const reportData = generateReportData(query.type, query.period, query.groupBy)
    const statistics = calculateStatistics(reportData)
    const reportConfig = reportTypes[query.type as keyof typeof reportTypes]

    return NextResponse.json({
      success: true,
      data: {
        type: query.type,
        title: reportConfig?.title || 'تقرير',
        description: reportConfig?.description || '',
        period: query.period,
        groupBy: query.groupBy,
        data: reportData,
        statistics,
        config: reportConfig,
      },
      meta: {
        timestamp: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        cached: false,
        version: '1.0',
      }
    })

  } catch (error) {
    console.error('خطأ في جلب بيانات التقرير:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'معاملات غير صحيحة', 
          details: error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    )
  }
}

// POST handler - إنشاء تقرير مخصص
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // التحقق من البيانات المرسلة
    if (!body.name || !body.type || !body.config) {
      return NextResponse.json(
        { error: 'بيانات التقرير غير مكتملة' },
        { status: 400 }
      )
    }

    // محاكاة إنشاء التقرير
    await new Promise(resolve => setTimeout(resolve, 1000))

    const customReport = {
      id: `report_${Date.now()}`,
      name: body.name,
      type: body.type,
      config: body.config,
      createdAt: new Date().toISOString(),
      status: 'completed',
      data: generateReportData(body.type, body.config.period || 'month', body.config.groupBy || 'day'),
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء التقرير بنجاح',
      data: customReport,
    })

  } catch (error) {
    console.error('خطأ في إنشاء التقرير:', error)
    return NextResponse.json(
      { error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    )
  }
}