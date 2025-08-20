import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type {} from '../prisma-v6-compat';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProjectCreateInput) {
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
