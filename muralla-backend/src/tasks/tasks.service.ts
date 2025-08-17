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

  async findAll() {
    return this.prisma.task.findMany({ 
      where: {
        isDeleted: false
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
    return this.prisma.task.findUnique({ 
      where: { id }, 
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
        isDeleted: false
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
        isDeleted: false
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

  async remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }
}
