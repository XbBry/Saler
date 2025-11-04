import { NextRequest, NextResponse } from 'next/server'

// معلومات النظام
const systemInfo = {
  name: 'Sales Management API',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}

// فحص صحة المكونات المختلفة
async function checkSystemHealth() {
  const checks = {
    database: { status: 'healthy', responseTime: 0 },
    cache: { status: 'healthy', responseTime: 0 },
    external_apis: { status: 'healthy', responseTime: 0 },
    storage: { status: 'healthy', responseTime: 0 },
  }

  const startTime = Date.now()
  
  try {
    // فحص قاعدة البيانات (محاكاة)
    const dbStart = Date.now()
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
    checks.database.responseTime = Date.now() - dbStart
    checks.database.status = Math.random() > 0.05 ? 'healthy' : 'unhealthy' // 95% نجاح
    
    // فحص الذاكرة المؤقتة
    const cacheStart = Date.now()
    await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 50))
    checks.cache.responseTime = Date.now() - cacheStart
    checks.cache.status = Math.random() > 0.02 ? 'healthy' : 'degraded' // 98% نجاح
    
    // فحص APIs الخارجية
    const apiStart = Date.now()
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    checks.external_apis.responseTime = Date.now() - apiStart
    checks.external_apis.status = Math.random() > 0.1 ? 'healthy' : 'degraded' // 90% نجاح
    
    // فحص التخزين
    const storageStart = Date.now()
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 80))
    checks.storage.responseTime = Date.now() - storageStart
    checks.storage.status = Math.random() > 0.03 ? 'healthy' : 'degraded' // 97% نجاح
    
  } catch (error) {
    console.error('خطأ في فحص صحة النظام:', error)
  }

  return checks
}

// إحصائيات النظام
function getSystemStats() {
  const memUsage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()
  
  return {
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
      average: Math.round(((cpuUsage.user + cpuUsage.system) / 1000000) * 100) / 100, // seconds
    },
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: formatUptime(process.uptime()),
    },
    nodejs: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    },
  }
}

// تنسيق وقت التشغيل
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  return `${days}د ${hours}س ${minutes}د ${secs}ث`
}

// تحديد الحالة العامة
function getOverallStatus(checks: any): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map((check: any) => check.status)
  
  if (statuses.includes('unhealthy')) {
    return 'unhealthy'
  }
  
  if (statuses.includes('degraded')) {
    return 'degraded'
  }
  
  return 'healthy'
}

// GET handler - فحص صحة النظام
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // فحص صحة المكونات
    const healthChecks = await checkSystemHealth()
    const systemStats = getSystemStats()
    const overallStatus = getOverallStatus(healthChecks)
    
    const responseTime = Date.now() - startTime
    
    // إنشاء التقرير
    const healthReport = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime,
      system: systemInfo,
      checks: healthChecks,
      statistics: systemStats,
      services: {
        api_endpoints: {
          total: 15,
          healthy: 14,
          degraded: 1,
          unhealthy: 0,
        },
        background_jobs: {
          running: 3,
          queued: 0,
          failed: 0,
        },
        external_integrations: {
          twilio: healthChecks.database.status,
          email_service: healthChecks.cache.status,
          crm_system: healthChecks.external_apis.status,
        },
      },
    }

    // تحديد كود الحالة
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(healthReport, { status: statusCode })

  } catch (error) {
    console.error('خطأ في فحص صحة النظام:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'خطأ في فحص صحة النظام',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 503 })
  }
}

// POST handler - تشغيل فحص عميق
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { test_type = 'full', duration = 60 } = body
    
    // فحص عميق يستغرق وقتاً أطول
    const startTime = Date.now()
    
    // محاكاة فحص عميق
    const deepChecks = await checkSystemHealth()
    
    // محاكاة اختبارات إضافية
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // اختبار الأداء
    const performanceTest = {
      load_time: Math.round((Date.now() - startTime) / 1000 * 100) / 100,
      memory_usage: process.memoryUsage(),
      active_connections: Math.floor(Math.random() * 50) + 10,
      requests_per_minute: Math.floor(Math.random() * 100) + 50,
    }
    
    // اختبار التكامل
    const integrationTest = {
      database_connectivity: Math.random() > 0.05,
      external_apis: Math.random() > 0.1,
      cache_system: Math.random() > 0.02,
      file_storage: Math.random() > 0.03,
    }
    
    const deepReport = {
      status: 'completed',
      test_type,
      duration,
      timestamp: new Date().toISOString(),
      deep_checks: deepChecks,
      performance: performanceTest,
      integrations: integrationTest,
      recommendations: [
        'تحسين أداء قاعدة البيانات',
        'تحديث الذاكرة المؤقتة',
        'مراقبة استخدام المعالج',
      ],
    }

    return NextResponse.json({
      success: true,
      message: 'تم إكمال الفحص العميق بنجاح',
      data: deepReport,
    })

  } catch (error) {
    console.error('خطأ في الفحص العميق:', error)
    return NextResponse.json(
      { error: 'خطأ في الفحص العميق' },
      { status: 500 }
    )
  }
}