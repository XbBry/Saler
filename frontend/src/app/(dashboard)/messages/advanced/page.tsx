'use client';

import React, { useState, useEffect } from 'react';
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
  Star,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Search,
  Plus,
  Eye,
  Edit,
  Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../../hooks/use-auth';
import { useRealtimeMessaging } from '../../../../hooks/useRealtimeMessaging';

import { AdvancedConversationView } from '../../../../components/messages/AdvancedConversationView';
import { AnalyticsDashboard } from '../../../../components/analytics/AnalyticsDashboard';
import { TemplateLibrary } from '../../../../components/templates/TemplateLibrary';
import { BroadcastCenter } from '../../../../components/messages/BroadcastCenter';
import { AutomationCenter } from '../../../../components/messages/AutomationCenter';

import {
  Channel,
  Conversation,
  MessageTemplate,
  Lead
} from '../../../../types';

type TabType = 'conversations' | 'analytics' | 'templates' | 'broadcast' | 'automation' | 'settings';

export default function AdvancedMessagesPage() {
  const { currentUser } = useAuth();
  const {
    isConnected,
    connectionStatus,
    onMessage,
    onUserOnline,
    onUserOffline
  } = useRealtimeMessaging();

  // State management
  const [activeTab, setActiveTab] = useState<TabType>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | 'all'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  
  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalMessages: 0,
    unreadMessages: 0,
    responseRate: 0,
    conversionRate: 0,
    avgResponseTime: 0,
    activeConversations: 0
  });

  // Load dashboard stats
  useEffect(() => {
    const loadDashboardStats = async () => {
      setIsLoading(true);
      try {
        // This would fetch from your analytics API
        // For now, using mock data
        setTimeout(() => {
          setDashboardStats({
            totalMessages: 1247,
            unreadMessages: 23,
            responseRate: 34.7,
            conversionRate: 8.2,
            avgResponseTime: 2.4,
            activeConversations: 45
          });
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError('فشل في تحميل إحصائيات لوحة التحكم');
        setIsLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  // Set up real-time event listeners
  useEffect(() => {
    const handleNewMessage = (message: any) => {
      // Update stats when new message arrives
      setDashboardStats(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 1,
        unreadMessages: message.direction === 'inbound' ? prev.unreadMessages + 1 : prev.unreadMessages
      }));
    };

    const handleUserOnline = (user: any) => {
      console.log('User came online:', user.name);
    };

    const handleUserOffline = (userId: string) => {
      console.log('User went offline:', userId);
    };

    onMessage(handleNewMessage);
    onUserOnline(handleUserOnline);
    onUserOffline(handleUserOffline);
  }, [onMessage, onUserOnline, onUserOffline]);

  const tabs = [
    {
      id: 'conversations' as TabType,
      label: 'المحادثات',
      icon: MessageSquare,
      count: dashboardStats.unreadMessages
    },
    {
      id: 'analytics' as TabType,
      label: 'التحليلات',
      icon: BarChart3
    },
    {
      id: 'templates' as TabType,
      label: 'القوالب',
      icon: Zap
    },
    {
      id: 'broadcast' as TabType,
      label: 'إرسال جماعي',
      icon: Send
    },
    {
      id: 'automation' as TabType,
      label: 'الأتمتة',
      icon: Settings
    }
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: 'up' | 'down' | 'stable';
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-xl border-l-4 ${color} bg-white shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className={`h-4 w-4 ${
                trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
              }`} />
              <span className={`text-sm ml-1 ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '0%'}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
          <Icon className={`h-6 w-6 ${color.replace('border-l-', 'text-').replace('-500', '-600')}`} />
        </div>
      </div>
    </motion.div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'conversations':
        return (
          <AdvancedConversationView
            conversationId={selectedConversation?.id}
            onConversationSelect={setSelectedConversation}
            className="h-full"
          />
        );
      
      case 'analytics':
        return (
          <AnalyticsDashboard
            type="messages"
            workspaceId={currentUser?.workspace_id}
            className="h-full"
          />
        );
      
      case 'templates':
        return (
          <TemplateLibrary
            workspaceId={currentUser?.workspace_id}
            onTemplateSelect={(template) => {
              // Handle template selection
              console.log('Selected template:', template);
            }}
            className="h-full"
          />
        );
      
      case 'broadcast':
        return (
          <BroadcastCenter
            workspaceId={currentUser?.workspace_id}
            onBroadcastComplete={(result) => {
              console.log('Broadcast completed:', result);
              // Refresh stats
              // loadDashboardStats();
            }}
            className="h-full"
          />
        );
      
      case 'automation':
        return (
          <AutomationCenter
            workspaceId={currentUser?.workspace_id}
            className="h-full"
          />
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                اختر تبويباً لبدء العمل
              </h3>
              <p className="text-gray-500">
                استخدم التبويبات أعلاه للتنقل بين وظائف الرسائل المختلفة
              </p>
            </div>
          </div>
        );
    }
  };

  if (isLoading && activeTab === 'conversations') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-2 text-gray-600">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <h1 className="text-2xl font-bold text-gray-900">الرسائل المتقدمة</h1>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-500">
                  {isConnected ? 'متصل' : 'منقطع'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث في الرسائل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Channel Filter */}
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value as Channel | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع القنوات</option>
                <option value="whatsapp">واتساب</option>
                <option value="sms">رسالة نصية</option>
                <option value="email">بريد إلكتروني</option>
                <option value="web_chat">محادثة ويب</option>
              </select>

              {/* Date Range */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
                <option value="custom">مخصص</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        {activeTab === 'conversations' && (
          <div className="px-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <StatCard
                title="إجمالي الرسائل"
                value={dashboardStats.totalMessages.toLocaleString()}
                icon={MessageSquare}
                color="border-l-blue-500"
                trend="up"
              />
              <StatCard
                title="رسائل غير مقروءة"
                value={dashboardStats.unreadMessages}
                icon={Inbox}
                color="border-l-orange-500"
              />
              <StatCard
                title="معدل الاستجابة"
                value={`${dashboardStats.responseRate}%`}
                icon={TrendingUp}
                color="border-l-green-500"
                trend="up"
              />
              <StatCard
                title="معدل التحويل"
                value={`${dashboardStats.conversionRate}%`}
                icon={Target}
                color="border-l-purple-500"
                trend="up"
              />
              <StatCard
                title="متوسط وقت الاستجابة"
                value={`${dashboardStats.avgResponseTime}س`}
                icon={Clock}
                color="border-l-yellow-500"
                trend="stable"
              />
              <StatCard
                title="المحادثات النشطة"
                value={dashboardStats.activeConversations}
                icon={Users}
                color="border-l-indigo-500"
                trend="up"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8 space-x-reverse">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 space-x-reverse py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs rounded-full px-2 py-1">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 text-red-400">
                {/* Error Icon */}
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="mr-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="mr-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">إغلاق</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}