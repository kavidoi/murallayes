import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntityRelationshipService } from '../relationships/entity-relationship.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private entityRelationshipService: EntityRelationshipService
  ) {}

  // Helper: attach assignees (from EntityRelationship) to a single task object
  private async attachAssignees(task: any) {
    if (!task) return null;

    const assignmentRelationships = await this.entityRelationshipService.getEntityRelationships(
      'Task', task.id
    );

    const assigneeRelationships = assignmentRelationships.filter(rel =>
      rel.relationshipType === 'assigned_to' && rel.targetType === 'User'
    );

    const assignees = [] as any[];
    const assigneeIds: string[] = [];
    for (const relationship of assigneeRelationships) {
      const user = await this.prisma.user.findUnique({
        where: { id: relationship.targetId }
      });
      if (user) {
        assigneeIds.push(user.id);
        assignees.push({
          user,
          role: relationship.metadata?.role || 'assignee',
          metadata: relationship.metadata || null,
          relationshipId: relationship.id,
        });
      }
    }

    return {
      ...task,
      assignees,
      assigneeIds,
      assigneesCount: assignees.length,
    };
  }

  // Helper: enrich tasks with both assignees and project relationships in batch
  private async enrichTasksWithRelationships(tasks: any[]) {
    if (!tasks || tasks.length === 0) return [];

    const taskIds = tasks.map(t => t.id);

    // Fetch all relationships we care about in one batch
    const relationships = await this.prisma.entityRelationship.findMany({
      where: {
        sourceType: 'Task',
        sourceId: { in: taskIds },
        relationshipType: { in: ['assigned_to', 'belongs_to'] },
        isDeleted: false,
        isActive: true,
      },
      orderBy: [
        { priority: 'desc' },
        { strength: 'desc' },
      ],
    });

    // Prepare batched fetches
    const userIds = Array.from(new Set(
      relationships.filter(r => r.relationshipType === 'assigned_to' && r.targetType === 'User').map(r => r.targetId as string)
    )) as string[];
    const projectIds = Array.from(new Set(
      relationships.filter(r => r.relationshipType === 'belongs_to' && r.targetType === 'Project').map(r => r.targetId as string)
    )) as string[];

    const [users, projects] = await Promise.all([
      userIds.length ? this.prisma.user.findMany({ where: { id: { in: userIds } } }) : Promise.resolve([]),
      projectIds.length ? this.prisma.project.findMany({ where: { id: { in: projectIds } } }) : Promise.resolve([]),
    ]);

    const userMap = new Map(users.map(u => [u.id, u] as const));
    const projectMap = new Map(projects.map(p => [p.id, p] as const));

    // Group rels by task
    const relsByTask = new Map<string, typeof relationships>();
    for (const rel of relationships) {
      const list = relsByTask.get(rel.sourceId) || [];
      list.push(rel);
      relsByTask.set(rel.sourceId, list);
    }

    // Compose enriched tasks
    return tasks.map(task => {
      const rels = relsByTask.get(task.id) || [];

      // Assignees
      const assignedRels = rels.filter(r => r.relationshipType === 'assigned_to' && r.targetType === 'User');
      const assignees: any[] = [];
      const assigneeIds: string[] = [];
      for (const r of assignedRels) {
        const user = userMap.get(r.targetId);
        if (user) {
          assigneeIds.push(user.id);
          assignees.push({ user, role: r.metadata?.role || 'assignee', metadata: r.metadata || null, relationshipId: r.id });
        }
      }

      // Projects
      const projectRels = rels.filter(r => r.relationshipType === 'belongs_to' && r.targetType === 'Project');
      const linkedProjectIds: string[] = [];
      const relatedProjects: any[] = [];
      for (const r of projectRels) {
        const proj = projectMap.get(r.targetId);
        if (proj) {
          linkedProjectIds.push(proj.id);
          relatedProjects.push(proj);
        }
      }

      return {
        ...task,
        // Assignees
        assignees,
        assigneeIds,
        assigneesCount: assignees.length,
        // Projects via relationships
        projectIds: linkedProjectIds,
        relatedProjects,
      };
    });
  }
  
  // Helper: attach assignees to an array of tasks
  private async attachAssigneesToMany(tasks: any[]) {
    if (!tasks || tasks.length === 0) return [];

    const taskIds = tasks.map(t => t.id);

    // Fetch all assignment relationships for these tasks in one query
    const relationships = await this.prisma.entityRelationship.findMany({
      where: {
        sourceType: 'Task',
        sourceId: { in: taskIds },
        targetType: 'User',
        relationshipType: 'assigned_to',
        isDeleted: false,
        isActive: true,
      },
      orderBy: [
        { priority: 'desc' },
        { strength: 'desc' },
      ],
    });

    // Batch-load users
    const userIds = Array.from(new Set(relationships.map(r => r.targetId as string))) as string[];
    const users = await this.prisma.user.findMany({ where: { id: { in: userIds as string[] } } });
    const userMap = new Map(users.map(u => [u.id, u] as const));

    // Group relationships by taskId
    const relsByTask = new Map<string, typeof relationships>();
    for (const rel of relationships) {
      const list = relsByTask.get(rel.sourceId) || [];
      list.push(rel);
      relsByTask.set(rel.sourceId, list);
    }

    // Build results
    return tasks.map(task => {
      const rels = relsByTask.get(task.id) || [];
      const assignees = [] as any[];
      const assigneeIds: string[] = [];
      for (const r of rels) {
        const user = userMap.get(r.targetId);
        if (user) {
          assigneeIds.push(user.id);
          assignees.push({
            user,
            role: r.metadata?.role || 'assignee',
            metadata: r.metadata || null,
            relationshipId: r.id,
          });
        }
      }
      return {
        ...task,
        assignees,
        assigneeIds,
        assigneesCount: assignees.length,
      };
    });
  }

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
    const tasks = await this.prisma.task.findMany({
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

    return this.enrichTasksWithRelationships(tasks);
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        NOT: {
          isDeleted: true
        }
      },
      include: {
        project: true,
        parentTask: true,
        subtasks: {
          where: {
            NOT: {
              isDeleted: true
            }
          },
          orderBy: [
            { orderIndex: 'asc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    if (!task) return null;

    const [enriched] = await this.enrichTasksWithRelationships([task]);
    return enriched;
  }

  async findByProject(projectId: string) {
    // Align with Universal Relationship system: select tasks related via 'belongs_to'
    const rels = await this.prisma.entityRelationship.findMany({
      where: {
        relationshipType: 'belongs_to',
        sourceType: 'Task',
        targetType: 'Project',
        targetId: projectId,
        isDeleted: false,
        isActive: true,
      },
      orderBy: [
        { priority: 'desc' },
        { strength: 'desc' },
      ],
    });

    const taskIds = rels.map(r => r.sourceId);
    if (taskIds.length === 0) return [];

    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: taskIds },
        NOT: { isDeleted: true },
        parentTaskId: null,
      },
      include: {
        project: true,
        parentTask: true,
        subtasks: true,
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return this.enrichTasksWithRelationships(tasks);
  }

  async findByAssignee(assigneeId: string): Promise<any[]> {
    // Use relationships: Task —assigned_to→ User(assigneeId)
    const rels = await this.prisma.entityRelationship.findMany({
      where: {
        relationshipType: 'assigned_to',
        sourceType: 'Task',
        targetType: 'User',
        targetId: assigneeId,
        isDeleted: false,
        isActive: true,
      },
      orderBy: [
        { priority: 'desc' },
        { strength: 'desc' },
      ],
    });

    const taskIds = rels.map(r => r.sourceId);
    if (taskIds.length === 0) return [];

    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: taskIds },
        isDeleted: false,
      },
      include: {
        project: true,
        subtasks: {
          where: { isDeleted: false },
        },
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return this.enrichTasksWithRelationships(tasks);
  }

  async update(id: string, data: any) {
    console.log('TasksService.update called:', { id, data });

    // Lookup existing task
    const existingTask = await this.prisma.task.findFirst({
      where: { id, NOT: { isDeleted: true } },
    });

    if (!existingTask) {
      console.error(`Task with id ${id} not found in database`);
      throw new Error(`Task with id ${id} not found`);
    }

    // Validate projectId if provided
    if (data.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: data.projectId, isDeleted: false },
      });
      if (!project) {
        console.error(`Project with id ${data.projectId} not found`);
        throw new Error(`Project with id ${data.projectId} not found`);
      }
    }

    // Compute derived flags for status/deadline changes
    const updateData: any = { ...data, updatedAt: new Date() };
    if (Object.prototype.hasOwnProperty.call(data, 'dueDate')) {
      const prev = existingTask.dueDate ? new Date(existingTask.dueDate).toISOString() : undefined;
      const next = data.dueDate
        ? (data.dueDate instanceof Date
            ? data.dueDate.toISOString()
            : typeof data.dueDate === 'string'
              ? new Date(data.dueDate).toISOString()
              : undefined)
        : undefined;
      if ((prev || next) && prev !== next) {
        updateData.dueDateModifiedAt = new Date();
      }
    }
    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
      // Mark that user explicitly changed status
      updateData.statusModifiedByUser = true;
      // If previously in progress, keep wasEnProgreso true
      // If set to IN_PROGRESS now, set wasEnProgreso true as well
      const IN_PROGRESS = 'IN_PROGRESS';
      if (existingTask.status === IN_PROGRESS || data.status === IN_PROGRESS) {
        updateData.wasEnProgreso = true;
      }
    }

    const projectIdChanged = Object.prototype.hasOwnProperty.call(data, 'projectId')
      ? data.projectId !== existingTask.projectId
      : false;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Update the task first
        const updated = await tx.task.update({ where: { id }, data: updateData });

        // If project changed, mirror relationships in Universal Relationship system
        if (projectIdChanged) {
          // Soft-delete any previous belongs_to/includes for this task
          await tx.entityRelationship.updateMany({
            where: {
              OR: [
                { sourceType: 'Task', sourceId: id, relationshipType: 'belongs_to' },
                { sourceType: 'Project', targetType: 'Task', targetId: id, relationshipType: 'includes' },
              ],
              isDeleted: false,
            },
            data: { isDeleted: true, deletedAt: new Date() },
          });

          if (data.projectId) {
            // Forward: Task -> Project (belongs_to)
            await tx.entityRelationship.upsert({
              where: {
                sourceType_sourceId_targetType_targetId_relationshipType: {
                  sourceType: 'Task',
                  sourceId: id,
                  targetType: 'Project',
                  targetId: data.projectId,
                  relationshipType: 'belongs_to',
                },
              },
              update: { isDeleted: false, deletedAt: null, isActive: true, updatedAt: new Date() },
              create: {
                relationshipType: 'belongs_to',
                sourceType: 'Task',
                sourceId: id,
                targetType: 'Project',
                targetId: data.projectId,
                isActive: true,
                lastInteractionAt: new Date(),
                interactionCount: 1,
              },
            });

            // Reverse: Project -> Task (includes)
            await tx.entityRelationship.upsert({
              where: {
                sourceType_sourceId_targetType_targetId_relationshipType: {
                  sourceType: 'Project',
                  sourceId: data.projectId,
                  targetType: 'Task',
                  targetId: id,
                  relationshipType: 'includes',
                },
              },
              update: { isDeleted: false, deletedAt: null, isActive: true, updatedAt: new Date() },
              create: {
                relationshipType: 'includes',
                sourceType: 'Project',
                sourceId: data.projectId,
                targetType: 'Task',
                targetId: id,
                isActive: true,
                lastInteractionAt: new Date(),
                interactionCount: 1,
              },
            });
          }
        }

        return updated;
      });

      console.log('Task update successful:', { id, updatedTask: result });
      return result;
    } catch (error) {
      console.error('Task update transaction error:', { id, data, error });
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
    console.log('updateTaskAssignees called:', { taskId, userIds });
    
    try {
      // Filter out null/undefined values from userIds
      const validUserIds = userIds.filter(id => id !== null && id !== undefined && id !== '');
      console.log('Filtered validUserIds:', { taskId, validUserIds });
      
      // Verify task exists
      const existingTask = await this.prisma.task.findFirst({
        where: {
          id: taskId,
          NOT: { isDeleted: true }
        }
      });

      if (!existingTask) {
        throw new NotFoundException(`Task with id ${taskId} not found`);
      }

      // Verify all users exist
      if (validUserIds.length > 0) {
        const existingUsers = await this.prisma.user.findMany({
          where: { id: { in: validUserIds } }
        });
        
        const existingUserIds = existingUsers.map(u => u.id);
        const invalidUserIds = validUserIds.filter(id => !existingUserIds.includes(id));
        
        if (invalidUserIds.length > 0) {
          throw new BadRequestException(`Invalid user IDs: ${invalidUserIds.join(', ')}`);
        }
      }

      // Simplified approach: just delete and recreate
      // Delete all existing relationships for this task
      await this.prisma.entityRelationship.deleteMany({
        where: {
          OR: [
            {
              sourceType: 'Task',
              sourceId: taskId,
              targetType: 'User',
              relationshipType: 'assigned_to',
            },
            {
              sourceType: 'User',
              targetType: 'Task',
              targetId: taskId,
              relationshipType: 'assigned',
            }
          ]
        }
      });

      // Create new relationships for each user
      const createPromises = [];
      for (const userId of validUserIds) {
        // Forward: Task -> User (assigned_to)
        createPromises.push(
          this.prisma.entityRelationship.create({
            data: {
              sourceType: 'Task',
              sourceId: taskId,
              targetType: 'User',
              targetId: userId,
              relationshipType: 'assigned_to',
              strength: 5,
              metadata: { role: 'assignee' },
              isActive: true,
              isDeleted: false,
            },
          })
        );

        // Reverse: User -> Task (assigned)
        createPromises.push(
          this.prisma.entityRelationship.create({
            data: {
              sourceType: 'User',
              sourceId: userId,
              targetType: 'Task',
              targetId: taskId,
              relationshipType: 'assigned',
              strength: 5,
              metadata: { role: 'assignee' },
              isActive: true,
              isDeleted: false,
            },
          })
        );
      }

      await Promise.all(createPromises);

      console.log('updateTaskAssignees completed successfully:', taskId);
      // Return full task with assembled assignees and metadata for consistency
      const updatedTask = await this.prisma.task.findUnique({ where: { id: taskId } });
      const [enriched] = await this.enrichTasksWithRelationships([updatedTask]);
      return enriched;
      
    } catch (error) {
      console.error('updateTaskAssignees failed:', {
        taskId,
        userIds,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async addTaskAssignee(taskId: string, userId: string, role: string = 'assignee') {
    console.log('addTaskAssignee called:', { taskId, userId, role });
    
    try {
      // Verify task exists
      const existingTask = await this.prisma.task.findFirst({
        where: {
          id: taskId,
          NOT: { isDeleted: true }
        }
      });

      if (!existingTask) {
        console.error(`Task with id ${taskId} not found`);
        throw new Error(`Task with id ${taskId} not found`);
      }

      // Verify user exists
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        console.error(`User with id ${userId} not found`);
        throw new Error(`User with id ${userId} not found`);
      }

      // Create assignment using EntityRelationshipService
      const relationshipData = {
        sourceType: 'Task',
        sourceId: taskId,
        targetType: 'User',
        targetId: userId,
        relationshipType: 'assigned_to',
        strength: 5, // High strength for direct assignment
        metadata: { role }
      };

      const relationship = await this.entityRelationshipService.create(relationshipData);
      
      console.log('addTaskAssignee completed successfully with EntityRelationship system:', { taskId, userId, role, relationshipId: relationship.id });
      return { user, role };
      
    } catch (error) {
      console.error('addTaskAssignee failed:', {
        taskId,
        userId,
        role,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
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
