import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const relationshipTypes = [
  // Product relationships
  {
    name: 'supplier',
    displayName: 'Supplier',
    description: 'Entity supplies products/services to another entity',
    sourceTypes: ['Contact', 'Vendor'],
    targetTypes: ['Product'],
    isBidirectional: true,
    reverseTypeName: 'supplied_by',
    defaultStrength: 3,
    isSystem: true,
    color: '#2563eb',
    icon: 'truck',
  },
  {
    name: 'supplied_by',
    displayName: 'Supplied By',
    description: 'Entity is supplied by another entity',
    sourceTypes: ['Product'],
    targetTypes: ['Contact', 'Vendor'],
    isBidirectional: false,
    defaultStrength: 3,
    isSystem: true,
    color: '#2563eb',
    icon: 'truck',
  },
  {
    name: 'category',
    displayName: 'Category',
    description: 'Entity belongs to a category',
    sourceTypes: ['Product'],
    targetTypes: ['ProductCategory'],
    isBidirectional: true,
    reverseTypeName: 'contains',
    defaultStrength: 2,
    isSystem: true,
    color: '#7c3aed',
    icon: 'folder',
  },
  {
    name: 'contains',
    displayName: 'Contains',
    description: 'Category contains entities',
    sourceTypes: ['ProductCategory'],
    targetTypes: ['Product'],
    isBidirectional: false,
    defaultStrength: 2,
    isSystem: true,
    color: '#7c3aed',
    icon: 'folder',
  },

  // Task and Project relationships
  {
    name: 'assigned_to',
    displayName: 'Assigned To',
    description: 'Task/Project assigned to user',
    sourceTypes: ['Task', 'Project'],
    targetTypes: ['User'],
    isBidirectional: true,
    reverseTypeName: 'assigned',
    defaultStrength: 4,
    isSystem: true,
    color: '#059669',
    icon: 'user-check',
  },
  {
    name: 'assigned',
    displayName: 'Assigned',
    description: 'User is assigned to task/project',
    sourceTypes: ['User'],
    targetTypes: ['Task', 'Project'],
    isBidirectional: false,
    defaultStrength: 4,
    isSystem: true,
    color: '#059669',
    icon: 'user-check',
  },
  {
    name: 'belongs_to',
    displayName: 'Belongs To',
    description: 'Entity belongs to project',
    sourceTypes: ['Task', 'Budget', 'WorkOrder'],
    targetTypes: ['Project'],
    isBidirectional: true,
    reverseTypeName: 'includes',
    defaultStrength: 3,
    isSystem: true,
    color: '#dc2626',
    icon: 'folder-open',
  },
  {
    name: 'includes',
    displayName: 'Includes',
    description: 'Project includes entities',
    sourceTypes: ['Project'],
    targetTypes: ['Task', 'Budget', 'WorkOrder'],
    isBidirectional: false,
    defaultStrength: 3,
    isSystem: true,
    color: '#dc2626',
    icon: 'folder-open',
  },

  // Budget relationships
  {
    name: 'funds',
    displayName: 'Funds',
    description: 'Budget funds project/task',
    sourceTypes: ['Budget'],
    targetTypes: ['Project', 'Task'],
    isBidirectional: true,
    reverseTypeName: 'funded_by',
    defaultStrength: 3,
    isSystem: true,
    color: '#ea580c',
    icon: 'dollar-sign',
  },
  {
    name: 'funded_by',
    displayName: 'Funded By',
    description: 'Project/Task funded by budget',
    sourceTypes: ['Project', 'Task'],
    targetTypes: ['Budget'],
    isBidirectional: false,
    defaultStrength: 3,
    isSystem: true,
    color: '#ea580c',
    icon: 'dollar-sign',
  },

  // Work Order relationships
  {
    name: 'produces',
    displayName: 'Produces',
    description: 'Work order produces product',
    sourceTypes: ['WorkOrder'],
    targetTypes: ['Product'],
    isBidirectional: true,
    reverseTypeName: 'produced_by',
    defaultStrength: 4,
    isSystem: true,
    color: '#7c2d12',
    icon: 'cog',
  },
  {
    name: 'produced_by',
    displayName: 'Produced By',
    description: 'Product produced by work order',
    sourceTypes: ['Product'],
    targetTypes: ['WorkOrder'],
    isBidirectional: false,
    defaultStrength: 4,
    isSystem: true,
    color: '#7c2d12',
    icon: 'cog',
  },

  // Contact relationships
  {
    name: 'works_with',
    displayName: 'Works With',
    description: 'Entity works with another entity',
    sourceTypes: ['User', 'Contact'],
    targetTypes: ['User', 'Contact'],
    isBidirectional: true,
    reverseTypeName: 'works_with',
    defaultStrength: 2,
    isSystem: true,
    color: '#0891b2',
    icon: 'users',
  },
  {
    name: 'manages',
    displayName: 'Manages',
    description: 'User manages entity',
    sourceTypes: ['User'],
    targetTypes: ['Project', 'Task', 'Budget', 'WorkOrder'],
    isBidirectional: true,
    reverseTypeName: 'managed_by',
    defaultStrength: 4,
    isSystem: true,
    color: '#be123c',
    icon: 'crown',
  },
  {
    name: 'managed_by',
    displayName: 'Managed By',
    description: 'Entity managed by user',
    sourceTypes: ['Project', 'Task', 'Budget', 'WorkOrder'],
    targetTypes: ['User'],
    isBidirectional: false,
    defaultStrength: 4,
    isSystem: true,
    color: '#be123c',
    icon: 'crown',
  },

  // Mention relationships
  {
    name: 'mentioned_in',
    displayName: 'Mentioned In',
    description: 'Entity mentioned in another entity',
    sourceTypes: ['User', 'Contact', 'Product', 'Project', 'Task'],
    targetTypes: ['Task', 'Comment', 'Document', 'Budget'],
    isBidirectional: false,
    defaultStrength: 1,
    isSystem: true,
    color: '#6b7280',
    icon: 'at-sign',
  },

  // Recipe/Ingredient relationships
  {
    name: 'ingredient_of',
    displayName: 'Ingredient Of',
    description: 'Product is ingredient of another product',
    sourceTypes: ['Product'],
    targetTypes: ['Product'],
    isBidirectional: true,
    reverseTypeName: 'uses_ingredient',
    defaultStrength: 3,
    isSystem: true,
    color: '#16a34a',
    icon: 'package',
  },
  {
    name: 'uses_ingredient',
    displayName: 'Uses Ingredient',
    description: 'Product uses another product as ingredient',
    sourceTypes: ['Product'],
    targetTypes: ['Product'],
    isBidirectional: false,
    defaultStrength: 3,
    isSystem: true,
    color: '#16a34a',
    icon: 'package',
  },

  // Brand relationships
  {
    name: 'brand_of',
    displayName: 'Brand Of',
    description: 'Brand associated with product',
    sourceTypes: ['Brand', 'Contact'],
    targetTypes: ['Product'],
    isBidirectional: true,
    reverseTypeName: 'branded_by',
    defaultStrength: 3,
    isSystem: true,
    color: '#9333ea',
    icon: 'star',
  },
  {
    name: 'branded_by',
    displayName: 'Branded By',
    description: 'Product branded by entity',
    sourceTypes: ['Product'],
    targetTypes: ['Brand', 'Contact'],
    isBidirectional: false,
    defaultStrength: 3,
    isSystem: true,
    color: '#9333ea',
    icon: 'star',
  },

  // Location relationships
  {
    name: 'located_at',
    displayName: 'Located At',
    description: 'Entity located at location',
    sourceTypes: ['Product', 'WorkOrder', 'User'],
    targetTypes: ['Location'],
    isBidirectional: true,
    reverseTypeName: 'houses',
    defaultStrength: 2,
    isSystem: true,
    color: '#0d9488',
    icon: 'map-pin',
  },
  {
    name: 'houses',
    displayName: 'Houses',
    description: 'Location houses entities',
    sourceTypes: ['Location'],
    targetTypes: ['Product', 'WorkOrder', 'User'],
    isBidirectional: false,
    defaultStrength: 2,
    isSystem: true,
    color: '#0d9488',
    icon: 'map-pin',
  },

  // Generic relationships
  {
    name: 'related_to',
    displayName: 'Related To',
    description: 'Generic relationship between entities',
    sourceTypes: ['*'], // All types
    targetTypes: ['*'], // All types
    isBidirectional: true,
    reverseTypeName: 'related_to',
    defaultStrength: 1,
    isSystem: false,
    color: '#6b7280',
    icon: 'link',
  },
  {
    name: 'depends_on',
    displayName: 'Depends On',
    description: 'Entity depends on another entity',
    sourceTypes: ['Task', 'Project', 'WorkOrder'],
    targetTypes: ['Task', 'Project', 'Product', 'User'],
    isBidirectional: true,
    reverseTypeName: 'dependency_of',
    defaultStrength: 3,
    isSystem: true,
    color: '#f59e0b',
    icon: 'arrow-right-circle',
  },
  {
    name: 'dependency_of',
    displayName: 'Dependency Of',
    description: 'Entity is dependency of another entity',
    sourceTypes: ['Task', 'Project', 'Product', 'User'],
    targetTypes: ['Task', 'Project', 'WorkOrder'],
    isBidirectional: false,
    defaultStrength: 3,
    isSystem: true,
    color: '#f59e0b',
    icon: 'arrow-left-circle',
  },
];

export async function seedRelationshipTypes() {
  console.log('🔗 Seeding relationship types...');

  for (const relationshipType of relationshipTypes) {
    try {
      await prisma.relationshipType.upsert({
        where: { name: relationshipType.name },
        update: relationshipType,
        create: relationshipType,
      });
      console.log(`✅ Created/Updated relationship type: ${relationshipType.name}`);
    } catch (error) {
      console.error(`❌ Error seeding relationship type ${relationshipType.name}:`, error);
    }
  }

  console.log('🎉 Relationship types seeding completed!');
}

// Run if called directly
if (require.main === module) {
  seedRelationshipTypes()
    .then(() => {
      console.log('✨ Seeding finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}