import { cashierDB } from './database';
import type { CashierProduct, ProductFilter, SearchResult } from '../../types/cashier';

export class ProductService {
  private searchCache = new Map<string, { result: SearchResult; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Fast product search with caching
  async searchProducts(
    query: string, 
    filters: ProductFilter = {}, 
    limit = 50,
    offset = 0
  ): Promise<SearchResult> {
    const startTime = performance.now();
    const cacheKey = this.getCacheKey(query, filters, limit, offset);
    
    // Check cache first
    const cached = this.searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.result;
    }

    try {
      let products: CashierProduct[] = [];
      
      // If no query, get products by filters
      if (!query.trim()) {
        products = await this.getProductsByFilters(filters, limit, offset);
      } else {
        // Use fast search from database
        products = await cashierDB.searchProducts(query.trim(), limit * 2); // Get more for filtering
        
        // Apply additional filters
        products = this.applyFilters(products, filters);
        
        // Apply pagination
        products = products.slice(offset, offset + limit);
      }

      const searchTime = performance.now() - startTime;
      const totalCount = await this.getTotalCount(query, filters);
      
      const result: SearchResult = {
        products,
        totalCount,
        hasMore: (offset + products.length) < totalCount,
        query,
        filters,
        searchTime
      };

      // Cache the result
      this.searchCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Search error:', error);
      return {
        products: [],
        totalCount: 0,
        hasMore: false,
        query,
        filters,
        searchTime: performance.now() - startTime
      };
    }
  }

  // Get product by barcode (optimized for scanner)
  async getProductByBarcode(barcode: string): Promise<CashierProduct | null> {
    try {
      const product = await cashierDB.getProductByBarcode(barcode);
      return product || null;
    } catch (error) {
      console.error('Barcode lookup error:', error);
      return null;
    }
  }

  // Get product by ID
  async getProductById(productId: string): Promise<CashierProduct | null> {
    try {
      const product = await cashierDB.products.get(productId);
      return product || null;
    } catch (error) {
      console.error('Product lookup error:', error);
      return null;
    }
  }

  // Get products by category
  async getProductsByCategory(category: string, limit = 50, offset = 0): Promise<CashierProduct[]> {
    try {
      return await cashierDB.getProductsByCategory(category, offset, limit);
    } catch (error) {
      console.error('Category lookup error:', error);
      return [];
    }
  }

  // Get all categories for filters
  async getCategories(): Promise<string[]> {
    try {
      return await cashierDB.getCategories();
    } catch (error) {
      console.error('Categories lookup error:', error);
      return [];
    }
  }

  // Get all brands for filters
  async getBrands(): Promise<string[]> {
    try {
      return await cashierDB.getBrands();
    } catch (error) {
      console.error('Brands lookup error:', error);
      return [];
    }
  }

  // Update product stock (for real-time inventory)
  async updateProductStock(productId: string, newStock: number): Promise<boolean> {
    try {
      await cashierDB.products.update(productId, {
        stock: newStock,
        updatedAt: new Date().toISOString()
      });
      
      // Clear search cache since stock changed
      this.clearSearchCache();
      
      return true;
    } catch (error) {
      console.error('Stock update error:', error);
      return false;
    }
  }

  // Sync products from server
  async syncProducts(products: CashierProduct[]): Promise<void> {
    try {
      await cashierDB.bulkInsertProducts(products);
      this.clearSearchCache();
      
      console.log(`Synced ${products.length} products to local database`);
    } catch (error) {
      console.error('Product sync error:', error);
      throw error;
    }
  }

  // Get popular/recently used products
  async getPopularProducts(limit = 20): Promise<CashierProduct[]> {
    try {
      // Check if database has any products first
      const count = await cashierDB.products.count();
      if (count === 0) {
        return [];
      }

      // For now, get products with highest stock turnover
      // In production, this would be based on transaction history
      return await cashierDB.products
        .where('isActive')
        .equals(true)
        .and(product => product.stock > 0)
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Popular products lookup error:', error);
      return [];
    }
  }

  // Private helper methods

  private getCacheKey(query: string, filters: ProductFilter, limit: number, offset: number): string {
    return JSON.stringify({ query, filters, limit, offset });
  }

  private async getProductsByFilters(
    filters: ProductFilter, 
    limit: number, 
    offset: number
  ): Promise<CashierProduct[]> {
    try {
      // Check if database has any products first
      const count = await cashierDB.products.count();
      if (count === 0) {
        return [];
      }

      let collection = cashierDB.products.where('isActive').equals(true);

      // Apply filters
      if (filters.category) {
        collection = collection.and(product => 
          product.category.toLowerCase() === filters.category!.toLowerCase()
        );
      }

      if (filters.brand) {
        collection = collection.and(product => 
          product.brand?.toLowerCase() === filters.brand!.toLowerCase()
        );
      }

      if (filters.minPrice !== undefined) {
        collection = collection.and(product => product.price >= filters.minPrice!);
      }

      if (filters.maxPrice !== undefined) {
        collection = collection.and(product => product.price <= filters.maxPrice!);
      }

      if (filters.inStock) {
        collection = collection.and(product => product.stock > 0);
      }

      return collection.offset(offset).limit(limit).toArray();
    } catch (error) {
      console.error('Error getting products by filters:', error);
      return [];
    }
  }

  private applyFilters(products: CashierProduct[], filters: ProductFilter): CashierProduct[] {
    return products.filter(product => {
      if (filters.category && product.category.toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }

      if (filters.brand && product.brand?.toLowerCase() !== filters.brand.toLowerCase()) {
        return false;
      }

      if (filters.minPrice !== undefined && product.price < filters.minPrice) {
        return false;
      }

      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
        return false;
      }

      if (filters.inStock && product.stock <= 0) {
        return false;
      }

      return true;
    });
  }

  private async getTotalCount(query: string, filters: ProductFilter): Promise<number> {
    try {
      if (!query.trim()) {
        // Count filtered products
        let collection = cashierDB.products.where('isActive').equals(true);
        
        if (filters.category) {
          collection = collection.and(product => 
            product.category.toLowerCase() === filters.category!.toLowerCase()
          );
        }

        return await collection.count();
      } else {
        // For search queries, we need to count results
        // This is expensive, so we'll use cached count or estimate
        const allResults = await cashierDB.searchProducts(query.trim(), 1000);
        const filtered = this.applyFilters(allResults, filters);
        return filtered.length;
      }
    } catch (error) {
      console.error('Count error:', error);
      return 0;
    }
  }

  private clearSearchCache(): void {
    this.searchCache.clear();
  }

  // Clear old cache entries
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.searchCache.delete(key);
      }
    }
  }

  // Initialize service with cleanup interval
  constructor() {
    // Cleanup cache every 10 minutes
    setInterval(() => this.cleanupCache(), 10 * 60 * 1000);
  }
}

// Singleton instance
export const productService = new ProductService();