import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateData() {
  console.log('🔍 Validating restored data...');
  
  const projectCount = await prisma.project.count({
    where: { isDeleted: false }
  });
  
  const taskCount = await prisma.task.count({
    where: { isDeleted: false }
  });
  
  const relationshipCount = await prisma.entityRelationship.count({
    where: { relationshipType: 'assigned_to', isActive: true }
  });
  
  console.log(`📊 Validation Results:`);
  console.log(`   • Projects: ${projectCount}`);
  console.log(`   • Tasks: ${taskCount}`);
  console.log(`   • Task Assignments: ${relationshipCount}`);
  
  // Get existing project IDs
  const existingProjects = await prisma.project.findMany({
    select: { id: true }
  });
  const existingProjectIds = existingProjects.map(p => p.id);
  
  // Check for orphaned tasks (tasks without valid projects)
  const orphanedTasks = await prisma.task.findMany({
    where: {
      isDeleted: false,
      projectId: {
        notIn: existingProjectIds
      }
    },
    select: { id: true, title: true, projectId: true }
  });
  
  if (orphanedTasks.length > 0) {
    console.log(`⚠️  Found ${orphanedTasks.length} orphaned tasks:`);
    orphanedTasks.forEach(task => {
      console.log(`   • ${task.title} (${task.id}) - Project ID: ${task.projectId}`);
    });
  }
  
  // Check task hierarchy integrity
  const tasksWithInvalidParents = await prisma.task.findMany({
    where: {
      parentTaskId: { not: null },
      isDeleted: false
    },
    select: { 
      id: true, 
      title: true, 
      parentTaskId: true,
      parentTask: {
        select: { id: true, title: true }
      }
    }
  });
  
  const invalidParents = tasksWithInvalidParents.filter(task => !task.parentTask);
  
  if (invalidParents.length > 0) {
    console.log(`⚠️  Found ${invalidParents.length} tasks with invalid parent references:`);
    invalidParents.forEach(task => {
      console.log(`   • ${task.title} (${task.id}) - Parent ID: ${task.parentTaskId}`);
    });
  }
  
  // Show project breakdown
  console.log('\n📁 Projects and their task counts:');
  const projectsWithTasks = await prisma.project.findMany({
    where: { isDeleted: false },
    include: {
      _count: {
        select: { tasks: true }
      }
    }
  });
  
  projectsWithTasks.forEach(project => {
    console.log(`   • ${project.name}: ${project._count.tasks} tasks`);
  });
  
  // Show task hierarchy summary
  console.log('\n🗂️  Task hierarchy:');
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
  
  console.log('\n✅ Data validation completed successfully!');
}

async function main() {
  try {
    await validateData();
  } catch (error) {
    console.error('💥 Error during validation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});