/**
 * Global Loading State Manager
 * نظام إدارة حالة التحميل العام
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Loading state types
export interface GlobalLoadingState {
  // Global states
  isGlobalLoading: boolean;
  globalLoadingMessage: string;
  globalProgress: number;
  
  // Operation tracking
  activeOperations: Map<string, LoadingOperation>;
  operationHistory: LoadingOperation[];
  
  // Performance metrics
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  totalOperations: number;
  
  // Settings
  settings: {
    enableGlobalIndicator: boolean;
    maxConcurrentOperations: number;
    defaultTimeout: number;
    autoCleanup: boolean;
    enableAnalytics: boolean;
  };
}

export interface LoadingOperation {
  id: string;
  key: string;
  type: 'api' | 'form' | 'component' | 'page' | 'custom';
  isActive: boolean;
  progress: number;
  message: string;
  startedAt: number;
  estimatedDuration?: number;
  metadata?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

// Actions interface
export interface GlobalLoadingActions {
  // Core operations
  startOperation: (operation: Omit<LoadingOperation, 'id' | 'startedAt' | 'status'>) => string;
  updateOperation: (id: string, updates: Partial<LoadingOperation>) => void;
  completeOperation: (id: string, success?: boolean, error?: string) => void;
  cancelOperation: (id: string) => void;
  
  // Global loading
  setGlobalLoading: (isLoading: boolean, message?: string, progress?: number) => void;
  updateGlobalProgress: (progress: number, message?: string) => void;
  
  // Batch operations
  startBatch: (operations: Array<Omit<LoadingOperation, 'id' | 'startedAt' | 'status'>>) => string[];
  completeBatch: (ids: string[], success?: boolean) => void;
  
  // Query operations
  getOperation: (id: string) => LoadingOperation | undefined;
  getOperationsByKey: (key: string) => LoadingOperation[];
  getOperationsByType: (type: LoadingOperation['type']) => LoadingOperation[];
  getActiveOperations: () => LoadingOperation[];
  getOperationsByPriority: (priority: LoadingOperation['priority']) => LoadingOperation[];
  
  // Status queries
  isOperationActive: (id: string) => boolean;
  isKeyActive: (key: string) => boolean;
  hasActiveOperations: () => boolean;
  getActiveOperationsCount: () => number;
  
  // Utilities
  clearOperation: (id: string) => void;
  clearAllOperations: () => void;
  clearOperationsByType: (type: LoadingOperation['type']) => void;
  clearOperationsByPriority: (priority: LoadingOperation['priority']) => void;
  
  // Performance tracking
  getPerformanceMetrics: () => {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    totalOperations: number;
    activeOperations: number;
  };
  
  // Settings
  updateSettings: (settings: Partial<GlobalLoadingState['settings']>) => void;
  
  // Analytics
  recordOperation: (operation: LoadingOperation, duration: number, success: boolean) => void;
}

// Store type
type GlobalLoadingStore = GlobalLoadingState & GlobalLoadingActions;

// Create the store
export const useGlobalLoadingStore = create<GlobalLoadingStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isGlobalLoading: false,
    globalLoadingMessage: '',
    globalProgress: 0,
    activeOperations: new Map(),
    operationHistory: [],
    averageResponseTime: 0,
    successRate: 100,
    errorRate: 0,
    totalOperations: 0,
    settings: {
      enableGlobalIndicator: true,
      maxConcurrentOperations: 10,
      defaultTimeout: 30000,
      autoCleanup: true,
      enableAnalytics: true
    },

    // Core operations
    startOperation: (operation) => {
      const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newOperation: LoadingOperation = {
        ...operation,
        id,
        startedAt: Date.now(),
        status: 'running'
      };

      set((state) => {
        const newActiveOperations = new Map(state.activeOperations);
        
        // Check max concurrent operations
        if (newActiveOperations.size >= state.settings.maxConcurrentOperations) {
          // Remove oldest operation
          const oldestId = Array.from(newActiveOperations.keys())[0];
          newActiveOperations.delete(oldestId);
        }
        
        newActiveOperations.set(id, newOperation);
        
        // Auto cleanup old history
        const newHistory = [...state.operationHistory, newOperation].slice(-100);
        
        // Update global loading state if needed
        const newIsGlobalLoading = newActiveOperations.size > 0 && state.settings.enableGlobalIndicator;
        
        return {
          ...state,
          isGlobalLoading: newIsGlobalLoading,
          activeOperations: newActiveOperations,
          operationHistory: newHistory,
          totalOperations: state.totalOperations + 1
        };
      });

      return id;
    },

    updateOperation: (id, updates) => {
      set((state) => {
        const newActiveOperations = new Map(state.activeOperations);
        const operation = newActiveOperations.get(id);
        
        if (operation) {
          const updatedOperation = { ...operation, ...updates };
          newActiveOperations.set(id, updatedOperation);
        }
        
        return {
          ...state,
          activeOperations: newActiveOperations
        };
      });
    },

    completeOperation: (id, success = true, error) => {
      set((state) => {
        const newActiveOperations = new Map(state.activeOperations);
        const operation = newActiveOperations.get(id);
        
        if (operation) {
          const duration = Date.now() - operation.startedAt;
          
          // Update operation status
          const updatedOperation: LoadingOperation = {
            ...operation,
            status: success ? 'completed' : 'failed',
            isActive: false
          };
          
          newActiveOperations.delete(id);
          
          // Auto cleanup if enabled
          if (state.settings.autoCleanup) {
            setTimeout(() => {
              get().clearOperation(id);
            }, 5000);
          }
          
          // Record performance metrics
          if (state.settings.enableAnalytics) {
            get().recordOperation(updatedOperation, duration, success);
          }
          
          // Update global loading state
          const newIsGlobalLoading = newActiveOperations.size > 0 && state.settings.enableGlobalIndicator;
          
          return {
            ...state,
            isGlobalLoading: newIsGlobalLoading,
            activeOperations: newActiveOperations
          };
        }
        
        return state;
      });
    },

    cancelOperation: (id) => {
      set((state) => {
        const newActiveOperations = new Map(state.activeOperations);
        const operation = newActiveOperations.get(id);
        
        if (operation) {
          const updatedOperation: LoadingOperation = {
            ...operation,
            status: 'cancelled',
            isActive: false
          };
          
          newActiveOperations.delete(id);
          
          const newIsGlobalLoading = newActiveOperations.size > 0 && state.settings.enableGlobalIndicator;
          
          return {
            ...state,
            isGlobalLoading: newIsGlobalLoading,
            activeOperations: newActiveOperations
          };
        }
        
        return state;
      });
    },

    // Global loading
    setGlobalLoading: (isLoading, message = '', progress = 0) => {
      set((state) => ({
        ...state,
        isGlobalLoading,
        globalLoadingMessage: message,
        globalProgress: progress
      }));
    },

    updateGlobalProgress: (progress, message) => {
      set((state) => ({
        ...state,
        globalProgress: Math.min(100, Math.max(0, progress)),
        globalLoadingMessage: message || state.globalLoadingMessage
      }));
    },

    // Batch operations
    startBatch: (operations) => {
      return operations.map(operation => get().startOperation(operation));
    },

    completeBatch: (ids, success = true) => {
      ids.forEach(id => get().completeOperation(id, success));
    },

    // Query operations
    getOperation: (id) => {
      const state = get();
      return state.activeOperations.get(id);
    },

    getOperationsByKey: (key) => {
      const state = get();
      return Array.from(state.activeOperations.values()).filter(op => op.key === key);
    },

    getOperationsByType: (type) => {
      const state = get();
      return Array.from(state.activeOperations.values()).filter(op => op.type === type);
    },

    getActiveOperations: () => {
      const state = get();
      return Array.from(state.activeOperations.values());
    },

    getOperationsByPriority: (priority) => {
      const state = get();
      return Array.from(state.activeOperations.values()).filter(op => op.priority === priority);
    },

    // Status queries
    isOperationActive: (id) => {
      const operation = get().getOperation(id);
      return operation?.isActive || false;
    },

    isKeyActive: (key) => {
      const operations = get().getOperationsByKey(key);
      return operations.some(op => op.isActive);
    },

    hasActiveOperations: () => {
      return get().activeOperations.size > 0;
    },

    getActiveOperationsCount: () => {
      return get().activeOperations.size;
    },

    // Utilities
    clearOperation: (id) => {
      set((state) => {
        const newActiveOperations = new Map(state.activeOperations);
        newActiveOperations.delete(id);
        
        const newIsGlobalLoading = newActiveOperations.size > 0 && state.settings.enableGlobalIndicator;
        
        return {
          ...state,
          isGlobalLoading: newIsGlobalLoading,
          activeOperations: newActiveOperations
        };
      });
    },

    clearAllOperations: () => {
      set((state) => ({
        ...state,
        isGlobalLoading: false,
        activeOperations: new Map()
      }));
    },

    clearOperationsByType: (type) => {
      set((state) => {
        const newActiveOperations = new Map(state.activeOperations);
        const filteredOperations = Array.from(newActiveOperations.values())
          .filter(op => op.type !== type);
        
        const newMap = new Map();
        filteredOperations.forEach(op => newMap.set(op.id, op));
        
        const newIsGlobalLoading = newMap.size > 0 && state.settings.enableGlobalIndicator;
        
        return {
          ...state,
          isGlobalLoading: newIsGlobalLoading,
          activeOperations: newMap
        };
      });
    },

    clearOperationsByPriority: (priority) => {
      set((state) => {
        const newActiveOperations = new Map(state.activeOperations);
        const filteredOperations = Array.from(newActiveOperations.values())
          .filter(op => op.priority !== priority);
        
        const newMap = new Map();
        filteredOperations.forEach(op => newMap.set(op.id, op));
        
        const newIsGlobalLoading = newMap.size > 0 && state.settings.enableGlobalIndicator;
        
        return {
          ...state,
          isGlobalLoading: newIsGlobalLoading,
          activeOperations: newMap
        };
      });
    },

    // Performance tracking
    getPerformanceMetrics: () => {
      const state = get();
      return {
        averageResponseTime: state.averageResponseTime,
        successRate: state.successRate,
        errorRate: state.errorRate,
        totalOperations: state.totalOperations,
        activeOperations: state.activeOperations.size
      };
    },

    // Settings
    updateSettings: (newSettings) => {
      set((state) => ({
        ...state,
        settings: { ...state.settings, ...newSettings }
      }));
    },

    // Analytics
    recordOperation: (operation, duration, success) => {
      set((state) => {
        const history = [...state.operationHistory].slice(-1000); // Keep last 1000
        history.push(operation);
        
        // Calculate metrics
        const completedOperations = history.filter(op => 
          op.status === 'completed' || op.status === 'failed'
        );
        
        const totalDuration = completedOperations.reduce((sum, op) => {
          return sum + (Date.now() - op.startedAt);
        }, 0);
        
        const successfulOperations = completedOperations.filter(op => op.status === 'completed');
        const successCount = successfulOperations.length;
        const errorCount = completedOperations.length - successCount;
        
        return {
          ...state,
          operationHistory: history,
          averageResponseTime: totalDuration / completedOperations.length || 0,
          successRate: completedOperations.length > 0 ? (successCount / completedOperations.length) * 100 : 100,
          errorRate: completedOperations.length > 0 ? (errorCount / completedOperations.length) * 100 : 0
        };
      });
    }
  }))
);

// Hook for easy access
export function useGlobalLoading() {
  const store = useGlobalLoadingStore();
  
  return {
    ...store,
    // Computed values
    hasActiveOperations: store.hasActiveOperations(),
    activeOperationsCount: store.getActiveOperationsCount(),
    performanceMetrics: store.getPerformanceMetrics()
  };
}

// Higher-order function for wrapping async operations
export function withLoading<Args extends any[], Result>(
  operationKey: string,
  operation: (...args: Args) => Promise<Result>,
  options: {
    type?: LoadingOperation['type'];
    priority?: LoadingOperation['priority'];
    message?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  return async (...args: Args): Promise<Result> => {
    const { 
      type = 'api', 
      priority = 'medium', 
      message = 'جاري التحميل...',
      metadata 
    } = options;
    
    const store = useGlobalLoadingStore.getState();
    const operationId = store.startOperation({
      key: operationKey,
      type,
      priority,
      message,
      metadata,
      isActive: true,
      progress: 0,
      retryCount: 0,
      maxRetries: 3
    });
    
    try {
      // Update progress during operation
      store.updateOperation(operationId, { progress: 25 });
      const result = await operation(...args);
      
      store.updateOperation(operationId, { progress: 100 });
      store.completeOperation(operationId, true);
      
      return result;
    } catch (error) {
      store.completeOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };
}

// React hook for components
export function useLoadingOperation(operationKey: string) {
  const { 
    getOperationsByKey, 
    startOperation, 
    completeOperation, 
    updateOperation,
    isKeyActive 
  } = useGlobalLoading();
  
  const operations = getOperationsByKey(operationKey);
  const isLoading = isKeyActive(operationKey);
  const activeOperation = operations[operations.length - 1]; // Latest operation
  
  const start = (message?: string, metadata?: Record<string, any>) => {
    return startOperation({
      key: operationKey,
      type: 'component',
      priority: 'medium',
      message: message || 'جاري التحميل...',
      metadata,
      isActive: true,
      progress: 0,
      retryCount: 0,
      maxRetries: 3
    });
  };
  
  const complete = (success?: boolean) => {
    if (activeOperation) {
      completeOperation(activeOperation.id, success);
    }
  };
  
  const updateProgress = (progress: number, message?: string) => {
    if (activeOperation) {
      updateOperation(activeOperation.id, { progress, message });
    }
  };
  
  return {
    isLoading,
    operation: activeOperation,
    operations,
    start,
    complete,
    updateProgress
  };
}

export default useGlobalLoadingStore;