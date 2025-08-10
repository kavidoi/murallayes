import React, { useState, useEffect } from 'react';
import { AuthService } from '../../../services/authService';
import PageHeader from '../../ui/PageHeader';
import { Tabs } from '../../ui/Tabs';
import { StatCard } from '../../ui/StatCard';

// Interfaces matching backend
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

interface Categories {
  revenue: Array<{
    value: string;
    label: string;
    subcategories: string[];
  }>;
  expenses: Array<{
    value: string;
    label: string;
    subcategories: string[];
  }>;
}

const RevenueExpenses: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'expenses'>('overview');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [categories, setCategories] = useState<Categories | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [revenueForm, setRevenueForm] = useState({
    description: '',
    amount: '',
    category: '',
    subcategory: '',
    revenueDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    source: 'CUSTOMER',
    customerName: '',
    invoiceNumber: '',
    status: 'PENDING',
    notes: '',
    tags: []
  });
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: '',
    subcategory: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    vendor: '',
    invoiceNumber: '',
    status: 'PENDING',
    dueDate: '',
    notes: '',
    tags: [],
    isRecurring: false,
    recurringFrequency: 'MONTHLY'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, revenueRes, expensesRes, categoriesRes] = await Promise.all([
        AuthService.apiCall('/api/revenue-expense/summary'),
        AuthService.apiCall('/api/revenue-expense/revenue'),
        AuthService.apiCall('/api/revenue-expense/expenses'),
        AuthService.apiCall('/api/revenue-expense/categories')
      ]);

      if (summaryRes.success) setSummary(summaryRes.summary);
      if (revenueRes.success) setRevenue(revenueRes.revenue);
      if (expensesRes.success) setExpenses(expensesRes.expenses);
      if (categoriesRes.success) setCategories(categoriesRes.categories);
    } catch (err) {
      console.error('Error fetching revenue & expenses data:', err);
      setError('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await AuthService.apiCall('/api/revenue-expense/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(revenueForm)
      });

      if (response.success) {
        setShowRevenueForm(false);
        setRevenueForm({
          description: '',
          amount: '',
          category: '',
          subcategory: '',
          revenueDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'CASH',
          source: 'CUSTOMER',
          customerName: '',
          invoiceNumber: '',
          status: 'PENDING',
          notes: '',
          tags: []
        });
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error creating revenue:', err);
      setError('Error al crear ingreso');
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await AuthService.apiCall('/api/revenue-expense/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      });

      if (response.success) {
        setShowExpenseForm(false);
        setExpenseForm({
          description: '',
          amount: '',
          category: '',
          subcategory: '',
          expenseDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'CASH',
          vendor: '',
          invoiceNumber: '',
          status: 'PENDING',
          dueDate: '',
          notes: '',
          tags: [],
          isRecurring: false,
          recurringFrequency: 'MONTHLY'
        });
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error creating expense:', err);
      setError('Error al crear gasto');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'RECEIVED': 'bg-green-100 text-green-800',
      'PAID': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'OVERDUE': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando datos financieros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Revenue & Expenses"
        description="Comprehensive financial tracking and analysis"
      />

      {/* Navigation Tabs */}
      <Tabs
        items={[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'revenue', label: 'Revenue', icon: '💰' },
          { id: 'expenses', label: 'Expenses', icon: '💸' },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
      />

        {/* Overview Tab */}
        {activeTab === 'overview' && summary && (
          <div className="space-y-6">
            {/* Financial Summary Cards (Bank Account style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Revenue" value={formatCurrency(summary.totalRevenue)} subtitle={summary.period} color="green" />
              <StatCard title="Total Expenses" value={formatCurrency(summary.totalExpenses)} subtitle={summary.period} color="red" />
              <StatCard title="Net Profit" value={formatCurrency(summary.netProfit)} subtitle={summary.period} color={summary.netProfit >= 0 ? 'green' : 'red'} />
              <StatCard title="Bank Balance" value={formatCurrency(summary.bankBalance)} subtitle="Current" color="purple" />
            </div>

            {/* Category Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Category */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue by Category</h3>
                <div className="space-y-3">
                  {Object.entries(summary.revenueByCategory).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{category}</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expenses by Category */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Expenses by Category</h3>
                <div className="space-y-3">
                  {Object.entries(summary.expensesByCategory).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{category}</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Additional Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.profitMargin.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Profit Margin</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(summary.pendingRevenue)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(summary.pendingExpenses)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending Expenses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(summary.merchantPaymentsTotal)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Mercado Pago</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            {/* Revenue Header with Add Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Revenue Entries</h2>
              <button
                onClick={() => setShowRevenueForm(true)}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">+</span>
                Add Revenue
              </button>
            </div>

            {/* Revenue List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {revenue.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.description}</div>
                          {entry.invoiceNumber && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">Invoice: {entry.invoiceNumber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(entry.amount)}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{entry.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{entry.category}</div>
                          {entry.subcategory && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{entry.subcategory}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(entry.revenueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(entry.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {entry.customerName || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {/* Expenses Header with Add Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Expense Entries</h2>
              <button
                onClick={() => setShowExpenseForm(true)}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">+</span>
                Add Expense
              </button>
            </div>

            {/* Expenses List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {expenses.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.description}</div>
                          {entry.invoiceNumber && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">Invoice: {entry.invoiceNumber}</div>
                          )}
                          {entry.isRecurring && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                              Recurring ({entry.recurringFrequency})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(entry.amount)}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{entry.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{entry.category}</div>
                          {entry.subcategory && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{entry.subcategory}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(entry.expenseDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(entry.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {entry.vendor || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Form Modal */}
        {showRevenueForm && categories && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Revenue Entry</h3>
                <form onSubmit={handleCreateRevenue} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <input
                      type="text"
                      required
                      value={revenueForm.description}
                      onChange={(e) => setRevenueForm({...revenueForm, description: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount (CLP)</label>
                    <input
                      type="number"
                      required
                      value={revenueForm.amount}
                      onChange={(e) => setRevenueForm({...revenueForm, amount: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      required
                      value={revenueForm.category}
                      onChange={(e) => setRevenueForm({...revenueForm, category: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.revenue.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                    <input
                      type="text"
                      value={revenueForm.customerName}
                      onChange={(e) => setRevenueForm({...revenueForm, customerName: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowRevenueForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                    >
                      Create Revenue
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Expense Form Modal */}
        {showExpenseForm && categories && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Expense Entry</h3>
                <form onSubmit={handleCreateExpense} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      required
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount (CLP)</label>
                    <input
                      type="number"
                      required
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      required
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.expenses.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vendor</label>
                    <input
                      type="text"
                      value={expenseForm.vendor}
                      onChange={(e) => setExpenseForm({...expenseForm, vendor: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={expenseForm.isRecurring}
                      onChange={(e) => setExpenseForm({...expenseForm, isRecurring: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Recurring expense</label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowExpenseForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                    >
                      Create Expense
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default RevenueExpenses;