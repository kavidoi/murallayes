import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsBoolean, IsNumber } from 'class-validator';

export enum ContactType {
  SUPPLIER = 'supplier',
  CUSTOMER = 'customer',
  IMPORTANT = 'important',
  BRAND = 'brand',
}

export enum EntityType {
  BUSINESS = 'business',
  PERSON = 'person',
}

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  BUSINESS = 'business',
}

export class BankDetailsDto {
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountHolder?: string;

  @IsOptional()
  @IsString()
  rutAccount?: string;
}

export class CreateContactDto {
  @IsString()
  name: string;

  @IsEnum(ContactType)
  type: ContactType;

  @IsEnum(EntityType)
  entityType: EntityType;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  rut?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  contactPersonName?: string;

  @IsOptional()
  @IsString()
  giro?: string;

  @IsOptional()
  @IsString()
  skuAbbreviation?: string;

  @IsOptional()
  @IsObject()
  bankDetails?: BankDetailsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  portalToken?: string;

  @IsOptional()
  @IsBoolean()
  portalEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  totalPurchases?: number;

  @IsOptional()
  @IsNumber()
  totalSales?: number;

  @IsOptional()
  @IsNumber()
  averagePurchase?: number;

  @IsOptional()
  @IsNumber()
  averageSale?: number;

  @IsOptional()
  @IsNumber()
  lastPurchaseAmount?: number;

  @IsOptional()
  @IsNumber()
  lastSaleAmount?: number;

  @IsOptional()
  @IsNumber()
  purchaseCount?: number;

  @IsOptional()
  @IsNumber()
  salesCount?: number;

  @IsOptional()
  @IsNumber()
  relationshipScore?: number;
}
