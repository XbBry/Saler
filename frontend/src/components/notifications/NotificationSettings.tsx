import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Volume2, 
  VolumeX,
  Clock,
  Sun,
  Moon,
  Save,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Info,
  Zap,
  DollarSign,
  MessageCircle
} from 'lucide-react';
import { NotificationSettings as NotificationSettingsType, NotificationType } from './NotificationTypes';
import { useNotifications } from './useNotifications';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { settings, updateSettings, loading, error } = useNotifications();
  const [localSettings, setLocalSettings] = useState<NotificationSettingsType | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // تحديث الإعدادات المحلية عند تحميل الإعدادات
  useEffect(() => {
    if (settings) {
      setLocalSettings({ ...settings });
      setHasChanges(false);
    }
  }, [settings]);

  // تحديد التغييرات
  useEffect(() => {
    if (localSettings && settings) {
      const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);
      setHasChanges(hasChanges);
    }
  }, [localSettings, settings]);

  if (!isOpen || !localSettings) return null;

  // أنواع التنبيهات مع الأيقونات
  const notificationTypes = [
    {
      type: 'lead' as NotificationType,
      label: 'تحديثات العملاء المحتملين',
      description: 'تنبيهات عند إضافة أو تحديث العملاء المحتملين',
      icon: <Zap className="w-5 h-5 text-blue-500" />,
      color: 'blue'
    },
    {
      type: 'message' as NotificationType,
      label: 'رسائل جديدة',
      description: 'تنبيهات عند وصول رسائل جديدة',
      icon: <MessageCircle className="w-5 h-5 text-green-500" />,
      color: 'green'
    },
    {
      type: 'system' as NotificationType,
      label: 'تنبيهات النظام',
      description: 'تنبيهات النظام والصيانة',
      icon: <Settings className="w-5 h-5 text-gray-500" />,
      color: 'gray'
    },
    {
      type: 'sale' as NotificationType,
      label: 'إنجازات المبيعات',
      description: 'تنبيهات عند تحقيق إنجازات في المبيعات',
      icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
      color: 'emerald'
    }
  ];

  // القنوات مع الأيقونات
  const channels = [
    {
      key: 'email' as const,
      label: 'البريد الإلكتروني',
      description: 'استقبال التنبيهات عبر البريد الإلكتروني',
      icon: <Mail className="w-5 h-5 text-blue-500" />
    },
    {
      key: 'push' as const,
      label: 'الإشعارات المنبثقة',
      description: 'إشعارات فورية في المتصفح',
      icon: <Bell className="w-5 h-5 text-orange-500" />
    },
    {
      key: 'inApp' as const,
      label: 'داخل التطبيق',
      description: 'تنبيهات مباشرة في واجهة التطبيق',
      icon: <Smartphone className="w-5 h-5 text-purple-500" />
    },
    {
      key: 'sms' as const,
      label: 'رسالة نصية',
      description: 'تنبيهات عبر الرسائل النصية',
      icon: <MessageSquare className="w-5 h-5 text-green-500" />
    }
  ];

  // تبديل القناة
  const toggleChannel = (channel: keyof Pick<NotificationSettingsType, 'email' | 'push' | 'inApp' | 'sms'>) => {
    setLocalSettings(prev => prev ? {
      ...prev,
      [channel]: !prev[channel]
    } : null);
  };

  // تبديل تفضيل التنبيه
  const togglePreference = (type: keyof NotificationSettingsType['preferences']) => {
    setLocalSettings(prev => prev ? {
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: !prev.preferences[type]
      }
    } : null);
  };

  // تحديث وقت الساعات الهادئة
  const updateQuietHours = (field: 'startTime' | 'endTime' | 'enabled', value: any) => {
    setLocalSettings(prev => prev ? {
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    } : null);
  };

  // تحديث تكرار التنبيهات
  const updateFrequency = (type: NotificationType, frequency: 'immediate' | 'daily' | 'weekly' | 'never') => {
    setLocalSettings(prev => prev ? {
      ...prev,
      frequency: {
        immediate: prev.frequency.immediate.filter(t => t !== type),
        daily: prev.frequency.daily.filter(t => t !== type),
        weekly: prev.frequency.weekly.filter(t => t !== type),
        never: prev.frequency.never.filter(t => t !== type),
        [frequency]: [...prev.frequency[frequency], type]
      }
    } : null);
  };

  // حفظ الإعدادات
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(localSettings!);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('خطأ في حفظ الإعدادات:', err);
    } finally {
      setSaving(false);
    }
  };

  // إعادة تعيين الإعدادات
  const handleReset = () => {
    if (settings) {
      setLocalSettings({ ...settings });
      setHasChanges(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* رأس النافذة */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">إعدادات التنبيهات</h2>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                <AlertCircle className="w-4 h-4" />
                لديك تغييرات غير محفوظة
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            
            {/* القنوات */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                قنوات التنبيهات
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {channels.map((channel) => (
                  <div
                    key={channel.key}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-all
                      ${localSettings[channel.key] 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => toggleChannel(channel.key)}
                  >
                    <div className="flex items-center gap-3">
                      {channel.icon}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{channel.label}</h4>
                        <p className="text-sm text-gray-600">{channel.description}</p>
                      </div>
                      <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${localSettings[channel.key] 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300'
                        }
                      `}>
                        {localSettings[channel.key] && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* تفضيلات أنواع التنبيهات */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                تفضيلات أنواع التنبيهات
              </h3>
              <div className="space-y-4">
                {notificationTypes.map((type) => (
                  <div key={type.type} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {type.icon}
                        <div>
                          <h4 className="font-medium text-gray-900">{type.label}</h4>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                      <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer
                        ${localSettings.preferences[type.type] 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300'
                        }
                      `}
                        onClick={() => togglePreference(type.type)}
                      >
                        {localSettings.preferences[type.type] && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>

                    {/* تكرار التنبيهات */}
                    {localSettings.preferences[type.type] && (
                      <div className="ml-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          تكرار التنبيهات
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { key: 'immediate', label: 'فوري', icon: <Zap className="w-4 h-4" /> },
                            { key: 'daily', label: 'يومي', icon: <Clock className="w-4 h-4" /> },
                            { key: 'weekly', label: 'أسبوعي', icon: <Calendar className="w-4 h-4" /> },
                            { key: 'never', label: 'بدون', icon: <X className="w-4 h-4" /> }
                          ].map((freq) => (
                            <button
                              key={freq.key}
                              onClick={() => updateFrequency(type.type, freq.key as any)}
                              className={`
                                flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors
                                ${localSettings.frequency[freq.key].includes(type.type)
                                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }
                              `}
                            >
                              {freq.icon}
                              {freq.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* الساعات الهادئة */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-600" />
                الساعات الهادئة
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer
                      ${localSettings.quietHours.enabled 
                        ? 'border-indigo-500 bg-indigo-500' 
                        : 'border-gray-300'
                      }
                    `}
                    onClick={() => updateQuietHours('enabled', !localSettings.quietHours.enabled)}
                  >
                    {localSettings.quietHours.enabled && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">تفعيل الساعات الهادئة</h4>
                    <p className="text-sm text-gray-600">إيقاف التنبيهات خلال ساعات معينة</p>
                  </div>
                </div>

                {localSettings.quietHours.enabled && (
                  <div className="ml-9 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        وقت البداية
                      </label>
                      <input
                        type="time"
                        value={localSettings.quietHours.startTime}
                        onChange={(e) => updateQuietHours('startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        وقت النهاية
                      </label>
                      <input
                        type="time"
                        value={localSettings.quietHours.endTime}
                        onChange={(e) => updateQuietHours('endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* إعدادات إضافية */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-purple-600" />
                إعدادات إضافية
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-gray-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">صوت التنبيهات</h4>
                      <p className="text-sm text-gray-600">تشغيل صوت عند وصول تنبيه جديد</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {}}
                      className={`
                        px-4 py-2 rounded-lg font-medium transition-colors
                        ${localSettings.inApp 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}
                    >
                      <Volume2 className="w-4 h-4 inline mr-2" />
                      مفعل
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-orange-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">التنبيهات التفاعلية</h4>
                      <p className="text-sm text-gray-600">عرض أزرار إجراء مباشرة في التنبيهات</p>
                    </div>
                  </div>
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer
                    ${true /* localSettings.interactive */ 
                      ? 'border-orange-500 bg-orange-500' 
                      : 'border-gray-300'
                    }
                  `}
                    onClick={() => {}}
                  >
                    {true /* localSettings.interactive */ && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* رسالة الخطأ */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">خطأ في حفظ الإعدادات</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

          </div>
        </div>

        {/* ذيل النافذة */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleReset}
            disabled={!hasChanges || loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            إعادة تعيين
          </button>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                <Check className="w-4 h-4" />
                تم الحفظ بنجاح
              </div>
            )}
            
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges || loading || saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}