import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Budget, BudgetLine, Task, Project } from '@prisma/client';
import type {} from '../prisma-v6-compat';

export interface CreateBudgetDto {
  name: string;
  description?: string;
  projectId?: string; // Optional - will default to "General" if not provided
  category: 'OPEX' | 'CAPEX' | 'REVENUE' | 'OTHER';
  totalPlanned: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  lines: CreateBudgetLineDto[];
}

export interface CreateBudgetLineDto {
  name: string;
  description?: string;
  category?: string;
  vendor?: string;
  plannedAmount: number;
  unitPrice?: number;
  quantity?: number;
  dueDate?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  autoCreateTasks?: boolean;
}

export interface UpdateBudgetDto {
  name?: string;
  description?: string;
  projectId?: string;
  category?: 'OPEX' | 'CAPEX' | 'REVENUE' | 'OTHER';
  totalPlanned?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'LOCKED' | 'CANCELLED';
}

export interface CreateCommentDto {
  content: string;
  type: 'BUDGET' | 'BUDGET_LINE' | 'TASK' | 'PROJECT';
  budgetId?: string;
  budgetLineId?: string;
  taskId?: string;
  mentions?: string[];
  attachments?: any[];
}

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  private async getGeneralProject(): Promise<Project> {
    let generalProject = await this.prisma.project.findFirst({
      where: { name: 'General' }
    });

    if (!generalProject) {
      // Create General project if it doesn't exist
      generalProject = await this.prisma.project.create({
        data: {
          name: 'General',
          description: 'Default project for unassigned budgets and tasks',
        }
      });
    }

    return generalProject;
  }

  async create(data: CreateBudgetDto, userId: string): Promise<Budget> {
    let projectId = data.projectId;
    
    // If no project specified, use General project
    if (!projectId) {
      const generalProject = await this.getGeneralProject();
      projectId = generalProject.id;
    }

    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return await this.prisma.budget.create({
      data: {
        name: data.name,
        description: data.description,
        projectId,
        category: data.category,
        totalPlanned: data.totalPlanned,
        currency: data.currency || 'CLP',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        createdBy: userId,
        lines: {
          create: data.lines.map(line => ({
            name: line.name,
            description: line.description,
            category: line.category,
            vendor: line.vendor,
            plannedAmount: line.plannedAmount,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            dueDate: line.dueDate ? new Date(line.dueDate) : null,
            isRecurring: line.isRecurring || false,
            recurringFrequency: line.recurringFrequency,
            autoCreateTasks: line.autoCreateTasks || false,
            createdBy: userId,
          }))
        }
      },
      include: {
        project: true,
        lines: {
          include: {
            tasks: true,
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  async findAll(filters?: {
    projectId?: string;
    status?: string;
    category?: string;
  }) {
    const where: Prisma.BudgetWhereInput = {
      isDeleted: false,
    };

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters?.status) {
      where.status = filters.status as any;
    }

    if (filters?.category) {
      where.category = filters.category as any;
    }

    return await this.prisma.budget.findMany({
      where,
      include: {
        project: true,
        lines: {
          include: {
            tasks: true,
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        project: true,
        lines: {
          include: {
            tasks: {
              include: {
                assignee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!budget || budget.isDeleted) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async update(id: string, data: UpdateBudgetDto): Promise<Budget> {
    const budget = await this.findOne(id);

    if (budget.status === 'LOCKED') {
      throw new BadRequestException('Cannot modify locked budget');
    }

    let projectId = data.projectId;
    
    // If project is being changed and set to null/undefined, use General
    if (data.projectId === null || (data.projectId === undefined && data.hasOwnProperty('projectId'))) {
      const generalProject = await this.getGeneralProject();
      projectId = generalProject.id;
    }

    const updateData: Prisma.BudgetUpdateInput = {
      name: data.name,
      description: data.description,
      category: data.category,
      totalPlanned: data.totalPlanned,
      currency: data.currency,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: data.status,
    };

    if (projectId) {
      updateData.project = { connect: { id: projectId } };
    }

    return await this.prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        lines: {
          include: {
            tasks: true,
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  async remove(id: string): Promise<void> {
    const budget = await this.findOne(id);

    if (budget.status === 'LOCKED') {
      throw new BadRequestException('Cannot delete locked budget');
    }

    await this.prisma.budget.update({
      where: { id },
      data: { 
        isDeleted: true,
        deletedAt: new Date()
      }
    });
  }

  async createTasksFromBudgetLine(budgetLineId: string, userId: string): Promise<Task[]> {
    const budgetLine = await this.prisma.budgetLine.findUnique({
      where: { id: budgetLineId },
      include: { budget: { include: { project: true } } }
    });

    if (!budgetLine) {
      throw new NotFoundException('Budget line not found');
    }

    const tasks: Task[] = [];

    // Create task for this budget line
    const task = await this.prisma.task.create({
      data: {
        title: `${budgetLine.name}${budgetLine.vendor ? ` - ${budgetLine.vendor}` : ''}`,
        description: `${budgetLine.description || ''}\nMonto presupuestado: ${budgetLine.plannedAmount} ${budgetLine.budget.currency}${budgetLine.dueDate ? `\nFecha límite: ${budgetLine.dueDate.toLocaleDateString()}` : ''}`,
        projectId: budgetLine.budget.projectId,
        budgetLineId: budgetLine.id,
        createdBy: userId,
      },
      include: {
        project: true,
        assignee: true,
        budgetLine: true
      }
    });

    tasks.push(task);

    // If recurring, create future tasks
    if (budgetLine.isRecurring && budgetLine.recurringFrequency) {
      // Create next 3 recurring tasks as examples
      for (let i = 1; i <= 3; i++) {
        let nextDate = new Date();
        if (budgetLine.recurringFrequency === 'MONTHLY') {
          nextDate.setMonth(nextDate.getMonth() + i);
        } else if (budgetLine.recurringFrequency === 'WEEKLY') {
          nextDate.setDate(nextDate.getDate() + (7 * i));
        }

        const recurringTask = await this.prisma.task.create({
          data: {
            title: `${budgetLine.name} (${budgetLine.recurringFrequency.toLowerCase()} #${i + 1})`,
            description: `Tarea recurrente: ${budgetLine.description || ''}\nMonto presupuestado: ${budgetLine.plannedAmount} ${budgetLine.budget.currency}`,
            projectId: budgetLine.budget.projectId,
            budgetLineId: budgetLine.id,
            createdBy: userId,
          },
          include: {
            project: true,
            assignee: true,
            budgetLine: true
          }
        });

        tasks.push(recurringTask);
      }
    }

    return tasks;
  }

  async addComment(data: CreateCommentDto, userId: string) {
    return await this.prisma.comment.create({
      data: {
        content: data.content,
        type: data.type,
        budgetId: data.budgetId,
        budgetLineId: data.budgetLineId,
        taskId: data.taskId,
        authorId: userId,
        mentions: data.mentions || [],
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  async getVarianceReport(budgetId?: string) {
    const where: Prisma.BudgetWhereInput = {
      isDeleted: false,
    };

    if (budgetId) {
      where.id = budgetId;
    }

    const budgets = await this.prisma.budget.findMany({
      where,
      include: {
        project: true,
        lines: {
          include: {
            tasks: true
          }
        }
      }
    });

    return budgets.map(budget => {
      const totalPlanned = Number(budget.totalPlanned);
      const totalCommitted = Number(budget.totalCommitted);
      const totalActual = Number(budget.totalActual);
      const availableAmount = totalPlanned - totalCommitted;
      const variance = totalPlanned - totalActual;
      const variancePercent = totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0;
      
      // Calculate utilization percentage
      const utilizationPercent = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
      
      // Health status based on utilization and variance thresholds
      let healthStatus = 'ON_TRACK';
      let alerts: string[] = [];
      
      if (utilizationPercent > 120) {
        healthStatus = 'OVER_BUDGET';
        alerts.push('Presupuesto excedido en más del 20%');
      } else if (utilizationPercent > 100) {
        healthStatus = 'OVER_BUDGET';
        alerts.push('Presupuesto excedido');
      } else if (utilizationPercent > 80) {
        healthStatus = 'AT_RISK';
        alerts.push('Uso del presupuesto por encima del 80%');
      }
      
      // Check availability alerts
      if (availableAmount < 0) {
        alerts.push('Sin fondos disponibles');
      } else if (availableAmount < totalPlanned * 0.1) {
        alerts.push('Menos del 10% de presupuesto disponible');
      }
      
      // Time-based alerts if budget has end date
      if (budget.endDate) {
        const now = new Date();
        const endDate = new Date(budget.endDate);
        const timeDiff = endDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysRemaining < 0) {
          alerts.push('Presupuesto vencido');
        } else if (daysRemaining <= 7 && utilizationPercent < 50) {
          alerts.push('Baja utilización cerca del vencimiento');
        } else if (daysRemaining <= 30) {
          alerts.push(`${daysRemaining} días restantes`);
        }
      }

      // Line-level analysis
      const lineAnalysis = budget.lines.map(line => {
        const linePlanned = Number(line.plannedAmount);
        const lineActual = Number(line.actualAmount);
        const lineCommitted = Number(line.committedAmount);
        const lineAvailable = linePlanned - lineCommitted;
        const lineVariance = linePlanned - lineActual;
        const lineVariancePercent = linePlanned > 0 ? (lineVariance / linePlanned) * 100 : 0;
        const lineUtilizationPercent = linePlanned > 0 ? (lineActual / linePlanned) * 100 : 0;
        
        let lineHealthStatus = 'ON_TRACK';
        if (lineUtilizationPercent > 120) {
          lineHealthStatus = 'OVER_BUDGET';
        } else if (lineUtilizationPercent > 80) {
          lineHealthStatus = 'AT_RISK';
        }

        return {
          ...line,
          financial: {
            planned: linePlanned,
            committed: lineCommitted,
            actual: lineActual,
            available: lineAvailable,
            variance: lineVariance,
            variancePercent: lineVariancePercent,
            utilizationPercent: lineUtilizationPercent,
            healthStatus: lineHealthStatus,
          }
        };
      });

      // Calculate forecasted completion based on current burn rate
      let forecastedTotal = totalActual;
      let forecastedCompletion = null;
      
      if (budget.startDate) {
        const startDate = new Date(budget.startDate);
        const now = new Date();
        const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
        const dailyBurnRate = totalActual / daysElapsed;
        
        if (budget.endDate) {
          const endDate = new Date(budget.endDate);
          const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
          forecastedTotal = dailyBurnRate * totalDays;
          forecastedCompletion = new Date(startDate.getTime() + (totalPlanned / dailyBurnRate) * 24 * 60 * 60 * 1000);
        }
      }

      return {
        ...budget,
        lines: lineAnalysis,
        financial: {
          totalPlanned,
          totalCommitted,
          totalActual,
          availableAmount,
          variance,
          variancePercent,
          utilizationPercent,
          healthStatus,
          alerts,
          forecasted: {
            total: forecastedTotal,
            completion: forecastedCompletion,
          }
        }
      };
    });
  }

  async getBudgetAlerts(budgetId?: string) {
    const budgetsWithVariance = await this.getVarianceReport(budgetId);
    
    const allAlerts = budgetsWithVariance.flatMap(budget => 
      budget.financial.alerts.map(alert => ({
        budgetId: budget.id,
        budgetName: budget.name,
        projectName: budget.project.name,
        message: alert,
        severity: budget.financial.healthStatus === 'OVER_BUDGET' ? 'HIGH' : 
                 budget.financial.healthStatus === 'AT_RISK' ? 'MEDIUM' : 'LOW',
        timestamp: new Date().toISOString()
      }))
    );

    return allAlerts.sort((a, b) => {
      const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
}
