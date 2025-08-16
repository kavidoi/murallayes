import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsISO8601, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

// Local enum mirrors for validation (Prisma enums are types-only at runtime)
export const DocumentKindValues = ['FACTURA', 'BOLETA', 'RECIBO', 'OTRO'] as const;
export type DocumentKindDto = typeof DocumentKindValues[number];

export const PayerTypeValues = ['COMPANY', 'STAFF'] as const;
export type PayerTypeDto = typeof PayerTypeValues[number];

export class AttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsObject()
  ocrJson?: Record<string, any>;

  // New preferred name matching Prisma schema (kept optional for compatibility)
  @IsOptional()
  @IsObject()
  ocrData?: Record<string, any>;

  @IsOptional()
  @IsString()
  uploadedBy?: string;
}

export class CostLineDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsBoolean()
  isInventory?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  qty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCostDto {
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsIn(DocumentKindValues)
  docType!: DocumentKindDto;

  @IsOptional()
  @IsString()
  docNumber?: string;

  @IsISO8601()
  date!: string;

  @Type(() => Number)
  @IsNumber()
  total!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsIn(PayerTypeValues)
  payerType?: PayerTypeDto;

  @IsOptional()
  @IsString()
  payerCompanyId?: string;

  @IsOptional()
  @IsString()
  staffId?: string;

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostLineDto)
  lines?: CostLineDto[];
}
