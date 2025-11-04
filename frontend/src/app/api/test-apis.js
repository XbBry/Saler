// اختبار API Routes
// يمكن تشغيل هذا الملف لفحص جميع APIs

const API_BASE_URL = 'http://localhost:3000/api'

// دالة مساعدة لاختبار API
async function testAPI(endpoint: string, options: any = {}) {
  try {
    console.log(`🧪 اختبار: ${endpoint}`)
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ نجح: ${endpoint}`)
      console.log(`📊 البيانات:`, JSON.stringify(data, null, 2))
      return { success: true, data, status: response.status }
    } else {
      console.log(`❌ فشل: ${endpoint}`)
      console.log(`📊 الخطأ:`, JSON.stringify(data, null, 2))
      return { success: false, data, status: response.status }
    }
    
  } catch (error) {
    console.log(`💥 خطأ في الشبكة: ${endpoint}`)
    console.error(error)
    return { success: false, error: error.message }
  }
}

// قائمة الاختبارات
const tests = [
  // فحص الصحة
  {
    name: 'فحص صحة النظام',
    endpoint: '/health',
    method: 'GET',
  },
  
  // التحليلات - لوحة التحكم
  {
    name: 'بيانات لوحة التحكم - شهري',
    endpoint: '/analytics/dashboard?period=month',
    method: 'GET',
  },
  {
    name: 'بيانات لوحة التحكم - أسبوعي',
    endpoint: '/analytics/dashboard?period=week',
    method: 'GET',
  },
  {
    name: 'بيانات لوحة التحكم - يومي',
    endpoint: '/analytics/dashboard?period=today',
    method: 'GET',
  },
  
  // التحليلات - التقارير
  {
    name: 'تقرير العملاء المحتملين',
    endpoint: '/analytics/reports?type=leads&period=month&groupBy=week',
    method: 'GET',
  },
  {
    name: 'تقرير الإيرادات',
    endpoint: '/analytics/reports?type=revenue&period=quarter&groupBy=month',
    method: 'GET',
  },
  {
    name: 'تقرير الأداء',
    endpoint: '/analytics/reports?type=performance&period=week&groupBy=day',
    method: 'GET',
  },
  
  // التحليلات المتقدمة
  {
    name: 'تحليل العملاء المحتملين',
    endpoint: '/analytics/advanced?metric=leads&timeframe=monthly&period=30d',
    method: 'GET',
  },
  {
    name: 'تحليل التحويلات - أسبوعي',
    endpoint: '/analytics/advanced?metric=conversions&timeframe=weekly&period=30d',
    method: 'GET',
  },
  {
    name: 'تحليل رضا العملاء',
    endpoint: '/analytics/advanced?metric=customer_satisfaction&timeframe=monthly&period=90d',
    method: 'GET',
  },
  
  // المهام
  {
    name: 'جلب جميع المهام',
    endpoint: '/tasks',
    method: 'GET',
  },
  {
    name: 'فلترة المهام - قيد التنفيذ',
    endpoint: '/tasks?status=in_progress&limit=5',
    method: 'GET',
  },
  {
    name: 'بحث في المهام',
    endpoint: '/tasks?search=عميل&priority=high',
    method: 'GET',
  },
  {
    name: 'مهمة محددة',
    endpoint: '/tasks/task_001',
    method: 'GET',
  },
  {
    name: 'إنشاء مهمة جديدة',
    endpoint: '/tasks',
    method: 'POST',
    body: {
      title: 'مهمة اختبار',
      description: 'هذه مهمة اختبار للتأكد من عمل API',
      priority: 'medium',
      status: 'todo',
      estimatedHours: 2,
      tags: ['test', 'api'],
    },
  },
  {
    name: 'تحديث مهمة',
    endpoint: '/tasks/task_001',
    method: 'PUT',
    body: {
      status: 'in_progress',
      actualHours: 1.5,
    },
  },
  
  // الرسائل
  {
    name: 'جلب جميع الرسائل',
    endpoint: '/messages',
    method: 'GET',
  },
  {
    name: 'فلترة الرسائل - SMS',
    endpoint: '/messages?type=sms&status=sent&limit=5',
    method: 'GET',
  },
  {
    name: 'إرسال رسالة جديدة - SMS',
    endpoint: '/messages',
    method: 'POST',
    body: {
      recipient: '+966501234567',
      content: 'مرحباً، هذه رسالة اختبار من نظام SALER',
      type: 'sms',
      priority: 'normal',
      tags: ['test', 'api'],
    },
  },
  {
    name: 'إرسال رسالة جديدة - إيميل',
    endpoint: '/messages',
    method: 'POST',
    body: {
      recipient: 'test@example.com',
      subject: 'رسالة اختبار',
      content: 'هذه رسالة اختبار من نظام إدارة المبيعات',
      type: 'email',
      priority: 'high',
    },
  },
]

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 بدء تشغيل اختبارات API Routes')
  console.log('=' .repeat(50))
  
  const results = {
    total: tests.length,
    passed: 0,
    failed: 0,
    errors: [],
  }
  
  for (const test of tests) {
    console.log(`\n📋 ${test.name}`)
    console.log('-' .repeat(30))
    
    const result = await testAPI(test.endpoint, {
      method: test.method,
      body: test.body,
    })
    
    if (result.success) {
      results.passed++
      console.log('🎉 نجح الاختبار')
    } else {
      results.failed++
      results.errors.push({
        test: test.name,
        endpoint: test.endpoint,
        status: result.status,
        error: result.data?.error || result.error,
      })
      console.log('💥 فشل الاختبار')
    }
    
    // تأخير بين الطلبات لتجنب الضغط على الخادم
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // طباعة التقرير النهائي
  console.log('\n' + '=' .repeat(50))
  console.log('📊 تقرير الاختبارات النهائي')
  console.log('=' .repeat(50))
  console.log(`✅ نجح: ${results.passed}/${results.total}`)
  console.log(`❌ فشل: ${results.failed}/${results.total}`)
  console.log(`📈 نسبة النجاح: ${Math.round((results.passed / results.total) * 100)}%`)
  
  if (results.errors.length > 0) {
    console.log('\n🚨 الأخطاء:')
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}`)
      console.log(`   Endpoint: ${error.endpoint}`)
      console.log(`   Status: ${error.status}`)
      console.log(`   Error: ${error.error}`)
      console.log()
    })
  }
  
  return results
}

// اختبار APIs الموجودة مسبقاً (اختبار الاتصال)
async function testExistingAPIs() {
  console.log('🔍 اختبار APIs الموجودة مسبقاً')
  console.log('-' .repeat(30))
  
  const existingTests = [
    {
      name: 'إعدادات الرسائل - GET',
      endpoint: '/messages/settings',
      method: 'GET',
    },
    {
      name: 'إعدادات الرسائل - POST (اختبار)',
      endpoint: '/messages/test',
      method: 'POST',
      body: {
        type: 'sms',
        config: {
          enabled: true,
          provider: 'twilio',
          accountSid: 'test',
          authToken: 'test',
          fromNumber: '+1234567890',
        },
      },
    },
  ]
  
  for (const test of existingTests) {
    console.log(`\n📋 ${test.name}`)
    const result = await testAPI(test.endpoint, {
      method: test.method,
      body: test.body,
    })
    
    if (result.success) {
      console.log('✅ APIs الموجودة تعمل بشكل صحيح')
    } else {
      console.log('⚠️  مشكلة في APIs الموجودة')
    }
  }
}

// تشغيل الاختبارات
if (require.main === module) {
  console.log('🎯 نظام اختبار API Routes لنظام SALER')
  console.log('📅 التاريخ:', new Date().toISOString())
  console.log('🌐 البيئة:', process.env.NODE_ENV || 'development')
  
  // تشغيل الاختبارات
  runAllTests().then(() => {
    console.log('\n🏁 انتهى اختبار جميع APIs')
  })
  
  // اختبار APIs الموجودة
  testExistingAPIs()
}

module.exports = {
  testAPI,
  runAllTests,
  testExistingAPIs,
  tests,
}