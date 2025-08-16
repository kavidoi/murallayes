import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

enum WorkOrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

enum WorkOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority = WorkOrderPriority.MEDIUM;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  batchCode?: string;

  @IsOptional()
  @Transform(({ value }) => value ? new Decimal(value) : undefined)
  estimatedCost?: Decimal;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
