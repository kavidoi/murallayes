import { Controller, Get, Post, Body, Query, Param, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/roles.guard';
import { Roles } from '../../../common/roles.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

// Types for Staff Finance API
interface SalaryAdjustment {
  id: string;
  employeeId: string;
  employeeName: string;
  adjustmentType: 'SALARY_INCREASE' | 'SALARY_DECREASE' | 'BONUS' | 'ALLOWANCE_CHANGE' | 'PROMOTION' | 'DEMOTION' | 'ANNUAL_REVIEW';
  previousAmount: number;
  newAmount: number;
  effectiveDate: string;
  reason: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface EmployeeExpense {
  id: string;
  employeeId: string;
  employeeName: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED' | 'CANCELLED';
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reimbursedAt?: string;
  receiptUrl?: string;
  notes?: string;
}

interface StaffFinanceSummary {
  totalEmployees: number;
  totalMonthlySalaries: number;
  totalYearToDateSalaries: number;
  averageSalary: number;
  pendingExpenses: number;
  totalPendingExpenseAmount: number;
  recentSalaryAdjustments: number;
  payrollVsRevenue: {
    payrollPercentage: number;
    revenueAmount: number;
    payrollAmount: number;
  };
  upcomingPayments: {
    nextPayrollDate: string;
    nextPayrollAmount: number;
    pendingExpenseReimbursements: number;
  };
}

@Controller('api/staff-finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffFinanceController {
  constructor(private prisma: PrismaService) {}

  @Get('summary')
  @Roles('admin', 'finance_manager', 'hr_manager')
  async getStaffFinanceSummary() {
    try {
      // Get active employees count
      const totalEmployees = await this.prisma.user.count({
        where: { isActive: true }
      });
      
      // For now, use placeholder values until we have salary/payroll tables
      const totalMonthlySalaries = totalEmployees * 500000; // Avg 500k per employee
      const totalYearToDateSalaries = totalMonthlySalaries * 2; // 2 months processed
      const averageSalary = totalEmployees > 0 ? totalMonthlySalaries / totalEmployees : 0;
      
      // Use mock data for expenses until we have expense tables
      const pendingExpenses = 1;
      const totalPendingExpenseAmount = 8500;
      const recentSalaryAdjustments = 0;

      // Calculate revenue from transactions
      const monthlyRevenue = await this.prisma.transaction.aggregate({
        where: {
          type: 'INCOME',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { amount: true }
      });
      
      const revenueAmount = monthlyRevenue._sum.amount || 1000000; // Fallback
      const payrollPercentage = (totalMonthlySalaries / revenueAmount) * 100;

      return {
        success: true,
        summary: {
          totalEmployees,
          totalMonthlySalaries,
          totalYearToDateSalaries,
          averageSalary,
          pendingExpenses,
          totalPendingExpenseAmount,
          recentSalaryAdjustments,
          payrollVsRevenue: {
            payrollPercentage: Math.round(payrollPercentage * 100) / 100,
            revenueAmount,
            payrollAmount: totalMonthlySalaries
          },
          upcomingPayments: {
            nextPayrollDate: '2025-02-28',
            nextPayrollAmount: totalMonthlySalaries,
            pendingExpenseReimbursements: totalPendingExpenseAmount
          }
        }
      };
    } catch (error) {
      console.error('Error fetching staff finance summary:', error);
      return { success: false, error: 'Error al obtener resumen financiero del personal' };
    }
  }

  @Get('salary-adjustments')
  @Roles('admin', 'finance_manager', 'hr_manager')
  async getSalaryAdjustments(
    @Query('employeeId') employeeId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0'
  ) {
    try {
      // TODO: Implement salary adjustments table and query
      const salaryAdjustments: SalaryAdjustment[] = [];

      return {
        success: true,
        salaryAdjustments,
        totalCount: 0,
        summary: {
          totalAdjustments: 0,
          recentIncreases: 0,
          totalBonusesPaid: 0
        }
      };
    } catch (error) {
      console.error('Error fetching salary adjustments:', error);
      return { success: false, error: 'Error al obtener ajustes salariales' };
    }
  }

  @Post('salary-adjustments')
  @Roles('admin', 'finance_manager', 'hr_manager')
  async createSalaryAdjustment(@Body() adjustmentData: Partial<SalaryAdjustment>) {
    try {
      // TODO: Implement salary adjustments table creation
      const newAdjustment = adjustmentData;

      return {
        success: true,
        salaryAdjustment: newAdjustment,
        message: 'Ajuste salarial creado exitosamente'
      };
    } catch (error) {
      console.error('Error creating salary adjustment:', error);
      return { success: false, error: 'Error al crear ajuste salarial' };
    }
  }

  @Get('expenses')
  @Roles('admin', 'finance_manager', 'hr_manager', 'employee')
  async getEmployeeExpenses(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0'
  ) {
    try {
      // TODO: Implement employee expenses table and query
      const expenses: EmployeeExpense[] = [];

      return {
        success: true,
        expenses,
        totalCount: 0,
        summary: {
          totalExpenses: 0,
          pendingReview: 0,
          totalPendingAmount: 0,
          totalReimbursedThisMonth: 0
        }
      };
    } catch (error) {
      console.error('Error fetching employee expenses:', error);
      return { success: false, error: 'Error al obtener gastos de empleados' };
    }
  }

  @Post('expenses')
  @Roles('admin', 'finance_manager', 'hr_manager', 'employee')
  async createEmployeeExpense(@Body() expenseData: Partial<EmployeeExpense>) {
    try {
      // TODO: Implement employee expenses table creation
      const newExpense = expenseData;

      return {
        success: true,
        expense: newExpense,
        message: 'Gasto creado exitosamente'
      };
    } catch (error) {
      console.error('Error creating employee expense:', error);
      return { success: false, error: 'Error al crear gasto' };
    }
  }

  @Post('expenses/:id/approve')
  @Roles('admin', 'finance_manager', 'hr_manager')
  async approveExpense(@Param('id') id: string) {
    try {
      // TODO: Implement expense approval in database
      const expense = { id, status: 'APPROVED' };

      return {
        success: true,
        expense,
        message: 'Gasto aprobado exitosamente'
      };
    } catch (error) {
      console.error('Error approving expense:', error);
      return { success: false, error: 'Error al aprobar gasto' };
    }
  }

  @Post('expenses/:id/reject')
  @Roles('admin', 'finance_manager', 'hr_manager')
  async rejectExpense(@Param('id') id: string) {
    try {
      // TODO: Implement expense rejection in database
      const expense = { id, status: 'REJECTED' };

      return {
        success: true,
        expense,
        message: 'Gasto rechazado'
      };
    } catch (error) {
      console.error('Error rejecting expense:', error);
      return { success: false, error: 'Error al rechazar gasto' };
    }
  }

  @Post('expenses/:id/reimburse')
  @Roles('admin', 'finance_manager')
  async reimburseExpense(@Param('id') id: string) {
    try {
      // TODO: Implement expense reimbursement in database
      const expense = { id, status: 'REIMBURSED' };

      return {
        success: true,
        expense,
        message: 'Gasto reembolsado exitosamente'
      };
    } catch (error) {
      console.error('Error reimbursing expense:', error);
      return { success: false, error: 'Error al reembolsar gasto' };
    }
  }

  @Post('expenses/:id')
  @Roles('admin', 'finance_manager', 'hr_manager')
  async updateEmployeeExpense(@Param('id') id: string, @Body() expenseData: any) {
    try {
      // TODO: Implement expense update in database
      const updatedExpense = {
        id,
        ...expenseData,
        updatedAt: new Date().toISOString()
      };

      return {
        success: true,
        expense: updatedExpense,
        message: 'Gasto actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error updating employee expense:', error);
      return { success: false, error: 'Error al actualizar gasto' };
    }
  }

  @Get('categories')
  @Roles('admin', 'finance_manager', 'hr_manager', 'employee')
  async getExpenseCategories() {
    try {
      const categories = [
        { id: 'travel', name: 'Travel', icon: '🚗', description: 'Transportation and travel expenses' },
        { id: 'meals', name: 'Meals', icon: '🍽️', description: 'Business meals and entertainment' },
        { id: 'office_supplies', name: 'Office Supplies', icon: '📝', description: 'Office materials and supplies' },
        { id: 'software', name: 'Software', icon: '💻', description: 'Software licenses and subscriptions' },
        { id: 'training', name: 'Training', icon: '📚', description: 'Professional development and training' },
        { id: 'equipment', name: 'Equipment', icon: '🖥️', description: 'Hardware and equipment purchases' },
        { id: 'other', name: 'Other', icon: '📋', description: 'Other business expenses' }
      ];

      return {
        success: true,
        categories
      };
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      return { success: false, error: 'Error al obtener categorías de gastos' };
    }
  }
}
