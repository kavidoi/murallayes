import { PartialType } from '@nestjs/mapped-types';
import { CreateSKUTemplateDto } from './create-sku-template.dto';

export class UpdateSKUTemplateDto extends PartialType(CreateSKUTemplateDto) {}