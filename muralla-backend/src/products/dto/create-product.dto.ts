import { IsString, IsOptional, IsEnum, IsDecimal, IsBoolean } from 'class-validator';
import { ProductType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProductType)
  type: ProductType;

  @IsString()
  uom: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }) => value ? new Decimal(value) : undefined)
  @IsDecimal()
  unitCost?: Decimal;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
