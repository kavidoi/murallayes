import { Controller, Get, Post, Put, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { PrismaService } from '../../../prisma/prisma.service';

// Types for My Finance API
interface MyFinanceSummary {
  monthlyBaseSalary: number;
  totalEarningsThisMonth: number;
  totalEarningsYearToDate: number;
  commissionsPending: number;
  commissionsPaid: number;
  reimbursementsPending: number;
  reimbursementsPaid: number;
  expensesPendingApproval: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
}

interface MyPayrollEntry {
  id: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  overtime: number;
  commissions: number;
  bonuses: number;
  status: 'PROCESSED' | 'PENDING' | 'CANCELLED';
}

interface MyExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED' | 'CANCELLED';
  submittedAt: string;
  receiptUrl?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  reimbursedAt?: string;
}

@Controller('api/my-finance')
@UseGuards(JwtAuthGuard)
export class MyFinanceController {
  constructor(private prisma: PrismaService) {}

  @Get('summary')
  async getMyFinanceSummary(@Request() req: any) {
    try {
      const userId = req.user.sub;
      
      // Get user info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // For now, use mock data until we have proper payroll/salary tables
      const monthlyBaseSalary = 800000; // Base salary in CLP
      const totalEarningsThisMonth = 850000; // Including bonuses/commissions
      const totalEarningsYearToDate = 1700000; // 2 months processed
      const commissionsPending = 50000; // Pending commissions
      const commissionsPaid = 25000; // Already paid
      const reimbursementsPending = 15000; // Pending expense reimbursements
      const reimbursementsPaid = 10000; // Already reimbursed
      const expensesPendingApproval = 2; // Number of expenses pending

      return {
        success: true,
        summary: {
          monthlyBaseSalary,
          totalEarningsThisMonth,
          totalEarningsYearToDate,
          commissionsPending,
          commissionsPaid,
          reimbursementsPending,
          reimbursementsPaid,
          expensesPendingApproval,
          nextPaymentDate: '2025-02-28',
          nextPaymentAmount: monthlyBaseSalary + commissionsPending
        }
      };
    } catch (error) {
      console.error('Error fetching my finance summary:', error);
      return { success: false, error: 'Error al obtener resumen financiero personal' };
    }
  }

  @Get('payroll')
  async getMyPayrollEntries(
    @Request() req: any,
    @Query('limit') limit = '10',
    @Query('offset') offset = '0'
  ) {
    try {
      const userId = req.user.sub;
      
      // TODO: Implement payroll entries table and query
      // For now, return mock data
      const payrollEntries: MyPayrollEntry[] = [
        {
          id: '1',
          payPeriodStart: '2025-01-01',
          payPeriodEnd: '2025-01-31',
          payDate: '2025-02-01',
          grossPay: 850000,
          deductions: 85000,
          netPay: 765000,
          overtime: 25000,
          commissions: 25000,
          bonuses: 0,
          status: 'PROCESSED'
        },
        {
          id: '2',
          payPeriodStart: '2024-12-01',
          payPeriodEnd: '2024-12-31',
          payDate: '2025-01-01',
          grossPay: 800000,
          deductions: 80000,
          netPay: 720000,
          overtime: 0,
          commissions: 0,
          bonuses: 0,
          status: 'PROCESSED'
        }
      ];

      return {
        success: true,
        payrollEntries,
        totalCount: payrollEntries.length
      };
    } catch (error) {
      console.error('Error fetching my payroll entries:', error);
      return { success: false, error: 'Error al obtener historial de pagos' };
    }
  }

  @Get('expenses')
  async getMyExpenses(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0'
  ) {
    try {
      const userId = req.user.sub;
      
      // TODO: Implement expenses table and query
      // For now, return mock data
      const expenses: MyExpense[] = [
        {
          id: '1',
          description: 'Client meeting lunch',
          amount: 25000,
          category: 'Meals',
          expenseDate: '2025-02-08',
          status: 'PENDING',
          submittedAt: '2025-02-09T10:00:00Z',
          notes: 'Business lunch with potential client'
        },
        {
          id: '2',
          description: 'Taxi to airport',
          amount: 15000,
          category: 'Travel',
          expenseDate: '2025-02-05',
          status: 'APPROVED',
          submittedAt: '2025-02-06T14:30:00Z',
          approvedBy: 'Finance Manager',
          approvedAt: '2025-02-07T09:15:00Z'
        }
      ];

      // Filter by status if provided
      const filteredExpenses = status 
        ? expenses.filter(exp => exp.status === status.toUpperCase())
        : expenses;

      return {
        success: true,
        expenses: filteredExpenses,
        totalCount: filteredExpenses.length
      };
    } catch (error) {
      console.error('Error fetching my expenses:', error);
      return { success: false, error: 'Error al obtener mis gastos' };
    }
  }

  @Post('expenses')
  async createMyExpense(@Request() req: any, @Body() expenseData: any) {
    try {
      const userId = req.user.sub;
      
      // TODO: Implement expense creation in database
      const newExpense: MyExpense = {
        id: Date.now().toString(),
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        category: expenseData.category,
        expenseDate: expenseData.expenseDate,
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
        notes: expenseData.notes,
      };

      return {
        success: true,
        expense: newExpense,
        message: 'Gasto enviado para aprobación'
      };
    } catch (error) {
      console.error('Error creating my expense:', error);
      return { success: false, error: 'Error al crear gasto' };
    }
  }

  @Put('expenses/:id')
  async updateMyExpense(
    @Request() req: any,
    @Param('id') id: string,
    @Body() expenseData: any
  ) {
    try {
      const userId = req.user.sub;
      
      // TODO: Implement expense update in database
      const updatedExpense: MyExpense = {
        id,
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        category: expenseData.category,
        expenseDate: expenseData.expenseDate,
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
        notes: expenseData.notes,
      };

      return {
        success: true,
        expense: updatedExpense,
        message: 'Gasto actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error updating my expense:', error);
      return { success: false, error: 'Error al actualizar gasto' };
    }
  }

  @Post('expenses/:id/cancel')
  async cancelMyExpense(@Request() req: any, @Param('id') id: string) {
    try {
      const userId = req.user.sub;
      
      // TODO: Implement expense cancellation in database
      const expense = { id, status: 'CANCELLED' };

      return {
        success: true,
        expense,
        message: 'Gasto cancelado exitosamente'
      };
    } catch (error) {
      console.error('Error cancelling my expense:', error);
      return { success: false, error: 'Error al cancelar gasto' };
    }
  }
} 