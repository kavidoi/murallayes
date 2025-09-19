import axios from 'axios';
import { AuthService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface PlatformSyncStatus {
  rappi: 'synced' | 'pending' | 'error' | 'conflict';
  pedidosya: 'synced' | 'pending' | 'error' | 'conflict';
  uber: 'synced' | 'pending' | 'error' | 'conflict';
  lastSyncAt?: Date;
  errorMessage?: string;
}

export interface StockItem {
  productId: string;
  productName: string;
  productDescription?: string;
  productSku: string;
  internalSku: string;
  locationId: string;
  locationName: string;
  quantity: number;
  uom: string;
  unitCost: number;
  totalValue: number;
  lastMovement?: Date;
  stockStatus: 'high' | 'medium' | 'low' | 'out';
  productType: 'INSUMO' | 'TERMINADO' | 'SERVICIO';
  fechaElaboracion?: string;
  vencimiento?: string;
  minStock?: number;
  maxStock?: number;
  // Multi-platform fields
  availableOnRappi?: boolean;
  availableOnPedidosya?: boolean;
  availableOnUber?: boolean;
  availableInCafe?: boolean;
  rappiPrice?: number;
  pedidosyaPrice?: number;
  uberPrice?: number;
  cafePrice?: number;
  // Platform sync status
  syncStatus?: PlatformSyncStatus;
  // Platform-specific SKUs
  rappiSku?: string;
  pedidosyaSku?: string;
  uberSku?: string;
  // Category mapping for delivery platforms
  platformCategory?: {
    rappi?: string;
    pedidosya?: string;
    uber?: string;
  };
}

export interface InventoryMove {
  id: string;
  type: 'ENTRADA_COMPRA' | 'ENTRADA_PRODUCCION' | 'SALIDA_PRODUCCION' | 'SALIDA_VENTA' | 'TRASLADO' | 'AJUSTE' | 'MERMA';
  productId: string;
  productName: string;
  productSku: string;
  fromLocationId?: string;
  fromLocation?: string;
  toLocationId?: string;
  toLocation?: string;
  quantity: number;
  uom: string;
  unitCost?: number;
  totalCost?: number;
  reason?: string;
  reference?: string;
  createdAt: Date;
  createdBy: string;
  userId: string;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  type: 'WAREHOUSE' | 'STORE' | 'PRODUCTION' | 'TRANSIT';
  isDefault: boolean;
  address?: string;
  isActive: boolean;
}

export interface StockFilters {
  locationId?: string;
  productId?: string;
  stockStatus?: string;
  productType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateMoveDto {
  type: InventoryMove['type'];
  productId: string;
  fromLocationId?: string;
  toLocationId?: string;
  quantity: number;
  unitCost?: number;
  reason?: string;
  reference?: string;
}

export interface TransferDto {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  reason?: string;
}

export interface AdjustmentDto {
  productId: string;
  locationId: string;
  quantity: number;
  reason: string;
  type: 'INCREASE' | 'DECREASE' | 'SET';
}

export interface InventoryValuation {
  totalValue: number;
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  locationBreakdown: Array<{
    locationId: string;
    locationName: string;
    value: number;
    items: number;
  }>;
}

class InventoryService {
  private getAuthHeaders() {
    const token = AuthService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Stock Management
  async getStock(filters: StockFilters = {}): Promise<{ data: StockItem[]; meta: any }> {
    try {
      // Try authenticated endpoint first
      try {
        await AuthService.ensureValidToken();
        const params = new URLSearchParams();
        
        if (filters.locationId) params.append('locationId', filters.locationId);
        if (filters.productId) params.append('productId', filters.productId);
        if (filters.stockStatus) params.append('stockStatus', filters.stockStatus);
        if (filters.productType) params.append('productType', filters.productType);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const response = await axios.get(`${API_BASE_URL}/inventory/stock?${params}`, {
          headers: this.getAuthHeaders(),
        });

        // Transform API response to match frontend interface
        const transformedData = response.data.data.map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          productDescription: item.productDescription,
          productSku: item.productSku || item.sku,
          internalSku: item.internalSku || this.generateInternalSku(item.productType, item.productId),
          locationId: item.locationId || '1',
          locationName: item.locationName || 'Muralla Café',
          quantity: item.currentStock || item.stock || item.quantity || 0,
          uom: item.uom || 'unidad',
          unitCost: Number(item.unitCost || item.price || 0),
          totalValue: item.totalValue || (Number(item.currentStock || item.stock || item.quantity || 0) * Number(item.unitCost || item.price || 0)),
          lastMovement: item.lastMovement ? new Date(item.lastMovement) : new Date(),
          stockStatus: item.stockStatus || this.calculateStockStatus(item.currentStock || item.stock || item.quantity || 0, item.minStock, item.maxStock),
          productType: item.productType || 'INSUMO',
          fechaElaboracion: item.fechaElaboracion,
          vencimiento: item.vencimiento,
          minStock: item.minStock,
          maxStock: item.maxStock,
          // Multi-platform fields
          availableOnRappi: item.availableOnRappi,
          availableOnPedidosya: item.availableOnPedidosya,
          availableOnUber: item.availableOnUber,
          availableInCafe: item.availableInCafe,
          rappiPrice: item.rappiPrice,
          pedidosyaPrice: item.pedidosyaPrice,
          uberPrice: item.uberPrice,
          cafePrice: item.cafePrice,
          // Platform sync status
          syncStatus: item.syncStatus,
          // Platform-specific SKUs
          rappiSku: item.rappiSku,
          pedidosyaSku: item.pedidosyaSku,
          uberSku: item.uberSku,
          // Category mapping for delivery platforms
          platformCategory: item.platformCategory,
        }));

        return {
          data: transformedData,
          meta: response.data.meta,
        };
      } catch (authError) {
        // Fallback to test endpoint for demo purposes
        console.log('Falling back to test endpoint due to auth error:', authError);
        const response = await axios.get(`${API_BASE_URL}/test-inventory/stock`);
        
        // The test endpoint already returns properly formatted data
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
      throw error;
    }
  }

  // Inventory Movements
  async getMoves(filters: any = {}): Promise<{ data: InventoryMove[]; meta: any }> {
    try {
      await AuthService.ensureValidToken();
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key].toString());
      });

      const response = await axios.get(`${API_BASE_URL}/inventory/moves?${params}`, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching moves:', error);
      // Return mock data for now
      return this.getMockMoves();
    }
  }

  // Platform Integration Methods
  async updatePlatformAvailability(productId: string, platform: 'rappi' | 'pedidosya' | 'uber', available: boolean): Promise<void> {
    try {
      await AuthService.ensureValidToken();
      await axios.patch(`${API_BASE_URL}/inventory/${productId}/platform-availability`, {
        platform,
        available
      }, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error(`Error updating ${platform} availability:`, error);
      throw error;
    }
  }

  async syncWithPlatforms(productIds?: string[]): Promise<PlatformSyncStatus[]> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.post(`${API_BASE_URL}/inventory/sync-platforms`, {
        productIds
      }, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error syncing with platforms:', error);
      // Return mock sync status for demo
      return [
        { rappi: 'synced', pedidosya: 'pending', uber: 'error', lastSyncAt: new Date() },
        { rappi: 'synced', pedidosya: 'conflict', uber: 'pending', lastSyncAt: new Date() }
      ];
    }
  }

  async updatePlatformPricing(productId: string, pricing: Partial<Pick<StockItem, 'rappiPrice' | 'pedidosyaPrice' | 'uberPrice' | 'cafePrice'>>): Promise<StockItem> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.patch(`${API_BASE_URL}/inventory/${productId}/platform-pricing`, pricing, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating platform pricing:', error);
      throw error;
    }
  }

  async bulkUpdatePlatformAvailability(updates: Array<{ productId: string; platform: string; available: boolean }>): Promise<void> {
    try {
      await AuthService.ensureValidToken();
      await axios.patch(`${API_BASE_URL}/inventory/bulk-platform-availability`, {
        updates
      }, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error bulk updating platform availability:', error);
      throw error;
    }
  }

  async getPlatformSyncStatus(): Promise<{ 
    totalProducts: number;
    syncedProducts: number;
    pendingSync: number;
    conflicts: number;
    lastSyncAt?: Date;
  }> {
    try {
      // Try authenticated endpoint first
      try {
        await AuthService.ensureValidToken();
        const response = await axios.get(`${API_BASE_URL}/inventory/platform-sync-status`, {
          headers: this.getAuthHeaders(),
        });
        return response.data;
      } catch (authError) {
        // Fallback to test endpoint
        console.log('Falling back to test platform sync status endpoint');
        const response = await axios.get(`${API_BASE_URL}/test-inventory/platform-sync-status`);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching platform sync status:', error);
      // Return enhanced mock status for demo
      return {
        totalProducts: 156,
        syncedProducts: 143,
        pendingSync: 8,
        conflicts: 5,
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
      };
    }
  }

  async createMove(moveData: CreateMoveDto): Promise<InventoryMove> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.post(`${API_BASE_URL}/inventory/moves`, moveData, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating move:', error);
      throw error;
    }
  }

  // Transfers
  async transfer(transferData: TransferDto): Promise<InventoryMove> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.post(`${API_BASE_URL}/inventory/transfer`, transferData, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw error;
    }
  }

  // Adjustments
  async adjustment(adjustmentData: AdjustmentDto): Promise<InventoryMove> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.post(`${API_BASE_URL}/inventory/adjustment`, adjustmentData, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating adjustment:', error);
      throw error;
    }
  }

  // Valuation
  async getValuation(locationId?: string): Promise<InventoryValuation> {
    try {
      await AuthService.ensureValidToken();
      const params = locationId ? `?locationId=${locationId}` : '';
      const response = await axios.get(`${API_BASE_URL}/inventory/valuation${params}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching valuation:', error);
      throw error;
    }
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    try {
      await AuthService.ensureValidToken();
      const response = await axios.get(`${API_BASE_URL}/inventory/locations`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Return mock locations
      return [
        { id: '1', name: 'Muralla Café', code: 'MC', type: 'STORE', isDefault: true, isActive: true },
        { id: '2', name: 'Bodega Principal', code: 'BP', type: 'WAREHOUSE', isDefault: false, isActive: true },
        { id: '3', name: 'Tienda Centro', code: 'TC', type: 'STORE', isDefault: false, isActive: true },
        { id: '4', name: 'Producción', code: 'PR', type: 'PRODUCTION', isDefault: false, isActive: true },
      ];
    }
  }

  // Utility methods
  private generateInternalSku(productType: string, productId: string): string {
    const prefix = productType === 'TERMINADO' ? 'MFG' : 'PUR';
    const year = new Date().getFullYear().toString().slice(-2);
    const id = productId.slice(-4).padStart(4, '0');
    return `${prefix}-${year}-${id}`;
  }

  private calculateStockStatus(current: number, min?: number, max?: number): 'high' | 'medium' | 'low' | 'out' {
    if (current === 0) return 'out';
    if (min && current <= min) return 'low';
    if (max && current >= max * 0.8) return 'high';
    return 'medium';
  }

  // Mock data for development
  private getMockMoves(): { data: InventoryMove[]; meta: any } {
    const mockMoves: InventoryMove[] = [
      {
        id: '1',
        type: 'ENTRADA_COMPRA',
        productId: '1',
        productName: 'Café Arábica Premium',
        productSku: 'CF-001',
        toLocationId: '1',
        toLocation: 'Muralla Café',
        quantity: 50,
        uom: 'kg',
        unitCost: 8500,
        totalCost: 425000,
        reason: 'Compra a proveedor ABC',
        createdAt: new Date('2025-01-20T10:30:00'),
        createdBy: 'Juan Pérez',
        userId: 'user1',
      },
      {
        id: '2',
        type: 'ENTRADA_PRODUCCION',
        productId: '2',
        productName: 'Espresso Muralla Premium',
        productSku: 'ESP-MUR-001',
        toLocationId: '1',
        toLocation: 'Muralla Café',
        quantity: 15,
        uom: 'kg',
        reason: 'Producción terminada',
        createdAt: new Date('2025-01-19T15:45:00'),
        createdBy: 'María García',
        userId: 'user2',
      },
      {
        id: '3',
        type: 'TRASLADO',
        productId: '4',
        productName: 'Latte Mix Murallita',
        productSku: 'LAT-MUR-001',
        fromLocationId: '4',
        fromLocation: 'Producción',
        toLocationId: '2',
        toLocation: 'Bodega Principal',
        quantity: 25,
        uom: 'kg',
        reason: 'Traslado post-producción',
        createdAt: new Date('2025-01-18T09:15:00'),
        createdBy: 'Carlos López',
        userId: 'user3',
      },
    ];

    return {
      data: mockMoves,
      meta: {
        total: mockMoves.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };
  }
}

export default new InventoryService();
