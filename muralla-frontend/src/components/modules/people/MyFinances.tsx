import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { AuthService } from '../../../services/authService';

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
  expenseType: 'COMPANY_BUSINESS' | 'PERSONAL' | 'MIXED';
  paidBy: 'EMPLOYEE' | 'COMPANY' | 'PENDING';
  settlementMethod?: 'REIMBURSEMENT' | 'PAYROLL_DEDUCTION' | 'DIRECT_PAYMENT';
  settlementStatus: 'PENDING' | 'SETTLED' | 'PARTIALLY_SETTLED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED' | 'CANCELLED';
  submittedAt: string;
  receiptUrl?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  reimbursedAt?: string;
  personalPortion?: number;
  companyPortion?: number;
}

interface ExpenseFormData {
  description: string;
  amount: string;
  category: string;
  expenseDate: string;
  notes: string;
  receipt?: File;
  expenseType: 'COMPANY_BUSINESS' | 'PERSONAL' | 'MIXED';
  paidBy: 'EMPLOYEE' | 'COMPANY' | 'PENDING';
  settlementMethod: 'REIMBURSEMENT' | 'PAYROLL_DEDUCTION' | 'DIRECT_PAYMENT';
  personalPortion?: string;
  companyPortion?: string;
}

// PaymentFormData interface removed - will be implemented later if needed
// interface PaymentFormData {
//   paymentType: 'ADVANCE' | 'REIMBURSEMENT' | 'EXPENSE_SETTLEMENT';
//   amount: string;
//   direction: 'TO_EMPLOYEE' | 'TO_COMPANY';
//   description: string;
//   paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'PAYROLL' | 'PETTY_CASH';
//   notes: string;
// }

const MyFinances: React.FC = () => {
  const [summary, setSummary] = useState<MyFinanceSummary | null>(null);
  const [payrollEntries, setPayrollEntries] = useState<MyPayrollEntry[]>([]);
  const [expenses, setExpenses] = useState<MyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payroll' | 'expenses'>('overview');
  
  // Form states
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MyExpense | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({
    description: '',
    amount: '',
    category: 'Other',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
    expenseType: 'COMPANY_BUSINESS',
    paidBy: 'EMPLOYEE',
    settlementMethod: 'REIMBURSEMENT',
  });
  
  // Payment form state removed - will be implemented later if needed
  // const [showPaymentForm, setShowPaymentForm] = useState(false);
  // const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
  //   paymentType: 'ADVANCE',
  //   amount: '',
  //   direction: 'TO_EMPLOYEE',
  //   description: '',
  //   paymentMethod: 'BANK_TRANSFER',
  //   notes: '',
  // });

  const categories = ['Travel', 'Meals', 'Office Supplies', 'Software', 'Training', 'Equipment', 'Other'];

  const fetchMyFinanceData = async () => {
    try {
      setLoading(true);

      // Fetch my finance summary
      const summaryData = await AuthService.apiCall<{ summary: MyFinanceSummary }>('/api/my-finance/summary');
      setSummary(summaryData.summary);

      // Fetch my payroll entries
      const payrollData = await AuthService.apiCall<{ payrollEntries: MyPayrollEntry[] }>('/api/my-finance/payroll?limit=10');
      setPayrollEntries(payrollData.payrollEntries || []);

      // Fetch my expenses
      const expensesData = await AuthService.apiCall<{ expenses: MyExpense[] }>('/api/my-finance/expenses?limit=20');
      setExpenses(expensesData.expenses || []);

      setError(null);
    } catch (err) {
      console.error('Error fetching my finance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load my finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyFinanceData();
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
      'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'REIMBURSED': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'REJECTED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'CANCELLED': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
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

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('description', expenseForm.description);
      formData.append('amount', expenseForm.amount);
      formData.append('category', expenseForm.category);
      formData.append('expenseDate', expenseForm.expenseDate);
      formData.append('notes', expenseForm.notes);
      
      if (expenseForm.receipt) {
        formData.append('receipt', expenseForm.receipt);
      }

      if (editingExpense) {
        await AuthService.apiCall(`/api/my-finance/expenses/${editingExpense.id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        await AuthService.apiCall('/api/my-finance/expenses', {
          method: 'POST',
          body: formData,
        });
      }

      // Reset form and refresh data
      setExpenseForm({
        description: '',
        amount: '',
        category: 'Other',
        expenseDate: new Date().toISOString().split('T')[0],
        notes: '',
        expenseType: 'COMPANY_BUSINESS',
        paidBy: 'EMPLOYEE',
        settlementMethod: 'REIMBURSEMENT',
      });
      setShowExpenseForm(false);
      setEditingExpense(null);
      fetchMyFinanceData();
    } catch (err) {
      console.error('Error saving expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    }
  };

  const handleEditExpense = (expense: MyExpense) => {
    setEditingExpense(expense);
    setExpenseForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      expenseDate: expense.expenseDate.split('T')[0],
      notes: expense.notes || '',
      expenseType: expense.expenseType || 'COMPANY_BUSINESS',
      paidBy: expense.paidBy || 'EMPLOYEE',
      settlementMethod: expense.settlementMethod || 'REIMBURSEMENT',
      personalPortion: expense.personalPortion?.toString() || '',
      companyPortion: expense.companyPortion?.toString() || '',
    });
    setShowExpenseForm(true);
  };

  const handleCancelExpense = async (expenseId: string) => {
    try {
      await AuthService.apiCall(`/api/my-finance/expenses/${expenseId}/cancel`, {
        method: 'POST',
      });
      fetchMyFinanceData();
    } catch (err) {
      console.error('Error cancelling expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel expense');
    }
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
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error loading my finances</h3>
              <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchMyFinanceData}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Finances</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Personal view of earnings, commissions, and expenses
          </p>
        </div>
        <div className="flex space-x-2">
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Base Salary</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.monthlyBaseSalary)}</p>
                </div>
                <div className="text-3xl">💼</div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Monthly base compensation
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(summary.totalEarningsThisMonth)}
                  </p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Total earnings this month
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Commissions</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.commissionsPending)}</p>
                </div>
                <div className="text-3xl">🎯</div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-green-600 dark:text-green-400">
                  Owed to you
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Reimbursements</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(summary.reimbursementsPending)}
                  </p>
                </div>
                <div className="text-3xl">🧾</div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-green-600 dark:text-green-400">
                  Owed to you for expenses
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'payroll', label: 'My Payments', icon: '💳' },
            { id: 'expenses', label: 'My Expenses', icon: '🧾' }
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

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingExpense ? 'Edit Expense' : 'New Expense'}
            </h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
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
                  {categories.map((cat) => (
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Receipt</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setExpenseForm({ ...expenseForm, receipt: e.target.files?.[0] })}
                  className="input mt-1 w-full"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1"
                >
                  {editingExpense ? 'Update' : 'Submit'} Expense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseForm(false);
                    setEditingExpense(null);
                    setExpenseForm({
                      description: '',
                      amount: '',
                      category: 'Other',
                      expenseDate: new Date().toISOString().split('T')[0],
                      notes: '',
                      expenseType: 'COMPANY_BUSINESS',
                      paidBy: 'EMPLOYEE',
                      settlementMethod: 'REIMBURSEMENT',
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

      {/* Tab Content */}
      {activeTab === 'overview' && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Earnings Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Base Salary</span>
                  <span className="font-medium">{formatCurrency(summary.monthlyBaseSalary)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Commissions (Paid)</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(summary.commissionsPaid)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Commissions (Pending)</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(summary.commissionsPending)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Reimbursements (Pending)</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(summary.reimbursementsPending)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total This Month</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.totalEarningsThisMonth)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📅 Next Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {formatCurrency(summary.nextPaymentAmount)}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Expected on {formatDate(summary.nextPaymentDate)}
                </p>
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    💡 This includes your base salary plus any approved commissions and bonuses
                  </p>
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
              💳 My Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payrollEntries.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💳</div>
                <p className="text-gray-500 dark:text-gray-400">No payment history found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Period</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Gross Pay</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Deductions</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Net Pay</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDate(entry.payPeriodStart)} - {formatDate(entry.payPeriodEnd)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Paid: {formatDate(entry.payDate)}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                          {formatCurrency(entry.grossPay)}
                        </td>
                        <td className="py-3 px-4 font-medium text-red-600 dark:text-red-400">
                          -{formatCurrency(entry.deductions)}
                        </td>
                        <td className="py-3 px-4 font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(entry.netPay)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(entry.status)}>
                            {entry.status}
                          </Badge>
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
              🧾 My Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🧾</div>
                <p className="text-gray-500 dark:text-gray-400">No expenses found</p>
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Submit First Expense
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
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
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
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
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleCancelExpense(expense.id)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {expense.receiptUrl && (
                              <a
                                href={expense.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 text-sm"
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

export default MyFinances; 