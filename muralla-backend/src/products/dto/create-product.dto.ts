import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsInt, Min, Max, IsNumber } from 'class-validator';
import { ProductType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsEnum(ProductType)
  type: ProductType;

  @IsString()
  uom: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber()
  price?: number;

  // Phase 1: Multi-Platform Integration Fields
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  // Platform-Specific Pricing
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber()
  cafePrice?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber()
  rappiPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber()
  pedidosyaPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber()
  uberPrice?: number;

  // Min/Max Quantities
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minOrderQuantity?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(1000)
  maxOrderQuantity?: number = 100;

  // Platform Availability
  @IsOptional()
  @IsBoolean()
  availableOnRappi?: boolean = false;

  @IsOptional()
  @IsBoolean()
  availableOnPedidosya?: boolean = false;

  @IsOptional()
  @IsBoolean()
  availableOnUber?: boolean = false;

  @IsOptional()
  @IsBoolean()
  availableInCafe?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
