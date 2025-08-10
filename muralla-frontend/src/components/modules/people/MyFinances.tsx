import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { AuthService } from '../../../services/authService';

interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED' | 'CANCELLED';
  notes?: string;
}

const MyFinances: React.FC = () => {
  const [user, setUser] = useState<any | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Expense modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState('Other');
  const [date, setDate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const me = await AuthService.getCurrentUser();
      setUser(me);
      const empId = me?.sub || me?.id; // support both shapes
      const data = await AuthService.apiCall<{ expenses: Expense[] }>(`/api/staff-finance/expenses?employeeId=${encodeURIComponent(empId || '')}&limit=50`);
      setExpenses(data.expenses || []);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalOwedToMe = expenses
    .filter(e => e.status === 'PENDING' || e.status === 'APPROVED')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalReimbursed = expenses
    .filter(e => e.status === 'REIMBURSED')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
  const formatDate = (s: string) => new Date(s).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'APPROVED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'REIMBURSED': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'REJECTED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const openNewExpense = () => {
    setDescription('');
    setAmount('');
    setCategory('Other');
    setDate(new Date().toISOString().slice(0,10));
    setNotes('');
    setShowExpenseModal(true);
  };

  const submit = async () => {
    if (!description || !amount || !date) {
      alert('Please complete description, amount and date');
      return;
    }
    try {
      setSubmitting(true);
      await AuthService.apiCall('/api/staff-finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          amount: Number(amount),
          category,
          expenseDate: new Date(date).toISOString(),
          notes,
        }),
      });
      setShowExpenseModal(false);
      await load();
    } catch (e) {
      console.error(e);
      alert('Failed to create expense');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Finances</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Reimbursements and expenses linked to your work{user?.username ? ` — ${user.username}` : ''}</p>
        </div>
        <button onClick={openNewExpense} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">New Expense</button>
      </div>

      {/* Summary cards - inverted semantics: owed to me is green */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Owed to me</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalOwedToMe)}</p>
              </div>
              <div className="text-3xl">💵</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reimbursed (YTD)</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalReimbursed)}</p>
              </div>
              <div className="text-3xl">📅</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">My pending claims</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{expenses.filter(e => e.status === 'PENDING' || e.status === 'APPROVED').length}</p>
              </div>
              <div className="text-3xl">🧾</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses list */}
      <Card>
        <CardHeader>
          <CardTitle>My Expenses</CardTitle>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{e.description}</td>
                      <td className="py-3 px-4"><span className="text-sm text-gray-600 dark:text-gray-400">{e.category}</span></td>
                      <td className="py-3 px-4 font-medium text-green-600 dark:text-green-400">{formatCurrency(e.amount)}</td>
                      <td className="py-3 px-4"><Badge className={getStatusColor(e.status)}>{e.status}</Badge></td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(e.expenseDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">New Expense</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Description</label>
                <input className="input mt-1" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Amount (CLP)</label>
                <input type="number" className="input mt-1" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Category</label>
                <select className="input mt-1" value={category} onChange={e => setCategory(e.target.value)}>
                  {['Travel','Meals','Office Supplies','Software','Training','Equipment','Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Date</label>
                <input type="date" className="input mt-1" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-neutral-600 dark:text-neutral-300">Notes</label>
                <textarea className="input mt-1" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200" onClick={() => setShowExpenseModal(false)}>Cancel</button>
              <button disabled={submitting} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50" onClick={submit}>{submitting ? 'Saving…' : 'Save expense'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFinances; 