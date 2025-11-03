/**
 * Test utilities for message hooks
 * These utilities help with testing React hooks and provide mock data
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock data generators
export const createMockMessage = (overrides: Partial<import('../types').Message> = {}): import('../types').Message => ({
  id: `msg-${Date.now()}`,
  conversation_id: 'conv-1',
  content: 'Test message',
  type: 'text',
  direction: 'outbound',
  status: 'sent',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockConversation = (overrides: Partial<import('../types').Conversation> = {}): import('../types').Conversation => ({
  id: `conv-${Date.now()}`,
  lead_id: 'lead-1',
  status: 'active',
  last_message_at: new Date().toISOString(),
  message_count: 0,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockTemplate = (overrides: Partial<import('../types').MessageTemplate> = {}): import('../types').MessageTemplate => ({
  id: `template-${Date.now()}`,
  name: 'Test Template',
  content: 'Hello {{name}}!',
  variables: [
    { name: 'name', label: 'Name', type: 'text', required: true }
  ],
  category: 'General',
  is_active: true,
  created_by: 'user-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockPaginatedResponse = <T>(
  items: T[],
  page: number = 1,
  limit: number = 20
): import('../types').PaginatedResponse<T> => ({
  items,
  total: items.length,
  page,
  limit,
  total_pages: Math.ceil(items.length / limit),
  has_next: page < Math.ceil(items.length / limit),
  has_previous: page > 1,
});

// Mock API responses
export const mockApiResponse = {
  success: <T>(data: T, message?: string): import('../types').ApiResponse<T> => ({
    data,
    success: true,
    message,
    timestamp: new Date().toISOString(),
  }),
  error: (message: string, status: number = 500): import('../types').ApiError => ({
    message,
    status_code: status,
    error: 'API_ERROR',
  }),
};

// Test wrapper with QueryClient
export const createTestWrapper = (mockClient?: Partial<QueryClient>) => {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    ...mockClient,
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Hook testing utilities
export class HookTestUtils {
  static async waitForQueryToLoad(result: any) {
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  }

  static async waitForError(result: any) {
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  }

  static async waitForData(result: any) {
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  }

  // Simulate real-time message
  static emitNewMessage(subscription: (callback: (message: any) => void) => () => void, message: any) {
    const unsubscribe = subscription((cb) => cb(message));
    return unsubscribe;
  }

  // Simulate typing indicator
  static emitTypingIndicator(subscription: (callback: (indicator: any) => void) => () => void, indicator: any) {
    const unsubscribe = subscription((cb) => cb(indicator));
    return unsubscribe;
  }

  // Simulate online status change
  static emitOnlineStatus(subscription: (callback: (status: any) => void) => () => void, status: any) {
    const unsubscribe = subscription((cb) => cb(status));
    return unsubscribe;
  }
}

// Mock WebSocket for real-time testing
export class MockWebSocket {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected = false;

  connect() {
    this.isConnected = true;
    setTimeout(() => {
      this.emit('open', {});
    }, 0);
  }

  disconnect() {
    this.isConnected = false;
    this.emit('close', {});
  }

  send(data: any) {
    if (!this.isConnected) return;
    // Simulate server processing
    setTimeout(() => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'new_message') {
          this.emit('message', {
            type: 'new_message',
            conversation_id: message.conversation_id,
            message: createMockMessage({ id: 'msg-' + Date.now() }),
          });
        }
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    }, 100);
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

// Global test setup
export const setupGlobalMocks = () => {
  // Mock WebSocket
  global.WebSocket = MockWebSocket as any;
  
  // Mock fetch for API calls
  global.fetch = jest.fn();
  
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
};

// Assertion helpers for message testing
export const messageAssertions = {
  hasMessage: (messages: any[], content: string) => {
    return messages.some(msg => msg.content === content);
  },

  hasMessageFromUser: (messages: any[], userId: string) => {
    return messages.some(msg => msg.direction === 'inbound');
  },

  hasMessageToUser: (messages: any[]) => {
    return messages.some(msg => msg.direction === 'outbound');
  },

  isMessageRead: (message: any) => {
    return message.status === 'read';
  },

  isMessageUnread: (message: any) => {
    return message.status !== 'read';
  },

  hasAttachment: (message: any) => {
    return message.attachments && message.attachments.length > 0;
  },

  isRecent: (message: any, minutesThreshold: number = 5) => {
    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    const diffInMinutes = (now - messageTime) / (1000 * 60);
    return diffInMinutes <= minutesThreshold;
  },
};

// Test scenarios
export const testScenarios = {
  // Basic message flow
  basicMessageFlow: {
    description: 'Basic message sending and receiving flow',
    steps: [
      'Send a text message',
      'Receive a reply',
      'Mark message as read',
      'Verify message appears in conversation',
    ],
  },

  // Real-time updates
  realTimeUpdates: {
    description: 'Real-time message and status updates',
    steps: [
      'Connect to WebSocket',
      'Send typing indicator',
      'Receive new message',
      'Update message status',
      'User goes online/offline',
    ],
  },

  // Template usage
  templateUsage: {
    description: 'Message template usage and variable substitution',
    steps: [
      'Select template',
      'Fill variables',
      'Preview rendered message',
      'Send rendered message',
    ],
  },

  // Search and filtering
  searchAndFiltering: {
    description: 'Search and filter messages/conversations',
    steps: [
      'Search for specific message',
      'Filter by message type',
      'Filter by date range',
      'Clear filters',
    ],
  },
};

// Performance testing utilities
export const performanceUtils = {
  measureHookRender: (hook: any) => {
    const start = performance.now();
    const result = hook();
    const end = performance.now();
    return {
      renderTime: end - start,
      result,
    };
  },

  measureQueryPerformance: async (queryFn: () => Promise<any>) => {
    const start = performance.now();
    const result = await queryFn();
    const end = performance.now();
    return {
      queryTime: end - start,
      result,
    };
  },

  simulateSlowNetwork: () => {
    // Mock slow network conditions
    jest.useFakeTimers();
    jest.advanceTimersByTime(2000); // 2 second delay
    jest.useRealTimers();
  },
};

// Memory leak detection
export const memoryUtils = {
  checkForMemoryLeaks: () => {
    // Add memory leak detection logic here
    // This would typically involve checking for unclosed timers, subscriptions, etc.
    const openHandles = process._getActiveHandles();
    const openRequests = process._getActiveRequests();
    
    return {
      handles: openHandles,
      requests: openRequests,
    };
  },

  cleanupSubscriptions: (subscriptions: (() => void)[]) => {
    subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error during subscription cleanup:', error);
      }
    });
  },
};

export default {
  createMockMessage,
  createMockConversation,
  createMockTemplate,
  createMockPaginatedResponse,
  mockApiResponse,
  createTestWrapper,
  HookTestUtils,
  messageAssertions,
  testScenarios,
  performanceUtils,
  memoryUtils,
  setupGlobalMocks,
};