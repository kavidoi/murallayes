import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { AuthService } from '../../../services/authService';

interface Budget {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  project: {
    id: string;
    name: string;
  };
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'LOCKED' | 'CANCELLED';
  category: 'OPEX' | 'CAPEX' | 'REVENUE' | 'OTHER';
  totalPlanned: number;
  totalCommitted: number;
  totalActual: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  version: number;
  lines: BudgetLine[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  financial?: {
    totalPlanned: number;
    totalCommitted: number;
    totalActual: number;
    availableAmount: number;
    variance: number;
    variancePercent: number;
    healthStatus: 'ON_TRACK' | 'AT_RISK' | 'OVER_BUDGET';
  };
}

interface BudgetLine {
  id: string;
  budgetId: string;
  name: string;
  description?: string;
  category?: string;
  vendor?: string;
  plannedAmount: number;
  committedAmount: number;
  actualAmount: number;
  unitPrice?: number;
  quantity?: number;
  dueDate?: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  autoCreateTasks: boolean;
  tasks: Task[];
  comments: Comment[];
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  actualCost?: number;
}

interface Comment {
  id: string;
  content: string;
  type: 'BUDGET' | 'BUDGET_LINE' | 'TASK' | 'PROJECT';
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  mentions: string[];
  createdAt: string;
  isEdited: boolean;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

const BudgetManager: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    projectId: '',
    status: '',
    category: ''
  });

  // Form state for creating budgets
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    description: '',
    projectId: '',
    category: 'OPEX' as const,
    totalPlanned: '',
    currency: 'CLP',
    startDate: '',
    endDate: '',
    lines: [{
      name: '',
      description: '',
      category: '',
      vendor: '',
      plannedAmount: '',
      unitPrice: '',
      quantity: '',
      dueDate: '',
      autoCreateTasks: false
    }]
  });

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await AuthService.apiCall<Budget[]>(`/budgets?${queryParams.toString()}`);
      
      // Get variance data
      const varianceResponse = await AuthService.apiCall<Budget[]>(`/budgets/variance-report?${queryParams.toString()}`);
      
      // Merge budget data with variance data
      const budgetsWithVariance = response.map(budget => {
        const varianceData = varianceResponse.find(v => v.id === budget.id);
        return {
          ...budget,
          financial: varianceData?.financial || {
            totalPlanned: budget.totalPlanned,
            totalCommitted: budget.totalCommitted,
            totalActual: budget.totalActual,
            availableAmount: budget.totalPlanned - budget.totalCommitted,
            variance: budget.totalPlanned - budget.totalActual,
            variancePercent: budget.totalPlanned > 0 ? ((budget.totalPlanned - budget.totalActual) / budget.totalPlanned) * 100 : 0,
            healthStatus: 'ON_TRACK' as const
          }
        };
      });

      setBudgets(budgetsWithVariance);
      setError(null);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await AuthService.apiCall<Project[]>('/projects');
      setProjects(response);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [filters]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const budgetData = {
        ...budgetForm,
        totalPlanned: parseFloat(budgetForm.totalPlanned),
        lines: budgetForm.lines.map(line => ({
          ...line,
          plannedAmount: parseFloat(line.plannedAmount) || 0,
          unitPrice: line.unitPrice ? parseFloat(line.unitPrice) : undefined,
          quantity: line.quantity ? parseFloat(line.quantity) : undefined,
          dueDate: line.dueDate || undefined
        }))
      };

      await AuthService.apiCall('/budgets', { method: 'POST', body: JSON.stringify(budgetData) });
      setShowCreateForm(false);
      setBudgetForm({
        name: '',
        description: '',
        projectId: '',
        category: 'OPEX',
        totalPlanned: '',
        currency: 'CLP',
        startDate: '',
        endDate: '',
        lines: [{
          name: '',
          description: '',
          category: '',
          vendor: '',
          plannedAmount: '',
          unitPrice: '',
          quantity: '',
          dueDate: '',
          autoCreateTasks: false
        }]
      });
      fetchBudgets();
    } catch (err) {
      console.error('Error creating budget:', err);
      setError(err instanceof Error ? err.message : 'Error al crear presupuesto');
    }
  };

  const addBudgetLine = () => {
    setBudgetForm(prev => ({
      ...prev,
      lines: [...prev.lines, {
        name: '',
        description: '',
        category: '',
        vendor: '',
        plannedAmount: '',
        unitPrice: '',
        quantity: '',
        dueDate: '',
        autoCreateTasks: false
      }]
    }));
  };

  const removeBudgetLine = (index: number) => {
    setBudgetForm(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const updateBudgetLine = (index: number, field: string, value: any) => {
    setBudgetForm(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  const createTasksFromBudgetLine = async (budgetLineId: string) => {
    try {
      await AuthService.apiCall(`/budgets/${budgetLineId}/create-tasks`, { method: 'POST' });
      fetchBudgets();
    } catch (err) {
      console.error('Error creating tasks:', err);
      setError(err instanceof Error ? err.message : 'Error al crear tareas');
    }
  };

  const toggleBudgetExpansion = (budgetId: string) => {
    setExpandedBudgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(budgetId)) {
        newSet.delete(budgetId);
      } else {
        newSet.add(budgetId);
      }
      return newSet;
    });
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'ON_TRACK': return 'text-green-600 bg-green-100';
      case 'AT_RISK': return 'text-yellow-600 bg-yellow-100';
      case 'OVER_BUDGET': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'ON_TRACK': return <CheckCircleIcon className="w-4 h-4" />;
      case 'AT_RISK': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'OVER_BUDGET': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <ChartBarIcon className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number, currency = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'text-gray-600 bg-gray-100';
      case 'SUBMITTED': return 'text-blue-600 bg-blue-100';
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'LOCKED': return 'text-purple-600 bg-purple-100';
      case 'CANCELLED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Presupuestos</h1>
          <p className="text-gray-600">Administra presupuestos vinculados a proyectos con seguimiento automático</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Crear Presupuesto</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
            <select
              value={filters.projectId}
              onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todos los proyectos</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="SUBMITTED">Enviado</option>
              <option value="APPROVED">Aprobado</option>
              <option value="LOCKED">Bloqueado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todas las categorías</option>
              <option value="OPEX">OPEX</option>
              <option value="CAPEX">CAPEX</option>
              <option value="REVENUE">Ingresos</option>
              <option value="OTHER">Otros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="space-y-4">
        {budgets.length === 0 ? (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay presupuestos</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza creando tu primer presupuesto.</p>
          </div>
        ) : (
          budgets.map(budget => (
            <div key={budget.id} className="bg-white rounded-lg shadow-sm border">
              {/* Budget Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleBudgetExpansion(budget.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {expandedBudgets.has(budget.id) ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                      <p className="text-sm text-gray-600">{budget.project.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Health Status */}
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(budget.financial?.healthStatus || 'ON_TRACK')}`}>
                      {getHealthIcon(budget.financial?.healthStatus || 'ON_TRACK')}
                      <span>
                        {budget.financial?.healthStatus === 'ON_TRACK' && 'En curso'}
                        {budget.financial?.healthStatus === 'AT_RISK' && 'En riesgo'}
                        {budget.financial?.healthStatus === 'OVER_BUDGET' && 'Sobre presupuesto'}
                      </span>
                    </div>

                    {/* Status */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                      {budget.status === 'DRAFT' && 'Borrador'}
                      {budget.status === 'SUBMITTED' && 'Enviado'}
                      {budget.status === 'APPROVED' && 'Aprobado'}
                      {budget.status === 'LOCKED' && 'Bloqueado'}
                      {budget.status === 'CANCELLED' && 'Cancelado'}
                    </span>

                    {/* Financial Summary */}
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(budget.financial?.totalPlanned || budget.totalPlanned, budget.currency)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Disponible: {formatCurrency(budget.financial?.availableAmount || 0, budget.currency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Progress Bar */}
                {budget.financial && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progreso del presupuesto</span>
                      <span>{budget.financial.variancePercent.toFixed(1)}% variación</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          budget.financial.healthStatus === 'ON_TRACK' ? 'bg-green-500' :
                          budget.financial.healthStatus === 'AT_RISK' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (budget.financial.totalActual / budget.financial.totalPlanned) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Content */}
              {expandedBudgets.has(budget.id) && (
                <div className="border-t border-gray-200">
                  {/* Budget Lines */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Líneas de Presupuesto</h4>
                      <span className="text-sm text-gray-600">{budget.lines.length} líneas</span>
                    </div>
                    
                    <div className="space-y-3">
                      {budget.lines.map(line => (
                        <div key={line.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{line.name}</h5>
                              {line.description && (
                                <p className="text-sm text-gray-600 mt-1">{line.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                {line.vendor && <span>Proveedor: {line.vendor}</span>}
                                {line.category && <span>Categoría: {line.category}</span>}
                                {line.dueDate && (
                                  <span className="flex items-center space-x-1">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>{new Date(line.dueDate).toLocaleDateString()}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right ml-4">
                              <div className="font-medium text-gray-900">
                                {formatCurrency(line.plannedAmount, budget.currency)}
                              </div>
                              <div className="text-sm text-gray-600">
                                Usado: {formatCurrency(line.actualAmount, budget.currency)}
                              </div>
                            </div>
                          </div>

                          {/* Tasks for this line */}
                          {line.tasks.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <ClipboardDocumentListIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Tareas ({line.tasks.length})</span>
                              </div>
                              <div className="space-y-1">
                                {line.tasks.map(task => (
                                  <div key={task.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                      <span className={`w-2 h-2 rounded-full ${
                                        task.status === 'DONE' ? 'bg-green-500' :
                                        task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                        'bg-gray-300'
                                      }`}></span>
                                      <span>{task.title}</span>
                                    </div>
                                    {task.assignee && (
                                      <span className="text-gray-600">
                                        {task.assignee.firstName} {task.assignee.lastName}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Create Tasks Button */}
                          {line.autoCreateTasks && line.tasks.length === 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <button
                                onClick={() => createTasksFromBudgetLine(line.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                              >
                                <PlusIcon className="w-4 h-4" />
                                <span>Crear tareas automáticamente</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Budget Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <form onSubmit={handleCreateBudget} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Crear Nuevo Presupuesto</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Presupuesto *
                  </label>
                  <input
                    type="text"
                    value={budgetForm.name}
                    onChange={(e) => setBudgetForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proyecto *
                  </label>
                  <select
                    value={budgetForm.projectId}
                    onChange={(e) => setBudgetForm(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar proyecto</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={budgetForm.category}
                    onChange={(e) => setBudgetForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="OPEX">OPEX (Gastos Operacionales)</option>
                    <option value="CAPEX">CAPEX (Gastos de Capital)</option>
                    <option value="REVENUE">Ingresos</option>
                    <option value="OTHER">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Planificado *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={budgetForm.totalPlanned}
                    onChange={(e) => setBudgetForm(prev => ({ ...prev, totalPlanned: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={budgetForm.startDate}
                    onChange={(e) => setBudgetForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={budgetForm.endDate}
                    onChange={(e) => setBudgetForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={budgetForm.description}
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="Descripción del presupuesto..."
                />
              </div>

              {/* Budget Lines */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Líneas de Presupuesto</h3>
                  <button
                    type="button"
                    onClick={addBudgetLine}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Agregar línea</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {budgetForm.lines.map((line, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-900">Línea {index + 1}</h4>
                        {budgetForm.lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBudgetLine(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            value={line.name}
                            onChange={(e) => updateBudgetLine(index, 'name', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monto Planificado *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={line.plannedAmount}
                            onChange={(e) => updateBudgetLine(index, 'plannedAmount', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proveedor
                          </label>
                          <input
                            type="text"
                            value={line.vendor}
                            onChange={(e) => updateBudgetLine(index, 'vendor', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría
                          </label>
                          <input
                            type="text"
                            value={line.category}
                            onChange={(e) => updateBudgetLine(index, 'category', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Límite
                          </label>
                          <input
                            type="date"
                            value={line.dueDate}
                            onChange={(e) => updateBudgetLine(index, 'dueDate', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`autoCreateTasks-${index}`}
                            checked={line.autoCreateTasks}
                            onChange={(e) => updateBudgetLine(index, 'autoCreateTasks', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`autoCreateTasks-${index}`} className="text-sm text-gray-700">
                            Crear tareas automáticamente
                          </label>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={line.description}
                          onChange={(e) => updateBudgetLine(index, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Crear Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManager;
