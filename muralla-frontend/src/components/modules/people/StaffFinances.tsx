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

const StaffFinances: React.FC = () => {
  const [summary, setSummary] = useState<StaffFinanceSummary | null>(null);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [expenses, setExpenses] = useState<EmployeeExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payroll' | 'expenses'>('overview');

  // Modals state
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Payroll form
  const [payPeriodStart, setPayPeriodStart] = useState<string>('');
  const [payPeriodEnd, setPayPeriodEnd] = useState<string>('');
  const [payrollNotes, setPayrollNotes] = useState<string>('');
  const [submittingPayroll, setSubmittingPayroll] = useState(false);

  // Expense form
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseCategory, setExpenseCategory] = useState('Other');
  const [expenseDate, setExpenseDate] = useState<string>('');
  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState<string>('');
  const [expenseNotes, setExpenseNotes] = useState<string>('');
  const [submittingExpense, setSubmittingExpense] = useState(false);

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
      maximumFractionDigits: 0,
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

  // Handlers
  const openRunPayroll = () => {
    setPayPeriodStart(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10));
    setPayPeriodEnd(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0,10));
    setPayrollNotes('');
    setShowPayrollModal(true);
  };

  const submitRunPayroll = async () => {
    try {
      setSubmittingPayroll(true);
      await AuthService.apiCall('/api/payroll/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payPeriodStart: new Date(payPeriodStart).toISOString(),
          payPeriodEnd: new Date(payPeriodEnd).toISOString(),
          notes: payrollNotes,
        }),
      });
      setShowPayrollModal(false);
      await fetchStaffFinanceData();
    } catch (e) {
      console.error('Failed to create payroll run', e);
      alert('Failed to create payroll run');
    } finally {
      setSubmittingPayroll(false);
    }
  };

  const openNewExpense = () => {
    setExpenseDescription('');
    setExpenseAmount('');
    setExpenseCategory('Other');
    setExpenseDate(new Date().toISOString().slice(0,10));
    setExpenseReceiptUrl('');
    setExpenseNotes('');
    setShowExpenseModal(true);
  };

  const submitNewExpense = async () => {
    if (!expenseDescription || !expenseAmount || !expenseDate) {
      alert('Please complete description, amount and date');
      return;
    }
    try {
      setSubmittingExpense(true);
      await AuthService.apiCall('/api/staff-finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expenseDescription,
          amount: Number(expenseAmount),
          category: expenseCategory,
          expenseDate: new Date(expenseDate).toISOString(),
          receiptUrl: expenseReceiptUrl,
          notes: expenseNotes,
        }),
      });
      setShowExpenseModal(false);
      await fetchStaffFinanceData();
    } catch (e) {
      console.error('Failed to submit expense', e);
      alert('Failed to submit expense');
    } finally {
      setSubmittingExpense(false);
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
          <button onClick={openRunPayroll} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Run Payroll
          </button>
          <button onClick={openNewExpense} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
              <div className="mt-2">
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Expenses (Company owes)</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.totalPendingExpenseAmount)}</p>
                </div>
                <div className="text-3xl">📋</div>
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
            </CardContent>
          </Card>
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
          {/* Payroll vs Revenue */}
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

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🧾 Recent Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-gray-500 dark:text-gray-400">No expenses found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Employee</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Description</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                            {expense.employeeName}
                          </td>
                          <td className="py-3 px-4">{expense.description}</td>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Gross</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Net</th>
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
                        <td className="py-3 px-4"><span className="text-sm text-gray-600 dark:text-gray-400">{expense.category}</span></td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Run Payroll Modal */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">Run Payroll</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Pay period start</label>
                <input type="date" className="input mt-1" value={payPeriodStart} onChange={e => setPayPeriodStart(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Pay period end</label>
                <input type="date" className="input mt-1" value={payPeriodEnd} onChange={e => setPayPeriodEnd(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Notes</label>
                <textarea className="input mt-1" value={payrollNotes} onChange={e => setPayrollNotes(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200" onClick={() => setShowPayrollModal(false)}>Cancel</button>
              <button disabled={submittingPayroll} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50" onClick={submitRunPayroll}>{submittingPayroll ? 'Running…' : 'Run payroll'}</button>
            </div>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">New Expense</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Description</label>
                <input className="input mt-1" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Amount (CLP)</label>
                <input type="number" className="input mt-1" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Category</label>
                <select className="input mt-1" value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)}>
                  {['Travel','Meals','Office Supplies','Software','Training','Equipment','Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Date</label>
                <input type="date" className="input mt-1" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Receipt URL (optional)</label>
                <input className="input mt-1" value={expenseReceiptUrl} onChange={e => setExpenseReceiptUrl(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Notes</label>
                <textarea className="input mt-1" value={expenseNotes} onChange={e => setExpenseNotes(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200" onClick={() => setShowExpenseModal(false)}>Cancel</button>
              <button disabled={submittingExpense} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50" onClick={submitNewExpense}>{submittingExpense ? 'Saving…' : 'Save expense'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffFinances;
