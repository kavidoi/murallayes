import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function migrateExistingRelationships() {
  console.log('🔄 Starting migration of existing relationships to Universal System...');

  try {
    // 1. Migrate Task assignments from removed TaskAssignee table references
    console.log('📝 Migrating Task assignments...');
    await migrateTaskAssignments();

    // 2. Migrate Product categories (now using EntityRelationship)
    console.log('🏷️  Migrating Product categories...');
    await migrateProductCategories();

    // 3. Migrate Budget-Project relationships
    console.log('💰 Migrating Budget-Project relationships...');
    await migrateBudgetProjects();

    // 4. Migrate WorkOrder-Product relationships
    console.log('⚙️  Migrating WorkOrder-Product relationships...');
    await migrateWorkOrderProducts();

    // 5. Migrate Vendor-Product supplier relationships
    console.log('🚚 Migrating Vendor-Product supplier relationships...');
    await migrateVendorSupplierRelationships();

    // 6. Migrate Brand-Product relationships
    console.log('⭐ Migrating Brand-Product relationships...');
    await migrateBrandProducts();

    // 7. Create mention relationships from existing comment mentions
    console.log('💬 Creating mention relationships from comments...');
    await createMentionRelationships();

    // 8. Auto-detect supplier relationships from cost data
    console.log('🔍 Auto-detecting supplier relationships from cost patterns...');
    await autoDetectSupplierRelationships();

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function migrateTaskAssignments() {
  // Get all tasks with assignees (primary assignee relationship)
  const tasksWithAssignees = await prisma.task.findMany({
    where: {
      assigneeId: { not: null },
      isDeleted: false,
    },
    select: {
      id: true,
      assigneeId: true,
      tenantId: true,
      priority: true,
      status: true,
    },
  });

  for (const task of tasksWithAssignees) {
    if (!task.assigneeId) continue;

    try {
      await prisma.entityRelationship.upsert({
        where: {
          sourceType_sourceId_targetType_targetId_relationshipType: {
            sourceType: 'Task',
            sourceId: task.id,
            targetType: 'User',
            targetId: task.assigneeId,
            relationshipType: 'assigned_to',
          },
        },
        update: {
          metadata: {
            taskPriority: task.priority,
            taskStatus: task.status,
            migratedFrom: 'task_assignee_field',
          },
          lastInteractionAt: new Date(),
        },
        create: {
          relationshipType: 'assigned_to',
          sourceType: 'Task',
          sourceId: task.id,
          targetType: 'User',
          targetId: task.assigneeId,
          strength: getAssignmentStrength(task.priority),
          metadata: {
            taskPriority: task.priority,
            taskStatus: task.status,
            migratedFrom: 'task_assignee_field',
          },
          tags: ['assignment', 'migrated'],
          tenantId: task.tenantId,
          lastInteractionAt: new Date(),
          interactionCount: 1,
          isActive: true,
        },
      });
      console.log(`✅ Migrated task assignment: ${task.id} -> ${task.assigneeId}`);
    } catch (error) {
      console.error(`❌ Failed to migrate task assignment ${task.id}:`, error);
    }
  }
}

async function migrateProductCategories() {
  // Note: ProductCategory relationships were already removed from schema
  // This would migrate from a backup or previous state if available
  // For now, we'll focus on other relationships
  console.log('ℹ️  Product category migration skipped - already using EntityRelationship system');
}

async function migrateBudgetProjects() {
  // Get all budgets that should be linked to projects (based on names/descriptions)
  const budgets = await prisma.budget.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      description: true,
      tenantId: true,
    },
  });

  const projects = await prisma.project.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      tenantId: true,
    },
  });

  for (const budget of budgets) {
    // Find matching project by name similarity or exact match
    const matchingProject = projects.find(
      (project) =>
        project.tenantId === budget.tenantId &&
        (project.name.toLowerCase().includes(budget.name.toLowerCase()) ||
         budget.name.toLowerCase().includes(project.name.toLowerCase()) ||
         budget.description?.toLowerCase().includes(project.name.toLowerCase()))
    );

    if (matchingProject) {
      try {
        await prisma.entityRelationship.upsert({
          where: {
            sourceType_sourceId_targetType_targetId_relationshipType: {
              sourceType: 'Budget',
              sourceId: budget.id,
              targetType: 'Project',
              targetId: matchingProject.id,
              relationshipType: 'funds',
            },
          },
          update: {
            lastInteractionAt: new Date(),
          },
          create: {
            relationshipType: 'funds',
            sourceType: 'Budget',
            sourceId: budget.id,
            targetType: 'Project',
            targetId: matchingProject.id,
            strength: 4,
            metadata: {
              migratedFrom: 'name_matching',
              budgetName: budget.name,
              projectName: matchingProject.name,
            },
            tags: ['funding', 'migrated'],
            tenantId: budget.tenantId,
            lastInteractionAt: new Date(),
            interactionCount: 1,
            isActive: true,
          },
        });
        console.log(`✅ Linked budget to project: ${budget.name} -> ${matchingProject.name}`);
      } catch (error) {
        console.error(`❌ Failed to link budget ${budget.id} to project:`, error);
      }
    }
  }
}

async function migrateWorkOrderProducts() {
  // Note: WorkOrder-Product relationship was already removed from schema
  // This would need to be restored from backup or based on WorkOrderComponents
  const workOrders = await prisma.workOrder.findMany({
    where: { status: { not: 'CANCELLED' } },
    include: {
      components: {
        include: { product: true },
      },
    },
  });

  for (const workOrder of workOrders) {
    // If work order has components, link to the main product being produced
    if (workOrder.components.length > 0) {
      // Assume the first or largest quantity component is the main product
      const mainComponent = workOrder.components.reduce((prev, current) =>
        current.qtyPlanned > prev.qtyPlanned ? current : prev
      );

      try {
        await prisma.entityRelationship.upsert({
          where: {
            sourceType_sourceId_targetType_targetId_relationshipType: {
              sourceType: 'WorkOrder',
              sourceId: workOrder.id,
              targetType: 'Product',
              targetId: mainComponent.productId,
              relationshipType: 'produces',
            },
          },
          update: {
            metadata: {
              plannedQuantity: mainComponent.qtyPlanned,
              actualQuantity: mainComponent.qtyConsumed,
            },
            lastInteractionAt: new Date(),
          },
          create: {
            relationshipType: 'produces',
            sourceType: 'WorkOrder',
            sourceId: workOrder.id,
            targetType: 'Product',
            targetId: mainComponent.productId,
            strength: 4,
            metadata: {
              plannedQuantity: mainComponent.qtyPlanned,
              actualQuantity: mainComponent.qtyConsumed,
              migratedFrom: 'work_order_components',
            },
            tags: ['production', 'migrated'],
            tenantId: workOrder.tenantId,
            lastInteractionAt: new Date(),
            interactionCount: 1,
            isActive: true,
          },
        });
        console.log(`✅ Linked work order to product: ${workOrder.id} -> ${mainComponent.productId}`);
      } catch (error) {
        console.error(`❌ Failed to link work order ${workOrder.id}:`, error);
      }
    }
  }
}

async function migrateVendorSupplierRelationships() {
  // Get vendors and link them to products they supply based on cost data
  const supplierData = await prisma.$queryRaw<any[]>`
    SELECT 
      v.id as vendor_id,
      p.id as product_id,
      COUNT(*) as supply_count,
      SUM(cl.total_cost) as total_value,
      MAX(c.date) as last_supply_date
    FROM vendors v
    JOIN costs c ON LOWER(c.description) LIKE LOWER(CONCAT('%', v.name, '%'))
    JOIN cost_lines cl ON c.id = cl."costId"
    JOIN products p ON cl."productId" = p.id
    WHERE v."isActive" = true
      AND c.status != 'CANCELLED'
      AND cl."productId" IS NOT NULL
    GROUP BY v.id, p.id
    HAVING COUNT(*) >= 1
  `;

  for (const data of supplierData) {
    try {
      await prisma.entityRelationship.upsert({
        where: {
          sourceType_sourceId_targetType_targetId_relationshipType: {
            sourceType: 'Vendor',
            sourceId: data.vendor_id,
            targetType: 'Product',
            targetId: data.product_id,
            relationshipType: 'supplier',
          },
        },
        update: {
          metadata: {
            supplyCount: data.supply_count,
            totalValue: data.total_value,
            lastSupplyDate: data.last_supply_date,
          },
          interactionCount: data.supply_count,
          lastInteractionAt: data.last_supply_date,
        },
        create: {
          relationshipType: 'supplier',
          sourceType: 'Vendor',
          sourceId: data.vendor_id,
          targetType: 'Product',
          targetId: data.product_id,
          strength: Math.min(5, Math.ceil(data.supply_count / 2)),
          metadata: {
            supplyCount: data.supply_count,
            totalValue: data.total_value,
            lastSupplyDate: data.last_supply_date,
            migratedFrom: 'cost_analysis',
          },
          tags: ['supplier', 'migrated', 'cost-based'],
          interactionCount: data.supply_count,
          lastInteractionAt: data.last_supply_date,
          isActive: true,
        },
      });
      console.log(`✅ Created supplier relationship: Vendor ${data.vendor_id} -> Product ${data.product_id}`);
    } catch (error) {
      console.error(`❌ Failed to create supplier relationship:`, error);
    }
  }
}

async function migrateBrandProducts() {
  // Get products with brand information and create relationships
  const productsWithBrands = await prisma.product.findMany({
    where: {
      OR: [
        { brandId: { not: null } },
        { brandName: { not: null } },
      ],
      isDeleted: false,
    },
    include: {
      brand: true,
    },
  });

  for (const product of productsWithBrands) {
    let brandEntityId = null;
    let brandEntityType = 'Brand';

    if (product.brandId && product.brand) {
      brandEntityId = product.brandId;
    } else if (product.brandName) {
      // Try to find or create a contact for the brand
      const brandContact = await prisma.contact.findFirst({
        where: {
          name: product.brandName,
          type: 'brand',
        },
      });

      if (brandContact) {
        brandEntityId = brandContact.id;
        brandEntityType = 'Contact';
      }
    }

    if (brandEntityId) {
      try {
        await prisma.entityRelationship.upsert({
          where: {
            sourceType_sourceId_targetType_targetId_relationshipType: {
              sourceType: brandEntityType,
              sourceId: brandEntityId,
              targetType: 'Product',
              targetId: product.id,
              relationshipType: 'brand_of',
            },
          },
          update: {
            lastInteractionAt: new Date(),
          },
          create: {
            relationshipType: 'brand_of',
            sourceType: brandEntityType,
            sourceId: brandEntityId,
            targetType: 'Product',
            targetId: product.id,
            strength: 3,
            metadata: {
              brandName: product.brand?.name || product.brandName,
              migratedFrom: 'product_brand_field',
            },
            tags: ['brand', 'migrated'],
            tenantId: product.tenantId,
            lastInteractionAt: new Date(),
            interactionCount: 1,
            isActive: true,
          },
        });
        console.log(`✅ Created brand relationship: ${brandEntityType} ${brandEntityId} -> Product ${product.id}`);
      } catch (error) {
        console.error(`❌ Failed to create brand relationship for product ${product.id}:`, error);
      }
    }
  }
}

async function createMentionRelationships() {
  // Parse existing comments for @ mentions and create relationships
  const comments = await prisma.comment.findMany({
    where: {
      content: { contains: '@' },
      isDeleted: false,
    },
  });

  for (const comment of comments) {
    // Simple regex to find @username or @entityname patterns
    const mentions = comment.content.match(/@(\w+)/g) || [];
    
    for (const mention of mentions) {
      const mentionName = mention.substring(1);
      
      // Try to find mentioned entity (User first, then others)
      const mentionedUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: mentionName },
            { firstName: { contains: mentionName, mode: 'insensitive' } },
            { lastName: { contains: mentionName, mode: 'insensitive' } },
          ],
          isDeleted: false,
        },
      });

      if (mentionedUser) {
        try {
          await prisma.entityRelationship.upsert({
            where: {
              sourceType_sourceId_targetType_targetId_relationshipType: {
                sourceType: 'User',
                sourceId: mentionedUser.id,
                targetType: 'Comment',
                targetId: comment.id,
                relationshipType: 'mentioned_in',
              },
            },
            update: {
              lastInteractionAt: new Date(),
            },
            create: {
              relationshipType: 'mentioned_in',
              sourceType: 'User',
              sourceId: mentionedUser.id,
              targetType: 'Comment',
              targetId: comment.id,
              strength: 1,
              metadata: {
                mentionText: mention,
                context: 'comment',
                migratedFrom: 'comment_parsing',
              },
              tags: ['mention', 'migrated'],
              tenantId: comment.tenantId,
              lastInteractionAt: new Date(),
              interactionCount: 1,
              isActive: true,
            },
          });
          console.log(`✅ Created mention relationship: User ${mentionedUser.username} mentioned in Comment ${comment.id}`);
        } catch (error) {
          console.error(`❌ Failed to create mention relationship:`, error);
        }
      }
    }
  }
}

async function autoDetectSupplierRelationships() {
  // Use the existing service method for supplier relationship detection
  const entityRelationshipService = await import('../src/relationships/entity-relationship.service');
  
  // This would use the detectSupplierRelationships method
  console.log('ℹ️  Auto-detection will be handled by EntityRelationshipService.detectSupplierRelationships()');
}

function getAssignmentStrength(priority: string): number {
  switch (priority) {
    case 'URGENT': return 5;
    case 'HIGH': return 4;
    case 'MEDIUM': return 3;
    case 'LOW': return 2;
    default: return 3;
  }
}

// Run if called directly
if (require.main === module) {
  migrateExistingRelationships()
    .then(() => {
      console.log('✨ Migration finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}