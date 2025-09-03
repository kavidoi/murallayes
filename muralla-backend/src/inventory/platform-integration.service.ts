import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface PlatformSyncResult {
  platform: string;
  productId: string;
  status: 'success' | 'error' | 'pending';
  message?: string;
  lastSyncAt: Date;
}

export interface PlatformProduct {
  externalId: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  category?: string;
}

@Injectable()
export class PlatformIntegrationService {
  private readonly logger = new Logger(PlatformIntegrationService.name);

  constructor(private prisma: PrismaService) {}

  // Rappi Integration
  async syncWithRappi(productIds?: string[]): Promise<PlatformSyncResult[]> {
    this.logger.log(`Syncing ${productIds?.length || 'all'} products with Rappi`);
    
    const whereClause = productIds 
      ? { id: { in: productIds }, isDeleted: false }
      : { isDeleted: false, availableOnRappi: true };

    const products = await this.prisma.product.findMany({
      where: whereClause,
      include: { category: true },
    });

    const results: PlatformSyncResult[] = [];

    for (const product of products) {
      try {
        // Mock Rappi API integration - in production this would be real API calls
        const rappiProduct = await this.mockRappiApiCall('POST', '/products', {
          external_id: product.id,
          name: product.name,
          description: product.description,
          price: product.rappiPrice ? Number(product.rappiPrice) : Number(product.cafePrice),
          available: product.availableOnRappi,
          category: product.category?.name,
          sku: product.sku,
        });

        // Update product with Rappi-specific data
        await this.prisma.product.update({
          where: { id: product.id },
          data: {
            rappiProductId: rappiProduct.id,
            rappiLastSync: new Date(),
          },
        });

        results.push({
          platform: 'rappi',
          productId: product.id,
          status: 'success',
          message: `Synced successfully with ID: ${rappiProduct.id}`,
          lastSyncAt: new Date(),
        });

      } catch (error) {
        this.logger.error(`Failed to sync product ${product.id} with Rappi:`, error);
        results.push({
          platform: 'rappi',
          productId: product.id,
          status: 'error',
          message: error.message,
          lastSyncAt: new Date(),
        });
      }
    }

    return results;
  }

  // PedidosYa Integration
  async syncWithPedidosYa(productIds?: string[]): Promise<PlatformSyncResult[]> {
    this.logger.log(`Syncing ${productIds?.length || 'all'} products with PedidosYa`);
    
    const whereClause = productIds 
      ? { id: { in: productIds }, isDeleted: false }
      : { isDeleted: false, availableOnPedidosya: true };

    const products = await this.prisma.product.findMany({
      where: whereClause,
      include: { category: true },
    });

    const results: PlatformSyncResult[] = [];

    for (const product of products) {
      try {
        // Mock PedidosYa API integration
        const pedidosyaProduct = await this.mockPedidosYaApiCall('PUT', `/menu/products/${product.pedidosyaProductId || 'new'}`, {
          name: product.name,
          description: product.description,
          price: product.pedidosyaPrice ? Number(product.pedidosyaPrice) : Number(product.cafePrice),
          enabled: product.availableOnPedidosya,
          category_name: product.category?.name,
          external_code: product.sku,
        });

        // Update product with PedidosYa-specific data
        await this.prisma.product.update({
          where: { id: product.id },
          data: {
            pedidosyaProductId: pedidosyaProduct.external_code,
            pedidosyaLastSync: new Date(),
          },
        });

        results.push({
          platform: 'pedidosya',
          productId: product.id,
          status: 'success',
          message: `Synced successfully`,
          lastSyncAt: new Date(),
        });

      } catch (error) {
        this.logger.error(`Failed to sync product ${product.id} with PedidosYa:`, error);
        results.push({
          platform: 'pedidosya',
          productId: product.id,
          status: 'error',
          message: error.message,
          lastSyncAt: new Date(),
        });
      }
    }

    return results;
  }

  // Uber Eats Integration
  async syncWithUberEats(productIds?: string[]): Promise<PlatformSyncResult[]> {
    this.logger.log(`Syncing ${productIds?.length || 'all'} products with Uber Eats`);
    
    const whereClause = productIds 
      ? { id: { in: productIds }, isDeleted: false }
      : { isDeleted: false, availableOnUber: true };

    const products = await this.prisma.product.findMany({
      where: whereClause,
      include: { category: true },
    });

    const results: PlatformSyncResult[] = [];

    for (const product of products) {
      try {
        // Mock Uber Eats API integration
        const uberProduct = await this.mockUberEatsApiCall('POST', '/v1/eats/stores/menu/items', {
          external_data: product.id,
          title: product.name,
          description: product.description,
          price: (product.uberPrice ? Number(product.uberPrice) : Number(product.cafePrice)) * 100, // Uber uses cents
          available: product.availableOnUber,
          category_id: this.mapCategoryToUber(product.category?.name),
        });

        // Update product with Uber-specific data
        await this.prisma.product.update({
          where: { id: product.id },
          data: {
            uberProductId: uberProduct.id,
            uberLastSync: new Date(),
          },
        });

        results.push({
          platform: 'uber',
          productId: product.id,
          status: 'success',
          message: `Synced successfully with ID: ${uberProduct.id}`,
          lastSyncAt: new Date(),
        });

      } catch (error) {
        this.logger.error(`Failed to sync product ${product.id} with Uber Eats:`, error);
        results.push({
          platform: 'uber',
          productId: product.id,
          status: 'error',
          message: error.message,
          lastSyncAt: new Date(),
        });
      }
    }

    return results;
  }

  // Sync all platforms
  async syncAllPlatforms(productIds?: string[]): Promise<PlatformSyncResult[]> {
    this.logger.log('Starting multi-platform sync');
    
    const [rappiResults, pedidosyaResults, uberResults] = await Promise.allSettled([
      this.syncWithRappi(productIds),
      this.syncWithPedidosYa(productIds),
      this.syncWithUberEats(productIds),
    ]);

    const allResults: PlatformSyncResult[] = [];

    if (rappiResults.status === 'fulfilled') {
      allResults.push(...rappiResults.value);
    }
    if (pedidosyaResults.status === 'fulfilled') {
      allResults.push(...pedidosyaResults.value);
    }
    if (uberResults.status === 'fulfilled') {
      allResults.push(...uberResults.value);
    }

    return allResults;
  }

  // Get sync status for all products
  async getPlatformSyncStatus() {
    const totalProducts = await this.prisma.product.count({
      where: { isDeleted: false }
    });

    const platformStats = await Promise.all([
      this.prisma.product.count({
        where: { isDeleted: false, availableOnRappi: true, rappiProductId: { not: null } }
      }),
      this.prisma.product.count({
        where: { isDeleted: false, availableOnPedidosya: true, pedidosyaProductId: { not: null } }
      }),
      this.prisma.product.count({
        where: { isDeleted: false, availableOnUber: true, uberProductId: { not: null } }
      }),
    ]);

    const [rappiSynced, pedidosyaSynced, uberSynced] = platformStats;
    const totalSynced = rappiSynced + pedidosyaSynced + uberSynced;

    return {
      totalProducts,
      syncedProducts: totalSynced,
      platformBreakdown: {
        rappi: { synced: rappiSynced, available: await this.prisma.product.count({ where: { isDeleted: false, availableOnRappi: true } }) },
        pedidosya: { synced: pedidosyaSynced, available: await this.prisma.product.count({ where: { isDeleted: false, availableOnPedidosya: true } }) },
        uber: { synced: uberSynced, available: await this.prisma.product.count({ where: { isDeleted: false, availableOnUber: true } }) },
      },
      lastSyncAt: new Date(),
    };
  }

  // Mock API calls (replace with real implementations in production)
  private async mockRappiApiCall(method: string, endpoint: string, data: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Rappi API rate limit exceeded');
    }
    
    return {
      id: `rappi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'active',
      ...data,
    };
  }

  private async mockPedidosYaApiCall(method: string, endpoint: string, data: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 250));
    
    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error('PedidosYa API authentication failed');
    }
    
    return {
      external_code: data.external_code || `pya_${Date.now()}`,
      status: 'published',
      ...data,
    };
  }

  private async mockUberEatsApiCall(method: string, endpoint: string, data: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Simulate higher failure rate for Uber (as mentioned in original code)
    if (Math.random() < 0.15) {
      throw new Error('Uber Eats API service unavailable');
    }
    
    return {
      id: `uber_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'AVAILABLE',
      ...data,
    };
  }

  private mapCategoryToUber(categoryName?: string): string {
    const categoryMap: Record<string, string> = {
      'Bebidas Calientes': 'hot-beverages',
      'Bebidas Frías': 'cold-beverages', 
      'Postres': 'desserts',
      'Pasteles': 'cakes',
      'Snacks': 'snacks',
      'Comida': 'food',
    };
    
    return categoryMap[categoryName || ''] || 'other';
  }
}