import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntityRelationshipService } from '../relationships/entity-relationship.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private entityRelationshipService: EntityRelationshipService
  ) {}

  async create(data: any) {
    // Task creation - simplified for EntityRelationship migration
    return this.prisma.task.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async findAll() {
    return this.prisma.task.findMany({
      where: {
        NOT: {
          isDeleted: true
        }
      },
      include: {
        project: true,
        parentTask: true,
        subtasks: true,
        comments: true,
        budgetLine: true
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async findOne(id: string) {
    return this.prisma.task.findFirst({
      where: {
        id,
        NOT: {
          isDeleted: true
        }
      },
      include: {
        // assignee: true, // Removed - now handled by EntityRelationship system
        project: true,
        parentTask: true,
        subtasks: {
          where: {
            NOT: {
              isDeleted: true
            }
          },
          include: {
            // assignee: true // Removed - now handled by EntityRelationship system
          },
          orderBy: [
            { orderIndex: 'asc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.task.findMany({ 
      where: { 
        projectId,
        NOT: {
          isDeleted: true
        },
        parentTaskId: null // Only get top-level tasks
      }, 
      include: { 
        project: true, 
        // assignee: true, // Removed - now handled by EntityRelationship system
        parentTask: true,
        subtasks: true
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async findByAssignee(assigneeId: string): Promise<any[]> {
    // Tasks by assignee - simplified for EntityRelationship migration
    return this.prisma.task.findMany({
      where: {
        isDeleted: false,
        // assigneeId: assigneeId, // Removed - now handled by EntityRelationship system
      },
      include: {
        // assignee: true, // Removed - now handled by EntityRelationship system
        project: true,
        subtasks: {
          where: { isDeleted: false },
          include: {
            // assignee: true, // Removed - now handled by EntityRelationship system
          },
        },
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async update(id: string, data: any) {
    console.log('TasksService.update called:', { id, data });
    
    // Task update - simplified for EntityRelationship migration
    const existingTask = await this.prisma.task.findFirst({
      where: {
        id,
        NOT: {
          isDeleted: true
        }
      }
    });

    console.log('Task lookup result:', { id, existingTask: !!existingTask });

    if (!existingTask) {
      console.error(`Task with id ${id} not found in database`);
      throw new Error(`Task with id ${id} not found`);
    }

    // Validate projectId if provided
    if (data.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: data.projectId, isDeleted: false }
      });
      console.log('Project lookup result:', { projectId: data.projectId, projectExists: !!project });
      
      if (!project) {
        console.error(`Project with id ${data.projectId} not found`);
        throw new Error(`Project with id ${data.projectId} not found`);
      }
    }

    console.log('Updating task with data:', { id, updateData: { ...data, updatedAt: new Date() } });

    try {
      const result = await this.prisma.task.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
      
      console.log('Task update successful:', { id, updatedTask: result });
      return result;
    } catch (error) {
      console.error('Prisma update error:', { id, data, error });
      throw error;
    }
  }

  async remove(id: string) {
    // Soft delete task
    return this.prisma.task.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: 'system'
      }
    });
  }

  async updateTaskAssignees(taskId: string, userIds: string[]) {
    try {
      // Verify task exists
      const existingTask = await this.prisma.task.findFirst({
        where: {
          id: taskId,
          NOT: { isDeleted: true }
        }
      });

      if (!existingTask) {
        throw new Error(`Task with id ${taskId} not found`);
      }

      // Verify all users exist
      if (userIds.length > 0) {
        const existingUsers = await this.prisma.user.findMany({
          where: { id: { in: userIds } }
        });
        const existingUserIds = existingUsers.map(u => u.id);
        const invalidUserIds = userIds.filter(id => !existingUserIds.includes(id));
        
        if (invalidUserIds.length > 0) {
          throw new Error(`Invalid user IDs: ${invalidUserIds.join(', ')}`);
        }
      }

      // Remove existing assignment relationships
      const existingRelationships = await this.entityRelationshipService.getEntityRelationships(
        'Task', taskId
      );
      
      // Filter for assignment relationships
      const existingAssignments = existingRelationships.filter(
        rel => rel.relationshipType === 'assigned_to'
      );
      
      for (const relationship of existingAssignments) {
        await this.entityRelationshipService.remove(relationship.id);
      }

      // Create new assignment relationships
      for (const userId of userIds) {
        await this.entityRelationshipService.create({
          relationshipType: 'assigned_to',
          sourceType: 'Task',
          sourceId: taskId,
          targetType: 'User',
          targetId: userId,
          strength: 5,
          metadata: { role: 'assignee' }
        });
      }

      // Return updated task with assignee data
      const updatedRelationships = await this.entityRelationshipService.getEntityRelationships(
        'Task', taskId
      );
      
      const assignmentRelationships = updatedRelationships.filter(
        rel => rel.relationshipType === 'assigned_to'
      );

      const assignees = await Promise.all(
        assignmentRelationships.map(async (rel) => {
          const user = await this.prisma.user.findUnique({ where: { id: rel.targetId } });
          return { user, role: rel.metadata?.role || 'assignee' };
        })
      );

      return {
        ...existingTask,
        assignees
      };
    } catch (error) {
      console.error('Error updating task assignees:', error);
      throw error;
    }
  }

  async addTaskAssignee(taskId: string, userId: string, role: string = 'assignee') {
    const relationship = await this.entityRelationshipService.create({
      relationshipType: 'assigned_to',
      sourceType: 'Task',
      sourceId: taskId,
      targetType: 'User',
      targetId: userId,
      strength: 5,
      metadata: { role }
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return { user, role };
  }

  async removeTaskAssignee(taskId: string, userId: string) {
    const allRelationships = await this.entityRelationshipService.getEntityRelationships(
      'Task', taskId
    );
    
    // Filter for specific assignment relationships
    const relationships = allRelationships.filter(rel => 
      rel.relationshipType === 'assigned_to' &&
      rel.targetType === 'User' &&
      rel.targetId === userId
    );

    for (const relationship of relationships) {
      await this.entityRelationshipService.remove(relationship.id);
    }

    return { count: relationships.length };
  }

  async createSubtask(parentId: string, data: any) {
    // Create subtask with parent reference
    return this.prisma.task.create({
      data: {
        ...data,
        parentTaskId: parentId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async updateSubtask(id: string, data: any) {
    // Update subtask - same as regular task update
    return this.update(id, data);
  }

  async reorderSubtasks(parentId: string, subtaskIds: string[]) {
    // Validate that all ids correspond to subtasks of the given parent and are not deleted
    const existing = await this.prisma.task.findMany({
      where: {
        id: { in: subtaskIds },
        parentTaskId: parentId,
        NOT: { isDeleted: true },
      },
      select: { id: true },
    });

    if (existing.length !== subtaskIds.length) {
      throw new Error('One or more subtasks not found for the specified parent');
    }

    // Update orderIndex in a transaction to reflect the provided order
    await this.prisma.$transaction(
      subtaskIds.map((id, index) =>
        this.prisma.task.update({
          where: { id },
          data: { orderIndex: index },
        })
      )
    );

    return { success: true };
  }

  async reorderTasks(taskIds: string[]) {
    // Validate that all IDs correspond to top-level tasks and are not deleted
    const existing = await this.prisma.task.findMany({
      where: {
        id: { in: taskIds },
        parentTaskId: null,
        NOT: { isDeleted: true },
      },
      select: { id: true },
    });

    if (existing.length !== taskIds.length) {
      throw new Error('One or more top-level tasks not found');
    }

    // Update orderIndex in a transaction
    await this.prisma.$transaction(
      taskIds.map((id, index) =>
        this.prisma.task.update({
          where: { id },
          data: { orderIndex: index },
        })
      )
    );

    return { success: true };
  }
}
