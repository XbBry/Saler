import React, { useState, useMemo } from 'react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Search,
  Pin,
  PinOff,
  Star,
  MoreVertical,
  Phone,
  Video,
  Users,
  Archive,
  Trash2,
  MessageCircle,
  Circle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: {
    content: string;
    timestamp: Date;
    senderId: string;
    type: 'text' | 'image' | 'file' | 'video';
  };
  unreadCount: number;
  isPinned: boolean;
  isStarred: boolean;
  isArchived: boolean;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  }[];
  type: 'direct' | 'group' | 'bot';
  status: 'online' | 'offline' | 'away' | 'busy';
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onPinConversation?: (conversationId: string) => void;
  onUnpinConversation?: (conversationId: string) => void;
  onStarConversation?: (conversationId: string) => void;
  onUnstarConversation?: (conversationId: string) => void;
  onArchiveConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onSearch?: (query: string) => void;
  className?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onPinConversation,
  onUnpinConversation,
  onStarConversation,
  onUnstarConversation,
  onArchiveConversation,
  onDeleteConversation,
  onSearch,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'starred' | 'archived'>('all');
  const [showActions, setShowActions] = useState<string | null>(null);

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(conv =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    switch (filter) {
      case 'pinned':
        filtered = filtered.filter(conv => conv.isPinned);
        break;
      case 'starred':
        filtered = filtered.filter(conv => conv.isStarred);
        break;
      case 'archived':
        filtered = filtered.filter(conv => conv.isArchived);
        break;
      default:
        filtered = filtered.filter(conv => !conv.isArchived);
    }

    // Sort: pinned first, then by last message time
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime();
    });
  }, [conversations, searchQuery, filter]);

  // Format last message time
  const formatLastMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'أمس';
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE', { locale: ar });
    } else {
      return format(date, 'dd/MM/yyyy', { locale: ar });
    }
  };

  // Get conversation type icon
  const getConversationTypeIcon = (conversation: Conversation) => {
    switch (conversation.type) {
      case 'group':
        return <Users className="w-4 h-4" />;
      case 'bot':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Circle className="w-2 h-2 fill-green-500 text-green-500" />;
      case 'away':
        return <Circle className="w-2 h-2 fill-yellow-500 text-yellow-500" />;
      case 'busy':
        return <Circle className="w-2 h-2 fill-red-500 text-red-500" />;
      default:
        return <Circle className="w-2 h-2 fill-gray-400 text-gray-400" />;
    }
  };

  // Truncate message content
  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-gray-800", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            المحادثات
          </h2>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="بحث في المحادثات..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch?.(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { key: 'all', label: 'الكل' },
            { key: 'pinned', label: 'مثبت' },
            { key: 'starred', label: 'مميز' },
            { key: 'archived', label: 'مؤرشف' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={cn(
                "flex-1 px-3 py-1.5 text-sm rounded-md transition-colors",
                filter === key
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mb-4" />
            <p className="text-center px-4">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد محادثات'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "relative group flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                  selectedConversationId === conversation.id
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700",
                  conversation.unreadCount > 0 && "bg-blue-25 dark:bg-blue-950/20"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0 ml-3">
                  {conversation.avatar ? (
                    <img
                      src={conversation.avatar}
                      alt={conversation.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {conversation.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Status indicator for direct conversations */}
                  {conversation.type === 'direct' && (
                    <div className="absolute -bottom-1 -right-1">
                      {getStatusIcon(conversation.status)}
                    </div>
                  )}
                </div>

                {/* Conversation info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={cn(
                        "font-medium truncate",
                        conversation.unreadCount > 0
                          ? "text-gray-900 dark:text-gray-100"
                          : "text-gray-700 dark:text-gray-300"
                      )}>
                        {conversation.name}
                      </h3>
                      {getConversationTypeIcon(conversation)}
                      {conversation.isPinned && (
                        <Pin className="w-3 h-3 text-gray-400" />
                      )}
                      {conversation.isStarred && (
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatLastMessageTime(conversation.lastMessage.timestamp)}
                      </span>
                      {showActions === conversation.id && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (conversation.isPinned) {
                                onUnpinConversation?.(conversation.id);
                              } else {
                                onPinConversation?.(conversation.id);
                              }
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            {conversation.isPinned ? (
                              <PinOff className="w-3 h-3" />
                            ) : (
                              <Pin className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (conversation.isStarred) {
                                onUnstarConversation?.(conversation.id);
                              } else {
                                onStarConversation?.(conversation.id);
                              }
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <Star className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchiveConversation?.(conversation.id);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <Archive className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation?.(conversation.id);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActions(showActions === conversation.id ? null : conversation.id);
                        }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {truncateMessage(conversation.lastMessage.content)}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;