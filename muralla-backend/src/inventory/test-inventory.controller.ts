import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

@Public()
@Controller('test-inventory')
export class TestInventoryController {
  @Public()
  @Get('stock')
  getTestStock() {
    return {
      data: [
        {
          productId: '1',
          productName: 'Café Arábica Premium',
          productDescription: 'Café premium de granos selectos',
          productSku: 'CF-001',
          internalSku: 'MFG-25-0001',
          locationId: '1',
          locationName: 'Muralla Café',
          quantity: 45,
          uom: 'kg',
          unitCost: 8500,
          totalValue: 382500,
          lastMovement: new Date(),
          stockStatus: 'medium',
          productType: 'INSUMO',
          minStock: 10,
          maxStock: 100,
          // Multi-platform fields
          availableOnRappi: true,
          availableOnPedidosya: false,
          availableOnUber: true,
          availableInCafe: true,
          rappiPrice: 12000,
          pedidosyaPrice: 11500,
          uberPrice: 12500,
          cafePrice: 10000,
          // Platform sync status
          syncStatus: {
            rappi: 'synced',
            pedidosya: 'pending',
            uber: 'error',
            lastSyncAt: new Date(),
          },
          // Platform SKUs
          rappiSku: 'rappi_cf001',
          pedidosyaSku: null,
          uberSku: 'uber_cf001',
          // Platform categories
          platformCategory: {
            rappi: 'bebidas-calientes',
            pedidosya: 'Bebidas Calientes',
            uber: 'hot-beverages',
          },
        },
        {
          productId: '2',
          productName: 'Espresso Muralla Premium',
          productDescription: 'Blend exclusivo de la casa',
          productSku: 'ESP-MUR-001',
          internalSku: 'MFG-25-0002',
          locationId: '1',
          locationName: 'Muralla Café',
          quantity: 22,
          uom: 'kg',
          unitCost: 9200,
          totalValue: 202400,
          lastMovement: new Date(),
          stockStatus: 'high',
          productType: 'TERMINADO',
          minStock: 15,
          maxStock: 50,
          // Multi-platform fields
          availableOnRappi: true,
          availableOnPedidosya: true,
          availableOnUber: false,
          availableInCafe: true,
          rappiPrice: 15000,
          pedidosyaPrice: 14500,
          uberPrice: null,
          cafePrice: 13000,
          // Platform sync status
          syncStatus: {
            rappi: 'synced',
            pedidosya: 'synced',
            uber: 'pending',
            lastSyncAt: new Date(),
          },
          // Platform SKUs
          rappiSku: 'rappi_esp001',
          pedidosyaSku: 'pya_esp001',
          uberSku: null,
          // Platform categories
          platformCategory: {
            rappi: 'bebidas-calientes',
            pedidosya: 'Bebidas Calientes',
            uber: 'hot-beverages',
          },
        },
        {
          productId: '3',
          productName: 'Latte Mix Murallita',
          productDescription: 'Mezcla especial para lattes artesanales',
          productSku: 'LAT-MUR-001',
          internalSku: 'MFG-25-0003',
          locationId: '1',
          locationName: 'Muralla Café',
          quantity: 8,
          uom: 'kg',
          unitCost: 7800,
          totalValue: 62400,
          lastMovement: new Date(),
          stockStatus: 'low',
          productType: 'TERMINADO',
          minStock: 12,
          maxStock: 60,
          // Multi-platform fields
          availableOnRappi: false,
          availableOnPedidosya: true,
          availableOnUber: true,
          availableInCafe: true,
          rappiPrice: null,
          pedidosyaPrice: 13800,
          uberPrice: 14200,
          cafePrice: 12500,
          // Platform sync status
          syncStatus: {
            rappi: 'pending',
            pedidosya: 'synced',
            uber: 'conflict',
            lastSyncAt: new Date(),
          },
          // Platform SKUs
          rappiSku: null,
          pedidosyaSku: 'pya_lat001',
          uberSku: 'uber_lat001',
          // Platform categories
          platformCategory: {
            rappi: 'bebidas-calientes',
            pedidosya: 'Bebidas Calientes',
            uber: 'hot-beverages',
          },
        },
      ],
      meta: {
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };
  }

  @Public()
  @Get('platform-sync-status')
  getPlatformSyncStatus() {
    return {
      totalProducts: 156,
      syncedProducts: 143,
      pendingSync: 8,
      conflicts: 5,
      platformBreakdown: {
        rappi: { synced: 120, available: 135 },
        pedidosya: { synced: 98, available: 110 },
        uber: { synced: 85, available: 95 },
      },
      lastSyncAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    };
  }

  @Public()
  @Get('sync-demo')
  syncDemo() {
    return {
      message: 'Platform synchronization started',
      results: [
        {
          platform: 'rappi',
          productId: '1',
          status: 'success',
          message: 'Synced successfully with ID: rappi_1724627834_abc123',
          lastSyncAt: new Date(),
        },
        {
          platform: 'pedidosya',
          productId: '1',
          status: 'success',
          message: 'Synced successfully',
          lastSyncAt: new Date(),
        },
        {
          platform: 'uber',
          productId: '1',
          status: 'error',
          message: 'Uber Eats API service unavailable',
          lastSyncAt: new Date(),
        },
      ],
    };
  }

  @Public()
  @Get('platform-availability-demo')
  platformAvailabilityDemo() {
    return {
      message: 'Platform availability updated successfully',
      productId: '1',
      platform: 'rappi',
      available: true,
      timestamp: new Date(),
    };
  }
}