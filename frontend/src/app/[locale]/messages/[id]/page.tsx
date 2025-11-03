'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Components
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { 
  Phone, 
  Video, 
  Settings, 
  X, 
  Send, 
  Paperclip, 
  Smile, 
  MoreHorizontal,
  Search,
  Download,
  FileText,
  Image,
  Mic,
  MicOff,
  ScreenShare,
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Users,
  Bot,
  Loader2,
  ChevronDown,
  Pin,
  Archive,
  Star,
  Volume2,
  VolumeX
} from 'lucide-react';

// Types
import type {
  Message,
  Conversation,
  Lead,
  MessageTemplate,
  MessageAttachment,
  MessageContent,
  TypingIndicator,
  OnlineStatus,
  MessageType
} from '@/types';

// Constants
const MESSAGE_PAGE_SIZE = 50;
const TYPING_TIMEOUT = 3000;
const AUTO_SAVE_INTERVAL = 30000;

// دالة مساعدة للحصول على اسم المستخدم أو العميل
const getDisplayName = (lead: Lead) => {
  return lead.name || lead.email || 'عميل غير محدد';
};

// دالة مساعدة لتنسيق الوقت
const formatMessageTime = (date: string, locale: string) => {
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true, 
    locale: locale === 'ar' ? ar : undefined 
  });
};

// دالة مساعدة لحساب مدة المحادثة
const getConversationDuration = (startTime: string, endTime?: string) => {
  const end = endTime ? new Date(endTime) : new Date();
  const duration = Math.floor((end.getTime() - new Date(startTime).getTime()) / 1000);
  
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// ==================== MESSAGE BUBBLE COMPONENT ====================

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  lead?: Lead;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onDownload?: (attachment: MessageAttachment) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  lead,
  onReply,
  onReact,
  onDownload
}) => {
  const [showActions, setShowActions] = useState(false);
  
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <CheckCircle className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCircle2 className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const renderContent = () => {
    if (message.metadata?.type === 'file') {
      const attachment = message.metadata.attachment as MessageAttachment;
      return (
        <div className="flex items-center space-x-2 p-3 bg-white/10 rounded-lg">
          <FileText className="h-5 w-5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.filename}</p>
            <p className="text-xs opacity-75">{(attachment.size / 1024).toFixed(1)} KB</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDownload?.(attachment)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (message.metadata?.type === 'image') {
      const attachment = message.metadata.attachment as MessageAttachment;
      return (
        <div className="space-y-2">
          <img 
            src={attachment.url} 
            alt={attachment.filename}
            className="max-w-xs max-h-48 rounded-lg object-cover cursor-pointer"
            onClick={() => window.open(attachment.url, '_blank')}
          />
          {message.content && (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
      );
    }

    return <p className="text-sm leading-relaxed">{message.content}</p>;
  };

  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="flex-shrink-0 mr-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {getDisplayName(lead!).charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div
            className={`
              relative px-4 py-3 rounded-2xl shadow-sm max-w-full break-words
              ${isOwn 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md' 
                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
              }
            `}
          >
            {/* Reply Indicator */}
            {message.metadata?.reply_to && (
              <div className="text-xs opacity-75 mb-2 pb-2 border-b border-white/20">
                رد على رسالة
              </div>
            )}
            
            {renderContent()}
            
            {/* Time and Status */}
            <div className={`flex items-center space-x-1 mt-2 text-xs ${
              isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <span>{formatMessageTime(message.created_at, 'ar')}</span>
              {isOwn && getStatusIcon()}
            </div>

            {/* Message Actions */}
            {showActions && (
              <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-10`}>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onReply?.(message)}
                    className="h-6 w-6 p-0"
                  >
                    <span className="text-xs">↩</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <Smile className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MESSAGE COMPOSER COMPONENT ====================

interface MessageComposerProps {
  conversationId: string;
  onSendMessage: (content: string, type: MessageType) => Promise<void>;
  disabled?: boolean;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  conversationId,
  onSendMessage,
  disabled = false,
  onTypingStart,
  onTypingEnd
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<MessageTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingEnd?.();
    }, TYPING_TIMEOUT);
  };

  // Send message
  const handleSend = async () => {
    if (!message.trim() || disabled) return;

    try {
      await onSendMessage(message.trim(), 'text');
      setMessage('');
      setIsTyping(false);
      onTypingEnd?.();
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      toast.error('فشل في إرسال الرسالة');
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      console.log('Selected file:', file);
    }
  };

  // Quick templates (this would come from API in real app)
  const quickTemplates = [
    { id: '1', name: 'تحية ترحيب', content: 'مرحباً بك، كيف يمكنني مساعدتك؟' },
    { id: '2', name: 'تأكيد الموعد', content: 'تم تأكيد موعدك معنا' },
    { id: '3', name: 'شكر وتقدير', content: 'شكراً لك على وقتك' }
  ];

  const [templates] = useState(quickTemplates);

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Quick Reply Templates */}
      {showTemplates && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">قوالب الرد السريع</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowTemplates(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => setMessage(template.content)}
                className="text-xs"
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-end space-x-2">
        {/* Attachment Button */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </div>

        {/* Message Text Area */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك..."
              className="w-full min-h-[40px] max-h-[120px] px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled}
              rows={1}
            />
            
            {/* Templates Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Voice Message Button */}
        <div className="flex-shrink-0">
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            onClick={() => setIsRecording(!isRecording)}
            disabled={disabled}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        </div>

        {/* Send Button */}
        <div className="flex-shrink-0">
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mt-2 flex items-center space-x-2 text-red-600">
          <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse" />
          <span className="text-sm">جاري التسجيل...</span>
        </div>
      )}
    </div>
  );
};

// ==================== CONVERSATION SIDEBAR COMPONENT ====================

interface ConversationSidebarProps {
  conversation: Conversation;
  lead: Lead;
  recentActivities: Array<{
    id: string;
    type: 'call' | 'email' | 'meeting' | 'note';
    description: string;
    timestamp: string;
  }>;
  aiSuggestions: Array<{
    id: string;
    type: 'suggestion' | 'question' | 'action';
    content: string;
    confidence: number;
  }>;
  onClose?: () => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversation,
  lead,
  recentActivities,
  aiSuggestions,
  onClose
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <FileText className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">معلومات المحادثة</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Lead Information */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
              {getDisplayName(lead).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{getDisplayName(lead)}</h3>
              <p className="text-sm text-gray-500">{lead.email}</p>
              {lead.phone && <p className="text-sm text-gray-500">{lead.phone}</p>}
            </div>
          </div>

          {/* Lead Details */}
          <div className="space-y-2 text-sm">
            {lead.company && (
              <div className="flex justify-between">
                <span className="text-gray-500">الشركة:</span>
                <span>{lead.company}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">الحالة:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                conversation.status === 'active' ? 'bg-green-100 text-green-800' :
                conversation.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {conversation.status === 'active' ? 'نشطة' :
                 conversation.status === 'paused' ? 'متوقفة' : 'منتهية'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">مدة المحادثة:</span>
              <span>{getConversationDuration(conversation.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">عدد الرسائل:</span>
              <span>{conversation.message_count}</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium mb-3">الأنشطة الأخيرة</h3>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-1 bg-gray-100 rounded">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {formatMessageTime(activity.timestamp, 'ar')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Bot className="h-4 w-4 text-blue-500" />
            <h3 className="font-medium">اقتراحات الذكاء الاصطناعي</h3>
          </div>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-600">
                    ثقة {Math.round(suggestion.confidence * 100)}%
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Star className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-gray-700">{suggestion.content}</p>
                <div className="mt-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    استخدام
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN CONVERSATION PAGE ====================

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const queryClient = useQueryClient();
  
  const conversationId = params.id as string;
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Fetch conversation data
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      // Mock API call - replace with actual API
      return {
        id: conversationId,
        lead_id: 'lead-1',
        status: 'active' as const,
        last_message_at: new Date().toISOString(),
        message_count: 42,
        created_at: new Date(Date.now() - 3600000).toISOString()
      } as Conversation;
    },
    enabled: !!conversationId
  });

  // Fetch lead data
  const { data: lead } = useQuery({
    queryKey: ['lead', conversation?.lead_id],
    queryFn: async () => {
      // Mock API call - replace with actual API
      return {
        id: 'lead-1',
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        phone: '+966501234567',
        company: 'شركة التقنية المتقدمة',
        status: 'qualified' as const,
        score: 85,
        created_at: new Date().toISOString()
      } as Lead;
    },
    enabled: !!conversation?.lead_id
  });

  // Fetch messages
  const { 
    data: messages = [], 
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 0 }) => {
      // Mock API call - replace with actual API
      const mockMessages: Message[] = Array.from({ length: MESSAGE_PAGE_SIZE }, (_, i) => ({
        id: `msg-${pageParam * MESSAGE_PAGE_SIZE + i}`,
        conversation_id: conversationId,
        content: i % 3 === 0 ? 'مرحباً بك' : i % 3 === 1 ? 'كيف يمكنني مساعدتك؟' : 'شكراً لك',
        type: 'text' as const,
        direction: i % 2 === 0 ? 'outbound' : 'inbound',
        status: 'sent' as const,
        created_at: new Date(Date.now() - (MESSAGE_PAGE_SIZE - i) * 60000).toISOString()
      }));
      return mockMessages;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.length === MESSAGE_PAGE_SIZE ? 
        Math.floor(lastPage.length / MESSAGE_PAGE_SIZE) + 1 : undefined;
    },
    enabled: !!conversationId
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, type }: { content: string; type: MessageType }) => {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        conversation_id: conversationId,
        content,
        type,
        direction: 'outbound',
        status: 'sent',
        created_at: new Date().toISOString()
      };
      
      return newMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      toast.success('تم إرسال الرسالة');
    },
    onError: () => {
      toast.error('فشل في إرسال الرسالة');
    }
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!conversationId) return;

    // Mock WebSocket connection
    setConnectionStatus('connecting');
    
    const ws = new WebSocket(`ws://localhost:8000/ws/conversations/${conversationId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'new_message':
          queryClient.setQueryData(['messages', conversationId], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              pages: [
                ...old.pages.slice(0, -1),
                [...old.pages[old.pages.length - 1], data.message]
              ]
            };
          });
          break;
          
        case 'typing_indicator':
          // Handle typing indicator
          break;
          
        case 'message_status_update':
          queryClient.setQueryData(['messages', conversationId], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page: Message[]) =>
                page.map((msg: Message) =>
                  msg.id === data.messageId 
                    ? { ...msg, status: data.status }
                    : msg
                )
              )
            };
          });
          break;
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      console.log('WebSocket disconnected');
    };

    ws.onerror = () => {
      setConnectionStatus('disconnected');
      console.error('WebSocket error');
    };

    return () => {
      ws.close();
    };
  }, [conversationId, queryClient]);

  // Handle send message
  const handleSendMessage = async (content: string, type: MessageType) => {
    await sendMessageMutation.mutateAsync({ content, type });
  };

  // Handle typing indicator
  const handleTypingStart = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing_start',
        conversation_id: conversationId
      }));
    }
  };

  const handleTypingEnd = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing_end',
        conversation_id: conversationId
      }));
    }
  };

  // Handle message actions
  const handleReply = (message: Message) => {
    setSelectedMessage(message);
  };

  const handleReact = (messageId: string, emoji: string) => {
    // Handle message reaction
    console.log('React to message:', messageId, emoji);
  };

  const handleDownload = (attachment: MessageAttachment) => {
    // Handle file download
    window.open(attachment.url, '_blank');
  };

  // Mock data for recent activities and AI suggestions
  const recentActivities = [
    {
      id: '1',
      type: 'call' as const,
      description: 'مكالمة هاتفية لمدة 5 دقائق',
      timestamp: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: '2',
      type: 'email' as const,
      description: 'تم إرسال بريد إلكتروني',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  const aiSuggestions = [
    {
      id: '1',
      type: 'suggestion' as const,
      content: 'اقترح عليه منتجنا الجديد',
      confidence: 0.85
    },
    {
      id: '2',
      type: 'question' as const,
      content: 'ما هو حجم شركته؟',
      confidence: 0.72
    }
  ];

  if (conversationLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>جاري تحميل المحادثة...</span>
        </div>
      </div>
    );
  }

  if (!conversation || !lead) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">المحادثة غير موجودة</h2>
          <Button onClick={() => router.push('/messages')}>
            العودة إلى المحادثات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {getDisplayName(lead).charAt(0).toUpperCase()}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
              </div>
              <div>
                <h1 className="font-semibold">{getDisplayName(lead)}</h1>
                <p className="text-sm text-gray-500">
                  {connectionStatus === 'connected' ? 'متصل الآن' :
                   connectionStatus === 'connecting' ? 'جاري الاتصال...' :
                   'غير متصل'}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              {/* Voice Call */}
              <Button variant="ghost" size="icon">
                <Phone className="h-5 w-5" />
              </Button>

              {/* Video Call */}
              <Button variant="ghost" size="icon">
                <Video className="h-5 w-5" />
              </Button>

              {/* Screen Share */}
              <Button variant="ghost" size="icon">
                <ScreenShare className="h-5 w-5" />
              </Button>

              {/* Search */}
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>

              {/* Mute/Unmute */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>

              {/* More Options */}
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>

              {/* Conversation Settings */}
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                الإعدادات
              </Button>

              {/* End Conversation */}
              <Button variant="destructive">
                <X className="h-4 w-4 mr-2" />
                إنهاء المحادثة
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="البحث في الرسائل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {/* Load More Messages Button */}
          {hasNextPage && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  'تحميل رسائل أقدم'
                )}
              </Button>
            </div>
          )}

          {/* Messages List */}
          {messages.pages.flat().map((message: Message, index: number) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.direction === 'outbound'}
              lead={lead}
              showAvatar={message.direction === 'inbound'}
              onReply={handleReply}
              onReact={handleReact}
              onDownload={handleDownload}
            />
          ))}

          {/* Scroll Anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer */}
        <MessageComposer
          conversationId={conversationId}
          onSendMessage={handleSendMessage}
          disabled={sendMessageMutation.isPending}
          onTypingStart={handleTypingStart}
          onTypingEnd={handleTypingEnd}
        />
      </div>

      {/* Conversation Sidebar */}
      {showSidebar && (
        <ConversationSidebar
          conversation={conversation}
          lead={lead}
          recentActivities={recentActivities}
          aiSuggestions={aiSuggestions}
          onClose={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}