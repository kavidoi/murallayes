import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { BOMComponentDto } from './dto/bom-component.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles('admin', 'manager')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query() filters: ProductFiltersDto) {
    return this.productsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get(':id/bom')
  getBOM(@Param('id') id: string) {
    return this.productsService.getBOM(id);
  }

  @Put(':id/bom')
  @Roles('admin', 'manager')
  updateBOM(@Param('id') id: string, @Body() components: BOMComponentDto[]) {
    throw new BadRequestException('BOM feature will be available after database migration');
  }

  @Post(':id/calculate-cost')
  @Roles('admin', 'manager')
  calculateProductCost(@Param('id') id: string) {
    return this.productsService.calculateProductCost(id);
  }

  @Get(':id/stock')
  getInventoryStock(@Param('id') id: string) {
    return this.productsService.getInventoryStock(id);
  }

  // --- Categories ---
  @Get('categories/all')
  findAllCategories() {
    return this.prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  @Post('categories')
  @Roles('admin', 'manager')
  createCategory(@Body() data: { name: string; description?: string; color?: string; isInventory?: boolean; parentId?: string }) {
    return this.prisma.productCategory.create({ data });
  }

  @Patch('categories/:id')
  @Roles('admin', 'manager')
  updateCategory(@Param('id') id: string, @Body() data: Partial<{ name: string; description?: string; color?: string; isInventory?: boolean; parentId?: string }>) {
    return this.prisma.productCategory.update({ where: { id }, data });
  }
}
