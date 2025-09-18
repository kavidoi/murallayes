import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { AuthService } from '../../../services/authService';

// Types for Staff Finance API
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

interface PayrollRun {
  id: string;
  runDate: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSED' | 'CANCELLED';
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  notes?: string;
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

interface PayrollFormData {
  payPeriodStart: string;
  payPeriodEnd: string;
  notes: string;
}

interface ExpenseFormData {
  employeeId: string;
  description: string;
  amount: string;
  category: string;
  expenseDate: string;
  notes: string;
}

const StaffFinances: React.FC = () => {
  const [summary, setSummary] = useState<StaffFinanceSummary | null>(null);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [expenses, setExpenses] = useState<EmployeeExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payroll' | 'expenses'>('overview');
  
  // Form states
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<EmployeeExpense | null>(null);
  const [payrollForm, setPayrollForm] = useState<PayrollFormData>({
    payPeriodStart: '',
    payPeriodEnd: '',
    notes: '',
  });
  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({
    employeeId: '',
    description: '',
    amount: '',
    category: 'Other',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchStaffFinanceData = async () => {
    try {
      setLoading(true);

      // Fetch summary
      const summaryData = await AuthService.apiCall<{ summary: StaffFinanceSummary }>('/api/staff-finance/summary');
      setSummary(summaryData.summary);

      // Fetch recent payroll runs
      const payrollData = await AuthService.apiCall<{ payrollRuns: PayrollRun[] }>('/api/payroll/runs?limit=5');
      setPayrollRuns(payrollData.payrollRuns || []);

      // Fetch recent expenses
      const expensesData = await AuthService.apiCall<{ expenses: EmployeeExpense[] }>('/api/staff-finance/expenses?limit=10');
      setExpenses(expensesData.expenses || []);

      setError(null);
    } catch (err) {
      console.error('Error fetching staff finance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load staff finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffFinanceData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PROCESSED': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'APPROVED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'PENDING_APPROVAL': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'REIMBURSED': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'REJECTED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'DRAFT': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Travel': '🚗',
      'Meals': '🍽️',
      'Office Supplies': '📝',
      'Software': '💻',
      'Training': '📚',
      'Equipment': '🖥️',
      'Other': '📋'
    };
    return icons[category] || '📋';
  };

  const handleRunPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AuthService.apiCall('/api/payroll/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payrollForm),
      });

      // Reset form and refresh data
      setPayrollForm({
        payPeriodStart: '',
        payPeriodEnd: '',
        notes: '',
      });
      setShowPayrollForm(false);
      fetchStaffFinanceData();
    } catch (err) {
      console.error('Error creating payroll run:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payroll run');
    }
  };

  const handleApproveExpense = async (expenseId: string) => {
    try {
      await AuthService.apiCall(`/api/staff-finance/expenses/${expenseId}/approve`, {
        method: 'POST',
      });
      fetchStaffFinanceData();
    } catch (err) {
      console.error('Error approving expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve expense');
    }
  };

  const handleRejectExpense = async (expenseId: string) => {
    try {
      await AuthService.apiCall(`/api/staff-finance/expenses/${expenseId}/reject`, {
        method: 'POST',
      });
      fetchStaffFinanceData();
    } catch (err) {
      console.error('Error rejecting expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject expense');
    }
  };

  const handleReimburseExpense = async (expenseId: string) => {
    try {
      await AuthService.apiCall(`/api/staff-finance/expenses/${expenseId}/reimburse`, {
        method: 'POST',
      });
      fetchStaffFinanceData();
    } catch (err) {
      console.error('Error reimbursing expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to reimburse expense');
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await AuthService.apiCall(`/api/staff-finance/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseForm),
        });
      } else {
        await AuthService.apiCall('/api/staff-finance/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseForm),
        });
      }

      // Reset form and refresh data
      setExpenseForm({
        employeeId: '',
        description: '',
        amount: '',
        category: 'Other',
        expenseDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowExpenseForm(false);
      setEditingExpense(null);
      fetchStaffFinanceData();
    } catch (err) {
      console.error('Error saving expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    }
  };

  const handleEditExpense = (expense: EmployeeExpense) => {
    setEditingExpense(expense);
    setExpenseForm({
      employeeId: expense.employeeId,
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      expenseDate: expense.expenseDate.split('T')[0],
      notes: expense.notes || '',
    });
    setShowExpenseForm(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error loading staff finances</h3>
              <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchStaffFinanceData}
            className="mt-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-800 dark:text-red-400 px-3 py-1 rounded text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Finances</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage payroll, expenses, and staff-related financial operations
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowPayrollForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Run Payroll
          </button>
          <button 
            onClick={() => setShowExpenseForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            New Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalEmployees}</p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Average salary: {formatCurrency(summary.averageSalary)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Payroll</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalMonthlySalaries)}
                  </p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {summary.payrollVsRevenue.payrollPercentage}% of revenue
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Expenses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.pendingExpenses}</p>
                </div>
                <div className="text-3xl">📋</div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-red-600 dark:text-red-400">
                  Owed: {formatCurrency(summary.totalPendingExpenseAmount)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Payroll</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatDate(summary.upcomingPayments.nextPayrollDate)}
                  </p>
                </div>
                <div className="text-3xl">📅</div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-red-600 dark:text-red-400">
                  Amount: {formatCurrency(summary.upcomingPayments.nextPayrollAmount)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payroll Form Modal */}
      {showPayrollForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Run New Payroll
            </h3>
            <form onSubmit={handleRunPayroll} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pay Period Start</label>
                <input
                  type="date"
                  required
                  value={payrollForm.payPeriodStart}
                  onChange={(e) => setPayrollForm({ ...payrollForm, payPeriodStart: e.target.value })}
                  className="input mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pay Period End</label>
                <input
                  type="date"
                  required
                  value={payrollForm.payPeriodEnd}
                  onChange={(e) => setPayrollForm({ ...payrollForm, payPeriodEnd: e.target.value })}
                  className="input mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <textarea
                  value={payrollForm.notes}
                  onChange={(e) => setPayrollForm({ ...payrollForm, notes: e.target.value })}
                  className="input mt-1 w-full"
                  rows={3}
                  placeholder="Optional payroll notes"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1"
                >
                  Create Payroll Run
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPayrollForm(false);
                    setPayrollForm({
                      payPeriodStart: '',
                      payPeriodEnd: '',
                      notes: '',
                    });
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingExpense ? 'Edit Expense' : 'New Employee Expense'}
            </h3>
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
                <input
                  type="text"
                  required
                  value={expenseForm.employeeId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, employeeId: e.target.value })}
                  className="input mt-1 w-full"
                  placeholder="Employee ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="input mt-1 w-full"
                  placeholder="Expense description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="input mt-1 w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="input mt-1 w-full"
                >
                  {['Travel', 'Meals', 'Office Supplies', 'Software', 'Training', 'Equipment', 'Other'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <input
                  type="date"
                  required
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                  className="input mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="input mt-1 w-full"
                  rows={3}
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1"
                >
                  {editingExpense ? 'Update' : 'Create'} Expense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseForm(false);
                    setEditingExpense(null);
                    setExpenseForm({
                      employeeId: '',
                      description: '',
                      amount: '',
                      category: 'Other',
                      expenseDate: new Date().toISOString().split('T')[0],
                      notes: '',
                    });
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'payroll', label: 'Payroll Runs', icon: '💼' },
            { id: 'expenses', label: 'Employee Expenses', icon: '🧾' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payroll vs Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📈 Payroll vs Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</span>
                  <span className="font-medium">{formatCurrency(summary.payrollVsRevenue.revenueAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Payroll</span>
                  <span className="font-medium">{formatCurrency(summary.payrollVsRevenue.payrollAmount)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(summary.payrollVsRevenue.payrollPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {summary.payrollVsRevenue.payrollPercentage}%
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-500">of revenue goes to payroll</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔄 Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-green-600 dark:text-green-400">✅</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Payroll Processed</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">January payroll completed</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">2 days ago</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-yellow-600 dark:text-yellow-400">⏳</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Expenses Pending</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{summary.pendingExpenses} expenses awaiting approval</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">Today</span>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-blue-600 dark:text-blue-400">📈</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Salary Adjustments</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{summary.recentSalaryAdjustments} recent adjustments</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">This month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'payroll' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💼 Recent Payroll Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payrollRuns.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-gray-500 dark:text-gray-400">No payroll runs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Period</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Gross Pay</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Net Pay</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Run Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollRuns.map((run) => (
                      <tr key={run.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDate(run.payPeriodStart)} - {formatDate(run.payPeriodEnd)}
                            </p>
                            {run.notes && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{run.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(run.status)}>
                            {run.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                          {formatCurrency(run.totalGrossPay)}
                        </td>
                        <td className="py-3 px-4 font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(run.totalNetPay)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(run.runDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'expenses' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧾 Employee Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🧾</div>
                <p className="text-gray-500 dark:text-gray-400">No expenses found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                          {expense.employeeName}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{expense.description}</p>
                            {expense.notes && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{expense.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span>{getCategoryIcon(expense.category)}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{expense.category}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-red-600 dark:text-red-400">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(expense.status)}>
                            {expense.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(expense.expenseDate)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {expense.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleEditExpense(expense)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleApproveExpense(expense.id)}
                                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectExpense(expense.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {expense.status === 'APPROVED' && (
                              <button
                                onClick={() => handleReimburseExpense(expense.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Reimburse
                              </button>
                            )}
                            {expense.receiptUrl && (
                              <a
                                href={expense.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-800 text-sm"
                              >
                                Receipt
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StaffFinances;
