import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SKUGeneratorService } from './sku-generator.service';
import { PrismaService } from '../prisma/prisma.service';
import { RelationshipsModule } from '../relationships/relationships.module';

@Module({
  imports: [RelationshipsModule],
  controllers: [ProductsController],
  providers: [ProductsService, SKUGeneratorService, PrismaService],
  exports: [ProductsService, SKUGeneratorService],
})
export class ProductsModule {}
