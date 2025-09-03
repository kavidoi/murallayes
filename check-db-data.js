const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Checking database data...');
    
    // Check projects
    const projects = await prisma.project.findMany({
      where: { isDeleted: false },
      include: {
        tasks: {
          where: { isDeleted: false },
          include: {
            subtasks: {
              where: { isDeleted: false }
            }
          }
        }
      }
    });
    
    console.log(`📊 Found ${projects.length} projects`);
    
    if (projects.length > 0) {
      projects.forEach(project => {
        console.log(`  📁 Project: ${project.name} (${project.tasks.length} tasks)`);
        project.tasks.forEach(task => {
          console.log(`    📝 Task: ${task.title} - ${task.status} (${task.subtasks.length} subtasks)`);
        });
      });
    } else {
      console.log('❌ No projects found in database');
    }
    
    // Check users
    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, email: true }
    });
    
    console.log(`👥 Found ${users.length} users`);
    
    // Check if database is completely empty
    const totalProjects = await prisma.project.count();
    const totalTasks = await prisma.task.count();
    const totalUsers = await prisma.user.count();
    
    console.log('\n📈 Total records (including deleted):');
    console.log(`  Projects: ${totalProjects}`);
    console.log(`  Tasks: ${totalTasks}`);
    console.log(`  Users: ${totalUsers}`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();