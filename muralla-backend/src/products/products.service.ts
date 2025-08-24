import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { BOMComponentDto } from './dto/bom-component.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<any> {
    try {
      // Generate intelligent SKU if not provided
      let sku = createProductDto.sku;
      if (!sku) {
        sku = await this.generateIntelligentSku(createProductDto);
      }

      // Ensure required fields are set for current schema
      const productData = {
        ...createProductDto,
        sku,
        price: createProductDto.price || 0, // Set default price if not provided
      };

      return await this.prisma.product.create({
        data: productData,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Product with this name already exists');
      }
      throw error;
    }
  }

  private async generateIntelligentSku(productData: CreateProductDto): Promise<string> {
    // Get category prefix if available
    let categoryPrefix = 'GEN';
    if (productData.categoryId) {
      const category = await this.prisma.productCategory.findUnique({
        where: { id: productData.categoryId }
      });
      if (category) {
        // Use first 3 letters of category name, uppercase
        categoryPrefix = category.name.substring(0, 3).toUpperCase();
      }
    }

    // Get product type prefix
    const typePrefix = productData.type === 'TERMINADO' ? 'MFG' : 'PUR';
    
    // Get current year (last 2 digits)
    const year = new Date().getFullYear().toString().slice(-2);
    
    // Get sequence number based on existing products
    const existingCount = await this.prisma.product.count({
      where: { 
        isDeleted: false,
        type: productData.type 
      }
    });
    const sequence = (existingCount + 1).toString().padStart(4, '0');
    
    // Generate SKU: CATEGORY-TYPE-YEAR-SEQUENCE
    // Example: CAF-PUR-25-0003 (Café purchased item #3 in 2025)
    return `${categoryPrefix}-${typePrefix}-${year}-${sequence}`;
  }

  async findAll(filters: ProductFiltersDto) {
    const { search, page, limit, type, categoryId, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
      ...(type ? { type } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Compute weighted average cost from CostLine for these products (sum totalCost / sum quantity)
    const productIds = products.map(p => p.id);
    let avgCostByProductId: Record<string, number> = {};
    if (productIds.length > 0) {
      const costAgg = await this.prisma.costLine.groupBy({
        by: ['productId'],
        _sum: { totalCost: true, quantity: true },
        where: {
          productId: { in: productIds },
          isInventory: true,
          totalCost: { not: null },
          quantity: { not: null },
        },
      });
      avgCostByProductId = Object.fromEntries(
        costAgg
          .filter(r => r._sum.quantity && (r._sum.quantity as any) !== 0)
          .map(r => {
            const sumTotal = Number(r._sum.totalCost);
            const sumQty = Number(r._sum.quantity);
            const avg = sumQty > 0 ? sumTotal / sumQty : 0;
            return [r.productId as string, avg];
          })
      );
    }

    const data = products.map(p => ({
      ...p,
      unitCost: avgCostByProductId[p.id] ?? (p.unitCost as any ?? p.price ?? 0),
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<any> {
    const product = await this.prisma.product.findFirst({
      where: { id, isDeleted: false },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<any> {
    await this.findOne(id); // Check if exists

    try {
      return await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Product with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists

    await this.prisma.product.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async getBOM(productId: string) {
    // Placeholder until migration is complete
    throw new BadRequestException('BOM feature will be available after database migration');
  }

  async calculateProductCost(id: string): Promise<{ unitCost: number; breakdown: any[] }> {
    const product = await this.findOne(id);
    
    // For now, return the price as unit cost until BOM is implemented
    return {
      unitCost: product.price || 0,
      breakdown: [],
    };
  }

  async getInventoryStock(id: string) {
    const product = await this.findOne(id);
    
    // For now, return the basic stock field until inventory moves are implemented
    return {
      productId: id,
      productName: product.name,
      totalStock: product.stock,
      stockByLocation: [
        {
          locationId: 'default',
          locationName: 'Default Location',
          quantity: product.stock,
        },
      ],
    };
  }
}
