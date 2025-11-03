import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  X,
  MessageCircle,
  Eye,
  ThumbsUp,
  Heart,
  Laugh,
  Sad,
  Angry,
  ThumbsDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageReaction = 'like' | 'love' | 'laugh' | 'sad' | 'angry' | 'dislike';

export interface MessageReactions {
  [key: string]: {
    emoji: React.ReactNode;
    count: number;
    users: string[];
  };
}

interface MessageStatusProps {
  status: MessageStatus;
  timestamp: Date;
  reactions?: MessageReactions;
  userReactions?: MessageReaction[];
  onReactionClick?: (reaction: MessageReaction) => void;
  showReactions?: boolean;
  showTimestamp?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  timestamp,
  reactions = {},
  userReactions = [],
  onReactionClick,
  showReactions = true,
  showTimestamp = true,
  showTooltip = true,
  size = 'md',
  variant = 'default',
  className
}) => {
  // Get status configuration
  const getStatusConfig = () => {
    switch (status) {
      case 'sending':
        return {
          icon: <Clock className="w-3 h-3" />,
          text: 'جاري الإرسال',
          color: 'text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700'
        };
      case 'sent':
        return {
          icon: <Check className="w-3 h-3" />,
          text: 'تم الإرسال',
          color: 'text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700'
        };
      case 'delivered':
        return {
          icon: <CheckCheck className="w-3 h-3" />,
          text: 'تم التسليم',
          color: 'text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700'
        };
      case 'read':
        return {
          icon: <CheckCheck className="w-3 h-3" />,
          text: 'تم القراءة',
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        };
      case 'failed':
        return {
          icon: <X className="w-3 h-3" />,
          text: 'فشل في الإرسال',
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20'
        };
      default:
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'حالة غير معروفة',
          color: 'text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700'
        };
    }
  };

  // Get reaction config
  const getReactionConfig = (reaction: string) => {
    const config = {
      like: { emoji: '👍', icon: ThumbsUp, color: 'text-blue-500' },
      love: { emoji: '❤️', icon: Heart, color: 'text-red-500' },
      laugh: { emoji: '😂', icon: Laugh, color: 'text-yellow-500' },
      sad: { emoji: '😢', icon: Sad, color: 'text-gray-500' },
      angry: { emoji: '😡', icon: Angry, color: 'text-red-600' },
      dislike: { emoji: '👎', icon: ThumbsDown, color: 'text-gray-600' }
    };
    return config[reaction as keyof typeof config] || config.like;
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'w-2 h-2',
          text: 'text-xs',
          reaction: 'text-xs',
          spacing: 'space-x-1'
        };
      case 'lg':
        return {
          icon: 'w-5 h-5',
          text: 'text-sm',
          reaction: 'text-sm',
          spacing: 'space-x-2'
        };
      default:
        return {
          icon: 'w-3 h-3',
          text: 'text-xs',
          reaction: 'text-xs',
          spacing: 'space-x-1'
        };
    }
  };

  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return {
          container: 'flex items-center',
          background: 'bg-transparent'
        };
      case 'compact':
        return {
          container: 'flex items-center space-x-1',
          background: 'bg-transparent'
        };
      default:
        return {
          container: 'flex items-center space-x-1',
          background: 'bg-gray-50 dark:bg-gray-700 rounded-full px-2 py-1'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const sizeClasses = getSizeClasses();
  const variantClasses = getVariantClasses();

  // Format timestamp for tooltip
  const formatTooltipTime = (date: Date) => {
    return format(date, 'PPP p', { locale: ar });
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  };

  // Render status indicator
  const renderStatusIndicator = () => (
    <div className={cn(
      "flex items-center",
      sizeClasses.spacing,
      variantClasses.background,
      className
    )}>
      <div className={cn(
        statusConfig.color,
        sizeClasses.icon
      )}>
        {statusConfig.icon}
      </div>
      {variant === 'default' && showTimestamp && (
        <span className={cn(
          "text-gray-500 dark:text-gray-400",
          sizeClasses.text
        )}>
          {formatRelativeTime(timestamp)}
        </span>
      )}
    </div>
  );

  // Render tooltip content
  const renderTooltip = () => (
    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
      <div className="font-medium">{statusConfig.text}</div>
      {showTimestamp && (
        <div className="text-gray-300">
          {formatTooltipTime(timestamp)}
        </div>
      )}
    </div>
  );

  // Render reactions
  const renderReactions = () => {
    if (!showReactions || Object.keys(reactions).length === 0) return null;

    return (
      <div className="flex items-center space-x-1">
        {Object.entries(reactions).map(([reactionType, reactionData]) => {
          const config = getReactionConfig(reactionType);
          const isUserReaction = userReactions.includes(reactionType as MessageReaction);
          
          return (
            <button
              key={reactionType}
              onClick={() => onReactionClick?.(reactionType as MessageReaction)}
              className={cn(
                "flex items-center space-x-1 px-2 py-1 rounded-full transition-colors",
                isUserReaction
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600",
                config.color
              )}
              title={`${reactionData.users.length} رد فعل`}
            >
              <span className={sizeClasses.reaction}>
                {config.emoji}
              </span>
              {reactionData.count > 1 && (
                <span className={cn(
                  "text-gray-600 dark:text-gray-400",
                  sizeClasses.reaction
                )}>
                  {reactionData.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  // Main render
  if (showTooltip) {
    return (
      <div className="relative group">
        {renderStatusIndicator()}
        <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {renderTooltip()}
        </div>
        {renderReactions()}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {renderStatusIndicator()}
      {renderReactions()}
    </div>
  );
};

// Specialized components for different use cases
export const MessageDeliveryStatus: React.FC<Omit<MessageStatusProps, 'showReactions'>> = (props) => (
  <MessageStatus {...props} showReactions={false} />
);

export const MessageReactionStatus: React.FC<Omit<MessageStatusProps, 'showTimestamp'>> = (props) => (
  <MessageStatus {...props} showTimestamp={false} variant="compact" />
);

export const MessageTimestamp: React.FC<{
  timestamp: Date;
  className?: string;
}> = ({ timestamp, className }) => (
  <span className={cn("text-xs text-gray-500 dark:text-gray-400", className)}>
    {format(timestamp, 'HH:mm', { locale: ar })}
  </span>
);

export default MessageStatus;