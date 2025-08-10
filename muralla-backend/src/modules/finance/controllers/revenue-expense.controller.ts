import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/roles.guard';
import { Roles } from '../../../common/roles.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

// Revenue & Expense Interfaces
interface RevenueEntry {
  id: string;
  description: string;
  amount: number;
  category: 'SALES' | 'SERVICES' | 'COMMISSIONS' | 'OTHER_INCOME';
  subcategory?: string;
  revenueDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'MERCADO_PAGO' | 'CARD' | 'OTHER';
  source: 'CUSTOMER' | 'PARTNER' | 'INVESTMENT' | 'REFUND' | 'OTHER';
  customerId?: string;
  customerName?: string;
  invoiceNumber?: string;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  notes?: string;
  linkedTransactionId?: string;
  linkedPaymentId?: string;
  createdBy: string;
  createdAt: string;
  tags?: string[];
}

interface ExpenseEntry {
  id: string;
  description: string;
  amount: number;
  category: 'OPERATIONAL' | 'MARKETING' | 'STAFF' | 'SUPPLIES' | 'UTILITIES' | 'RENT' | 'OTHER';
  subcategory?: string;
  expenseDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'EMPLOYEE_REIMBURSEMENT' | 'OTHER';
  vendor?: string;
  invoiceNumber?: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'OVERDUE';
  dueDate?: string;
  notes?: string;
  linkedTransactionId?: string;
  linkedEmployeeExpenseId?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}

interface FinancialSummary {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueByCategory: { [key: string]: number };
  expensesByCategory: { [key: string]: number };
  cashFlow: number;
  bankBalance: number;
  pendingRevenue: number;
  pendingExpenses: number;
  employeeExpensesPending: number;
  merchantPaymentsTotal: number;
}

@Controller('api/revenue-expense')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RevenueExpenseController {
  constructor(private prisma: PrismaService) {}

  @Get('revenue')
  @Roles('admin', 'finance_manager', 'manager')
  async getRevenue(@Query('status') status?: string, @Query('category') category?: string) {
    try {
      const mockRevenue: RevenueEntry[] = [
        {
          id: '1',
          description: 'Coffee sales - Morning rush',
          amount: 85000,
          category: 'SALES',
          subcategory: 'Food & Beverage',
          revenueDate: '2025-02-10',
          paymentMethod: 'MERCADO_PAGO',
          source: 'CUSTOMER',
          customerName: 'Walk-in customers',
          status: 'RECEIVED',
          linkedPaymentId: 'mp_001',
          createdBy: 'system',
          createdAt: '2025-02-10T08:00:00Z',
          tags: ['coffee', 'morning', 'pos']
        },
        {
          id: '2',
          description: 'Catering service - Corporate event',
          amount: 250000,
          category: 'SERVICES',
          subcategory: 'Catering',
          revenueDate: '2025-02-09',
          paymentMethod: 'BANK_TRANSFER',
          source: 'CUSTOMER',
          customerId: 'cust_001',
          customerName: 'TechCorp S.A.',
          invoiceNumber: 'INV-2025-001',
          status: 'RECEIVED',
          linkedTransactionId: 'txn_001',
          createdBy: 'user_001',
          createdAt: '2025-02-09T14:30:00Z',
          tags: ['catering', 'corporate', 'event']
        }
      ];

      let filteredRevenue = mockRevenue;
      if (status) {
        filteredRevenue = mockRevenue.filter(rev => rev.status === status.toUpperCase());
      }

      return {
        success: true,
        revenue: filteredRevenue,
        totalCount: filteredRevenue.length,
        totalAmount: filteredRevenue.reduce((sum, rev) => sum + rev.amount, 0)
      };
    } catch (error) {
      console.error('Error fetching revenue:', error);
      return { success: false, error: 'Error al obtener ingresos' };
    }
  }

  @Post('revenue')
  @Roles('admin', 'finance_manager', 'manager')
  async createRevenue(@Request() req: any, @Body() revenueData: any) {
    try {
      const userId = req.user.sub;
      
      const newRevenue: RevenueEntry = {
        id: Date.now().toString(),
        description: revenueData.description,
        amount: parseFloat(revenueData.amount),
        category: revenueData.category,
        subcategory: revenueData.subcategory,
        revenueDate: revenueData.revenueDate,
        paymentMethod: revenueData.paymentMethod,
        source: revenueData.source,
        customerId: revenueData.customerId,
        customerName: revenueData.customerName,
        invoiceNumber: revenueData.invoiceNumber,
        status: revenueData.status || 'PENDING',
        notes: revenueData.notes,
        linkedTransactionId: revenueData.linkedTransactionId,
        linkedPaymentId: revenueData.linkedPaymentId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        tags: revenueData.tags || []
      };

      return {
        success: true,
        revenue: newRevenue,
        message: 'Ingreso registrado exitosamente'
      };
    } catch (error) {
      console.error('Error creating revenue:', error);
      return { success: false, error: 'Error al crear ingreso' };
    }
  }

  @Get('expenses')
  @Roles('admin', 'finance_manager', 'manager')
  async getExpenses(@Query('status') status?: string, @Query('category') category?: string) {
    try {
      const mockExpenses: ExpenseEntry[] = [
        {
          id: '1',
          description: 'Monthly rent - Main location',
          amount: 800000,
          category: 'RENT',
          expenseDate: '2025-02-01',
          paymentMethod: 'BANK_TRANSFER',
          vendor: 'Inmobiliaria Central',
          invoiceNumber: 'RENT-FEB-2025',
          status: 'PAID',
          linkedTransactionId: 'txn_002',
          createdBy: 'user_001',
          createdAt: '2025-02-01T09:00:00Z',
          tags: ['rent', 'fixed', 'monthly'],
          isRecurring: true,
          recurringFrequency: 'MONTHLY'
        },
        {
          id: '2',
          description: 'Employee lunch reimbursement',
          amount: 25000,
          category: 'STAFF',
          subcategory: 'Employee Expenses',
          expenseDate: '2025-02-09',
          paymentMethod: 'EMPLOYEE_REIMBURSEMENT',
          status: 'PAID',
          linkedEmployeeExpenseId: 'emp_exp_001',
          notes: 'Business meeting lunch',
          approvedBy: 'user_001',
          approvedAt: '2025-02-09T16:00:00Z',
          createdBy: 'user_001',
          createdAt: '2025-02-09T16:00:00Z',
          tags: ['staff', 'reimbursement', 'business']
        }
      ];

      let filteredExpenses = mockExpenses;
      if (status) {
        filteredExpenses = mockExpenses.filter(exp => exp.status === status.toUpperCase());
      }

      return {
        success: true,
        expenses: filteredExpenses,
        totalCount: filteredExpenses.length,
        totalAmount: filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      };
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return { success: false, error: 'Error al obtener gastos' };
    }
  }

  @Post('expenses')
  @Roles('admin', 'finance_manager', 'manager')
  async createExpense(@Request() req: any, @Body() expenseData: any) {
    try {
      const userId = req.user.sub;
      
      const newExpense: ExpenseEntry = {
        id: Date.now().toString(),
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        category: expenseData.category,
        subcategory: expenseData.subcategory,
        expenseDate: expenseData.expenseDate,
        paymentMethod: expenseData.paymentMethod,
        vendor: expenseData.vendor,
        invoiceNumber: expenseData.invoiceNumber,
        status: expenseData.status || 'PENDING',
        dueDate: expenseData.dueDate,
        notes: expenseData.notes,
        linkedTransactionId: expenseData.linkedTransactionId,
        linkedEmployeeExpenseId: expenseData.linkedEmployeeExpenseId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        tags: expenseData.tags || [],
        isRecurring: expenseData.isRecurring || false,
        recurringFrequency: expenseData.recurringFrequency
      };

      return {
        success: true,
        expense: newExpense,
        message: 'Gasto registrado exitosamente'
      };
    } catch (error) {
      console.error('Error creating expense:', error);
      return { success: false, error: 'Error al crear gasto' };
    }
  }

  @Get('summary')
  @Roles('admin', 'finance_manager', 'manager')
  async getFinancialSummary(@Query('period') period = 'month') {
    try {
      const summary: FinancialSummary = {
        period: period === 'month' ? 'February 2025' : 'Custom Period',
        totalRevenue: 335000,
        totalExpenses: 825000,
        netProfit: -490000,
        profitMargin: -146.27,
        revenueByCategory: {
          'SALES': 85000,
          'SERVICES': 250000
        },
        expensesByCategory: {
          'RENT': 800000,
          'STAFF': 25000
        },
        cashFlow: -490000,
        bankBalance: 2500000,
        pendingRevenue: 0,
        pendingExpenses: 0,
        employeeExpensesPending: 40000,
        merchantPaymentsTotal: 85000
      };

      return {
        success: true,
        summary
      };
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      return { success: false, error: 'Error al obtener resumen financiero' };
    }
  }

  @Get('categories')
  async getCategories() {
    return {
      success: true,
      categories: {
        revenue: [
          { value: 'SALES', label: 'Sales', subcategories: ['Food & Beverage', 'Retail', 'Digital'] },
          { value: 'SERVICES', label: 'Services', subcategories: ['Catering', 'Consulting', 'Events'] },
          { value: 'COMMISSIONS', label: 'Commissions', subcategories: ['Partner', 'Affiliate', 'Referral'] },
          { value: 'OTHER_INCOME', label: 'Other Income', subcategories: ['Investment', 'Refund', 'Miscellaneous'] }
        ],
        expenses: [
          { value: 'OPERATIONAL', label: 'Operational', subcategories: ['Equipment', 'Software', 'Insurance'] },
          { value: 'MARKETING', label: 'Marketing', subcategories: ['Advertising', 'Social Media', 'Events'] },
          { value: 'STAFF', label: 'Staff', subcategories: ['Salaries', 'Benefits', 'Employee Expenses'] },
          { value: 'SUPPLIES', label: 'Supplies', subcategories: ['Inventory', 'Office', 'Cleaning'] },
          { value: 'UTILITIES', label: 'Utilities', subcategories: ['Electricity', 'Water', 'Internet'] },
          { value: 'RENT', label: 'Rent', subcategories: ['Office', 'Equipment', 'Storage'] },
          { value: 'OTHER', label: 'Other', subcategories: ['Miscellaneous', 'One-time', 'Unexpected'] }
        ]
      }
    };
  }
} 