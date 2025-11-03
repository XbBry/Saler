import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { useToast } from './useToast';

export interface RealtimeMessage {
  id: string;
  conversation_id: string;
  lead_id: string;
  content: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'web_chat';
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  metadata?: any;
  attachments?: any[];
  is_automated?: boolean;
  template_id?: string;
}

export interface TypingIndicator {
  user_id: string;
  conversation_id: string;
  is_typing: boolean;
  timestamp: string;
}

export interface OnlineUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy';
  last_seen?: string;
  current_conversation?: string;
}

export interface MessageDeliveryStatus {
  message_id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  error_message?: string;
}

interface UseRealtimeMessagingOptions {
  enableReconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  heartbeatInterval?: number;
}

interface UseRealtimeMessagingReturn {
  // Connection state
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  connectionError: string | null;
  
  // Messages
  sendMessage: (message: Omit<RealtimeMessage, 'id' | 'timestamp'>) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markAsDelivered: (messageId: string) => Promise<void>;
  
  // Typing indicators
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  getTypingUsers: (conversationId: string) => string[];
  
  // Presence
  getOnlineUsers: (workspaceId?: string) => Promise<OnlineUser[]>;
  updatePresenceStatus: (status: 'online' | 'away' | 'busy') => void;
  
  // Rooms
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  joinWorkspace: (workspaceId: string) => void;
  
  // Delivery tracking
  subscribeToDeliveryUpdates: (messageIds: string[]) => void;
  unsubscribeFromDeliveryUpdates: (messageIds: string[]) => void;
  
  // Event listeners
  onMessage: (callback: (message: RealtimeMessage) => void) => void;
  onTypingStart: (callback: (indicator: TypingIndicator) => void) => void;
  onTypingStop: (callback: (indicator: TypingIndicator) => void) => void;
  onUserOnline: (callback: (user: OnlineUser) => void) => void;
  onUserOffline: (callback: (userId: string) => void) => void;
  onDeliveryUpdate: (callback: (status: MessageDeliveryStatus) => void) => void;
  
  // Cleanup
  disconnect: () => void;
  connect: () => void;
}

export const useRealtimeMessaging = (
  options: UseRealtimeMessagingOptions = {}
): UseRealtimeMessagingReturn => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  // Socket connection
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // State management
  const [messages, setMessages] = useState<Map<string, RealtimeMessage>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());
  const [currentRooms, setCurrentRooms] = useState<Set<string>>(new Set());
  const [subscribedMessages, setSubscribedMessages] = useState<Set<string>>(new Set());
  
  // Event listeners
  const messageCallbacks = useRef<Set<(message: RealtimeMessage) => void>>(new Set());
  const typingStartCallbacks = useRef<Set<(indicator: TypingIndicator) => void>>(new Set());
  const typingStopCallbacks = useRef<Set<(indicator: TypingIndicator) => void>>(new Set());
  const userOnlineCallbacks = useRef<Set<(user: OnlineUser) => void>>(new Set());
  const userOfflineCallbacks = useRef<Set<(userId: string) => void>>(new Set());
  const deliveryUpdateCallbacks = useRef<Set<(status: MessageDeliveryStatus) => void>>(new Set());
  
  // Configuration
  const {
    enableReconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    heartbeatInterval = 30000
  } = options;
  
  // WebSocket connection
  const connect = useCallback(() => {
    if (!currentUser || socketRef.current?.connected) return;
    
    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000/ws';
    
    socketRef.current = io(socketUrl, {
      auth: {
        token: currentUser.access_token,
        user_id: currentUser.id,
        workspace_id: currentUser.workspace_id
      },
      transports: ['websocket'],
      timeout: 20000,
      forceNew: true
    });
    
    const socket = socketRef.current;
    
    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setConnectionError(null);
      console.log('✅ Connected to messaging server');
      
      showToast({
        title: 'متصل',
        description: 'تم الاتصال بنظام الرسائل الفورية',
        type: 'success'
      });
    });
    
    socket.on('connecting', () => {
      setConnectionStatus('connecting');
    });
    
    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      if (reason !== 'io client disconnect') {
        showToast({
          title: 'انقطع الاتصال',
          description: 'تم قطع الاتصال بالخادم',
          type: 'error'
        });
      }
      
      console.log('❌ Disconnected from messaging server:', reason);
    });
    
    socket.on('connect_error', (error) => {
      setIsConnected(false);
      setConnectionStatus('error');
      setConnectionError(error.message);
      console.error('🔴 Connection error:', error);
      
      showToast({
        title: 'خطأ في الاتصال',
        description: 'فشل في الاتصال بخادم الرسائل',
        type: 'error'
      });
    });
    
    // Message events
    socket.on('message', (message: RealtimeMessage) => {
      setMessages(prev => new Map(prev.set(message.id, message)));
      
      // Notify listeners
      messageCallbacks.current.forEach(callback => callback(message));
      
      // Auto-acknowledge for inbound messages
      if (message.direction === 'inbound' && message.status === 'pending') {
        markAsDelivered(message.id);
      }
    });
    
    socket.on('message_sent', (data: { message: RealtimeMessage }) => {
      const message = data.message;
      setMessages(prev => new Map(prev.set(message.id, message)));
      messageCallbacks.current.forEach(callback => callback(message));
    });
    
    socket.on('message_delivered', (data: { message_id: string; timestamp: string }) => {
      setMessages(prev => {
        const updated = new Map(prev);
        const message = updated.get(data.message_id);
        if (message) {
          message.status = 'delivered';
          updated.set(data.message_id, message);
        }
        return updated;
      });
    });
    
    socket.on('message_read', (data: { message_id: string; timestamp: string }) => {
      setMessages(prev => {
        const updated = new Map(prev);
        const message = updated.get(data.message_id);
        if (message) {
          message.status = 'read';
          updated.set(data.message_id, message);
        }
        return updated;
      });
    });
    
    socket.on('message_failed', (data: { message_id: string; error: string }) => {
      setMessages(prev => {
        const updated = new Map(prev);
        const message = updated.get(data.message_id);
        if (message) {
          message.status = 'failed';
          message.metadata = { ...message.metadata, error: data.error };
          updated.set(data.message_id, message);
        }
        return updated;
      });
      
      showToast({
        title: 'فشل في إرسال الرسالة',
        description: data.error,
        type: 'error'
      });
    });
    
    // Typing indicators
    socket.on('typing_start', (data: TypingIndicator) => {
      setTypingUsers(prev => {
        const updated = new Map(prev);
        const conversationTyping = updated.get(data.conversation_id) || new Set();
        conversationTyping.add(data.user_id);
        updated.set(data.conversation_id, conversationTyping);
        return updated;
      });
      
      typingStartCallbacks.current.forEach(callback => callback(data));
    });
    
    socket.on('typing_stop', (data: TypingIndicator) => {
      setTypingUsers(prev => {
        const updated = new Map(prev);
        const conversationTyping = updated.get(data.conversation_id) || new Set();
        conversationTyping.delete(data.user_id);
        updated.set(data.conversation_id, conversationTyping);
        return updated;
      });
      
      typingStopCallbacks.current.forEach(callback => callback(data));
    });
    
    // Presence events
    socket.on('user_online', (user: OnlineUser) => {
      setOnlineUsers(prev => new Map(prev.set(user.id, user)));
      userOnlineCallbacks.current.forEach(callback => callback(user));
    });
    
    socket.on('user_offline', (data: { user_id: string }) => {
      setOnlineUsers(prev => {
        const updated = new Map(prev);
        updated.delete(data.user_id);
        return updated;
      });
      userOfflineCallbacks.current.forEach(callback => callback(data.user_id));
    });
    
    socket.on('presence_update', (user: OnlineUser) => {
      setOnlineUsers(prev => new Map(prev.set(user.id, user)));
    });
    
    socket.on('online_users', (users: OnlineUser[]) => {
      setOnlineUsers(new Map(users.map(user => [user.id, user])));
    });
    
    // Delivery tracking
    socket.on('delivery_update', (status: MessageDeliveryStatus) => {
      deliveryUpdateCallbacks.current.forEach(callback => callback(status));
      
      // Update local message state
      if (status.status === 'delivered' || status.status === 'read') {
        setMessages(prev => {
          const updated = new Map(prev);
          const message = updated.get(status.message_id);
          if (message) {
            message.status = status.status as any;
            updated.set(status.message_id, message);
          }
          return updated;
        });
      }
    });
    
    // Error handling
    socket.on('error', (error: { message: string }) => {
      setConnectionError(error.message);
      showToast({
        title: 'خطأ',
        description: error.message,
        type: 'error'
      });
    });
    
    // Heartbeat
    const heartbeat = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, heartbeatInterval);
    
    socket.once('disconnect', () => {
      clearInterval(heartbeat);
    });
    
  }, [currentUser, showToast, heartbeatInterval]);
  
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setCurrentRooms(new Set());
    setTypingUsers(new Map());
  }, []);
  
  // Auto-connect when user is available
  useEffect(() => {
    if (currentUser && !isConnected && connectionStatus === 'disconnected') {
      connect();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUser, connect, isConnected, connectionStatus]);
  
  // Send message
  const sendMessage = useCallback(async (message: Omit<RealtimeMessage, 'id' | 'timestamp'>) => {
    if (!socketRef.current?.connected) {
      throw new Error('Not connected to messaging server');
    }
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const fullMessage: RealtimeMessage = {
      ...message,
      id: messageId,
      timestamp
    };
    
    // Optimistic update
    setMessages(prev => new Map(prev.set(messageId, fullMessage)));
    
    socketRef.current.emit('send_message', fullMessage);
    
    // Subscribe to delivery updates for this message
    subscribeToDeliveryUpdates([messageId]);
  }, []);
  
  // Mark as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('mark_as_read', { message_id: messageId });
    
    // Update local state
    setMessages(prev => {
      const updated = new Map(prev);
      const message = updated.get(messageId);
      if (message) {
        message.status = 'read';
        updated.set(messageId, message);
      }
      return updated;
    });
  }, []);
  
  // Mark as delivered
  const markAsDelivered = useCallback(async (messageId: string) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('mark_as_delivered', { message_id: messageId });
    
    // Update local state
    setMessages(prev => {
      const updated = new Map(prev);
      const message = updated.get(messageId);
      if (message) {
        message.status = 'delivered';
        updated.set(messageId, message);
      }
      return updated;
    });
  }, []);
  
  // Typing indicators
  const startTyping = useCallback((conversationId: string) => {
    if (!socketRef.current?.connected || !currentUser) return;
    
    socketRef.current.emit('typing_start', {
      conversation_id: conversationId,
      user_id: currentUser.id
    });
  }, [currentUser]);
  
  const stopTyping = useCallback((conversationId: string) => {
    if (!socketRef.current?.connected || !currentUser) return;
    
    socketRef.current.emit('typing_stop', {
      conversation_id: conversationId,
      user_id: currentUser.id
    });
  }, [currentUser]);
  
  const getTypingUsers = useCallback((conversationId: string): string[] => {
    const typing = typingUsers.get(conversationId);
    return typing ? Array.from(typing) : [];
  }, [typingUsers]);
  
  // Presence
  const updatePresenceStatus = useCallback((status: 'online' | 'away' | 'busy') => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('update_presence', { status });
  }, []);
  
  const getOnlineUsers = useCallback(async (workspaceId?: string): Promise<OnlineUser[]> => {
    if (!socketRef.current?.connected) return [];
    
    return new Promise((resolve) => {
      socketRef.current!.emit('get_online_users', { workspace_id: workspaceId });
      socketRef.current!.once('online_users', (users: OnlineUser[]) => {
        resolve(users);
      });
    });
  }, []);
  
  // Room management
  const joinConversation = useCallback((conversationId: string) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('join_conversation', { conversation_id: conversationId });
    setCurrentRooms(prev => new Set(prev.add(`conversation:${conversationId}`)));
  }, []);
  
  const leaveConversation = useCallback((conversationId: string) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('leave_conversation', { conversation_id: conversationId });
    setCurrentRooms(prev => {
      const updated = new Set(prev);
      updated.delete(`conversation:${conversationId}`);
      return updated;
    });
  }, []);
  
  const joinWorkspace = useCallback((workspaceId: string) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('join_workspace', { workspace_id: workspaceId });
    setCurrentRooms(prev => new Set(prev.add(`workspace:${workspaceId}`)));
  }, []);
  
  // Delivery tracking
  const subscribeToDeliveryUpdates = useCallback((messageIds: string[]) => {
    if (!socketRef.current?.connected) return;
    
    const newSubscriptions = new Set(subscribedMessages);
    messageIds.forEach(id => newSubscriptions.add(id));
    setSubscribedMessages(newSubscriptions);
    
    socketRef.current.emit('subscribe_delivery_updates', { message_ids: messageIds });
  }, [subscribedMessages]);
  
  const unsubscribeFromDeliveryUpdates = useCallback((messageIds: string[]) => {
    if (!socketRef.current?.connected) return;
    
    const updatedSubscriptions = new Set(subscribedMessages);
    messageIds.forEach(id => updatedSubscriptions.delete(id));
    setSubscribedMessages(updatedSubscriptions);
    
    socketRef.current.emit('unsubscribe_delivery_updates', { message_ids: messageIds });
  }, [subscribedMessages]);
  
  // Event listeners
  const onMessage = useCallback((callback: (message: RealtimeMessage) => void) => {
    messageCallbacks.current.add(callback);
    return () => messageCallbacks.current.delete(callback);
  }, []);
  
  const onTypingStart = useCallback((callback: (indicator: TypingIndicator) => void) => {
    typingStartCallbacks.current.add(callback);
    return () => typingStartCallbacks.current.delete(callback);
  }, []);
  
  const onTypingStop = useCallback((callback: (indicator: TypingIndicator) => void) => {
    typingStopCallbacks.current.add(callback);
    return () => typingStopCallbacks.current.delete(callback);
  }, []);
  
  const onUserOnline = useCallback((callback: (user: OnlineUser) => void) => {
    userOnlineCallbacks.current.add(callback);
    return () => userOnlineCallbacks.current.delete(callback);
  }, []);
  
  const onUserOffline = useCallback((callback: (userId: string) => void) => {
    userOfflineCallbacks.current.add(callback);
    return () => userOfflineCallbacks.current.delete(callback);
  }, []);
  
  const onDeliveryUpdate = useCallback((callback: (status: MessageDeliveryStatus) => void) => {
    deliveryUpdateCallbacks.current.add(callback);
    return () => deliveryUpdateCallbacks.current.delete(callback);
  }, []);
  
  return {
    // Connection state
    isConnected,
    connectionStatus,
    connectionError,
    
    // Messages
    sendMessage,
    markAsRead,
    markAsDelivered,
    
    // Typing
    startTyping,
    stopTyping,
    getTypingUsers,
    
    // Presence
    getOnlineUsers,
    updatePresenceStatus,
    
    // Rooms
    joinConversation,
    leaveConversation,
    joinWorkspace,
    
    // Delivery tracking
    subscribeToDeliveryUpdates,
    unsubscribeFromDeliveryUpdates,
    
    // Event listeners
    onMessage,
    onTypingStart,
    onTypingStop,
    onUserOnline,
    onUserOffline,
    onDeliveryUpdate,
    
    // Cleanup
    disconnect,
    connect
  };
};

export default useRealtimeMessaging;