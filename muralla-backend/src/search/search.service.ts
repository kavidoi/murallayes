import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface EntitySearchResult {
  id: string;
  name: string;
  type: string;
  subtitle?: string;
  avatar?: string;
  sku?: string;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchEntities(
    entityType: string,
    query: string,
    limit: number = 10,
    tenantId?: string,
  ): Promise<EntitySearchResult[]> {
    const searchTerm = `%${query.toLowerCase()}%`;

    switch (entityType) {
      case 'User':
        return this.searchUsers(searchTerm, limit, tenantId);
      case 'Product':
        return this.searchProducts(searchTerm, limit, tenantId);
      case 'Project':
        return this.searchProjects(searchTerm, limit, tenantId);
      case 'Task':
        return this.searchTasks(searchTerm, limit, tenantId);
      case 'Contact':
        return this.searchContacts(searchTerm, limit, tenantId);
      case 'Budget':
        return this.searchBudgets(searchTerm, limit, tenantId);
      default:
        return [];
    }
  }

  async globalSearch(
    query: string,
    limit: number = 20,
    tenantId?: string,
  ): Promise<{ [entityType: string]: EntitySearchResult[] }> {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const [users, products, projects, tasks, contacts, budgets] = await Promise.all([
      this.searchUsers(searchTerm, 3, tenantId),
      this.searchProducts(searchTerm, 5, tenantId),
      this.searchProjects(searchTerm, 3, tenantId),
      this.searchTasks(searchTerm, 4, tenantId),
      this.searchContacts(searchTerm, 3, tenantId),
      this.searchBudgets(searchTerm, 2, tenantId),
    ]);

    return {
      User: users,
      Product: products,
      Project: projects,
      Task: tasks,
      Contact: contacts,
      Budget: budgets,
    };
  }

  async searchRelationships(
    sourceType: string,
    sourceId: string,
    targetType?: string,
    relationshipType?: string,
    tenantId?: string,
  ) {
    return this.prisma.entityRelationship.findMany({
      where: {
        OR: [
          { sourceType, sourceId },
          { targetType: sourceType, targetId: sourceId },
        ],
        ...(targetType && { 
          OR: [
            { targetType },
            { sourceType: targetType },
          ]
        }),
        ...(relationshipType && { relationshipType }),
        tenantId,
        isDeleted: false,
        isActive: true,
      },
      orderBy: [
        { strength: 'desc' },
        { lastInteractionAt: 'desc' },
      ],
      take: 50,
    });
  }

  private async searchUsers(
    searchTerm: string,
    limit: number,
    tenantId?: string,
  ): Promise<EntitySearchResult[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
          { lastName: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
          { username: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
          { email: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
        ],
        tenantId,
        isDeleted: false,
        isActive: true,
      },
      include: {
        role: true,
      },
      take: limit,
      orderBy: { firstName: 'asc' },
    });

    return users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      type: 'User',
      subtitle: `@${user.username} • ${user.role.name}`,
      avatar: undefined, // Could be added later
    }));
  }

  private async searchProducts(
    searchTerm: string,
    limit: number,
    tenantId?: string,
  ): Promise<EntitySearchResult[]> {
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
          { sku: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
          { description: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
        ],
        tenantId,
        isDeleted: false,
        isActive: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return products.map(product => ({
      id: product.id,
      name: product.name,
      type: 'Product',
      subtitle: product.description || undefined,
      sku: product.sku,
    }));
  }

  private async searchProjects(
    searchTerm: string,
    limit: number,
    tenantId?: string,
  ): Promise<EntitySearchResult[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
          { description: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
        ],
        tenantId,
        isDeleted: false,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return projects.map(project => ({
      id: project.id,
      name: project.name,
      type: 'Project',
      subtitle: project.description || undefined,
    }));
  }

  private async searchTasks(
    searchTerm: string,
    limit: number,
    tenantId?: string,
  ): Promise<EntitySearchResult[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
          { description: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
        ],
        tenantId,
        isDeleted: false,
      },
      include: {
        project: true,
      },
      take: limit,
      orderBy: { title: 'asc' },
    });

    return tasks.map(task => ({
      id: task.id,
      name: task.title,
      type: 'Task',
      subtitle: `${task.project.name} • ${task.status}`,
    }));
  }

  private async searchContacts(
    searchTerm: string,
    limit: number,
    tenantId?: string,
  ): Promise<EntitySearchResult[]> {
    const contacts = await this.prisma.contact.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
          { company: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
          { email: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
        ],
        tenantId,
        isDeleted: false,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      type: 'Contact',
      subtitle: contact.company || contact.email || undefined,
    }));
  }

  private async searchBudgets(
    searchTerm: string,
    limit: number,
    tenantId?: string,
  ): Promise<EntitySearchResult[]> {
    const budgets = await this.prisma.budget.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
          { description: { contains: searchTerm.replace('%', ''), mode: 'insensitive' } },
        ],
        tenantId,
        isDeleted: false,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return budgets.map(budget => ({
      id: budget.id,
      name: budget.name,
      type: 'Budget',
      subtitle: budget.description || `${budget.status} • ${budget.currency} ${budget.totalPlanned}`,
    }));
  }
}