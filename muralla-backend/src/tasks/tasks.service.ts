import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type {} from '../prisma-v6-compat';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.TaskCreateInput) {
    return this.prisma.task.create({ 
      data, 
      include: { 
        project: true, 
        assignee: true
      } 
    });
  }

  async createSubtask(parentId: string, dto: any) {
    // Ensure parent exists and inherit its projectId
    const parent = await this.prisma.task.findUnique({
      where: { id: parentId },
      select: { id: true, projectId: true },
    });
    if (!parent) {
      throw new Error('Parent task not found');
    }

    const data: Prisma.TaskCreateInput = {
      title: dto.title,
      description: dto.description ?? undefined,
      status: dto.status,
      priority: dto.priority,
      project: { connect: { id: parent.projectId } },
      parentTask: { connect: { id: parentId } },
    } as Prisma.TaskCreateInput;

    if (dto.assigneeId) {
      // Optional primary assignee
      (data as any).assignee = { connect: { id: dto.assigneeId } };
    }

    if (dto.dueDate) {
      (data as any).dueDate = new Date(dto.dueDate);
    }
    if (dto.dueTime) {
      (data as any).dueTime = dto.dueTime;
    }

    return this.prisma.task.create({
      data,
      include: {
        project: true,
        assignee: true,
      },
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
        assignee: true
      },
      orderBy: {
        createdAt: 'desc'
      }
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
        project: true, 
        assignee: true, 


      } 
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.task.findMany({ 
      where: { 
        projectId,
        NOT: {
          isDeleted: true
        }
      }, 
      include: { 
        project: true, 
        assignee: true, 


      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findByAssignee(assigneeId: string) {
    return this.prisma.task.findMany({ 
      where: { 
        assigneeId,
        NOT: {
          isDeleted: true
        }
      }, 
      include: { 
        project: true, 
        assignee: true, 


      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async update(id: string, data: Prisma.TaskUpdateInput) {
    // First check if the task exists and is not deleted
    const existingTask = await this.prisma.task.findFirst({
      where: {
        id,
        NOT: {
          isDeleted: true
        }
      }
    });

    if (!existingTask) {
      throw new Error('Task not found or has been deleted');
    }

    const task = await this.prisma.task.update({ 
      where: { id }, 
      data, 
      include: { 
        project: true, 
        assignee: true, 


      } 
    });

    return task;
  }

  async updateSubtask(id: string, dto: any) {
    const data: Prisma.TaskUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assigneeId !== undefined) {
      data.assignee = dto.assigneeId
        ? { connect: { id: dto.assigneeId } }
        : { disconnect: true };
    }
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.dueTime !== undefined) {
      data.dueTime = dto.dueTime ?? null;
    }

    return this.prisma.task.update({
      where: { id },
      data,
      include: {
        project: true,
        assignee: true,
      },
    });
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

    return { success: true } as const;
  }

  async remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }
}
