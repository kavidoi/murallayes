import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning existing backup data...');
  
  try {
    // Delete tasks with backup IDs (those starting with 'cmet')
    const deletedTasks = await prisma.task.deleteMany({
      where: {
        id: {
          startsWith: 'cmet'
        }
      }
    });
    
    console.log(`🗑️  Deleted ${deletedTasks.count} tasks`);
    
    // Delete projects with backup IDs (those starting with 'cmet')
    const deletedProjects = await prisma.project.deleteMany({
      where: {
        id: {
          startsWith: 'cmet'
        }
      }
    });
    
    console.log(`🗑️  Deleted ${deletedProjects.count} projects`);
    
    // Delete entity relationships for backup tasks
    const deletedRelationships = await prisma.entityRelationship.deleteMany({
      where: {
        AND: [
          { relationshipType: 'assigned_to' },
          { sourceType: 'Task' },
          { sourceId: { startsWith: 'cmet' } }
        ]
      }
    });
    
    console.log(`🗑️  Deleted ${deletedRelationships.count} task assignment relationships`);
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});