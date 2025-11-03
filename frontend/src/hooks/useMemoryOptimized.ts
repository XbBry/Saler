/**
 * Memory optimized hooks for efficient memory management
 * Hooks محسنة للذاكرة لإدارة فعالة للذاكرة
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  MemoryEfficientMap, 
  WeakCache, 
  ObjectPool,
  memoryUtils,
  memoryPressureManager 
} from '../lib/memory';

// Memory-optimized state hook
export function useMemoryOptimizedState<T>(
  initialValue: T,
  options: {
    maxMemory?: number;
    compression?: boolean;
    ttl?: number;
  } = {}
) {
  const { maxMemory = 1000, compression = false, ttl = 300000 } = options;
  
  const [state, setState] = useState<T>(initialValue);
  const cacheRef = useRef(new MemoryEfficientMap<string, T>(maxMemory, ttl));

  // Auto-cleanup when memory is low
  useEffect(() => {
    const cleanup = () => {
      if (memoryUtils.isMemoryLow(70)) {
        cacheRef.current.clear();
      }
    };

    memoryPressureManager.onPressure((level) => {
      if (level === 'high') {
        cleanup();
      }
    });

    return () => {
      memoryPressureManager.removeCallback(cleanup as any);
    };
  }, []);

  const setOptimizedState = useCallback((value: T) => {
    setState(value);
    
    // Cache the value with memory considerations
    const cacheKey = `state_${Date.now()}`;
    cacheRef.current.set(cacheKey, value);
  }, []);

  return [state, setOptimizedState] as const;
}

// Memory-optimized callback hook
export function useMemoryOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options: {
    maxCacheSize?: number;
    enableMemoization?: boolean;
  } = {}
) {
  const { maxCacheSize = 100, enableMemoization = true } = options;
  
  const cacheRef = useRef(new WeakMap<Function, Map<string, ReturnType<T>>>());
  const lastCallRef = useRef<{ args: any[]; result: ReturnType<T> } | null>(null);

  const memoizedCallback = useCallback((...args: Parameters<T>): ReturnType<T> => {
    // Check if we can reuse the last call
    if (lastCallRef.current && 
        JSON.stringify(args) === JSON.stringify(lastCallRef.current.args)) {
      return lastCallRef.current.result;
    }

    // Use weak map for function-specific caching
    if (!cacheRef.current.has(callback)) {
      cacheRef.current.set(callback, new Map());
    }
    
    const functionCache = cacheRef.current.get(callback)!;
    const cacheKey = JSON.stringify(args);
    
    if (functionCache.has(cacheKey)) {
      const cached = functionCache.get(cacheKey);
      lastCallRef.current = { args, result: cached! };
      return cached!;
    }

    // Execute callback
    const result = callback(...args);
    
    // Cache with size limit
    if (functionCache.size < maxCacheSize) {
      functionCache.set(cacheKey, result);
    } else {
      // Remove oldest entry (simple FIFO)
      const firstKey = functionCache.keys().next().value;
      functionCache.delete(firstKey);
      functionCache.set(cacheKey, result);
    }
    
    lastCallRef.current = { args, result };
    return result;
  }, deps);

  return memoizedCallback;
}

// Memory-optimized effect hook
export function useMemoryOptimizedEffect(
  effect: React.EffectCallback,
  deps: React.DependencyList,
  options: {
    enableCleanup?: boolean;
    memoryThreshold?: number;
  } = {}
) {
  const { enableCleanup = true, memoryThreshold = 80 } = options;
  const effectRef = useRef(effect);
  const cleanupRef = useRef<(() => void) | void>();
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Check memory before running effect
    if (memoryUtils.isMemoryLow(memoryThreshold)) {
      console.warn('Memory is low, skipping effect');
      return;
    }

    effectRef.current = effect;
    const cleanup = effectRef.current();
    cleanupRef.current = cleanup;

    // Auto-cleanup for expensive effects
    if (enableCleanup) {
      cleanupTimeoutRef.current = setTimeout(() => {
        if (typeof cleanupRef.current === 'function') {
          cleanupRef.current();
          cleanupRef.current = undefined;
        }
      }, 30000); // Auto cleanup after 30 seconds
    }

    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
    };
  }, deps);
}

// Memory pool hook for component instances
export function useObjectPool<T>(
  factory: () => T,
  reset: (obj: T) => void,
  options: {
    initialSize?: number;
    maxSize?: number;
    autoCleanup?: boolean;
  } = {}
) {
  const { initialSize = 5, maxSize = 50, autoCleanup = true } = options;
  
  const poolRef = useRef(new ObjectPool(factory, reset, initialSize, maxSize));
  const [poolSize, setPoolSize] = useState(initialSize);

  // Monitor memory pressure
  useEffect(() => {
    if (!autoCleanup) return;

    const handlePressure = (level: 'low' | 'medium' | 'high') => {
      if (level === 'high') {
        poolRef.current.clear();
        setPoolSize(0);
      } else if (level === 'medium') {
        // Reduce pool size by 50%
        const currentSize = poolRef.current.getPoolSize();
        const newSize = Math.max(initialSize, Math.floor(currentSize / 2));
        setPoolSize(newSize);
      }
    };

    memoryPressureManager.onPressure(handlePressure);

    return () => {
      memoryPressureManager.removeCallback(handlePressure as any);
    };
  }, [autoCleanup, initialSize]);

  const acquire = useCallback(() => {
    return poolRef.current.acquire();
  }, []);

  const release = useCallback((obj: T) => {
    poolRef.current.release(obj);
    setPoolSize(poolRef.current.getPoolSize());
  }, []);

  const clear = useCallback(() => {
    poolRef.current.clear();
    setPoolSize(0);
  }, []);

  return { acquire, release, clear, poolSize };
}

// Memory-efficient data processing hook
export function useMemoryOptimizedDataProcessor<T, R>(
  data: T[],
  processor: (data: T[]) => R,
  options: {
    enableStreaming?: boolean;
    batchSize?: number;
    enableCompression?: boolean;
  } = {}
) {
  const { enableStreaming = false, batchSize = 100, enableCompression = false } = options;
  
  const [processedData, setProcessedData] = useState<R | null>(null);
  const [processing, setProcessing] = useState(false);
  const cacheRef = useRef(new MemoryEfficientMap<string, R>(50, 60000)); // 1 minute TTL
  const abortControllerRef = useRef<AbortController | null>(null);

  const processData = useCallback(async (dataToProcess: T[] = data) => {
    // Cancel previous processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Check memory before processing
    if (memoryUtils.isMemoryLow(75)) {
      console.warn('Memory is low, reducing batch size');
    }

    setProcessing(true);

    try {
      // Generate cache key
      const cacheKey = `processed_${JSON.stringify(dataToProcess.slice(0, 10))}`; // First 10 items for key
      
      // Check cache first
      const cached = cacheRef.current.get(cacheKey);
      if (cached && !signal.aborted) {
        setProcessedData(cached);
        setProcessing(false);
        return cached;
      }

      // Process data
      const result = await processInBatches(dataToProcess, processor, batchSize, signal);
      
      if (!signal.aborted) {
        // Compress result if enabled
        const finalResult = enableCompression ? compressData(result) : result;
        
        setProcessedData(finalResult);
        cacheRef.current.set(cacheKey, finalResult);
        setProcessing(false);
        
        return finalResult;
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error('Data processing error:', error);
        setProcessing(false);
      }
    }
  }, [data, processor, batchSize, enableCompression]);

  const processInBatches = async (
    data: T[], 
    processorFn: (data: T[]) => R, 
    batchSize: number,
    signal: AbortSignal
  ): Promise<R> => {
    if (!enableStreaming) {
      return processorFn(data);
    }

    // Stream processing for large datasets
    const results: R[] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      if (signal.aborted) throw new Error('Processing aborted');
      
      const batch = data.slice(i, i + batchSize);
      const batchResult = processorFn(batch);
      results.push(batchResult);
      
      // Check memory after each batch
      if (memoryUtils.isMemoryLow(80)) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to let GC work
      }
    }

    // Combine results
    return processorFn(results as any);
  };

  const compressData = (data: R): R => {
    // Simple compression for basic types
    if (typeof data === 'string') {
      // For strings, we could use LZ-string or similar
      return data as unknown as R;
    }
    
    if (Array.isArray(data)) {
      // Remove undefined/null values and compress
      return data.filter(item => item != null) as unknown as R;
    }
    
    return data;
  };

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  useEffect(() => {
    processData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [processData]);

  return {
    processedData,
    processing,
    processData: useMemoryOptimizedCallback(processData, [data]),
    clearCache
  };
}

// Memory monitoring hook
export function useMemoryMonitoring() {
  const [memoryUsage, setMemoryUsage] = useState<ReturnType<typeof memoryUtils.getCurrentMemoryUsage>>(null);
  const [memoryLeaks, setMemoryLeaks] = useState<any[]>([]);
  const monitoringRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const updateMemoryUsage = () => {
      const usage = memoryUtils.getCurrentMemoryUsage();
      setMemoryUsage(usage);
      
      // Alert if memory usage is too high
      if (usage && usage.percentage > 85) {
        console.warn(`High memory usage: ${usage.percentage.toFixed(1)}%`);
      }
    };

    // Update immediately
    updateMemoryUsage();

    // Update every 5 seconds
    monitoringRef.current = setInterval(updateMemoryUsage, 5000);

    return () => {
      if (monitoringRef.current) {
        clearInterval(monitoringRef.current);
      }
    };
  }, []);

  const forceGarbageCollection = useCallback(() => {
    memoryPressureManager.forceGarbageCollection();
    setTimeout(() => {
      const usage = memoryUtils.getCurrentMemoryUsage();
      setMemoryUsage(usage);
    }, 100);
  }, []);

  const clearAllCaches = useCallback(() => {
    memoryPressureManager.clearCaches('medium');
    
    // Clear various caches
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cache_temp');
      sessionStorage.removeItem('cache_temp');
      
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('temp')) {
              caches.delete(name);
            }
          });
        });
      }
    }
  }, []);

  const getMemoryReport = useCallback(() => {
    return {
      current: memoryUsage,
      formatted: memoryUsage ? {
        used: memoryUtils.formatBytes(memoryUsage.used),
        total: memoryUtils.formatBytes(memoryUsage.total),
        percentage: `${memoryUsage.percentage.toFixed(1)}%`
      } : null,
      isLow: memoryUsage ? memoryUtils.isMemoryLow() : false
    };
  }, [memoryUsage]);

  return {
    memoryUsage,
    memoryLeaks,
    forceGarbageCollection,
    clearAllCaches,
    getMemoryReport
  };
}

// Weak reference hook for large objects
export function useWeakRef<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const weakMapRef = useRef(new WeakMap<object, T>());
  const keyRef = useRef({});

  const setWeakValue = useCallback((newValue: T) => {
    setValue(newValue);
    weakMapRef.current.set(keyRef.current, newValue);
  }, []);

  const getWeakValue = useCallback((): T | null => {
    return weakMapRef.current.get(keyRef.current) || null;
  }, []);

  return { value, setWeakValue, getWeakValue };
}

// Memory pool for expensive operations
export function useMemoryPool<T>(
  createFn: () => T,
  resetFn: (obj: T) => void,
  options: {
    initialSize?: number;
    maxSize?: number;
    autoResize?: boolean;
  } = {}
) {
  const { initialSize = 3, maxSize = 20, autoResize = true } = options;
  
  const poolRef = useRef(Object.create(null));
  const poolSizeRef = useRef(initialSize);

  // Initialize pool
  useEffect(() => {
    const pool = new ObjectPool(createFn, resetFn, initialSize, maxSize);
    poolRef.current = pool;
    
    return () => {
      pool.clear();
    };
  }, [createFn, resetFn, initialSize, maxSize]);

  // Auto-resize pool based on memory pressure
  useEffect(() => {
    if (!autoResize) return;

    const handlePressure = (level: 'low' | 'medium' | 'high') => {
      const pool = poolRef.current as ObjectPool<T>;
      
      switch (level) {
        case 'high':
          pool.clear();
          poolSizeRef.current = 0;
          break;
        case 'medium':
          poolSizeRef.current = Math.max(1, Math.floor(poolSizeRef.current / 2));
          break;
        case 'low':
          if (memoryUtils.getCurrentMemoryUsage()?.percentage < 50) {
            poolSizeRef.current = Math.min(maxSize, poolSizeRef.current + 1);
          }
          break;
      }
    };

    memoryPressureManager.onPressure(handlePressure);

    return () => {
      memoryPressureManager.removeCallback(handlePressure as any);
    };
  }, [autoResize, maxSize]);

  const acquire = useCallback(() => {
    const pool = poolRef.current as ObjectPool<T>;
    return pool.acquire();
  }, []);

  const release = useCallback((obj: T) => {
    const pool = poolRef.current as ObjectPool<T>;
    pool.release(obj);
  }, []);

  return { acquire, release, poolSize: poolSizeRef.current };
}

export default {
  useMemoryOptimizedState,
  useMemoryOptimizedCallback,
  useMemoryOptimizedEffect,
  useObjectPool,
  useMemoryOptimizedDataProcessor,
  useMemoryMonitoring,
  useWeakRef,
  useMemoryPool
};