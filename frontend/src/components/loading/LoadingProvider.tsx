/**
 * Loading Provider - Global Loading State Management
 * نظام إدارة حالة التحميل العام
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface LoadingState {
  key: string;
  isLoading: boolean;
  progress: number;
  message?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface LoadingContextType {
  // State
  loadingStates: Map<string, LoadingState>;
  globalLoading: boolean;
  activeOperations: number;
  
  // Actions
  setLoading: (key: string, isLoading: boolean, options?: Partial<Omit<LoadingState, 'key' | 'isLoading' | 'timestamp'>>) => void;
  setProgress: (key: string, progress: number, message?: string) => void;
  clearLoading: (key: string) => void;
  clearAll: () => void;
  isLoading: (key?: string) => boolean;
  getLoadingState: (key: string) => LoadingState | undefined;
  
  // Utility
  withLoading: <T extends any[], R>(key: string, operation: (...args: T) => Promise<R>, options?: Partial<Omit<LoadingState, 'key' | 'isLoading' | 'timestamp'>>) => (...args: T) => Promise<R>;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: React.ReactNode;
  enableGlobalLoading?: boolean;
  maxConcurrentOperations?: number;
  defaultTimeout?: number;
}

export function LoadingProvider({ 
  children, 
  enableGlobalLoading = true,
  maxConcurrentOperations = 10,
  defaultTimeout = 30000
}: LoadingProviderProps) {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(new Map());

  const activeOperations = useMemo(() => {
    return Array.from(loadingStates.values()).filter(state => state.isLoading).length;
  }, [loadingStates]);

  const globalLoading = useMemo(() => {
    return enableGlobalLoading && activeOperations > 0;
  }, [enableGlobalLoading, activeOperations]);

  const setLoading = useCallback((
    key: string, 
    isLoading: boolean, 
    options: Partial<Omit<LoadingState, 'key' | 'isLoading' | 'timestamp'>> = {}
  ) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      
      if (isLoading) {
        newStates.set(key, {
          key,
          isLoading: true,
          progress: 0,
          timestamp: Date.now(),
          ...options
        });
      } else {
        newStates.delete(key);
      }
      
      return newStates;
    });
  }, []);

  const setProgress = useCallback((key: string, progress: number, message?: string) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      const existing = newStates.get(key);
      
      if (existing) {
        newStates.set(key, {
          ...existing,
          progress: Math.min(100, Math.max(0, progress)),
          message: message || existing.message
        });
      }
      
      return newStates;
    });
  }, []);

  const clearLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      newStates.delete(key);
      return newStates;
    });
  }, []);

  const clearAll = useCallback(() => {
    setLoadingStates(new Map());
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      const state = loadingStates.get(key);
      return state?.isLoading || false;
    }
    return activeOperations > 0;
  }, [loadingStates, activeOperations]);

  const getLoadingState = useCallback((key: string) => {
    return loadingStates.get(key);
  }, [loadingStates]);

  const withLoading = useCallback(<T extends any[], R>(
    key: string,
    operation: (...args: T) => Promise<R>,
    options: Partial<Omit<LoadingState, 'key' | 'isLoading' | 'timestamp'>> = {}
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        setLoading(key, true, options);
        
        // Add timeout if specified
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timed out')), defaultTimeout);
        });
        
        const result = await Promise.race([operation(...args), timeoutPromise]);
        return result;
      } finally {
        clearLoading(key);
      }
    };
  }, [setLoading, clearLoading, defaultTimeout]);

  const value = useMemo(() => ({
    loadingStates,
    globalLoading,
    activeOperations,
    setLoading,
    setProgress,
    clearLoading,
    clearAll,
    isLoading,
    getLoadingState,
    withLoading
  }), [
    loadingStates,
    globalLoading,
    activeOperations,
    setLoading,
    setProgress,
    clearLoading,
    clearAll,
    isLoading,
    getLoadingState,
    withLoading
  ]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoadingIndicator 
        isVisible={globalLoading} 
        operations={Array.from(loadingStates.values())}
      />
    </LoadingContext.Provider>
  );
}

/**
 * Global Loading Indicator Component
 */
interface GlobalLoadingIndicatorProps {
  isVisible: boolean;
  operations: LoadingState[];
}

function GlobalLoadingIndicator({ isVisible, operations }: GlobalLoadingIndicatorProps) {
  if (!isVisible) return null;

  const mainOperation = operations[0];
  const totalProgress = operations.length > 0 
    ? operations.reduce((sum, op) => sum + op.progress, 0) / operations.length
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 transition-opacity duration-200" />
      
      {/* Loading Content */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
          {/* Loading Spinner */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-400 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${totalProgress}%` }}
            />
          </div>

          {/* Status Text */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {mainOperation?.message || 'جاري التحميل...'}
            </p>
            <p className="text-xs text-gray-500">
              {operations.length} عملية نشطة
            </p>
          </div>

          {/* Operation List */}
          {operations.length > 1 && (
            <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
              {operations.map((op) => (
                <div key={op.key} className="text-xs text-gray-600 flex items-center justify-between">
                  <span className="truncate">{op.message || op.key}</span>
                  <span className="text-blue-600 font-medium">{op.progress}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default LoadingProvider;