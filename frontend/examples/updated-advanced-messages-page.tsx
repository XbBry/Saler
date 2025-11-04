/**
 * Example: Updated Advanced Messages Page using useAdvancedMessages Hook
 * مثال: صفحة الرسائل المتقدمة المحدثة باستخدام hook الرسائل المتقدمة
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  BarChart3,
  Zap,
  Settings,
  Users,
  TrendingUp,
  Target,
  Clock,
  Send,
  Inbox,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Search,
  Plus,
  Eye,
  Edit,
  Archive,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/use-auth';

// ✅ استبدال المكونات القديمة
import { useAdvancedMessages } from '../../hooks/useAdvancedMessages';
import { useNotificationsSystem } from '../../hooks/useNotificationsSystem';

// استيراد المكونات
import { ConversationList } from '../../components/messages/ConversationList';
import { AdvancedDashboard } from '../../components/analytics/AdvancedDashboard';
import { TemplateLibrary } from '../../components/templates/TemplateLibrary';
import { BroadcastCenter } from '../../components/messages/BroadcastCenter';
import { AutomationCenter } from '../../components/messages/AutomationCenter';

type TabType = 'conversations' | 'analytics' | 'templates' | 'broadcast' | 'automation' | 'settings';

const AdvancedMessagesPage: React.FC = () => {
  const { currentUser } = useAuth();

  // ✅ State مبسط - البيانات تأتي من الـ hooks
  const [activeTab, setActiveTab] = useState<TabType>('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    channel: 'all' as string,
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    },
    messageType: 'all' as string,
    status: 'all' as string
  });

  // ✅ استبدال Mock Data بـ Advanced Messages Hook
  const {
    // Data من الـ Hook
    analytics,
    conversations,
    templates,
    
    // Loading states
    analyticsLoading,
    conversationsLoading,
    templatesLoading,
    isLoading: hookLoading,
    
    // Errors
    analyticsError,
    conversationsError,
    templatesError,
    error,
    
    // State
    currentPage,
    pagination,
    hasFilters,
    
    // Actions
    handleFilterChange,
    handlePageChange,
    handleConversationSelect,
    handleConversationDeselect,
    handleExportAnalytics,
    refetchAnalytics,
    
    // Mutations
    updateConversationStatus,
    sendBulkMessage,
    
    // Mutation states
    isUpdatingStatus,
    isSendingBulkMessage,
    
    // Real-time options
    autoRefresh,
    refreshInterval,
    enableRealTime
  } = useAdvancedMessages({
    enableRealTime: true,
    autoRefresh: true,
    refreshInterval: 30000
  });

  // ✅ Notifications Hook للرسائل الذكية
  const {
    notifications,
    stats: notificationStats,
    markAsRead,
    sendNotification
  } = useNotificationsSystem({
    userId: currentUser?.id || 'anonymous',
    enableAI: true,
    enableRealTime: true
  });

  // ✅ حذف Dashboard Stats State - تم استبدالها بـ analytics من الـ Hook
  // تم حذف:
  // const [dashboardStats, setDashboardStats] = useState({...});

  // ✅ Load dashboard stats - تم استبدالها بـ refetchAnalytics
  useEffect(() => {
    refetchAnalytics();
  }, [refetchAnalytics]);

  // ✅ Handlers محسن
  const handleFilterUpdate = useCallback((newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    handleFilterChange(newFilters);
  }, [handleFilterChange]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    handleFilterChange({ search: query });
  }, [handleFilterChange]);

  const handleConversationSelectWrapper = useCallback((conversation: any) => {
    setSelectedConversation(conversation.id);
    handleConversationSelect(conversation.id);
  }, [handleConversationSelect]);

  const handleConversationDeselectWrapper = useCallback(() => {
    setSelectedConversation(null);
    handleConversationDeselect();
  }, [handleConversationDeselect]);

  const handleBulkMessageSend = useCallback(async (templateId: string, recipients: string[]) => {
    try {
      await sendBulkMessage(templateId, recipients);
      alert('تم إرسال الرسائل بنجاح');
    } catch (err) {
      console.error('خطأ في إرسال الرسائل المجمعة:', err);
      alert('حدث خطأ في إرسال الرسائل');
    }
  }, [sendBulkMessage]);

  const handleExportMessages = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      await handleExportAnalytics(format);
    } catch (err) {
      console.error('خطأ في تصدير الرسائل:', err);
      alert('حدث خطأ في تصدير الرسائل');
    }
  }, [handleExportAnalytics]);

  // ✅ Real-time updates display
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  useEffect(() => {
    if (enableRealTime && autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [enableRealTime, autoRefresh, refreshInterval]);

  // ✅ Loading state محسن
  if (hookLoading && !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">جاري تحميل بيانات الرسائل المتقدمة...</p>
          {enableRealTime && (
            <p className="text-sm text-gray-500 mt-2">
              تحديث تلقائي كل {Math.round(refreshInterval / 1000)} ثانية
            </p>
          )}
        </div>
      </div>
    );
  }

  // ✅ Error state محسن
  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            فشل في تحميل بيانات الرسائل
          </h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <div className="space-x-4 space-x-reverse">
            <button
              onClick={refetchAnalytics}
              disabled={hookLoading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ml-2 ${hookLoading ? 'animate-spin' : ''}`} />
              إعادة المحاولة
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col h-full">
        {/* Header محسن */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <h1 className="text-2xl font-bold text-gray-900">
                  الرسائل المتقدمة
                </h1>
                {analytics && (
                  <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500">
                    <span>{analytics.totalMessages} رسالة</span>
                    <span>{analytics.unreadMessages} غير مقروء</span>
                    <span>{analytics.activeConversations} نشطة</span>
                  </div>
                )}
                {enableRealTime && (
                  <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons محسن */}
              <div className="flex items-center space-x-3 space-x-reverse">
                {/* إشعارات ذكية */}
                {notifications && notifications.length > 0 && (
                  <div className="relative">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <AlertCircle className="w-5 h-5" />
                    </button>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read_at).length}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => handleExportMessages('csv')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 ml-2" />
                  تصدير
                </button>

                <button
                  onClick={refetchAnalytics}
                  disabled={hookLoading}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${hookLoading ? 'animate-spin' : ''}`} />
                </button>

                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4 ml-2" />
                  رسالة جديدة
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar محسن */}
        {analytics && (
          <div className="bg-white border-b px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{analytics.totalMessages}</p>
                <p className="text-sm text-gray-500">إجمالي الرسائل</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{analytics.unreadMessages}</p>
                <p className="text-sm text-gray-500">غير مقروءة</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{analytics.responseRate}%</p>
                <p className="text-sm text-gray-500">معدل الاستجابة</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{analytics.conversionRate}%</p>
                <p className="text-sm text-gray-500">معدل التحويل</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{analytics.avgResponseTime}د</p>
                <p className="text-sm text-gray-500">متوسط الاستجابة</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{analytics.activeConversations}</p>
                <p className="text-sm text-gray-500">محادثات نشطة</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs محسن */}
        <div className="bg-white border-b">
          <div className="px-6">
            <nav className="flex space-x-8 space-x-reverse" aria-label="Tabs">
              {[
                { id: 'conversations', label: 'المحادثات', icon: MessageSquare },
                { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
                { id: 'templates', label: 'القوالب', icon: Edit },
                { id: 'broadcast', label: 'البث', icon: Send },
                { id: 'automation', label: 'الأتمتة', icon: Zap },
                { id: 'settings', label: 'الإعدادات', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center space-x-2 space-x-reverse py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    {/* Notification badges */}
                    {tab.id === 'conversations' && analytics && analytics.unreadMessages > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {analytics.unreadMessages}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Filters Bar محسن */}
        <div className="bg-gray-50 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="البحث في المحادثات..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              {/* Channel Filter */}
              <select
                value={filters.channel}
                onChange={(e) => handleFilterUpdate({ channel: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع القنوات</option>
                <option value="whatsapp">واتساب</option>
                <option value="email">إيميل</option>
                <option value="sms">رسالة نصية</option>
                <option value="social">وسائل التواصل</option>
              </select>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterUpdate({ status: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="paused">متوقف</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>

            {/* Active Filters Indicator */}
            {hasFilters && (
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>مرشحات نشطة</span>
                <button
                  onClick={() => {
                    setFilters({
                      channel: 'all',
                      dateRange: {
                        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        to: new Date().toISOString().split('T')[0]
                      },
                      messageType: 'all',
                      status: 'all'
                    });
                    handleFilterChange({});
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  مسح المرشحات
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'conversations' && (
                <ConversationList
                  conversations={conversations}
                  loading={conversationsLoading}
                  onConversationSelect={handleConversationSelectWrapper}
                  onSearch={handleSearch}
                  onFilterChange={handleFilterUpdate}
                  searchQuery={searchQuery}
                  selectedConversationId={selectedConversation}
                  channelFilter={filters.channel}
                  statusFilter={filters.status}
                />
              )}

              {activeTab === 'analytics' && analytics && (
                <AdvancedDashboard
                  analytics={analytics}
                  loading={analyticsLoading}
                  onExport={handleExportMessages}
                  realTime={enableRealTime}
                />
              )}

              {activeTab === 'templates' && (
                <TemplateLibrary
                  templates={templates}
                  loading={templatesLoading}
                  onBulkSend={handleBulkMessageSend}
                />
              )}

              {activeTab === 'broadcast' && (
                <BroadcastCenter
                  templates={templates}
                  loading={templatesLoading}
                  onSend={sendBulkMessage}
                />
              )}

              {activeTab === 'automation' && (
                <AutomationCenter
                  conversations={conversations}
                  loading={conversationsLoading}
                  onExecute={updateConversationStatus}
                />
              )}

              {activeTab === 'settings' && (
                <div className="p-6">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      إعدادات الرسائل المتقدمة
                    </h2>
                    
                    <div className="space-y-6">
                      {/* Real-time Settings */}
                      <div className="bg-white p-6 rounded-lg border">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          الإعدادات الفورية
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                التحديث التلقائي
                              </p>
                              <p className="text-sm text-gray-500">
                                تحديث البيانات تلقائياً كل {Math.round(refreshInterval / 1000)} ثانية
                              </p>
                            </div>
                            <div className={`w-12 h-6 rounded-full transition-colors ${
                              enableRealTime ? 'bg-blue-600' : 'bg-gray-300'
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                enableRealTime ? 'translate-x-6' : 'translate-x-1'
                              } mt-0.5`}></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                التنبيهات الفورية
                              </p>
                              <p className="text-sm text-gray-500">
                                إشعارات للرسائل والأحداث المهمة
                              </p>
                            </div>
                            <div className="w-12 h-6 bg-blue-600 rounded-full">
                              <div className="w-5 h-5 bg-white rounded-full shadow transform translate-x-6 mt-0.5"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      {analytics && (
                        <div className="bg-white p-6 rounded-lg border">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            مقاييس الأداء
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">{analytics.responseRate}%</p>
                              <p className="text-sm text-gray-500">معدل الاستجابة</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">{analytics.conversionRate}%</p>
                              <p className="text-sm text-gray-500">معدل التحويل</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-600">{analytics.avgResponseTime}د</p>
                              <p className="text-sm text-gray-500">متوسط الاستجابة</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMessagesPage;

/**
 * ملخص التغييرات:
 * 
 * 1. ✅ إزالة Mock Data بالكامل
 * 2. ✅ استبدال useState بـ useAdvancedMessages hook
 * 3. ✅ إضافة useNotificationsSystem للرسائل الذكية
 * 4. ✅ Real-time updates مع مؤشرات بصرية
 * 5. ✅ Error handling محسن مع retry logic
 * 6. ✅ Loading states شاملة
 * 7. ✅ Performance optimization مع useCallback
 * 8. ✅ Advanced filtering system
 * 9. ✅ Export functionality محسن
 * 10. ✅ TypeScript safety متقدم
 */