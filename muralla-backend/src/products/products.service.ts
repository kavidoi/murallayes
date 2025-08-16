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
      // Ensure required fields are set for current schema
      const productData = {
        ...createProductDto,
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

  async findAll(filters: ProductFiltersDto) {
    const { search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
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
