#!/usr/bin/env node

/**
 * Migration Script: Task Assignments to EntityRelationship System
 * 
 * This script migrates old task assignment data to the new universal
 * EntityRelationship system for the Muralla-4.0 project.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🚀 Starting Task Relationships Migration...');
  console.log('=====================================');
  
  try {
    // Step 1: Analyze current data
    console.log('📊 Analyzing current data...');
    
    const totalTasks = await prisma.task.count({
      where: { isDeleted: false }
    });
    
    const totalProjects = await prisma.project.count({
      where: { isDeleted: false }
    });
    
    const existingRelationships = await prisma.entityRelationship.count();
    
    console.log(`   • Total Tasks: ${totalTasks}`);
    console.log(`   • Total Projects: ${totalProjects}`);
    console.log(`   • Existing EntityRelationships: ${existingRelationships}`);
    
    // Step 2: Check if we have any backup data or legacy assignee data
    console.log('\n🔍 Checking for legacy assignment data...');
    
    // Look for any backup CSV files that might contain old assignee data
    const fs = require('fs');
    const path = require('path');
    
    const backupFiles = [
      'backup_tasks.csv',
      'backup_task_assignees.csv',
      '../backup_tasks.csv',
      '../backup_task_assignees.csv'
    ];
    
    let foundBackups = [];
    for (const file of backupFiles) {
      const fullPath = path.join(__dirname, file);
      if (fs.existsSync(fullPath)) {
        foundBackups.push(fullPath);
        console.log(`   ✅ Found backup: ${fullPath}`);
      }
    }
    
    if (foundBackups.length === 0) {
      console.log('   ⚠️  No backup files found in expected locations');
      console.log('   📁 Searching project root...');
      
      // Search in project root
      const projectRoot = path.join(__dirname, '..');
      if (fs.existsSync(path.join(projectRoot, 'backup_tasks.csv'))) {
        foundBackups.push(path.join(projectRoot, 'backup_tasks.csv'));
      }
      if (fs.existsSync(path.join(projectRoot, 'backup_task_assignees.csv'))) {
        foundBackups.push(path.join(projectRoot, 'backup_task_assignees.csv'));
      }
    }
    
    // Step 3: Create missing EntityRelationships for task-project relationships
    console.log('\n🔗 Ensuring Task-Project relationships exist...');
    
    const tasks = await prisma.task.findMany({
      where: { isDeleted: false },
      include: {
        project: true
      }
    });
    
    let createdTaskProjectRels = 0;
    
    for (const task of tasks) {
      if (task.project) {
        // Check if relationship already exists
        const existingRel = await prisma.entityRelationship.findFirst({
          where: {
            sourceType: 'Task',
            sourceId: task.id,
            targetType: 'Project', 
            targetId: task.projectId,
            relationshipType: 'belongs_to'
          }
        });
        
        if (!existingRel) {
          await prisma.entityRelationship.create({
            data: {
              sourceType: 'Task',
              sourceId: task.id,
              targetType: 'Project',
              targetId: task.projectId,
              relationshipType: 'belongs_to',
              metadata: {
                field: 'project',
                description: 'Task belongs to project'
              },
              createdBy: task.createdBy || 'system-migration',
              tenantId: task.tenantId
            }
          });
          createdTaskProjectRels++;
        }
      }
    }
    
    console.log(`   ✅ Created ${createdTaskProjectRels} Task-Project relationships`);
    
    // Step 4: Create parent-child relationships for subtasks
    console.log('\n🌳 Creating Task-Subtask relationships...');
    
    const subtasks = await prisma.task.findMany({
      where: { 
        parentTaskId: { not: null },
        isDeleted: false 
      },
      include: {
        parentTask: true
      }
    });
    
    let createdSubtaskRels = 0;
    
    for (const subtask of subtasks) {
      if (subtask.parentTask) {
        // Check if relationship already exists
        const existingRel = await prisma.entityRelationship.findFirst({
          where: {
            sourceType: 'Task',
            sourceId: subtask.id,
            targetType: 'Task',
            targetId: subtask.parentTaskId,
            relationshipType: 'child_of'
          }
        });
        
        if (!existingRel) {
          await prisma.entityRelationship.create({
            data: {
              sourceType: 'Task',
              sourceId: subtask.id,
              targetType: 'Task', 
              targetId: subtask.parentTaskId,
              relationshipType: 'child_of',
              metadata: {
                field: 'parentTask',
                description: 'Subtask relationship'
              },
              createdBy: subtask.createdBy || 'system-migration',
              tenantId: subtask.tenantId
            }
          });
          createdSubtaskRels++;
        }
      }
    }
    
    console.log(`   ✅ Created ${createdSubtaskRels} Task-Subtask relationships`);
    
    // Step 5: Process backup CSV files if found
    if (foundBackups.length > 0) {
      console.log('\n📋 Processing backup CSV files...');
      
      for (const backupFile of foundBackups) {
        console.log(`   📄 Processing: ${path.basename(backupFile)}`);
        
        if (backupFile.includes('task_assignees')) {
          // Process task assignee data - simple CSV parsing
          const csvData = fs.readFileSync(backupFile, 'utf8');
          const lines = csvData.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const records = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const record = {};
            headers.forEach((header, i) => {
              record[header] = values[i];
            });
            return record;
          });
          
          let createdAssigneeRels = 0;
          
          for (const record of records) {
            if (record.taskId && record.userId) {
              // Check if relationship already exists
              const existingRel = await prisma.entityRelationship.findFirst({
                where: {
                  sourceType: 'Task',
                  sourceId: record.taskId,
                  targetType: 'User',
                  targetId: record.userId,
                  relationshipType: 'assigned_to'
                }
              });
              
              if (!existingRel) {
                await prisma.entityRelationship.create({
                  data: {
                    sourceType: 'Task',
                    sourceId: record.taskId,
                    targetType: 'User',
                    targetId: record.userId,
                    relationshipType: 'assigned_to',
                    metadata: {
                      role: record.role || 'assignee',
                      migratedFrom: 'backup_task_assignees'
                    },
                    createdBy: 'system-migration',
                    tenantId: record.tenantId
                  }
                });
                createdAssigneeRels++;
              }
            }
          }
          
          console.log(`      ✅ Migrated ${createdAssigneeRels} task assignments`);
        }
      }
    }
    
    // Step 6: Final statistics
    console.log('\n📈 Migration Summary:');
    console.log('====================');
    
    const finalRelationships = await prisma.entityRelationship.count();
    const taskProjectRels = await prisma.entityRelationship.count({
      where: {
        sourceType: 'Task',
        targetType: 'Project',
        relationshipType: 'belongs_to'
      }
    });
    const taskSubtaskRels = await prisma.entityRelationship.count({
      where: {
        sourceType: 'Task', 
        targetType: 'Task',
        relationshipType: 'child_of'
      }
    });
    const taskAssigneeRels = await prisma.entityRelationship.count({
      where: {
        sourceType: 'Task',
        targetType: 'User', 
        relationshipType: 'assigned_to'
      }
    });
    
    console.log(`   • Total EntityRelationships: ${finalRelationships}`);
    console.log(`   • Task-Project relationships: ${taskProjectRels}`);
    console.log(`   • Task-Subtask relationships: ${taskSubtaskRels}`);
    console.log(`   • Task-Assignee relationships: ${taskAssigneeRels}`);
    console.log(`   • Migration completed successfully! ✅`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };