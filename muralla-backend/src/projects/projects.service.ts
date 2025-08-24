import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type {} from '../prisma-v6-compat';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProjectCreateInput) {
    // Handle date format conversion for deadline
    if (data.deadline && typeof data.deadline === 'string') {
      // If it's just a date (YYYY-MM-DD), convert to full ISO DateTime
      if (/^\d{4}-\d{2}-\d{2}$/.test(data.deadline)) {
        data.deadline = new Date(data.deadline + 'T00:00:00.000Z');
      } else {
        // Try to parse as Date
        data.deadline = new Date(data.deadline);
      }
    }

    return this.prisma.project.create({ 
      data, 
      include: { 
        tasks: true,
        budgets: true 
      } 
    });
  }

  async findAll() {
    return this.prisma.project.findMany({ 
      include: { 
        tasks: true,
        budgets: true 
      } 
    });
  }

  async findOne(id: string) {
    return this.prisma.project.findUnique({ 
      where: { id }, 
      include: { 
        tasks: true,
        budgets: true 
      } 
    });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput) {
    // Handle date format conversion for deadline
    if (data.deadline && typeof data.deadline === 'string') {
      // If it's just a date (YYYY-MM-DD), convert to full ISO DateTime
      if (/^\d{4}-\d{2}-\d{2}$/.test(data.deadline)) {
        data.deadline = new Date(data.deadline + 'T00:00:00.000Z');
      } else {
        // Try to parse as Date
        data.deadline = new Date(data.deadline);
      }
    }

    return this.prisma.project.update({ 
      where: { id }, 
      data, 
      include: { 
        tasks: true,
        budgets: true 
      } 
    });
  }

  async remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
