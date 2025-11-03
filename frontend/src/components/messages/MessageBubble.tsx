import React, { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  MessageCircle, 
  Reply, 
  Forward, 
  Copy, 
  Check, 
  CheckCheck,
  Clock,
  Image,
  File,
  Video,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'video' | 'audio';
  senderId: string;
  senderName: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
  forwardedFrom?: string;
  attachments?: {
    url: string;
    name: string;
    type: string;
    size: number;
  }[];
  isOwn: boolean;
}

interface MessageBubbleProps {
  message: Message;
  onReply?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReply,
  onForward,
  onCopy,
  className
}) => {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <MessageCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getAttachmentIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (type.startsWith('video/')) {
      return <Video className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      className={cn(
        "flex group relative",
        message.isOwn ? "justify-end" : "justify-start",
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={cn(
          "max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl relative",
          message.isOwn
            ? "bg-blue-500 text-white rounded-br-sm"
            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm"
        )}
      >
        {/* Sender name for received messages */}
        {!message.isOwn && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {message.senderName}
          </div>
        )}

        {/* Reply indicator */}
        {message.replyTo && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 flex items-center">
            <Reply className="w-3 h-3 mr-1" />
            رسالة رد
          </div>
        )}

        {/* Forward indicator */}
        {message.forwardedFrom && (
          <div className="text-xs text-green-600 dark:text-green-400 mb-1 flex items-center">
            <Forward className="w-3 h-3 mr-1" />
            تم التوجيه من {message.forwardedFrom}
          </div>
        )}

        {/* Message content */}
        <div className="mb-2">
          {message.type === 'text' && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {message.type === 'image' && message.attachments && (
            <div className="space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="relative">
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                    onClick={() => window.open(attachment.url, '_blank')}
                  />
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {attachment.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {message.type === 'file' && message.attachments && (
            <div className="space-y-2">
              {message.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-500"
                  onClick={() => window.open(attachment.url, '_blank')}
                >
                  {getAttachmentIcon(attachment.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {attachment.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)}
                    </div>
                  </div>
                  <Download className="w-4 h-4" />
                </div>
              ))}
            </div>
          )}

          {message.type === 'video' && message.attachments && (
            <div className="space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="relative">
                  <video
                    src={attachment.url}
                    controls
                    className="max-w-full h-auto rounded-lg"
                  />
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {attachment.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp and status */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-500 dark:text-gray-400">
            {format(message.timestamp, 'HH:mm', { locale: ar })}
          </div>
          {message.isOwn && (
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className={cn(
            "absolute top-0 flex space-x-1",
            message.isOwn ? "-left-12" : "-right-12"
          )}>
            <button
              onClick={() => onReply?.(message.id)}
              className="p-1 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              title="رد"
            >
              <Reply className="w-3 h-3" />
            </button>
            <button
              onClick={() => onForward?.(message.id)}
              className="p-1 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              title="إعادة توجيه"
            >
              <Forward className="w-3 h-3" />
            </button>
            <button
              onClick={handleCopy}
              className="p-1 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              title="نسخ"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;