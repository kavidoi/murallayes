import { useState, useEffect, useCallback, useMemo } from 'react';
import { productService } from '../services/cashier/productService';
import type { CashierProduct, ProductFilter, SearchResult } from '../types/cashier';

interface UseProductSearchOptions {
  initialQuery?: string;
  initialFilters?: ProductFilter;
  debounceMs?: number;
  pageSize?: number;
  minQueryLength?: number;
}

interface UseProductSearchReturn {
  // Search state
  query: string;
  filters: ProductFilter;
  products: CashierProduct[];
  isLoading: boolean;
  error: string | null;
  searchTime: number;
  
  // Pagination
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  
  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: ProductFilter) => void;
  clearFilters: () => void;
  loadMore: () => void;
  refresh: () => void;
  
  // Quick access
  searchByBarcode: (barcode: string) => Promise<CashierProduct | null>;
  getProductById: (productId: string) => Promise<CashierProduct | null>;
  
  // Suggestions
  suggestions: string[];
  clearSuggestions: () => void;
}

export function useProductSearch(options: UseProductSearchOptions = {}): UseProductSearchReturn {
  const {
    initialQuery = '',
    initialFilters = {},
    debounceMs = 150,
    pageSize = 50,
    minQueryLength = 0
  } = options;

  // State
  const [query, setQueryState] = useState(initialQuery);
  const [filters, setFiltersState] = useState<ProductFilter>(initialFilters);
  const [products, setProducts] = useState<CashierProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Debounced search execution
  const executeSearch = useCallback(async (
    searchQuery: string, 
    searchFilters: ProductFilter, 
    isLoadMore = false
  ) => {
    if (searchQuery.length < minQueryLength && !Object.keys(searchFilters).length) {
      setProducts([]);
      setTotalCount(0);
      setHasMore(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const offset = isLoadMore ? products.length : 0;
      const result: SearchResult = await productService.searchProducts(
        searchQuery,
        searchFilters,
        pageSize,
        offset
      );

      if (isLoadMore) {
        setProducts(prev => [...prev, ...result.products]);
      } else {
        setProducts(result.products);
        setCurrentPage(0);
      }

      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      setSearchTime(result.searchTime);
      
      // Generate suggestions from results
      if (result.products.length > 0 && !isLoadMore) {
        const newSuggestions = result.products
          .slice(0, 5)
          .map(product => product.name)
          .filter((name, index, arr) => arr.indexOf(name) === index);
        
        setSuggestions(newSuggestions);
      }

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setProducts([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [products.length, pageSize, minQueryLength]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      executeSearch(query, filters);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, filters, debounceMs, executeSearch]);

  // Actions
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setSuggestions([]); // Clear suggestions when typing
  }, []);

  const setFilters = useCallback((newFilters: ProductFilter) => {
    setFiltersState(newFilters);
    setCurrentPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
    setCurrentPage(0);
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setCurrentPage(prev => prev + 1);
      executeSearch(query, filters, true);
    }
  }, [hasMore, isLoading, query, filters, executeSearch]);

  const refresh = useCallback(() => {
    setCurrentPage(0);
    executeSearch(query, filters);
  }, [query, filters, executeSearch]);

  const searchByBarcode = useCallback(async (barcode: string): Promise<CashierProduct | null> => {
    try {
      return await productService.getProductByBarcode(barcode);
    } catch (err) {
      console.error('Barcode search error:', err);
      return null;
    }
  }, []);

  const getProductById = useCallback(async (productId: string): Promise<CashierProduct | null> => {
    try {
      return await productService.getProductById(productId);
    } catch (err) {
      console.error('Product lookup error:', err);
      return null;
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Memoized return value
  return useMemo(() => ({
    // Search state
    query,
    filters,
    products,
    isLoading,
    error,
    searchTime,
    
    // Pagination
    hasMore,
    totalCount,
    currentPage,
    
    // Actions
    setQuery,
    setFilters,
    clearFilters,
    loadMore,
    refresh,
    
    // Quick access
    searchByBarcode,
    getProductById,
    
    // Suggestions
    suggestions,
    clearSuggestions
  }), [
    query,
    filters,
    products,
    isLoading,
    error,
    searchTime,
    hasMore,
    totalCount,
    currentPage,
    setQuery,
    setFilters,
    clearFilters,
    loadMore,
    refresh,
    searchByBarcode,
    getProductById,
    suggestions,
    clearSuggestions
  ]);
}

// Hook for categories and brands (for filter dropdowns)
export function useProductMetadata() {
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoading(true);
      try {
        const [categoriesResult, brandsResult] = await Promise.all([
          productService.getCategories(),
          productService.getBrands()
        ]);
        
        setCategories(categoriesResult);
        setBrands(brandsResult);
      } catch (error) {
        console.error('Failed to load product metadata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetadata();
  }, []);

  return { categories, brands, isLoading };
}

// Hook for popular/recent products
export function usePopularProducts(limit = 20) {
  const [products, setProducts] = useState<CashierProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPopularProducts = async () => {
      setIsLoading(true);
      try {
        const popularProducts = await productService.getPopularProducts(limit);
        setProducts(popularProducts);
      } catch (error) {
        console.error('Failed to load popular products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPopularProducts();
  }, [limit]);

  return { products, isLoading, refresh: () => {
    // Trigger reload
    setProducts([]);
  }};
}