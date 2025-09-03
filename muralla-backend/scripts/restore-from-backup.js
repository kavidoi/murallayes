#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key] = valueParts.join('=').replace(/"/g, '');
    }
  });
}

const prisma = new PrismaClient();

/**
 * Data Restoration Script
 * Restores projects, tasks, and subtasks from JSON backup
 */

class DataRestoration {
  constructor() {
    this.projects = new Map();
    this.users = new Map();
    this.createdProjects = new Map();
    this.createdTasks = new Map();
  }

  /**
   * Parse due date from DD/MM/YYYY format to ISO string
   */
  parseDueDate(dateString) {
    if (!dateString || dateString === '') return null;
    
    try {
      const [day, month, year] = dateString.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toISOString();
    } catch (error) {
      console.warn(`⚠️  Invalid date format: ${dateString}`);
      return null;
    }
  }

  /**
   * Map status from backup to database enum
   */
  mapStatus(status) {
    const statusMap = {
      'New': 'PENDING',
      'In Progress': 'IN_PROGRESS', 
      'Completed': 'COMPLETED',
      'Done': 'COMPLETED',
      'Blocked': 'PENDING'
    };
    
    return statusMap[status] || 'PENDING';
  }

  /**
   * Get or create default users (since we don't have user data in backup)
   */
  async ensureUsers() {
    console.log('👥 Ensuring default users exist...');
    
    try {
      // Check if users exist
      const existingUsers = await prisma.user.findMany({
        where: { isDeleted: false }
      });
      
      if (existingUsers.length === 0) {
        // Create default users based on the IDs found in backup
        const defaultUsers = [
          {
            id: 'cmegb49sn0002sun7fhlnn5tr',
            firstName: 'Usuario',
            lastName: 'Uno',
            email: 'usuario1@muralla.com',
            password: 'temppass123' // Should be changed after restoration
          },
          {
            id: 'cmegb4bbk0003sun7f0im9vha', 
            firstName: 'Usuario',
            lastName: 'Dos',
            email: 'usuario2@muralla.com',
            password: 'temppass123' // Should be changed after restoration
          }
        ];
        
        for (const userData of defaultUsers) {
          const user = await prisma.user.create({
            data: {
              ...userData,
              tenantId: 'default-tenant'
            }
          });
          this.users.set(userData.id, user);
          console.log(`✅ Created user: ${user.firstName} ${user.lastName}`);
        }
      } else {
        // Use existing users
        existingUsers.forEach(user => {
          this.users.set(user.id, user);
        });
        console.log(`✅ Found ${existingUsers.length} existing users`);
      }
      
    } catch (error) {
      console.error('❌ Error ensuring users:', error.message);
      throw error;
    }
  }

  /**
   * Extract unique projects from tasks data
   */
  extractProjects(tasksData) {
    console.log('📁 Extracting projects from backup...');
    
    const projects = new Map();
    
    tasksData.tasks.forEach(task => {
      if (task.projectId && task.projectName) {
        if (!projects.has(task.projectId)) {
          projects.set(task.projectId, {
            id: task.projectId,
            name: task.projectName,
            description: `Restored project: ${task.projectName}`,
            status: 'ACTIVE'
          });
        }
      }
    });
    
    console.log(`📊 Found ${projects.size} unique projects:`);
    projects.forEach((project, id) => {
      console.log(`  📁 ${project.name} (${id})`);
    });
    
    return projects;
  }

  /**
   * Create projects in database
   */
  async createProjects(projectsMap) {
    console.log('🏗️  Creating projects...');
    
    try {
      for (const [originalId, projectData] of projectsMap) {
        const project = await prisma.project.create({
          data: {
            name: projectData.name,
            description: projectData.description,
            tenantId: 'default-tenant',
            createdBy: Array.from(this.users.keys())[0] || 'system'
          }
        });
        
        this.createdProjects.set(originalId, project);
        console.log(`✅ Created project: ${project.name} (${project.id})`);
      }
      
      console.log(`🎉 Successfully created ${this.createdProjects.size} projects`);
      
    } catch (error) {
      console.error('❌ Error creating projects:', error.message);
      throw error;
    }
  }

  /**
   * Create tasks and subtasks
   */
  async createTasks(tasksData) {
    console.log('📝 Creating tasks and subtasks...');
    
    try {
      let taskCount = 0;
      let subtaskCount = 0;
      
      for (const taskData of tasksData.tasks) {
        if (!taskData.projectId || !this.createdProjects.has(taskData.projectId)) {
          console.warn(`⚠️  Skipping task "${taskData.name}" - no matching project`);
          continue;
        }
        
        const project = this.createdProjects.get(taskData.projectId);
        
        // Create main task
        const task = await prisma.task.create({
          data: {
            title: taskData.name,
            description: `Restored task: ${taskData.name}`,
            status: this.mapStatus(taskData.status),
            dueDate: this.parseDueDate(taskData.dueDate),
            projectId: project.id,
            tenantId: 'default-tenant',
            createdBy: Array.from(this.users.keys())[0] || 'system',
            assigneeId: taskData.assigneeIds && taskData.assigneeIds.length > 0 && this.users.has(taskData.assigneeIds[0]) 
              ? taskData.assigneeIds[0] 
              : Array.from(this.users.keys())[0] || null
          }
        });
        
        this.createdTasks.set(taskData.id, task);
        taskCount++;
        
        console.log(`✅ Created task: ${task.title}`);
        
        // Create subtasks (as child tasks since there's no separate Subtask model)
        if (taskData.subtasks && taskData.subtasks.length > 0) {
          for (const subtaskData of taskData.subtasks) {
            const subtask = await prisma.task.create({
              data: {
                title: subtaskData.name,
                description: `Restored subtask: ${subtaskData.name}`,
                status: this.mapStatus(subtaskData.status),
                dueDate: this.parseDueDate(subtaskData.dueDate),
                projectId: project.id,
                parentTaskId: task.id, // This makes it a subtask
                tenantId: 'default-tenant',
                createdBy: Array.from(this.users.keys())[0] || 'system',
                assigneeId: subtaskData.assigneeIds && subtaskData.assigneeIds.length > 0 && this.users.has(subtaskData.assigneeIds[0])
                  ? subtaskData.assigneeIds[0]
                  : Array.from(this.users.keys())[0] || null
              }
            });
            
            subtaskCount++;
            console.log(`  ✅ Created subtask: ${subtask.title}`);
          }
        }
      }
      
      console.log(`🎉 Successfully created ${taskCount} tasks and ${subtaskCount} subtasks`);
      
    } catch (error) {
      console.error('❌ Error creating tasks:', error.message);
      throw error;
    }
  }

  /**
   * Main restoration process
   */
  async restore(backupFilePath) {
    try {
      console.log('🔄 Starting data restoration...');
      console.log(`📁 Reading backup file: ${backupFilePath}`);
      
      // Read and parse backup file
      const backupContent = fs.readFileSync(backupFilePath, 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      if (!backupData.tasks || !Array.isArray(backupData.tasks)) {
        throw new Error('Invalid backup format - missing tasks array');
      }
      
      console.log(`📊 Found ${backupData.tasks.length} tasks in backup`);
      
      // Ensure users exist
      await this.ensureUsers();
      
      // Extract and create projects
      const projects = this.extractProjects(backupData);
      await this.createProjects(projects);
      
      // Create tasks and subtasks
      await this.createTasks(backupData);
      
      console.log('✅ Data restoration completed successfully!');
      console.log('');
      console.log('📊 Summary:');
      console.log(`  👥 Users: ${this.users.size}`);
      console.log(`  📁 Projects: ${this.createdProjects.size}`);
      console.log(`  📝 Tasks: ${this.createdTasks.size}`);
      
      // Verify data
      await this.verifyRestoration();
      
    } catch (error) {
      console.error('💥 Restoration failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify restoration was successful
   */
  async verifyRestoration() {
    try {
      console.log('🔍 Verifying restoration...');
      
      const projects = await prisma.project.count({ where: { isDeleted: false } });
      const tasks = await prisma.task.count({ where: { isDeleted: false } });
      const subtasks = await prisma.task.count({ 
        where: { 
          isDeleted: false, 
          parentTaskId: { not: null } 
        } 
      });
      const users = await prisma.user.count({ where: { isDeleted: false } });
      
      console.log('');
      console.log('📈 Database verification:');
      console.log(`  👥 Users: ${users}`);
      console.log(`  📁 Projects: ${projects}`);
      console.log(`  📝 Tasks: ${tasks}`);
      console.log(`  📄 Subtasks: ${subtasks}`);
      
      if (projects > 0 && tasks > 0) {
        console.log('✅ Verification successful - data has been restored!');
      } else {
        console.log('⚠️  Verification warning - some data may be missing');
      }
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
    }
  }
}

// CLI Interface
async function main() {
  const backupFilePath = process.argv[2];
  
  if (!backupFilePath) {
    console.log('📖 Data Restoration Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/restore-from-backup.js <path-to-backup.json>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/restore-from-backup.js "/Users/kavi/Downloads/muralla-tasks-backup-20250825 (1).json"');
    console.log('');
    return;
  }
  
  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ Backup file not found: ${backupFilePath}`);
    process.exit(1);
  }
  
  const restoration = new DataRestoration();
  
  try {
    await restoration.restore(backupFilePath);
    console.log('🎉 All done! Your data has been restored.');
    
  } catch (error) {
    console.error('💥 Restoration failed:', error.message);
    process.exit(1);
    
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = DataRestoration;