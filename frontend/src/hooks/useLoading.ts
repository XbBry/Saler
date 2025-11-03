/**
 * Advanced Loading State Hooks
 * Hooks متقدمة لحالات التحميل
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLoading } from './LoadingProvider';

// Loading states interface
export interface LoadingHookState {
  isLoading: boolean;
  error: string | null;
  progress: number;
  message: string;
  startedAt: number;
  estimatedTimeRemaining?: number;
}

// Form loading states
export interface FormLoadingState {
  isSubmitting: boolean;
  isValidating: boolean;
  submitProgress: number;
  validationProgress: number;
  errors: Record<string, string[]>;
  fieldErrors: Record<string, string>;
}

// API call states
export interface ApiCallState {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  progress: number;
  responseTime: number;
  retryCount: number;
  lastAttemptAt: number;
}

// Component loading states
export interface ComponentLoadingState {
  isMounting: boolean;
  isUpdating: boolean;
  isUnmounting: boolean;
  mountProgress: number;
  renderTime: number;
  memoryUsage?: number;
}

/**
 * Enhanced loading state hook with progress tracking
 */
export function useLoadingState(
  key: string,
  options?: {
    enableProgress?: boolean;
    enableEstimation?: boolean;
    timeout?: number;
    autoStart?: boolean;
  }
) {
  const { setLoading, setProgress, clearLoading, isLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [progress, setLocalProgress] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  
  const {
    enableProgress = true,
    enableEstimation = false,
    timeout = 30000,
    autoStart = false
  } = options || {};

  const startTimeRef = useRef<number>(0);
  const progressHistoryRef = useRef<Array<{ time: number; progress: number }>>([]);

  const isLoadingState = isLoading(key);

  const startLoading = useCallback((initialMessage?: string) => {
    startTimeRef.current = Date.now();
    setStartedAt(Date.now());
    setError(null);
    setLocalProgress(0);
    setMessage(initialMessage || 'جاري التحميل...');
    progressHistoryRef.current = [{ time: Date.now(), progress: 0 }];
    
    if (enableProgress) {
      setProgress(key, 0, initialMessage);
    } else {
      setLoading(key, true, { message: initialMessage });
    }
  }, [key, setLoading, setProgress, enableProgress]);

  const updateProgress = useCallback((newProgress: number, newMessage?: string) => {
    const now = Date.now();
    setLocalProgress(newProgress);
    if (newMessage) setMessage(newMessage);
    
    progressHistoryRef.current.push({ time: now, progress: newProgress });
    
    if (enableProgress) {
      setProgress(key, newProgress, newMessage);
    }

    // Calculate estimated time remaining
    if (enableEstimation && newProgress > 0) {
      const elapsed = now - startTimeRef.current;
      const rate = newProgress / elapsed; // progress per millisecond
      const remainingProgress = 100 - newProgress;
      const estimatedMs = remainingProgress / rate;
      setEstimatedTimeRemaining(estimatedMs);
    }
  }, [key, setProgress, enableProgress, enableEstimation]);

  const setLoadingMessage = useCallback((newMessage: string) => {
    setMessage(newMessage);
    if (enableProgress) {
      setProgress(key, progress, newMessage);
    }
  }, [key, progress, setProgress, enableProgress]);

  const completeLoading = useCallback(() => {
    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    
    setLocalProgress(100);
    setMessage('تم بنجاح');
    
    if (enableProgress) {
      setProgress(key, 100, 'تم بنجاح');
    }
    
    // Clean up after a delay
    setTimeout(() => {
      clearLoading(key);
      setLocalProgress(0);
      setMessage('');
      setError(null);
      setEstimatedTimeRemaining(null);
    }, 1000);
  }, [key, clearLoading, setProgress, enableProgress]);

  const stopLoading = useCallback(() => {
    clearLoading(key);
    setLocalProgress(0);
    setMessage('');
    setError(null);
    setEstimatedTimeRemaining(null);
  }, [key, clearLoading]);

  const failLoading = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setMessage('فشل في العملية');
    clearLoading(key);
  }, [key, clearLoading]);

  // Auto start loading if configured
  useEffect(() => {
    if (autoStart) {
      startLoading();
    }
  }, [autoStart, startLoading]);

  // Auto timeout
  useEffect(() => {
    if (isLoadingState && timeout > 0) {
      const timeoutId = setTimeout(() => {
        failLoading('انتهت مهلة الانتظار');
      }, timeout);

      return () => clearTimeout(timeoutId);
    }
  }, [isLoadingState, timeout, failLoading]);

  const state: LoadingHookState = useMemo(() => ({
    isLoading: isLoadingState,
    error,
    progress,
    message,
    startedAt,
    estimatedTimeRemaining: enableEstimation ? estimatedTimeRemaining : undefined
  }), [isLoadingState, error, progress, message, startedAt, estimatedTimeRemaining, enableEstimation]);

  return {
    state,
    // Actions
    startLoading,
    updateProgress,
    setLoadingMessage,
    completeLoading,
    stopLoading,
    failLoading,
    // Utils
    isLoading: isLoadingState,
    reset: stopLoading
  };
}

/**
 * Form loading states hook
 */
export function useFormLoading() {
  const [state, setState] = useState<FormLoadingState>({
    isSubmitting: false,
    isValidating: false,
    submitProgress: 0,
    validationProgress: 0,
    errors: {},
    fieldErrors: {}
  });

  const startSubmission = useCallback((message?: string) => {
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      submitProgress: 0,
      errors: {}
    }));
  }, []);

  const updateSubmissionProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      submitProgress: progress
    }));
  }, []);

  const completeSubmission = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSubmitting: false,
      submitProgress: 100
    }));
  }, []);

  const startValidation = useCallback(() => {
    setState(prev => ({
      ...prev,
      isValidating: true,
      validationProgress: 0
    }));
  }, []);

  const updateValidationProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      validationProgress: progress
    }));
  }, []);

  const completeValidation = useCallback(() => {
    setState(prev => ({
      ...prev,
      isValidating: false,
      validationProgress: 100
    }));
  }, []);

  const setValidationErrors = useCallback((errors: Record<string, string[]>) => {
    setState(prev => ({
      ...prev,
      errors,
      fieldErrors: Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [field, messages.join(', ')])
      )
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
      fieldErrors: {}
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      isValidating: false,
      submitProgress: 0,
      validationProgress: 0,
      errors: {},
      fieldErrors: {}
    });
  }, []);

  return {
    state,
    // Actions
    startSubmission,
    updateSubmissionProgress,
    completeSubmission,
    startValidation,
    updateValidationProgress,
    completeValidation,
    setValidationErrors,
    clearErrors,
    reset,
    // Computed
    hasErrors: Object.keys(state.errors).length > 0,
    isProcessing: state.isSubmitting || state.isValidating,
    overallProgress: Math.max(state.submitProgress, state.validationProgress)
  };
}

/**
 * API call states hook with retry logic
 */
export function useApiCall(
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    enableRetry?: boolean;
    timeout?: number;
  }
) {
  const [state, setState] = useState<ApiCallState>({
    isPending: false,
    isSuccess: false,
    isError: false,
    progress: 0,
    responseTime: 0,
    retryCount: 0,
    lastAttemptAt: 0
  });

  const {
    maxRetries = 3,
    retryDelay = 1000,
    enableRetry = true,
    timeout = 10000
  } = options || {};

  const startCall = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPending: true,
      isSuccess: false,
      isError: false,
      progress: 0,
      lastAttemptAt: Date.now()
    }));
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress
    }));
  }, []);

  const completeCall = useCallback((responseTime: number) => {
    setState(prev => ({
      ...prev,
      isPending: false,
      isSuccess: true,
      isError: false,
      progress: 100,
      responseTime
    }));
  }, []);

  const failCall = useCallback((error: any) => {
    setState(prev => ({
      ...prev,
      isPending: false,
      isSuccess: false,
      isError: true,
      responseTime: Date.now() - prev.lastAttemptAt
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isPending: false,
      isSuccess: false,
      isError: false,
      progress: 0,
      responseTime: 0,
      retryCount: 0,
      lastAttemptAt: 0
    });
  }, []);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    onProgress?: (progress: number) => void
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        startCall();
        
        const startTime = Date.now();
        onProgress?.(10);
        
        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        });
        
        onProgress?.(50);
        const result = await Promise.race([operation(), timeoutPromise]);
        onProgress?.(90);
        
        completeCall(Date.now() - startTime);
        onProgress?.(100);
        
        return result;
      } catch (error) {
        lastError = error;
        failCall(error);
        
        if (attempt < maxRetries && enableRetry) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          setState(prev => ({ ...prev, retryCount: attempt + 1 }));
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    
    throw lastError;
  }, [startCall, completeCall, failCall, maxRetries, enableRetry, retryDelay, timeout]);

  return {
    state,
    // Actions
    startCall,
    updateProgress,
    completeCall,
    failCall,
    reset,
    executeWithRetry,
    // Computed
    canRetry: state.isError && state.retryCount < maxRetries,
    shouldRetry: state.isError && enableRetry && state.retryCount < maxRetries
  };
}

/**
 * Component mounting states hook
 */
export function useComponentLoading() {
  const [state, setState] = useState<ComponentLoadingState>({
    isMounting: false,
    isUpdating: false,
    isUnmounting: false,
    mountProgress: 0,
    renderTime: 0,
    memoryUsage: 0
  });

  const mountStartTimeRef = useRef<number>(0);

  const startMount = useCallback(() => {
    mountStartTimeRef.current = Date.now();
    setState(prev => ({
      ...prev,
      isMounting: true,
      mountProgress: 0
    }));
  }, []);

  const updateMountProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      mountProgress: progress
    }));
  }, []);

  const completeMount = useCallback(() => {
    const renderTime = Date.now() - mountStartTimeRef.current;
    setState(prev => ({
      ...prev,
      isMounting: false,
      mountProgress: 100,
      renderTime
    }));
  }, []);

  const startUpdate = useCallback(() => {
    setState(prev => ({
      ...prev,
      isUpdating: true
    }));
  }, []);

  const completeUpdate = useCallback(() => {
    setState(prev => ({
      ...prev,
      isUpdating: false
    }));
  }, []);

  const startUnmount = useCallback(() => {
    setState(prev => ({
      ...prev,
      isUnmounting: true
    }));
  }, []);

  const completeUnmount = useCallback(() => {
    setState(prev => ({
      ...prev,
      isUnmounting: false,
      mountProgress: 0,
      renderTime: 0
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isMounting: false,
      isUpdating: false,
      isUnmounting: false,
      mountProgress: 0,
      renderTime: 0,
      memoryUsage: 0
    });
  }, []);

  return {
    state,
    // Actions
    startMount,
    updateMountProgress,
    completeMount,
    startUpdate,
    completeUpdate,
    startUnmount,
    completeUnmount,
    reset,
    // Computed
    isReady: !state.isMounting && !state.isUpdating && !state.isUnmounting,
    isLoading: state.isMounting || state.isUpdating,
    performance: {
      renderTime: state.renderTime,
      mountProgress: state.mountProgress,
      memoryUsage: state.memoryUsage
    }
  };
}

/**
 * Background task loading hook
 */
export function useBackgroundTask(
  task: () => Promise<any>,
  options?: {
    interval?: number;
    enabled?: boolean;
    maxAttempts?: number;
  }
) {
  const {
    interval = 5000,
    enabled = true,
    maxAttempts = 3
  } = options || {};

  const [state, setState] = useState({
    isRunning: false,
    isPaused: false,
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    error: null as string | null,
    attemptCount: 0,
    successCount: 0
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const isRunningRef = useRef(false);

  const runTask = useCallback(async () => {
    if (isRunningRef.current) return;
    
    isRunningRef.current = true;
    setState(prev => ({
      ...prev,
      isRunning: true,
      error: null
    }));

    try {
      await task();
      setState(prev => ({
        ...prev,
        lastRun: new Date(),
        successCount: prev.successCount + 1,
        attemptCount: 0,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير محدد';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        attemptCount: prev.attemptCount + 1
      }));
    } finally {
      isRunningRef.current = false;
      setState(prev => ({ ...prev, isRunning: false }));
    }
  }, [task]);

  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    runTask();
    intervalRef.current = setInterval(runTask, interval);
    setState(prev => ({ ...prev, isPaused: false, nextRun: new Date(Date.now() + interval) }));
  }, [runTask, interval]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    if (!state.isPaused) return;
    
    intervalRef.current = setInterval(runTask, interval);
    setState(prev => ({ ...prev, isPaused: false, nextRun: new Date(Date.now() + interval) }));
  }, [state.isPaused, runTask, interval]);

  const forceRun = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    runTask();
    intervalRef.current = setInterval(runTask, interval);
  }, [runTask, interval]);

  useEffect(() => {
    if (enabled && !state.isPaused) {
      start();
    } else {
      stop();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, state.isPaused, start, stop]);

  return {
    state,
    // Actions
    start,
    stop,
    pause,
    resume,
    forceRun,
    // Computed
    shouldRetry: state.error && state.attemptCount < maxAttempts,
    canRun: enabled && !state.isRunning
  };
}

export default {
  useLoadingState,
  useFormLoading,
  useApiCall,
  useComponentLoading,
  useBackgroundTask
};