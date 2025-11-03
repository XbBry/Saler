import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  X, 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  XCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { NotificationType } from './NotificationTypes';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // بالملي ثانية (0 لل عدم إخفاء تلقائي)
  dismissible?: boolean;
  showProgress?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: (id: string) => void;
}

export function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  dismissible = true,
  showProgress = true,
  action,
  onDismiss
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(duration);
  const progressRef = useRef<NodeJS.Timeout>();
  const timeRef = useRef<NodeJS.Timeout>();

  // إعدادات الألوان والأيقونات حسب النوع
  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-900',
          messageColor: 'text-green-700',
          progressColor: 'bg-green-500',
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-900',
          messageColor: 'text-red-700',
          progressColor: 'bg-red-500',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-700',
          progressColor: 'bg-yellow-500',
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-700',
          progressColor: 'bg-blue-500',
        };
      case 'loading':
        return {
          icon: <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          titleColor: 'text-gray-900',
          messageColor: 'text-gray-700',
          progressColor: 'bg-gray-500',
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-700',
          progressColor: 'bg-blue-500',
        };
    }
  };

  const config = getToastConfig(type);

  // إظهار التنبيه
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(showTimer);
  }, []);

  // إخفاء التنبيه تلقائياً
  useEffect(() => {
    if (duration > 0 && type !== 'loading') {
      progressRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            handleDismiss();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      timeRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 100;
          if (newTime <= 0) {
            return 0;
          }
          return newTime;
        });
      }, 100);

      return () => {
        if (progressRef.current) clearInterval(progressRef.current);
        if (timeRef.current) clearInterval(timeRef.current);
      };
    }
  }, [duration, type]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300);
  };

  const configToast = getToastConfig(type);

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        max-w-sm w-full
      `}
    >
      <div
        className={`
          ${configToast.bgColor} ${configToast.borderColor}
          border rounded-lg shadow-lg p-4
          ${dismissible ? 'cursor-pointer' : ''}
          hover:shadow-xl transition-shadow
        `}
        onClick={dismissible ? handleDismiss : undefined}
      >
        {/* شريط التقدم */}
        {showProgress && duration > 0 && type !== 'loading' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
            <div
              className={`h-full ${configToast.progressColor} transition-all duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* الأيقونة */}
          <div className="flex-shrink-0 mt-0.5">
            {configToast.icon}
          </div>

          {/* المحتوى */}
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium ${configToast.titleColor}`}>
              {title}
            </h4>
            {message && (
              <p className={`text-sm mt-1 ${configToast.messageColor}`}>
                {message}
              </p>
            )}

            {/* إجراء */}
            {action && type !== 'loading' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  handleDismiss();
                }}
                className={`
                  mt-3 
                  flex items-center gap-1 
                  text-sm font-medium 
                  ${type === 'success' ? 'text-green-700 hover:text-green-800' :
                    type === 'error' ? 'text-red-700 hover:text-red-800' :
                    type === 'warning' ? 'text-yellow-700 hover:text-yellow-800' :
                    'text-blue-700 hover:text-blue-800'
                  }
                `}
              >
                {action.label}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* عرض الوقت المتبقي */}
            {duration > 0 && type !== 'loading' && timeLeft > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">
                  {Math.ceil(timeLeft / 1000)}s متبقية
                </span>
              </div>
            )}
          </div>

          {/* زر الإغلاق */}
          {dismissible && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// مكون إدارة التنبيهات المنبثقة
interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
  onDismiss: (id: string) => void;
}

export function ToastContainer({ 
  toasts, 
  position = 'top-right', 
  maxToasts = 5,
  onDismiss 
}: ToastContainerProps) {
  const displayedToasts = toasts.slice(0, maxToasts);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (displayedToasts.length === 0) return null;

  return (
    <div className={`fixed z-50 ${getPositionClasses()} space-y-2`}>
      {displayedToasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <Toast {...toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

// Hook لإدارة التنبيهات المنبثقة
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onDismiss'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onDismiss: removeToast,
    };
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  const showSuccess = (title: string, message?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'success',
      title,
      message,
      ...options,
    });
  };

  const showError = (title: string, message?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'error',
      title,
      message,
      ...options,
    });
  };

  const showWarning = (title: string, message?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'warning',
      title,
      message,
      ...options,
    });
  };

  const showInfo = (title: string, message?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'info',
      title,
      message,
      ...options,
    });
  };

  const showLoading = (title: string, message?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'loading',
      title,
      message,
      duration: 0, // لا تُغلق تلقائياً
      ...options,
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
  };
}