import React from 'react';
import { useT } from '../../hooks/useI18n';
import {
  MessageCircle,
  Plus,
  Search,
  Filter,
  Inbox,
  Archive,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';

interface EmptyStateProps {
  type: 'no-conversations' | 'no-results' | 'no-messages' | 'error' | 'loading' | 'archived';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  showRefresh?: boolean;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
  onSecondaryAction,
  secondaryActionLabel,
  showRefresh = false,
  icon,
}) => {
  const t = useT();

  const getEmptyStateConfig = () => {
    switch (type) {
      case 'no-conversations':
        return {
          icon: <MessageCircle className="w-16 h-16 text-gray-300" />,
          title: title || 'لا توجد محادثات',
          description: description || 'ابدأ محادثة جديدة لعرضها هنا',
          actionLabel: actionLabel || 'بدء محادثة جديدة',
          showSecondaryAction: true,
          secondaryActionLabel: secondaryActionLabel || 'استيراد المحادثات',
        };

      case 'no-results':
        return {
          icon: <Search className="w-16 h-16 text-gray-300" />,
          title: title || 'لا توجد نتائج',
          description: description || 'جرب تغيير معايير البحث أو الفلاتر',
          actionLabel: actionLabel || 'مسح الفلاتر',
          showSecondaryAction: true,
          secondaryActionLabel: secondaryActionLabel || 'بحث جديد',
        };

      case 'no-messages':
        return {
          icon: <Inbox className="w-16 h-16 text-gray-300" />,
          title: title || 'لا توجد رسائل',
          description: description || 'لم يتم إرسال أو استقبال رسائل بعد',
          actionLabel: actionLabel || 'إرسال رسالة',
          showSecondaryAction: false,
        };

      case 'error':
        return {
          icon: <AlertCircle className="w-16 h-16 text-red-300" />,
          title: title || 'حدث خطأ',
          description: description || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
          actionLabel: actionLabel || 'إعادة المحاولة',
          showSecondaryAction: true,
          secondaryActionLabel: secondaryActionLabel || 'العودة للخلف',
          showRefresh: true,
        };

      case 'loading':
        return {
          icon: (
            <div className="w-16 h-16 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ),
          title: title || 'جاري التحميل...',
          description: description || 'يتم تحميل المحادثات، يرجى الانتظار',
          actionLabel: undefined,
          showSecondaryAction: false,
        };

      case 'archived':
        return {
          icon: <Archive className="w-16 h-16 text-gray-300" />,
          title: title || 'لا توجد محادثات مؤرشفة',
          description: description || 'المحادثات المؤرشفة ستظهر هنا',
          actionLabel: actionLabel || 'عرض المحادثات النشطة',
          showSecondaryAction: true,
          secondaryActionLabel: secondaryActionLabel || 'إدارة الأرشيف',
        };

      default:
        return {
          icon: icon || <MessageCircle className="w-16 h-16 text-gray-300" />,
          title: title || 'لا توجد بيانات',
          description: description || 'لا توجد بيانات لعرضها',
          actionLabel: actionLabel || 'إعادة المحاولة',
          showSecondaryAction: false,
        };
    }
  };

  const config = getEmptyStateConfig();

  const Button: React.FC<{
    onClick?: () => void;
    variant: 'primary' | 'secondary';
    children: React.ReactNode;
    disabled?: boolean;
  }> = ({ onClick, variant, children, disabled = false }) => {
    const baseClasses = 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {children}
      </button>
    );
  };

  const handleRefresh = () => {
    if (showRefresh && onAction) {
      onAction();
    } else if (onAction) {
      onAction();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-12">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-50 mb-6">
          {config.icon}
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {config.title}
        </h3>

        {/* Description */}
        <p className="text-gray-500 mb-8 leading-relaxed">
          {config.description}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {config.actionLabel && (
            <Button onClick={handleRefresh} variant="primary">
              {config.actionLabel}
              {type === 'loading' && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
            </Button>
          )}

          {config.showSecondaryAction && config.secondaryActionLabel && (
            <Button onClick={onSecondaryAction} variant="secondary">
              {config.secondaryActionLabel}
            </Button>
          )}
        </div>

        {/* Help Text */}
        {type === 'no-conversations' && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">نصائح للبدء:</h4>
            <ul className="text-sm text-blue-700 space-y-1 text-right">
              <li>• ابدأ محادثة جديدة من خلال زر "بدء محادثة"</li>
              <li>• استورد المحادثات من ملفات CSV أو Excel</li>
              <li>• ربط التكاملات لجمع المحادثات تلقائياً</li>
            </ul>
          </div>
        )}

        {type === 'no-results' && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">اقتراحات:</h4>
            <ul className="text-sm text-gray-600 space-y-1 text-right">
              <li>• تأكد من صحة معايير البحث</li>
              <li>• جرب كلمات بحث مختلفة</li>
              <li>• قم بمسح الفلاتر الحالية</li>
            </ul>
          </div>
        )}

        {type === 'error' && (
          <div className="mt-8 p-4 bg-red-50 rounded-lg">
            <h4 className="text-sm font-medium text-red-900 mb-2">إذا استمر الخطأ:</h4>
            <ul className="text-sm text-red-700 space-y-1 text-right">
              <li>• تحقق من اتصال الإنترنت</li>
              <li>• أعد تحديث الصفحة</li>
              <li>• اتصل بالدعم الفني</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Specialized empty state components for easier usage
export const NoConversationsEmptyState: React.FC<{
  onCreateConversation?: () => void;
  onImport?: () => void;
}> = ({ onCreateConversation, onImport }) => (
  <EmptyState
    type="no-conversations"
    onAction={onCreateConversation}
    onSecondaryAction={onImport}
    actionLabel="بدء محادثة جديدة"
    secondaryActionLabel="استيراد المحادثات"
  />
);

export const NoSearchResultsEmptyState: React.FC<{
  onClearFilters?: () => void;
  onNewSearch?: () => void;
}> = ({ onClearFilters, onNewSearch }) => (
  <EmptyState
    type="no-results"
    onAction={onClearFilters}
    onSecondaryAction={onNewSearch}
    actionLabel="مسح الفلاتر"
    secondaryActionLabel="بحث جديد"
  />
);

export const ErrorEmptyState: React.FC<{
  onRetry?: () => void;
  onGoBack?: () => void;
  error?: string;
}> = ({ onRetry, onGoBack, error }) => (
  <EmptyState
    type="error"
    onAction={onRetry}
    onSecondaryAction={onGoBack}
    actionLabel="إعادة المحاولة"
    secondaryActionLabel="العودة للخلف"
    description={error}
    showRefresh={true}
  />
);

export const LoadingEmptyState: React.FC<{
  message?: string;
}> = ({ message }) => (
  <EmptyState
    type="loading"
    description={message}
  />
);

export default EmptyState;