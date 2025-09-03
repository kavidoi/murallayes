import { IsString, IsOptional, IsBoolean, IsJSON } from 'class-validator';

export class CreateSKUTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  entityType: string;

  @IsString()
  template: string; // e.g., "{category}-{supplier}-{format}-{sequence}"

  @IsJSON()
  components: Record<string, any>; // Component definitions and rules

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @IsOptional()
  @IsJSON()
  validationRules?: any;

  @IsOptional()
  @IsString()
  exampleOutput?: string;
}