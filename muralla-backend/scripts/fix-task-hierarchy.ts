import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing task hierarchy issues...');
  
  try {
    // Find tasks with invalid parent references
    const tasksWithInvalidParents = await prisma.task.findMany({
      where: {
        parentTaskId: { not: null },
        isDeleted: false
      },
      select: { 
        id: true, 
        title: true, 
        parentTaskId: true,
        projectId: true
      }
    });
    
    console.log(`Found ${tasksWithInvalidParents.length} tasks with parent references`);
    
    for (const task of tasksWithInvalidParents) {
      // Check if parent exists
      const parentExists = await prisma.task.findUnique({
        where: { id: task.parentTaskId! }
      });
      
      if (!parentExists) {
        console.log(`⚠️  Task "${task.title}" has invalid parent ${task.parentTaskId}, removing parent reference...`);
        
        // Remove invalid parent reference
        await prisma.task.update({
          where: { id: task.id },
          data: { parentTaskId: null }
        });
        
        console.log(`✅ Fixed task "${task.title}"`);
      } else {
        console.log(`✅ Task "${task.title}" has valid parent: "${parentExists.title}"`);
      }
    }
    
    // Show final task hierarchy
    console.log('\n📊 Task hierarchy summary:');
    const rootTasks = await prisma.task.count({
      where: { 
        parentTaskId: null, 
        isDeleted: false 
      }
    });
    
    const subtasks = await prisma.task.count({
      where: { 
        parentTaskId: { not: null }, 
        isDeleted: false 
      }
    });
    
    console.log(`   • Root tasks: ${rootTasks}`);
    console.log(`   • Subtasks: ${subtasks}`);
    
  } catch (error) {
    console.error('❌ Error fixing hierarchy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});