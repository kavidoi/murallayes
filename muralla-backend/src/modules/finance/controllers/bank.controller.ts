import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/roles.guard';
import { Roles } from '../../../common/roles.decorator';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionType, TransactionStatus, PaymentMethod } from '@prisma/client';

interface BankTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  status: 'completed' | 'pending' | 'failed';
  payment_method: string;
  reference: string;
  category_icon?: string;
  customer_name?: string;
  supplier_name?: string;
  employee_name?: string;
  items?: string[];
}

interface BankSummary {
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
  averageTransaction: number;
  categories: Record<string, { total: number; count: number }>;
  dailyTotals: Record<string, { income: number; expenses: number }>;
  topTransactions: BankTransaction[];
}

interface BankCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

@Controller('api/bank')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BankController {
  constructor(private prisma: PrismaService) {}

  @Get('transactions')
  @Roles('admin', 'finance_manager', 'employee')
  async getTransactions(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: 'income' | 'expense',
    @Query('category') category?: string,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0'
  ) {
    try {
      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }
      if (type) {
        where.type = type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE;
      }
      if (category) {
        where.category = { is: { name: category } };
      }

      const [totalCount, rows] = await Promise.all([
        this.prisma.transaction.count({ where }),
        this.prisma.transaction.findMany({
          where,
          include: { category: true },
          orderBy: { createdAt: 'desc' },
          skip: parseInt(offset),
          take: parseInt(limit)
        })
      ]);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const [incomeAgg, expenseAgg] = await Promise.all([
        this.prisma.transaction.aggregate({ where: { createdAt: { gte: monthStart }, type: TransactionType.INCOME }, _sum: { amount: true } }),
        this.prisma.transaction.aggregate({ where: { createdAt: { gte: monthStart }, type: TransactionType.EXPENSE }, _sum: { amount: true } })
      ]);

      const monthlyIncome = incomeAgg._sum.amount || 0;
      const monthlyExpenses = expenseAgg._sum.amount || 0;

      const paginatedTransactions: BankTransaction[] = rows.map(t => ({
        id: t.id,
        date: t.createdAt as any,
        description: (t as any).description || 'Transacción',
        amount: t.type === TransactionType.INCOME ? Number(t.amount) : -Math.abs(Number(t.amount)),
        category: (t as any).category?.name || 'Otros',
        type: t.type === TransactionType.INCOME ? 'income' : 'expense',
        status: t.status === TransactionStatus.PENDING ? 'pending' : (t.status === TransactionStatus.FAILED ? 'failed' : 'completed'),
        payment_method: t.paymentMethod === PaymentMethod.MERCADO_PAGO ? 'Mercado Pago' : (t.paymentMethod || 'Otro'),
        reference: (t as any).reference || (t as any).externalId || t.id,
      }));

      return {
        success: true,
        transactions: paginatedTransactions,
        currentBalance: await this.getCurrentBalance(),
        monthlyIncome,
        monthlyExpenses,
        totalCount,
        summary: {
          totalIncome: Number(incomeAgg._sum.amount || 0),
          totalExpenses: Number(expenseAgg._sum.amount || 0),
          transactionCount: totalCount
        }
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Error al obtener transacciones');
    }
  }

  @Get('balance')
  @Roles('admin', 'finance_manager', 'employee')
  async getBalance() {
    try {
      const balance = await this.getCurrentBalance();
      return { success: true, balance, lastUpdated: new Date().toISOString() };
    } catch (error) {
      throw new Error('Error al obtener balance');
    }
  }

  @Post('transaction')
  @Roles('admin', 'finance_manager')
  async createTransaction(
    @Body() transactionData: {
      description: string;
      amount: number;
      category: string;
      type: 'income' | 'expense';
      payment_method: string;
      reference?: string;
      customer_name?: string;
      supplier_name?: string;
    }
  ) {
    try {
      const { description, amount, category, type, payment_method, reference, customer_name, supplier_name } = transactionData;

      // Validate required fields
      if (!description || !amount || !category || !type) {
        throw new Error('Faltan campos requeridos');
      }

      const cat = await this.prisma.transactionCategory.upsert({
        where: { name: category },
        update: {},
        create: { name: category, icon: 'shopping-cart', color: '#10b981' }
      });

      const account = await this.getOrCreateDefaultAccount();

      const created = await this.prisma.transaction.create({
        data: {
          description,
          amount: Math.abs(amount),
          type: type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
          status: TransactionStatus.COMPLETED,
          paymentMethod: payment_method === 'Mercado Pago' ? PaymentMethod.MERCADO_PAGO : PaymentMethod.OTHER,
          reference: reference || `${type.toUpperCase()}-${Date.now()}`,
          accountId: account.id,
          categoryId: cat.id,
          customerName: customer_name || null,
          supplierName: supplier_name || null,
        }
      });

      return { success: true, transaction: created };
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Error al crear transacción');
    }
  }

  @Get('summary')
  @Roles('admin', 'finance_manager', 'employee')
  async getSummary(@Query('period') period = 'monthly') {
    try {
      const now = new Date();
      let rangeStart: Date | undefined;
      if (period === 'daily') rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      else if (period === 'weekly') rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const where = { createdAt: { gte: rangeStart } } as any;
      const rows = await this.prisma.transaction.findMany({ where, include: { category: true }, orderBy: { createdAt: 'desc' } });
      const mapped: BankTransaction[] = rows.map(t => ({
        id: t.id,
        date: t.createdAt as any,
        description: (t as any).description || 'Transacción',
        amount: t.type === TransactionType.INCOME ? Number(t.amount) : -Math.abs(Number(t.amount)),
        category: (t as any).category?.name || 'Otros',
        type: t.type === TransactionType.INCOME ? 'income' : 'expense',
        status: t.status === TransactionStatus.PENDING ? 'pending' : (t.status === TransactionStatus.FAILED ? 'failed' : 'completed'),
        payment_method: t.paymentMethod === PaymentMethod.MERCADO_PAGO ? 'Mercado Pago' : (t.paymentMethod || 'Otro'),
        reference: (t as any).reference || (t as any).externalId || t.id,
      }));

      const summary: BankSummary = {
        totalIncome: mapped.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
        totalExpenses: Math.abs(mapped.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
        transactionCount: mapped.length,
        averageTransaction: mapped.reduce((s, t) => s + Math.abs(t.amount), 0) / (mapped.length || 1),
        categories: this.getCategorySummary(mapped),
        dailyTotals: this.getDailyTotals(mapped),
        topTransactions: mapped.slice(0, 5)
      };

      return { success: true, summary };
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw new Error('Error al obtener resumen');
    }
  }

  @Get('categories')
  @Roles('admin', 'finance_manager', 'employee')
  async getCategories() {
    try {
      const categories: BankCategory[] = [
        { id: 'ventas', name: 'Ventas', icon: 'shopping-cart', color: 'green' },
        { id: 'compras', name: 'Compras', icon: 'shopping-bag', color: 'red' },
        { id: 'nomina', name: 'Nómina', icon: 'users', color: 'blue' },
        { id: 'servicios', name: 'Servicios', icon: 'cogs', color: 'yellow' },
        { id: 'transferencias', name: 'Transferencias', icon: 'exchange-alt', color: 'purple' },
        { id: 'comisiones', name: 'Comisiones', icon: 'percentage', color: 'gray' }
      ];

      return { success: true, categories };
    } catch (error) {
      throw new Error('Error al obtener categorías');
    }
  }

  private async getCurrentBalance(): Promise<number> {
    // Prefer bank account balance if present
    const account = await this.prisma.bankAccount.findFirst({ where: { name: 'Mercado Pago Account', isActive: true } });
    if (account && typeof (account as any).currentBalance === 'number') {
      return Number((account as any).currentBalance);
    }
    // Fallback: income - expenses
    const [incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.transaction.aggregate({ where: { type: TransactionType.INCOME }, _sum: { amount: true } }),
      this.prisma.transaction.aggregate({ where: { type: TransactionType.EXPENSE }, _sum: { amount: true } })
    ]);
    return Number(incomeAgg._sum.amount || 0) - Number(expenseAgg._sum.amount || 0);
  }

  private async getOrCreateDefaultAccount() {
    let account = await this.prisma.bankAccount.findFirst({ where: { name: 'Mercado Pago Account', isActive: true } });
    if (!account) {
      account = await this.prisma.bankAccount.create({
        data: {
          name: 'Mercado Pago Account',
          accountType: 'mercado_pago',
          currency: 'ARS',
          isActive: true,
          currentBalance: 0,
        },
      });
    }
    return account;
  }

  // Mercado Pago webhook endpoint
  @Post('mercadopago/webhook')
  async handleMercadoPagoWebhook(@Body() webhookData: any) {
    try {
      const { type, data } = webhookData;

      if (type === 'payment') {
        // Prefer dedicated finance webhook in FinanceController.
        // This endpoint remains for backward compatibility.
        console.log('Mercado Pago webhook (bank) received:', data?.id);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook error:', error);
      throw new Error('Webhook error');
    }
  }

  // Helper methods
  private getCategorySummary(transactions: BankTransaction[]) {
    const categories: Record<string, { total: number; count: number }> = {};
    transactions.forEach(transaction => {
      const category = transaction.category || 'Otros';
      if (!categories[category]) {
        categories[category] = { total: 0, count: 0 };
      }
      categories[category].total += Math.abs(transaction.amount);
      categories[category].count += 1;
    });
    return categories;
  }

  private getDailyTotals(transactions: BankTransaction[]) {
    const dailyTotals: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!dailyTotals[date]) {
        dailyTotals[date] = { income: 0, expenses: 0 };
      }
      
      if (transaction.amount > 0) {
        dailyTotals[date].income += transaction.amount;
      } else {
        dailyTotals[date].expenses += Math.abs(transaction.amount);
      }
    });
    return dailyTotals;
  }
}
