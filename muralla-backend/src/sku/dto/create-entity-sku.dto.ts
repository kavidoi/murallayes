import { IsString, IsOptional, IsBoolean, IsInt, IsJSON, Min } from 'class-validator';

export class CreateEntitySKUDto {
  @IsString()
  entityType: string;

  @IsString()
  entityId: string;

  @IsString()
  skuValue: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsJSON()
  components?: Record<string, any> = {};

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number = 1;

  @IsOptional()
  expiresAt?: Date;

  @IsOptional()
  @IsJSON()
  metadata?: any;
}