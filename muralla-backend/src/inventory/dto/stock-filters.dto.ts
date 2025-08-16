import { IsOptional, IsString, IsBoolean, IsInt, Min, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';

enum ProductType {
  MATERIA_PRIMA = 'MATERIA_PRIMA',
  INSUMO = 'INSUMO',
  SEMI_TERMINADO = 'SEMI_TERMINADO',
  TERMINADO = 'TERMINADO',
}

export class StockFiltersDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  lowStock?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}
