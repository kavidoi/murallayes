import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntityRelationshipDto } from './dto/create-entity-relationship.dto';
import { UpdateEntityRelationshipDto } from './dto/update-entity-relationship.dto';
import { EntityRelationshipFiltersDto } from './dto/entity-relationship-filters.dto';

@Injectable()
export class EntityRelationshipService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateEntityRelationshipDto, tenantId?: string): Promise<any> {
    try {
      // Check if relationship already exists to prevent duplicates
      const existingRelationship = await this.prisma.entityRelationship.findFirst({
        where: {
          sourceType: createDto.sourceType,
          sourceId: createDto.sourceId,
          targetType: createDto.targetType,
          targetId: createDto.targetId,
          relationshipType: createDto.relationshipType,
          isDeleted: false,
        },
      });

      if (existingRelationship) {
        // Update existing relationship instead of creating duplicate
        return this.update(existingRelationship.id, {
          strength: createDto.strength,
          metadata: createDto.metadata,
          tags: createDto.tags,
          priority: createDto.priority,
        }, tenantId);
      }

      const relationship = await this.prisma.entityRelationship.create({
        data: {
          ...createDto,
          tenantId,
          lastInteractionAt: new Date(),
          interactionCount: 1,
        },
      });

      // Create bidirectional relationship if specified in relationship type
      const relationshipType = await this.getRelationshipType(createDto.relationshipType);
      if (relationshipType?.isBidirectional && relationshipType.reverseTypeName) {
        await this.createReverseRelationship(relationship, relationshipType.reverseTypeName, tenantId);
      }

      return relationship;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Relationship already exists');
      }
      throw error;
    }
  }

  private async createReverseRelationship(
    originalRelationship: any,
    reverseTypeName: string,
    tenantId?: string,
  ): Promise<void> {
    await this.prisma.entityRelationship.create({
      data: {
        relationshipType: reverseTypeName,
        sourceType: originalRelationship.targetType,
        sourceId: originalRelationship.targetId,
        targetType: originalRelationship.sourceType,
        targetId: originalRelationship.sourceId,
        strength: originalRelationship.strength,
        metadata: originalRelationship.metadata,
        tags: originalRelationship.tags,
        priority: originalRelationship.priority,
        tenantId,
        lastInteractionAt: new Date(),
        interactionCount: 1,
      },
    });
  }

  async findAll(filters: EntityRelationshipFiltersDto, tenantId?: string) {
    const {
      sourceType,
      sourceId,
      targetType,
      targetId,
      relationshipType,
      minStrength,
      maxStrength,
      tags,
      isActive,
      page = 1,
      limit = 50,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      isDeleted: false,
      ...(sourceType && { sourceType }),
      ...(sourceId && { sourceId }),
      ...(targetType && { targetType }),
      ...(targetId && { targetId }),
      ...(relationshipType && { relationshipType }),
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(minStrength && { strength: { gte: minStrength } }),
      ...(maxStrength && { strength: { lte: maxStrength } }),
      ...(tags?.length && {
        tags: {
          hasSome: tags,
        },
      }),
    };

    const [relationships, total] = await Promise.all([
      this.prisma.entityRelationship.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { strength: 'desc' },
          { lastInteractionAt: 'desc' },
        ],
      }),
      this.prisma.entityRelationship.count({ where }),
    ]);

    return {
      data: relationships,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId?: string): Promise<any> {
    const relationship = await this.prisma.entityRelationship.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!relationship) {
      throw new NotFoundException(`Relationship with ID ${id} not found`);
    }

    return relationship;
  }

  async update(
    id: string,
    updateDto: UpdateEntityRelationshipDto,
    tenantId?: string,
  ): Promise<any> {
    await this.findOne(id, tenantId);

    return this.prisma.entityRelationship.update({
      where: { id },
      data: {
        ...updateDto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string, tenantId?: string): Promise<void> {
    await this.findOne(id, tenantId);

    await this.prisma.entityRelationship.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async getEntityRelationships(
    entityType: string,
    entityId: string,
    tenantId?: string,
  ): Promise<any[]> {
    return this.prisma.entityRelationship.findMany({
      where: {
        OR: [
          { sourceType: entityType, sourceId: entityId },
          { targetType: entityType, targetId: entityId },
        ],
        tenantId,
        isDeleted: false,
        isActive: true,
      },
      orderBy: [
        { priority: 'desc' },
        { strength: 'desc' },
      ],
    });
  }

  async createRelationshipFromMention(
    mentionData: {
      sourceType: string;
      sourceId: string;
      targetType: string;
      targetId: string;
      contextType?: string;
      contextData?: any;
    },
    tenantId?: string,
  ): Promise<any> {
    return this.create(
      {
        relationshipType: 'mentioned_in',
        sourceType: mentionData.targetType, // The mentioned entity
        sourceId: mentionData.targetId,
        targetType: mentionData.sourceType, // The entity doing the mentioning
        targetId: mentionData.sourceId,
        strength: 1,
        metadata: {
          contextType: mentionData.contextType,
          contextData: mentionData.contextData,
          createdFrom: 'mention',
          timestamp: new Date(),
        },
        tags: ['mention', mentionData.contextType].filter(Boolean),
      },
      tenantId,
    );
  }

  async incrementInteractionCount(
    sourceType: string,
    sourceId: string,
    targetType: string,
    targetId: string,
    relationshipType: string,
    tenantId?: string,
  ): Promise<void> {
    const relationship = await this.prisma.entityRelationship.findFirst({
      where: {
        sourceType,
        sourceId,
        targetType,
        targetId,
        relationshipType,
        tenantId,
        isDeleted: false,
      },
    });

    if (relationship) {
      await this.prisma.entityRelationship.update({
        where: { id: relationship.id },
        data: {
          interactionCount: { increment: 1 },
          lastInteractionAt: new Date(),
        },
      });
    }
  }

  async getRelationshipSuggestions(
    entityType: string,
    entityId: string,
    targetType: string,
    tenantId?: string,
  ): Promise<any[]> {
    // Get entities of targetType that are frequently related to similar entities
    const suggestions = await this.prisma.$queryRaw`
      SELECT 
        er.target_type as "targetType",
        er.target_id as "targetId",
        COUNT(*) as relationship_count,
        AVG(er.strength::float) as avg_strength
      FROM entity_relationships er
      WHERE er.source_type = ${entityType}
        AND er.target_type = ${targetType}
        AND er.tenant_id = ${tenantId}
        AND er.is_deleted = false
        AND er.is_active = true
        AND er.source_id != ${entityId}
      GROUP BY er.target_type, er.target_id
      ORDER BY relationship_count DESC, avg_strength DESC
      LIMIT 10
    `;

    return suggestions as any[];
  }

  private async getRelationshipType(typeName: string) {
    return this.prisma.relationshipType.findUnique({
      where: { name: typeName },
    });
  }

  async getRelationshipTypes() {
    return this.prisma.relationshipType.findMany({
      orderBy: { displayName: 'asc' },
    });
  }

  async getRelationshipStats(tenantId?: string): Promise<any> {
    const stats = await this.prisma.entityRelationship.groupBy({
      by: ['relationshipType', 'sourceType', 'targetType'],
      _count: true,
      _avg: { strength: true },
      where: {
        tenantId,
        isDeleted: false,
        isActive: true,
      },
    });

    return stats.map(stat => ({
      relationshipType: stat.relationshipType,
      sourceType: stat.sourceType,
      targetType: stat.targetType,
      count: stat._count,
      avgStrength: stat._avg.strength,
    }));
  }

  async detectSupplierRelationships(tenantId?: string): Promise<any[]> {
    // Auto-detect supplier relationships based on cost patterns
    const supplierRelationships = await this.prisma.$queryRaw`
      SELECT 
        'Contact' as source_type,
        c.id as source_id,
        'Product' as target_type,
        p.id as target_id,
        COUNT(*) as interaction_count,
        SUM(cl.total_cost) as total_value
      FROM costs cost
      JOIN cost_lines cl ON cost.id = cl.cost_id
      JOIN products p ON cl.product_id = p.id
      LEFT JOIN contacts c ON c.name = cost.description OR c.company = cost.description
      WHERE cost.tenant_id = ${tenantId}
        AND cl.product_id IS NOT NULL
        AND c.id IS NOT NULL
      GROUP BY c.id, p.id
      HAVING COUNT(*) >= 2
      ORDER BY total_value DESC
    `;

    // Create relationships for detected patterns
    const createdRelationships = [];
    for (const pattern of supplierRelationships as any[]) {
      try {
        const relationship = await this.create(
          {
            relationshipType: 'supplies',
            sourceType: pattern.source_type,
            sourceId: pattern.source_id,
            targetType: pattern.target_type,
            targetId: pattern.target_id,
            strength: Math.min(5, Math.ceil(pattern.interaction_count / 2)),
            metadata: {
              autoDetected: true,
              totalValue: pattern.total_value,
              interactionCount: pattern.interaction_count,
              detectionDate: new Date(),
            },
            tags: ['auto-detected', 'supplier'],
          },
          tenantId,
        );
        createdRelationships.push(relationship);
      } catch (error) {
        // Skip duplicates
        continue;
      }
    }

    return createdRelationships;
  }
}