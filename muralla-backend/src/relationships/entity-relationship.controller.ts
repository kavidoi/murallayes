import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EntityRelationshipService } from './entity-relationship.service';
import { CreateEntityRelationshipDto } from './dto/create-entity-relationship.dto';
import { UpdateEntityRelationshipDto } from './dto/update-entity-relationship.dto';
import { EntityRelationshipFiltersDto } from './dto/entity-relationship-filters.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('entity-relationships')
@UseGuards(JwtAuthGuard)
export class EntityRelationshipController {
  constructor(private readonly entityRelationshipService: EntityRelationshipService) {}

  @Post()
  async create(@Body() createDto: CreateEntityRelationshipDto) {
    return this.entityRelationshipService.create(createDto);
  }

  @Get()
  async findAll(@Query() filters: EntityRelationshipFiltersDto) {
    return this.entityRelationshipService.findAll(filters);
  }

  @Get('stats')
  async getStats() {
    return this.entityRelationshipService.getRelationshipStats();
  }

  @Get('types')
  async getRelationshipTypes() {
    return this.entityRelationshipService.getRelationshipTypes();
  }

  @Get('entity/:entityType/:entityId')
  async getEntityRelationships(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.entityRelationshipService.getEntityRelationships(entityType, entityId);
  }

  @Get('suggestions/:entityType/:entityId/:targetType')
  async getSuggestions(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Param('targetType') targetType: string,
  ) {
    return this.entityRelationshipService.getRelationshipSuggestions(
      entityType,
      entityId,
      targetType,
    );
  }

  @Post('detect-suppliers')
  async detectSuppliers() {
    return this.entityRelationshipService.detectSupplierRelationships();
  }

  @Post('mention')
  async createFromMention(@Body() mentionData: {
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    contextType?: string;
    contextData?: any;
  }) {
    return this.entityRelationshipService.createRelationshipFromMention(mentionData);
  }

  @Post('interaction')
  async recordInteraction(@Body() interactionData: {
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    relationshipType: string;
  }) {
    await this.entityRelationshipService.incrementInteractionCount(
      interactionData.sourceType,
      interactionData.sourceId,
      interactionData.targetType,
      interactionData.targetId,
      interactionData.relationshipType,
    );
    return { success: true };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.entityRelationshipService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEntityRelationshipDto,
  ) {
    return this.entityRelationshipService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.entityRelationshipService.remove(id);
    return { success: true };
  }
}