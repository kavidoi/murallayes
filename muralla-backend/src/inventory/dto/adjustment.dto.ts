import { IsString, IsDecimal, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class AdjustmentDto {
  @IsString()
  productId: string;

  @IsString()
  locationId: string;

  @Transform(({ value }) => new Decimal(value))
  @IsDecimal()
  quantity: Decimal;

  @IsString()
  reason: string;

  @IsOptional()
  @Transform(({ value }) => value ? new Decimal(value) : undefined)
  @IsDecimal()
  unitCost?: Decimal;

  @IsOptional()
  @IsString()
  lotCode?: string;
}
