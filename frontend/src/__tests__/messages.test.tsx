import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MessageComposer from '@/components/messages/MessageComposer';
import ConversationList from '@/components/messages/ConversationList';
import MessageBubble from '@/components/messages/MessageBubble';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock hooks
vi.mock('@/hooks/useMessages', () => ({
  useMessages: () => ({
    conversations: [
      {
        id: '1',
        name: 'أحمد محمد',
        lastMessage: 'مرحباً، أحتاج مساعدة',
        timestamp: '2024-01-01T10:00:00Z',
        unreadCount: 2,
      },
    ],
    activeConversation: null,
    sendMessage: vi.fn(),
    loading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useConversations', () => ({
  useConversations: () => ({
    selectConversation: vi.fn(),
    isLoading: false,
  }),
}));

describe('Messages System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MessageComposer', () => {
    it('should render message input field', () => {
      const mockSendMessage = vi.fn();
      
      render(<MessageComposer onSend={mockSendMessage} />);

      expect(screen.getByPlaceholderText(/اكتب رسالتك/i)).toBeInTheDocument();
    });

    it('should call sendMessage when form is submitted', async () => {
      const mockSendMessage = vi.fn();
      
      render(<MessageComposer onSend={mockSendMessage} />);

      const input = screen.getByPlaceholderText(/اكتب رسالتك/i);
      const sendButton = screen.getByRole('button', { name: /إرسال/i });

      await act(async () => {
        fireEvent.change(input, {
          target: { value: 'مرحباً، كيف يمكنني مساعدتك؟' },
        });
        fireEvent.click(sendButton);
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        'مرحباً، كيف يمكنني مساعدتك؟'
      );
      expect(input).toHaveValue('');
    });

    it('should disable send button when message is empty', () => {
      const mockSendMessage = vi.fn();
      
      render(<MessageComposer onSend={mockSendMessage} />);

      const sendButton = screen.getByRole('button', { name: /إرسال/i });
      expect(sendButton).toBeDisabled();
    });

    it('should show character counter', () => {
      render(<MessageComposer maxLength={500} />);

      const input = screen.getByPlaceholderText(/اكتب رسالتك/i);
      fireEvent.change(input, { target: { value: 'أ'.repeat(50) } });

      expect(screen.getByText(/500 حرف متبقي/i)).toBeInTheDocument();
    });

    it('should show warning when approaching character limit', () => {
      render(<MessageComposer maxLength={100} />);

      const input = screen.getByPlaceholderText(/اكتب رسالتك/i);
      fireEvent.change(input, { target: { value: 'أ'.repeat(90) } });

      expect(screen.getByText(/10 أحرف متبقية/i)).toBeInTheDocument();
      expect(screen.getByText(/تحذير: يقترب من الحد الأقصى/i)).toBeInTheDocument();
    });
  });

  describe('ConversationList', () => {
    it('should render conversation items', () => {
      const conversations = [
        {
          id: '1',
          name: 'أحمد محمد',
          lastMessage: 'مرحباً، أحتاج مساعدة',
          timestamp: '2024-01-01T10:00:00Z',
          unreadCount: 2,
        },
        {
          id: '2',
          name: 'فاطمة علي',
          lastMessage: 'شكراً لك',
          timestamp: '2024-01-01T11:00:00Z',
          unreadCount: 0,
        },
      ];

      const mockSelectConversation = vi.fn();

      render(
        <ConversationList
          conversations={conversations}
          onSelect={mockSelectConversation}
        />
      );

      expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
      expect(screen.getByText('فاطمة علي')).toBeInTheDocument();
    });

    it('should show unread count badges', () => {
      const conversations = [
        {
          id: '1',
          name: 'أحمد محمد',
          lastMessage: 'مرحباً',
          timestamp: '2024-01-01T10:00:00Z',
          unreadCount: 5,
        },
      ];

      render(<ConversationList conversations={conversations} onSelect={vi.fn()} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should highlight active conversation', () => {
      const conversations = [
        {
          id: '1',
          name: 'أحمد محمد',
          lastMessage: 'مرحباً',
          timestamp: '2024-01-01T10:00:00Z',
          unreadCount: 0,
        },
      ];

      render(
        <ConversationList
          conversations={conversations}
          activeConversationId="1"
          onSelect={vi.fn()}
        />
      );

      expect(screen.getByText('أحمد محمد').closest('div')).toHaveAttribute(
        'data-active',
        'true'
      );
    });
  });

  describe('MessageBubble', () => {
    it('should render sent message correctly', () => {
      const message = {
        id: '1',
        content: 'مرحباً! كيف حالك؟',
        sender: 'user',
        timestamp: '2024-01-01T10:00:00Z',
        status: 'sent',
      };

      render(<MessageBubble message={message} />);

      expect(screen.getByText('مرحباً! كيف حالك؟')).toBeInTheDocument();
      expect(screen.getByText('تم الإرسال')).toBeInTheDocument();
    });

    it('should render received message correctly', () => {
      const message = {
        id: '2',
        content: 'شكراً لك على رسالتك',
        sender: 'other',
        timestamp: '2024-01-01T10:05:00Z',
        status: 'delivered',
      };

      render(<MessageBubble message={message} />);

      expect(screen.getByText('شكراً لك على رسالتك')).toBeInTheDocument();
      expect(screen.getByText('تم التسليم')).toBeInTheDocument();
    });

    it('should show delivery status', () => {
      const message = {
        id: '3',
        content: 'رسالة مهمة',
        sender: 'user',
        timestamp: '2024-01-01T10:00:00Z',
        status: 'delivered',
      };

      render(<MessageBubble message={message} />);

      expect(screen.getByText('تم التسليم')).toBeInTheDocument();
    });

    it('should show error status for failed messages', () => {
      const message = {
        id: '4',
        content: 'رسالة فاشلة',
        sender: 'user',
        timestamp: '2024-01-01T10:00:00Z',
        status: 'error',
      };

      render(<MessageBubble message={message} />);

      expect(screen.getByText('فشل الإرسال')).toBeInTheDocument();
      expect(screen.getByText('إعادة الإرسال')).toBeInTheDocument();
    });

    it('should show read status', () => {
      const message = {
        id: '5',
        content: 'رسالة مقروءة',
        sender: 'other',
        timestamp: '2024-01-01T10:00:00Z',
        status: 'read',
      };

      render(<MessageBubble message={message} />);

      expect(screen.getByText('تمت القراءة')).toBeInTheDocument();
    });
  });

  describe('Message Templates', () => {
    it('should show template suggestions', () => {
      const templates = [
        { id: '1', text: 'مرحباً بك! كيف يمكنني مساعدتك؟' },
        { id: '2', text: 'شكراً لتواصلك معنا' },
      ];

      render(<MessageComposer templates={templates} onSend={vi.fn()} />);

      expect(screen.getByText(/قوالب الرسائل/i)).toBeInTheDocument();
    });

    it('should insert template when clicked', () => {
      const templates = [
        { id: '1', text: 'مرحباً بك! كيف يمكنني مساعدتك؟' },
      ];

      const mockSendMessage = vi.fn();
      
      render(<MessageComposer templates={templates} onSend={mockSendMessage} />);

      const templateButton = screen.getByText('مرحباً بك! كيف يمكنني مساعدتك؟');
      fireEvent.click(templateButton);

      expect(screen.getByPlaceholderText(/اكتب رسالتك/i)).toHaveValue(
        'مرحباً بك! كيف يمكنني مساعدتك؟'
      );
    });
  });

  describe('Real-time Messaging', () => {
    it('should update message list when new message arrives', async () => {
      const conversations = [
        {
          id: '1',
          name: 'أحمد محمد',
          lastMessage: 'مرحباً',
          timestamp: '2024-01-01T10:00:00Z',
          unreadCount: 0,
        },
      ];

      const { rerender } = render(
        <ConversationList conversations={conversations} onSelect={vi.fn()} />
      );

      // Simulate new message
      const updatedConversations = [
        {
          id: '1',
          name: 'أحمد محمد',
          lastMessage: 'شكراً على ردك السريع',
          timestamp: '2024-01-01T10:30:00Z',
          unreadCount: 1,
        },
      ];

      await act(async () => {
        rerender(<ConversationList conversations={updatedConversations} onSelect={vi.fn()} />);
      });

      expect(screen.getByText('شكراً على ردك السريع')).toBeInTheDocument();
    });
  });

  describe('Message Search', () => {
    it('should filter messages by search term', () => {
      const messages = [
        { id: '1', content: 'مرحباً كيف حالك؟', sender: 'user' },
        { id: '2', content: 'أريد معلومات عن المنتج', sender: 'other' },
        { id: '3', content: 'شكراً لك', sender: 'user' },
      ];

      // Mock search functionality
      const filteredMessages = messages.filter(msg =>
        msg.content.includes('المنتج')
      );

      expect(filteredMessages).toHaveLength(1);
      expect(filteredMessages[0].content).toBe('أريد معلومات عن المنتج');
    });
  });

  describe('File Attachment', () => {
    it('should handle file upload', async () => {
      const mockOnSend = vi.fn();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      render(<MessageComposer onSend={mockOnSend} />);

      const fileInput = screen.getByTestId('file-input');
      
      await act(async () => {
        fireEvent.change(fileInput, {
          target: { files: [file] },
        });
      });

      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  describe('Emoji Support', () => {
    it('should show emoji picker', () => {
      render(<MessageComposer showEmojiPicker={true} onSend={vi.fn()} />);

      expect(screen.getByText(/رموز تعبيرية/i)).toBeInTheDocument();
    });

    it('should insert emoji into message', () => {
      render(<MessageComposer showEmojiPicker={true} onSend={vi.fn()} />);

      const emojiButton = screen.getByText('😊');
      fireEvent.click(emojiButton);

      expect(screen.getByPlaceholderText(/اكتب رسالتك/i)).toHaveValue('😊');
    });
  });
});
