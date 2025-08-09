import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import type {} from '../prisma-v6-compat';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateAdmin(email: string, plainPassword: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return existing;
    const bcrypt = await import('bcrypt');
    const hashed = await bcrypt.hash(plainPassword, 10);
    const username = email.split('@')[0];
    const adminRole = await this.prisma.role.upsert({
      where: { name: 'admin' },
      update: { permissions: ['*'] as any },
      create: { name: 'admin', description: 'Full access', permissions: ['*'] as any },
    });
    return this.prisma.user.create({
      data: {
        email,
        username,
        firstName: 'Admin',
        lastName: 'User',
        password: hashed,
        roleId: adminRole.id,
        isActive: true,
      },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
      include: {
        role: true,
      },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: {
        role: true,
      },
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        role: true,
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
      },
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
