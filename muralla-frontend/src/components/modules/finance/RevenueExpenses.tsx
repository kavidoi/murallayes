import React, { useState, useEffect } from 'react';
import { AuthService } from '../../../services/authService';
import PageHeader from '../../ui/PageHeader';
import { Tabs } from '../../ui/Tabs';
import { StatCard } from '../../ui/StatCard';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

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

interface Transaction {
  id: string;
  type: 'REVENUE' | 'EXPENSE';
  description: string;
  amount: number;
  date: string;
  category: string;
  subcategory?: string;
  status: 'PENDING' | 'RECEIVED' | 'PAID' | 'CANCELLED' | 'OVERDUE';
  customerName?: string;
  vendor?: string;
  paymentMethod: string;
  invoiceNumber?: string;
  linkedBankTransactionId?: string;
  linkedBankTransactionDescription?: string;
  notes?: string;
  createdAt: string;
}

interface StaffDebt {
  id: string;
  type: 'DEBT' | 'LOAN'; // DEBT = company owes staff, LOAN = staff owes company
  staffId: string;
  staffName: string;
  staffEmail: string;
  description: string;
  amount: number;
  originalAmount: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'CANCELLED';
  createdDate: string;
  dueDate?: string;
  relatedExpenseId?: string; // Link to expense that created the debt
  paymentHistory: StaffDebtPayment[];
  notes?: string;
  createdBy: string;
  createdAt: string;
}

interface StaffDebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'PAYROLL_DEDUCTION' | 'OTHER';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

const RevenueExpenses: React.FC = () => {
  const { t, i18n } = useTranslation();
  useDocumentTitle('revenueExpenses');
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'expenses' | 'transactions' | 'debts'>('overview');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Categories | null>(null);
  const [staffDebts, setStaffDebts] = useState<StaffDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<StaffDebt | null>(null);
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
    paidByStaffId: '', // For employee reimbursements
    vendor: '',
    invoiceNumber: '',
    status: 'PENDING',
    dueDate: '',
    notes: '',
    tags: [],
    isRecurring: false,
    recurringFrequency: 'MONTHLY'
  });
  const [debtForm, setDebtForm] = useState({
    type: 'DEBT', // DEBT = company owes staff, LOAN = staff owes company
    staffId: '',
    staffName: '',
    description: '',
    amount: '',
    dueDate: '',
    notes: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    notes: ''
  });

  useEffect(() => {
    // Handle URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const action = urlParams.get('action');
    
    if (tab && ['overview', 'revenue', 'expenses', 'transactions'].includes(tab)) {
      setActiveTab(tab as typeof activeTab);
    }
    
    if (action === 'add') {
      if (tab === 'revenue') {
        setShowRevenueForm(true);
      } else if (tab === 'expenses') {
        setShowExpenseForm(true);
      }
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, transactionsRes, categoriesRes] = await Promise.all([
        AuthService.apiCall('/finance/summary'),
        AuthService.apiCall('/finance/transactions?limit=100'),
        AuthService.apiCall('/finance/categories')
      ]);

      // Map finance API response to expected format
      if (summaryRes) {
        const mappedSummary: FinancialSummary = {
          period: 'February 2025',
          totalRevenue: summaryRes.totalRevenue || 0,
          totalExpenses: summaryRes.totalExpenses || 0,
          netProfit: summaryRes.netProfit || 0,
          profitMargin: summaryRes.additionalMetrics?.profitMargin || 0,
          revenueByCategory: summaryRes.revenueByCategory?.reduce((acc: any, item: any) => {
            acc[item.category] = item.amount;
            return acc;
          }, {}) || { 'SALES': 85000, 'SERVICES': 250000 },
          expensesByCategory: summaryRes.expensesByCategory?.reduce((acc: any, item: any) => {
            acc[item.category] = item.amount;
            return acc;
          }, {}) || { 'RENT': 800000, 'STAFF': 25000 },
          cashFlow: summaryRes.netProfit || 0,
          bankBalance: summaryRes.bankBalance || 0,
          pendingRevenue: summaryRes.additionalMetrics?.pendingRevenue || 0,
          pendingExpenses: summaryRes.additionalMetrics?.pendingExpenses || 0,
          employeeExpensesPending: 0,
          merchantPaymentsTotal: summaryRes.additionalMetrics?.mercadoPago || 0
        };
        setSummary(mappedSummary);
      }

      // Map transactions to revenue and expenses
      if (transactionsRes?.transactions) {
        const revenueEntries: RevenueEntry[] = transactionsRes.transactions
          .filter((t: any) => t.type === 'INCOME')
          .map((t: any) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            category: 'SALES' as const,
            revenueDate: t.createdAt,
            paymentMethod: 'CASH' as const,
            source: 'CUSTOMER' as const,
            customerName: t.creator?.name || '',
            status: t.status === 'COMPLETED' ? 'RECEIVED' as const : 'PENDING' as const,
            createdBy: t.creator?.id || '',
            createdAt: t.createdAt
          }));
        
        const expenseEntries: ExpenseEntry[] = transactionsRes.transactions
          .filter((t: any) => t.type === 'EXPENSE')
          .map((t: any) => ({
            id: t.id,
            description: t.description,
            amount: Math.abs(t.amount),
            category: 'OPERATIONAL' as const,
            expenseDate: t.createdAt,
            paymentMethod: 'CASH' as const,
            status: t.status === 'COMPLETED' ? 'PAID' as const : 'PENDING' as const,
            createdBy: t.creator?.id || '',
            createdAt: t.createdAt
          }));
        
        const allTransactions: Transaction[] = transactionsRes.transactions.map((t: any) => ({
          id: t.id,
          type: t.type === 'INCOME' ? 'REVENUE' as const : 'EXPENSE' as const,
          description: t.description,
          amount: Math.abs(t.amount),
          date: t.createdAt,
          category: t.category?.name || 'Other',
          status: t.status === 'COMPLETED' ? (t.type === 'INCOME' ? 'RECEIVED' as const : 'PAID' as const) : 'PENDING' as const,
          customerName: t.type === 'INCOME' ? t.creator?.name : undefined,
          vendor: t.type === 'EXPENSE' ? 'Vendor' : undefined,
          paymentMethod: 'CASH',
          createdAt: t.createdAt
        }));
        
        setRevenue(revenueEntries);
        setExpenses(expenseEntries);
        setTransactions(allTransactions);
      }

      if (categoriesRes) {
        const mappedCategories: Categories = {
          revenue: [
            { value: 'SALES', label: 'Ventas', subcategories: [] },
            { value: 'SERVICES', label: 'Servicios', subcategories: [] }
          ],
          expenses: [
            { value: 'RENT', label: 'Alquiler', subcategories: [] },
            { value: 'STAFF', label: 'Personal', subcategories: [] }
          ]
        };
        setCategories(mappedCategories);
      }
    } catch (err) {
      console.error('Error fetching revenue & expenses data:', err);
      setError(t('common.errorLoadingData') || 'Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await AuthService.apiCall('/api/ingresos-egresos/ingresos', {
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
      const response = await AuthService.apiCall('/api/ingresos-egresos/egresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      });

      if (response.success) {
        // If this is an employee reimbursement, create a staff debt automatically
        if (expenseForm.paymentMethod === 'EMPLOYEE_REIMBURSEMENT' && expenseForm.paidByStaffId) {
          const staffDebt: StaffDebt = {
            id: Date.now().toString() + '_debt',
            type: 'DEBT',
            staffId: expenseForm.paidByStaffId,
            staffName: expenseForm.paidByStaffId === 'darwin' ? 'Darwin Bruna' : 'Kaví Doi',
            staffEmail: expenseForm.paidByStaffId === 'darwin' ? 'darwin@murallacafe.cl' : 'kavi@murallacafe.cl',
            description: `Reembolso por: ${expenseForm.description}`,
            amount: parseFloat(expenseForm.amount),
            originalAmount: parseFloat(expenseForm.amount),
            status: 'PENDING',
            relatedExpenseId: response.data?.id || Date.now().toString(),
            paymentHistory: []
          };
          
          setStaffDebts(prev => [...prev, staffDebt]);
        }

        setShowExpenseForm(false);
        setExpenseForm({
          description: '',
          amount: '',
          category: '',
          subcategory: '',
          expenseDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'CASH',
          paidByStaffId: '',
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

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newDebt: StaffDebt = {
        id: Date.now().toString(),
        type: debtForm.type,
        staffId: debtForm.staffId,
        staffName: debtForm.staffId === 'darwin' ? 'Darwin Bruna' : 'Kaví Doi',
        staffEmail: debtForm.staffId === 'darwin' ? 'darwin@murallacafe.cl' : 'kavi@murallacafe.cl',
        description: debtForm.description,
        amount: parseFloat(debtForm.amount),
        originalAmount: parseFloat(debtForm.amount),
        status: 'PENDING',
        paymentHistory: []
      };

      setStaffDebts(prev => [...prev, newDebt]);
      setShowDebtForm(false);
      setDebtForm({
        type: 'DEBT',
        staffId: '',
        description: '',
        amount: ''
      });
    } catch (err) {
      console.error('Error creating staff debt:', err);
      setError('Error al crear deuda/préstamo de personal');
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const paymentAmount = parseFloat(paymentForm.amount);
      const debtId = selectedDebt?.id || paymentForm.debtId;
      
      if (!debtId) {
        setError('Debe seleccionar una deuda/préstamo');
        return;
      }

      const payment: StaffDebtPayment = {
        id: Date.now().toString(),
        amount: paymentAmount,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes,
        paymentDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      setStaffDebts(prev => prev.map(debt => {
        if (debt.id === debtId) {
          const newAmount = debt.amount - paymentAmount;
          const newStatus = newAmount <= 0 ? 'FULLY_PAID' : debt.amount === debt.originalAmount ? 'PARTIALLY_PAID' : debt.status;
          
          return {
            ...debt,
            amount: Math.max(0, newAmount),
            status: newStatus,
            paymentHistory: [...debt.paymentHistory, payment]
          };
        }
        return debt;
      }));

      setShowPaymentForm(false);
      setSelectedDebt(null);
      setPaymentForm({
        debtId: '',
        amount: '',
        paymentMethod: 'CASH',
        notes: ''
      });
    } catch (err) {
      console.error('Error recording payment:', err);
      setError('Error al registrar pago');
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
      'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'RECEIVED': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'PAID': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'FULLY_PAID': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'PARTIALLY_PAID': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'OVERDUE': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 skeleton rounded w-64 mb-2"></div>
              <div className="h-4 skeleton rounded w-80"></div>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <div className="h-8 skeleton rounded w-24 mb-1"></div>
                <div className="h-4 skeleton rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Skeleton */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <div className="h-10 skeleton rounded w-24"></div>
          <div className="h-10 skeleton rounded w-20"></div>
          <div className="h-10 skeleton rounded w-22"></div>
          <div className="h-10 skeleton rounded w-28"></div>
          <div className="h-10 skeleton rounded w-32"></div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-4 skeleton rounded w-32 mb-3"></div>
              <div className="h-8 skeleton rounded w-24 mb-2"></div>
              <div className="h-3 skeleton rounded w-20"></div>
            </div>
          ))}
        </div>

        {/* Category Breakdown Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-6 skeleton rounded w-48 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex justify-between items-center">
                    <div className="h-4 skeleton rounded w-24"></div>
                    <div className="h-4 skeleton rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Metrics Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="h-6 skeleton rounded w-40 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 skeleton rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 skeleton rounded w-24 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{t('errorLoadingData') || 'Error al cargar datos'}</h3>
          <p className="text-red-600 dark:text-red-400 mb-6 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={fetchData}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <span className="mr-2">🔄</span>
              {t('retry') || 'Reintentar'}
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('errorHelpText') || 'Si el problema persiste, contacte al administrador del sistema.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <span className="mr-3">📊</span>
              {t('nav.revenueExpenses') || 'Ingresos y Egresos'}
            </h1>
            <p className="text-blue-100">
              {t('nav.comprehensiveTracking') || 'Seguimiento integral de finanzas empresariales'}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-2xl font-bold">
                {summary ? formatCurrency(summary.netProfit) : '---'}
              </div>
              <div className="text-sm text-blue-200">
                {t('netProfit') || 'Ganancia Neta'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        items={[
          { id: 'overview', label: t('nav.overview') || 'Resumen', icon: '📊' },
          { id: 'revenue', label: t('nav.revenue') || 'Ingresos', icon: '💰' },
          { id: 'expenses', label: t('nav.expenses') || 'Egresos', icon: '💸' },
          { id: 'transactions', label: t('nav.transactions') || 'Transacciones', icon: '📋' },
          { id: 'debts', label: t('nav.debtsAndLoans') || 'Deudas y Préstamos', icon: '🤝' },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
      />

        {/* Overview Tab */}
        {activeTab === 'overview' && summary && (
          <div className="space-y-6">
            {/* Financial Summary Cards (Bank Account style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title={t('nav.totalRevenue') || 'Ingresos Totales'} value={formatCurrency(summary.totalRevenue)} subtitle={summary.period} color="green" />
              <StatCard title={t('nav.totalExpenses') || 'Gastos Totales'} value={formatCurrency(summary.totalExpenses)} subtitle={summary.period} color="red" />
              <StatCard title={t('nav.netProfit') || 'Ganancia Neta'} value={formatCurrency(summary.netProfit)} subtitle={summary.period} color={summary.netProfit >= 0 ? 'green' : 'red'} />
              <StatCard title={t('nav.bankBalance') || 'Saldo Bancario'} value={formatCurrency(summary.bankBalance)} subtitle={t('nav.current') || 'Actual'} color="purple" />
            </div>

            {/* Category Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Category */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('nav.revenueByCategory') || 'Ingresos por Categoría'}</h3>
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('nav.expensesByCategory') || 'Gastos por Categoría'}</h3>
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('nav.additionalMetrics') || 'Métricas Adicionales'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.profitMargin.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('nav.profitMargin') || 'Margen de Ganancia'}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(summary.pendingRevenue)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('nav.pendingRevenue') || 'Ingresos Pendientes'}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(summary.pendingExpenses)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('nav.pendingExpenses') || 'Gastos Pendientes'}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(summary.merchantPaymentsTotal)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('nav.mercadoPago') || 'Mercado Pago'}</p>
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('nav.revenueEntries') || 'Entradas de Ingresos'}</h2>
              <button
                onClick={() => setShowRevenueForm(true)}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">+</span>
                {t('nav.addRevenue') || 'Agregar Ingreso'}
              </button>
            </div>

            {/* Revenue List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {revenue.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('noRevenue') || 'No hay ingresos registrados'}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">{t('addFirstRevenue') || 'Agregue su primer ingreso para comenzar a rastrear sus finanzas'}</p>
                  <button
                    onClick={() => setShowRevenueForm(true)}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
                  >
                    <span className="mr-2">+</span>
                    {t('addRevenue') || 'Agregar Ingreso'}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.description') || 'Descripción'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.amount') || 'Monto'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.category') || 'Categoría'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.date') || 'Fecha'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.status') || 'Estado'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.customer') || 'Cliente'}</th>
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
              )}
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {/* Expenses Header with Add Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('nav.expenseEntries') || 'Entradas de Egresos'}</h2>
              <button
                onClick={() => setShowExpenseForm(true)}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">+</span>
                {t('nav.addExpense') || 'Agregar Egreso'}
              </button>
            </div>

            {/* Expenses List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💸</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('nav.noExpenses') || 'No hay gastos registrados'}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">{t('nav.addFirstExpense') || 'Agregue su primer gasto para comenzar a rastrear sus egresos'}</p>
                  <button
                    onClick={() => setShowExpenseForm(true)}
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
                  >
                    <span className="mr-2">+</span>
                    {t('nav.addExpense') || 'Agregar Gasto'}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.description') || 'Descripción'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.amount') || 'Monto'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.category') || 'Categoría'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.date') || 'Fecha'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.status') || 'Estado'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.vendor') || 'Proveedor'}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {expenses.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.description}</div>
                          {entry.invoiceNumber && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('nav.invoice') || 'Factura'}: {entry.invoiceNumber}</div>
                          )}
                          {entry.isRecurring && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                              {t('nav.recurring') || 'Recurrente'} ({entry.recurringFrequency})
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
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Transactions Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('nav.allTransactions') || 'Todas las Transacciones'}</h2>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option value="all">{t('nav.allTypes') || 'Todos los Tipos'}</option>
                  <option value="REVENUE">{t('nav.revenue') || 'Ingresos'}</option>
                  <option value="EXPENSE">{t('nav.expenses') || 'Egresos'}</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option value="all">{t('nav.allStatuses') || 'Todos los Estados'}</option>
                  <option value="PENDING">{t('nav.pending') || 'Pendiente'}</option>
                  <option value="RECEIVED">{t('nav.received') || 'Recibido'}</option>
                  <option value="PAID">{t('nav.paid') || 'Pagado'}</option>
                </select>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.type') || 'Tipo'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.description') || 'Descripción'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.amount') || 'Monto'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.category') || 'Categoría'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.date') || 'Fecha'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.status') || 'Estado'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.bankLink') || 'Vínculo Bancario'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.actions') || 'Acciones'}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'REVENUE' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {transaction.type === 'REVENUE' ? '↗️' : '↙️'} {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</div>
                          {transaction.invoiceNumber && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">Invoice: {transaction.invoiceNumber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            transaction.type === 'REVENUE' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{transaction.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{transaction.category}</div>
                          {transaction.subcategory && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{transaction.subcategory}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.linkedBankTransactionId ? (
                            <div className="flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              <div>
                                <div className="text-sm text-green-600 dark:text-green-400 font-medium">{t('nav.linked') || 'Vinculado'}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {transaction.linkedBankTransactionDescription || t('nav.bankTransaction') || 'Transacción bancaria'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{t('nav.notLinked') || 'No vinculado'}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            {!transaction.linkedBankTransactionId && (
                              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                                {t('nav.linkToBank') || 'Vincular al Banco'}
                              </button>
                            )}
                            <button className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                              {t('nav.edit') || 'Editar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Empty State */}
              {transactions.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">📋</div>
                  <p className="text-gray-500 dark:text-gray-400">{t('nav.noTransactions') || 'No se encontraron transacciones'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debts and Loans Tab */}
        {activeTab === 'debts' && (
          <div className="space-y-6">
            {/* Debts Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('nav.staffDebtsAndLoans') || 'Deudas y Préstamos de Personal'}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowDebtForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center text-sm"
                >
                  <span className="mr-2">💰</span>
                  {t('nav.addLoan') || 'Agregar Préstamo'}
                </button>
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center text-sm"
                >
                  <span className="mr-2">💳</span>
                  {t('nav.recordPayment') || 'Registrar Pago'}
                </button>
              </div>
            </div>

            {/* Staff Debts Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatCurrency(staffDebts.filter(d => d.type === 'DEBT' && d.status !== 'FULLY_PAID').reduce((sum, d) => sum + d.amount, 0))}</p>
                  <p className="text-sm opacity-90">{t('nav.companyOwesToStaff') || 'Empresa debe al personal'}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatCurrency(staffDebts.filter(d => d.type === 'LOAN' && d.status !== 'FULLY_PAID').reduce((sum, d) => sum + d.amount, 0))}</p>
                  <p className="text-sm opacity-90">{t('nav.staffOwesToCompany') || 'Personal debe a la empresa'}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="text-center">
                  <p className="text-2xl font-bold">{staffDebts.filter(d => d.status === 'FULLY_PAID').length}</p>
                  <p className="text-sm opacity-90">{t('nav.resolvedDebts') || 'Deudas resueltas'}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
                <div className="text-center">
                  <p className="text-2xl font-bold">{staffDebts.filter(d => d.status === 'PENDING').length}</p>
                  <p className="text-sm opacity-90">{t('nav.pendingDebts') || 'Deudas pendientes'}</p>
                </div>
              </div>
            </div>

            {/* Staff Debts List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {staffDebts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤝</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('noDebts') || 'No hay deudas o préstamos registrados'}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">{t('manageStaffFinances') || 'Gestione las deudas y préstamos del personal aquí'}</p>
                  <div className="space-x-3">
                    <button
                      onClick={() => setShowDebtForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
                    >
                      <span className="mr-2">💰</span>
                      {t('addLoan') || 'Agregar Préstamo'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.type') || 'Tipo'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.staff') || 'Personal'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.description') || 'Descripción'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.originalAmount') || 'Monto Original'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.remainingAmount') || 'Saldo'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.status') || 'Estado'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('nav.actions') || 'Acciones'}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {staffDebts.map((debt) => (
                        <tr key={debt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              debt.type === 'DEBT' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                              {debt.type === 'DEBT' ? '🏢→👤' : '👤→🏢'} {debt.type === 'DEBT' ? 'Deuda' : 'Préstamo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{debt.staffName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{debt.staffEmail}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">{debt.description}</div>
                            {debt.relatedExpenseId && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">Relacionado a gasto #{debt.relatedExpenseId}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(debt.originalAmount)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${debt.amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {formatCurrency(debt.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(debt.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              {debt.status !== 'FULLY_PAID' && debt.status !== 'CANCELLED' && (
                                <button 
                                  onClick={() => {
                                    setSelectedDebt(debt);
                                    setShowPaymentForm(true);
                                  }}
                                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium text-sm"
                                >
                                  {t('nav.recordPayment') || 'Registrar Pago'}
                                </button>
                              )}
                              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm">
                                {t('nav.viewHistory') || 'Ver Historial'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Staff Debt/Loan Form Modal */}
        {showDebtForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('nav.addStaffDebtLoan') || 'Agregar Deuda/Préstamo de Personal'}</h3>
                <form onSubmit={handleCreateDebt} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.type') || 'Tipo'}</label>
                    <select
                      required
                      value={debtForm.type}
                      onChange={(e) => setDebtForm({...debtForm, type: e.target.value as 'DEBT' | 'LOAN'})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="DEBT">{t('nav.debtToStaff') || 'Deuda a Personal (Empresa debe)'}</option>
                      <option value="LOAN">{t('nav.loanToStaff') || 'Préstamo a Personal (Personal debe)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.staffMember') || 'Miembro del Personal'}</label>
                    <select
                      required
                      value={debtForm.staffId}
                      onChange={(e) => setDebtForm({...debtForm, staffId: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('nav.selectStaff') || 'Seleccionar Personal'}</option>
                      <option value="darwin">Darwin Bruna</option>
                      <option value="kavi">Kaví Doi</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.description') || 'Descripción'}</label>
                    <textarea
                      required
                      value={debtForm.description}
                      onChange={(e) => setDebtForm({...debtForm, description: e.target.value})}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('nav.enterDescription') || 'Ingrese descripción detallada'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.amount') || 'Monto'} (CLP)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={debtForm.amount}
                      onChange={(e) => setDebtForm({...debtForm, amount: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowDebtForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      {t('actions.cancel') || 'Cancelar'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      {t('nav.create') || 'Crear'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('nav.recordPayment') || 'Registrar Pago'}</h3>
                <form onSubmit={handleCreatePayment} className="space-y-4">
                  {!selectedDebt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.selectDebt') || 'Seleccionar Deuda/Préstamo'}</label>
                      <select
                        required
                        value={paymentForm.debtId}
                        onChange={(e) => setPaymentForm({...paymentForm, debtId: e.target.value})}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{t('nav.selectDebtOption') || 'Seleccionar deuda/préstamo'}</option>
                        {staffDebts.filter(d => d.status !== 'FULLY_PAID' && d.status !== 'CANCELLED').map(debt => (
                          <option key={debt.id} value={debt.id}>
                            {debt.staffName} - {debt.type === 'DEBT' ? 'Deuda' : 'Préstamo'} - {formatCurrency(debt.amount)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.paymentAmount') || 'Monto del Pago'} (CLP)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.paymentMethod') || 'Método de Pago'}</label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="CASH">{t('nav.cash') || 'Efectivo'}</option>
                      <option value="BANK_TRANSFER">{t('nav.bankTransfer') || 'Transferencia Bancaria'}</option>
                      <option value="SALARY_DEDUCTION">{t('nav.salaryDeduction') || 'Descuento de Sueldo'}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.notes') || 'Notas'}</label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                      rows={2}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('nav.optionalNotes') || 'Notas adicionales (opcional)'}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaymentForm(false);
                        setSelectedDebt(null);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      {t('actions.cancel') || 'Cancelar'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                    >
                      {t('nav.recordPayment') || 'Registrar Pago'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Form Modal */}
        {showRevenueForm && categories && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('nav.addRevenueEntry') || 'Agregar Entrada de Ingreso'}</h3>
                <form onSubmit={handleCreateRevenue} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.description') || 'Descripción'}</label>
                    <input
                      type="text"
                      required
                      value={revenueForm.description}
                      onChange={(e) => setRevenueForm({...revenueForm, description: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('nav.enterRevenueDescription') || 'Ingrese descripción del ingreso'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.amount') || 'Monto'} (CLP)</label>
                    <input
                      type="number"
                      required
                      value={revenueForm.amount}
                      onChange={(e) => setRevenueForm({...revenueForm, amount: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.category') || 'Categoría'}</label>
                    <select
                      required
                      value={revenueForm.category}
                      onChange={(e) => setRevenueForm({...revenueForm, category: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('nav.selectCategory') || 'Seleccionar Categoría'}</option>
                      {categories.revenue.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.paymentMethod') || 'Método de Pago'}</label>
                    <select
                      value={revenueForm.paymentMethod}
                      onChange={(e) => setRevenueForm({...revenueForm, paymentMethod: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="CASH">{t('nav.cash') || 'Efectivo'}</option>
                      <option value="BANK_TRANSFER">{t('nav.bankTransfer') || 'Transferencia Bancaria'}</option>
                      <option value="MERCADO_PAGO">{t('nav.mercadoPago') || 'Mercado Pago'}</option>
                      <option value="CARD">{t('nav.card') || 'Tarjeta'}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.customerName') || 'Nombre del Cliente'}</label>
                    <input
                      type="text"
                      value={revenueForm.customerName}
                      onChange={(e) => setRevenueForm({...revenueForm, customerName: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('nav.enterCustomerNameOptional') || 'Ingrese nombre del cliente (opcional)'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.invoiceNumber') || 'Número de Factura'}</label>
                    <input
                      type="text"
                      value={revenueForm.invoiceNumber}
                      onChange={(e) => setRevenueForm({...revenueForm, invoiceNumber: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('nav.enterInvoiceNumberOptional') || 'Ingrese número de factura (opcional)'}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowRevenueForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      {t('actions.cancel') || 'Cancelar'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                    >
                      {t('nav.createRevenue') || 'Crear Ingreso'}
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('nav.addExpenseEntry') || 'Agregar Entrada de Egreso'}</h3>
                <form onSubmit={handleCreateExpense} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.description') || 'Descripción'}</label>
                    <input
                      type="text"
                      required
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('nav.enterExpenseDescription') || 'Ingrese descripción del egreso'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.amount') || 'Monto'} (CLP)</label>
                    <input
                      type="number"
                      required
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.category') || 'Categoría'}</label>
                    <select
                      required
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('nav.selectCategory') || 'Seleccionar Categoría'}</option>
                      {categories.expenses.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.paymentMethod') || 'Método de Pago'}</label>
                    <select
                      value={expenseForm.paymentMethod}
                      onChange={(e) => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="CASH">{t('nav.cash') || 'Efectivo'}</option>
                      <option value="BANK_TRANSFER">{t('nav.bankTransfer') || 'Transferencia Bancaria'}</option>
                      <option value="CARD">{t('nav.card') || 'Tarjeta'}</option>
                      <option value="EMPLOYEE_REIMBURSEMENT">{t('nav.employeeReimbursement') || 'Reembolso de Empleado'}</option>
                    </select>
                  </div>
                  
                  {expenseForm.paymentMethod === 'EMPLOYEE_REIMBURSEMENT' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.staffMemberWhoPaid') || 'Miembro del Personal que Pagó'}</label>
                      <select
                        required
                        value={expenseForm.paidByStaffId || ''}
                        onChange={(e) => setExpenseForm({...expenseForm, paidByStaffId: e.target.value})}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{t('nav.selectStaff') || 'Seleccionar Personal'}</option>
                        <option value="darwin">Darwin Bruna</option>
                        <option value="kavi">Kaví Doi</option>
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.vendor') || 'Proveedor'}</label>
                    <input
                      type="text"
                      value={expenseForm.vendor}
                      onChange={(e) => setExpenseForm({...expenseForm, vendor: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('nav.enterVendorNameOptional') || 'Ingrese nombre del proveedor (opcional)'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nav.invoiceNumber') || 'Número de Factura'}</label>
                    <input
                      type="text"
                      value={expenseForm.invoiceNumber}
                      onChange={(e) => setExpenseForm({...expenseForm, invoiceNumber: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('nav.enterInvoiceNumberOptional') || 'Ingrese número de factura (opcional)'}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={expenseForm.isRecurring}
                      onChange={(e) => setExpenseForm({...expenseForm, isRecurring: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900 dark:text-gray-100">{t('nav.recurringExpense') || 'Egreso recurrente'}</label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowExpenseForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      {t('actions.cancel') || 'Cancelar'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                    >
                      {t('nav.createExpense') || 'Crear Egreso'}
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