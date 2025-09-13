import { IsString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';

export class CreateNotificationTemplateDto {
  @IsString()
  name: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsEnum(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
  type: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}

export class UpdateNotificationTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsEnum(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
  type?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}

export class CreateNotificationRuleDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(['PROJECT_CREATED', 'TASK_ASSIGNED', 'DEADLINE_APPROACHING', 'CUSTOM'])
  trigger: string;

  @IsArray()
  conditions: any[];

  @IsArray()
  actions: any[];

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class UpdateNotificationRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['PROJECT_CREATED', 'TASK_ASSIGNED', 'DEADLINE_APPROACHING', 'CUSTOM'])
  trigger?: string;

  @IsOptional()
  @IsArray()
  conditions?: any[];

  @IsOptional()
  @IsArray()
  actions?: any[];

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SendNotificationDto {
  @IsArray()
  recipients: string[];

  @IsOptional()
  @IsArray()
  recipientIds?: string[];

  @IsString()
  templateId: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class NotificationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
  type?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ'])
  status?: string;

  @IsOptional()
  @IsString()
  contextType?: string;

  @IsOptional()
  @IsString()
  contextId?: string;

  @IsOptional()
  @IsNumber()
  first?: number;

  @IsOptional()
  @IsString()
  after?: string;
}