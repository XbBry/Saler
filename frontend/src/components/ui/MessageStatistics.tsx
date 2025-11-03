import React from 'react';
import { useT, useFormatNumber } from '../../hooks/useI18n';
import { 
  MessageCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface MessageStatisticsProps {
  totalConversations?: number;
  activeConversations?: number;
  totalMessages?: number;
  unreadCount?: number;
  avgResponseTime?: number;
  responseRate?: number;
  messagesByType?: {
    whatsapp?: number;
    sms?: number;
    email?: number;
    text?: number;
  };
  loading?: boolean;
}

const MessageStatistics: React.FC<MessageStatisticsProps> = ({
  totalConversations = 0,
  activeConversations = 0,
  totalMessages = 0,
  unreadCount = 0,
  avgResponseTime = 0,
  responseRate = 0,
  messagesByType = {},
  loading = false,
}) => {
  const t = useT();
  const formatNumber = useFormatNumber();

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
    trend?: {
      value: number;
      isPositive: boolean;
    };
  }> = ({ title, value, icon, color, subtitle, trend }) => (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`text-xs flex items-center ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`w-3 h-3 ml-1 ${
              !trend.isPositive ? 'rotate-180' : ''
            }`} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );

  const MessageTypeCard: React.FC<{
    type: string;
    count: number;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  }> = ({ type, count, icon, color, bgColor }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3 space-x-reverse">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 capitalize">{type}</p>
          <p className="text-xs text-gray-500">{formatNumber(count)} رسالة</p>
        </div>
      </div>
      <div className="text-lg font-bold text-gray-900">
        {formatNumber(count)}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">إحصائيات الرسائل</h3>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">إحصائيات الرسائل</h3>
        
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <StatCard
            title="إجمالي المحادثات"
            value={formatNumber(totalConversations)}
            icon={<MessageCircle className="w-5 h-5 text-blue-600" />}
            color="bg-blue-100"
            subtitle={`${formatNumber(activeConversations)} نشطة`}
          />
          
          <StatCard
            title="إجمالي الرسائل"
            value={formatNumber(totalMessages)}
            icon={<MessageSquare className="w-5 h-5 text-green-600" />}
            color="bg-green-100"
          />
          
          <StatCard
            title="رسائل غير مقروءة"
            value={unreadCount}
            icon={<AlertCircle className="w-5 h-5 text-red-600" />}
            color="bg-red-100"
            subtitle={unreadCount > 0 ? 'تحتاج لمراجعة' : 'جميع الرسائل مقروءة'}
          />
          
          <StatCard
            title="متوسط وقت الرد"
            value={`${Math.round(avgResponseTime)} دقيقة`}
            icon={<Clock className="w-5 h-5 text-purple-600" />}
            color="bg-purple-100"
          />
        </div>
      </div>

      {/* Response Rate */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">معدل الاستجابة</h4>
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray={`${responseRate}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900">
                {responseRate}%
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">معدل الاستجابة</p>
        </div>
      </div>

      {/* Messages by Type */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">الرسائل حسب النوع</h4>
        <div className="space-y-3">
          {messagesByType.whatsapp && (
            <MessageTypeCard
              type="واتساب"
              count={messagesByType.whatsapp}
              icon={<MessageSquare className="w-4 h-4 text-green-600" />}
              color="text-green-600"
              bgColor="bg-green-100"
            />
          )}
          
          {messagesByType.sms && (
            <MessageTypeCard
              type="رسالة نصية"
              count={messagesByType.sms}
              icon={<Phone className="w-4 h-4 text-blue-600" />}
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
          )}
          
          {messagesByType.email && (
            <MessageTypeCard
              type="بريد إلكتروني"
              count={messagesByType.email}
              icon={<Mail className="w-4 h-4 text-red-600" />}
              color="text-red-600"
              bgColor="bg-red-100"
            />
          )}
          
          {messagesByType.text && (
            <MessageTypeCard
              type="رسالة"
              count={messagesByType.text}
              icon={<MessageCircle className="w-4 h-4 text-gray-600" />}
              color="text-gray-600"
              bgColor="bg-gray-100"
            />
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">النشاط الأخير</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">محادثة جديدة</p>
              <p className="text-xs text-gray-500">منذ 5 دقائق</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">رسالة واردة</p>
              <p className="text-xs text-gray-500">منذ 12 دقيقة</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">رد تم إرساله</p>
              <p className="text-xs text-gray-500">منذ 18 دقيقة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageStatistics;