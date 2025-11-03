/**
 * Performance Optimization Hooks
 * Hooks تحسين الأداء
 */

import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { useGlobalLoading } from '../store/loadingStore';
import { useLoading } from './LoadingProvider';

// Memoization hook with automatic cleanup
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T {
  const callbackRef = useRef(callback);
  const dependenciesRef = useRef(dependencies);
  
  // Update callback and dependencies
  useEffect(() => {
    callbackRef.current = callback;
    dependenciesRef.current = dependencies;
  });
  
  // Create optimized callback
  const optimizedCallback = useCallback(((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }) as T, dependenciesRef.current);
  
  return optimizedCallback;
}

// Lazy loading hook with intersection observer
export function useLazyLoading<T>(
  items: T[],
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
    preloadDistance?: number;
  } = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    enabled = true,
    preloadDistance = 2
  } = options;
  
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [loadedItems, setLoadedItems] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver>();
  const loadQueueRef = useRef<Set<number>>(new Set());

  const initializeObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            if (!loadedItems.has(index)) {
              loadQueueRef.current.add(index);
              setIsLoading(true);
              
              // Debounced loading
              setTimeout(() => {
                const indicesToLoad = Array.from(loadQueueRef.current);
                loadQueueRef.current.clear();
                
                const newLoadedItems = new Set(loadedItems);
                indicesToLoad.forEach(idx => newLoadedItems.add(idx));
                
                setLoadedItems(newLoadedItems);
                setVisibleItems(prev => {
                  const newItems = [...prev];
                  indicesToLoad.forEach(idx => {
                    if (!newItems[idx] && items[idx]) {
                      newItems[idx] = items[idx];
                    }
                  });
                  return newItems.filter(Boolean);
                });
                setIsLoading(false);
              }, 100);
            }
            
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );
  }, [threshold, rootMargin, loadedItems, items]);

  // Preload items around visible area
  const preloadItems = useCallback((centerIndex: number) => {
    const start = Math.max(0, centerIndex - preloadDistance);
    const end = Math.min(items.length - 1, centerIndex + preloadDistance);
    
    const indicesToPreload = [];
    for (let i = start; i <= end; i++) {
      if (!loadedItems.has(i)) {
        indicesToPreload.push(i);
      }
    }
    
    if (indicesToPreload.length > 0) {
      const newLoadedItems = new Set(loadedItems);
      indicesToPreload.forEach(idx => newLoadedItems.add(idx));
      setLoadedItems(newLoadedItems);
    }
  }, [items.length, loadedItems, preloadDistance]);

  // Cleanup observer
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Initialize observer when items change
  useEffect(() => {
    if (enabled && items.length > 0) {
      initializeObserver();
    }
  }, [items.length, enabled, initializeObserver]);

  return {
    visibleItems,
    loadedItems: Array.from(loadedItems),
    isLoading,
    observer: observerRef.current,
    preloadItems,
    hasItem: (index: number) => loadedItems.has(index),
    loadItem: (index: number) => {
      if (!loadedItems.has(index)) {
        const newLoadedItems = new Set(loadedItems);
        newLoadedItems.add(index);
        setLoadedItems(newLoadedItems);
        
        if (!visibleItems[index] && items[index]) {
          setVisibleItems(prev => {
            const newItems = [...prev];
            newItems[index] = items[index];
            return newItems.filter(Boolean);
          });
        }
      }
    },
    unloadItem: (index: number) => {
      const newLoadedItems = new Set(loadedItems);
      newLoadedItems.delete(index);
      setLoadedItems(newLoadedItems);
      setVisibleItems(prev => {
        const newItems = [...prev];
        newItems[index] = undefined as any;
        return newItems.filter(Boolean);
      });
    },
    reset: () => {
      setVisibleItems([]);
      setLoadedItems(new Set());
      setIsLoading(false);
      loadQueueRef.current.clear();
    }
  };
}

// Virtual scrolling hook
export function useVirtualScrolling<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const getItemHeight = useCallback((index: number) => {
    return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
  }, [itemHeight]);

  const calculateRange = useCallback(() => {
    let startIndex = 0;
    let endIndex = Math.min(items.length - 1, Math.ceil(containerHeight / getItemHeight(0)));
    
    // Find actual start index based on scroll position
    let currentHeight = 0;
    for (let i = 0; i < items.length; i++) {
      if (currentHeight >= scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      currentHeight += getItemHeight(i);
    }
    
    // Find end index
    currentHeight = 0;
    for (let i = startIndex; i < items.length; i++) {
      currentHeight += getItemHeight(i);
      if (currentHeight >= containerHeight + (overscan * getItemHeight(i))) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }
    
    return { startIndex, endIndex };
  }, [items.length, scrollTop, containerHeight, getItemHeight, overscan]);

  const { startIndex, endIndex } = useMemo(() => calculateRange(), [calculateRange]);
  const visibleItems = useMemo(() => items.slice(startIndex, endIndex + 1), [items, startIndex, endIndex]);

  // Calculate total height and offset
  const totalHeight = useMemo(() => {
    return items.reduce((sum, _, index) => sum + getItemHeight(index), 0);
  }, [items, getItemHeight]);

  const offsetY = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < startIndex; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  }, [startIndex, getItemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    containerRef,
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    handleScroll,
    // Utilities
    scrollToIndex: (index: number) => {
      if (containerRef.current) {
        let targetY = 0;
        for (let i = 0; i < index; i++) {
          targetY += getItemHeight(i);
        }
        containerRef.current.scrollTop = targetY;
      }
    },
    scrollToItem: (item: T) => {
      const index = items.indexOf(item);
      if (index !== -1) {
        const targetY = items.slice(0, index).reduce((sum, _, i) => sum + getItemHeight(i), 0);
        if (containerRef.current) {
          containerRef.current.scrollTop = targetY;
        }
      }
    }
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    mountTime: 0,
    updateCount: 0,
    memoryUsage: 0
  });

  const mountTimeRef = useRef<number>();
  const lastRenderTimeRef = useRef<number>();

  useLayoutEffect(() => {
    if (!mountTimeRef.current) {
      mountTimeRef.current = performance.now();
      setMetrics(prev => ({ ...prev, mountTime: mountTimeRef.current! }));
    }

    lastRenderTimeRef.current = performance.now();
  });

  useEffect(() => {
    if (lastRenderTimeRef.current) {
      const renderTime = performance.now() - lastRenderTimeRef.current;
      setMetrics(prev => ({
        ...prev,
        renderTime,
        updateCount: prev.updateCount + 1
      }));
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memoryInfo.usedJSHeapSize / 1024 / 1024 // MB
      }));
    }
  });

  useEffect(() => {
    // Log metrics for performance debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Performance:`, metrics);
    }
  }, [componentName, metrics]);

  return metrics;
}

// Debounced value hook
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledRef = useRef(false);

  return useOptimizedCallback(((...args: Parameters<T>) => {
    if (!throttledRef.current) {
      throttledRef.current = true;
      callback(...args);
      setTimeout(() => {
        throttledRef.current = false;
      }, delay);
    }
  }) as T, [callback, delay]);
}

// Resource loading hook
export function useResourceLoader<T>(
  resources: Array<{
    id: string;
    url: string;
    type: 'image' | 'script' | 'style' | 'font';
    priority?: 'high' | 'normal' | 'low';
  }>,
  options: {
    preload?: boolean;
    lazy?: boolean;
    concurrent?: number;
  } = {}
) {
  const {
    preload = false,
    lazy = true,
    concurrent = 3
  } = options;

  const [loadedResources, setLoadedResources] = useState<Set<string>>(new Set());
  const [loadingResources, setLoadingResources] = useState<Set<string>>(new Set());
  const [failedResources, setFailedResources] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const loadResource = useCallback(async (resource: typeof resources[0]): Promise<void> => {
    const { id, url, type } = resource;
    
    if (loadedResources.has(id) || loadingResources.has(id)) {
      return;
    }

    setLoadingResources(prev => new Set(prev).add(id));

    try {
      switch (type) {
        case 'image':
          await loadImage(url);
          break;
        case 'script':
          await loadScript(url);
          break;
        case 'style':
          await loadStyle(url);
          break;
        case 'font':
          await loadFont(url);
          break;
      }

      setLoadedResources(prev => new Set(prev).add(id));
    } catch (error) {
      console.error(`Failed to load resource ${id}:`, error);
      setFailedResources(prev => new Set(prev).add(id));
      throw error;
    } finally {
      setLoadingResources(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [loadedResources, loadingResources]);

  const loadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  };

  const loadScript = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const loadStyle = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    });
  };

  const loadFont = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const fontFace = new FontFace('CustomFont', `url(${url})`);
      fontFace.load().then(() => {
        document.fonts.add(fontFace);
        resolve();
      }).catch(reject);
    });
  };

  const loadAllResources = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    const queue = [...resources];
    const promises: Promise<void>[] = [];

    while (queue.length > 0) {
      const batch = queue.splice(0, concurrent);
      const batchPromises = batch.map(resource => loadResource(resource));
      promises.push(...batchPromises);

      try {
        await Promise.allSettled(batchPromises);
      } catch (error) {
        console.error('Batch loading failed:', error);
      }
    }

    setIsLoading(false);
  }, [resources, isLoading, loadResource, concurrent]);

  const preloadResource = useCallback((resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (resource && !loadedResources.has(resourceId)) {
      loadResource(resource);
    }
  }, [resources, loadedResources, loadResource]);

  // Auto load resources
  useEffect(() => {
    if (preload) {
      loadAllResources();
    } else if (lazy) {
      // Use intersection observer to load resources when needed
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const resourceId = entry.target.getAttribute('data-resource-id');
              if (resourceId) {
                preloadResource(resourceId);
              }
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '50px' }
      );

      resources.forEach(resource => {
        const element = document.querySelector(`[data-resource-id="${resource.id}"]`);
        if (element) {
          observer.observe(element);
        }
      });

      return () => observer.disconnect();
    }
  }, [preload, lazy, loadAllResources, preloadResource, resources]);

  return {
    loadedResources: Array.from(loadedResources),
    loadingResources: Array.from(loadingResources),
    failedResources: Array.from(failedResources),
    isLoading,
    loadResource,
    preloadResource,
    loadAllResources,
    isResourceLoaded: (id: string) => loadedResources.has(id),
    isResourceLoading: (id: string) => loadingResources.has(id),
    isResourceFailed: (id: string) => failedResources.has(id)
  };
}

// Background task management hook
export function useBackgroundTasks() {
  const [tasks, setTasks] = useState<Map<string, {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    result?: any;
    error?: string;
    startedAt: number;
    completedAt?: number;
  }>>(new Map());

  const { setGlobalLoading } = useLoading();

  const startTask = useCallback((
    name: string,
    task: () => Promise<any>,
    options?: {
      priority?: 'high' | 'normal' | 'low';
      timeout?: number;
      retries?: number;
    }
  ) => {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const taskConfig = {
      id,
      name,
      status: 'pending' as const,
      progress: 0,
      startedAt: Date.now(),
      ...options
    };

    setTasks(prev => new Map(prev).set(id, taskConfig));

    // Run task in background
    (async () => {
      setTasks(prev => {
        const newTasks = new Map(prev);
        const task = newTasks.get(id);
        if (task) {
          newTasks.set(id, { ...task, status: 'running' });
        }
        return newTasks;
      });

      try {
        // Set up timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Task timeout')), options?.timeout || 30000);
        });

        // Update progress periodically
        const progressInterval = setInterval(() => {
          setTasks(prev => {
            const newTasks = new Map(prev);
            const task = newTasks.get(id);
            if (task && task.status === 'running') {
              const newProgress = Math.min(95, task.progress + Math.random() * 10);
              newTasks.set(id, { ...task, progress: newProgress });
            }
            return newTasks;
          });
        }, 1000);

        const result = await Promise.race([task(), timeoutPromise]);
        
        clearInterval(progressInterval);
        
        setTasks(prev => {
          const newTasks = new Map(prev);
          const task = newTasks.get(id);
          if (task) {
            newTasks.set(id, {
              ...task,
              status: 'completed',
              progress: 100,
              result,
              completedAt: Date.now()
            });
          }
          return newTasks;
        });

      } catch (error) {
        setTasks(prev => {
          const newTasks = new Map(prev);
          const task = newTasks.get(id);
          if (task) {
            newTasks.set(id, {
              ...task,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              completedAt: Date.now()
            });
          }
          return newTasks;
        });
      }
    })();

    return id;
  }, []);

  const cancelTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const newTasks = new Map(prev);
      const task = newTasks.get(taskId);
      if (task && task.status === 'running') {
        newTasks.set(taskId, {
          ...task,
          status: 'cancelled',
          completedAt: Date.now()
        });
      }
      return newTasks;
    });
  }, []);

  const clearTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const newTasks = new Map(prev);
      newTasks.delete(taskId);
      return newTasks;
    });
  }, []);

  const clearCompletedTasks = useCallback(() => {
    setTasks(prev => {
      const newTasks = new Map();
      prev.forEach((task, id) => {
        if (['pending', 'running'].includes(task.status)) {
          newTasks.set(id, task);
        }
      });
      return newTasks;
    });
  }, []);

  const getTask = useCallback((taskId: string) => {
    return tasks.get(taskId);
  }, [tasks]);

  const getTasksByStatus = useCallback((status: typeof tasks extends Map<any, infer T> ? T['status'] : never) => {
    return Array.from(tasks.values()).filter(task => task.status === status);
  }, [tasks]);

  const hasRunningTasks = useCallback(() => {
    return Array.from(tasks.values()).some(task => task.status === 'running');
  }, [tasks]);

  return {
    tasks: Array.from(tasks.values()),
    startTask,
    cancelTask,
    clearTask,
    clearCompletedTasks,
    getTask,
    getTasksByStatus,
    hasRunningTasks,
    hasRunning: hasRunningTasks(),
    // Computed
    pendingTasks: getTasksByStatus('pending'),
    runningTasks: getTasksByStatus('running'),
    completedTasks: getTasksByStatus('completed'),
    failedTasks: getTasksByStatus('failed'),
    cancelledTasks: getTasksByStatus('cancelled')
  };
}

export default {
  useOptimizedCallback,
  useLazyLoading,
  useVirtualScrolling,
  usePerformanceMonitor,
  useDebouncedValue,
  useThrottledCallback,
  useResourceLoader,
  useBackgroundTasks
};