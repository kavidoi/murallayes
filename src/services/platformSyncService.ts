import axios from 'axios';
import { AuthService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

// Rappi API Types
export interface RappiMenuItem {
  sku: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  category: string;
  subcategory?: string;
  toppings?: RappiTopping[];
  image?: string;
}

export interface RappiTopping {
  id: string;
  name: string;
  price: number;
  available: boolean;
  max_quantity?: number;
}

export interface RappiMenu {
  store_id: string;
  categories: RappiCategory[];
  products: RappiMenuItem[];
}

export interface RappiCategory {
  id: string;
  name: string;
  available: boolean;
  sort_order: number;
}

// PedidosYa API Types (when available)
export interface PedidosYaProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  category_id: string;
  image_url?: string;
}

// Uber Eats API Types (when available)
export interface UberEatsItem {
  id: string;
  title: string;
  description?: string;
  price_info: {
    price: number;
    currency_code: string;
  };
  quantity_info?: {
    quantity: number;
    overrides?: any[];
  };
}

// Sync Status Types
export interface PlatformSyncResult {
  platform: 'rappi' | 'pedidosya' | 'uber';
  success: boolean;
  syncedItems: number;
  errors: string[];
  timestamp: Date;
}

export interface SyncConflict {
  productId: string;
  productName: string;
  platform: string;
  conflictType: 'price_mismatch' | 'availability_mismatch' | 'stock_mismatch';
  localValue: any;
  platformValue: any;
  suggestedAction: string;
}

class PlatformSyncService {
  private getAuthHeaders() {
    const token = AuthService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Rappi Integration
  async syncWithRappi(storeId: string): Promise<PlatformSyncResult> {
    try {
      await AuthService.ensureValidToken();
      
      // Get current inventory for Rappi-enabled items
      const response = await axios.get(`${API_BASE_URL}/inventory/platform-items/rappi`, {
        headers: this.getAuthHeaders(),
      });

      const inventoryItems = response.data;
      
      // Transform to Rappi format
      const rappiMenu = this.transformToRappiMenu(storeId, inventoryItems);
      
      // Sync menu with Rappi
      const syncResponse = await axios.post(`${API_BASE_URL}/platform-sync/rappi/menu`, {
        storeId,
        menu: rappiMenu
      }, {
        headers: this.getAuthHeaders(),
      });

      // Update availability for each item
      const availabilityUpdates = inventoryItems
        .filter(item => item.availableOnRappi)
        .map(item => ({
          sku: item.rappiSku || item.productSku,
          available: item.quantity > 0
        }));

      if (availabilityUpdates.length > 0) {
        await axios.put(`${API_BASE_URL}/platform-sync/rappi/availability`, {
          storeId,
          items: availabilityUpdates
        }, {
          headers: this.getAuthHeaders(),
        });
      }

      return {
        platform: 'rappi',
        success: true,
        syncedItems: availabilityUpdates.length,
        errors: [],
        timestamp: new Date()
      };
    } catch (error: any) {
      console.error('Error syncing with Rappi:', error);
      return {
        platform: 'rappi',
        success: false,
        syncedItems: 0,
        errors: [error.message || 'Unknown error during Rappi sync'],
        timestamp: new Date()
      };
    }
  }

  // PedidosYa Integration (placeholder - API docs not available)
  async syncWithPedidosYa(storeId: string): Promise<PlatformSyncResult> {
    try {
      await AuthService.ensureValidToken();
      
      // This would integrate with PedidosYa API when available
      const response = await axios.post(`${API_BASE_URL}/platform-sync/pedidosya`, {
        storeId
      }, {
        headers: this.getAuthHeaders(),
      });

      return {
        platform: 'pedidosya',
        success: true,
        syncedItems: response.data.syncedItems || 0,
        errors: [],
        timestamp: new Date()
      };
    } catch (error: any) {
      console.error('Error syncing with PedidosYa:', error);
      return {
        platform: 'pedidosya',
        success: false,
        syncedItems: 0,
        errors: [error.message || 'PedidosYa API integration pending'],
        timestamp: new Date()
      };
    }
  }

  // Uber Eats Integration (placeholder)
  async syncWithUber(restaurantId: string): Promise<PlatformSyncResult> {
    try {
      await AuthService.ensureValidToken();
      
      // This would integrate with Uber Eats API when available
      const response = await axios.post(`${API_BASE_URL}/platform-sync/uber`, {
        restaurantId
      }, {
        headers: this.getAuthHeaders(),
      });

      return {
        platform: 'uber',
        success: true,
        syncedItems: response.data.syncedItems || 0,
        errors: [],
        timestamp: new Date()
      };
    } catch (error: any) {
      console.error('Error syncing with Uber:', error);
      return {
        platform: 'uber',
        success: false,
        syncedItems: 0,
        errors: [error.message || 'Uber Eats API integration pending'],
        timestamp: new Date()
      };
    }
  }

  // Sync all platforms
  async syncAllPlatforms(): Promise<PlatformSyncResult[]> {
    const results: PlatformSyncResult[] = [];
    
    try {
      // These would come from settings/configuration
      const storeConfigs = {
        rappi: 'store-123',
        pedidosya: 'restaurant-456', 
        uber: 'location-789'
      };

      // Sync with all platforms in parallel
      const [rappiResult, pedidosyaResult, uberResult] = await Promise.allSettled([
        this.syncWithRappi(storeConfigs.rappi),
        this.syncWithPedidosYa(storeConfigs.pedidosya),
        this.syncWithUber(storeConfigs.uber)
      ]);

      if (rappiResult.status === 'fulfilled') {
        results.push(rappiResult.value);
      } else {
        results.push({
          platform: 'rappi',
          success: false,
          syncedItems: 0,
          errors: ['Failed to sync with Rappi'],
          timestamp: new Date()
        });
      }

      if (pedidosyaResult.status === 'fulfilled') {
        results.push(pedidosyaResult.value);
      } else {
        results.push({
          platform: 'pedidosya',
          success: false,
          syncedItems: 0,
          errors: ['Failed to sync with PedidosYa'],
          timestamp: new Date()
        });
      }

      if (uberResult.status === 'fulfilled') {
        results.push(uberResult.value);
      } else {
        results.push({
          platform: 'uber',
          success: false,
          syncedItems: 0,
          errors: ['Failed to sync with Uber'],
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Error during platform sync:', error);
    }

    return results;
  }

  // Get sync conflicts
  async getSyncConflicts(): Promise<SyncConflict[]> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.get(`${API_BASE_URL}/platform-sync/conflicts`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sync conflicts:', error);
      // Return mock conflicts for demo
      return this.getMockConflicts();
    }
  }

  // Resolve sync conflict
  async resolveSyncConflict(
    productId: string, 
    platform: string, 
    resolution: 'use_local' | 'use_platform' | 'manual',
    manualValues?: any
  ): Promise<boolean> {
    try {
      await AuthService.ensureValidToken();
      await axios.post(`${API_BASE_URL}/platform-sync/resolve-conflict`, {
        productId,
        platform,
        resolution,
        manualValues
      }, {
        headers: this.getAuthHeaders(),
      });
      return true;
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return false;
    }
  }

  // Transform inventory to Rappi menu format
  private transformToRappiMenu(storeId: string, inventoryItems: any[]): RappiMenu {
    // Group items by category
    const categories = [...new Set(inventoryItems.map(item => item.platformCategory?.rappi || 'general'))];
    
    const rappiCategories: RappiCategory[] = categories.map((category, index) => ({
      id: category,
      name: this.formatCategoryName(category),
      available: true,
      sort_order: index
    }));

    const rappiProducts: RappiMenuItem[] = inventoryItems
      .filter(item => item.availableOnRappi)
      .map(item => ({
        sku: item.rappiSku || item.productSku,
        name: item.productName,
        description: item.productDescription,
        price: item.rappiPrice || item.unitCost,
        available: item.quantity > 0,
        category: item.platformCategory?.rappi || 'general',
        image: item.imageUrl
      }));

    return {
      store_id: storeId,
      categories: rappiCategories,
      products: rappiProducts
    };
  }

  private formatCategoryName(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Mock conflicts for demo
  private getMockConflicts(): SyncConflict[] {
    return [
      {
        productId: '1',
        productName: 'Café Americano',
        platform: 'rappi',
        conflictType: 'price_mismatch',
        localValue: 3500,
        platformValue: 3200,
        suggestedAction: 'Actualizar precio en Rappi o ajustar precio local'
      },
      {
        productId: '2',
        productName: 'Sandwich Club',
        platform: 'pedidosya',
        conflictType: 'availability_mismatch',
        localValue: true,
        platformValue: false,
        suggestedAction: 'Verificar estado de disponibilidad y sincronizar'
      }
    ];
  }

  // Real-time order processing
  async processOrderFromPlatform(platform: string, orderId: string, orderData: any): Promise<boolean> {
    try {
      await AuthService.ensureValidToken();
      
      // Process order and update inventory
      const response = await axios.post(`${API_BASE_URL}/orders/platform-order`, {
        platform,
        orderId,
        orderData
      }, {
        headers: this.getAuthHeaders(),
      });

      // Auto-update stock levels based on order
      if (response.data.success) {
        const stockUpdates = orderData.items.map(item => ({
          productSku: item.sku,
          quantityUsed: item.quantity,
          reason: `Venta ${platform} - Orden ${orderId}`
        }));

        await axios.post(`${API_BASE_URL}/inventory/auto-deduct`, {
          updates: stockUpdates
        }, {
          headers: this.getAuthHeaders(),
        });
      }

      return response.data.success;
    } catch (error) {
      console.error('Error processing platform order:', error);
      return false;
    }
  }

  // Get platform integration status
  async getPlatformStatus(): Promise<{
    rappi: { connected: boolean; lastSync?: Date; error?: string };
    pedidosya: { connected: boolean; lastSync?: Date; error?: string };
    uber: { connected: boolean; lastSync?: Date; error?: string };
  }> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.get(`${API_BASE_URL}/platform-sync/status`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching platform status:', error);
      // Return mock status
      return {
        rappi: { connected: true, lastSync: new Date() },
        pedidosya: { connected: false, error: 'API credentials not configured' },
        uber: { connected: false, error: 'Integration pending' }
      };
    }
  }
}

export default new PlatformSyncService();