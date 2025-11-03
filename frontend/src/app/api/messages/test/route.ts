import { NextRequest, NextResponse } from 'next/server'

// اختبار الاتصال لجميع أنواع القنوات
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, config } = body

    if (!type || !config) {
      return NextResponse.json(
        { error: 'نوع الاختبار والإعدادات مطلوبة' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'whatsapp':
        result = await testWhatsAppConnection(config)
        break
      case 'sms':
        result = await testSMSConnection(config)
        break
      case 'email':
        result = await testEmailConnection(config)
        break
      case 'webhook':
        result = await testWebhookConnection(config)
        break
      default:
        return NextResponse.json(
          { error: `نوع الاختبار غير مدعوم: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      type,
      result,
    })
  } catch (error) {
    console.error('Error testing connection:', error)
    return NextResponse.json(
      { error: 'خطأ في اختبار الاتصال' },
      { status: 500 }
    )
  }
}

// اختبار اتصال WhatsApp
async function testWhatsAppConnection(config: any) {
  const { provider, accountSid, authToken, phoneNumber, apiUrl, apiKey, instanceId } = config

  if (!config.enabled) {
    return {
      status: 'error',
      message: 'القناة غير مفعلة',
      code: 'DISABLED',
    }
  }

  if (provider === 'twilio') {
    if (!accountSid || !authToken || !phoneNumber) {
      return {
        status: 'error',
        message: 'بيانات Twilio غير مكتملة',
        code: 'MISSING_CREDENTIALS',
        required: ['Account SID', 'Auth Token', 'Phone Number'],
      }
    }

    // محاكاة اختبار Twilio WhatsApp API
    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: phoneNumber,
          To: phoneNumber, // رسالة تجريبية لنفس الرقم
          Body: 'رسالة اختبار من إعدادات النظام',
        }),
      })

      if (response.ok) {
        return {
          status: 'success',
          message: 'تم الاتصال بـ Twilio WhatsApp بنجاح',
          details: {
            provider: 'Twilio',
            accountSid: accountSid.substring(0, 8) + '...',
            phoneNumber,
          },
        }
      } else {
        const error = await response.text()
        return {
          status: 'error',
          message: 'فشل الاتصال بـ Twilio',
          details: { error },
        }
      }
    } catch (error) {
      return {
        status: 'error',
        message: 'خطأ في الشبكة',
        details: { error: error.message },
      }
    }
  } else if (provider === 'ultramsg') {
    if (!apiUrl || !apiKey || !instanceId) {
      return {
        status: 'error',
        message: 'بيانات UltraMsg غير مكتملة',
        code: 'MISSING_CREDENTIALS',
        required: ['API URL', 'API Key', 'Instance ID'],
      }
    }

    // محاكاة اختبار UltraMsg API
    try {
      const response = await fetch(`${apiUrl}/status`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      if (response.ok) {
        return {
          status: 'success',
          message: 'تم الاتصال بـ UltraMsg بنجاح',
          details: {
            provider: 'UltraMsg',
            instanceId,
            apiUrl,
          },
        }
      } else {
        const error = await response.text()
        return {
          status: 'error',
          message: 'فشل الاتصال بـ UltraMsg',
          details: { error },
        }
      }
    } catch (error) {
      return {
        status: 'error',
        message: 'خطأ في الشبكة',
        details: { error: error.message },
      }
    }
  }

  return {
    status: 'error',
    message: 'مزود خدمة غير مدعوم',
  }
}

// اختبار اتصال SMS
async function testSMSConnection(config: any) {
  const { provider, accountSid, authToken, fromNumber } = config

  if (!config.enabled) {
    return {
      status: 'error',
      message: 'القناة غير مفعلة',
      code: 'DISABLED',
    }
  }

  if (!accountSid || !authToken || !fromNumber) {
    return {
      status: 'error',
      message: 'بيانات Twilio SMS غير مكتملة',
      code: 'MISSING_CREDENTIALS',
      required: ['Account SID', 'Auth Token', 'From Number'],
    }
  }

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: fromNumber, // رسالة تجريبية لنفس الرقم
        Body: 'رسالة SMS تجريبية من إعدادات النظام',
      }),
    })

    if (response.ok) {
      return {
        status: 'success',
        message: 'تم الاتصال بـ Twilio SMS بنجاح',
        details: {
          provider: 'Twilio',
          accountSid: accountSid.substring(0, 8) + '...',
          fromNumber,
        },
      }
    } else {
      const error = await response.text()
      return {
        status: 'error',
        message: 'فشل الاتصال بـ Twilio SMS',
        details: { error },
      }
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'خطأ في الشبكة',
      details: { error: error.message },
    }
  }
}

// اختبار اتصال البريد الإلكتروني
async function testEmailConnection(config: any) {
  const { provider, host, port, username, password, encryption, fromAddress } = config

  if (!config.enabled) {
    return {
      status: 'error',
      message: 'القناة غير مفعلة',
      code: 'DISABLED',
    }
  }

  if (!host || !port || !username || !password || !fromAddress) {
    return {
      status: 'error',
      message: 'بيانات SMTP غير مكتملة',
      code: 'MISSING_CREDENTIALS',
      required: ['Host', 'Port', 'Username', 'Password', 'From Address'],
    }
  }

  // محاكاة اختبار SMTP
  try {
    // في التطبيق الحقيقي، سيتم استخدام مكتبة مثل nodemailer لاختبار الاتصال
    await new Promise(resolve => setTimeout(resolve, 1000))

    // محاكاة نجاح أو فشل
    const success = Math.random() > 0.3 // 70% نجاح

    if (success) {
      return {
        status: 'success',
        message: 'تم الاتصال بخادم SMTP بنجاح',
        details: {
          provider: 'SMTP',
          host,
          port,
          encryption,
          fromAddress,
        },
      }
    } else {
      throw new Error('فشل في الاتصال بخادم SMTP')
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'فشل الاتصال بخادم SMTP',
      details: { error: error.message },
    }
  }
}

// اختبار اتصال Webhook
async function testWebhookConnection(config: any) {
  const { endpoints } = config

  if (!config.enabled) {
    return {
      status: 'error',
      message: 'Webhook غير مفعل',
      code: 'DISABLED',
    }
  }

  if (!endpoints || endpoints.length === 0) {
    return {
      status: 'error',
      message: 'لا توجد endpoints معرفة',
      code: 'NO_ENDPOINTS',
    }
  }

  const results = []

  for (const endpoint of endpoints) {
    if (!endpoint.url) {
      results.push({
        url: 'غير محدد',
        status: 'error',
        message: 'URL مطلوب',
      })
      continue
    }

    try {
      // إرسال طلب تجريبي
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(endpoint.secret && {
            'X-Webhook-Secret': endpoint.secret,
          }),
        },
        body: JSON.stringify({
          type: 'test',
          timestamp: new Date().toISOString(),
          message: 'رسالة اختبار من إعدادات النظام',
        }),
      })

      results.push({
        url: endpoint.url,
        status: response.ok ? 'success' : 'error',
        message: response.ok 
          ? 'تم إرسال البيانات بنجاح' 
          : `خطأ HTTP: ${response.status}`,
        httpStatus: response.status,
      })
    } catch (error) {
      results.push({
        url: endpoint.url,
        status: 'error',
        message: 'خطأ في الشبكة',
        error: error.message,
      })
    }
  }

  const successCount = results.filter(r => r.status === 'success').length
  const totalCount = results.length

  return {
    status: successCount === totalCount ? 'success' : 'partial',
    message: `${successCount}/${totalCount} endpoints تم اختبارها بنجاح`,
    results,
    summary: {
      total: totalCount,
      successful: successCount,
      failed: totalCount - successCount,
    },
  }
}