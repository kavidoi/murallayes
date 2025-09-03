const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Helper function to read CSV files without external dependencies
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        resolve([]);
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      const results = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let current = '';
        let inQuotes = false;
        
        // Handle CSV with quoted values containing commas
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim()); // Add the last value
        
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        
        results.push(obj);
      }
      
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to parse dates
function parseDate(dateString) {
  if (!dateString || dateString === '') return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

// Helper function to parse boolean values
function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1' || value === 't';
  }
  return Boolean(value);
}

async function restoreProjects() {
  console.log('🔄 Starting project restoration...');
  
  const projectsFile = path.join(__dirname, '../../backup_projects.csv');
  if (!fs.existsSync(projectsFile)) {
    console.log('❌ Projects backup file not found:', projectsFile);
    return [];
  }

  const projects = await readCSV(projectsFile);
  const restoredProjects = [];

  for (const project of projects) {
    if (!project.id || project.id.trim() === '') continue;

    try {
      // Check if project already exists
      const existingProject = await prisma.project.findUnique({
        where: { id: project.id }
      });

      if (existingProject) {
        console.log(`⚠️  Project already exists: ${project.name} (${project.id})`);
        restoredProjects.push(existingProject);
        continue;
      }

      const projectData = {
        id: project.id,
        name: project.name || 'Unnamed Project',
        description: project.description || null,
        createdAt: parseDate(project.createdAt) || new Date(),
        updatedAt: parseDate(project.updatedAt) || new Date(),
        createdBy: project.createdBy || 'system',
        deletedAt: parseDate(project.deletedAt),
        deletedBy: project.deletedBy || null,
        isDeleted: parseBoolean(project.isDeleted),
        tenantId: project.tenantId || 'default-tenant',
        deadline: parseDate(project.deadline),
        kind: project.kind || 'STANDARD'
      };

      const restoredProject = await prisma.project.create({
        data: projectData
      });

      console.log(`✅ Restored project: ${restoredProject.name} (${restoredProject.id})`);
      restoredProjects.push(restoredProject);

    } catch (error) {
      console.error(`❌ Error restoring project ${project.name}:`, error.message);
    }
  }

  console.log(`📊 Projects restoration completed: ${restoredProjects.length} projects restored`);
  return restoredProjects;
}

async function restoreTasks() {
  console.log('🔄 Starting task restoration...');
  
  const tasksFile = path.join(__dirname, '../../backup_tasks.csv');
  if (!fs.existsSync(tasksFile)) {
    console.log('❌ Tasks backup file not found:', tasksFile);
    return [];
  }

  const tasks = await readCSV(tasksFile);
  const restoredTasks = [];

  // Sort tasks to ensure parent tasks are created before subtasks
  const sortedTasks = tasks.sort((a, b) => {
    // Tasks without parentTaskId come first
    if (!a.parentTaskId && b.parentTaskId) return -1;
    if (a.parentTaskId && !b.parentTaskId) return 1;
    return 0;
  });

  for (const task of sortedTasks) {
    if (!task.id || task.id.trim() === '') continue;

    try {
      // Check if task already exists
      const existingTask = await prisma.task.findUnique({
        where: { id: task.id }
      });

      if (existingTask) {
        console.log(`⚠️  Task already exists: ${task.title} (${task.id})`);
        restoredTasks.push(existingTask);
        continue;
      }

      // Verify project exists
      if (task.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: task.projectId }
        });
        if (!project) {
          console.log(`⚠️  Skipping task ${task.title}: Project ${task.projectId} not found`);
          continue;
        }
      }

      // Verify parent task exists if this is a subtask
      if (task.parentTaskId) {
        const parentTask = await prisma.task.findUnique({
          where: { id: task.parentTaskId }
        });
        if (!parentTask) {
          console.log(`⚠️  Skipping subtask ${task.title}: Parent task ${task.parentTaskId} not found`);
          continue;
        }
      }

      // Verify assignee exists if provided
      let assigneeId = null;
      if (task.assigneeId && task.assigneeId.trim() !== '') {
        const assignee = await prisma.user.findUnique({
          where: { id: task.assigneeId }
        });
        if (assignee) {
          assigneeId = task.assigneeId;
        } else {
          console.log(`⚠️  Assignee ${task.assigneeId} not found for task ${task.title}, creating without assignee`);
        }
      }

      const taskData = {
        id: task.id,
        title: task.title || 'Untitled Task',
        description: task.description || null,
        status: task.status || 'PENDING',
        projectId: task.projectId || null,
        assigneeId: assigneeId,
        createdAt: parseDate(task.createdAt) || new Date(),
        updatedAt: parseDate(task.updatedAt) || new Date(),
        createdBy: task.createdBy || 'system',
        deletedAt: parseDate(task.deletedAt),
        deletedBy: task.deletedBy || null,
        isDeleted: parseBoolean(task.isDeleted),
        tenantId: task.tenantId || 'default-tenant',
        priority: task.priority || 'MEDIUM',
        actualCost: task.actualCost ? parseFloat(task.actualCost) : null,
        budgetLineId: task.budgetLineId || null,
        dueDate: parseDate(task.dueDate),
        dueTime: task.dueTime || null,
        orderIndex: task.orderIndex ? parseInt(task.orderIndex) : 0,
        parentTaskId: task.parentTaskId || null,
        dueDateModifiedAt: parseDate(task.dueDateModifiedAt),
        statusModifiedByUser: parseBoolean(task.statusModifiedByUser),
        wasEnProgreso: parseBoolean(task.wasEnProgreso)
      };

      const restoredTask = await prisma.task.create({
        data: taskData
      });

      console.log(`✅ Restored task: ${restoredTask.title} (${restoredTask.id})`);
      restoredTasks.push(restoredTask);

    } catch (error) {
      console.error(`❌ Error restoring task ${task.title}:`, error.message);
    }
  }

  console.log(`📊 Tasks restoration completed: ${restoredTasks.length} tasks restored`);
  return restoredTasks;
}

async function migrateTaskAssignees() {
  console.log('🔄 Starting task assignee migration to Universal Relationship System...');
  
  // Get all tasks with assignees
  const tasksWithAssignees = await prisma.task.findMany({
    where: {
      assigneeId: { not: null },
      isDeleted: false
    },
    include: {
      assignee: true
    }
  });

  let migratedCount = 0;

  for (const task of tasksWithAssignees) {
    try {
      // Check if relationship already exists
      const existingRelationship = await prisma.entityRelationship.findFirst({
        where: {
          relationshipType: 'assigned_to',
          sourceType: 'Task',
          sourceId: task.id,
          targetType: 'User',
          targetId: task.assigneeId,
          isDeleted: false
        }
      });

      if (existingRelationship) {
        console.log(`⚠️  Relationship already exists for task: ${task.title}`);
        continue;
      }

      // Create EntityRelationship record
      await prisma.entityRelationship.create({
        data: {
          relationshipType: 'assigned_to',
          sourceType: 'Task',
          sourceId: task.id,
          targetType: 'User',
          targetId: task.assigneeId,
          strength: 5,
          priority: 10,
          metadata: {
            role: 'assignee',
            assignedAt: task.createdAt,
            taskTitle: task.title,
            userName: task.assignee?.firstName + ' ' + task.assignee?.lastName
          },
          isActive: true,
          isDeleted: false,
          tenantId: task.tenantId || 'default-tenant',
          createdBy: task.createdBy || 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Migrated assignee relationship for task: ${task.title} -> ${task.assignee?.firstName} ${task.assignee?.lastName}`);
      migratedCount++;

    } catch (error) {
      console.error(`❌ Error migrating assignee for task ${task.title}:`, error.message);
    }
  }

  console.log(`📊 Task assignee migration completed: ${migratedCount} relationships migrated`);
  return migratedCount;
}

async function validateRestoredData() {
  console.log('🔍 Validating restored data...');
  
  const projectCount = await prisma.project.count({ where: { isDeleted: false } });
  const taskCount = await prisma.task.count({ where: { isDeleted: false } });
  const relationshipCount = await prisma.entityRelationship.count({
    where: {
      relationshipType: 'assigned_to',
      isDeleted: false
    }
  });

  console.log(`📊 Validation Results:`);
  console.log(`   - Projects: ${projectCount}`);
  console.log(`   - Tasks: ${taskCount}`);
  console.log(`   - Task Assignee Relationships: ${relationshipCount}`);

  // Check for orphaned tasks (tasks with projectId but no valid project)
  const orphanedTasks = await prisma.task.findMany({
    where: {
      AND: [
        { projectId: { not: "" } },
        { isDeleted: false }
      ]
    },
    include: {
      project: true
    }
  });
  
  const actualOrphanedTasks = orphanedTasks.filter(task => !task.project);

  if (actualOrphanedTasks.length > 0) {
    console.log(`⚠️  Found ${actualOrphanedTasks.length} orphaned tasks (tasks with invalid projectId)`);
  }

  // Check for broken subtask relationships
  const orphanedSubtasks = await prisma.task.findMany({
    where: {
      parentTaskId: { not: "" },
      isDeleted: false
    },
    include: {
      parentTask: true
    }
  });

  const brokenSubtasks = orphanedSubtasks.filter(task => !task.parentTask);
  if (brokenSubtasks.length > 0) {
    console.log(`⚠️  Found ${brokenSubtasks.length} orphaned subtasks (subtasks with invalid parentTaskId)`);
  }

  return {
    projects: projectCount,
    tasks: taskCount,
    relationships: relationshipCount,
    orphanedTasks: actualOrphanedTasks.length,
    orphanedSubtasks: brokenSubtasks.length
  };
}

async function main() {
  try {
    console.log('🚀 Starting data restoration process...');
    console.log('=' .repeat(60));

    // Step 1: Restore Projects
    const projects = await restoreProjects();
    
    // Step 2: Restore Tasks
    const tasks = await restoreTasks();
    
    // Step 3: Migrate Task Assignees to Universal Relationship System
    const migratedRelationships = await migrateTaskAssignees();
    
    // Step 4: Validate restored data
    const validation = await validateRestoredData();
    
    console.log('=' .repeat(60));
    console.log('🎉 Data restoration completed successfully!');
    console.log(`📈 Summary:`);
    console.log(`   - Projects restored: ${projects.length}`);
    console.log(`   - Tasks restored: ${tasks.length}`);
    console.log(`   - Assignee relationships migrated: ${migratedRelationships}`);
    
    if (validation.orphanedTasks > 0 || validation.orphanedSubtasks > 0) {
      console.log(`⚠️  Data integrity issues found - please review orphaned records`);
    }

  } catch (error) {
    console.error('💥 Fatal error during restoration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  restoreProjects,
  restoreTasks,
  migrateTaskAssignees,
  validateRestoredData
};
