/**
 * Error Boundary component محسن
 * نظام متقدم لمعالجة الأخطاء وإعادة المحاولة التلقائية
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { errorHandler } from '../lib/error-handler';
import { performance } from '../lib/performance';

// Types للـ Error Boundary
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  errorId: string;
  userAgent: string;
  timestamp: Date;
  errorClass: 'component' | 'render' | 'lifecycle' | 'async';
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: (retryCount: number) => void;
  maxRetries?: number;
  retryDelay?: number;
  enableAutoRetry?: boolean;
  enableErrorReporting?: boolean;
  enablePerformanceTracking?: boolean;
  enableUserInteraction?: boolean;
  customErrorMessages?: Record<string, string>;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  fallbackClassName?: string;
  disableErrorOverlay?: boolean;
}

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  retry: () => void;
  retryCount: number;
  isRetrying: boolean;
  errorId: string;
  errorClass: ErrorBoundaryState['errorClass'];
  reportError: () => void;
}

/**
 * Error Fallback component افتراضي
 */
class DefaultErrorFallback extends React.Component<ErrorFallbackProps> {
  constructor(props: ErrorFallbackProps) {
    super(props);
  }

  render() {
    const {
      error,
      errorInfo,
      resetError,
      retry,
      retryCount,
      isRetrying,
      errorId,
      errorClass,
      reportError,
      children
    } = this.props;

    const errorMessage = this.getErrorMessage();
    
    return (
      <div className={`error-fallback ${this.props.errorId}`} dir="rtl">
        <div className="error-fallback__content">
          <div className="error-fallback__icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 9v11m0-11h.01M12 9.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round"
              />
              <path 
                d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" 
                stroke="currentColor" 
                strokeWidth="1.5"
              />
            </svg>
          </div>
          
          <div className="error-fallback__info">
            <h3 className="error-fallback__title">عذراً، حدث خطأ غير متوقع</h3>
            <p className="error-fallback__message">{errorMessage}</p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="error-fallback__details">
                <summary>تفاصيل الخطأ (Developer Mode)</summary>
                <div className="error-fallback__details-content">
                  {error && (
                    <div className="error-details">
                      <strong>الخطأ:</strong>
                      <pre>{error.message}</pre>
                      {error.stack && (
                        <>
                          <strong>Stack Trace:</strong>
                          <pre>{error.stack}</pre>
                        </>
                      )}
                    </div>
                  )}
                  {errorInfo && (
                    <div className="error-details">
                      <strong>Component Stack:</strong>
                      <pre>{errorInfo.componentStack}</pre>
                    </div>
                  )}
                  <div className="error-details">
                    <strong>Class:</strong> {errorClass}<br/>
                    <strong>ID:</strong> {errorId}<br/>
                    <strong>Retry Count:</strong> {retryCount}
                  </div>
                </div>
              </details>
            )}
          </div>

          <div className="error-fallback__actions">
            {!isRetrying && (
              <button 
                className="error-fallback__retry-btn"
                onClick={retry}
                type="button"
              >
                إعادة المحاولة
                {retryCount > 0 && ` (${retryCount})`}
              </button>
            )}
            
            <button 
              className="error-fallback__reset-btn"
              onClick={resetError}
              type="button"
            >
              إعادة تشغيل
            </button>
            
            <button 
              className="error-fallback__report-btn"
              onClick={reportError}
              type="button"
            >
              الإبلاغ عن الخطأ
            </button>
          </div>
        </div>
        
        <style jsx>{`
          .error-fallback {
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }

          .error-fallback__content {
            text-align: center;
            max-width: 500px;
          }

          .error-fallback__icon {
            color: #e53e3e;
            margin-bottom: 1rem;
          }

          .error-fallback__title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 0.5rem;
          }

          .error-fallback__message {
            color: #4a5568;
            margin-bottom: 2rem;
            line-height: 1.6;
          }

          .error-fallback__details {
            margin: 1rem 0;
            text-align: right;
          }

          .error-fallback__details summary {
            cursor: pointer;
            color: #3182ce;
            font-weight: 500;
          }

          .error-fallback__details-content {
            margin-top: 0.5rem;
            padding: 1rem;
            background: #f7fafc;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            text-align: left;
            font-size: 0.875rem;
          }

          .error-details {
            margin: 0.5rem 0;
          }

          .error-details pre {
            background: #1a202c;
            color: #e2e8f0;
            padding: 0.5rem;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 0.75rem;
          }

          .error-fallback__actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            flex-wrap: wrap;
          }

          .error-fallback__retry-btn,
          .error-fallback__reset-btn,
          .error-fallback__report-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .error-fallback__retry-btn {
            background: #48bb78;
            color: white;
          }

          .error-fallback__retry-btn:hover {
            background: #38a169;
          }

          .error-fallback__reset-btn {
            background: #3182ce;
            color: white;
          }

          .error-fallback__reset-btn:hover {
            background: #2c5aa0;
          }

          .error-fallback__report-btn {
            background: #ed8936;
            color: white;
          }

          .error-fallback__report-btn:hover {
            background: #dd6b20;
          }

          .error-fallback__retry-btn:disabled {
            background: #a0aec0;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  private getErrorMessage(): string {
    const { error, errorClass, customErrorMessages } = this.props;
    
    if (customErrorMessages && customErrorMessages[errorClass]) {
      return customErrorMessages[errorClass];
    }

    if (!error) return 'حدث خطأ غير محدد';

    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.';
    }
    
    if (message.includes('timeout')) {
      return 'انتهت مهلة الانتظار. يرجى المحاولة مرة أخرى.';
    }
    
    if (message.includes('permission') || message.includes('access')) {
      return 'ليس لديك صلاحية للوصول إلى هذا المورد.';
    }
    
    if (message.includes('chunk')) {
      return 'خطأ في تحميل الملفات. يرجى تحديث الصفحة.';
    }
    
    return 'حدث خطأ غير متوقع. نعتذر عن الإزعاج.';
  }
}

/**
 * Error Boundary Component الرئيسي
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private mounted = true;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      errorId: this.generateErrorId(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date(),
      errorClass: 'component'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // تحديد نوع الخطأ
    let errorClass: ErrorBoundaryState['errorClass'] = 'component';
    
    if (error.message.includes('render')) {
      errorClass = 'render';
    } else if (error.message.includes('lifecycle')) {
      errorClass = 'lifecycle';
    } else if (error.message.includes('async') || error.message.includes('promise')) {
      errorClass = 'async';
    }

    return {
      hasError: true,
      error,
      errorClass,
      timestamp: new Date()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo,
      errorId: this.generateErrorId(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date()
    });

    // تسجيل الخطأ
    this.handleError(error, errorInfo);

    // إعادة المحاولة التلقائية إذا كانت مفعلة
    if (this.props.enableAutoRetry && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetOnPropsChange, resetKeys } = this.props;
    
    if (resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError();
    }

    if (resetKeys && resetKeys.length > 0) {
      // التحقق من تغيير reset keys
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        prevProps.resetKeys && prevProps.resetKeys[index] !== key
      );
      
      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
  }

  componentWillUnmount(): void {
    this.mounted = false;
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render(): ReactNode {
    const { hasError } = this.state;
    const { children, fallback: FallbackComponent } = this.props;

    if (hasError) {
      const fallbackProps: ErrorFallbackProps = {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        resetError: this.resetError,
        retry: this.retry,
        retryCount: this.state.retryCount,
        isRetrying: this.state.isRetrying,
        errorId: this.state.errorId,
        errorClass: this.state.errorClass,
        reportError: this.reportError
      };

      if (FallbackComponent) {
        return <FallbackComponent {...fallbackProps} />;
      }

      return <DefaultErrorFallback {...fallbackProps} />;
    }

    return children;
  }

  /**
   * إعادة تعيين الخطأ
   */
  private resetError = (): void => {
    if (this.mounted) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: 0,
        isRetrying: false,
        errorId: this.generateErrorId()
      });

      // تنظيف performance marks
      performance.clearError(this.state.errorId);
    }
  };

  /**
   * إعادة محاولة الطلب
   */
  private retry = async (): Promise<void> => {
    if (this.state.isRetrying) return;

    const maxRetries = this.props.maxRetries || 3;
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      isRetrying: true,
      retryCount: prevState.retryCount + 1
    }));

    // تسجيل محاولة إعادة المحاولة
    performance.markEvent('error_boundary_retry', {
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      errorClass: this.state.errorClass
    });

    try {
      // انتظار قبل إعادة المحاولة (exponential backoff)
      const delay = (this.props.retryDelay || 1000) * Math.pow(2, this.state.retryCount - 1);
      await this.delay(delay);

      if (!this.mounted) return;

      this.resetError();
      
      // استدعاء onRetry callback
      if (this.props.onRetry) {
        this.props.onRetry(this.state.retryCount);
      }

    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      if (this.mounted) {
        this.setState({ isRetrying: false });
      }
    }
  };

  /**
   * جدولة إعادة المحاولة التلقائية
   */
  private scheduleRetry(): void {
    const delay = (this.props.retryDelay || 1000) * Math.pow(2, this.state.retryCount);
    this.retryTimeoutId = setTimeout(() => {
      if (this.mounted && this.state.retryCount < (this.props.maxRetries || 3)) {
        this.retry();
      }
    }, delay);
  }

  /**
   * معالجة الخطأ وتسجيله
   */
  private handleError(error: Error, errorInfo: ErrorInfo): void {
    const errorData = {
      error,
      errorInfo,
      errorId: this.state.errorId,
      errorClass: this.state.errorClass,
      retryCount: this.state.retryCount,
      userAgent: this.state.userAgent,
      timestamp: this.state.timestamp,
      props: this.props
    };

    // تسجيل في performance monitoring
    if (this.props.enablePerformanceTracking) {
      performance.markError('error_boundary', {
        errorId: this.state.errorId,
        errorClass: this.state.errorClass,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount
      });
    }

    // إرسال إلى error handler
    if (this.props.enableErrorReporting !== false) {
      errorHandler.reportError(error, {
        context: 'ErrorBoundary',
        errorId: this.state.errorId,
        errorInfo: errorInfo.componentStack,
        retryCount: this.state.retryCount,
        componentStack: errorInfo.componentStack
      });
    }

    // استدعاء onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * الإبلاغ عن الخطأ
   */
  private reportError = (): void => {
    const { error, errorInfo, errorId } = this.state;
    
    if (error && errorInfo) {
      errorHandler.reportError(error, {
        context: 'ErrorBoundary User Report',
        errorId,
        componentStack: errorInfo.componentStack,
        userAgent: this.state.userAgent,
        timestamp: this.state.timestamp
      });
    }
  };

  /**
   * إنشاء معرف فريد للخطأ
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * utility method للتأخير
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Hook لاستخدام Error Boundary في functional components
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const captureError = React.useCallback((error: Error, errorInfo?: any) => {
    setError(error);
    
    if (errorInfo) {
      console.error('Error with info:', error, errorInfo);
    }
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    captureError,
    resetError,
    ErrorBoundary: (props: Omit<ErrorBoundaryProps, 'children'>) => (
      <ErrorBoundary {...props} onError={captureError} />
    )
  };
}

/**
 * Higher Order Component للـ Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;