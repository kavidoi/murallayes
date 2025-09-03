import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntityRelationshipService } from '../relationships/entity-relationship.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { BOMComponentDto } from './dto/bom-component.dto';
import { SKUGeneratorService } from './sku-generator.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private skuGenerator: SKUGeneratorService,
    private entityRelationshipService: EntityRelationshipService
  ) {}

  async create(createProductDto: CreateProductDto): Promise<any> {
    try {
      // Generate intelligent SKU if not provided
      let sku = createProductDto.sku;
      if (!sku) {
        sku = await this.generateIntelligentSku(createProductDto);
      }

      // Remove categoryId from product data since it's now handled by EntityRelationship
      const { categoryId, ...productDataWithoutCategory } = createProductDto;
      const productData = {
        ...productDataWithoutCategory,
        sku,
        price: createProductDto.price || 0, // Set default price if not provided
      };

      const product = await this.prisma.product.create({
        data: productData,
      });

      // Create category relationship if categoryId was provided
      if (categoryId) {
        await this.entityRelationshipService.create({
          relationshipType: 'belongs_to_category',
          sourceType: 'Product',
          sourceId: product.id,
          targetType: 'ProductCategory',
          targetId: categoryId,
          strength: 5,
          metadata: { assignedAt: new Date() }
        });
      }

      return product;
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

    // Get product IDs that belong to the specified category (if categoryId filter is provided)
    let categoryFilteredProductIds: string[] | undefined;
    if (categoryId) {
      const categoryRelationships = await this.entityRelationshipService.findAll({
        relationshipType: 'belongs_to_category',
        targetType: 'ProductCategory',
        targetId: categoryId
      });
      categoryFilteredProductIds = categoryRelationships.data.map(rel => rel.sourceId);
    }

    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
      ...(type ? { type } : {}),
      ...(categoryFilteredProductIds ? { id: { in: categoryFilteredProductIds } } : {}),
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
        // REMOVED: include: { category: true } - now handled by EntityRelationship
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

    // Add category information from EntityRelationship system
    const data = await Promise.all(products.map(async (p) => {
      // Get category relationship
      const allRelationships = await this.entityRelationshipService.getEntityRelationships('Product', p.id);
      const categoryRelationships = allRelationships.filter(rel => rel.relationshipType === 'belongs_to_category');
      
      let category = null;
      if (categoryRelationships.length > 0) {
        const categoryId = categoryRelationships[0].targetId;
        category = await this.prisma.productCategory.findUnique({ where: { id: categoryId } });
      }

      return {
        ...p,
        category,
        unitCost: avgCostByProductId[p.id] ?? (p.unitCost as any ?? p.price ?? 0),
      };
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
