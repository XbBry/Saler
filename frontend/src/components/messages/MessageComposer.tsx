import React, { useState, useRef, useCallback } from 'react';
import { 
  Send, 
  Paperclip, 
  Image, 
  Smile, 
  Hash, 
  MoreHorizontal,
  X,
  FileText,
  Mic,
  MicOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface MessageComposerProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  onTyping?: () => void;
  templates?: MessageTemplate[];
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onTyping,
  templates = [],
  placeholder = "اكتب رسالة...",
  maxLength = 1000,
  disabled = false,
  className
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
    if (onTyping) {
      onTyping();
    }
  };

  // Handle send message
  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
      adjustTextareaHeight();
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  // Handle keyboard events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Insert template
  const insertTemplate = (template: MessageTemplate) => {
    setMessage(template.content);
    setShowTemplates(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Common emojis
  const commonEmojis = ['😊', '😂', '❤️', '👍', '👎', '😢', '😡', '🤔', '🙄', '😍'];

  return (
    <div className={cn("border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800", className)}>
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-500 flex items-center justify-center z-10">
          <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
            اسحب الملفات هنا
          </div>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="relative flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2"
              >
                <FileText className="w-4 h-4 text-gray-500 ml-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300 max-w-32 truncate">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template selector */}
      {showTemplates && templates.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
          <div className="space-y-1">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => insertTemplate(template)}
                className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {template.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {template.category}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  setMessage(prev => prev + emoji);
                  setShowEmoji(false);
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main composer */}
      <div className="p-4">
        <div className="flex items-end space-x-2">
          {/* Attachment buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="إرفاق ملف"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="إرفاق صورة"
            >
              <Image className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className={cn(
                "p-2 rounded-lg",
                showEmoji 
                  ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
              title="إيموجي"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              className={cn(
                "w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "dark:bg-gray-700 dark:text-gray-100",
                "placeholder-gray-500 dark:placeholder-gray-400",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[40px] max-h-[120px]"
              )}
              rows={1}
            />
            
            {/* Character count */}
            <div className="absolute bottom-1 left-1 text-xs text-gray-400">
              {message.length}/{maxLength}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-1">
            {templates.length > 0 && (
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className={cn(
                  "p-2 rounded-lg",
                  showTemplates 
                    ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                title="قوالب الرسائل"
              >
                <Hash className="w-5 h-5" />
              </button>
            )}

            {/* Send/Mic button */}
            {message.trim() || attachments.length > 0 ? (
              <button
                onClick={handleSend}
                disabled={disabled || (!message.trim() && attachments.length === 0)}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="إرسال"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={cn(
                  "p-2 rounded-lg",
                  isRecording 
                    ? "text-red-500 bg-red-50 dark:bg-red-900/20" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                title="تسجيل رسالة صوتية"
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="المزيد"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'file')}
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'image')}
        accept="image/*"
      />
    </div>
  );
};

export default MessageComposer;