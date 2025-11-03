/**
 * Loading States and Error Boundaries - Main Exports
 * تصدير جميع مكونات ونظم إدارة حالات التحميل ومعالجة الأخطاء
 */

// Core Loading System
export { LoadingProvider, useLoading } from './LoadingProvider';

// Loading Components
export * from './LoadingComponents';

// Progress Indicators
export * from './ProgressIndicators';

// Loading Hooks
export * from './useLoading';

// Performance Hooks
export * from './usePerformance';

// Global State Management
export { useGlobalLoading } from '../store/loadingStore';

// Error Boundaries
export * from '../error-boundaries/EnhancedErrorBoundary';
export * from '../error-boundaries/RouteErrorBoundary';

// Hook indices for easy importing
export {
  useLoadingState,
  useFormLoading,
  useApiCall,
  useComponentLoading,
  useBackgroundTask
} from './useLoading';

export {
  useOptimizedCallback,
  useLazyLoading,
  useVirtualScrolling,
  usePerformanceMonitor,
  useDebouncedValue,
  useThrottledCallback,
  useResourceLoader,
  useBackgroundTasks
} from './usePerformance';

// Type exports
export type {
  LoadingState,
  LoadingContextType
} from './LoadingProvider';

export type {
  LoadingHookState,
  FormLoadingState,
  ApiCallState,
  ComponentLoadingState
} from './useLoading';

export type {
  GlobalLoadingState,
  LoadingOperation
} from '../store/loadingStore';

export type {
  ErrorBoundaryContext,
  EnhancedErrorBoundaryState,
  EnhancedErrorBoundaryProps,
  EnhancedErrorFallbackProps
} from './error-boundaries/EnhancedErrorBoundary';

// Utility exports
export { withLoading } from '../store/loadingStore';
export { useLoadingOperation } from '../store/loadingStore';

// Default export for the entire loading/error system
const LoadingErrorSystem = {
  // Provider
  LoadingProvider,
  
  // Core hooks
  useLoading,
  useGlobalLoading,
  
  // Component loading hooks
  useLoadingState,
  useFormLoading,
  useApiCall,
  useComponentLoading,
  useBackgroundTask,
  
  // Performance hooks
  useOptimizedCallback,
  useLazyLoading,
  useVirtualScrolling,
  usePerformanceMonitor,
  useDebouncedValue,
  useThrottledCallback,
  useResourceLoader,
  useBackgroundTasks,
  
  // Error boundaries
  ApplicationErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
  NetworkErrorBoundary,
  RouteErrorBoundary,
  
  // Utilities
  withLoading,
  useLoadingOperation,
  
  // Components (will be imported from their modules)
  LoadingSpinner,
  PulsingDots,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonChart,
  ProgressBar,
  LoadingButton,
  PageLoadingOverlay,
  InlineLoading,
  LazyLoadingPlaceholder,
  FormLoadingOverlay,
  
  // Progress Indicators
  CircularProgress,
  LinearProgress,
  StepProgress,
  UploadProgress,
  GlobalLoadingOverlay
};

export default LoadingErrorSystem;