import { PartialType } from '@nestjs/mapped-types';
import { CreateEntityRelationshipDto } from './create-entity-relationship.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateEntityRelationshipDto extends PartialType(CreateEntityRelationshipDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}