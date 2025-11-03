'use client';

import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  SpeakerWaveIcon, 
  ComputerDesktopIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CogIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  QuestionMarkCircleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface NotificationSettings {
  // إعدادات عامة
  push: boolean;
  email: boolean;
  sms: boolean;
  sound: boolean;
  desktop: boolean;
  
  // تنبيهات العملاء المحتملين
  newLeads: boolean;
  statusChanges: boolean;
  highPriority: boolean;
  assignmentAlerts: boolean;
  
  // تنبيهات الرسائل
  newMessages: boolean;
  responseRequired: boolean;
  deliveryFailures: boolean;
  templateIssues: boolean;
  
  // تنبيهات المبيعات
  conversionMilestones: boolean;
  goalAchievements: boolean;
  revenueAlerts: boolean;
  pipelineUpdates: boolean;
  
  // تنبيهات النظام
  systemErrors: boolean;
  maintenanceAlerts: boolean;
  securityAlerts: boolean;
  performanceWarnings: boolean;
  
  // إعدادات التوقيت
  workingHours: { start: string; end: string };
  quietHours: { start: string; end: string };
  weekendSettings: 'all' | 'urgent_only' | 'none';
  holidaySchedules: boolean;
  
  // الإعدادات المتقدمة
  frequency: 'immediate' | 'hourly' | 'daily';
  batchNotifications: boolean;
  customRules: boolean;
  escalationPolicies: boolean;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    // الإعدادات الافتراضية
    push: true,
    email: true,
    sms: false,
    sound: true,
    desktop: true,
    
    newLeads: true,
    statusChanges: true,
    highPriority: true,
    assignmentAlerts: true,
    
    newMessages: true,
    responseRequired: true,
    deliveryFailures: true,
    templateIssues: false,
    
    conversionMilestones: true,
    goalAchievements: true,
    revenueAlerts: true,
    pipelineUpdates: false,
    
    systemErrors: true,
    maintenanceAlerts: true,
    securityAlerts: true,
    performanceWarnings: true,
    
    workingHours: { start: '09:00', end: '18:00' },
    quietHours: { start: '22:00', end: '08:00' },
    weekendSettings: 'urgent_only',
    holidaySchedules: false,
    
    frequency: 'immediate',
    batchNotifications: false,
    customRules: true,
    escalationPolicies: true
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K, 
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const saveSettings = () => {
    // حفظ الإعدادات في localStorage أو إرسال إلى API
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    setHasUnsavedChanges(false);
    // هنا يمكن إضافة رسالة تأكيد
  };

  const resetSettings = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
      // إعادة تعيين إلى الإعدادات الافتراضية
      setSettings({
        push: true,
        email: true,
        sms: false,
        sound: true,
        desktop: true,
        newLeads: true,
        statusChanges: true,
        highPriority: true,
        assignmentAlerts: true,
        newMessages: true,
        responseRequired: true,
        deliveryFailures: true,
        templateIssues: false,
        conversionMilestones: true,
        goalAchievements: true,
        revenueAlerts: true,
        pipelineUpdates: false,
        systemErrors: true,
        maintenanceAlerts: true,
        securityAlerts: true,
        performanceWarnings: true,
        workingHours: { start: '09:00', end: '18:00' },
        quietHours: { start: '22:00', end: '08:00' },
        weekendSettings: 'urgent_only',
        holidaySchedules: false,
        frequency: 'immediate',
        batchNotifications: false,
        customRules: true,
        escalationPolicies: true
      });
      setHasUnsavedChanges(false);
    }
  };

  const testNotification = () => {
    setIsTesting(true);
    // محاكاة إرسال إشعار تجريبي
    setTimeout(() => {
      setIsTesting(false);
      alert('تم إرسال إشعار تجريبي بنجاح!');
    }, 2000);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'notification-settings.json';
    link.click();
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
          setHasUnsavedChanges(true);
          alert('تم استيراد الإعدادات بنجاح!');
        } catch (error) {
          alert('خطأ في استيراد الإعدادات. تأكد من صحة الملف.');
        }
      };
      reader.readAsText(file);
    }
  };

  const toggleSwitch = (key: keyof NotificationSettings) => {
    updateSetting(key, !settings[key]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* رأس الصفحة */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <BellIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">إعدادات التنبيهات</h1>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                معاينة التنبيهات
              </button>
              <button
                onClick={testNotification}
                disabled={isTesting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isTesting ? 'جاري الاختبار...' : 'اختبار الإشعار'}
              </button>
            </div>
          </div>

          {/* أزرار الحفظ والإعادة */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={saveSettings}
                disabled={!hasUnsavedChanges}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckIcon className="h-4 w-4 inline ml-1" />
                حفظ الإعدادات
              </button>
              <button
                onClick={resetSettings}
                disabled={!hasUnsavedChanges}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <XMarkIcon className="h-4 w-4 inline ml-1" />
                إعادة تعيين
              </button>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={exportSettings}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4 inline ml-1" />
                تصدير
              </button>
              <label className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <ArrowUpTrayIcon className="h-4 w-4 inline ml-1" />
                استيراد
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* تفضيلات التنبيهات */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BellIcon className="h-6 w-6 ml-2 text-blue-600" />
              تفضيلات التنبيهات
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <BellIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">تنبيهات الدفع (داخل التطبيق)</span>
                </div>
                <button
                  onClick={() => toggleSwitch('push')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.push ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.push ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">تنبيهات البريد الإلكتروني</span>
                </div>
                <button
                  onClick={() => toggleSwitch('email')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.email ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <PhoneIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">تنبيهات الرسائل النصية</span>
                  <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" title="يتطلب اشتراكاً إضافياً" />
                </div>
                <button
                  onClick={() => toggleSwitch('sms')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.sms ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.sms ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <SpeakerWaveIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">التنبيهات الصوتية</span>
                </div>
                <button
                  onClick={() => toggleSwitch('sound')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.sound ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.sound ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <ComputerDesktopIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">تنبيهات سطح المكتب</span>
                </div>
                <button
                  onClick={() => toggleSwitch('desktop')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.desktop ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.desktop ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* تنبيهات العملاء المحتملين */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <UserGroupIcon className="h-6 w-6 ml-2 text-green-600" />
              تنبيهات العملاء المحتملين
            </h2>
            <div className="space-y-4">
              {[
                { key: 'newLeads' as const, label: 'تنبيهات العملاء الجدد', desc: 'إشعار عند إنشاء عميل محتمل جديد' },
                { key: 'statusChanges' as const, label: 'تغييرات الحالة', desc: 'إشعار عند تغيير حالة العميل المحتمل' },
                { key: 'highPriority' as const, label: 'العملاء عاليو الأولوية', desc: 'إشعار للعملاء المحتملين عاليي الأولوية' },
                { key: 'assignmentAlerts' as const, label: 'إشعارات التخصيص', desc: 'إشعار عند تخصيص عميل محتمل' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-gray-700 font-medium">{item.label}</span>
                      <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" title={item.desc} />
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSwitch(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings[item.key] ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* تنبيهات الرسائل */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ChatBubbleLeftIcon className="h-6 w-6 ml-2 text-purple-600" />
              تنبيهات الرسائل
            </h2>
            <div className="space-y-4">
              {[
                { key: 'newMessages' as const, label: 'رسائل جديدة', desc: 'إشعار عند استلام رسالة جديدة' },
                { key: 'responseRequired' as const, label: 'رد مطلوب', desc: 'إشعار للرسائل التي تتطلب رداً' },
                { key: 'deliveryFailures' as const, label: 'فشل التسليم', desc: 'إشعار عند فشل تسليم الرسالة' },
                { key: 'templateIssues' as const, label: 'مشاكل القوالب', desc: 'إشعار بمشاكل في قوالب الرسائل' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-gray-700 font-medium">{item.label}</span>
                      <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" title={item.desc} />
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSwitch(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings[item.key] ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* تنبيهات المبيعات */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CurrencyDollarIcon className="h-6 w-6 ml-2 text-yellow-600" />
              تنبيهات المبيعات
            </h2>
            <div className="space-y-4">
              {[
                { key: 'conversionMilestones' as const, label: 'معالم التحويل', desc: 'إشعار عند تحقيق معالم تحويل مهمة' },
                { key: 'goalAchievements' as const, label: 'تحقيق الأهداف', desc: 'إشعار عند تحقيق أهداف المبيعات' },
                { key: 'revenueAlerts' as const, label: 'تنبيهات الإيرادات', desc: 'إشعار عند تحقيق إيرادات مهمة' },
                { key: 'pipelineUpdates' as const, label: 'تحديثات خط الأنابيب', desc: 'إشعار عند تحديث حالة صفقات' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-gray-700 font-medium">{item.label}</span>
                      <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" title={item.desc} />
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSwitch(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings[item.key] ? 'bg-yellow-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* تنبيهات النظام */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 ml-2 text-red-600" />
              تنبيهات النظام
            </h2>
            <div className="space-y-4">
              {[
                { key: 'systemErrors' as const, label: 'أخطاء النظام', desc: 'إشعار عند حدوث أخطاء في النظام' },
                { key: 'maintenanceAlerts' as const, label: 'صيانة النظام', desc: 'إشعار بجدولة أعمال الصيانة' },
                { key: 'securityAlerts' as const, label: 'تنبيهات الأمان', desc: 'إشعارات أمنية مهمة' },
                { key: 'performanceWarnings' as const, label: 'تحذيرات الأداء', desc: 'إشعار عند انخفاض أداء النظام' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-gray-700 font-medium">{item.label}</span>
                      <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" title={item.desc} />
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSwitch(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings[item.key] ? 'bg-red-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* إعدادات التوقيت */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="h-6 w-6 ml-2 text-indigo-600" />
              إعدادات التوقيت
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ساعات العمل - البداية
                  </label>
                  <input
                    type="time"
                    value={settings.workingHours.start}
                    onChange={(e) => updateSetting('workingHours', { ...settings.workingHours, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ساعات العمل - النهاية
                  </label>
                  <input
                    type="time"
                    value={settings.workingHours.end}
                    onChange={(e) => updateSetting('workingHours', { ...settings.workingHours, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ساعات الهدوء - البداية
                  </label>
                  <input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => updateSetting('quietHours', { ...settings.quietHours, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ساعات الهدوء - النهاية
                  </label>
                  <input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => updateSetting('quietHours', { ...settings.quietHours, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  إعدادات عطلة نهاية الأسبوع
                </label>
                <select
                  value={settings.weekendSettings}
                  onChange={(e) => updateSetting('weekendSettings', e.target.value as 'all' | 'urgent_only' | 'none')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">جميع التنبيهات</option>
                  <option value="urgent_only">الطارئة فقط</option>
                  <option value="none">لا توجد تنبيهات</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-700">جداول العطل</span>
                <button
                  onClick={() => toggleSwitch('holidaySchedules')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.holidaySchedules ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.holidaySchedules ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* الإعدادات المتقدمة */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CogIcon className="h-6 w-6 ml-2 text-gray-600" />
              الإعدادات المتقدمة
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تكرار التنبيهات
                </label>
                <select
                  value={settings.frequency}
                  onChange={(e) => updateSetting('frequency', e.target.value as 'immediate' | 'hourly' | 'daily')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="immediate">فوري</option>
                  <option value="hourly">كل ساعة</option>
                  <option value="daily">يومي</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 font-medium">التنبيهات المجمعة</span>
                  <p className="text-sm text-gray-500">دمج التنبيهات المتعددة في رسالة واحدة</p>
                </div>
                <button
                  onClick={() => toggleSwitch('batchNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.batchNotifications ? 'bg-gray-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.batchNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 font-medium">القواعد المخصصة</span>
                  <p className="text-sm text-gray-500">إنشاء قواعد تنبيه مخصصة</p>
                </div>
                <button
                  onClick={() => toggleSwitch('customRules')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.customRules ? 'bg-gray-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.customRules ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 font-medium">سياسات التصعيد</span>
                  <p className="text-sm text-gray-500">تصعيد التنبيهات غير المجاب عليها</p>
                </div>
                <button
                  onClick={() => toggleSwitch('escalationPolicies')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.escalationPolicies ? 'bg-gray-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.escalationPolicies ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* معاينة التنبيهات */}
        {showPreview && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">معاينة التنبيهات</h2>
            <div className="space-y-4">
              <div className="border-r-4 border-blue-500 bg-blue-50 p-4 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">عميل محتمل جديد</h4>
                    <p className="text-sm text-blue-700">تم استلام عميل محتمل جديد من أحمد محمد</p>
                  </div>
                  <span className="text-xs text-blue-600">منذ دقيقتين</span>
                </div>
              </div>
              
              <div className="border-r-4 border-green-500 bg-green-50 p-4 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900">تحقيق هدف</h4>
                    <p className="text-sm text-green-700">تم تحقيق هدف المبيعات الشهري!</p>
                  </div>
                  <span className="text-xs text-green-600">منذ 5 دقائق</span>
                </div>
              </div>
              
              <div className="border-r-4 border-red-500 bg-red-50 p-4 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-900">خطأ في النظام</h4>
                    <p className="text-sm text-red-700">خطأ في قاعدة البيانات الرئيسية</p>
                  </div>
                  <span className="text-xs text-red-600">منذ 10 دقائق</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}