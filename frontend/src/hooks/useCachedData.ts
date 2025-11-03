/**
 * Advanced cached data hooks for optimal performance
 * Hooks البيانات المحفوظة المتقدمة للأداء الأمثل
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  CacheManager, 
  CacheType, 
  CachePolicy, 
  CacheEntry 
} from '../lib/cache';

// Enhanced cache hook with multiple storage strategies
export function useCachedData<T>(
  fetcher: () => Promise<T>,
  options: {
    key: string;
    cacheType?: CacheType;
    cachePolicy?: Partial<CachePolicy>;
    enableFallback?: boolean;
    dependencies?: any[];
    staleTime?: number;
    cacheTime?: number;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
  }
) {
  const {
    key,
    cacheType = 'memory',
    cachePolicy,
    enableFallback = true,
    dependencies = [],
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnMount = false,
    refetchOnWindowFocus = false
  } = options;

  // State management
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Cache management
  const cacheManagerRef = useRef(new CacheManager({ primaryType: cacheType }));
  const cacheRef = useRef(cacheManagerRef.current.caches.get(cacheType) as any);
  const lastFetchTimeRef = useRef<number>(0);
  const dataTimestampRef = useRef<number>(0);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Update cache reference when cacheType changes
  useEffect(() => {
    const cache = cacheManagerRef.current.caches.get(cacheType) as any;
    if (cache) {
      cacheRef.current = cache;
    }
  }, [cacheType]);

  // Check if data is stale
  const checkStale = useCallback(() => {
    if (dataTimestampRef.current === 0) return false;
    const timeSinceFetch = Date.now() - dataTimestampRef.current;
    return timeSinceFetch > staleTime;
  }, [staleTime]);

  // Fetch data with caching
  const fetchData = useCallback(async (
    forceRefresh = false,
    skipCache = false
  ) => {
    // Check if we should skip cache
    if (!skipCache && !forceRefresh && data !== null) {
      const isDataStale = checkStale();
      
      if (!isDataStale) {
        return data; // Return cached data if still fresh
      }
      
      setIsStale(true);
    }

    setLoading(true);
    setError(null);
    
    try {
      lastFetchTimeRef.current = Date.now();
      
      // Try to get from cache first (unless skipping cache)
      let cachedData: T | null = null;
      
      if (!skipCache) {
        cachedData = await cacheRef.current.get(key);
        
        if (cachedData !== null) {
          const isCachedDataStale = Date.now() - dataTimestampRef.current > staleTime;
          
          if (!forceRefresh && !isCachedDataStale) {
            setData(cachedData);
            setLoading(false);
            setIsStale(false);
            return cachedData;
          }
          
          if (forceRefresh || isCachedDataStale) {
            // Data is stale but we have it cached, so use it while refreshing
            setData(cachedData);
          }
        }
      }

      // Fetch fresh data
      const freshData = await fetcher();
      
      // Cache the fresh data
      if (freshData !== null && !skipCache) {
        await cacheRef.current.set(key, freshData, {
          ...cachePolicy,
          ttl: cacheTime
        });
      }

      setData(freshData);
      setIsStale(false);
      dataTimestampRef.current = Date.now();
      retryCountRef.current = 0;
      
      return freshData;
    } catch (err) {
      const error = err as Error;
      
      // Implement retry logic with exponential backoff
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        
        setTimeout(() => {
          fetchData(forceRefresh, skipCache);
        }, delay);
        
        return data; // Return cached data on retry
      }
      
      setError(error);
      console.error('Data fetch error:', error);
      
      // Return cached data as fallback if available
      if (data !== null) {
        return data;
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetcher, key, cachePolicy, staleTime, cacheTime, data, checkStale]);

  // Refetch function
  const refetch = useCallback(async () => {
    return fetchData(true);
  }, [fetchData]);

  // Invalidate cache
  const invalidate = useCallback(async () => {
    await cacheRef.current.delete(key);
    setData(null);
    setIsStale(false);
    dataTimestampRef.current = 0;
    retryCountRef.current = 0;
  }, [key]);

  // Clear all cache
  const clearCache = useCallback(async () => {
    await cacheRef.current.clear();
    setData(null);
    setIsStale(false);
    dataTimestampRef.current = 0;
    retryCountRef.current = 0;
  }, []);

  // Update data in cache
  const updateData = useCallback(async (newData: T) => {
    setData(newData);
    dataTimestampRef.current = Date.now();
    await cacheRef.current.set(key, newData, cachePolicy);
  }, [key, cachePolicy]);

  // Check if data is available in cache
  const isAvailable = useCallback(async () => {
    return await cacheRef.current.has(key);
  }, [key]);

  // Prefetch data
  const prefetch = useCallback(async () => {
    if (!loading && !data) {
      await fetchData(false, true); // Skip cache but don't force refresh
    }
  }, [fetchData, loading, data]);

  // Get cache statistics
  const getCacheStats = useCallback(async () => {
    return await cacheRef.current.statistics();
  }, []);

  // Effects for different refetching strategies
  useEffect(() => {
    // Initial fetch on mount
    if (refetchOnMount && data === null && !loading) {
      fetchData();
    }
  }, [refetchOnMount, data, loading, fetchData]);

  useEffect(() => {
    // Refetch when dependencies change
    if (dependencies.length > 0 && !loading) {
      fetchData(true);
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Refetch on window focus
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (data !== null && checkStale()) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, data, checkStale, fetchData]);

  // Periodic refetch for stale data
  useEffect(() => {
    if (!refetchOnWindowFocus && data !== null) {
      const interval = setInterval(() => {
        if (checkStale() && !loading) {
          fetchData();
        }
      }, Math.min(staleTime, 60000)); // Check at least every minute

      return () => clearInterval(interval);
    }
  }, [refetchOnWindowFocus, data, loading, checkStale, fetchData, staleTime]);

  return {
    data,
    loading,
    error,
    isStale,
    refetch,
    invalidate,
    clearCache,
    updateData,
    isAvailable,
    prefetch,
    getCacheStats
  };
}

// Background data sync hook
export function useBackgroundSync<T>(
  fetcher: () => Promise<T>,
  options: {
    key: string;
    interval: number;
    enabled?: boolean;
    onUpdate?: (data: T) => void;
  }
) {
  const { key, interval, enabled = true, onUpdate } = options;
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const syncData = useCallback(async () => {
    if (!enabled || isSyncing) return;

    setIsSyncing(true);
    
    try {
      const data = await fetcher();
      setLastSync(new Date());
      onUpdate?.(data);
    } catch (error) {
      console.error('Background sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [fetcher, enabled, isSyncing, onUpdate]);

  useEffect(() => {
    if (!enabled) return;

    // Initial sync
    syncData();

    // Set up interval
    intervalRef.current = setInterval(syncData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [syncData, interval, enabled]);

  return {
    lastSync,
    isSyncing,
    syncData,
    forceSync: syncData
  };
}

// Optimistic updates hook
export function useOptimisticUpdates<T>(
  fetcher: () => Promise<T>,
  updater: (data: T, updates: Partial<T>) => T,
  options: {
    key: string;
    rollbackTime?: number;
  }
) {
  const { key, rollbackTime = 10000 } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cacheManagerRef = useRef(new CacheManager());

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedData = await fetcher();
        setData(fetchedData);
        setOptimisticData(fetchedData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetcher]);

  // Optimistic update
  const updateOptimistically = useCallback(async (updates: Partial<T>) => {
    if (!data) return;

    // Apply optimistic update
    const newOptimisticData = updater(optimisticData!, updates);
    setOptimisticData(newOptimisticData);

    try {
      // In a real app, you'd make the actual API call here
      // For now, we'll just update the cache
      const cache = cacheManagerRef.current.caches.get('memory')!;
      await cache.set(key, newOptimisticData);
      
      // Update the base data
      setData(newOptimisticData);
    } catch (err) {
      // Rollback on error
      setTimeout(() => {
        setOptimisticData(data);
      }, rollbackTime);
      
      setError(err as Error);
    }
  }, [data, optimisticData, updater, key, rollbackTime]);

  // Rollback function
  const rollback = useCallback(() => {
    setOptimisticData(data);
  }, [data]);

  return {
    data: optimisticData,
    originalData: data,
    loading,
    error,
    updateOptimistically,
    rollback
  };
}

// Cache pagination hook
export function useCachedPagination<T>(
  fetcher: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  options: {
    key: string;
    pageSize: number;
    enableInfiniteScroll?: boolean;
    prefetchDistance?: number;
  }
) {
  const { key, pageSize, enableInfiniteScroll = false, prefetchDistance = 2 } = options;
  
  const [pages, setPages] = useState<Map<number, T[]>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cacheManagerRef = useRef(new CacheManager());

  // Get current page data
  const currentPageData = pages.get(currentPage) || [];

  // Get all loaded data
  const allData = useMemo(() => {
    return Array.from(pages.values()).flat();
  }, [pages]);

  // Fetch page data
  const fetchPage = useCallback(async (page: number, useCache = true) => {
    const cacheKey = `${key}_page_${page}`;
    const cache = cacheManagerRef.current.caches.get('memory')!;

    if (useCache) {
      const cachedPageData = await cache.get(cacheKey);
      if (cachedPageData) {
        setPages(prev => new Map(prev).set(page, cachedPageData as T[]));
        return cachedPageData;
      }
    }

    setLoading(true);
    try {
      const result = await fetcher(page, pageSize);
      setPages(prev => new Map(prev).set(page, result.data));
      setTotalItems(result.total);
      
      // Cache the result
      await cache.set(cacheKey, result.data);
      
      return result.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetcher, pageSize, key]);

  // Load more data (for infinite scroll)
  const loadMore = useCallback(() => {
    const nextPage = currentPage + 1;
    fetchPage(nextPage);
    setCurrentPage(nextPage);
  }, [currentPage, fetchPage]);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (!pages.has(page)) {
      fetchPage(page);
    }
    setCurrentPage(page);
  }, [pages, fetchPage]);

  // Prefetch next pages
  const prefetchPages = useCallback(async (currentPageNum: number) => {
    const startPage = currentPageNum + 1;
    const endPage = currentPageNum + prefetchDistance;
    
    for (let page = startPage; page <= endPage; page++) {
      if (!pages.has(page)) {
        fetchPage(page);
      }
    }
  }, [pages, prefetchDistance, fetchPage]);

  // Effect to prefetch pages when scrolling near end
  useEffect(() => {
    if (!enableInfiniteScroll) return;

    const scrollHandler = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (scrollTop + windowHeight > documentHeight - 1000) {
        prefetchPages(currentPage);
      }
    };

    window.addEventListener('scroll', scrollHandler);
    return () => window.removeEventListener('scroll', scrollHandler);
  }, [enableInfiniteScroll, currentPage, prefetchPages]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNext = currentPage < totalPages;
    const hasPrevious = currentPage > 1;
    
    return {
      totalPages,
      hasNext,
      hasPrevious,
      totalItems,
      currentPage,
      loadedPages: pages.size
    };
  }, [totalItems, pageSize, currentPage, pages.size]);

  return {
    data: currentPageData,
    allData,
    loading,
    error,
    currentPage,
    totalItems,
    paginationInfo,
    loadMore,
    goToPage,
    refetchPage: fetchPage,
    hasPage: (page: number) => pages.has(page)
  };
}

export default {
  useCachedData,
  useBackgroundSync,
  useOptimisticUpdates,
  useCachedPagination
};