import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

enum InventoryMoveType {
  ENTRADA_COMPRA = 'ENTRADA_COMPRA',
  ENTRADA_PRODUCCION = 'ENTRADA_PRODUCCION',
  SALIDA_VENTA = 'SALIDA_VENTA',
  SALIDA_PRODUCCION = 'SALIDA_PRODUCCION',
  TRASLADO = 'TRASLADO',
  AJUSTE = 'AJUSTE',
  MERMA = 'MERMA',
}

export class CreateMoveDto {
  @IsEnum(InventoryMoveType)
  type: InventoryMoveType;

  @IsString()
  productId: string;

  @IsString()
  fromLocationId?: string;

  @IsOptional()
  @IsString()
  toLocationId?: string;

  @IsOptional()
  @Transform(({ value }) => new Decimal(value))
  quantity?: Decimal;

  @IsOptional()
  @Transform(({ value }) => value ? new Decimal(value) : undefined)
  unitCost?: Decimal;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  lotCode?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
