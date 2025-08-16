import { IsString, IsDecimal, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class TransferDto {
  @IsString()
  productId: string;

  @IsString()
  fromLocationId: string;

  @IsString()
  toLocationId: string;

  @Transform(({ value }) => new Decimal(value))
  @IsDecimal()
  quantity: Decimal;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  lotCode?: string;
}
