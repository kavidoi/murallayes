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
  // Account balance tracking
  accountBalance: number; // Net amount owed (positive = company owes employee, negative = employee owes company)
  advancesPaid: number; // Money already advanced to employee
  personalExpensesPaidByCompany: number; // Personal expenses paid by company (to be deducted)
  companyExpensesPaidByEmployee: number; // Company expenses paid by employee (to be reimbursed)
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
  advances: number; // Advances deducted from this payroll
  expenseSettlements: number; // Expense settlements in this payroll
  status: 'PROCESSED' | 'PENDING' | 'CANCELLED';
}

interface MyExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  expenseType: 'COMPANY_BUSINESS' | 'PERSONAL' | 'MIXED'; // Who should pay
  paidBy: 'EMPLOYEE' | 'COMPANY' | 'PENDING'; // Who actually paid
  settlementMethod?: 'REIMBURSEMENT' | 'PAYROLL_DEDUCTION' | 'DIRECT_PAYMENT';
  settlementStatus: 'PENDING' | 'SETTLED' | 'PARTIALLY_SETTLED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED' | 'CANCELLED';
  submittedAt: string;
  receiptUrl?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  reimbursedAt?: string;
  personalPortion?: number; // For mixed expenses
  companyPortion?: number; // For mixed expenses
}

interface MyPayment {
  id: string;
  paymentType: 'ADVANCE' | 'REIMBURSEMENT' | 'SALARY' | 'COMMISSION' | 'EXPENSE_SETTLEMENT';
  amount: number;
  direction: 'TO_EMPLOYEE' | 'TO_COMPANY'; // Direction of payment
  description: string;
  paymentDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'PAYROLL' | 'PETTY_CASH';
  relatedExpenseId?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

interface SettlementOption {
  id: string;
  type: 'REIMBURSEMENT' | 'PAYROLL_DEDUCTION' | 'DIRECT_PAYMENT' | 'ADVANCE';
  amount: number;
  description: string;
  settlementDate?: string;
  canExecute: boolean;
  reason?: string; // Why it can't be executed if canExecute is false
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
      const reimbursementsPending = 40000; // Company expenses paid by employee
      const reimbursementsPaid = 10000; // Already reimbursed
      const expensesPendingApproval = 2; // Number of expenses pending
      
      // Account balance calculations
      const advancesPaid = 100000; // Money already advanced to employee
      const personalExpensesPaidByCompany = 25000; // Personal expenses paid by company
      const companyExpensesPaidByEmployee = 40000; // Company expenses paid by employee
      
      // Net balance: positive = company owes employee, negative = employee owes company
      const accountBalance = (reimbursementsPending + commissionsPending) - (personalExpensesPaidByCompany + advancesPaid);

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
          nextPaymentAmount: monthlyBaseSalary + Math.max(0, accountBalance),
          accountBalance,
          advancesPaid,
          personalExpensesPaidByCompany,
          companyExpensesPaidByEmployee
        }
      };
    } catch (error) {
      console.error('Error fetching my finance summary:', error);
      return { success: false, error: 'Error al obtener resumen financiero personal' };
    }
  }

  @Get('account-balance')
  async getAccountBalance(@Request() req: any) {
    try {
      const userId = req.user.sub;
      
      // Mock detailed account balance breakdown
      const balanceItems = [
        {
          id: '1',
          type: 'COMMISSION_PENDING',
          description: 'January sales commission',
          amount: 50000,
          direction: 'TO_EMPLOYEE',
          date: '2025-01-31',
          status: 'PENDING'
        },
        {
          id: '2',
          type: 'REIMBURSEMENT_PENDING',
          description: 'Client meeting lunch (Company expense)',
          amount: 25000,
          direction: 'TO_EMPLOYEE',
          date: '2025-02-08',
          status: 'PENDING'
        },
        {
          id: '3',
          type: 'ADVANCE_RECEIVED',
          description: 'Salary advance',
          amount: -100000,
          direction: 'TO_COMPANY',
          date: '2025-02-05',
          status: 'SETTLED'
        },
        {
          id: '4',
          type: 'PERSONAL_EXPENSE_PAID_BY_COMPANY',
          description: 'Personal coffee (paid by company)',
          amount: -5000,
          direction: 'TO_COMPANY',
          date: '2025-02-07',
          status: 'PENDING'
        }
      ];

      const netBalance = balanceItems.reduce((sum, item) => sum + item.amount, 0);

      return {
        success: true,
        accountBalance: {
          netBalance,
          items: balanceItems,
          summary: {
            totalOwedToEmployee: balanceItems.filter(i => i.amount > 0).reduce((sum, i) => sum + i.amount, 0),
            totalOwedToCompany: Math.abs(balanceItems.filter(i => i.amount < 0).reduce((sum, i) => sum + i.amount, 0))
          }
        }
      };
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return { success: false, error: 'Error al obtener balance de cuenta' };
    }
  }

  @Get('settlement-options')
  async getSettlementOptions(@Request() req: any) {
    try {
      const userId = req.user.sub;
      
      // Mock settlement options based on current balance
      const options: SettlementOption[] = [
        {
          id: '1',
          type: 'REIMBURSEMENT',
          amount: 75000,
          description: 'Direct reimbursement for pending company expenses',
          canExecute: true
        },
        {
          id: '2',
          type: 'PAYROLL_DEDUCTION',
          amount: -25000,
          description: 'Deduct personal expenses from next payroll',
          settlementDate: '2025-02-28',
          canExecute: true
        },
        {
          id: '3',
          type: 'ADVANCE',
          amount: 200000,
          description: 'Salary advance (max 25% of monthly salary)',
          canExecute: true
        },
        {
          id: '4',
          type: 'DIRECT_PAYMENT',
          amount: -100000,
          description: 'Repay salary advance',
          canExecute: false,
          reason: 'Insufficient funds in personal account'
        }
      ];

      return {
        success: true,
        settlementOptions: options
      };
    } catch (error) {
      console.error('Error fetching settlement options:', error);
      return { success: false, error: 'Error al obtener opciones de liquidación' };
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
      // For now, return mock data with settlement tracking
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
          advances: 0,
          expenseSettlements: 0,
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
          advances: 100000, // Advance deducted
          expenseSettlements: 15000, // Personal expenses deducted
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
    @Query('paidBy') paidBy?: string,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0'
  ) {
    try {
      const userId = req.user.sub;
      
      // TODO: Implement expenses table and query
      // For now, return mock data with payment tracking
      const expenses: MyExpense[] = [
        {
          id: '1',
          description: 'Client meeting lunch',
          amount: 25000,
          category: 'Meals',
          expenseDate: '2025-02-08',
          expenseType: 'COMPANY_BUSINESS',
          paidBy: 'EMPLOYEE',
          settlementMethod: 'REIMBURSEMENT',
          settlementStatus: 'PENDING',
          status: 'APPROVED',
          submittedAt: '2025-02-09T10:00:00Z',
          notes: 'Business lunch with potential client - company should reimburse'
        },
        {
          id: '2',
          description: 'Personal coffee',
          amount: 5000,
          category: 'Meals',
          expenseDate: '2025-02-07',
          expenseType: 'PERSONAL',
          paidBy: 'COMPANY',
          settlementMethod: 'PAYROLL_DEDUCTION',
          settlementStatus: 'PENDING',
          status: 'APPROVED',
          submittedAt: '2025-02-07T16:00:00Z',
          notes: 'Personal expense - should be deducted from payroll'
        },
        {
          id: '3',
          description: 'Taxi to airport (mixed)',
          amount: 20000,
          category: 'Travel',
          expenseDate: '2025-02-05',
          expenseType: 'MIXED',
          paidBy: 'EMPLOYEE',
          settlementMethod: 'REIMBURSEMENT',
          settlementStatus: 'PENDING',
          status: 'APPROVED',
          submittedAt: '2025-02-06T14:30:00Z',
          personalPortion: 8000,
          companyPortion: 12000,
          notes: 'Business trip with personal detour - split 60/40'
        }
      ];

      // Filter by paidBy if provided
      let filteredExpenses = expenses;
      if (paidBy) {
        filteredExpenses = expenses.filter(exp => exp.paidBy === paidBy.toUpperCase());
      }
      if (status) {
        filteredExpenses = filteredExpenses.filter(exp => exp.status === status.toUpperCase());
      }

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
        expenseType: expenseData.expenseType || 'COMPANY_BUSINESS',
        paidBy: expenseData.paidBy || 'EMPLOYEE',
        settlementMethod: expenseData.settlementMethod || 'REIMBURSEMENT',
        settlementStatus: 'PENDING',
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
        notes: expenseData.notes,
        personalPortion: expenseData.personalPortion || null,
        companyPortion: expenseData.companyPortion || null,
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

  @Get('payments')
  async getMyPayments(
    @Request() req: any,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0'
  ) {
    try {
      const userId = req.user.sub;
      
      // Mock payment history
      const payments: MyPayment[] = [
        {
          id: '1',
          paymentType: 'ADVANCE',
          amount: 100000,
          direction: 'TO_EMPLOYEE',
          description: 'Salary advance requested',
          paymentDate: '2025-02-05',
          paymentMethod: 'BANK_TRANSFER',
          status: 'COMPLETED'
        },
        {
          id: '2',
          paymentType: 'REIMBURSEMENT',
          amount: 15000,
          direction: 'TO_EMPLOYEE',
          description: 'Taxi reimbursement',
          paymentDate: '2025-02-01',
          paymentMethod: 'CASH',
          relatedExpenseId: '2',
          status: 'COMPLETED'
        }
      ];

      return {
        success: true,
        payments,
        totalCount: payments.length
      };
    } catch (error) {
      console.error('Error fetching my payments:', error);
      return { success: false, error: 'Error al obtener historial de pagos' };
    }
  }

  @Post('payments')
  async requestPayment(@Request() req: any, @Body() paymentData: any) {
    try {
      const userId = req.user.sub;
      
      const newPayment: MyPayment = {
        id: Date.now().toString(),
        paymentType: paymentData.paymentType,
        amount: parseFloat(paymentData.amount),
        direction: paymentData.direction,
        description: paymentData.description,
        paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
        paymentMethod: paymentData.paymentMethod,
        relatedExpenseId: paymentData.relatedExpenseId,
        status: 'PENDING',
        notes: paymentData.notes
      };

      return {
        success: true,
        payment: newPayment,
        message: 'Solicitud de pago enviada'
      };
    } catch (error) {
      console.error('Error requesting payment:', error);
      return { success: false, error: 'Error al solicitar pago' };
    }
  }

  @Post('settlements/:optionId/execute')
  async executeSettlement(@Request() req: any, @Param('optionId') optionId: string) {
    try {
      const userId = req.user.sub;
      
      // TODO: Implement settlement execution
      const settlement = {
        id: optionId,
        executedAt: new Date().toISOString(),
        status: 'EXECUTED'
      };

      return {
        success: true,
        settlement,
        message: 'Liquidación ejecutada exitosamente'
      };
    } catch (error) {
      console.error('Error executing settlement:', error);
      return { success: false, error: 'Error al ejecutar liquidación' };
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
        expenseType: expenseData.expenseType,
        paidBy: expenseData.paidBy,
        settlementMethod: expenseData.settlementMethod,
        settlementStatus: 'PENDING',
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
        notes: expenseData.notes,
        personalPortion: expenseData.personalPortion,
        companyPortion: expenseData.companyPortion,
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