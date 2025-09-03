const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTasksEndpoint() {
  try {
    console.log('🧪 Testing Tasks Endpoint...\n');
    
    // Test 1: Basic task query without relationships
    console.log('1️⃣ Testing basic task query...');
    try {
      const basicTasks = await prisma.task.findMany({
        where: {
          NOT: { isDeleted: true }
        },
        take: 2
      });
      console.log('✅ Basic query successful, found', basicTasks.length, 'tasks');
    } catch (error) {
      console.log('❌ Basic query failed:', error.message);
    }
    
    // Test 2: Task query with basic includes
    console.log('\n2️⃣ Testing task query with basic includes...');
    try {
      const tasksWithIncludes = await prisma.task.findMany({
        where: {
          NOT: { isDeleted: true }
        },
        include: {
          assignee: true,
          project: true
        },
        take: 2
      });
      console.log('✅ Includes query successful, found', tasksWithIncludes.length, 'tasks');
    } catch (error) {
      console.log('❌ Includes query failed:', error.message);
    }
    
    // Test 3: Task query with all includes (like in TasksService)
    console.log('\n3️⃣ Testing task query with all includes...');
    try {
      const tasksWithAllIncludes = await prisma.task.findMany({
        where: {
          NOT: { isDeleted: true }
        },
        include: {
          assignee: true,
          project: true,
          parentTask: true,
          subtasks: true
        },
        take: 2
      });
      console.log('✅ All includes query successful, found', tasksWithAllIncludes.length, 'tasks');
    } catch (error) {
      console.log('❌ All includes query failed:', error.message);
    }
    
    // Test 4: Test EntityRelationshipService directly
    console.log('\n4️⃣ Testing EntityRelationshipService...');
    try {
      const relationships = await prisma.entityRelationship.findMany({
        where: {
          sourceType: 'Task',
          isDeleted: false
        },
        take: 2
      });
      console.log('✅ EntityRelationship query successful, found', relationships.length, 'relationships');
    } catch (error) {
      console.log('❌ EntityRelationship query failed:', error.message);
    }
    
    // Test 5: Test specific task with relationships
    console.log('\n5️⃣ Testing specific task with relationships...');
    try {
      const firstTask = await prisma.task.findFirst({
        where: { NOT: { isDeleted: true } }
      });
      
      if (firstTask) {
        const taskRelationships = await prisma.entityRelationship.findMany({
          where: {
            OR: [
              { sourceType: 'Task', sourceId: firstTask.id },
              { targetType: 'Task', targetId: firstTask.id }
            ],
            isDeleted: false,
            isActive: true
          }
        });
        console.log('✅ Task relationships query successful, found', taskRelationships.length, 'relationships for task', firstTask.title);
      } else {
        console.log('⚠️ No tasks found to test relationships');
      }
    } catch (error) {
      console.log('❌ Task relationships query failed:', error.message);
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTasksEndpoint();
