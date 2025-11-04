import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// مخطط التحقق من المعاملات
const dashboardQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'quarter', 'year']).default('month'),
  date: z.string().optional(),
})

// بيانات وهمية للـ KPIs
const mockKPIs = {
  totalLeads: 2847,
  totalLeadsChange: 12.5,
  convertedLeads: 892,
  conversionRate: 31.4,
  conversionRateChange: 2.1,
  totalRevenue: 2847500,
  revenueChange: 18.3,
  averageDealSize: 3192,
  dealSizeChange: -5.2,
  activeTasks: 156,
  tasksChange: -8.7,
  responseTime: 2.4,
  responseTimeChange: -12.3,
}

// دالة لإنشاء بيانات مولدة عشوائياً
function generateMockData(period: string) {
  const now = new Date()
  const days = period === 'today' ? 1 : period === 'week' ? 7 : 
               period === 'month' ? 30 : period === 'quarter' ? 90 : 365

  const data = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    data.push({
      date: date.toISOString().split('T')[0],
      leads: Math.floor(Math.random() * 50) + 20,
      conversions: Math.floor(Math.random() * 15) + 5,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      tasks: Math.floor(Math.random() * 20) + 5,
    })
  }
  
  return data
}

// GET handler - جلب بيانات لوحة التحكم
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // التحقق من المعاملات
    const query = dashboardQuerySchema.parse({
      period: searchParams.get('period') || 'month',
      date: searchParams.get('date') || undefined,
    })

    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))

    // إنشاء البيانات الوهمية
    const trendData = generateMockData(query.period)
    const currentKPIs = {
      ...mockKPIs,
      generatedAt: new Date().toISOString(),
      period: query.period,
    }

    // حساب الاتجاهات
    const previousPeriodData = trendData.slice(0, Math.floor(trendData.length / 2))
    const currentPeriodData = trendData.slice(Math.floor(trendData.length / 2))
    
    const calculateTrend = (current: number[], previous: number[]) => {
      const currentSum = current.reduce((sum, item) => sum + item, 0)
      const previousSum = previous.reduce((sum, item) => sum + item, 0)
      return previousSum === 0 ? 0 : ((currentSum - previousSum) / previousSum) * 100
    }

    return NextResponse.json({
      success: true,
      data: {
        kpis: currentKPIs,
        trendData,
        summary: {
          totalPeriodDays: trendData.length,
          averageDailyLeads: Math.round(trendData.reduce((sum, day) => sum + day.leads, 0) / trendData.length),
          averageDailyRevenue: Math.round(trendData.reduce((sum, day) => sum + day.revenue, 0) / trendData.length),
          topPerformingDay: trendData.reduce((best, day) => 
            day.revenue > best.revenue ? day : best, trendData[0]
          ),
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        period: query.period,
        cached: false,
      }
    })

  } catch (error) {
    console.error('خطأ في جلب بيانات لوحة التحكم:', error)
    
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