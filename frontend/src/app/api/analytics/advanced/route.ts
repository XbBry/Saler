import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// مخطط التحقق من معاملات التحليل
const analyticsQuerySchema = z.object({
  metric: z.enum(['leads', 'conversions', 'revenue', 'performance', 'customer_satisfaction']).default('leads'),
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).default('monthly'),
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  compare: z.string().optional(), // فترة للمقارنة
})

// أنواع التحليلات المدعومة
const analyticsTypes = {
  leads: {
    title: 'تحليل العملاء المحتملين',
    description: 'تحليل شامل للعملاء المحتملين ومصادرهم',
    metrics: ['newLeads', 'qualifiedLeads', 'leadSources', 'conversionRate', 'leadQuality'],
    insights: [
      'أفضل مصادر العملاء المحتملين',
      'توزيع العملاء حسب المنطقة',
      'معدل التأهيل الشهري',
      'وقت التحويل المتوسط',
    ],
  },
  conversions: {
    title: 'تحليل التحويلات',
    description: 'تتبع مسارات التحويل ونقاط الانسحاب',
    metrics: ['conversionFunnel', 'abandonmentRate', 'conversionTime', 'successfulConversions'],
    insights: [
      'نقاط الانسحاب الرئيسية',
      'مسارات التحويل الأكثر فعالية',
      'معدل التحويل حسب القناة',
      'تحسين معدلات التحويل',
    ],
  },
  revenue: {
    title: 'تحليل الإيرادات',
    description: 'تحليل الإيرادات والنمو المالي',
    metrics: ['totalRevenue', 'revenueGrowth', 'averageDealSize', 'revenuePerLead'],
    insights: [
      'الاتجاهات المالية الشهرية',
      'توزيع الصفقات حسب القيمة',
      'معدلات النمو السنوية',
      'الأداء المالي حسب الفريق',
    ],
  },
  performance: {
    title: 'تحليل الأداء',
    description: 'مؤشرات الأداء والإنتاجية',
    metrics: ['responseTime', 'taskCompletion', 'goalAchievement', 'productivityScore'],
    insights: [
      'أداء الفريق الفردي',
      'مؤشرات الإنتاجية',
      'أوقات الاستجابة',
      'تحقيق الأهداف الشهرية',
    ],
  },
  customer_satisfaction: {
    title: 'رضا العملاء',
    description: 'قياس وتحليل رضا العملاء',
    metrics: ['satisfactionScore', 'nps', 'responseRate', 'complaintResolution'],
    insights: [
      'تقييمات العملاء الشهرية',
      'مؤشر صافي المروجين (NPS)',
      'معدلات الشكاوى والحلول',
      'تحسين تجربة العملاء',
    ],
  },
}

// دالة لإنشاء بيانات تحليل مولدة عشوائياً
function generateAnalyticsData(metric: string, timeframe: string, period: string) {
  const data = []
  const now = new Date()
  
  let dateInterval: number
  let dataPoints: number
  
  switch (timeframe) {
    case 'daily':
      dateInterval = 24 * 60 * 60 * 1000 // يوم واحد بالميلي ثانية
      dataPoints = period === '7d' ? 7 : period === '30d' ? 30 : 90
      break
    case 'weekly':
      dateInterval = 7 * 24 * 60 * 60 * 1000 // أسبوع
      dataPoints = period === '30d' ? 4 : 12
      break
    case 'monthly':
      dateInterval = 30 * 24 * 60 * 60 * 1000 // شهر
      dataPoints = period === '90d' ? 3 : 12
      break
    case 'quarterly':
      dateInterval = 90 * 24 * 60 * 60 * 1000 // ربع سنة
      dataPoints = 4
      break
    default:
      dateInterval = 24 * 60 * 60 * 1000
      dataPoints = 30
  }
  
  // القيم الأساسية حسب نوع التحليل
  const baseValues = {
    leads: { min: 50, max: 200, target: 150 },
    conversions: { min: 15, max: 60, target: 40 },
    revenue: { min: 50000, max: 200000, target: 120000 },
    performance: { min: 60, max: 95, target: 80 },
    customer_satisfaction: { min: 3.0, max: 5.0, target: 4.2 },
  }[metric] || { min: 50, max: 200, target: 100 }
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * dateInterval))
    
    // إنشاء بيانات واقعية مع اتجاهات
    const progress = i / dataPoints // من 0 إلى 1
    const seasonalVariation = Math.sin(progress * Math.PI * 2) * 0.2 // 20% تباين موسمي
    const trend = progress * 0.1 // اتجاه إيجابي 10%
    const randomVariation = (Math.random() - 0.5) * 0.3 // 30% تباين عشوائي
    
    const value = baseValues.target * (1 + seasonalVariation + trend + randomVariation)
    const clampedValue = Math.max(baseValues.min, Math.min(baseValues.max, value))
    
    // إضافة مقاييس إضافية حسب نوع التحليل
    const additionalMetrics: any = {}
    
    switch (metric) {
      case 'leads':
        additionalMetrics.qualified = Math.round(clampedValue * 0.4)
        additionalMetrics.converted = Math.round(clampedValue * 0.15)
        break
      case 'conversions':
        additionalMetrics.rate = Math.round((clampedValue / 100) * 10 * 10) / 10
        additionalMetrics.abandoned = Math.round(clampedValue * 2.5)
        break
      case 'revenue':
        additionalMetrics.growth = Math.round((Math.random() - 0.3) * 20 * 10) / 10
        additionalMetrics.deals = Math.round(clampedValue / 1000)
        break
      case 'performance':
        additionalMetrics.goals = Math.round(clampedValue / 10)
        additionalMetrics.tasks = Math.round(clampedValue * 1.5)
        break
      case 'customer_satisfaction':
        additionalMetrics.responses = Math.round(clampedValue * 20)
        additionalMetrics.nps = Math.round((clampedValue - 3) * 50)
        break
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      period: date.toLocaleDateString('ar-SA', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      value: Math.round(clampedValue * 10) / 10,
      target: baseValues.target,
      change: Math.round((Math.random() - 0.4) * 20 * 10) / 10, // -8% إلى +12%
      ...additionalMetrics,
    })
  }
  
  return data
}

// دالة لحساب الإحصائيات المتقدمة
function calculateAdvancedStats(data: any[], metric: string) {
  const values = data.map(item => item.value)
  const total = values.reduce((sum, val) => sum + val, 0)
  const average = total / values.length
  
  // حساب الاتجاه العام (الانحدار الخطي البسيط)
  const n = values.length
  const xSum = (n * (n - 1)) / 2
  const xySum = values.reduce((sum, val, index) => sum + val * index, 0)
  const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6
  
  const slope = (n * xySum - xSum * total) / (n * xSquaredSum - xSum * xSum)
  const trend = slope > 0 ? 'متصاعد' : slope < 0 ? 'متنازل' : 'مستقر'
  
  // إحصائيات إضافية
  const sortedValues = [...values].sort((a, b) => a - b)
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)]
    
  const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length
  const standardDeviation = Math.sqrt(variance)
  const coefficientOfVariation = (standardDeviation / average) * 100
  
  return {
    total: Math.round(total * 10) / 10,
    average: Math.round(average * 10) / 10,
    median: Math.round(median * 10) / 10,
    min: Math.min(...values),
    max: Math.max(...values),
    standardDeviation: Math.round(standardDeviation * 10) / 10,
    coefficientOfVariation: Math.round(coefficientOfVariation * 10) / 10,
    trend,
    trendStrength: Math.abs(slope) > average * 0.01 ? 'قوي' : 
                   Math.abs(slope) > average * 0.005 ? 'متوسط' : 'ضعيف',
    periodCount: values.length,
    growthRate: values.length > 1 
      ? Math.round(((values[values.length - 1] - values[0]) / values[0]) * 1000) / 10
      : 0,
  }
}

// GET handler - جلب بيانات التحليلات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // التحقق من المعاملات
    const query = analyticsQuerySchema.parse({
      metric: searchParams.get('metric') || 'leads',
      timeframe: searchParams.get('timeframe') || 'monthly',
      period: searchParams.get('period') || '30d',
      compare: searchParams.get('compare') || undefined,
    })

    // محاكاة تأخير معالجة البيانات
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // إنشاء البيانات الأساسية
    const mainData = generateAnalyticsData(query.metric, query.timeframe, query.period)
    const mainStats = calculateAdvancedStats(mainData, query.metric)
    
    // إنشاء بيانات المقارنة إذا طُلبت
    let compareData = null
    let compareStats = null
    
    if (query.compare) {
      compareData = generateAnalyticsData(query.metric, query.timeframe, query.compare)
      compareStats = calculateAdvancedStats(compareData, query.metric)
    }

    const analyticsConfig = analyticsTypes[query.metric as keyof typeof analyticsTypes]

    return NextResponse.json({
      success: true,
      data: {
        metric: query.metric,
        title: analyticsConfig?.title || 'تحليل البيانات',
        description: analyticsConfig?.description || '',
        timeframe: query.timeframe,
        period: query.period,
        config: analyticsConfig,
        mainData,
        mainStats,
        compareData,
        compareStats,
        insights: analyticsConfig?.insights || [],
        // تحليلات إضافية
        advancedAnalytics: {
          outliers: mainData.filter(item => 
            Math.abs(item.value - mainStats.average) > mainStats.standardDeviation * 2
          ),
          correlations: [
            { metric1: 'conversions', metric2: 'revenue', correlation: 0.85 },
            { metric1: 'leads', metric2: 'performance', correlation: 0.72 },
          ],
          predictions: {
            nextPeriod: Math.round(mainStats.average * (1 + (mainStats.growthRate / 100)) * 10) / 10,
            confidence: 85,
          },
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        cached: false,
        version: '2.0',
        processingTime: Math.round(500 + Math.random() * 1000),
      }
    })

  } catch (error) {
    console.error('خطأ في جلب بيانات التحليلات:', error)
    
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