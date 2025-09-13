import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://muralla:1234@localhost:5433/muralla_db"
    }
  }
});

async function exportData() {
  try {
    console.log('🔄 Connecting to local database...');
    
    // Export projects
    const projects = await prisma.project.findMany({
      include: {
        tasks: true
      }
    });
    
    // Export tasks  
    const tasks = await prisma.task.findMany({
      include: {
        subtasks: true
      }
    });
    
    // Export entity relationships
    const relationships = await prisma.entityRelationship.findMany();
    
    // Export users (needed for relationships)
    const users = await prisma.user.findMany();
    
    const exportData = {
      projects,
      tasks,
      relationships,
      users,
      exportedAt: new Date().toISOString()
    };
    
    // Write to file
    fs.writeFileSync('project_data_backup.json', JSON.stringify(exportData, null, 2));
    
    console.log('✅ Data exported successfully!');
    console.log(`📊 Exported:`);
    console.log(`   - ${projects.length} projects`);
    console.log(`   - ${tasks.length} tasks`);
    console.log(`   - ${relationships.length} relationships`);
    console.log(`   - ${users.length} users`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();