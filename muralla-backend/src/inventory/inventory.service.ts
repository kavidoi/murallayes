import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformIntegrationService } from './platform-integration.service';
import { CreateMoveDto } from './dto/create-move.dto';
import { StockFiltersDto } from './dto/stock-filters.dto';
import { TransferDto } from './dto/transfer.dto';
import { AdjustmentDto } from './dto/adjustment.dto';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private platformIntegration: PlatformIntegrationService,
  ) {}

  async createMove(createMoveDto: CreateMoveDto, createdBy: string): Promise<any> {
    // For now, return a placeholder until migration is complete
    // This will be implemented once the database schema is updated
    throw new BadRequestException('Inventory moves feature will be available after database migration');
  }

  async getStock(filters: StockFiltersDto) {
    const { productId, search, page, limit } = filters;
    const skip = (page - 1) * limit;

    // Build product filter using current Product model
    const productWhere: Prisma.ProductWhereInput = {
      isDeleted: false,
      ...(productId && { id: productId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: productWhere,
        skip,
        take: limit,
        include: {
          category: true,
        },
      }),
      this.prisma.product.count({ where: productWhere }),
    ]);

    const stockItems = products.map(product => ({
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      productSku: product.sku,
      internalSku: `MFG-25-${product.id.slice(-4)}`,
      locationId: '1',
      locationName: 'Muralla Café',
      quantity: product.stock,
      uom: product.uom,
      unitCost: product.unitCost ? Number(product.unitCost) : 0,
      totalValue: product.stock * (product.unitCost ? Number(product.unitCost) : 0),
      lastMovement: product.updatedAt,
      stockStatus: this.calculateStockStatus(product.stock, product.minOrderQuantity, product.maxOrderQuantity),
      productType: product.type,
      minStock: product.minOrderQuantity,
      maxStock: product.maxOrderQuantity,
      // Multi-platform fields
      availableOnRappi: product.availableOnRappi,
      availableOnPedidosya: product.availableOnPedidosya,
      availableOnUber: product.availableOnUber,
      availableInCafe: product.availableInCafe,
      rappiPrice: product.rappiPrice ? Number(product.rappiPrice) : null,
      pedidosyaPrice: product.pedidosyaPrice ? Number(product.pedidosyaPrice) : null,
      uberPrice: product.uberPrice ? Number(product.uberPrice) : null,
      cafePrice: product.cafePrice ? Number(product.cafePrice) : null,
      // Platform sync status (mock for now, will implement real sync later)
      syncStatus: {
        rappi: product.availableOnRappi ? 'synced' : 'pending',
        pedidosya: product.availableOnPedidosya ? 'synced' : 'pending',
        uber: product.availableOnUber ? 'synced' : 'error',
        lastSyncAt: new Date(),
      },
      // Platform SKUs
      rappiSku: product.rappiProductId,
      pedidosyaSku: product.pedidosyaProductId,
      uberSku: product.uberProductId,
      // Platform categories
      platformCategory: {
        rappi: product.category?.name?.toLowerCase().replace(' ', '-'),
        pedidosya: product.category?.name,
        uber: product.category?.name,
      },
    }));

    return {
      data: stockItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private calculateStockStatus(currentStock: number, minStock?: number, maxStock?: number): 'high' | 'medium' | 'low' | 'out' {
    if (currentStock === 0) return 'out';
    if (minStock && currentStock <= minStock) return 'low';
    if (maxStock && currentStock >= maxStock * 0.8) return 'high';
    return 'medium';
  }

  async getMoves(filters: any) {
    // Placeholder until migration is complete
    throw new BadRequestException('Inventory moves feature will be available after database migration');
  }

  async transfer(transferDto: TransferDto, createdBy: string): Promise<any> {
    // Placeholder until migration is complete
    throw new BadRequestException('Transfer feature will be available after database migration');
  }

  async adjustment(adjustmentDto: AdjustmentDto, createdBy: string): Promise<any> {
    // Placeholder until migration is complete
    throw new BadRequestException('Adjustment feature will be available after database migration');
  }

  async getValuation(locationId?: string) {
    // Placeholder until migration is complete
    throw new BadRequestException('Valuation feature will be available after database migration');
  }

  async calculateWAVG(productId: string, locationId?: string): Promise<number> {
    // Weighted Average = sum(totalCost) / sum(quantity) from CostLines marked as inventory for the product
    const where: Prisma.CostLineWhereInput = {
      productId,
      isInventory: true,
      quantity: { not: null },
      totalCost: { not: null },
      ...(locationId ? { locationId } : {}),
    };

    const agg = await this.prisma.costLine.aggregate({
      _sum: { totalCost: true, quantity: true },
      where,
    });

    const sumTotal = agg._sum.totalCost as unknown as Decimal | null;
    const sumQty = agg._sum.quantity as unknown as Decimal | null;

    if (!sumQty || sumQty.equals(0)) {
      // Fallback to product.unitCost or 0
      const product = await this.prisma.product.findUnique({ where: { id: productId } });
      return product?.unitCost ? Number(product.unitCost) : 0;
    }

    return Number(sumTotal!.div(sumQty));
  }

  async checkAvailability(productId: string, quantity: number, locationId: string): Promise<boolean> {
    // For now, check against current stock field
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    return product ? product.stock >= quantity : false;
  }

  // Legacy methods for backward compatibility
  async createProduct(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data });
  }

  async findAllProducts() {
    return this.prisma.product.findMany({ include: { sales: true } });
  }

  async findOneProduct(id: string) {
    return this.prisma.product.findUnique({ 
      where: { id }, 
      include: { sales: true } 
    });
  }

  async updateProduct(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async removeProduct(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  async createSale(data: Prisma.SaleCreateInput) {
    return this.prisma.sale.create({ 
      data, 
      include: { product: true, seller: true } 
    });
  }

  async findAllSales() {
    return this.prisma.sale.findMany({ 
      include: { product: true, seller: true } 
    });
  }

  async findSalesByProduct(productId: string) {
    return this.prisma.sale.findMany({ 
      where: { productId }, 
      include: { product: true, seller: true } 
    });
  }

  async findSalesBySeller(sellerId: string) {
    return this.prisma.sale.findMany({ 
      where: { soldBy: sellerId }, 
      include: { product: true, seller: true } 
    });
  }

  // Multi-Platform Integration Methods
  async updatePlatformAvailability(productId: string, platform: 'rappi' | 'pedidosya' | 'uber', available: boolean) {
    const updateData: Prisma.ProductUpdateInput = {};
    
    switch (platform) {
      case 'rappi':
        updateData.availableOnRappi = available;
        break;
      case 'pedidosya':
        updateData.availableOnPedidosya = available;
        break;
      case 'uber':
        updateData.availableOnUber = available;
        break;
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: updateData,
    });
  }

  async updatePlatformPricing(productId: string, pricing: any) {
    const updateData: Prisma.ProductUpdateInput = {};
    
    if (pricing.rappiPrice !== undefined) updateData.rappiPrice = new Decimal(pricing.rappiPrice);
    if (pricing.pedidosyaPrice !== undefined) updateData.pedidosyaPrice = new Decimal(pricing.pedidosyaPrice);
    if (pricing.uberPrice !== undefined) updateData.uberPrice = new Decimal(pricing.uberPrice);
    if (pricing.cafePrice !== undefined) updateData.cafePrice = new Decimal(pricing.cafePrice);

    return this.prisma.product.update({
      where: { id: productId },
      data: updateData,
    });
  }

  async bulkUpdatePlatformAvailability(updates: Array<{ productId: string; platform: string; available: boolean }>) {
    const transactions = updates.map(update => {
      const updateData: Prisma.ProductUpdateInput = {};
      
      switch (update.platform) {
        case 'rappi':
          updateData.availableOnRappi = update.available;
          break;
        case 'pedidosya':
          updateData.availableOnPedidosya = update.available;
          break;
        case 'uber':
          updateData.availableOnUber = update.available;
          break;
      }

      return this.prisma.product.update({
        where: { id: update.productId },
        data: updateData,
      });
    });

    await this.prisma.$transaction(transactions);
    return { success: true, updatedCount: updates.length };
  }

  async syncWithPlatforms(productIds?: string[]) {
    // Use the real platform integration service
    return this.platformIntegration.syncAllPlatforms(productIds);
  }

  async getPlatformSyncStatus() {
    // Use the real platform integration service for detailed sync status
    return this.platformIntegration.getPlatformSyncStatus();
  }

  async updateTaskAssignees(taskId: string, userIds: string[]) {
    // This method exists in the frontend but should be in tasks service
    // Adding here for compatibility
    throw new BadRequestException('This method should be called on the tasks service');
  }

  async getMyTasks() {
    // This method exists in the frontend but should be in tasks service
    // Adding here for compatibility
    throw new BadRequestException('This method should be called on the tasks service');
  }
}
