import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateMoveDto } from './dto/create-move.dto';
import { StockFiltersDto } from './dto/stock-filters.dto';
import { TransferDto } from './dto/transfer.dto';
import { AdjustmentDto } from './dto/adjustment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import type {} from '../prisma-v6-compat';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Test endpoint without authentication for demo purposes
  @Get('test-stock')
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
      ],
      meta: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };
  }

  // Test platform sync status endpoint
  @Get('test-platform-sync-status')
  getTestPlatformSyncStatus() {
    return {
      totalProducts: 156,
      syncedProducts: 143,
      platformBreakdown: {
        rappi: { synced: 120, available: 135 },
        pedidosya: { synced: 98, available: 110 },
        uber: { synced: 85, available: 95 },
      },
      lastSyncAt: new Date(),
    };
  }

  // Inventory moves endpoints
  @Post('moves')
  @Roles('admin', 'manager', 'staff')
  createMove(@Body() createMoveDto: CreateMoveDto, @Request() req: any) {
    return this.inventoryService.createMove(createMoveDto, req.user.id);
  }

  @Get('moves')
  @Roles('admin', 'manager', 'staff')
  getMoves(@Query() filters: any) {
    return this.inventoryService.getMoves(filters);
  }

  // Stock management endpoints
  @Get('stock')
  @Roles('admin', 'manager', 'staff')
  getStock(@Query() filters: StockFiltersDto) {
    return this.inventoryService.getStock(filters);
  }

  @Post('transfer')
  @Roles('admin', 'manager')
  transfer(@Body() transferDto: TransferDto, @Request() req: any) {
    return this.inventoryService.transfer(transferDto, req.user.id);
  }

  @Post('adjustment')
  @Roles('admin', 'manager')
  adjustment(@Body() adjustmentDto: AdjustmentDto, @Request() req: any) {
    return this.inventoryService.adjustment(adjustmentDto, req.user.id);
  }

  // Valuation and reporting endpoints
  @Get('valuation')
  @Roles('admin', 'manager')
  getValuation(@Query('locationId') locationId?: string) {
    return this.inventoryService.getValuation(locationId);
  }

  @Get('wavg/:productId')
  @Roles('admin', 'manager', 'staff')
  calculateWAVG(
    @Param('productId') productId: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.inventoryService.calculateWAVG(productId, locationId);
  }

  @Get('availability/:productId')
  @Roles('admin', 'manager', 'staff')
  checkAvailability(
    @Param('productId') productId: string,
    @Query('quantity') quantity: string,
    @Query('locationId') locationId: string,
  ) {
    return this.inventoryService.checkAvailability(productId, parseFloat(quantity), locationId);
  }

  // Legacy endpoints for backward compatibility
  @Post('products')
  @Roles('admin', 'manager')
  createProduct(@Body() createProductDto: any) {
    return this.inventoryService.createProduct(createProductDto);
  }

  @Get('products')
  @Roles('admin', 'manager', 'staff')
  findAllProducts() {
    return this.inventoryService.findAllProducts();
  }

  @Get('products/:id')
  @Roles('admin', 'manager', 'staff')
  findOneProduct(@Param('id') id: string) {
    return this.inventoryService.findOneProduct(id);
  }

  @Patch('products/:id')
  @Roles('admin', 'manager')
  updateProduct(@Param('id') id: string, @Body() updateProductDto: any) {
    return this.inventoryService.updateProduct(id, updateProductDto);
  }

  @Delete('products/:id')
  @Roles('admin', 'manager')
  removeProduct(@Param('id') id: string) {
    return this.inventoryService.removeProduct(id);
  }

  @Post('sales')
  @Roles('admin', 'manager', 'staff')
  createSale(@Body() createSaleDto: any) {
    return this.inventoryService.createSale(createSaleDto);
  }

  @Get('sales')
  @Roles('admin', 'manager', 'staff')
  findAllSales(@Query('productId') productId?: string, @Query('sellerId') sellerId?: string) {
    if (productId) return this.inventoryService.findSalesByProduct(productId);
    if (sellerId) return this.inventoryService.findSalesBySeller(sellerId);
    return this.inventoryService.findAllSales();
  }

  // Multi-Platform Integration Endpoints
  @Patch(':productId/platform-availability')
  @Roles('admin', 'manager')
  updatePlatformAvailability(
    @Param('productId') productId: string,
    @Body() body: { platform: 'rappi' | 'pedidosya' | 'uber'; available: boolean },
  ) {
    return this.inventoryService.updatePlatformAvailability(productId, body.platform, body.available);
  }

  @Patch(':productId/platform-pricing')
  @Roles('admin', 'manager')
  updatePlatformPricing(
    @Param('productId') productId: string,
    @Body() pricing: any,
  ) {
    return this.inventoryService.updatePlatformPricing(productId, pricing);
  }

  @Patch('bulk-platform-availability')
  @Roles('admin', 'manager')
  bulkUpdatePlatformAvailability(
    @Body() body: { updates: Array<{ productId: string; platform: string; available: boolean }> },
  ) {
    return this.inventoryService.bulkUpdatePlatformAvailability(body.updates);
  }

  @Post('sync-platforms')
  @Roles('admin', 'manager')
  syncWithPlatforms(@Body() body: { productIds?: string[] }) {
    return this.inventoryService.syncWithPlatforms(body.productIds);
  }

  @Get('platform-sync-status')
  @Roles('admin', 'manager', 'staff')
  getPlatformSyncStatus() {
    return this.inventoryService.getPlatformSyncStatus();
  }
}