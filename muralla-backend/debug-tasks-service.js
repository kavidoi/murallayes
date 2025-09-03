const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugTasksService() {
  try {
    console.log('🔍 Debugging TasksService...\n');
    
    // Test 1: Check if we can access the database directly
    console.log('1️⃣ Testing direct database access...');
    const taskCount = await prisma.task.count({
      where: { NOT: { isDeleted: true } }
    });
    console.log('✅ Task count:', taskCount);
    
    // Test 2: Test the exact query from TasksService.findAll()
    console.log('\n2️⃣ Testing TasksService.findAll() query...');
    try {
      const tasks = await prisma.task.findMany({
        where: {
          NOT: {
            isDeleted: true
          }
        },
        include: {
          assignee: true,
          project: true,
          parentTask: true,
          subtasks: true
        },
        orderBy: [
          { orderIndex: 'asc' },
          { createdAt: 'desc' }
        ],
        take: 2
      });
      console.log('✅ findAll query successful, found', tasks.length, 'tasks');
      
      // Check if any of the included relations have issues
      for (const task of tasks) {
        console.log(`  Task: ${task.title}`);
        console.log(`    Assignee: ${task.assignee ? 'Found' : 'None'}`);
        console.log(`    Project: ${task.project ? 'Found' : 'None'}`);
        console.log(`    Parent Task: ${task.parentTask ? 'Found' : 'None'}`);
        console.log(`    Subtasks: ${task.subtasks ? task.subtasks.length : 'None'}`);
      }
      
    } catch (error) {
      console.log('❌ findAll query failed:', error.message);
      console.log('Error details:', error);
    }
    
    // Test 3: Test EntityRelationship queries
    console.log('\n3️⃣ Testing EntityRelationship queries...');
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
    
    // Test 4: Test specific task with relationships
    console.log('\n4️⃣ Testing specific task with relationships...');
    try {
      const firstTask = await prisma.task.findFirst({
        where: { NOT: { isDeleted: true } }
      });
      
      if (firstTask) {
        console.log('Testing task:', firstTask.title);
        
        // Test the exact query that might be failing
        const taskWithRelationships = await prisma.task.findFirst({
          where: {
            id: firstTask.id,
            NOT: { isDeleted: true }
          },
          include: {
            assignee: true,
            project: true,
            parentTask: true,
            subtasks: {
              where: {
                NOT: { isDeleted: true }
              },
              include: {
                assignee: true
              },
              orderBy: [
                { orderIndex: 'asc' },
                { createdAt: 'desc' }
              ]
            }
          }
        });
        
        console.log('✅ Task with relationships query successful');
        console.log('  Subtasks count:', taskWithRelationships.subtasks.length);
        
      } else {
        console.log('⚠️ No tasks found to test');
      }
    } catch (error) {
      console.log('❌ Task with relationships query failed:', error.message);
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTasksService();
