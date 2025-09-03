import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandContactDto } from './create-brand-contact.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBrandContactDto extends PartialType(CreateBrandContactDto) {
  @IsOptional()
  @IsString()
  brandId?: string;
}
