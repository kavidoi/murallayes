import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backupData() {
  try {
    console.log('🔄 Starting data backup...');
    
    // Create backup directory
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    
    // Fetch all data
    console.log('📊 Fetching projects...');
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          include: {
            subtasks: true,
            comments: true,
            budgetLine: true,
            parentTask: true
          }
        }
      }
    });
    
    console.log('📋 Fetching standalone tasks...');
    const standaloneTasks = await prisma.task.findMany({
      where: {
        project: {
          isDeleted: false
        }
      },
      include: {
        subtasks: true,
        comments: true,
        budgetLine: true,
        parentTask: true,
        project: true
      }
    });
    
    console.log('👥 Fetching users...');
    const users = await prisma.user.findMany();
    
    console.log('🛡️ Fetching roles...');
    const roles = await prisma.role.findMany();
    
    // Prepare backup data
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        users,
        roles,
        projects,
        standaloneTasks,
        summary: {
          usersCount: users.length,
          rolesCount: roles.length,
          projectsCount: projects.length,
          totalTasksCount: projects.reduce((acc, p) => acc + p.tasks.length, 0) + standaloneTasks.length,
          totalSubtasksCount: projects.reduce((acc, p) => 
            acc + p.tasks.reduce((taskAcc, t) => taskAcc + t.subtasks.length, 0), 0) + 
            standaloneTasks.reduce((acc, t) => acc + t.subtasks.length, 0)
        }
      }
    };
    
    // Write backup file
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log('✅ Backup completed!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${backupData.data.summary.usersCount}`);
    console.log(`   - Roles: ${backupData.data.summary.rolesCount}`);
    console.log(`   - Projects: ${backupData.data.summary.projectsCount}`);
    console.log(`   - Total Tasks: ${backupData.data.summary.totalTasksCount}`);
    console.log(`   - Total Subtasks: ${backupData.data.summary.totalSubtasksCount}`);
    
    return backupFile;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup if called directly
if (require.main === module) {
  backupData().catch(console.error);
}

export { backupData };