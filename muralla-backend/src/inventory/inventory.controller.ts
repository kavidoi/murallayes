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
}
