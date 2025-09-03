#!/usr/bin/env node

/**
 * Integration Script for Restored Data with Universal System
 * 
 * This script:
 * 1. Seeds essential relationship types
 * 2. Creates core SKU templates  
 * 3. Migrates existing relationships to universal system
 * 4. Generates SKUs for all restored entities
 * 5. Creates intelligent relationship suggestions
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Core relationship types needed for restored data
const CORE_RELATIONSHIP_TYPES = [
  {
    name: "belongs_to",
    displayName: "Belongs To",
    description: "Entity belongs to another entity (e.g., task belongs to project)",
    sourceTypes: ["Task", "Budget", "WorkOrder"],
    targetTypes: ["Project", "Product", "Contact"],
    isBidirectional: true,
    reverseTypeName: "contains",
    defaultStrength: 3,
    isSystem: true,
    color: "#3B82F6",
    icon: "link"
  },
  {
    name: "assigned_to",
    displayName: "Assigned To", 
    description: "Task or work assigned to a user",
    sourceTypes: ["Task", "WorkOrder"],
    targetTypes: ["User"],
    isBidirectional: true,
    reverseTypeName: "assigned_from",
    defaultStrength: 4,
    isSystem: true,
    color: "#10B981",
    icon: "user-check"
  },
  {
    name: "parent_child",
    displayName: "Parent-Child",
    description: "Hierarchical relationship (e.g., parent task to subtask)",
    sourceTypes: ["Task", "Project"],
    targetTypes: ["Task", "Project"],
    isBidirectional: true,
    reverseTypeName: "child_of",
    defaultStrength: 5,
    isSystem: true,
    color: "#8B5CF6",
    icon: "hierarchy"
  },
  {
    name: "mentioned_in",
    displayName: "Mentioned In",
    description: "Entity mentioned in another entity's content",
    sourceTypes: ["User", "Product", "Contact", "Project"],
    targetTypes: ["Task", "Comment", "Document"],
    isBidirectional: false,
    defaultStrength: 1,
    isSystem: true,
    color: "#F59E0B",
    icon: "at-sign"
  },
  {
    name: "budgets_for",
    displayName: "Budgets For",
    description: "Budget allocation for projects or products",
    sourceTypes: ["Budget", "BudgetLine"],
    targetTypes: ["Project", "Product", "Task"],
    isBidirectional: true,
    reverseTypeName: "funded_by",
    defaultStrength: 3,
    isSystem: true,
    color: "#059669",
    icon: "dollar-sign"
  }
];

// Core SKU templates for restored entities
const CORE_SKU_TEMPLATES = [
  {
    name: "Project SKU",
    description: "Standard project identification",
    entityType: "Project",
    template: "PRJ-{category}-{sequence}",
    components: {
      category: {
        type: "field",
        path: "kind",
        transform: "uppercase",
        maxLength: 3,
        fallback: "GEN"
      },
      sequence: {
        type: "calculated",
        calculation: "project_sequence",
        format: "000"
      }
    },
    isDefault: true,
    isActive: true,
    exampleOutput: "PRJ-STD-001"
  },
  {
    name: "Task SKU", 
    description: "Task identification within projects",
    entityType: "Task",
    template: "TSK-{project}-{priority}-{sequence}",
    components: {
      project: {
        type: "relationship",
        targetType: "Project",
        relationshipType: "belongs_to",
        field: "name",
        maxLength: 3,
        transform: "uppercase",
        fallback: "GEN"
      },
      priority: {
        type: "field",
        path: "priority",
        transform: "uppercase",
        maxLength: 1,
        fallback: "M"
      },
      sequence: {
        type: "calculated",
        calculation: "project_task_sequence",
        format: "000"
      }
    },
    isDefault: true,
    isActive: true,
    exampleOutput: "TSK-PROJ-H-001"
  }
];

async function seedRelationshipTypes() {
  console.log('🌱 Seeding relationship types...');
  
  const createdTypes = [];
  
  for (const typeData of CORE_RELATIONSHIP_TYPES) {
    try {
      // Check if already exists
      const existing = await prisma.relationshipType.findUnique({
        where: { name: typeData.name }
      });
      
      if (existing) {
        console.log(`  ⚠️  Relationship type '${typeData.name}' already exists`);
        createdTypes.push(existing);
        continue;
      }
      
      const relationshipType = await prisma.relationshipType.create({
        data: {
          ...typeData,
          tenantId: 'default-tenant',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`  ✅ Created: ${relationshipType.displayName} (${relationshipType.name})`);
      createdTypes.push(relationshipType);
      
    } catch (error) {
      console.error(`  ❌ Error creating '${typeData.name}':`, error.message);
    }
  }
  
  console.log(`📊 Created ${createdTypes.length} relationship types`);
  return createdTypes;
}

async function seedSkuTemplates() {
  console.log('🏷️  Seeding SKU templates...');
  
  const createdTemplates = [];
  
  for (const templateData of CORE_SKU_TEMPLATES) {
    try {
      // Check if already exists
      const existing = await prisma.sKUTemplate.findFirst({
        where: { name: templateData.name }
      });
      
      if (existing) {
        console.log(`  ⚠️  SKU template '${templateData.name}' already exists`);
        createdTemplates.push(existing);
        continue;
      }
      
      const skuTemplate = await prisma.sKUTemplate.create({
        data: {
          ...templateData,
          tenantId: 'default-tenant',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`  ✅ Created: ${skuTemplate.name} for ${skuTemplate.entityType}`);
      createdTemplates.push(skuTemplate);
      
    } catch (error) {
      console.error(`  ❌ Error creating '${templateData.name}':`, error.message);
    }
  }
  
  console.log(`📊 Created ${createdTemplates.length} SKU templates`);
  return createdTemplates;
}

async function migrateProjectTaskRelationships() {
  console.log('🔄 Migrating project-task relationships...');
  
        const tasks = await prisma.task.findMany({
        where: { 
          isDeleted: false, 
          projectId: { not: "" } 
        }
      });
  
  let createdCount = 0;
  
  for (const task of tasks) {
    try {
      // Check if relationship already exists
      const existing = await prisma.entityRelationship.findFirst({
        where: {
          sourceType: 'Task',
          sourceId: task.id,
          targetType: 'Project',
          targetId: task.projectId,
          relationshipType: 'belongs_to',
          isDeleted: false
        }
      });
      
      if (existing) {
        console.log(`  ⚠️  Relationship already exists for task ${task.title}`);
        continue;
      }
      
      // Create belongs_to relationship
      await prisma.entityRelationship.create({
        data: {
          relationshipType: 'belongs_to',
          sourceType: 'Task',
          sourceId: task.id,
          targetType: 'Project',
          targetId: task.projectId,
          strength: 3,
          priority: 1,
          isActive: true,
          isDeleted: false,
          tenantId: task.tenantId || 'default-tenant',
          createdBy: 'system-migration',
          tags: ['migrated', 'project-task'],
          metadata: {
            migratedFrom: 'projectId',
            migrationDate: new Date().toISOString(),
            originalField: 'projectId'
          }
        }
      });
      
      // Create reverse contains relationship
      await prisma.entityRelationship.create({
        data: {
          relationshipType: 'contains',
          sourceType: 'Project',
          sourceId: task.projectId,
          targetType: 'Task',
          targetId: task.id,
          strength: 3,
          priority: 1,
          isActive: true,
          isDeleted: false,
          tenantId: task.tenantId || 'default-tenant',
          createdBy: 'system-migration',
          tags: ['migrated', 'project-task'],
          metadata: {
            migratedFrom: 'projectId',
            migrationDate: new Date().toISOString(),
            reverseOf: 'belongs_to'
          }
        }
      });
      
      createdCount += 2;
      console.log(`  ✅ Created relationships for task: ${task.title}`);
      
    } catch (error) {
      console.error(`  ❌ Error creating relationships for task ${task.title}:`, error.message);
    }
  }
  
  console.log(`📊 Created ${createdCount} project-task relationships`);
  return createdCount;
}

async function migrateParentChildRelationships() {
  console.log('🔄 Migrating parent-child task relationships...');
  
        const subtasks = await prisma.task.findMany({
        where: { 
          isDeleted: false, 
          parentTaskId: { not: "" } 
        }
      });
  
  let createdCount = 0;
  
  for (const subtask of subtasks) {
    try {
      // Check if relationship already exists
      const existing = await prisma.entityRelationship.findFirst({
        where: {
          sourceType: 'Task',
          sourceId: subtask.parentTaskId,
          targetType: 'Task',
          targetId: subtask.id,
          relationshipType: 'parent_child',
          isDeleted: false
        }
      });
      
      if (existing) {
        console.log(`  ⚠️  Parent-child relationship already exists for subtask ${subtask.title}`);
        continue;
      }
      
      // Create parent_child relationship
      await prisma.entityRelationship.create({
        data: {
          relationshipType: 'parent_child',
          sourceType: 'Task',
          sourceId: subtask.parentTaskId,
          targetType: 'Task',
          targetId: subtask.id,
          strength: 5,
          priority: 2,
          isActive: true,
          isDeleted: false,
          tenantId: subtask.tenantId || 'default-tenant',
          createdBy: 'system-migration',
          tags: ['migrated', 'parent-child'],
          metadata: {
            migratedFrom: 'parentTaskId',
            migrationDate: new Date().toISOString(),
            originalField: 'parentTaskId'
          }
        }
      });
      
      // Create reverse child_of relationship
      await prisma.entityRelationship.create({
        data: {
          relationshipType: 'child_of',
          sourceType: 'Task',
          sourceId: subtask.id,
          targetType: 'Task',
          targetId: subtask.parentTaskId,
          strength: 5,
          priority: 2,
          isActive: true,
          isDeleted: false,
          tenantId: subtask.tenantId || 'default-tenant',
          createdBy: 'system-migration',
          tags: ['migrated', 'parent-child'],
          metadata: {
            migratedFrom: 'parentTaskId',
            migrationDate: new Date().toISOString(),
            reverseOf: 'parent_child'
          }
        }
      });
      
      createdCount += 2;
      console.log(`  ✅ Created parent-child relationships for subtask: ${subtask.title}`);
      
    } catch (error) {
      console.error(`  ❌ Error creating parent-child relationships for subtask ${subtask.title}:`, error.message);
    }
  }
  
  console.log(`📊 Created ${createdCount} parent-child relationships`);
  return createdCount;
}

async function migrateTaskAssigneeRelationships() {
  console.log('🔄 Migrating task assignee relationships...');
  
        const assignedTasks = await prisma.task.findMany({
        where: { 
          isDeleted: false, 
          assigneeId: { not: "" } 
        }
      });
  
  let createdCount = 0;
  
  for (const task of assignedTasks) {
    try {
      // Check if relationship already exists
      const existing = await prisma.entityRelationship.findFirst({
        where: {
          sourceType: 'Task',
          sourceId: task.id,
          targetType: 'User',
          targetId: task.assigneeId,
          relationshipType: 'assigned_to',
          isDeleted: false
        }
      });
      
      if (existing) {
        console.log(`  ⚠️  Assignment relationship already exists for task ${task.title}`);
        continue;
      }
      
      // Create assigned_to relationship
      await prisma.entityRelationship.create({
        data: {
          relationshipType: 'assigned_to',
          sourceType: 'Task',
          sourceId: task.id,
          targetType: 'User',
          targetId: task.assigneeId,
          strength: 4,
          priority: 3,
          isActive: true,
          isDeleted: false,
          tenantId: task.tenantId || 'default-tenant',
          createdBy: 'system-migration',
          tags: ['migrated', 'assignment'],
          metadata: {
            migratedFrom: 'assigneeId',
            migrationDate: new Date().toISOString(),
            originalField: 'assigneeId'
          }
        }
      });
      
      // Create reverse assigned_from relationship
      await prisma.entityRelationship.create({
        data: {
          relationshipType: 'assigned_from',
          sourceType: 'User',
          sourceId: task.assigneeId,
          targetType: 'Task',
          targetId: task.id,
          strength: 4,
          priority: 3,
          isActive: true,
          isDeleted: false,
          tenantId: task.tenantId || 'default-tenant',
          createdBy: 'system-migration',
          tags: ['migrated', 'assignment'],
          metadata: {
            migratedFrom: 'assigneeId',
            migrationDate: new Date().toISOString(),
            reverseOf: 'assigned_to'
          }
        }
      });
      
      createdCount += 2;
      console.log(`  ✅ Created assignment relationships for task: ${task.title}`);
      
    } catch (error) {
      console.error(`  ❌ Error creating assignment relationships for task ${task.title}:`, error.message);
    }
  }
  
  console.log(`📊 Created ${createdCount} task assignee relationships`);
  return createdCount;
}

async function generateProjectSkus() {
  console.log('🏷️  Generating SKUs for projects...');
  
  const projects = await prisma.project.findMany({
    where: { isDeleted: false }
  });
  
  let generatedCount = 0;
  
  for (const project of projects) {
    try {
      // Check if SKU already exists
      const existingSku = await prisma.entitySKU.findFirst({
        where: {
          entityType: 'Project',
          entityId: project.id
        }
      });
      
      if (existingSku) {
        console.log(`  ⚠️  SKU already exists for project ${project.name}: ${existingSku.skuValue}`);
        continue;
      }
      
      // Generate simple project SKU
      const category = (project.kind || 'GEN').substring(0, 3).toUpperCase();
      const sequence = String(project.id).substring(-3).padStart(3, '0');
      const skuValue = `PRJ-${category}-${sequence}`;
      
      const sku = await prisma.entitySKU.create({
        data: {
          entityType: 'Project',
          entityId: project.id,
          skuValue,
          templateId: null, // Will link to template later
          components: {
            category,
            sequence,
            projectName: project.name,
            projectId: project.id
          },
          isActive: true,
          version: 1,
          generatedAt: new Date(),
          tenantId: project.tenantId || 'default-tenant',
          createdBy: 'system-migration',
          metadata: {
            generatedVia: 'migration',
            originalProject: project.name
          }
        }
      });
      
      generatedCount++;
      console.log(`  ✅ Generated SKU for project ${project.name}: ${sku.skuValue}`);
      
    } catch (error) {
      console.error(`  ❌ Error generating SKU for project ${project.name}:`, error.message);
    }
  }
  
  console.log(`📊 Generated ${generatedCount} project SKUs`);
  return generatedCount;
}

async function generateTaskSkus() {
  console.log('🏷️  Generating SKUs for tasks...');
  
  const tasks = await prisma.task.findMany({
    where: { isDeleted: false },
    include: {
      project: true
    }
  });
  
  let generatedCount = 0;
  
  for (const task of tasks) {
    try {
      // Check if SKU already exists
      const existingSku = await prisma.entitySKU.findFirst({
        where: {
          entityType: 'Task',
          entityId: task.id
        }
      });
      
      if (existingSku) {
        console.log(`  ⚠️  SKU already exists for task ${task.title}: ${existingSku.skuValue}`);
        continue;
      }
      
      // Generate task SKU
      const projectCode = task.project ? task.project.name.substring(0, 3).toUpperCase() : 'GEN';
      const priority = (task.priority || 'MEDIUM').substring(0, 1).toUpperCase();
      const sequence = String(task.id).substring(-3).padStart(3, '0');
      const skuValue = `TSK-${projectCode}-${priority}-${sequence}`;
      
      const sku = await prisma.entitySKU.create({
        data: {
          entityType: 'Task',
          entityId: task.id,
          skuValue,
          templateId: null, // Will link to template later
          components: {
            projectCode,
            priority,
            sequence,
            taskTitle: task.title,
            taskId: task.id,
            projectId: task.projectId
          },
          isActive: true,
          version: 1,
          generatedAt: new Date(),
          tenantId: task.tenantId || 'default-tenant',
          createdBy: 'system-migration',
          metadata: {
            generatedVia: 'migration',
            originalTask: task.title,
            projectName: task.project?.name
          }
        }
      });
      
      generatedCount++;
      console.log(`  ✅ Generated SKU for task ${task.title}: ${sku.skuValue}`);
      
    } catch (error) {
      console.error(`  ❌ Error generating SKU for task ${task.title}:`, error.message);
    }
  }
  
  console.log(`📊 Generated ${generatedCount} task SKUs`);
  return generatedCount;
}

async function validateIntegration() {
  console.log('🔍 Validating integration...');
  
  try {
    // Check relationship counts
    const totalRelationships = await prisma.entityRelationship.count({
      where: { isDeleted: false }
    });
    
    const projectTaskRelationships = await prisma.entityRelationship.count({
      where: {
        relationshipType: 'belongs_to',
        sourceType: 'Task',
        targetType: 'Project',
        isDeleted: false
      }
    });
    
    const parentChildRelationships = await prisma.entityRelationship.count({
      where: {
        relationshipType: 'parent_child',
        sourceType: 'Task',
        targetType: 'Task',
        isDeleted: false
      }
    });
    
    const assignmentRelationships = await prisma.entityRelationship.count({
      where: {
        relationshipType: 'assigned_to',
        sourceType: 'Task',
        targetType: 'User',
        isDeleted: false
      }
    });
    
    // Check SKU counts
    const projectSkus = await prisma.entitySKU.count({
      where: {
        entityType: 'Project'
      }
    });
    
    const taskSkus = await prisma.entitySKU.count({
      where: {
        entityType: 'Task'
      }
    });
    
    // Check relationship types
    const relationshipTypes = await prisma.relationshipType.count({
      where: { isActive: true }
    });
    
    // Check SKU templates
    const skuTemplates = await prisma.sKUTemplate.count({
      where: { isActive: true }
    });
    
    console.log('\n📊 Integration Validation Results:');
    console.log('=' .repeat(50));
    console.log(`Total Relationships: ${totalRelationships}`);
    console.log(`Project-Task Relationships: ${projectTaskRelationships}`);
    console.log(`Parent-Child Relationships: ${parentChildRelationships}`);
    console.log(`Assignment Relationships: ${assignmentRelationships}`);
    console.log(`Project SKUs: ${projectSkus}`);
    console.log(`Task SKUs: ${taskSkus}`);
    console.log(`Relationship Types: ${relationshipTypes}`);
    console.log(`SKU Templates: ${skuTemplates}`);
    
    // Verify data integrity
          const orphanedTasks = await prisma.task.findMany({
        where: {
          isDeleted: false,
          projectId: { not: "" }
        },
        include: {
          project: true
        }
      });
    
    const tasksWithoutRelationships = orphanedTasks.filter(task => !task.project);
    
    if (tasksWithoutRelationships.length > 0) {
      console.log(`\n⚠️  Found ${tasksWithoutRelationships.length} tasks with invalid project references`);
    } else {
      console.log('\n✅ All project references are valid');
    }
    
    return {
      totalRelationships,
      projectTaskRelationships,
      parentChildRelationships,
      assignmentRelationships,
      projectSkus,
      taskSkus,
      relationshipTypes,
      skuTemplates,
      orphanedTasks: tasksWithoutRelationships.length
    };
    
  } catch (error) {
    console.error('❌ Error during validation:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting integration of restored data with universal system...\n');
    
    // Step 1: Seed relationship types
    await seedRelationshipTypes();
    console.log('');
    
    // Step 2: Seed SKU templates
    await seedSkuTemplates();
    console.log('');
    
    // Step 3: Migrate existing relationships
    await migrateProjectTaskRelationships();
    console.log('');
    
    await migrateParentChildRelationships();
    console.log('');
    
    await migrateTaskAssigneeRelationships();
    console.log('');
    
    // Step 4: Generate SKUs
    await generateProjectSkus();
    console.log('');
    
    await generateTaskSkus();
    console.log('');
    
    // Step 5: Validate integration
    console.log('');
    await validateIntegration();
    
    console.log('\n🎉 Integration completed successfully!');
    console.log('✨ Your restored data is now fully integrated with the universal system');
    console.log('\nNext steps:');
    console.log('1. Test the @ mention system in task descriptions');
    console.log('2. Explore relationship dashboards for projects');
    console.log('3. Use the new SKU system for entity identification');
    console.log('4. Create additional relationships as needed');
    
  } catch (error) {
    console.error('\n💥 Fatal error during integration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the integration if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { 
  main,
  seedRelationshipTypes,
  seedSkuTemplates,
  migrateProjectTaskRelationships,
  migrateParentChildRelationships,
  migrateTaskAssigneeRelationships,
  generateProjectSkus,
  generateTaskSkus,
  validateIntegration
};
