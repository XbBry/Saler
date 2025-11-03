'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  Send,
  Paperclip,
  Image,
  Smile,
  Phone,
  Video,
  MoreVertical,
  Archive,
  Star,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Zap,
  User,
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

import { useMessages } from '../../hooks/useMessages';
import { useRealTimeNotifications } from '../notifications/RealTimeNotifications';
import { useAuth } from '../../hooks/use-auth';

import { ConversationList } from './ConversationList';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';
import { MessageStatus } from './MessageStatus';
import { TemplateSelector } from './TemplateSelector';
import { AttachmentPicker } from './AttachmentPicker';

import {
  Conversation,
  Message,
  Lead,
  User as UserType,
  MessageStatus as MessageStatusType,
  Channel,
  SendMessageRequest
} from '../../types';

interface AdvancedConversationViewProps {
  conversationId?: string;
  leadId?: string;
  onConversationSelect?: (conversation: Conversation) => void;
  className?: string;
}

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy';
  typing?: boolean;
  lastSeen?: Date;
}

export const AdvancedConversationView: React.FC<AdvancedConversationViewProps> = ({
  conversationId,
  leadId,
  onConversationSelect,
  className = ''
}) => {
  // State
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'conversations' | 'messages'>('conversations');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Hooks
  const { currentUser } = useAuth();
  const { conversations, loading, error, sendMessage, markAsRead, enableRealtimeUpdates } = useMessages();
  const { isConnected } = useRealTimeNotifications();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle conversation selection
  const handleConversationSelect = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    setViewMode('messages');
    onConversationSelect?.(conversation);
    
    // Mark as read
    if (conversation.unread_count > 0) {
      // This would be implemented to mark conversation as read
    }
    
    // Join conversation room for real-time updates
    if (isConnected) {
      // This would join the conversation WebSocket room
    }
  }, [isConnected, onConversationSelect]);

  // Handle message send
  const handleSendMessage = useCallback(async (data: SendMessageRequest) => {
    if (!selectedConversation) return;

    try {
      await sendMessage({
        ...data,
        conversation_id: selectedConversation.id
      });
      
      // Clear any pending attachment or template data
      setShowTemplates(false);
      setShowAttachments(false);
      
      // Scroll to bottom after sending
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [selectedConversation, sendMessage, scrollToBottom]);

  // Handle typing indicators
  const handleTyping = useCallback((isTyping: boolean) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      setIsTyping(true);
      
      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    } else {
      setIsTyping(false);
    }

    // Send typing indicator via WebSocket
    if (isConnected && selectedConversation) {
      // This would send typing status via WebSocket
    }
  }, [isConnected, selectedConversation]);

  // Filter conversations
  const filteredConversations = conversations.filter(conversation => {
    // Apply status filter
    if (filterStatus === 'unread' && conversation.unread_count === 0) return false;
    if (filterStatus === 'archived' && !conversation.is_archived) return false;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesLead = conversation.lead?.name?.toLowerCase().includes(query);
      const matchesLastMessage = conversation.last_message?.content?.toLowerCase().includes(query);
      
      if (!matchesLead && !matchesLastMessage) return false;
    }

    return true;
  });

  // Load online users
  useEffect(() => {
    // Simulate loading online users
    const loadOnlineUsers = async () => {
      // This would fetch from your API
      const users: OnlineUser[] = [
        {
          id: 'user1',
          name: 'أحمد محمد',
          status: 'online',
          typing: false
        },
        {
          id: 'user2',
          name: 'فاطمة أحمد',
          status: 'away',
          lastSeen: new Date(Date.now() - 300000) // 5 minutes ago
        }
      ];
      setOnlineUsers(users);
    };

    loadOnlineUsers();
  }, []);

  // Enable real-time updates
  useEffect(() => {
    enableRealtimeUpdates();
  }, [enableRealtimeUpdates]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (viewMode === 'messages') {
      scrollToBottom();
    }
  }, [selectedConversation?.messages, scrollToBottom, viewMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-2 text-gray-600">جاري التحميل...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل المحادثات</h3>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full bg-white ${className}`}>
      {/* Sidebar - Conversations List */}
      <AnimatePresence>
        {(viewMode === 'conversations' || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-80 border-r border-gray-200 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">المحادثات</h2>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-500">
                    {isConnected ? 'متصل' : 'منقطع'}
                  </span>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="البحث في المحادثات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filterStatus === 'all'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setFilterStatus('unread')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filterStatus === 'unread'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    غير مقروءة
                  </button>
                  <button
                    onClick={() => setFilterStatus('archived')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filterStatus === 'archived'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    مؤرشفة
                  </button>
                </div>
              </div>
            </div>

            {/* Online Users */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">متصل الآن</h3>
              <div className="space-y-2">
                {onlineUsers
                  .filter(user => user.status === 'online')
                  .map(user => (
                    <div key={user.id} className="flex items-center space-x-3 space-x-reverse">
                      <div className="relative">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      </div>
                      <span className="text-sm text-gray-700">{user.name}</span>
                      {user.typing && (
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-100" />
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-200" />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={filteredConversations}
                selectedConversationId={selectedConversation?.id}
                onConversationSelect={handleConversationSelect}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <button
                    onClick={() => setViewMode('conversations')}
                    className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                  
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.lead?.name || 'محادثة جديدة'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedConversation.channel === 'whatsapp' ? 'واتساب' :
                         selectedConversation.channel === 'sms' ? 'رسالة نصية' :
                         selectedConversation.channel === 'email' ? 'بريد إلكتروني' : 'محادثة'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {selectedConversation.messages?.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.direction === 'outbound'}
                  onRead={() => markAsRead(message.id)}
                />
              ))}
              
              {/* Typing Indicator */}
              <AnimatePresence>
                {typingUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center space-x-2 space-x-reverse text-gray-500"
                  >
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200" />
                    </div>
                    <span className="text-sm">جاري الكتابة...</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex items-end space-x-2 space-x-reverse">
                {/* Attachment Button */}
                <button
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                {/* Template Button */}
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <Zap className="h-5 w-5" />
                </button>

                {/* Message Input */}
                <div className="flex-1">
                  <MessageComposer
                    onSend={handleSendMessage}
                    onTyping={handleTyping}
                    placeholder="اكتب رسالتك..."
                    disabled={isRecording}
                  />
                </div>

                {/* Voice Recording Button */}
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`p-2 rounded-lg ${
                    isRecording
                      ? 'text-red-600 bg-red-100'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                {/* Send Button */}
                <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Send className="h-5 w-5" />
                </button>

                {/* Mute Button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>

              {/* Template Selector */}
              <AnimatePresence>
                {showTemplates && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4"
                  >
                    <TemplateSelector
                      channel={selectedConversation.channel}
                      onTemplateSelect={(template) => {
                        // Handle template selection
                        setShowTemplates(false);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Attachment Picker */}
              <AnimatePresence>
                {showAttachments && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4"
                  >
                    <AttachmentPicker
                      onAttachmentSelect={(attachment) => {
                        // Handle attachment selection
                        setShowAttachments(false);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                اختر محادثة لبدء التواصل
              </h3>
              <p className="text-gray-500">
                اختر محادثة من القائمة لبدء المراسلة الفورية
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedConversationView;