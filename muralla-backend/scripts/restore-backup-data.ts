import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BackupProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  deletedAt: string;
  deletedBy: string;
  isDeleted: string;
  tenantId: string;
  deadline: string;
  kind: string;
}

interface BackupTask {
  id: string;
  title: string;
  description: string;
  status: string;
  projectId: string;
  assigneeId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  deletedAt: string;
  deletedBy: string;
  isDeleted: string;
  tenantId: string;
  priority: string;
  actualCost: string;
  budgetLineId: string;
  dueDate: string;
  dueTime: string;
  orderIndex: string;
  parentTaskId: string;
  dueDateModifiedAt: string;
  statusModifiedByUser: string;
  wasEnProgreso: string;
}

// Utility functions
function parseBoolean(value: string): boolean {
  return value === 't' || value === 'true';
}

function parseDecimal(value: string): number | undefined {
  if (!value || value === '') return undefined;
  return parseFloat(value);
}

function parseDateTime(value: string): Date | undefined {
  if (!value || value === '') return undefined;
  return new Date(value);
}

function parseInt(value: string): number {
  if (!value || value === '') return 0;
  return Number(value);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function readCSV<T>(filePath: string): Promise<T[]> {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const results: T[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: any = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    
    results.push(obj as T);
  }
  
  return results;
}

async function restoreProjects() {
  console.log('📁 Restoring projects...');
  
  const projectsFile = '/Users/kavi/Sharedcodingprojects/Muralla-4.0/backup_projects.csv';
  const projects = await readCSV<BackupProject>(projectsFile);
  
  for (const project of projects) {
    try {
      const existingProject = await prisma.project.findUnique({
        where: { id: project.id }
      });
      
      if (existingProject) {
        console.log(`⚠️  Project ${project.name} already exists, skipping...`);
        continue;
      }
      
      await prisma.project.create({
        data: {
          id: project.id,
          name: project.name,
          description: project.description || null,
          createdAt: parseDateTime(project.createdAt) || new Date(),
          updatedAt: parseDateTime(project.updatedAt) || new Date(),
          createdBy: project.createdBy || null,
          deletedAt: parseDateTime(project.deletedAt),
          deletedBy: project.deletedBy || null,
          isDeleted: parseBoolean(project.isDeleted),
          tenantId: project.tenantId || null,
          deadline: parseDateTime(project.deadline),
          kind: (project.kind as any) || 'CORE', // Default to CORE if not specified
        }
      });
      
      console.log(`✅ Created project: ${project.name}`);
    } catch (error) {
      console.error(`❌ Failed to create project ${project.name}:`, error);
    }
  }
}

async function restoreTasks() {
  console.log('📝 Restoring tasks...');
  
  const tasksFile = '/Users/kavi/Sharedcodingprojects/Muralla-4.0/backup_tasks.csv';
  const tasks = await readCSV<BackupTask>(tasksFile);
  
  // Sort tasks to ensure parent tasks are created before subtasks
  const sortedTasks = tasks.sort((a, b) => {
    // Tasks without parentTaskId (parent tasks) come first
    if (!a.parentTaskId && b.parentTaskId) return -1;
    if (a.parentTaskId && !b.parentTaskId) return 1;
    return 0;
  });
  
  const taskAssignments: { taskId: string; assigneeId: string }[] = [];
  
  for (const task of sortedTasks) {
    try {
      const existingTask = await prisma.task.findUnique({
        where: { id: task.id }
      });
      
      if (existingTask) {
        console.log(`⚠️  Task ${task.title} already exists, skipping...`);
        continue;
      }
      
      // Validate parent task exists if parentTaskId is provided
      if (task.parentTaskId) {
        const parentExists = await prisma.task.findUnique({
          where: { id: task.parentTaskId }
        });
        
        if (!parentExists) {
          console.log(`⚠️  Parent task not found for ${task.title}, creating as root task...`);
          task.parentTaskId = '';
        }
      }
      
      await prisma.task.create({
        data: {
          id: task.id,
          title: task.title,
          description: task.description || null,
          status: (task.status as any) || 'PENDING',
          projectId: task.projectId,
          createdAt: parseDateTime(task.createdAt) || new Date(),
          updatedAt: parseDateTime(task.updatedAt) || new Date(),
          createdBy: task.createdBy || null,
          deletedAt: parseDateTime(task.deletedAt),
          deletedBy: task.deletedBy || null,
          isDeleted: parseBoolean(task.isDeleted),
          tenantId: task.tenantId || null,
          priority: (task.priority as any) || 'MEDIUM',
          actualCost: parseDecimal(task.actualCost),
          budgetLineId: task.budgetLineId || null,
          dueDate: parseDateTime(task.dueDate),
          dueTime: task.dueTime || null,
          orderIndex: parseInt(task.orderIndex),
          parentTaskId: task.parentTaskId || null,
          dueDateModifiedAt: parseDateTime(task.dueDateModifiedAt),
          statusModifiedByUser: parseBoolean(task.statusModifiedByUser),
          wasEnProgreso: parseBoolean(task.wasEnProgreso),
        }
      });
      
      // Store assignment for later creation as EntityRelationship
      if (task.assigneeId) {
        taskAssignments.push({
          taskId: task.id,
          assigneeId: task.assigneeId
        });
      }
      
      console.log(`✅ Created task: ${task.title}`);
    } catch (error) {
      console.error(`❌ Failed to create task ${task.title}:`, error);
    }
  }
  
  // Create task assignments as EntityRelationships
  console.log('🔗 Creating task assignments...');
  for (const assignment of taskAssignments) {
    try {
      // Check if the user exists
      const userExists = await prisma.user.findUnique({
        where: { id: assignment.assigneeId }
      });
      
      if (!userExists) {
        console.log(`⚠️  User ${assignment.assigneeId} not found, skipping assignment...`);
        continue;
      }
      
      // Create EntityRelationship for task assignment
      await prisma.entityRelationship.create({
        data: {
          relationshipType: 'assigned_to',
          sourceType: 'Task',
          sourceId: assignment.taskId,
          targetType: 'User',
          targetId: assignment.assigneeId,
          isActive: true,
          strength: 5, // High strength for direct assignments
          tenantId: 'default-tenant',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      
      console.log(`✅ Created assignment relationship for task ${assignment.taskId}`);
    } catch (error) {
      console.error(`❌ Failed to create assignment for task ${assignment.taskId}:`, error);
    }
  }
}

async function ensureRelationshipTypes() {
  console.log('🔧 Ensuring relationship types exist...');
  
  const assignedToType = await prisma.relationshipType.findUnique({
    where: { name: 'assigned_to' }
  });
  
  if (!assignedToType) {
    await prisma.relationshipType.create({
      data: {
        name: 'assigned_to',
        displayName: 'Assigned To',
        description: 'Indicates that a task is assigned to a user',
        sourceTypes: ['Task'],
        targetTypes: ['User'],
        isBidirectional: false,
        defaultStrength: 5,
        isSystem: true,
        isActive: true,
        color: '#3B82F6',
        icon: 'assignment',
        tenantId: 'default-tenant',
      }
    });
    console.log('✅ Created assigned_to relationship type');
  }
}

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
  
  // Check for orphaned tasks (tasks without valid projects)
  const orphanedTasks = await prisma.task.findMany({
    where: {
      isDeleted: false,
      projectId: {
        notIn: await prisma.project.findMany({
          select: { id: true }
        }).then(projects => projects.map(p => p.id))
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
      parentTask: null,
      isDeleted: false
    },
    select: { id: true, title: true, parentTaskId: true }
  });
  
  if (tasksWithInvalidParents.length > 0) {
    console.log(`⚠️  Found ${tasksWithInvalidParents.length} tasks with invalid parent references:`);
    tasksWithInvalidParents.forEach(task => {
      console.log(`   • ${task.title} (${task.id}) - Parent ID: ${task.parentTaskId}`);
    });
  }
}

async function main() {
  try {
    console.log('🚀 Starting backup data restoration...');
    
    await ensureRelationshipTypes();
    await restoreProjects();
    await restoreTasks();
    await validateData();
    
    console.log('🎉 Backup restoration completed successfully!');
  } catch (error) {
    console.error('💥 Error during restoration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle script arguments
const args = process.argv.slice(2);
const forceMode = args.includes('--force');

if (forceMode) {
  console.log('⚠️  Force mode enabled - will overwrite existing data');
}

main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});