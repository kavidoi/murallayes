import React, { useState, useEffect } from 'react';
import { StatCard } from '../../ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface PayrollData {
  grossSalary: number;
  netSalary: number;
  taxes: number;
  socialSecurity: number;
  healthInsurance: number;
  retirement401k: number;
  lastPayDate: string;
  nextPayDate: string;
}

interface Commission {
  id: string;
  deal: string;
  amount: number;
  percentage: number;
  status: 'pending' | 'paid';
  paymentDate?: string;
  client: string;
}

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt?: string;
}

interface Investment {
  type: string;
  balance: number;
  contribution: number;
  growth: number;
  growthPercentage: number;
}

const MisFinanzas: React.FC = () => {
  const [payroll, setPayroll] = useState<PayrollData>({
    grossSalary: 4200,
    netSalary: 3150,
    taxes: 840,
    socialSecurity: 160,
    healthInsurance: 50,
    retirement401k: 210,
    lastPayDate: '2024-02-29',
    nextPayDate: '2024-03-15'
  });

  const [commissions, setCommissions] = useState<Commission[]>([
    {
      id: '1',
      deal: 'ABC Corp - Software License',
      amount: 1200,
      percentage: 8,
      status: 'paid',
      paymentDate: '2024-02-29',
      client: 'ABC Corp'
    },
    {
      id: '2',
      deal: 'XYZ Ltd - Consulting Package',
      amount: 800,
      percentage: 5,
      status: 'pending',
      client: 'XYZ Ltd'
    },
    {
      id: '3',
      deal: 'DEF Inc - Annual Contract',
      amount: 450,
      percentage: 3,
      status: 'pending',
      client: 'DEF Inc'
    }
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      date: '2024-03-05',
      description: 'Almuerzo cliente - Reunión de ventas',
      amount: 45.50,
      category: 'Comidas de negocio',
      status: 'approved'
    },
    {
      id: '2',
      date: '2024-03-08',
      description: 'Gasolina viaje oficina central',
      amount: 35.00,
      category: 'Transporte',
      status: 'pending'
    },
    {
      id: '3',
      date: '2024-03-10',
      description: 'Material oficina - Papelería',
      amount: 28.75,
      category: 'Oficina',
      status: 'pending'
    }
  ]);

  const [investments, setInvestments] = useState<Investment[]>([
    {
      type: '401(k)',
      balance: 25400,
      contribution: 210,
      growth: 1240,
      growthPercentage: 5.1
    },
    {
      type: 'Stock Options',
      balance: 8900,
      contribution: 0,
      growth: 450,
      growthPercentage: 5.3
    }
  ]);

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    receipt: null as File | null
  });

  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return 'bg-electric-green/20 text-electric-green dark:bg-electric-green/10 dark:text-electric-green';
      case 'pending':
        return 'bg-electric-yellow/20 text-electric-yellow dark:bg-electric-yellow/10 dark:text-electric-yellow';
      case 'rejected':
        return 'bg-electric-red/20 text-electric-red dark:bg-electric-red/10 dark:text-electric-red';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleSubmitExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      status: 'pending',
      receipt: newExpense.receipt?.name
    };

    setExpenses([expense, ...expenses]);
    setNewExpense({ description: '', amount: '', category: '', receipt: null });
    setShowExpenseForm(false);
  };

  const totalCommissions = commissions.reduce((sum, comm) => sum + comm.amount, 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, comm) => sum + comm.amount, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💰 Mis Finanzas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Controla tu situación financiera en tiempo real
          </p>
        </div>
        <button
          onClick={() => setShowExpenseForm(true)}
          className="btn-electric"
        >
          📄 Nuevo Gasto
        </button>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Salario Neto"
          value={formatCurrency(payroll.netSalary)}
          subtitle={`Último pago: ${formatDate(payroll.lastPayDate)}`}
          color="electric-green"
        />
        <StatCard
          title="Comisiones Totales"
          value={formatCurrency(totalCommissions)}
          subtitle={`${formatCurrency(pendingCommissions)} pendientes`}
          color="electric-blue"
        />
        <StatCard
          title="Gastos Este Mes"
          value={formatCurrency(totalExpenses)}
          subtitle={`${formatCurrency(pendingExpenses)} por aprobar`}
          color="electric-purple"
        />
        <StatCard
          title="Inversiones"
          value={formatCurrency(investments.reduce((sum, inv) => sum + inv.balance, 0))}
          subtitle={`+${investments.reduce((sum, inv) => sum + inv.growth, 0).toFixed(0)} este año`}
          color="electric-cyan"
        />
      </div>

      {/* Payroll Breakdown */}
      <Card className="bg-gradient-to-br from-electric-green/20 to-electric-green/10 dark:from-electric-green/20 dark:to-electric-green/10 border-electric-green/30 dark:border-electric-green/30">
        <CardHeader>
          <CardTitle className="text-electric-green">📊 Desglose de Nómina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Ingresos</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Salario Bruto</span>
                  <span className="font-medium">{formatCurrency(payroll.grossSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Comisiones</span>
                  <span className="font-medium text-electric-green">{formatCurrency(totalCommissions)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Deducciones</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Impuestos</span>
                  <span className="font-medium text-red-600">{formatCurrency(payroll.taxes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Seguridad Social</span>
                  <span className="font-medium text-red-600">{formatCurrency(payroll.socialSecurity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Seguro Médico</span>
                  <span className="font-medium text-red-600">{formatCurrency(payroll.healthInsurance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">401(k)</span>
                  <span className="font-medium text-electric-blue">{formatCurrency(payroll.retirement401k)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Resumen</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Neto a Recibir</span>
                  <span className="font-semibold text-electric-green text-lg">{formatCurrency(payroll.netSalary)}</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Próximo pago: {formatDate(payroll.nextPayDate)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commissions and Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commissions */}
        <Card>
          <CardHeader>
            <CardTitle>💼 Comisiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {commissions.map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{commission.deal}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{commission.client}</div>
                    <div className="text-xs text-gray-500">{commission.percentage}% comisión</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-electric-blue">{formatCurrency(commission.amount)}</div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(commission.status)}`}>
                      {commission.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Gastos Reembolsables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{expense.description}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{expense.category}</div>
                    <div className="text-xs text-gray-500">{formatDate(expense.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(expense.amount)}</div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(expense.status)}`}>
                      {expense.status === 'approved' ? 'Aprobado' : 
                       expense.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investments */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Inversiones y Beneficios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {investments.map((investment, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-electric-cyan/20 to-electric-blue/10 dark:from-electric-cyan/20 dark:to-electric-blue/10 border border-electric-cyan/30 dark:border-electric-blue/30 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{investment.type}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    investment.growthPercentage > 0 
                      ? 'bg-electric-green/20 text-electric-green' 
                      : 'bg-electric-red/20 text-electric-red'
                  }`}>
                    {investment.growthPercentage > 0 ? '+' : ''}{investment.growthPercentage}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Balance Total</span>
                    <span className="font-semibold text-electric-cyan">{formatCurrency(investment.balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Contribución Mensual</span>
                    <span className="font-medium">{formatCurrency(investment.contribution)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ganancia Este Año</span>
                    <span className="font-medium text-electric-green">{formatCurrency(investment.growth)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Expense Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo Gasto Reembolsable</h3>
              <button
                onClick={() => setShowExpenseForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción *
                </label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Describe el gasto..."
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0.00"
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría *
                </label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="input"
                >
                  <option value="">Selecciona una categoría</option>
                  <option value="Comidas de negocio">Comidas de negocio</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Alojamiento">Alojamiento</option>
                  <option value="Oficina">Material de oficina</option>
                  <option value="Tecnología">Tecnología</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recibo (opcional)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setNewExpense({ ...newExpense, receipt: e.target.files?.[0] || null })}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">Formatos: JPG, PNG, PDF</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitExpense}
                  className="btn-electric flex-1"
                >
                  Enviar para Aprobación
                </button>
                <button
                  onClick={() => setShowExpenseForm(false)}
                  className="btn-outline flex-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisFinanzas;