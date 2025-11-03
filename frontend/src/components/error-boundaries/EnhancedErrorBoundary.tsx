/**
 * Enhanced Error Boundaries System
 * نظام Error Boundaries محسن ومتطور
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { errorHandler } from '../lib/error-handler';
import { performance } from '../lib/performance';

// Error boundary contexts
export interface ErrorBoundaryContext {
  errorId: string;
  errorClass: 'component' | 'page' | 'application' | 'network' | 'render';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAgent: string;
  timestamp: Date;
  url: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// Enhanced error boundary state
export interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  context: ErrorBoundaryContext;
  retryCount: number;
  isRetrying: boolean;
  recoveryAttempts: number;
  fallbackRendered: boolean;
  errorHistory: Array<{
    error: Error;
    timestamp: Date;
    retryCount: number;
  }>;
}

export interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<EnhancedErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo, context: ErrorBoundaryContext) => void;
  onRecovery?: (context: ErrorBoundaryContext) => void;
  maxRetries?: number;
  retryDelay?: number;
  enableAutoRetry?: boolean;
  enableErrorReporting?: boolean;
  enablePerformanceTracking?: boolean;
  enableRetryMechanism?: boolean;
  enableErrorAnalytics?: boolean;
  enableRecoveryMode?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  errorClass?: EnhancedErrorBoundaryState['context']['errorClass'];
  severity?: EnhancedErrorBoundaryState['context']['severity'];
  customErrorMessages?: Record<string, string>;
  retryStrategy?: 'immediate' | 'exponential' | 'linear' | 'custom';
  customRetryDelay?: (retryCount: number) => number;
  enableUserFeedback?: boolean;
  enableOfflineSupport?: boolean;
  enableA11y?: boolean;
}

export interface EnhancedErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  context: ErrorBoundaryContext;
  resetError: () => void;
  retry: () => void;
  retryCount: number;
  isRetrying: boolean;
  recoveryMode: boolean;
  enableReport: boolean;
  enableOfflineRetry: boolean;
  reportError: () => void;
  goHome: () => void;
  refreshPage: () => void;
}

/**
 * Enhanced Error Fallback Component
 */
class EnhancedErrorFallback extends React.Component<EnhancedErrorFallbackProps> {
  constructor(props: EnhancedErrorFallbackProps) {
    super(props);
  }

  render() {
    const {
      error,
      context,
      resetError,
      retry,
      retryCount,
      isRetrying,
      recoveryMode,
      enableReport,
      enableOfflineRetry,
      reportError,
      goHome,
      refreshPage
    } = this.props;

    const errorMessage = this.getErrorMessage();
    const isNetworkError = context.errorClass === 'network';
    const isCriticalError = context.severity === 'critical';

    return (
      <div className={`enhanced-error-fallback ${context.errorId}`} dir="rtl" role="alert" aria-live="polite">
        <div className="error-fallback-container">
          {/* Error Icon and Status */}
          <div className="error-fallback-header">
            <div className="error-icon" aria-hidden="true">
              {this.getErrorIcon()}
            </div>
            <div className="error-status">
              <h2 className="error-title">
                {isCriticalError ? 'خطأ حرج' : 
                 isNetworkError ? 'خطأ في الاتصال' : 
                 'حدث خطأ غير متوقع'}
              </h2>
              <p className="error-subtitle">{errorMessage}</p>
            </div>
          </div>

          {/* Error Details Panel */}
          {process.env.NODE_ENV === 'development' && (
            <details className="error-details-panel">
              <summary className="error-details-toggle">
                تفاصيل تقنية (وضع المطور)
              </summary>
              <div className="error-details-content">
                {error && (
                  <div className="error-section">
                    <h4>تفاصيل الخطأ</h4>
                    <div className="error-info-grid">
                      <div><strong>الرسالة:</strong> {error.message}</div>
                      <div><strong>الفئة:</strong> {context.errorClass}</div>
                      <div><strong>الخطورة:</strong> {context.severity}</div>
                      <div><strong>عدد المحاولات:</strong> {retryCount}</div>
                      <div><strong>المعرف:</strong> {context.errorId}</div>
                      <div><strong>الوقت:</strong> {context.timestamp.toLocaleString()}</div>
                    </div>
                    {error.stack && (
                      <div className="error-stack">
                        <strong>Stack Trace:</strong>
                        <pre>{error.stack}</pre>
                      </div>
                    )}
                  </div>
                )}
                {errorInfo && (
                  <div className="error-section">
                    <h4>معلومات المكون</h4>
                    <pre className="component-stack">{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Recovery Actions */}
          <div className="error-actions">
            <div className="primary-actions">
              {!isRetrying && (
                <button 
                  className="btn btn-primary"
                  onClick={retry}
                  disabled={retryCount >= (context.metadata?.maxRetries || 3)}
                  aria-label={`إعادة المحاولة (${retryCount} من ${context.metadata?.maxRetries || 3})`}
                >
                  {isRetrying ? 'جاري المحاولة...' : `إعادة المحاولة${retryCount > 0 ? ` (${retryCount})` : ''}`}
                </button>
              )}
              
              <button 
                className="btn btn-secondary"
                onClick={resetError}
                aria-label="إعادة تعيين الخطأ"
              >
                إعادة تعيين
              </button>
            </div>

            <div className="secondary-actions">
              {enableReport && (
                <button 
                  className="btn btn-outline"
                  onClick={reportError}
                  aria-label="الإبلاغ عن الخطأ"
                >
                  الإبلاغ عن الخطأ
                </button>
              )}
              
              {enableOfflineRetry && isNetworkError && (
                <button 
                  className="btn btn-outline"
                  onClick={() => window.location.reload()}
                  aria-label="إعادة المحاولة مع الاتصال"
                >
                  إعادة المحاولة
                </button>
              )}
              
              <button 
                className="btn btn-link"
                onClick={goHome}
                aria-label="العودة للصفحة الرئيسية"
              >
                العودة للرئيسية
              </button>
              
              <button 
                className="btn btn-link"
                onClick={refreshPage}
                aria-label="تحديث الصفحة"
              >
                تحديث الصفحة
              </button>
            </div>
          </div>

          {/* Recovery Mode Indicator */}
          {recoveryMode && (
            <div className="recovery-mode-indicator" role="status">
              <div className="recovery-status">
                <div className="recovery-icon" aria-hidden="true">🔄</div>
                <span>وضع الاسترداد نشط - جاري محاولة الإصلاح...</span>
              </div>
            </div>
          )}

          {/* Network Status */}
          {isNetworkError && (
            <div className="network-status" role="status">
              <div className="network-indicator offline">
                <span className="network-icon" aria-hidden="true">📡</span>
                <span>لا يوجد اتصال بالإنترنت</span>
              </div>
              <p className="network-help">
                تأكد من اتصالك بالإنترنت وحاول مرة أخرى
              </p>
            </div>
          )}
        </div>

        {/* Error Fallback Styles */}
        <style jsx>{`
          .enhanced-error-fallback {
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          .error-fallback-container {
            max-width: 600px;
            width: 100%;
            text-align: center;
          }

          .error-fallback-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
            text-align: right;
          }

          .error-icon {
            font-size: 3rem;
            flex-shrink: 0;
          }

          .error-status {
            flex: 1;
          }

          .error-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1a202c;
            margin: 0 0 0.5rem 0;
          }

          .error-subtitle {
            color: #4a5568;
            margin: 0;
            line-height: 1.5;
          }

          .error-details-panel {
            margin: 1.5rem 0;
            text-align: right;
          }

          .error-details-toggle {
            cursor: pointer;
            color: #3182ce;
            font-weight: 600;
            padding: 0.5rem 0;
            border: none;
            background: none;
            text-decoration: underline;
          }

          .error-details-content {
            margin-top: 1rem;
            padding: 1.5rem;
            background: #f7fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            text-align: left;
          }

          .error-section {
            margin-bottom: 1rem;
          }

          .error-section h4 {
            color: #2d3748;
            margin: 0 0 0.5rem 0;
            font-weight: 600;
          }

          .error-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          }

          .error-stack,
          .component-stack {
            background: #1a202c;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 0.75rem;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          }

          .error-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 2rem;
          }

          .primary-actions,
          .secondary-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            flex-wrap: wrap;
          }

          .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.875rem;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
          }

          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn-primary {
            background: #48bb78;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: #38a169;
          }

          .btn-secondary {
            background: #3182ce;
            color: white;
          }

          .btn-secondary:hover {
            background: #2c5aa0;
          }

          .btn-outline {
            background: transparent;
            color: #3182ce;
            border: 2px solid #3182ce;
          }

          .btn-outline:hover {
            background: #3182ce;
            color: white;
          }

          .btn-link {
            background: transparent;
            color: #718096;
            text-decoration: underline;
          }

          .btn-link:hover {
            color: #4a5568;
          }

          .recovery-mode-indicator {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #fff5f5;
            border: 1px solid #fed7d7;
            border-radius: 8px;
          }

          .recovery-status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            color: #c53030;
            font-weight: 500;
          }

          .recovery-icon {
            animation: spin 1s linear infinite;
          }

          .network-status {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #fffaf0;
            border: 1px solid #fbd38d;
            border-radius: 8px;
          }

          .network-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            font-weight: 500;
            color: #c05621;
            margin-bottom: 0.5rem;
          }

          .network-help {
            color: #744210;
            margin: 0;
            font-size: 0.875rem;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @media (max-width: 640px) {
            .error-fallback-header {
              flex-direction: column;
              text-align: center;
            }

            .error-info-grid {
              grid-template-columns: 1fr;
            }

            .primary-actions,
            .secondary-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    );
  }

  private getErrorMessage(): string {
    const { error, context } = this.props;
    
    if (!error) return 'حدث خطأ غير محدد';

    const message = error.message.toLowerCase();
    
    // Network related errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.';
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'انتهت مهلة الانتظار. يرجى المحاولة مرة أخرى.';
    }
    
    // Permission errors
    if (message.includes('permission') || message.includes('access denied')) {
      return 'ليس لديك صلاحية للوصول إلى هذا المورد.';
    }
    
    // Loading/Chunk errors
    if (message.includes('chunk') || message.includes('loading')) {
      return 'خطأ في تحميل الملفات. يرجى تحديث الصفحة.';
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('auth')) {
      return 'انتهت صلاحية جلستك. يرجى إعادة تسجيل الدخول.';
    }
    
    // Memory errors
    if (message.includes('memory') || message.includes('out of memory')) {
      return 'نفدت ذاكرة النظام. يرجى تحديث الصفحة.';
    }
    
    // Component rendering errors
    if (context.errorClass === 'render') {
      return 'خطأ في عرض المكون. جاري محاولة الإصلاح...';
    }
    
    // Application errors
    if (context.errorClass === 'application') {
      return 'خطأ في التطبيق. فريق التطوير تم إبلاغه.';
    }
    
    return 'حدث خطأ غير متوقع. نعتذر عن الإزعاج.';
  }

  private getErrorIcon(): string {
    const { context } = this.props;
    
    switch (context.errorClass) {
      case 'network':
        return '🌐';
      case 'application':
        return '⚠️';
      case 'page':
        return '📄';
      case 'component':
        return '🔧';
      case 'render':
        return '🎨';
      default:
        return '❌';
    }
  }
}

/**
 * Application-Level Error Boundary
 */
export class ApplicationErrorBoundary extends Component<EnhancedErrorBoundaryProps, EnhancedErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private mounted = true;
  private recoveryMode = false;

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      context: this.createErrorContext('application', props.severity || 'high'),
      retryCount: 0,
      isRetrying: false,
      recoveryAttempts: 0,
      fallbackRendered: false,
      errorHistory: []
    };
  }

  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    const errorClass = ApplicationErrorBoundary.getErrorClass(error);
    const severity = ApplicationErrorBoundary.getSeverity(error);
    
    return {
      hasError: true,
      error,
      context: {
        errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        errorClass,
        severity,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        sessionId: this.getSessionId(),
        metadata: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          url: typeof window !== 'undefined' ? window.location.href : '',
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (!this.mounted) return;

    const newErrorHistory = [
      ...this.state.errorHistory,
      {
        error,
        timestamp: new Date(),
        retryCount: this.state.retryCount
      }
    ].slice(-5); // Keep last 5 errors

    this.setState({
      errorInfo,
      errorHistory: newErrorHistory
    });

    this.handleError(error, errorInfo);

    // Enable recovery mode for critical errors
    if (this.state.context.severity === 'critical') {
      this.enableRecoveryMode();
    }
  }

  componentDidUpdate(prevProps: EnhancedErrorBoundaryProps): void {
    const { resetOnPropsChange, resetKeys } = this.props;
    
    if (resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError();
    }

    if (resetKeys && resetKeys.length > 0) {
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
    const { hasError, context } = this.state;
    const { children, fallback: FallbackComponent } = this.props;

    if (hasError) {
      const fallbackProps: EnhancedErrorFallbackProps = {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        context: this.state.context,
        resetError: this.resetError,
        retry: this.retry,
        retryCount: this.state.retryCount,
        isRetrying: this.state.isRetrying,
        recoveryMode: this.recoveryMode,
        enableReport: this.props.enableErrorReporting !== false,
        enableOfflineRetry: this.props.enableOfflineSupport === true,
        reportError: this.reportError,
        goHome: this.goHome,
        refreshPage: this.refreshPage
      };

      if (FallbackComponent) {
        return <FallbackComponent {...fallbackProps} />;
      }

      return <EnhancedErrorFallback {...fallbackProps} />;
    }

    return children;
  }

  private createErrorContext(errorClass: EnhancedErrorBoundaryState['context']['errorClass'], severity: EnhancedErrorBoundaryState['context']['severity']): ErrorBoundaryContext {
    return {
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      errorClass,
      severity,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      sessionId: this.getSessionId()
    };
  }

  private getSessionId(): string {
    if (typeof sessionStorage !== 'undefined') {
      let sessionId = sessionStorage.getItem('saler_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('saler_session_id', sessionId);
      }
      return sessionId;
    }
    return 'unknown';
  }

  private static getErrorClass(error: Error): EnhancedErrorBoundaryState['context']['errorClass'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    
    if (message.includes('chunk') || message.includes('module')) {
      return 'application';
    }
    
    if (message.includes('render') || message.includes('component')) {
      return 'component';
    }
    
    return 'component'; // Default
  }

  private static getSeverity(error: Error): EnhancedErrorBoundaryState['context']['severity'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('chunk') || message.includes('module') || message.includes('critical')) {
      return 'critical';
    }
    
    if (message.includes('network') || message.includes('timeout')) {
      return 'high';
    }
    
    if (message.includes('permission') || message.includes('access')) {
      return 'medium';
    }
    
    return 'low';
  }

  private resetError = (): void => {
    if (!this.mounted) return;

    this.recoveryMode = false;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      recoveryAttempts: 0,
      fallbackRendered: false,
      context: this.createErrorContext(this.state.context.errorClass, this.state.context.severity)
    });

    this.clearErrorMarks();
  };

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

    this.recordRetry();

    try {
      const delay = this.calculateRetryDelay(this.state.retryCount);
      await this.delay(delay);

      if (!this.mounted) return;

      this.resetError();
      
      this.props.onRecovery?.(this.state.context);

    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      if (this.mounted) {
        this.setState({ isRetrying: false });
      }
    }
  };

  private calculateRetryDelay(retryCount: number): number {
    const { retryStrategy = 'exponential', customRetryDelay } = this.props;
    
    if (customRetryDelay) {
      return customRetryDelay(retryCount);
    }

    const baseDelay = this.props.retryDelay || 1000;

    switch (retryStrategy) {
      case 'immediate':
        return 0;
      case 'linear':
        return baseDelay * retryCount;
      case 'exponential':
      default:
        return baseDelay * Math.pow(2, retryCount - 1);
    }
  }

  private enableRecoveryMode(): void {
    this.recoveryMode = true;
    
    // Attempt automatic recovery
    const recoveryInterval = setInterval(() => {
      if (!this.mounted) {
        clearInterval(recoveryInterval);
        return;
      }

      this.setState(prevState => ({
        recoveryAttempts: prevState.recoveryAttempts + 1
      }));

      // Attempt to recover after 3 attempts
      if (this.state.recoveryAttempts >= 2) {
        clearInterval(recoveryInterval);
        this.resetError();
      }
    }, 2000);
  }

  private handleError(error: Error, errorInfo: ErrorInfo): void {
    const errorData = {
      error,
      errorInfo,
      context: this.state.context,
      retryCount: this.state.retryCount,
      recoveryAttempts: this.state.recoveryAttempts
    };

    // Performance tracking
    if (this.props.enablePerformanceTracking) {
      performance.markError('error_boundary', {
        errorId: this.state.context.errorId,
        errorClass: this.state.context.errorClass,
        severity: this.state.context.severity,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
        recoveryAttempts: this.state.recoveryAttempts
      });
    }

    // Error reporting
    if (this.props.enableErrorReporting !== false) {
      errorHandler.reportError(error, {
        context: 'ApplicationErrorBoundary',
        errorId: this.state.context.errorId,
        errorClass: this.state.context.errorClass,
        severity: this.state.context.severity,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
        recoveryAttempts: this.state.recoveryAttempts,
        url: this.state.context.url,
        userAgent: this.state.context.userAgent,
        timestamp: this.state.context.timestamp
      });
    }

    // Callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.context);
    }
  }

  private recordRetry(): void {
    performance.markEvent('error_boundary_retry', {
      errorId: this.state.context.errorId,
      retryCount: this.state.retryCount,
      errorClass: this.state.context.errorClass,
      severity: this.state.context.severity
    });
  }

  private reportError = (): void => {
    const { error, errorInfo, context } = this.state;
    
    if (error && errorInfo) {
      errorHandler.reportError(error, {
        context: 'ErrorBoundary User Report',
        errorId: context.errorId,
        errorClass: context.errorClass,
        componentStack: errorInfo.componentStack,
        userAgent: context.userAgent,
        timestamp: context.timestamp,
        userInitiated: true
      });
    }
  };

  private goHome = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  private refreshPage = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private clearErrorMarks(): void {
    performance.clearError(this.state.context.errorId);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Page-Level Error Boundary
 */
export class PageErrorBoundary extends Component<EnhancedErrorBoundaryProps> {
  render() {
    return (
      <ApplicationErrorBoundary
        {...this.props}
        errorClass="page"
        severity="high"
        enableRecoveryMode={true}
      />
    );
  }
}

/**
 * Component-Level Error Boundary
 */
export class ComponentErrorBoundary extends Component<EnhancedErrorBoundaryProps> {
  render() {
    return (
      <ApplicationErrorBoundary
        {...this.props}
        errorClass="component"
        severity="medium"
      />
    );
  }
}

/**
 * Network Error Boundary
 */
export class NetworkErrorBoundary extends Component<EnhancedErrorBoundaryProps> {
  render() {
    return (
      <ApplicationErrorBoundary
        {...this.props}
        errorClass="network"
        severity="high"
        enableOfflineSupport={true}
        enableRetryMechanism={true}
      />
    );
  }
}

export default {
  ApplicationErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
  NetworkErrorBoundary,
  EnhancedErrorFallback
};