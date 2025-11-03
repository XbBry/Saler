'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface MessageSettings {
  language: string
  autoResponse: boolean
  workingHours: {
    enabled: boolean
    start: string
    end: string
    timezone: string
  }
  templates: {
    defaultWelcome: string
    defaultFarewell: string
    defaultFallback: string
  }
  delivery: {
    retryAttempts: number
    timeout: number
    priority: 'low' | 'normal' | 'high'
  }
}

interface ChannelSettings {
  whatsapp: {
    enabled: boolean
    provider: 'twilio' | 'ultramsg'
    accountSid?: string
    authToken?: string
    phoneNumber?: string
    apiUrl?: string
    apiKey?: string
    instanceId?: string
  }
  sms: {
    enabled: boolean
    provider: 'twilio'
    accountSid?: string
    authToken?: string
    fromNumber?: string
  }
  email: {
    enabled: boolean
    provider: 'smtp'
    host?: string
    port?: number
    username?: string
    password?: string
    encryption: 'tls' | 'ssl' | 'none'
    fromAddress?: string
  }
  webhook: {
    enabled: boolean
    endpoints: {
      url: string
      secret?: string
      events: string[]
    }[]
  }
}

interface IntegrationSettings {
  externalProviders: {
    [key: string]: {
      enabled: boolean
      apiKey?: string
      apiUrl?: string
      credentials: Record<string, string>
    }
  }
  apiKeys: {
    public: string
    private: string
    webhook: string
  }
  sync: {
    enabled: boolean
    interval: number
    autoSync: boolean
  }
}

interface NotificationSettings {
  inApp: boolean
  email: boolean
  sms: boolean
  push: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

interface AdvancedSettings {
  rateLimit: {
    enabled: boolean
    requestsPerMinute: number
    requestsPerHour: number
  }
  retryPolicy: {
    maxAttempts: number
    backoffMultiplier: number
    maxDelay: number
  }
  errorHandling: {
    logLevel: 'debug' | 'info' | 'warn' | 'error'
    alertOnFailure: boolean
    storeFailedMessages: boolean
  }
  logging: {
    enabled: boolean
    retention: number
    includeHeaders: boolean
    includePayload: boolean
  }
}

interface SettingsState {
  channels: ChannelSettings
  messages: MessageSettings
  integrations: IntegrationSettings
  notifications: NotificationSettings
  advanced: AdvancedSettings
}

const MessageSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    channels: {
      whatsapp: {
        enabled: false,
        provider: 'twilio',
      },
      sms: {
        enabled: false,
        provider: 'twilio',
      },
      email: {
        enabled: false,
        provider: 'smtp',
        encryption: 'tls',
        port: 587,
      },
      webhook: {
        enabled: false,
        endpoints: [],
      },
    },
    messages: {
      language: 'ar',
      autoResponse: false,
      workingHours: {
        enabled: false,
        start: '09:00',
        end: '17:00',
        timezone: 'Asia/Riyadh',
      },
      templates: {
        defaultWelcome: 'مرحباً بك! كيف يمكنني مساعدتك؟',
        defaultFarewell: 'شكراً لتواصلك معنا. نتمنى لك يوماً سعيداً!',
        defaultFallback: 'عذراً، لم أفهم طلبك. هل يمكنك إعادة صياغته؟',
      },
      delivery: {
        retryAttempts: 3,
        timeout: 30,
        priority: 'normal',
      },
    },
    integrations: {
      externalProviders: {},
      apiKeys: {
        public: '',
        private: '',
        webhook: '',
      },
      sync: {
        enabled: false,
        interval: 30,
        autoSync: false,
      },
    },
    notifications: {
      inApp: true,
      email: true,
      sms: false,
      push: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    },
    advanced: {
      rateLimit: {
        enabled: true,
        requestsPerMinute: 60,
        requestsPerHour: 1000,
      },
      retryPolicy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        maxDelay: 300,
      },
      errorHandling: {
        logLevel: 'info',
        alertOnFailure: true,
        storeFailedMessages: true,
      },
      logging: {
        enabled: true,
        retention: 30,
        includeHeaders: false,
        includePayload: true,
      },
    },
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({})
  const [activeTab, setActiveTab] = useState('channels')

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  // Track changes
  useEffect(() => {
    setHasChanges(true)
  }, [settings])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      // API call to load settings
      const response = await fetch('/api/messages/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/messages/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setHasChanges(false)
        // Show success message
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      // Show error message
    } finally {
      setIsSaving(false)
    }
  }

  const resetSettings = () => {
    loadSettings()
    setHasChanges(false)
  }

  const testConnection = async (type: string) => {
    setTestResults({ ...testResults, [type]: null })

    try {
      const response = await fetch('/api/messages/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          config: settings.channels[type as keyof typeof settings.channels],
        }),
      })

      if (response.ok) {
        setTestResults({ ...testResults, [type]: 'success' })
      } else {
        setTestResults({ ...testResults, [type]: 'error' })
      }
    } catch (error) {
      setTestResults({ ...testResults, [type]: 'error' })
    }
  }

  const updateSettings = (section: keyof SettingsState, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const updateNestedSettings = (section: keyof SettingsState, parent: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parent]: {
          ...(prev[section] as any)[parent],
          [field]: value,
        },
      },
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">إعدادات الرسائل والقنوات</h1>
              <p className="mt-2 text-gray-600">
                إدارة إعدادات القنوات والتكاملات لتطبيق الرسائل
              </p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Status Indicator */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className={`w-3 h-3 rounded-full ${hasChanges ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {hasChanges ? 'تغييرات غير محفوظة' : 'جميع التغييرات محفوظة'}
                </span>
              </div>

              {/* Action Buttons */}
              <Button
                variant="outline"
                onClick={resetSettings}
                disabled={!hasChanges || isSaving}
              >
                إعادة تعيين
              </Button>
              <Button
                onClick={saveSettings}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 space-x-reverse" aria-label="Tabs">
            {[
              { id: 'channels', name: 'إعدادات القنوات' },
              { id: 'messages', name: 'إعدادات الرسائل' },
              { id: 'integrations', name: 'التكاملات' },
              { id: 'notifications', name: 'الإشعارات' },
              { id: 'advanced', name: 'الإعدادات المتقدمة' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Channels Configuration */}
          {activeTab === 'channels' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* WhatsApp Settings */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">إعدادات WhatsApp</h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.channels.whatsapp.enabled}
                      onChange={(e) =>
                        updateNestedSettings('channels', 'whatsapp', 'enabled', e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">مفعل</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      مزود الخدمة
                    </label>
                    <select
                      value={settings.channels.whatsapp.provider}
                      onChange={(e) =>
                        updateNestedSettings('channels', 'whatsapp', 'provider', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="twilio">Twilio</option>
                      <option value="ultramsg">UltraMsg</option>
                    </select>
                  </div>

                  {settings.channels.whatsapp.provider === 'twilio' ? (
                    <>
                      <Input
                        label="Account SID"
                        type="text"
                        value={settings.channels.whatsapp.accountSid || ''}
                        onChange={(e) =>
                          updateNestedSettings('channels', 'whatsapp', 'accountSid', e.target.value)
                        }
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                      <Input
                        label="Auth Token"
                        type="password"
                        value={settings.channels.whatsapp.authToken || ''}
                        onChange={(e) =>
                          updateNestedSettings('channels', 'whatsapp', 'authToken', e.target.value)
                        }
                        placeholder="معرف التوثيق"
                      />
                      <Input
                        label="رقم الهاتف"
                        type="text"
                        value={settings.channels.whatsapp.phoneNumber || ''}
                        onChange={(e) =>
                          updateNestedSettings('channels', 'whatsapp', 'phoneNumber', e.target.value)
                        }
                        placeholder="+1234567890"
                      />
                    </>
                  ) : (
                    <>
                      <Input
                        label="API URL"
                        type="url"
                        value={settings.channels.whatsapp.apiUrl || ''}
                        onChange={(e) =>
                          updateNestedSettings('channels', 'whatsapp', 'apiUrl', e.target.value)
                        }
                        placeholder="https://api.ultramsg.com/instancexxxxx"
                      />
                      <Input
                        label="API Key"
                        type="password"
                        value={settings.channels.whatsapp.apiKey || ''}
                        onChange={(e) =>
                          updateNestedSettings('channels', 'whatsapp', 'apiKey', e.target.value)
                        }
                        placeholder="مفتاح API"
                      />
                      <Input
                        label="Instance ID"
                        type="text"
                        value={settings.channels.whatsapp.instanceId || ''}
                        onChange={(e) =>
                          updateNestedSettings('channels', 'whatsapp', 'instanceId', e.target.value)
                        }
                        placeholder="instancexxxxx"
                      />
                    </>
                  )}

                  <Button
                    onClick={() => testConnection('whatsapp')}
                    disabled={!settings.channels.whatsapp.enabled}
                    variant="outline"
                    className="w-full"
                  >
                    اختبار الاتصال
                    {testResults.whatsapp === 'success' && (
                      <span className="mr-2 text-green-600">✓</span>
                    )}
                    {testResults.whatsapp === 'error' && (
                      <span className="mr-2 text-red-600">✗</span>
                    )}
                  </Button>
                </div>
              </Card>

              {/* SMS Settings */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">إعدادات SMS</h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.channels.sms.enabled}
                      onChange={(e) =>
                        updateNestedSettings('channels', 'sms', 'enabled', e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">مفعل</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      مزود الخدمة
                    </label>
                    <select
                      value={settings.channels.sms.provider}
                      onChange={(e) =>
                        updateNestedSettings('channels', 'sms', 'provider', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="twilio">Twilio</option>
                    </select>
                  </div>

                  <Input
                    label="Account SID"
                    type="text"
                    value={settings.channels.sms.accountSid || ''}
                    onChange={(e) =>
                      updateNestedSettings('channels', 'sms', 'accountSid', e.target.value)
                    }
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <Input
                    label="Auth Token"
                    type="password"
                    value={settings.channels.sms.authToken || ''}
                    onChange={(e) =>
                      updateNestedSettings('channels', 'sms', 'authToken', e.target.value)
                    }
                    placeholder="معرف التوثيق"
                  />
                  <Input
                    label="رقم المرسل"
                    type="text"
                    value={settings.channels.sms.fromNumber || ''}
                    onChange={(e) =>
                      updateNestedSettings('channels', 'sms', 'fromNumber', e.target.value)
                    }
                    placeholder="+1234567890"
                  />

                  <Button
                    onClick={() => testConnection('sms')}
                    disabled={!settings.channels.sms.enabled}
                    variant="outline"
                    className="w-full"
                  >
                    اختبار الاتصال
                    {testResults.sms === 'success' && (
                      <span className="mr-2 text-green-600">✓</span>
                    )}
                    {testResults.sms === 'error' && (
                      <span className="mr-2 text-red-600">✗</span>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Email Settings */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">إعدادات البريد الإلكتروني</h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.channels.email.enabled}
                      onChange={(e) =>
                        updateNestedSettings('channels', 'email', 'enabled', e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">مفعل</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نوع الخدمة
                    </label>
                    <select
                      value={settings.channels.email.provider}
                      onChange={(e) =>
                        updateNestedSettings('channels', 'email', 'provider', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="smtp">SMTP</option>
                    </select>
                  </div>

                  <Input
                    label="خادم SMTP"
                    type="text"
                    value={settings.channels.email.host || ''}
                    onChange={(e) =>
                      updateNestedSettings('channels', 'email', 'host', e.target.value)
                    }
                    placeholder="smtp.gmail.com"
                  />
                  <Input
                    label="المنفذ"
                    type="number"
                    value={settings.channels.email.port || ''}
                    onChange={(e) =>
                      updateNestedSettings('channels', 'email', 'port', parseInt(e.target.value))
                    }
                    placeholder="587"
                  />
                  <Input
                    label="اسم المستخدم"
                    type="text"
                    value={settings.channels.email.username || ''}
                    onChange={(e) =>
                      updateNestedSettings('channels', 'email', 'username', e.target.value)
                    }
                    placeholder="username@example.com"
                  />
                  <Input
                    label="كلمة المرور"
                    type="password"
                    value={settings.channels.email.password || ''}
                    onChange={(e) =>
                      updateNestedSettings('channels', 'email', 'password', e.target.value)
                    }
                    placeholder="كلمة المرور"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      التشفير
                    </label>
                    <select
                      value={settings.channels.email.encryption}
                      onChange={(e) =>
                        updateNestedSettings('channels', 'email', 'encryption', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="none">بدون تشفير</option>
                    </select>
                  </div>

                  <Input
                    label="عنوان المرسل"
                    type="email"
                    value={settings.channels.email.fromAddress || ''}
                    onChange={(e) =>
                      updateNestedSettings('channels', 'email', 'fromAddress', e.target.value)
                    }
                    placeholder="noreply@company.com"
                  />

                  <Button
                    onClick={() => testConnection('email')}
                    disabled={!settings.channels.email.enabled}
                    variant="outline"
                    className="w-full"
                  >
                    اختبار الاتصال
                    {testResults.email === 'success' && (
                      <span className="mr-2 text-green-600">✓</span>
                    )}
                    {testResults.email === 'error' && (
                      <span className="mr-2 text-red-600">✗</span>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Webhook Settings */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">إعدادات Webhook</h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.channels.webhook.enabled}
                      onChange={(e) =>
                        updateNestedSettings('channels', 'webhook', 'enabled', e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">مفعل</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">
                        Endpoints
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newEndpoint = {
                            url: '',
                            secret: '',
                            events: ['message.received', 'message.sent'],
                          }
                          updateNestedSettings('channels', 'webhook', 'endpoints', [
                            ...settings.channels.webhook.endpoints,
                            newEndpoint,
                          ])
                        }}
                      >
                        إضافة Endpoint
                      </Button>
                    </div>

                    {settings.channels.webhook.endpoints.map((endpoint, index) => (
                      <div key={index} className="p-3 border rounded-md space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">
                            Endpoint {index + 1}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const endpoints = [...settings.channels.webhook.endpoints]
                              endpoints.splice(index, 1)
                              updateNestedSettings('channels', 'webhook', 'endpoints', endpoints)
                            }}
                          >
                            حذف
                          </Button>
                        </div>
                        <Input
                          label="URL"
                          type="url"
                          value={endpoint.url}
                          onChange={(e) => {
                            const endpoints = [...settings.channels.webhook.endpoints]
                            endpoints[index].url = e.target.value
                            updateNestedSettings('channels', 'webhook', 'endpoints', endpoints)
                          }}
                          placeholder="https://your-app.com/webhook"
                        />
                        <Input
                          label="Secret"
                          type="password"
                          value={endpoint.secret || ''}
                          onChange={(e) => {
                            const endpoints = [...settings.channels.webhook.endpoints]
                            endpoints[index].secret = e.target.value
                            updateNestedSettings('channels', 'webhook', 'endpoints', endpoints)
                          }}
                          placeholder="المفتاح السري"
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => testConnection('webhook')}
                    disabled={!settings.channels.webhook.enabled || settings.channels.webhook.endpoints.length === 0}
                    variant="outline"
                    className="w-full"
                  >
                    اختبار Webhook
                    {testResults.webhook === 'success' && (
                      <span className="mr-2 text-green-600">✓</span>
                    )}
                    {testResults.webhook === 'error' && (
                      <span className="mr-2 text-red-600">✗</span>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Message Settings */}
          {activeTab === 'messages' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">الإعدادات العامة</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اللغة الافتراضية
                    </label>
                    <select
                      value={settings.messages.language}
                      onChange={(e) => updateNestedSettings('messages', '', 'language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.messages.autoResponse}
                      onChange={(e) => updateNestedSettings('messages', '', 'autoResponse', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">تفعيل الرد التلقائي</span>
                  </label>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ساعات العمل</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.messages.workingHours.enabled}
                      onChange={(e) => updateNestedSettings('messages', 'workingHours', 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">تفعيل ساعات العمل</span>
                  </label>

                  {settings.messages.workingHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="من"
                        type="time"
                        value={settings.messages.workingHours.start}
                        onChange={(e) => updateNestedSettings('messages', 'workingHours', 'start', e.target.value)}
                      />
                      <Input
                        label="إلى"
                        type="time"
                        value={settings.messages.workingHours.end}
                        onChange={(e) => updateNestedSettings('messages', 'workingHours', 'end', e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المنطقة الزمنية
                    </label>
                    <select
                      value={settings.messages.workingHours.timezone}
                      onChange={(e) => updateNestedSettings('messages', 'workingHours', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                      <option value="Asia/Dubai">دبي (GMT+4)</option>
                      <option value="Asia/Kuwait">الكويت (GMT+3)</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="p-6 lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">قوالب الرسائل الافتراضية</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رسالة الترحيب
                    </label>
                    <textarea
                      value={settings.messages.templates.defaultWelcome}
                      onChange={(e) => updateNestedSettings('messages', 'templates', 'defaultWelcome', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="مرحباً بك! كيف يمكنني مساعدتك؟"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رسالة الوداع
                    </label>
                    <textarea
                      value={settings.messages.templates.defaultFarewell}
                      onChange={(e) => updateNestedSettings('messages', 'templates', 'defaultFarewell', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="شكراً لتواصلك معنا. نتمنى لك يوماً سعيداً!"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رسالة الخطأ
                    </label>
                    <textarea
                      value={settings.messages.templates.defaultFallback}
                      onChange={(e) => updateNestedSettings('messages', 'templates', 'defaultFallback', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="عذراً، لم أفهم طلبك. هل يمكنك إعادة صياغته؟"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">إعدادات التسليم</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Input
                    label="محاولات إعادة الإرسال"
                    type="number"
                    value={settings.messages.delivery.retryAttempts}
                    onChange={(e) => updateNestedSettings('messages', 'delivery', 'retryAttempts', parseInt(e.target.value))}
                    min="0"
                    max="10"
                  />

                  <Input
                    label="مهلة الانتظار (ثانية)"
                    type="number"
                    value={settings.messages.delivery.timeout}
                    onChange={(e) => updateNestedSettings('messages', 'delivery', 'timeout', parseInt(e.target.value))}
                    min="10"
                    max="300"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      أولوية الرسائل
                    </label>
                    <select
                      value={settings.messages.delivery.priority}
                      onChange={(e) => updateNestedSettings('messages', 'delivery', 'priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">منخفضة</option>
                      <option value="normal">عادية</option>
                      <option value="high">عالية</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Integration Settings */}
          {activeTab === 'integrations' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">مفاتيح API</h3>
                <div className="space-y-4">
                  <Input
                    label="المفتاح العام"
                    type="password"
                    value={settings.integrations.apiKeys.public}
                    onChange={(e) => updateNestedSettings('integrations', 'apiKeys', 'public', e.target.value)}
                    placeholder="pk_live_xxxxxxxxxxxxx"
                  />
                  <Input
                    label="المفتاح الخاص"
                    type="password"
                    value={settings.integrations.apiKeys.private}
                    onChange={(e) => updateNestedSettings('integrations', 'apiKeys', 'private', e.target.value)}
                    placeholder="sk_live_xxxxxxxxxxxxx"
                  />
                  <Input
                    label="مفتاح Webhook"
                    type="password"
                    value={settings.integrations.apiKeys.webhook}
                    onChange={(e) => updateNestedSettings('integrations', 'apiKeys', 'webhook', e.target.value)}
                    placeholder="whsec_xxxxxxxxxxxxx"
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">إعدادات المزامنة</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.integrations.sync.enabled}
                      onChange={(e) => updateNestedSettings('integrations', 'sync', 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">تفعيل المزامنة التلقائية</span>
                  </label>

                  {settings.integrations.sync.enabled && (
                    <>
                      <Input
                        label="فترة المزامنة (دقيقة)"
                        type="number"
                        value={settings.integrations.sync.interval}
                        onChange={(e) => updateNestedSettings('integrations', 'sync', 'interval', parseInt(e.target.value))}
                        min="1"
                        max="1440"
                      />

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.integrations.sync.autoSync}
                          onChange={(e) => updateNestedSettings('integrations', 'sync', 'autoSync', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="mr-2 text-sm text-gray-700">مزامنة تلقائية عند بدء التشغيل</span>
                      </label>
                    </>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">أنواع الإشعارات</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.inApp}
                      onChange={(e) => updateNestedSettings('notifications', '', 'inApp', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">الإشعارات داخل التطبيق</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email}
                      onChange={(e) => updateNestedSettings('notifications', '', 'email', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">إشعارات البريد الإلكتروني</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.sms}
                      onChange={(e) => updateNestedSettings('notifications', '', 'sms', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">إشعارات SMS</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.push}
                      onChange={(e) => updateNestedSettings('notifications', '', 'push', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">الإشعارات الفورية (Push)</span>
                  </label>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ساعات الهدوء</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.quietHours.enabled}
                      onChange={(e) => updateNestedSettings('notifications', 'quietHours', 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">تفعيل ساعات الهدوء</span>
                  </label>

                  {settings.notifications.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="من"
                        type="time"
                        value={settings.notifications.quietHours.start}
                        onChange={(e) => updateNestedSettings('notifications', 'quietHours', 'start', e.target.value)}
                      />
                      <Input
                        label="إلى"
                        type="time"
                        value={settings.notifications.quietHours.end}
                        onChange={(e) => updateNestedSettings('notifications', 'quietHours', 'end', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">حد معدل الطلبات</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.advanced.rateLimit.enabled}
                      onChange={(e) => updateNestedSettings('advanced', 'rateLimit', 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">تفعيل حد معدل الطلبات</span>
                  </label>

                  {settings.advanced.rateLimit.enabled && (
                    <div className="space-y-4">
                      <Input
                        label="الطلبات في الدقيقة"
                        type="number"
                        value={settings.advanced.rateLimit.requestsPerMinute}
                        onChange={(e) => updateNestedSettings('advanced', 'rateLimit', 'requestsPerMinute', parseInt(e.target.value))}
                        min="1"
                        max="1000"
                      />
                      <Input
                        label="الطلبات في الساعة"
                        type="number"
                        value={settings.advanced.rateLimit.requestsPerHour}
                        onChange={(e) => updateNestedSettings('advanced', 'rateLimit', 'requestsPerHour', parseInt(e.target.value))}
                        min="1"
                        max="10000"
                      />
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">سياسة إعادة المحاولة</h3>
                <div className="space-y-4">
                  <Input
                    label="عدد المحاولات الأقصى"
                    type="number"
                    value={settings.advanced.retryPolicy.maxAttempts}
                    onChange={(e) => updateNestedSettings('advanced', 'retryPolicy', 'maxAttempts', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                  <Input
                    label="عامل التراجع"
                    type="number"
                    step="0.1"
                    value={settings.advanced.retryPolicy.backoffMultiplier}
                    onChange={(e) => updateNestedSettings('advanced', 'retryPolicy', 'backoffMultiplier', parseFloat(e.target.value))}
                    min="1"
                    max="5"
                  />
                  <Input
                    label="الحد الأقصى للتأخير (ثانية)"
                    type="number"
                    value={settings.advanced.retryPolicy.maxDelay}
                    onChange={(e) => updateNestedSettings('advanced', 'retryPolicy', 'maxDelay', parseInt(e.target.value))}
                    min="10"
                    max="3600"
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">معالجة الأخطاء</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      مستوى السجل
                    </label>
                    <select
                      value={settings.advanced.errorHandling.logLevel}
                      onChange={(e) => updateNestedSettings('advanced', 'errorHandling', 'logLevel', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="debug">Debug</option>
                      <option value="info">Info</option>
                      <option value="warn">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.advanced.errorHandling.alertOnFailure}
                      onChange={(e) => updateNestedSettings('advanced', 'errorHandling', 'alertOnFailure', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">تنبيه عند الفشل</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.advanced.errorHandling.storeFailedMessages}
                      onChange={(e) => updateNestedSettings('advanced', 'errorHandling', 'storeFailedMessages', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">حفظ الرسائل الفاشلة</span>
                  </label>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">إعدادات السجل</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.advanced.logging.enabled}
                      onChange={(e) => updateNestedSettings('advanced', 'logging', 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">تفعيل السجل</span>
                  </label>

                  {settings.advanced.logging.enabled && (
                    <div className="space-y-4">
                      <Input
                        label="فترة الاحتفاظ (يوم)"
                        type="number"
                        value={settings.advanced.logging.retention}
                        onChange={(e) => updateNestedSettings('advanced', 'logging', 'retention', parseInt(e.target.value))}
                        min="1"
                        max="365"
                      />

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.advanced.logging.includeHeaders}
                          onChange={(e) => updateNestedSettings('advanced', 'logging', 'includeHeaders', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="mr-2 text-sm text-gray-700">تضمين رؤوس الطلبات</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.advanced.logging.includePayload}
                          onChange={(e) => updateNestedSettings('advanced', 'logging', 'includePayload', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="mr-2 text-sm text-gray-700">تضمين محتوى الرسائل</span>
                      </label>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageSettingsPage