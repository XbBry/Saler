'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useT, useCurrentLocale } from '../../hooks/useI18n';
import useMessages from '../../hooks/useMessages';
import { Conversation, MessageType, ConversationStatus } from '../../types';
import { handleApiError } from '../../lib/api';

// Components
import ConversationList from '../../components/ui/ConversationList';
import MessageStatistics from '../../components/ui/MessageStatistics';
import QuickActions from '../../components/ui/QuickActions';
import EmptyState, { 
  NoConversationsEmptyState, 
  NoSearchResultsEmptyState, 
  ErrorEmptyState 
} from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';

// Icons (if not already imported)
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Settings, 
  BarChart3,
  RefreshCw,
  MessageSquare,
  Users,
  Calendar,
  Bell,
  Sun,
  Moon
} from 'lucide-react';

const MessagesPage: React.FC = () => {
  const router = useRouter();
  const t = useT();
  const locale = useCurrentLocale();
  const isRTL = locale === 'ar';

  // State
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | undefined>();
  const [messageTypeFilter, setMessageTypeFilter] = useState<MessageType | undefined>();
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Hook
  const {
    conversations,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    unreadCount,
    loadConversations,
    loadMore,
    refresh,
    createConversation,
    sendMessage,
    markAsRead,
    updateConversationStatus,
    setFilter,
    clearFilters,
    searchConversations,
    enableRealtimeUpdates,
    disableRealtimeUpdates,
  } = useMessages({
    page: 1,
    limit: 20,
    sort_by: 'last_message_at',
    sort_order: 'desc',
  });

  // Memoized values
  const hasConversations = conversations.length > 0;
  const hasError = Boolean(error);
  const isEmpty = !loading && !hasConversations && !searchQuery && !statusFilter && !messageTypeFilter;

  // Effects
  useEffect(() => {
    enableRealtimeUpdates();
    return () => disableRealtimeUpdates();
  }, [enableRealtimeUpdates, disableRealtimeUpdates]);

  // Handlers
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Navigate to conversation details
    router.push(`/dashboard/messages/${conversation.id}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchConversations(query);
  };

  const handleFilterChange = (key: string, value: any) => {
    if (key === 'status') {
      setStatusFilter(value || undefined);
      setFilter('status', value || undefined);
    } else if (key === 'message_type') {
      setMessageTypeFilter(value || undefined);
      setFilter('message_type', value || undefined);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter(undefined);
    setMessageTypeFilter(undefined);
    clearFilters();
  };

  const handleCreateConversation = async () => {
    try {
      // This would typically open a modal or navigate to a form
      console.log('Opening create conversation modal...');
      // For now, just show alert
      alert('سيتم فتح نموذج إنشاء محادثة جديدة');
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const handleSendMessage = async () => {
    try {
      // This would open a quick message modal
      console.log('Opening send message modal...');
      alert('سيتم فتح نموذج إرسال رسالة سريعة');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleBulkActions = (action: string) => {
    console.log(`Bulk action: ${action}`);
    // Handle bulk actions like archive, delete, etc.
    switch (action) {
      case 'archive':
        alert('سيتم أرشفة المحادثات المحددة');
        break;
      case 'delete':
        if (confirm('هل أنت متأكد من حذف المحادثات المحددة؟')) {
          alert('سيتم حذف المحادثات المحددة');
        }
        break;
      case 'search':
        // Focus search input
        document.querySelector('input[placeholder*="البحث"]')?.focus();
        break;
      case 'filter':
        // Scroll to filters
        document.querySelector('.filters-section')?.scrollIntoView({ behavior: 'smooth' });
        break;
      default:
        console.log(`Unhandled bulk action: ${action}`);
    }
  };

  const handleExport = () => {
    console.log('Exporting conversations...');
    alert('سيتم تصدير المحادثات كملف CSV');
  };

  const handleImport = () => {
    console.log('Importing conversations...');
    alert('سيتم فتح ملف لاستيراد المحادثات');
  };

  const handleViewAnalytics = () => {
    router.push('/dashboard/analytics?tab=messages');
  };

  const handleManageTemplates = () => {
    console.log('Managing message templates...');
    alert('سيتم فتح صفحة إدارة قوالب الرسائل');
  };

  const handleSettings = () => {
    router.push('/dashboard/settings?tab=messages');
  };

  const handleRefresh = () => {
    refresh();
  };

  // Loading state
  if (loading && !hasConversations) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <ErrorEmptyState
        onRetry={handleRefresh}
        onGoBack={() => router.back()}
        error={error}
      />
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <NoConversationsEmptyState
        onCreateConversation={handleCreateConversation}
        onImport={handleImport}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex">
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'lg:mr-80' : ''}`}>
          {/* Header */}
          <div className="bg-white shadow-sm border-b sticky top-0 z-10">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                {/* Title and Stats */}
                <div className="flex items-center space-x-4 space-x-reverse">
                  <h1 className="text-2xl font-bold text-gray-900">
                    إدارة المحادثات
                  </h1>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                    <span>{total} محادثة</span>
                    {unreadCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-red-600 font-medium">
                          {unreadCount} غير مقروء
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 space-x-reverse">
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={handleCreateConversation}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    محادثة جديدة
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="p-4">
            {/* Conversation List */}
            <div className="mb-6">
              <ConversationList
                conversations={conversations}
                loading={loading}
                onConversationSelect={handleConversationSelect}
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                selectedConversationId={selectedConversation?.id}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                messageTypeFilter={messageTypeFilter}
              />
            </div>

            {/* Load More Button */}
            {hasNext && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحميل...
                    </>
                  ) : (
                    'تحميل المزيد'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg border-l overflow-y-auto z-20 lg:relative lg:w-80 lg:shadow-none lg:border-l-0">
            <div className="p-6 space-y-6">
              {/* Close Button (Mobile) */}
              <div className="flex items-center justify-between lg:hidden">
                <h2 className="text-lg font-semibold text-gray-900">لوحة التحكم</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  ×
                </button>
              </div>

              {/* Statistics */}
              <MessageStatistics
                totalConversations={total}
                activeConversations={conversations.filter(c => c.status === 'active').length}
                totalMessages={conversations.reduce((sum, c) => sum + c.message_count, 0)}
                unreadCount={unreadCount}
                avgResponseTime={15} // Mock data
                responseRate={85} // Mock data
                loading={loading}
                messagesByType={{
                  whatsapp: 45,
                  sms: 32,
                  email: 28,
                  text: 15,
                }}
              />

              {/* Quick Actions */}
              <QuickActions
                onCreateConversation={handleCreateConversation}
                onSendMessage={handleSendMessage}
                onBulkActions={handleBulkActions}
                onExport={handleExport}
                onImport={handleImport}
                onViewAnalytics={handleViewAnalytics}
                onManageTemplates={handleManageTemplates}
                onSettings={handleSettings}
                loading={loading}
                disabled={loading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;