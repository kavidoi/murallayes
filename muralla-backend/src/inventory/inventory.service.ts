import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMoveDto } from './dto/create-move.dto';
import { StockFiltersDto } from './dto/stock-filters.dto';
import { TransferDto } from './dto/transfer.dto';
import { AdjustmentDto } from './dto/adjustment.dto';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

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
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: productWhere,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where: productWhere }),
    ]);

    const stockItems = products.map(product => ({
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      currentStock: product.stock,
      price: product.price,
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
    // Placeholder until migration is complete
    throw new BadRequestException('WAVG calculation will be available after database migration');
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
}
