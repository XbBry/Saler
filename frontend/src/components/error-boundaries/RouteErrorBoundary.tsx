/**
 * Route Error Boundary for Next.js App Router
 * Error Boundary خاص بالتوجيهات والصفحات
 */

import React, { Component, ReactNode } from 'react';
import { ApplicationErrorBoundary } from './EnhancedErrorBoundary';

// Page-level error component
export default function RouteError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="route-error-container">
      <ApplicationErrorBoundary
        fallback={(props) => <RouteErrorFallback {...props} />}
        onError={(error, errorInfo, context) => {
          // Log route-specific errors
          console.error('Route Error:', {
            error: error.message,
            digest: error.digest,
            context
          });
        }}
        enableErrorReporting={true}
        enablePerformanceTracking={true}
        maxRetries={1}
        retryDelay={2000}
      >
        <RouteErrorContent 
          error={error} 
          reset={reset}
          context={{
            errorId: error.digest || `route_${Date.now()}`,
            errorClass: 'page' as const,
            severity: 'high' as const,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            timestamp: new Date(),
            url: typeof window !== 'undefined' ? window.location.href : '',
            metadata: { route: 'page', digest: error.digest }
          }}
        />
      </ApplicationErrorBoundary>
    </div>
  );
}

// Route-specific error fallback
function RouteErrorFallback({
  error,
  context,
  resetError
}: {
  error: Error | null;
  context: any;
  resetError: () => void;
}) {
  return (
    <div className="route-error-fallback" dir="rtl">
      <div className="route-error-content">
        <div className="route-error-icon">📄</div>
        <h2 className="route-error-title">خطأ في الصفحة</h2>
        <p className="route-error-message">
          حدث خطأ أثناء تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
        </p>
        
        <div className="route-error-actions">
          <button 
            className="btn btn-primary"
            onClick={resetError}
          >
            المحاولة مرة أخرى
          </button>
          <a 
            className="btn btn-secondary"
            href="/"
          >
            الصفحة الرئيسية
          </a>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="route-error-details">
            <summary>تفاصيل الخطأ (Developer Mode)</summary>
            <pre className="route-error-stack">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Route error content component
function RouteErrorContent({
  error,
  reset,
  context
}: {
  error: Error & { digest?: string };
  reset: () => void;
  context: any;
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error('Route error occurred:', {
      error: error.message,
      digest: error.digest,
      context
    });
  }, [error, context]);

  return (
    <div className="route-error-page">
      <div className="route-error-container">
        <div className="route-error-content">
          <div className="route-error-icon">📄</div>
          <h2 className="route-error-title">عذراً، هذه الصفحة لا تعمل</h2>
          <p className="route-error-message">
            حدث خطأ غير متوقع في هذه الصفحة. نعمل على حل المشكلة.
          </p>
          
          <div className="route-error-actions">
            <button 
              className="btn btn-primary"
              onClick={reset}
            >
              المحاولة مرة أخرى
            </button>
            <a 
              className="btn btn-secondary"
              href="/"
            >
              الصفحة الرئيسية
            </a>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="route-error-debug">
              <h4>معلومات التطوير:</h4>
              <div className="route-error-debug-info">
                <div><strong>Error ID:</strong> {error.digest}</div>
                <div><strong>Message:</strong> {error.message}</div>
                <div><strong>Timestamp:</strong> {context.timestamp.toLocaleString()}</div>
                <div><strong>URL:</strong> {context.url}</div>
              </div>
              {error.stack && (
                <pre className="route-error-stack">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .route-error-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .route-error-content {
          max-width: 500px;
          text-align: center;
          background: white;
          padding: 3rem 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .route-error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .route-error-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 1rem 0;
        }

        .route-error-message {
          color: #4a5568;
          font-size: 1.1rem;
          line-height: 1.6;
          margin: 0 0 2rem 0;
        }

        .route-error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          padding: 0.875rem 1.75rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primary {
          background: #3182ce;
          color: white;
        }

        .btn-primary:hover {
          background: #2c5aa0;
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #2d3748;
        }

        .btn-secondary:hover {
          background: #cbd5e0;
        }

        .route-error-details,
        .route-error-debug {
          margin-top: 2rem;
          text-align: left;
          padding: 1.5rem;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .route-error-details summary,
        .route-error-debug h4 {
          cursor: pointer;
          color: #3182ce;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .route-error-debug-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .route-error-stack {
          background: #1a202c;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.75rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        @media (max-width: 640px) {
          .route-error-content {
            padding: 2rem 1.5rem;
          }

          .route-error-title {
            font-size: 1.5rem;
          }

          .route-error-actions {
            flex-direction: column;
          }

          .route-error-debug-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

// Not Found Error Component
export function NotFound({
  notFound,
  reset
}: {
  notFound: () => void;
  reset: () => void;
}) {
  return (
    <div className="not-found-container" dir="rtl">
      <div className="not-found-content">
        <div className="not-found-icon">🔍</div>
        <h2 className="not-found-title">الصفحة غير موجودة</h2>
        <p className="not-found-message">
          عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. 
          تحقق من الرابط أو عد للصفحة الرئيسية.
        </p>
        
        <div className="not-found-actions">
          <button 
            className="btn btn-primary"
            onClick={reset}
          >
            المحاولة مرة أخرى
          </button>
          <a 
            className="btn btn-secondary"
            href="/"
          >
            الصفحة الرئيسية
          </a>
          <button 
            className="btn btn-link"
            onClick={() => window.history.back()}
          >
            العودة للخلف
          </button>
        </div>
      </div>

      <style jsx>{`
        .not-found-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .not-found-content {
          max-width: 500px;
          text-align: center;
          background: white;
          padding: 3rem 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .not-found-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .not-found-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 1rem 0;
        }

        .not-found-message {
          color: #4a5568;
          font-size: 1.1rem;
          line-height: 1.6;
          margin: 0 0 2rem 0;
        }

        .not-found-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          padding: 0.875rem 1.75rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primary {
          background: #3182ce;
          color: white;
        }

        .btn-primary:hover {
          background: #2c5aa0;
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #2d3748;
        }

        .btn-secondary:hover {
          background: #cbd5e0;
        }

        .btn-link {
          background: transparent;
          color: #718096;
          text-decoration: underline;
        }

        .btn-link:hover {
          color: #4a5568;
        }

        @media (max-width: 640px) {
          .not-found-content {
            padding: 2rem 1.5rem;
          }

          .not-found-title {
            font-size: 1.5rem;
          }

          .not-found-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

// Loading Boundary Component
export function LoadingBoundary({
  children,
  fallback = <DefaultLoadingBoundary />
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <React.Suspense 
      fallback={
        <div className="loading-boundary" dir="rtl">
          {fallback}
        </div>
      }
    >
      {children}
    </React.Suspense>
  );
}

// Default loading boundary fallback
function DefaultLoadingBoundary() {
  return (
    <div className="default-loading-boundary">
      <div className="loading-spinner" />
      <p className="loading-text">جاري التحميل...</p>
      
      <style jsx>{`
        .default-loading-boundary {
          min-height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #3182ce;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .loading-text {
          color: #4a5568;
          font-weight: 500;
          margin: 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default {
  RouteError,
  NotFound,
  LoadingBoundary,
  DefaultLoadingBoundary
};