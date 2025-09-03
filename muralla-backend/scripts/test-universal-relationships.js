const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUniversalRelationshipSystem() {
  console.log('🧪 Testing Universal Relationship System...\n');

  try {
    // Test 1: Create some test EntityRelationships for existing data
    console.log('📝 Test 1: Creating test relationships...');
    
    // Get first project and task for testing
    const testProject = await prisma.project.findFirst({
      where: { isDeleted: false }
    });
    
    const testTask = await prisma.task.findFirst({
      where: { 
        isDeleted: false,
        projectId: testProject?.id
      }
    });

    if (!testProject || !testTask) {
      console.log('❌ No test data available');
      return;
    }

    // Create a test relationship: Task -> Project
    const taskProjectRelation = await prisma.entityRelationship.create({
      data: {
        sourceType: 'Task',
        sourceId: testTask.id,
        targetType: 'Project', 
        targetId: testProject.id,
        relationshipType: 'belongs_to',
        strength: 1.0,
        priority: 1,
        isActive: true,
        isDeleted: false,
        tenantId: testTask.tenantId || 'default-tenant',
        createdBy: 'system-test'
      }
    });
    console.log(`✅ Created relationship: Task(${testTask.title}) -> Project(${testProject.name})`);

    // Test 2: Query relationships using EntityRelationshipService methods
    console.log('\n🔍 Test 2: Querying relationships...');
    
    // Find relationships for the task
    const taskRelationships = await prisma.entityRelationship.findMany({
      where: {
        OR: [
          { sourceType: 'Task', sourceId: testTask.id },
          { targetType: 'Task', targetId: testTask.id }
        ],
        isDeleted: false,
        isActive: true
      }
    });
    
    console.log(`✅ Found ${taskRelationships.length} relationships for task`);
    taskRelationships.forEach(rel => {
      console.log(`   - ${rel.sourceType}(${rel.sourceId}) -> ${rel.targetType}(${rel.targetId}) [${rel.relationshipType}]`);
    });

    // Test 3: Test relationship creation for different entity types
    console.log('\n🔗 Test 3: Testing different relationship types...');
    
    // Get a product and category for testing (if they exist)
    const testProduct = await prisma.product.findFirst({
      where: { isDeleted: false }
    });
    
    if (testProduct) {
      // Create a test product-category relationship
      const productCategoryRelation = await prisma.entityRelationship.create({
        data: {
          sourceType: 'Product',
          sourceId: testProduct.id,
          targetType: 'Category',
          targetId: 'test-category-id',
          relationshipType: 'categorized_as',
          strength: 1.0,
          priority: 1,
          isActive: true,
          isDeleted: false,
          tenantId: testProduct.tenantId || 'default-tenant',
          createdBy: 'system-test'
        }
      });
      console.log(`✅ Created product-category relationship`);
    }

    // Test 4: Verify relationship queries work correctly
    console.log('\n📊 Test 4: Relationship statistics...');
    
    const totalRelationships = await prisma.entityRelationship.count({
      where: { isDeleted: false, isActive: true }
    });
    
    const relationshipsByType = await prisma.entityRelationship.groupBy({
      by: ['relationshipType'],
      where: { isDeleted: false, isActive: true },
      _count: { relationshipType: true }
    });
    
    console.log(`✅ Total active relationships: ${totalRelationships}`);
    console.log('✅ Relationships by type:');
    relationshipsByType.forEach(group => {
      console.log(`   - ${group.relationshipType}: ${group._count.relationshipType}`);
    });

    // Test 5: Test relationship deletion (soft delete)
    console.log('\n🗑️  Test 5: Testing relationship soft delete...');
    
    await prisma.entityRelationship.update({
      where: { id: taskProjectRelation.id },
      data: { 
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: 'system-test'
      }
    });
    
    const activeRelationshipsAfterDelete = await prisma.entityRelationship.count({
      where: { isDeleted: false, isActive: true }
    });
    
    console.log(`✅ Relationships after soft delete: ${activeRelationshipsAfterDelete}`);

    console.log('\n🎉 Universal Relationship System tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testUniversalRelationshipSystem().catch(console.error);
