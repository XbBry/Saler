import React, { useState } from 'react';
import { 
  Conversation, 
  MessageType, 
  ConversationStatus 
} from '../../types';
import { useT, useFormatDate, useFormatNumber } from '../../hooks/useI18n';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  PauseCircle, 
  XCircle,
  Search,
  Filter,
  MoreVertical,
  Star
} from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  loading?: boolean;
  onConversationSelect: (conversation: Conversation) => void;
  onMarkAsRead?: (messageId: string) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (key: string, value: any) => void;
  selectedConversationId?: string;
  searchQuery?: string;
  statusFilter?: ConversationStatus;
  messageTypeFilter?: MessageType;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading = false,
  onConversationSelect,
  onMarkAsRead,
  onSearch,
  onFilterChange,
  selectedConversationId,
  searchQuery = '',
  statusFilter,
  messageTypeFilter,
}) => {
  const t = useT();
  const formatDate = useFormatDate();
  const formatNumber = useFormatNumber();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    onSearch?.(value);
  };

  const getMessageTypeIcon = (type: MessageType) => {
    switch (type) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'sms':
        return <Phone className="w-4 h-4 text-blue-600" />;
      case 'email':
        return <Mail className="w-4 h-4 text-red-600" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: ConversationStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'paused':
        return <PauseCircle className="w-4 h-4 text-yellow-600" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: ConversationStatus) => {
    switch (status) {
      case 'active':
        return 'نشطة';
      case 'paused':
        return 'معلقة';
      case 'closed':
        return 'مغلقة';
      default:
        return 'غير محدد';
    }
  };

  const getStatusColor = (status: ConversationStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'أمس';
    } else {
      return formatDate(date, { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Search and Filter Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث في المحادثات..."
              value={localSearch}
              onChange={handleSearchChange}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border ${
              showFilters ? 'bg-blue-50 border-blue-200' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حالة المحادثة
                </label>
                <select
                  value={statusFilter || ''}
                  onChange={(e) => onFilterChange?.('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">جميع الحالات</option>
                  <option value="active">نشطة</option>
                  <option value="paused">معلقة</option>
                  <option value="closed">مغلقة</option>
                </select>
              </div>

              {/* Message Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الرسالة
                </label>
                <select
                  value={messageTypeFilter || ''}
                  onChange={(e) => onFilterChange?.('message_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">جميع الأنواع</option>
                  <option value="whatsapp">واتساب</option>
                  <option value="sms">رسالة نصية</option>
                  <option value="email">بريد إلكتروني</option>
                  <option value="text">رسالة</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="divide-y divide-gray-200">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد محادثات</h3>
            <p className="mt-1 text-sm text-gray-500">
              ابدأ محادثة جديدة لعرضها هنا
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onConversationSelect(conversation)}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedConversationId === conversation.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 space-x-reverse mb-2">
                    {/* Avatar/Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          محادثة #{conversation.id.slice(-8)}
                        </h3>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getStatusIcon(conversation.status)}
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(conversation.status)}`}>
                            {getStatusText(conversation.status)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 space-x-reverse mt-1">
                        <p className="text-sm text-gray-500">
                          {formatNumber(conversation.message_count)} رسالة
                        </p>
                        <span className="text-gray-300">•</span>
                        <p className="text-sm text-gray-500">
                          آخر رسالة: {formatLastMessageTime(conversation.last_message_at)}
                        </p>
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center space-x-4 space-x-reverse mt-2">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDate(conversation.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle favorite/unfavorite
                    }}
                    className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle more actions
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {conversations.length > 0 && (
        <div className="p-4 border-t">
          <button
            onClick={() => {
              // This would be handled by parent component
            }}
            className="w-full py-2 px-4 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            تحميل المزيد
          </button>
        </div>
      )}
    </div>
  );
};

export default ConversationList;