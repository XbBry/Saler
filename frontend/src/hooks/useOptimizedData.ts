/**
 * Optimized data hook for efficient data management
 * Hook محسن لإدارة البيانات بكفاءة
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  OptimizedDataLoader, 
  DataPaginator, 
  DataProcessor, 
  DataWorker,
  LoadingStrategy,
  defaultOptimizerConfig 
} from '../lib/optimization';
import { debounce, measurePerformance } from '../lib/performance';

// Optimized data hook with caching, pagination, and filtering
export function useOptimizedData<T>(
  dataLoader: () => Promise<T>,
  options: {
    cacheKey?: string;
    initialPageSize?: number;
    enablePagination?: boolean;
    enableFiltering?: boolean;
    enableSorting?: boolean;
    loadingStrategy?: LoadingStrategy;
    autoRefresh?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const {
    cacheKey = 'default',
    initialPageSize = 20,
    enablePagination = true,
    enableFiltering = false,
    enableSorting = false,
    loadingStrategy = LoadingStrategy.LAZY,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options;

  // State management
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Optimized data processors
  const dataLoaderRef = useRef(new OptimizedDataLoader(defaultOptimizerConfig));
  const paginatorRef = useRef(new DataPaginator<T>(initialPageSize));
  const processorRef = useRef(new DataProcessor<T>());
  const workerRef = useRef(new DataWorker());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filtering and sorting state
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Performance monitoring
  const loadStartTime = useRef<number>(0);

  // Memoized processed data
  const processedData = useMemo(() => {
    if (!data) return null;

    let result = data;

    // Apply filtering
    if (enableFiltering && Object.keys(filters).length > 0) {
      processorRef.current.setData(Array.isArray(result) ? result : [result]);
      Object.entries(filters).forEach(([field, value]) => {
        result = processorRef.current.filter(
          (item: any) => item[field]?.toString().includes(value.toString())
        ) as any;
      });
      result = processorRef.current.getData();
    }

    // Apply sorting
    if (enableSorting && sortConfig) {
      if (!Array.isArray(result)) result = [result];
      result = [...result].sort((a: any, b: any) => {
        const aVal = a[sortConfig.field];
        const bVal = b[sortConfig.field];
        
        if (sortConfig.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      }) as any;
    }

    // Apply pagination
    if (enablePagination && Array.isArray(result)) {
      paginatorRef.current.setData(result);
      result = paginatorRef.current.getPage(currentPage) as any;
    }

    return result;
  }, [data, filters, sortConfig, currentPage, enableFiltering, enableSorting, enablePagination]);

  // Data loading function
  const loadData = useCallback(async (forceRefresh = false) => {
    if (loading) return; // Prevent multiple simultaneous loads

    setLoading(true);
    setError(null);
    loadStartTime.current = performance.now();

    try {
      const result = await measurePerformance(
        `dataLoad-${cacheKey}`,
        () => dataLoaderRef.current.load(cacheKey, dataLoader, forceRefresh)
      );

      setData(result);
      setLastUpdated(new Date());

      // Reset pagination when new data loads
      if (enablePagination) {
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Data loading error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, dataLoader, enablePagination, loading]);

  // Refresh function
  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  // Pagination handlers
  const nextPage = useCallback(() => {
    if (enablePagination && data && Array.isArray(data)) {
      paginatorRef.current.nextPage();
      setCurrentPage(prev => prev + 1);
    }
  }, [enablePagination, data]);

  const previousPage = useCallback(() => {
    if (enablePagination && data && Array.isArray(data)) {
      paginatorRef.current.previousPage();
      setCurrentPage(prev => Math.max(1, prev - 1));
    }
  }, [enablePagination, data]);

  const goToPage = useCallback((page: number) => {
    if (enablePagination && data && Array.isArray(data)) {
      paginatorRef.current.goToPage(page);
      setCurrentPage(page);
    }
  }, [enablePagination, data]);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    paginatorRef.current = new DataPaginator<T>(newPageSize);
    setCurrentPage(1);
  }, []);

  // Filter handlers
  const setFilter = useCallback((field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const removeFilter = useCallback((field: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  }, []);

  // Sorting handlers
  const setSorting = useCallback((field: string, direction: 'asc' | 'desc' = 'asc') => {
    setSortConfig({ field, direction });
  }, []);

  const clearSorting = useCallback(() => {
    setSortConfig(null);
  }, []);

  // Search function
  const search = useCallback((query: string, fields: string[]) => {
    if (!data || !Array.isArray(data)) return [];

    return data.filter(item => 
      fields.some(field => 
        item[field as keyof T]?.toString().toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [data]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce(search, 300),
    [search]
  );

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup
  useEffect(() => {
    return () => {
      workerRef.current.terminate();
    };
  }, []);

  return {
    // Data
    data: processedData,
    originalData: data,
    
    // Loading states
    loading,
    error,
    lastUpdated,
    
    // Pagination
    currentPage,
    pageSize,
    totalPages: enablePagination && data && Array.isArray(data) 
      ? paginatorRef.current.getTotalPages() 
      : 1,
    totalItems: enablePagination && data && Array.isArray(data) 
      ? paginatorRef.current.getTotalItems() 
      : data ? 1 : 0,
    hasNextPage: enablePagination && data && Array.isArray(data) 
      ? paginatorRef.current.hasNextPage() 
      : false,
    hasPreviousPage: enablePagination && data && Array.isArray(data) 
      ? paginatorRef.current.hasPreviousPage() 
      : false,
    
    // Actions
    refresh,
    nextPage,
    previousPage,
    goToPage,
    changePageSize,
    
    // Filtering
    filters,
    setFilter,
    clearFilters,
    removeFilter,
    
    // Sorting
    sortConfig,
    setSorting,
    clearSorting,
    
    // Search
    search: debouncedSearch
  };
}

// Hook for infinite scrolling data
export function useInfiniteData<T>(
  dataLoader: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: {
    initialPage?: number;
    pageSize?: number;
    enableSearch?: boolean;
  } = {}
) {
  const {
    initialPage = 1,
    pageSize = 20,
    enableSearch = false
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState('');

  const loadMore = useCallback(async (page: number = currentPage) => {
    if (loading || loadingMore) return;

    const isInitialLoad = page === initialPage;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await dataLoader(page, pageSize);
      
      if (isInitialLoad) {
        setItems(result.data);
      } else {
        setItems(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.hasMore);
      setCurrentPage(page);
    } catch (err) {
      console.error('Infinite data loading error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentPage, loading, loadingMore, initialPage, pageSize, dataLoader]);

  const refresh = useCallback(() => {
    setCurrentPage(initialPage);
    loadMore(initialPage);
  }, [initialPage, loadMore]);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      refresh();
    } else {
      // Implement search logic here
      // This would typically involve filtering the current items
      // or making a new API call with the search query
    }
  }, [refresh]);

  // Initial load
  useEffect(() => {
    loadMore(initialPage);
  }, [loadMore, initialPage]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    currentPage,
    searchQuery,
    loadMore,
    refresh,
    search
  };
}

// Hook for real-time data updates
export function useRealtimeData<T>(
  dataLoader: () => Promise<T>,
  options: {
    updateInterval?: number;
    batchUpdates?: boolean;
    enableOptimisticUpdates?: boolean;
  } = {}
) {
  const {
    updateInterval = 5000,
    batchUpdates = true,
    enableOptimisticUpdates = false
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);

  const updateData = useCallback(async () => {
    try {
      const newData = await dataLoader();
      
      if (enableOptimisticUpdates && data) {
        // Apply optimistic updates if enabled
        setData(newData);
      } else {
        setData(newData);
      }
      
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Realtime data update error:', err);
      setError(err as Error);
      setIsConnected(false);
    }
  }, [dataLoader, enableOptimisticUpdates, data]);

  // Batch updates processing
  useEffect(() => {
    if (!batchUpdates || updates.length === 0) return;

    const timeoutId = setTimeout(() => {
      updateData();
      setUpdates([]);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [updates, batchUpdates, updateData]);

  // WebSocket or SSE connection simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (batchUpdates) {
        setUpdates(prev => [...prev, Date.now()]);
      } else {
        updateData();
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, batchUpdates, updateData]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    updateData().finally(() => setLoading(false));
  }, [updateData]);

  return {
    data,
    loading,
    error,
    isConnected,
    updatesCount: updates.length,
    refresh: updateData
  };
}

export type { OptimizedDataLoader, DataPaginator, DataProcessor };