import { IsString, IsOptional, IsInt, IsBoolean, IsArray, IsJSON, Min, Max } from 'class-validator';

export class CreateEntityRelationshipDto {
  @IsString()
  relationshipType: string;

  @IsString()
  sourceType: string;

  @IsString()
  sourceId: string;

  @IsString()
  targetType: string;

  @IsString()
  targetId: string;

  @IsOptional()
  @IsJSON()
  metadata?: any;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  strength?: number = 1;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  validFrom?: Date;

  @IsOptional()
  validUntil?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number = 1;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];
}