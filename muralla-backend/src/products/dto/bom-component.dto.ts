import { IsString, IsDecimal, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class BOMComponentDto {
  @IsString()
  componentId: string;

  @Transform(({ value }) => new Decimal(value))
  @IsDecimal()
  quantity: Decimal;

  @IsString()
  uom: string;

  @IsOptional()
  @Transform(({ value }) => value ? new Decimal(value) : undefined)
  @IsDecimal()
  unitCost?: Decimal;

  @IsOptional()
  @IsString()
  notes?: string;
}
