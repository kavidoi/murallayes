import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkOrderDto } from './create-workorder.dto';
import { IsOptional, IsEnum } from 'class-validator';

enum WorkOrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateWorkOrderDto extends PartialType(CreateWorkOrderDto) {
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;
}
