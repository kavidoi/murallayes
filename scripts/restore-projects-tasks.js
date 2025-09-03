#!/usr/bin/env node

/**
 * Data Recovery Script for Projects and Tasks
 * Restores legitimate projects and tasks from backup database
 * Removes mock/test data and replaces with real business data
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../muralla-backend/node_modules/@prisma/client');

const prisma = new PrismaClient();

// Read CSV files
function readCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((header, index) => {
      let value = values[index] || '';
      
      // Handle empty values
      if (value === '' || value === 'null') {
        obj[header] = null;
      }
      // Handle boolean values
      else if (value === 't' || value === 'true') {
        obj[header] = true;
      } else if (value === 'f' || value === 'false') {
        obj[header] = false;
      }
      // Handle numeric values
      else if (header === 'orderIndex' || header === 'actualCost') {
        obj[header] = value ? parseFloat(value) : (header === 'orderIndex' ? 0 : null);
      }
      // Handle dates
      else if (header.includes('At') || header.includes('Date')) {
        obj[header] = value ? new Date(value) : null;
      }
      // Handle enums
      else if (header === 'kind') {
        obj[header] = value || 'CORE';
      } else if (header === 'status') {
        obj[header] = value || 'PENDING';
      } else if (header === 'priority') {
        obj[header] = value || 'MEDIUM';
      }
      // String values
      else {
        obj[header] = value || null;
      }
    });
    
    return obj;
  });
}

async function cleanupExistingData() {
  console.log('🧹 Cleaning up existing mock data...');
  
  // Delete existing tasks and projects (this will cascade)
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  
  console.log('✅ Existing data cleaned up');
}

async function restoreProjects() {
  console.log('📁 Restoring projects...');
  
  const projectsData = readCSV(path.join(__dirname, '../backup_projects.csv'));
  
  for (const project of projectsData) {
    // Clean up description to remove "Restored project:" prefix
    const cleanDescription = project.description?.replace(/^Restored project: /, '') || null;
    
    await prisma.project.create({
      data: {
        id: project.id,
        name: project.name,
        description: cleanDescription,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        createdBy: project.createdBy,
        deletedAt: project.deletedAt,
        deletedBy: project.deletedBy,
        isDeleted: project.isDeleted,
        tenantId: project.tenantId,
        deadline: project.deadline,
        kind: project.kind,
      }
    });
    
    console.log(`  ✅ Restored project: ${project.name}`);
  }
  
  console.log(`📁 Restored ${projectsData.length} projects`);
}

async function restoreTasks() {
  console.log('📋 Restoring tasks...');
  
  const tasksData = readCSV(path.join(__dirname, '../backup_tasks.csv'));
  
  // Sort tasks to ensure parent tasks are created before subtasks
  const parentTasks = tasksData.filter(task => !task.parentTaskId);
  const subTasks = tasksData.filter(task => task.parentTaskId);
  
  // Restore parent tasks first
  for (const task of parentTasks) {
    await createTask(task);
  }
  
  // Then restore subtasks
  for (const task of subTasks) {
    await createTask(task);
  }
  
  console.log(`📋 Restored ${tasksData.length} tasks (${parentTasks.length} parent, ${subTasks.length} subtasks)`);
}

async function createTask(task) {
  // Clean up description to remove "Restored task:" or "Restored subtask:" prefix
  const cleanDescription = task.description?.replace(/^Restored (sub)?task: /, '') || null;
  
  // Check if assignee exists, if not set to null
  let assigneeId = null;
  if (task.assigneeId) {
    const assigneeExists = await prisma.user.findUnique({
      where: { id: task.assigneeId }
    });
    if (assigneeExists) {
      assigneeId = task.assigneeId;
    }
  }
  
  // Check if createdBy user exists, if not set to null
  let createdBy = null;
  if (task.createdBy) {
    const creatorExists = await prisma.user.findUnique({
      where: { id: task.createdBy }
    });
    if (creatorExists) {
      createdBy = task.createdBy;
    }
  }
  
  await prisma.task.create({
    data: {
      id: task.id,
      title: task.title,
      description: cleanDescription,
      status: task.status,
      projectId: task.projectId,
      assigneeId: assigneeId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      createdBy: createdBy,
      deletedAt: task.deletedAt,
      deletedBy: task.deletedBy,
      isDeleted: task.isDeleted,
      tenantId: task.tenantId,
      priority: task.priority,
      actualCost: task.actualCost,
      budgetLineId: task.budgetLineId,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      orderIndex: task.orderIndex,
      parentTaskId: task.parentTaskId,
      dueDateModifiedAt: task.dueDateModifiedAt,
      statusModifiedByUser: task.statusModifiedByUser,
      wasEnProgreso: task.wasEnProgreso,
    }
  });
  
  const taskType = task.parentTaskId ? 'subtask' : 'task';
  const assigneeNote = assigneeId ? '' : ' (assignee cleared - user not found)';
  console.log(`  ✅ Restored ${taskType}: ${task.title}${assigneeNote}`);
}

async function restoreTaskAssignees() {
  console.log('👥 Restoring task assignees...');
  
  const assigneesPath = path.join(__dirname, '../backup_task_assignees.csv');
  if (!fs.existsSync(assigneesPath)) {
    console.log('  ⚠️  No task assignees backup found, skipping...');
    return;
  }
  
  const assigneesData = readCSV(assigneesPath);
  
  for (const assignee of assigneesData) {
    try {
      await prisma.taskAssignee.create({
        data: {
          id: assignee.id,
          taskId: assignee.taskId,
          userId: assignee.userId,
          createdAt: assignee.createdAt,
          updatedAt: assignee.updatedAt,
          createdBy: assignee.createdBy,
          tenantId: assignee.tenantId,
        }
      });
    } catch (error) {
      console.log(`  ⚠️  Skipped assignee for task ${assignee.taskId}: ${error.message}`);
    }
  }
  
  console.log(`👥 Restored ${assigneesData.length} task assignees`);
}

async function restoreComments() {
  console.log('💬 Restoring task comments...');
  
  const commentsPath = path.join(__dirname, '../backup_comments.csv');
  if (!fs.existsSync(commentsPath)) {
    console.log('  ⚠️  No comments backup found, skipping...');
    return;
  }
  
  const commentsData = readCSV(commentsPath);
  
  for (const comment of commentsData) {
    try {
      await prisma.comment.create({
        data: {
          id: comment.id,
          content: comment.content,
          taskId: comment.taskId,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          createdBy: comment.createdBy,
          deletedAt: comment.deletedAt,
          deletedBy: comment.deletedBy,
          isDeleted: comment.isDeleted,
          tenantId: comment.tenantId,
        }
      });
    } catch (error) {
      console.log(`  ⚠️  Skipped comment for task ${comment.taskId}: ${error.message}`);
    }
  }
  
  console.log(`💬 Restored ${commentsData.length} task comments`);
}

async function verifyRestoration() {
  console.log('🔍 Verifying restoration...');
  
  const projectCount = await prisma.project.count({ where: { isDeleted: false } });
  const taskCount = await prisma.task.count({ where: { isDeleted: false } });
  const subtaskCount = await prisma.task.count({ 
    where: { 
      isDeleted: false,
      parentTaskId: { not: null }
    }
  });
  
  console.log(`📊 Restoration Summary:`);
  console.log(`  Projects: ${projectCount}`);
  console.log(`  Tasks: ${taskCount} (${taskCount - subtaskCount} parent, ${subtaskCount} subtasks)`);
  
  // Show project breakdown
  const projects = await prisma.project.findMany({
    where: { isDeleted: false },
    include: {
      tasks: {
        where: { isDeleted: false }
      }
    }
  });
  
  console.log(`\n📁 Projects restored:`);
  for (const project of projects) {
    console.log(`  • ${project.name}: ${project.tasks.length} tasks`);
  }
}

async function main() {
  try {
    console.log('🚀 Starting data recovery process...\n');
    
    await cleanupExistingData();
    await restoreProjects();
    await restoreTasks();
    await restoreTaskAssignees();
    await restoreComments();
    await verifyRestoration();
    
    console.log('\n✅ Data recovery completed successfully!');
    console.log('🎉 Your legitimate projects and tasks have been restored.');
    
  } catch (error) {
    console.error('❌ Error during data recovery:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
