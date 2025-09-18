import React, { useState, useMemo } from 'react';
import { Target, Plus, ChevronRight, ChevronDown, Calendar, User, BarChart3, CheckCircle, XCircle, Clock, AlertTriangle, Eye, Edit3, Trash2, Link } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'strategic' | 'tactical' | 'operational' | 'personal';
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number; // 0-100
  parentId?: string;
  level: number; // 0 = root, 1 = level 1, etc.
  startDate: string;
  targetDate: string;
  actualEndDate?: string;
  owner: {
    id: string;
    name: string;
    avatar: string;
  };
  contributors: Array<{
    id: string;
    name: string;
    avatar: string;
    role: string;
  }>;
  metrics: Array<{
    id: string;
    name: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  dependencies: string[];
  linkedProjects: string[];
  tags: string[];
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
  };
  risks: Array<{
    id: string;
    description: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  notes: string;
  attachments: number;
  createdAt: string;
  updatedAt: string;
}

const GoalsTree: React.FC = () => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '2']));
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'matrix' | 'timeline'>('tree');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draggedGoal, setDraggedGoal] = useState<Goal | null>(null);

  // Mock data
  const goals: Goal[] = [
    {
      id: '1',
      title: 'Aumentar Revenue 25%',
      description: 'Incrementar los ingresos de la empresa en un 25% durante el año fiscal 2024',
      type: 'strategic',
      status: 'in-progress',
      priority: 'critical',
      progress: 65,
      level: 0,
      startDate: '2024-01-01',
      targetDate: '2024-12-31',
      owner: {
        id: '1',
        name: 'CEO Ana García',
        avatar: '/api/placeholder/32/32'
      },
      contributors: [
        { id: '2', name: 'Carlos López', avatar: '/api/placeholder/32/32', role: 'CFO' },
        { id: '3', name: 'María Silva', avatar: '/api/placeholder/32/32', role: 'CMO' }
      ],
      metrics: [
        { id: 'm1', name: 'Revenue Mensual', currentValue: 125000, targetValue: 150000, unit: 'USD', trend: 'up' },
        { id: 'm2', name: 'Growth Rate', currentValue: 18, targetValue: 25, unit: '%', trend: 'up' }
      ],
      dependencies: [],
      linkedProjects: ['web-redesign', 'mobile-app'],
      tags: ['revenue', 'growth', 'estratégico'],
      budget: {
        allocated: 500000,
        spent: 325000,
        currency: 'USD'
      },
      risks: [
        {
          id: 'r1',
          description: 'Competencia agresiva en precios',
          probability: 'medium',
          impact: 'high',
          mitigation: 'Diferenciación por valor y servicio'
        }
      ],
      notes: 'Objetivo principal de la compañía para este año. Requiere alineación de todos los departamentos.',
      attachments: 3,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: '1.1',
      title: 'Mejorar Conversión Web 15%',
      description: 'Optimizar el funnel de conversión del sitio web para aumentar la tasa de conversión',
      type: 'tactical',
      status: 'in-progress',
      priority: 'high',
      progress: 75,
      parentId: '1',
      level: 1,
      startDate: '2024-01-15',
      targetDate: '2024-06-30',
      owner: {
        id: '3',
        name: 'María Silva',
        avatar: '/api/placeholder/32/32'
      },
      contributors: [
        { id: '4', name: 'Diego Ruiz', avatar: '/api/placeholder/32/32', role: 'UX Designer' },
        { id: '5', name: 'Roberto Kim', avatar: '/api/placeholder/32/32', role: 'Frontend Dev' }
      ],
      metrics: [
        { id: 'm3', name: 'Conversion Rate', currentValue: 3.2, targetValue: 3.7, unit: '%', trend: 'up' },
        { id: 'm4', name: 'Bounce Rate', currentValue: 45, targetValue: 35, unit: '%', trend: 'down' }
      ],
      dependencies: ['2.1'],
      linkedProjects: ['web-redesign'],
      tags: ['conversion', 'web', 'marketing'],
      budget: {
        allocated: 50000,
        spent: 32000,
        currency: 'USD'
      },
      risks: [
        {
          id: 'r2',
          description: 'Cambios de algoritmo de Google',
          probability: 'low',
          impact: 'medium',
          mitigation: 'SEO diversificado y canales múltiples'
        }
      ],
      notes: 'Enfocado en optimización de UX y A/B testing de páginas clave.',
      attachments: 5,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-22T16:45:00Z'
    },
    {
      id: '1.2',
      title: 'Lanzar 3 Productos Nuevos',
      description: 'Desarrollar y lanzar al mercado 3 nuevos productos durante Q2 y Q3',
      type: 'tactical',
      status: 'in-progress',
      priority: 'high',
      progress: 40,
      parentId: '1',
      level: 1,
      startDate: '2024-02-01',
      targetDate: '2024-09-30',
      owner: {
        id: '6',
        name: 'Sofía Chen',
        avatar: '/api/placeholder/32/32'
      },
      contributors: [
        { id: '7', name: 'Luis Morales', avatar: '/api/placeholder/32/32', role: 'Product Manager' },
        { id: '8', name: 'Emma Thompson', avatar: '/api/placeholder/32/32', role: 'Tech Lead' }
      ],
      metrics: [
        { id: 'm5', name: 'Productos Lanzados', currentValue: 1, targetValue: 3, unit: 'products', trend: 'up' },
        { id: 'm6', name: 'Revenue Nuevos Productos', currentValue: 25000, targetValue: 100000, unit: 'USD', trend: 'up' }
      ],
      dependencies: ['1.1'],
      linkedProjects: ['mobile-app', 'infrastructure'],
      tags: ['producto', 'innovación', 'desarrollo'],
      budget: {
        allocated: 200000,
        spent: 78000,
        currency: 'USD'
      },
      risks: [
        {
          id: 'r3',
          description: 'Retrasos en desarrollo',
          probability: 'medium',
          impact: 'high',
          mitigation: 'Metodología ágil y checkpoints semanales'
        }
      ],
      notes: 'Productos alineados con feedback de clientes y análisis de mercado.',
      attachments: 8,
      createdAt: '2024-02-01T10:00:00Z',
      updatedAt: '2024-01-23T11:20:00Z'
    },
    {
      id: '1.1.1',
      title: 'Rediseñar Landing Pages',
      description: 'Rediseñar las 5 landing pages principales con nuevo diseño y copy optimizado',
      type: 'operational',
      status: 'completed',
      priority: 'medium',
      progress: 100,
      parentId: '1.1',
      level: 2,
      startDate: '2024-01-15',
      targetDate: '2024-03-15',
      actualEndDate: '2024-03-10',
      owner: {
        id: '4',
        name: 'Diego Ruiz',
        avatar: '/api/placeholder/32/32'
      },
      contributors: [
        { id: '9', name: 'Ana Copywriter', avatar: '/api/placeholder/32/32', role: 'Copywriter' }
      ],
      metrics: [
        { id: 'm7', name: 'Landing Pages Completadas', currentValue: 5, targetValue: 5, unit: 'pages', trend: 'stable' },
        { id: 'm8', name: 'A/B Tests Ejecutados', currentValue: 15, targetValue: 15, unit: 'tests', trend: 'stable' }
      ],
      dependencies: [],
      linkedProjects: ['web-redesign'],
      tags: ['diseño', 'conversion', 'landing'],
      budget: {
        allocated: 15000,
        spent: 14200,
        currency: 'USD'
      },
      risks: [],
      notes: 'Completado exitosamente. Mejoras en conversión del 23% promedio.',
      attachments: 12,
      createdAt: '2024-01-15T09:30:00Z',
      updatedAt: '2024-03-10T17:00:00Z'
    },
    {
      id: '1.1.2',
      title: 'Implementar Chat en Vivo',
      description: 'Instalar y configurar sistema de chat en vivo para mejorar soporte al cliente',
      type: 'operational',
      status: 'not-started',
      priority: 'medium',
      progress: 0,
      parentId: '1.1',
      level: 2,
      startDate: '2024-03-01',
      targetDate: '2024-04-15',
      owner: {
        id: '5',
        name: 'Roberto Kim',
        avatar: '/api/placeholder/32/32'
      },
      contributors: [
        { id: '10', name: 'Support Team Lead', avatar: '/api/placeholder/32/32', role: 'Support Lead' }
      ],
      metrics: [
        { id: 'm9', name: 'Tiempo de Respuesta', currentValue: 0, targetValue: 30, unit: 'seconds', trend: 'stable' },
        { id: 'm10', name: 'Satisfacción Cliente', currentValue: 0, targetValue: 4.5, unit: 'stars', trend: 'stable' }
      ],
      dependencies: ['1.1.1'],
      linkedProjects: ['web-redesign'],
      tags: ['chat', 'soporte', 'cliente'],
      budget: {
        allocated: 8000,
        spent: 0,
        currency: 'USD'
      },
      risks: [
        {
          id: 'r4',
          description: 'Integración compleja con sistema actual',
          probability: 'low',
          impact: 'medium',
          mitigation: 'Pruebas en ambiente de staging'
        }
      ],
      notes: 'Pendiente aprobación final del presupuesto.',
      attachments: 2,
      createdAt: '2024-02-15T14:00:00Z',
      updatedAt: '2024-02-15T14:00:00Z'
    },
    {
      id: '2',
      title: 'Optimizar Operaciones Internas',
      description: 'Mejorar eficiencia operacional y reducir costos en un 20%',
      type: 'strategic',
      status: 'in-progress',
      priority: 'high',
      progress: 45,
      level: 0,
      startDate: '2024-01-01',
      targetDate: '2024-10-31',
      owner: {
        id: '2',
        name: 'Carlos López',
        avatar: '/api/placeholder/32/32'
      },
      contributors: [
        { id: '11', name: 'Operations Manager', avatar: '/api/placeholder/32/32', role: 'Ops Manager' },
        { id: '12', name: 'Process Analyst', avatar: '/api/placeholder/32/32', role: 'Analyst' }
      ],
      metrics: [
        { id: 'm11', name: 'Reducción de Costos', currentValue: 12, targetValue: 20, unit: '%', trend: 'up' },
        { id: 'm12', name: 'Eficiencia Procesos', currentValue: 78, targetValue: 90, unit: '%', trend: 'up' }
      ],
      dependencies: [],
      linkedProjects: ['infrastructure'],
      tags: ['operaciones', 'eficiencia', 'costos'],
      budget: {
        allocated: 150000,
        spent: 67500,
        currency: 'USD'
      },
      risks: [
        {
          id: 'r5',
          description: 'Resistencia al cambio del equipo',
          probability: 'medium',
          impact: 'medium',
          mitigation: 'Programa de change management y comunicación'
        }
      ],
      notes: 'Enfoque en automatización y digitalización de procesos manuales.',
      attachments: 6,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-21T10:15:00Z'
    },
    {
      id: '2.1',
      title: 'Automatizar Reportes',
      description: 'Implementar dashboard automatizado para reportes financieros y operacionales',
      type: 'operational',
      status: 'completed',
      priority: 'high',
      progress: 100,
      parentId: '2',
      level: 1,
      startDate: '2024-01-15',
      targetDate: '2024-02-28',
      actualEndDate: '2024-02-25',
      owner: {
        id: '12',
        name: 'Process Analyst',
        avatar: '/api/placeholder/32/32'
      },
      contributors: [
        { id: '13', name: 'BI Developer', avatar: '/api/placeholder/32/32', role: 'BI Dev' }
      ],
      metrics: [
        { id: 'm13', name: 'Reportes Automatizados', currentValue: 15, targetValue: 15, unit: 'reports', trend: 'stable' },
        { id: 'm14', name: 'Tiempo Ahorrado', currentValue: 40, targetValue: 40, unit: 'hours/week', trend: 'stable' }
      ],
      dependencies: [],
      linkedProjects: ['infrastructure'],
      tags: ['automatización', 'reportes', 'dashboard'],
      budget: {
        allocated: 25000,
        spent: 23800,
        currency: 'USD'
      },
      risks: [],
      notes: 'Implementación exitosa. Dashboard utilizado diariamente por management.',
      attachments: 7,
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-02-25T16:30:00Z'
    }
  ];

  const buildTree = (goals: Goal[]): Goal[] => {
    const goalMap = new Map<string, Goal & { children: Goal[] }>();
    
    // Create map with children arrays
    goals.forEach(goal => {
      goalMap.set(goal.id, { ...goal, children: [] });
    });

    const roots: (Goal & { children: Goal[] })[] = [];

    // Build tree structure
    goals.forEach(goal => {
      const goalWithChildren = goalMap.get(goal.id)!;
      if (goal.parentId) {
        const parent = goalMap.get(goal.parentId);
        if (parent) {
          parent.children.push(goalWithChildren);
        }
      } else {
        roots.push(goalWithChildren);
      }
    });

    return roots;
  };

  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      const matchesType = filterType === 'all' || goal.type === filterType;
      const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
      return matchesType && matchesStatus;
    });
  }, [goals, filterType, filterStatus]);

  const goalTree = useMemo(() => {
    return buildTree(filteredGoals);
  }, [filteredGoals]);

  const toggleNode = (goalId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (expandedNodes.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedNodes(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'in-progress': return 'bg-electric-blue/20 text-electric-blue border-electric-blue/30';
      case 'blocked': return 'bg-electric-red/20 text-electric-red border-electric-red/30';
      case 'cancelled': return 'bg-gray-300/20 text-gray-500 border-gray-300/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-electric-red/20 text-electric-red';
      case 'high': return 'bg-electric-orange/20 text-electric-orange';
      case 'medium': return 'bg-electric-yellow/20 text-electric-yellow';
      case 'low': return 'bg-electric-green/20 text-electric-green';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strategic': return '🎯';
      case 'tactical': return '📈';
      case 'operational': return '⚙️';
      case 'personal': return '👤';
      default: return '📋';
    }
  };

  const calculateOverallProgress = (goal: Goal & { children: Goal[] }): number => {
    if (goal.children.length === 0) {
      return goal.progress;
    }
    
    const totalProgress = goal.children.reduce((sum, child) => {
      return sum + calculateOverallProgress(child as Goal & { children: Goal[] });
    }, 0);
    
    return Math.round(totalProgress / goal.children.length);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const renderGoalNode = (goal: Goal & { children: Goal[] }, depth: number = 0) => {
    const hasChildren = goal.children.length > 0;
    const isExpanded = expandedNodes.has(goal.id);
    const overallProgress = calculateOverallProgress(goal);
    const isSelected = selectedGoal === goal.id;

    return (
      <div key={goal.id} className={`${depth > 0 ? 'ml-6' : ''}`}>
        <div
          className={`group border rounded-lg p-4 transition-all cursor-pointer ${
            isSelected 
              ? 'border-electric-blue bg-electric-blue/5 shadow-md' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
          } ${depth > 0 ? 'border-l-4 border-l-electric-blue/30' : ''}`}
          onClick={() => setSelectedGoal(isSelected ? null : goal.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(goal.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded mt-1"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{getTypeIcon(goal.type)}</span>
                  <h4 className={`font-semibold truncate ${
                    depth === 0 ? 'text-lg text-gray-900 dark:text-white' :
                    depth === 1 ? 'text-base text-gray-800 dark:text-gray-100' :
                    'text-sm text-gray-700 dark:text-gray-200'
                  }`}>
                    {goal.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(goal.status)}`}>
                      {goal.status}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                  {goal.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Progreso</span>
                      <span className="font-medium">{overallProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-electric-blue h-2 rounded-full transition-all"
                        style={{ width: `${overallProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatDate(goal.startDate)} - {formatDate(goal.targetDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300 text-xs">
                        {goal.owner.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm">
                    {goal.budget && (
                      <div className="mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Presupuesto: </span>
                        <span className="font-medium">
                          {formatCurrency(goal.budget.spent, goal.budget.currency)} / {formatCurrency(goal.budget.allocated, goal.budget.currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Métricas: </span>
                      <span className="text-xs bg-electric-blue/20 text-electric-blue px-2 py-1 rounded">
                        {goal.metrics.length} activas
                      </span>
                    </div>
                  </div>
                </div>

                {goal.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {goal.tags.slice(0, 5).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {goal.tags.length > 5 && (
                      <span className="text-xs text-gray-400">+{goal.tags.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                {goal.risks.length > 0 && (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {goal.risks.length}
                  </span>
                )}
                {goal.linkedProjects.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Link className="w-3 h-3" />
                    {goal.linkedProjects.length}
                  </span>
                )}
                {goal.attachments > 0 && (
                  <span className="flex items-center gap-1">
                    📎 {goal.attachments}
                  </span>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button className="p-1 text-gray-400 hover:text-electric-blue transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-electric-red transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-4 space-y-3">
            {goal.children.map(child => 
              renderGoalNode(child as Goal & { children: Goal[] }, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMatrix = () => {
    const types = ['strategic', 'tactical', 'operational', 'personal'];
    const statuses = ['not-started', 'in-progress', 'completed', 'blocked'];

    return (
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="p-3 text-left border border-gray-200 dark:border-gray-600">Tipo / Estado</th>
              {statuses.map(status => (
                <th key={status} className="p-3 text-center border border-gray-200 dark:border-gray-600 capitalize">
                  {status.replace('-', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map(type => (
              <tr key={type}>
                <td className="p-3 font-medium border border-gray-200 dark:border-gray-600 capitalize">
                  {getTypeIcon(type)} {type}
                </td>
                {statuses.map(status => {
                  const goalsInCell = filteredGoals.filter(g => g.type === type && g.status === status);
                  return (
                    <td key={`${type}-${status}`} className="p-3 border border-gray-200 dark:border-gray-600">
                      <div className="text-center">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {goalsInCell.length}
                        </span>
                        {goalsInCell.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {Math.round(goalsInCell.reduce((sum, g) => sum + g.progress, 0) / goalsInCell.length)}% promedio
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTimeline = () => {
    const sortedGoals = [...filteredGoals].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return (
      <div className="space-y-4">
        {sortedGoals.map(goal => (
          <div key={goal.id} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className={`w-4 h-4 rounded-full bg-${goal.type === 'strategic' ? 'electric-red' : goal.type === 'tactical' ? 'electric-blue' : 'electric-green'}`}></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{goal.title}</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {goal.progress}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span>{formatDate(goal.startDate)} - {formatDate(goal.targetDate)}</span>
                <span>👤 {goal.owner.name}</span>
                <span>🎯 {goal.type}</span>
                {goal.budget && (
                  <span>💰 {formatCurrency(goal.budget.allocated, goal.budget.currency)}</span>
                )}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-electric-blue h-2 rounded-full transition-all"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Árbol de Objetivos
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Gestión estratégica y seguimiento de metas organizacionales
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Objetivo
          </button>

          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {(['tree', 'matrix', 'timeline'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-electric-blue text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {mode === 'tree' && 'Árbol'}
                {mode === 'matrix' && 'Matrix'}
                {mode === 'timeline' && 'Timeline'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Filtros:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Todos los Tipos</option>
              <option value="strategic">Estratégico</option>
              <option value="tactical">Táctico</option>
              <option value="operational">Operacional</option>
              <option value="personal">Personal</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Todos los Estados</option>
              <option value="not-started">No Iniciado</option>
              <option value="in-progress">En Progreso</option>
              <option value="completed">Completado</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {filteredGoals.length} objetivos
            </div>
            <button className="text-sm text-electric-blue hover:text-electric-blue/80 transition-colors">
              Expandir Todo
            </button>
            <button className="text-sm text-electric-blue hover:text-electric-blue/80 transition-colors">
              Colapsar Todo
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Objetivos Totales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredGoals.length}</p>
            </div>
            <Target className="w-8 h-8 text-electric-blue" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {filteredGoals.filter(g => g.status === 'completed').length} completados
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">En Progreso</p>
              <p className="text-2xl font-bold text-electric-blue">
                {filteredGoals.filter(g => g.status === 'in-progress').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-electric-blue" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.round(filteredGoals.filter(g => g.status === 'in-progress').reduce((sum, g) => sum + g.progress, 0) / Math.max(filteredGoals.filter(g => g.status === 'in-progress').length, 1))}% progreso promedio
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Presupuesto Total</p>
              <p className="text-2xl font-bold text-electric-green">
                {formatCurrency(
                  filteredGoals
                    .filter(g => g.budget)
                    .reduce((sum, g) => sum + (g.budget?.allocated || 0), 0),
                  'USD'
                )}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-electric-green" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.round((filteredGoals.filter(g => g.budget).reduce((sum, g) => sum + (g.budget?.spent || 0), 0) / Math.max(filteredGoals.filter(g => g.budget).reduce((sum, g) => sum + (g.budget?.allocated || 0), 0), 1)) * 100)}% ejecutado
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Riesgos Activos</p>
              <p className="text-2xl font-bold text-electric-orange">
                {filteredGoals.reduce((sum, g) => sum + g.risks.length, 0)}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-electric-orange" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {filteredGoals.reduce((sum, g) => sum + g.risks.filter(r => r.impact === 'high').length, 0)} de impacto alto
          </p>
        </div>
      </div>

      {/* Goals Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          {viewMode === 'tree' && (
            <div className="space-y-4">
              {goalTree.map(goal => renderGoalNode(goal as Goal & { children: Goal[] }))}
            </div>
          )}

          {viewMode === 'matrix' && renderMatrix()}

          {viewMode === 'timeline' && renderTimeline()}
        </div>
      </div>

      {/* Goal Details Panel */}
      {selectedGoal && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {(() => {
            const goal = goals.find(g => g.id === selectedGoal);
            if (!goal) return null;

            return (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{getTypeIcon(goal.type)}</span>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {goal.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(goal.status)}`}>
                          {goal.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(goal.priority)}`}>
                          {goal.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {goal.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-electric-blue transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-electric-red transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {goal.metrics.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                          Métricas de Seguimiento
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {goal.metrics.map(metric => (
                            <div key={metric.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900 dark:text-white">{metric.name}</h5>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  metric.trend === 'up' ? 'bg-electric-green/20 text-electric-green' :
                                  metric.trend === 'down' ? 'bg-electric-red/20 text-electric-red' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Actual: <strong>{metric.currentValue} {metric.unit}</strong></span>
                                <span>Meta: <strong>{metric.targetValue} {metric.unit}</strong></span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                <div
                                  className="bg-electric-blue h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min((metric.currentValue / metric.targetValue) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {goal.risks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                          Riesgos Identificados
                        </h4>
                        <div className="space-y-3">
                          {goal.risks.map(risk => (
                            <div key={risk.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium text-gray-900 dark:text-white">{risk.description}</h5>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    risk.probability === 'high' ? 'bg-electric-red/20 text-electric-red' :
                                    risk.probability === 'medium' ? 'bg-electric-yellow/20 text-electric-yellow' :
                                    'bg-electric-green/20 text-electric-green'
                                  }`}>
                                    {risk.probability} prob.
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    risk.impact === 'high' ? 'bg-electric-red/20 text-electric-red' :
                                    risk.impact === 'medium' ? 'bg-electric-yellow/20 text-electric-yellow' :
                                    'bg-electric-green/20 text-electric-green'
                                  }`}>
                                    {risk.impact} impacto
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                <strong>Mitigación:</strong> {risk.mitigation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {goal.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Notas
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                          {goal.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Información General
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Progreso:</span>
                          <span className="font-medium">{goal.progress}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tipo:</span>
                          <span className="font-medium capitalize">{goal.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nivel:</span>
                          <span className="font-medium">Nivel {goal.level}</span>
                        </div>
                        {goal.dependencies.length > 0 && (
                          <div className="flex justify-between">
                            <span>Dependencias:</span>
                            <span className="font-medium">{goal.dependencies.length}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Fechas
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Inicio:</span>
                          <span>{formatDate(goal.startDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Meta:</span>
                          <span>{formatDate(goal.targetDate)}</span>
                        </div>
                        {goal.actualEndDate && (
                          <div className="flex justify-between">
                            <span>Finalizado:</span>
                            <span>{formatDate(goal.actualEndDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Equipo
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Responsable:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <img
                              src={goal.owner.avatar}
                              alt={goal.owner.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-sm">{goal.owner.name}</span>
                          </div>
                        </div>
                        {goal.contributors.length > 0 && (
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Colaboradores ({goal.contributors.length}):
                            </span>
                            <div className="space-y-2 mt-2">
                              {goal.contributors.map(contributor => (
                                <div key={contributor.id} className="flex items-center gap-2">
                                  <img
                                    src={contributor.avatar}
                                    alt={contributor.name}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <div>
                                    <span className="text-sm">{contributor.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                      ({contributor.role})
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {goal.budget && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                          Presupuesto
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Asignado:</span>
                            <span className="font-medium">
                              {formatCurrency(goal.budget.allocated, goal.budget.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gastado:</span>
                            <span className="font-medium">
                              {formatCurrency(goal.budget.spent, goal.budget.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Disponible:</span>
                            <span className="font-medium text-electric-green">
                              {formatCurrency(goal.budget.allocated - goal.budget.spent, goal.budget.currency)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                            <div
                              className="bg-electric-blue h-2 rounded-full transition-all"
                              style={{ width: `${(goal.budget.spent / goal.budget.allocated) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {goal.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Etiquetas
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {goal.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default GoalsTree;