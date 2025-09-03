import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UniversalSKUService } from './universal-sku.service';
import { CreateSKUTemplateDto } from './dto/create-sku-template.dto';
import { UpdateSKUTemplateDto } from './dto/update-sku-template.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('sku')
@UseGuards(JwtAuthGuard)
export class UniversalSKUController {
  constructor(private readonly universalSKUService: UniversalSKUService) {}

  @Post('generate')
  async generateSKU(
    @Body() generateData: {
      entityType: string;
      entityId: string;
      templateId?: string;
      customComponents?: Record<string, any>;
    },
    @GetUser() user: any,
  ) {
    const sku = await this.universalSKUService.generateSKU(
      generateData.entityType,
      generateData.entityId,
      generateData.templateId,
      generateData.customComponents,
      user.tenantId,
    );
    return { sku };
  }

  @Post('preview')
  async previewSKU(
    @Body() body: {
      entityType: string;
      entityId: string;
      templateId?: string;
      customComponents?: Record<string, any>;
    },
    @GetUser() user: any,
  ) {
    // For preview, we don't save to database
    const template = body.templateId
      ? await this.universalSKUService.getSKUTemplate(body.templateId)
      : await this.universalSKUService['getDefaultTemplate'](body.entityType, user.tenantId);

    if (!template) {
      throw new Error('No template found');
    }

    // Get entity data
    const entityData = await this.universalSKUService['getEntityData'](
      body.entityType,
      body.entityId,
      user.tenantId,
    );

    // Resolve components
    const components = await this.universalSKUService['resolveTemplateComponents'](
      template,
      entityData,
      body.customComponents,
      user.tenantId,
    );

    // Generate SKU string
    const skuValue = this.universalSKUService['generateSKUFromTemplate'](
      template.template,
      components,
    );

    return {
      sku: skuValue,
      components,
      template: {
        id: template.id,
        name: template.name,
        template: template.template,
      },
    };
  }

  @Get('entity/:entityType/:entityId')
  async getEntitySKU(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @GetUser() user: any,
  ) {
    return this.universalSKUService.getEntitySKU(entityType, entityId, user.tenantId);
  }

  @Post('validate')
  async validateSKU(@Body() validateData: { sku: string }) {
    return this.universalSKUService.validateSKU(validateData.sku);
  }

  // Template management endpoints
  @Post('templates')
  async createTemplate(
    @Body() createDto: CreateSKUTemplateDto,
    @GetUser() user: any,
  ) {
    return this.universalSKUService.createSKUTemplate(createDto, user.tenantId);
  }

  @Get('templates')
  async getAllTemplates(
    @GetUser() user: any,
    @Query('entityType') entityType?: string,
  ) {
    return this.universalSKUService.getAllSKUTemplates(entityType, user.tenantId);
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.universalSKUService.getSKUTemplate(id);
  }

  @Patch('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateSKUTemplateDto,
  ) {
    return this.universalSKUService.updateSKUTemplate(id, updateDto);
  }

  @Get('templates/default/:entityType')
  async getDefaultTemplate(
    @Param('entityType') entityType: string,
    @GetUser() user: any,
  ) {
    return this.universalSKUService.getDefaultTemplate(entityType, user.tenantId);
  }
}