import Dexie from 'dexie';
import type { CashierProduct, Transaction, CashierSettings, SyncStatus } from '../../types/cashier';

// Dexie Database for Cashier POS
export class CashierDatabase extends Dexie {
  products!: Dexie.Table<CashierProduct>;
  transactions!: Dexie.Table<Transaction>;
  settings!: Dexie.Table<CashierSettings>;
  syncStatus!: Dexie.Table<SyncStatus>;

  constructor() {
    super('CashierPOSDB');
    
    this.version(1).stores({
      // Products table with multiple indexes for fast search
      products: 'id, sku, barcode, name, category, brand, supplier, price, stock, isActive, searchTerms, *nameWords, *tags',
      
      // Transactions table for offline queue
      transactions: 'id, timestamp, synced, cashierId, paymentMethod, total',
      
      // Settings and configuration
      settings: 'id',
      
      // Sync status tracking
      syncStatus: 'id, lastSync, isOnline'
    });

    // Hook to auto-generate search terms on product insert/update
    this.products.hook('creating', (primKey, obj, trans) => {
      this.generateSearchTerms(obj);
    });

    this.products.hook('updating', (modifications, primKey, obj, trans) => {
      if ((modifications as any).name || (modifications as any).category || (modifications as any).brand) {
        this.generateSearchTerms(obj);
      }
    });
  }

  private generateSearchTerms(product: CashierProduct) {
    // Generate comprehensive search terms for ultra-fast lookups
    const terms = [];
    
    if (product.name) {
      terms.push(product.name.toLowerCase());
      product.nameWords = product.name.toLowerCase().split(/\s+/);
      terms.push(...product.nameWords);
    }
    
    if (product.category) {
      terms.push(product.category.toLowerCase());
      product.categoryPath = product.category.toLowerCase();
    }
    
    if (product.brand) {
      terms.push(product.brand.toLowerCase());
    }
    
    if (product.supplier) {
      terms.push(product.supplier.toLowerCase());
    }
    
    if (product.sku) {
      terms.push(product.sku.toLowerCase());
    }
    
    if (product.barcode) {
      terms.push(product.barcode);
    }
    
    if (product.tags) {
      terms.push(...product.tags.map(tag => tag.toLowerCase()));
    }
    
    // Remove duplicates and create searchable string
    product.searchTerms = [...new Set(terms)].join(' ');
  }

  // Simplified product search for initial implementation
  async searchProducts(query: string, limit = 50): Promise<CashierProduct[]> {
    if (!query) return [];

    try {
      // Check if database has products first
      const count = await this.products.count();
      if (count === 0) {
        return [];
      }

      const searchQuery = query.toLowerCase().trim();
      
      // Get all active products and filter in memory for now
      // This is less optimal but more reliable for initial implementation
      const allProducts = await this.products.toArray();

      const results: CashierProduct[] = [];

      for (const product of allProducts) {
        // Skip inactive products
        if (!product.isActive) continue;
        
        let score = 0;

        // Exact barcode match (highest priority)
        if (product.barcode === searchQuery) {
          score += 1000;
        }
        // Exact SKU match
        else if (product.sku.toLowerCase() === searchQuery) {
          score += 500;
        }
        // Name starts with query
        else if (product.name.toLowerCase().startsWith(searchQuery)) {
          score += 100;
        }
        // Name contains query
        else if (product.name.toLowerCase().includes(searchQuery)) {
          score += 50;
        }
        // Category matches
        else if (product.category.toLowerCase().includes(searchQuery)) {
          score += 25;
        }
        // Brand matches
        else if (product.brand?.toLowerCase().includes(searchQuery)) {
          score += 15;
        }

        if (score > 0) {
          results.push(product);
        }
      }

      // Sort by score and return limited results
      results.sort((a, b) => {
        const scoreA = this.getSearchScore(a, searchQuery);
        const scoreB = this.getSearchScore(b, searchQuery);
        return scoreB - scoreA;
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('Database search error:', error);
      return [];
    }
  }

  private getSearchScore(product: CashierProduct, query: string): number {
    let score = 0;
    const q = query.toLowerCase();

    if (product.barcode === q) score += 1000;
    else if (product.sku.toLowerCase() === q) score += 500;
    else if (product.name.toLowerCase().startsWith(q)) score += 100;
    else if (product.name.toLowerCase().includes(q)) score += 50;
    else if (product.category.toLowerCase().includes(q)) score += 25;
    else if (product.brand?.toLowerCase().includes(q)) score += 15;

    return score;
  }

  private calculateFuzzyScore(query: string, target: string): number {
    // Simple Levenshtein-based similarity score
    const matrix = [];
    const m = query.length;
    const n = target.length;

    for (let i = 0; i <= n; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= m; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (target.charAt(i - 1) === query.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return 1 - (matrix[n][m] / Math.max(m, n));
  }

  // Get products by category with pagination
  async getProductsByCategory(category: string, offset = 0, limit = 50): Promise<CashierProduct[]> {
    return this.products
      .where('category')
      .equalsIgnoreCase(category)
      .and(product => product.isActive)
      .offset(offset)
      .limit(limit)
      .toArray();
  }

  // Get product by barcode (optimized for barcode scanner)
  async getProductByBarcode(barcode: string): Promise<CashierProduct | undefined> {
    return this.products
      .where('barcode')
      .equals(barcode)
      .and(product => product.isActive)
      .first();
  }

  // Bulk insert products (for initial sync)
  async bulkInsertProducts(products: CashierProduct[]): Promise<void> {
    await this.transaction('rw', this.products, async () => {
      await this.products.bulkPut(products);
    });
  }

  // Queue transaction for offline sync
  async queueTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tx = { ...transaction, id, synced: false };
    await this.transactions.add(tx);
    return id;
  }

  // Get pending transactions for sync
  async getPendingTransactions(): Promise<Transaction[]> {
    return this.transactions
      .where('synced')
      .equals(0)
      .toArray();
  }

  // Mark transaction as synced
  async markTransactionSynced(transactionId: string): Promise<void> {
    await this.transactions.update(transactionId, {
      synced: true,
      syncedAt: new Date().toISOString()
    });
  }

  // Clear old synced transactions
  async cleanupOldTransactions(daysToKeep = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    await this.transactions
      .where('synced')
      .equals(1)
      .and(tx => new Date(tx.timestamp) < cutoffDate)
      .delete();
  }

  // Get all categories for filter dropdown
  async getCategories(): Promise<string[]> {
    const categories = await this.products
      .orderBy('category')
      .uniqueKeys();
    
    return categories as string[];
  }

  // Get all brands for filter dropdown
  async getBrands(): Promise<string[]> {
    const brands = await this.products
      .where('brand')
      .notEqual('')
      .and(product => product.brand !== undefined)
      .uniqueKeys();
    
    return brands as string[];
  }
}

// Singleton instance
export const cashierDB = new CashierDatabase();