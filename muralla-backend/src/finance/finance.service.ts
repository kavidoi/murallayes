import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { AuditService, AuditOperation } from '../common/audit.service';
import { Prisma, TransactionType, TransactionStatus, PaymentMethod } from '@prisma/client';
import type {} from '../prisma-v6-compat';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
  ) {}

  // Bank Account Management
  async createBankAccount(data: Prisma.BankAccountCreateInput, userId?: string) {
    const account = await this.prisma.bankAccount.create({
      data: { ...data, createdBy: userId },
      include: { transactions: true },
    });

    return account;
  }

  async findAllBankAccounts() {
    return this.prisma.bankAccount.findMany({
      where: { isDeleted: false },
      include: {
        transactions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { transactions: true } },
      },
    });
  }

  async findBankAccount(id: string) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id, isDeleted: false },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          include: { category: true, creator: true },
        },
        balanceHistory: {
          orderBy: { balanceDate: 'desc' },
          take: 30,
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Bank account ${id} not found`);
    }

    return account;
  }

  // Transaction Management
  async createTransaction(data: Prisma.TransactionCreateInput, userId?: string) {
    const transaction = await this.prisma.transaction.create({
      data: { ...data } as Prisma.TransactionCreateInput,
      include: {
        account: true,
        category: true,
        creator: true,
      },
    });

    // Update account balance
    await this.updateAccountBalance(transaction.accountId, transaction.amount);

    return transaction;
  }

  async findTransactions(filters: {
    accountId?: string;
    categoryId?: string;
    type?: TransactionType;
    status?: TransactionStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    const { limit = 50, offset = 0, ...where } = filters;
    
    const whereClause: any = {
      isDeleted: false,
      ...where,
    };

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: whereClause,
        include: {
          account: true,
          category: true,
          creator: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.transaction.count({ where: whereClause }),
    ]);

    return { transactions, total };
  }

  async findTransaction(id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, isDeleted: false },
      include: {
        account: true,
        category: true,
        creator: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    return transaction;
  }

  async updateTransaction(id: string, data: Prisma.TransactionUpdateInput, userId?: string) {
    const existing = await this.findTransaction(id);
    
    const transaction = await this.prisma.transaction.update({
      where: { id },
      data,
      include: {
        account: true,
        category: true,
        creator: true,
      },
    });

    // Update account balance if amount changed
    if (data.amount && data.amount !== existing.amount) {
      const difference = (data.amount as number) - existing.amount;
      await this.updateAccountBalance(transaction.accountId, difference);
    }

    return transaction;
  }

  async deleteTransaction(id: string, userId?: string) {
    const existing = await this.findTransaction(id);
    
    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    // Reverse the balance change
    await this.updateAccountBalance(existing.accountId, -existing.amount);

    return transaction;
  }

  // Category Management
  async createTransactionCategory(data: Prisma.TransactionCategoryCreateInput, userId?: string) {
    const category = await this.prisma.transactionCategory.create({
      data: { ...data, createdBy: userId },
      include: { _count: { select: { transactions: true } } },
    });

    return category;
  }

  async findTransactionCategories() {
    return this.prisma.transactionCategory.findMany({
      where: { isDeleted: false },
      include: { _count: { select: { transactions: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // Financial Analytics
  async getFinancialSummary(filters: {
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const whereClause: any = {
      isDeleted: false,
      status: TransactionStatus.COMPLETED,
      ...filters,
    };

    const pendingWhereClause: any = {
      isDeleted: false,
      status: TransactionStatus.PENDING,
      ...filters,
    };

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      pendingWhereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
        pendingWhereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
        pendingWhereClause.createdAt.lte = filters.endDate;
      }
    }

    const [
      income,
      expenses,
      pendingIncome,
      pendingExpenses,
      transactionCount,
      categoryBreakdown,
      bankAccounts,
      mercadoPagoAccount
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...whereClause, type: TransactionType.INCOME },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { ...whereClause, type: TransactionType.EXPENSE },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { ...pendingWhereClause, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...pendingWhereClause, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      this.prisma.transaction.count({ where: whereClause }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: whereClause,
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
      }),
      this.prisma.bankAccount.aggregate({
        where: { isDeleted: false, isActive: true },
        _sum: { currentBalance: true },
      }),
      this.prisma.bankAccount.findFirst({
        where: { accountType: 'mercado_pago', isDeleted: false, isActive: true },
        select: { currentBalance: true },
      }),
    ]);

    const totalRevenue = income._sum.amount || 0;
    const totalExpenses = Math.abs(expenses._sum.amount || 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Get category breakdown with names
    const categoryIds = categoryBreakdown.map(cb => cb.categoryId).filter(Boolean);
    const categories = await this.prisma.transactionCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);

    const revenueByCategory = categoryBreakdown
      .filter(cb => cb._sum.amount > 0)
      .map(cb => ({
        category: categoryMap[cb.categoryId] || 'Sin categoría',
        amount: cb._sum.amount,
        count: cb._count,
      }));

    const expensesByCategory = categoryBreakdown
      .filter(cb => cb._sum.amount < 0)
      .map(cb => ({
        category: categoryMap[cb.categoryId] || 'Sin categoría',
        amount: Math.abs(cb._sum.amount),
        count: cb._count,
      }));

    return {
      // Main metrics (matching frontend expectations)
      totalRevenue,
      totalExpenses,
      netProfit,
      bankBalance: bankAccounts._sum.currentBalance || 0,
      
      // Category breakdowns
      revenueByCategory,
      expensesByCategory,
      
      // Additional metrics
      additionalMetrics: {
        profitMargin,
        pendingRevenue: pendingIncome._sum.amount || 0,
        pendingExpenses: Math.abs(pendingExpenses._sum.amount || 0),
        mercadoPago: mercadoPagoAccount?.currentBalance || 0,
      },
      
      // Legacy fields for compatibility
      totalIncome: totalRevenue,
      transactionCount,
      incomeTransactions: income._count,
      expenseTransactions: expenses._count,
      categoryBreakdown,
      averageTransaction: transactionCount > 0 ? (totalRevenue + totalExpenses) / transactionCount : 0,
    };
  }

  async getDailyTotals(filters: {
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const whereClause: any = {
      isDeleted: false,
      status: TransactionStatus.COMPLETED,
      ...filters,
    };

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }

    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      select: {
        amount: true,
        type: true,
        createdAt: true,
      },
    });

    const dailyTotals: Record<string, { income: number; expenses: number }> = {};
    
    transactions.forEach(transaction => {
      const date = transaction.createdAt.toISOString().split('T')[0];
      if (!dailyTotals[date]) {
        dailyTotals[date] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === TransactionType.INCOME) {
        dailyTotals[date].income += transaction.amount;
      } else {
        dailyTotals[date].expenses += Math.abs(transaction.amount);
      }
    });

    return dailyTotals;
  }

  // Helper Methods
  private async updateAccountBalance(accountId: string, amountChange: number) {
    await this.prisma.bankAccount.update({
      where: { id: accountId },
      data: {
        currentBalance: {
          increment: amountChange,
        },
      },
    });
  }

  async seedDefaultData() {
    // Create default categories based on legacy data
    const defaultCategories = [
      { name: 'Ventas', icon: 'shopping-cart', color: '#10b981', description: 'Ingresos por ventas de productos y servicios' },
      { name: 'Compras', icon: 'shopping-bag', color: '#ef4444', description: 'Egresos por compras de insumos y materiales' },
      { name: 'Nómina', icon: 'users', color: '#3b82f6', description: 'Pagos de sueldos y beneficios al personal' },
      { name: 'Servicios', icon: 'cogs', color: '#f59e0b', description: 'Pagos por servicios públicos y mantenimiento' },
      { name: 'Transferencias', icon: 'exchange-alt', color: '#8b5cf6', description: 'Transferencias entre cuentas' },
      { name: 'Comisiones', icon: 'percentage', color: '#6b7280', description: 'Pagos por comisiones y tarifas bancarias' },
    ];

    for (const categoryData of defaultCategories) {
      await this.prisma.transactionCategory.upsert({
        where: { name: categoryData.name },
        update: {},
        create: categoryData,
      });
    }

    // Create default Mercado Pago account
    await this.prisma.bankAccount.upsert({
      where: { id: 'mercado-pago-default' },
      update: {},
      create: {
        id: 'mercado-pago-default',
        name: 'Mercado Pago Account',
        accountType: 'mercado_pago',
        currency: 'ARS',
        currentBalance: 0,
        isActive: true,
      },
    });
  }
}
