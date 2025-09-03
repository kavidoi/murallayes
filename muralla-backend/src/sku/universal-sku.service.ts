import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntitySKUDto } from './dto/create-entity-sku.dto';
import { CreateSKUTemplateDto } from './dto/create-sku-template.dto';
import { UpdateSKUTemplateDto } from './dto/update-sku-template.dto';

@Injectable()
export class UniversalSKUService {
  constructor(private prisma: PrismaService) {}

  async generateSKU(
    entityType: string,
    entityId: string,
    templateId?: string,
    customComponents?: Record<string, any>,
    tenantId?: string,
  ): Promise<string> {
    // Get template (specified or default for entity type)
    const template = templateId
      ? await this.getSKUTemplate(templateId)
      : await this.getDefaultTemplate(entityType, tenantId);

    if (!template) {
      throw new NotFoundException(`No SKU template found for entity type: ${entityType}`);
    }

    // Get entity data for component resolution
    const entityData = await this.getEntityData(entityType, entityId, tenantId);
    
    // Resolve template components
    const components = await this.resolveTemplateComponents(
      template,
      entityData,
      customComponents,
      tenantId,
    );

    // Generate SKU string from template
    const skuValue = this.generateSKUFromTemplate(template.template, components);

    // Ensure uniqueness
    const uniqueSKU = await this.ensureUniqueSKU(skuValue);

    // Save to database
    await this.createEntitySKU({
      entityType,
      entityId,
      skuValue: uniqueSKU,
      templateId: template.id,
      components,
    }, tenantId);

    // Update template usage stats
    await this.updateTemplateUsage(template.id);

    return uniqueSKU;
  }

  private async resolveTemplateComponents(
    template: any,
    entityData: any,
    customComponents?: Record<string, any>,
    tenantId?: string,
  ): Promise<Record<string, any>> {
    const components: Record<string, any> = {};
    const componentDefs = template.components as Record<string, any>;

    for (const [key, definition] of Object.entries(componentDefs)) {
      const def = definition as any;
      
      if (customComponents?.[key]) {
        components[key] = customComponents[key];
        continue;
      }

      switch (def.type) {
        case 'entity_field':
          components[key] = this.getNestedValue(entityData, def.field) || def.default || '';
          break;

        case 'relationship':
          components[key] = await this.resolveRelationshipComponent(
            def,
            entityData,
            tenantId,
          );
          break;

        case 'sequence':
          components[key] = await this.generateSequence(def, template.entityType, tenantId);
          break;

        case 'date':
          components[key] = this.formatDate(new Date(), def.format || 'YYMMDD');
          break;

        case 'category_code':
          components[key] = await this.getCategoryCode(
            entityData.categoryId || entityData.category?.id,
            def.length || 3,
          );
          break;

        case 'supplier_code':
          components[key] = await this.getSupplierCode(entityData, def.length || 3);
          break;

        case 'static':
          components[key] = def.value || '';
          break;

        default:
          components[key] = def.default || '';
      }
    }

    return components;
  }

  private async resolveRelationshipComponent(
    definition: any,
    entityData: any,
    tenantId?: string,
  ): Promise<string> {
    // Find related entity through relationship system
    const relationships = await this.prisma.entityRelationship.findMany({
      where: {
        OR: [
          {
            sourceType: entityData.entityType || 'Product',
            sourceId: entityData.id,
            relationshipType: definition.relationshipType,
          },
          {
            targetType: entityData.entityType || 'Product',
            targetId: entityData.id,
            relationshipType: definition.relationshipType,
          },
        ],
        tenantId,
        isDeleted: false,
        isActive: true,
      },
      orderBy: { strength: 'desc' },
      take: 1,
    });

    if (relationships.length === 0) {
      return definition.default || '';
    }

    const relationship = relationships[0];
    const relatedEntityId = relationship.sourceId === entityData.id 
      ? relationship.targetId 
      : relationship.sourceId;
    const relatedEntityType = relationship.sourceId === entityData.id 
      ? relationship.targetType 
      : relationship.sourceType;

    // Get the related entity data
    const relatedData = await this.getEntityData(relatedEntityType, relatedEntityId, tenantId);
    
    // Extract the desired field from related entity
    return this.getNestedValue(relatedData, definition.field) || definition.default || '';
  }

  private async generateSequence(
    definition: any,
    entityType: string,
    tenantId?: string,
  ): Promise<string> {
    const whereClause = definition.scope === 'global' ? {} : { entityType, tenantId };
    
    const count = await this.prisma.entitySKU.count({
      where: {
        ...whereClause,
        isActive: true,
      },
    });

    const sequence = count + 1;
    const length = definition.length || 4;
    
    return sequence.toString().padStart(length, '0');
  }

  private async getCategoryCode(categoryId?: string, length: number = 3): Promise<string> {
    if (!categoryId) return 'GEN';

    const category = await this.prisma.productCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) return 'GEN';

    // Use code if available, otherwise abbreviate name
    return category.code || category.name.substring(0, length).toUpperCase();
  }

  private async getSupplierCode(entityData: any, length: number = 3): Promise<string> {
    // Look for supplier relationship
    const supplierRelationship = await this.prisma.entityRelationship.findFirst({
      where: {
        sourceType: entityData.entityType || 'Product',
        sourceId: entityData.id,
        relationshipType: 'supplier',
        isDeleted: false,
        isActive: true,
      },
      orderBy: { strength: 'desc' },
    });

    if (!supplierRelationship) return 'GEN';

    const supplier = await this.prisma.contact.findUnique({
      where: { id: supplierRelationship.targetId },
    });

    if (!supplier) return 'GEN';

    // Use SKU abbreviation if available, otherwise abbreviate name
    return supplier.skuAbbreviation || supplier.name.substring(0, length).toUpperCase();
  }

  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('YY', year.slice(-2))
      .replace('MM', month)
      .replace('DD', day);
  }

  private generateSKUFromTemplate(template: string, components: Record<string, any>): string {
    let sku = template;
    
    for (const [key, value] of Object.entries(components)) {
      const placeholder = `{${key}}`;
      sku = sku.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value.toString());
    }

    return sku.toUpperCase();
  }

  private async ensureUniqueSKU(baseSKU: string): Promise<string> {
    let sku = baseSKU;
    let counter = 1;

    while (await this.skuExists(sku)) {
      sku = `${baseSKU}-${counter.toString().padStart(2, '0')}`;
      counter++;
    }

    return sku;
  }

  private async skuExists(sku: string): Promise<boolean> {
    const existing = await this.prisma.entitySKU.findUnique({
      where: { skuValue: sku },
    });
    return !!existing;
  }

  private async getEntityData(
    entityType: string,
    entityId: string,
    tenantId?: string,
  ): Promise<any> {
    const modelName = this.getModelName(entityType);
    const entity = await (this.prisma as any)[modelName].findFirst({
      where: { 
        id: entityId,
        ...(tenantId && { tenantId }),
        isDeleted: false,
      },
      include: this.getIncludeClause(entityType),
    });

    return { ...entity, entityType };
  }

  private getModelName(entityType: string): string {
    const modelMap: Record<string, string> = {
      'Product': 'product',
      'Contact': 'contact',
      'WorkOrder': 'workOrder',
      'Task': 'task',
      'Project': 'project',
      'User': 'user',
      'Budget': 'budget',
    };

    return modelMap[entityType] || entityType.toLowerCase();
  }

  private getIncludeClause(entityType: string): any {
    const includeMap: Record<string, any> = {
      'Product': { category: true },
      'Task': { project: true, assignee: true },
      'WorkOrder': { product: true, company: true },
      'Budget': { project: true },
    };

    return includeMap[entityType] || {};
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Template management methods
  async createSKUTemplate(createDto: CreateSKUTemplateDto, tenantId?: string): Promise<any> {
    return this.prisma.sKUTemplate.create({
      data: {
        ...createDto,
        tenantId,
      },
    });
  }

  async getSKUTemplate(id: string): Promise<any> {
    const template = await this.prisma.sKUTemplate.findUnique({
      where: { id, isActive: true },
    });

    if (!template) {
      throw new NotFoundException(`SKU template with ID ${id} not found`);
    }

    return template;
  }

  async getDefaultTemplate(entityType: string, tenantId?: string): Promise<any> {
    return this.prisma.sKUTemplate.findFirst({
      where: {
        entityType,
        isDefault: true,
        isActive: true,
        tenantId,
      },
    });
  }

  async updateSKUTemplate(
    id: string,
    updateDto: UpdateSKUTemplateDto,
  ): Promise<any> {
    await this.getSKUTemplate(id);

    return this.prisma.sKUTemplate.update({
      where: { id },
      data: updateDto,
    });
  }

  async createEntitySKU(createDto: CreateEntitySKUDto, tenantId?: string): Promise<any> {
    try {
      return await this.prisma.entitySKU.create({
        data: {
          ...createDto,
          tenantId,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Entity already has a SKU assigned');
      }
      throw error;
    }
  }

  async getEntitySKU(entityType: string, entityId: string, tenantId?: string): Promise<any> {
    return this.prisma.entitySKU.findFirst({
      where: {
        entityType,
        entityId,
        tenantId,
        isActive: true,
      },
      include: {
        template: true,
      },
    });
  }

  private async updateTemplateUsage(templateId: string): Promise<void> {
    await this.prisma.sKUTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }

  async getAllSKUTemplates(entityType?: string, tenantId?: string): Promise<any[]> {
    return this.prisma.sKUTemplate.findMany({
      where: {
        ...(entityType && { entityType }),
        tenantId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async validateSKU(sku: string): Promise<{ isValid: boolean; reason?: string }> {
    if (!sku || sku.length < 3) {
      return { isValid: false, reason: 'SKU too short' };
    }

    if (await this.skuExists(sku)) {
      return { isValid: false, reason: 'SKU already exists' };
    }

    return { isValid: true };
  }
}