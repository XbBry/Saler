import React, { useEffect, useState } from 'react';
import { QueryClientProvider, Hydrate } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient, handleOffline, handleOnline } from '../lib/query-client';
import { 
  performanceTracker, 
  createCacheStrategyManager, 
  defaultCacheStrategies,
  getPerformanceReport 
} from '../lib/query-performance';
import { queryKeys } from '../lib/query-keys';
import { toast } from 'react-hot-toast';

// ===============================================
// Query Provider Props
// ===============================================

interface QueryProviderProps {
  children: React.ReactNode;
  dehydrateState?: any;
  enableDevtools?: boolean;
  enableOfflineSupport?: boolean;
  enablePerformanceMonitoring?: boolean;
}

// ===============================================
// Offline Status Hook
// ===============================================

const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    const handleOnlineStatus = () => {
      setIsOnline(true);
      handleOnline();
      toast.success('تم الاتصال بالشبكة');
    };

    const handleOfflineStatus = () => {
      setIsOnline(false);
      handleOffline();
      toast.error('انقطع الاتصال بالشبكة');
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);

  return isOnline;
};

// ===============================================
// Performance Monitor Component
// ===============================================

const PerformanceMonitor: React.FC<{ enableMonitoring: boolean }> = ({ 
  enableMonitoring 
}) => {
  const [isEnabled, setIsEnabled] = useState(enableMonitoring);

  useEffect(() => {
    if (!enableMonitoring) return;

    // Performance monitoring setup
    const monitorQueryPerformance = (client: typeof queryClient) => {
      // Hook into query lifecycle for performance tracking
      const originalFetch = client.fetchQuery.bind(client);
      
      client.fetchQuery = async (...args) => {
        const [queryKey] = args;
        performanceTracker.startQuery(queryKey);
        
        try {
          const result = await originalFetch(...args);
          performanceTracker.endQuery(queryKey, 'success', false, 
            result ? JSON.stringify(result).length : 0);
          return result;
        } catch (error) {
          performanceTracker.endQuery(queryKey, 'error', false);
          throw error;
        }
      };
    };

    // Apply monitoring
    monitorQueryPerformance(queryClient);

    // Set up periodic performance reporting
    const reportInterval = setInterval(() => {
      if (enableMonitoring) {
        const report = getPerformanceReport();
        
        // Log slow queries in development
        if (process.env.NODE_ENV === 'development' && report.slowQueries.length > 0) {
          console.group('🔍 Slow Queries Detected');
          report.slowQueries.forEach((query, index) => {
            console.warn(`${index + 1}. ${query.queryKey}`, 
              `Duration: ${query.duration.toFixed(2)}ms`);
          });
          console.groupEnd();
        }

        // Check if performance is below threshold
        if (report.summary.cacheHitRate < 85) {
          console.warn('⚠️ Cache hit rate below 85%:', report.summary.cacheHitRate.toFixed(2) + '%');
        }
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(reportInterval);
    };
  }, [enableMonitoring]);

  if (!isEnabled) return null;

  return null; // This component doesn't render anything
};

// ===============================================
// Cache Strategy Setup
// ===============================================

const setupCacheStrategies = () => {
  const cacheManager = createCacheStrategyManager(queryClient);
  
  // Register default strategies
  defaultCacheStrategies.forEach(strategy => {
    cacheManager.registerStrategy(strategy);
  });
  
  return cacheManager;
};

// ===============================================
// Error Boundary for Query Errors
// ===============================================

class QueryErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Query Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              خطأ في تحميل البيانات
            </h1>
            <p className="text-gray-600 mb-6">
              حدث خطأ أثناء جلب البيانات. يرجى إعادة المحاولة.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ===============================================
// Query Provider Component
// ===============================================

export const QueryProvider: React.FC<QueryProviderProps> = ({
  children,
  dehydrateState,
  enableDevtools = process.env.NODE_ENV === 'development',
  enableOfflineSupport = true,
  enablePerformanceMonitoring = process.env.NODE_ENV === 'development',
}) => {
  const isOnline = useOfflineStatus();
  const [cacheManager] = useState(() => setupCacheStrategies());
  
  useEffect(() => {
    // Apply cache strategies on mount
    cacheManager.applyStrategies();
    
    // Set up periodic cache optimization
    const optimizeInterval = setInterval(() => {
      cacheManager.optimizeCache();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(optimizeInterval);
  }, [cacheManager]);

  // Setup global query lifecycle hooks
  useEffect(() => {
    // Add global error handling
    const handleGlobalError = (error: any) => {
      if (error?.name === 'QueryError') {
        console.error('Query Error:', error);
        
        // Notify user for critical errors
        if (error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT_ERROR') {
          toast.error('فشل في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.');
        }
      }
    };

    window.addEventListener('unhandledrejection', handleGlobalError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
  }, []);

  // Network status indicator
  useEffect(() => {
    if (enableOfflineSupport) {
      const networkIndicator = document.createElement('div');
      networkIndicator.className = `
        fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-white transition-transform duration-300
        ${isOnline ? 'translate-y-0 bg-green-500' : '-translate-y-full bg-red-500'}
      `;
      networkIndicator.textContent = isOnline 
        ? 'تم الاتصال بالشبكة' 
        : 'انقطع الاتصال - سيتم حفظ البيانات محلياً';
      
      document.body.appendChild(networkIndicator);
      
      // Remove after 3 seconds when back online
      if (isOnline) {
        setTimeout(() => {
          if (document.body.contains(networkIndicator)) {
            document.body.removeChild(networkIndicator);
          }
        }, 3000);
      }
      
      return () => {
        if (document.body.contains(networkIndicator)) {
          document.body.removeChild(networkIndicator);
        }
      };
    }
  }, [isOnline, enableOfflineSupport]);

  return (
    <QueryErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={dehydrateState}>
          {/* Performance Monitor */}
          <PerformanceMonitor enableMonitoring={enablePerformanceMonitoring} />
          
          {/* Main App */}
          {children}
          
          {/* React Query Devtools */}
          {enableDevtools && (
            <ReactQueryDevtools 
              initialIsOpen={false} 
              position="bottom-right"
              toggleButtonProps={{
                style: {
                  marginLeft: '5px',
                  transform: 'scale(0.8)',
                  transformOrigin: 'bottom right',
                },
              }}
            />
          )}
          
          {/* Offline/Online Status */}
          {enableOfflineSupport && !isOnline && (
            <div className="fixed bottom-4 right-4 z-40">
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">وضع عدم الاتصال</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Cache Performance Indicator */}
          {process.env.NODE_ENV === 'development' && enablePerformanceMonitoring && (
            <CachePerformanceIndicator />
          )}
        </Hydrate>
      </QueryClientProvider>
    </QueryErrorBoundary>
  );
};

// ===============================================
// Cache Performance Indicator (Development)
// ===============================================

const CachePerformanceIndicator: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      const cacheManager = createCacheStrategyManager(queryClient);
      const cacheMetrics = cacheManager.getCacheMetrics();
      const performanceMetrics = performanceTracker.getOverallMetrics();
      
      setMetrics({
        cache: cacheMetrics,
        performance: performanceMetrics,
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !metrics) return null;

  const { cache, performance } = metrics;

  return (
    <div className="fixed bottom-4 left-4 z-40 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700">📊 Query Stats</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Cache Hit Rate:</span>
          <span className={cache.hitRate > 85 ? 'text-green-600' : 'text-red-600'}>
            {cache.hitRate.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Active Queries:</span>
          <span>{cache.activeQueries}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Avg Query Time:</span>
          <span>{performance.averageDuration.toFixed(0)}ms</span>
        </div>
        
        <div className="flex justify-between">
          <span>Cache Size:</span>
          <span>{(cache.cacheSize / 1024).toFixed(1)}KB</span>
        </div>
        
        <div className="text-xs text-gray-400 mt-1">
          Updated: {metrics.timestamp}
        </div>
      </div>
    </div>
  );
};

// ===============================================
// Development Mode Toggle Button
// ===============================================

export const PerformanceToggle: React.FC = () => {
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="fixed bottom-20 left-4 z-40">
      <button
        onClick={() => setShowStats(!showStats)}
        className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Toggle Performance Stats"
      >
        📈
      </button>
      
      {showStats && (
        <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
          <h3 className="font-semibold mb-2">Performance Report</h3>
          <PerformanceReport />
        </div>
      )}
    </div>
  );
};

// ===============================================
// Performance Report Component
// ===============================================

const PerformanceReport: React.FC = () => {
  const report = getPerformanceReport();

  return (
    <div className="text-sm space-y-2 max-h-60 overflow-y-auto">
      {/* Summary */}
      <div>
        <h4 className="font-medium text-gray-700 mb-1">Summary</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Total Queries: {report.summary.totalQueries}</div>
          <div>Success Rate: {report.summary.successRate.toFixed(1)}%</div>
          <div>Cache Hit Rate: {report.summary.cacheHitRate.toFixed(1)}%</div>
          <div>Avg Duration: {report.summary.averageDuration.toFixed(0)}ms</div>
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Recommendations</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {report.recommendations.map((rec, index) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Slow Queries */}
      {report.slowQueries.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Slow Queries</h4>
          <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
            {report.slowQueries.slice(0, 3).map((query, index) => (
              <div key={index} className="flex justify-between">
                <span className="truncate flex-1 mr-2">
                  {query.queryKey.slice(-2).join('/')}
                </span>
                <span>{query.duration.toFixed(0)}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ===============================================
// Export Provider and Utilities
// ===============================================

export { queryClient };

export default QueryProvider;
