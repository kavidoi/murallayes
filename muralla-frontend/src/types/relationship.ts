export interface EntityRelationship {
  id: string;
  relationshipType: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
  strength?: number;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  priority: number;
  tags: string[];
  createdBy?: string;
  tenantId?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
  relationshipHistory?: Record<string, any>;
  lastInteractionAt?: string;
  interactionCount: number;
}

export interface RelationshipType {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  sourceTypes: string[];
  targetTypes: string[];
  isBidirectional: boolean;
  reverseTypeName?: string;
  defaultStrength: number;
  isSystem: boolean;
  isActive: boolean;
  color?: string;
  icon?: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntitySKU {
  id: string;
  entityType: string;
  entityId: string;
  skuValue: string;
  templateId?: string;
  components: Record<string, any>;
  isActive: boolean;
  version: number;
  generatedAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
  tenantId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  template?: SKUTemplate;
}

export interface SKUTemplate {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  template: string;
  components: Record<string, any>;
  isActive: boolean;
  isDefault: boolean;
  validationRules?: Record<string, any>;
  exampleOutput?: string;
  tenantId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  lastUsedAt?: string;
}

export interface MentionData {
  entityType: string;
  entityId: string;
  text: string;
  position?: number;
}

export interface RelationshipFilters {
  sourceType?: string;
  sourceId?: string;
  targetType?: string;
  targetId?: string;
  relationshipType?: string;
  minStrength?: number;
  maxStrength?: number;
  tags?: string[];
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface RelationshipCreateData {
  relationshipType: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  strength?: number;
  metadata?: Record<string, any>;
  tags?: string[];
  priority?: number;
  validFrom?: string;
  validUntil?: string;
}

export interface RelationshipUpdateData {
  strength?: number;
  metadata?: Record<string, any>;
  tags?: string[];
  priority?: number;
  isActive?: boolean;
  validFrom?: string;
  validUntil?: string;
}