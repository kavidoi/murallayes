import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Star, Clock, User, Tag, ArrowUp, ArrowDown, Calendar, MessageSquare, Link, Eye, Edit3, Trash2 } from 'lucide-react';

interface BacklogItem {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'improvement' | 'task' | 'epic';
  status: 'new' | 'ready' | 'in-progress' | 'review' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  storyPoints: number;
  businessValue: number;
  effort: number;
  project: string;
  assignee?: {
    id: string;
    name: string;
    avatar: string;
  };
  reporter: {
    id: string;
    name: string;
    avatar: string;
  };
  labels: string[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  sprint?: string;
  dependencies: string[];
  linkedItems: string[];
  comments: number;
  watchers: number;
  attachments: number;
  acceptanceCriteria: Array<{
    id: string;
    description: string;
    completed: boolean;
  }>;
  customFields: Record<string, any>;
}

const Backlog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'storyPoints' | 'businessValue' | 'created' | 'updated'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'detailed'>('list');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BacklogItem | null>(null);

  // Mock data
  const projects = [
    { id: 'all', name: 'Todos los Proyectos', color: 'gray' },
    { id: 'web-redesign', name: 'Rediseño Web', color: 'electric-blue' },
    { id: 'mobile-app', name: 'App Móvil', color: 'electric-purple' },
    { id: 'infrastructure', name: 'Infraestructura', color: 'electric-green' },
    { id: 'marketing', name: 'Marketing', color: 'electric-pink' },
  ];

  const backlogItems: BacklogItem[] = [
    {
      id: '1',
      title: 'Implementar autenticación de dos factores',
      description: 'Como usuario, quiero poder habilitar 2FA para mayor seguridad de mi cuenta',
      type: 'feature',
      status: 'ready',
      priority: 'high',
      storyPoints: 8,
      businessValue: 9,
      effort: 7,
      project: 'web-redesign',
      assignee: {
        id: '1',
        name: 'Ana García',
        avatar: '/api/placeholder/32/32'
      },
      reporter: {
        id: '2',
        name: 'Carlos López',
        avatar: '/api/placeholder/32/32'
      },
      labels: ['security', 'authentication', 'backend'],
      createdAt: '2024-01-10T08:30:00Z',
      updatedAt: '2024-01-15T14:20:00Z',
      dueDate: '2024-02-15T23:59:59Z',
      sprint: 'Sprint 12',
      dependencies: [],
      linkedItems: ['2', '3'],
      comments: 5,
      watchers: 8,
      attachments: 2,
      acceptanceCriteria: [
        { id: 'ac1', description: 'Usuario puede habilitar 2FA desde configuración', completed: false },
        { id: 'ac2', description: 'Sistema envía código por SMS o app', completed: false },
        { id: 'ac3', description: 'Validación del código funciona correctamente', completed: false }
      ],
      customFields: {
        complexity: 'high',
        impact: 'high'
      }
    },
    {
      id: '2',
      title: 'Error en cálculo de impuestos',
      description: 'Los impuestos no se calculan correctamente para productos con descuento',
      type: 'bug',
      status: 'new',
      priority: 'critical',
      storyPoints: 3,
      businessValue: 10,
      effort: 4,
      project: 'web-redesign',
      reporter: {
        id: '3',
        name: 'María Silva',
        avatar: '/api/placeholder/32/32'
      },
      labels: ['bug', 'taxes', 'frontend'],
      createdAt: '2024-01-18T09:15:00Z',
      updatedAt: '2024-01-18T09:15:00Z',
      dependencies: [],
      linkedItems: ['1'],
      comments: 2,
      watchers: 12,
      attachments: 3,
      acceptanceCriteria: [
        { id: 'ac4', description: 'Impuestos se calculan correctamente con descuentos', completed: false },
        { id: 'ac5', description: 'Tests unitarios añadidos para validar cálculos', completed: false }
      ],
      customFields: {
        severity: 'critical',
        reproducible: 'always'
      }
    },
    {
      id: '3',
      title: 'Optimizar rendimiento de dashboard',
      description: 'El dashboard principal carga muy lento con muchos widgets',
      type: 'improvement',
      status: 'in-progress',
      priority: 'medium',
      storyPoints: 5,
      businessValue: 6,
      effort: 6,
      project: 'web-redesign',
      assignee: {
        id: '4',
        name: 'Diego Ruiz',
        avatar: '/api/placeholder/32/32'
      },
      reporter: {
        id: '5',
        name: 'Roberto Kim',
        avatar: '/api/placeholder/32/32'
      },
      labels: ['performance', 'dashboard', 'optimization'],
      createdAt: '2024-01-12T10:45:00Z',
      updatedAt: '2024-01-20T16:30:00Z',
      sprint: 'Sprint 12',
      dependencies: ['1'],
      linkedItems: [],
      comments: 8,
      watchers: 6,
      attachments: 1,
      acceptanceCriteria: [
        { id: 'ac6', description: 'Dashboard carga en menos de 2 segundos', completed: true },
        { id: 'ac7', description: 'Lazy loading implementado para widgets', completed: false },
        { id: 'ac8', description: 'Cache implementado para datos estáticos', completed: false }
      ],
      customFields: {
        targetLoadTime: '2s',
        currentLoadTime: '8s'
      }
    },
    {
      id: '4',
      title: 'Sistema de notificaciones push',
      description: 'Implementar notificaciones push para la aplicación móvil',
      type: 'epic',
      status: 'new',
      priority: 'low',
      storyPoints: 21,
      businessValue: 8,
      effort: 13,
      project: 'mobile-app',
      reporter: {
        id: '6',
        name: 'Sofía Chen',
        avatar: '/api/placeholder/32/32'
      },
      labels: ['mobile', 'notifications', 'epic'],
      createdAt: '2024-01-08T11:20:00Z',
      updatedAt: '2024-01-16T09:10:00Z',
      dueDate: '2024-03-31T23:59:59Z',
      dependencies: [],
      linkedItems: ['5', '6'],
      comments: 15,
      watchers: 10,
      attachments: 5,
      acceptanceCriteria: [
        { id: 'ac9', description: 'Push notifications configuradas', completed: false },
        { id: 'ac10', description: 'Usuarios pueden gestionar preferencias', completed: false },
        { id: 'ac11', description: 'Notificaciones personalizadas por tipo', completed: false }
      ],
      customFields: {
        platforms: ['iOS', 'Android'],
        estimatedUsers: '10000'
      }
    },
    {
      id: '5',
      title: 'Migrar base de datos a PostgreSQL',
      description: 'Migrar de MySQL a PostgreSQL para mejor performance',
      type: 'task',
      status: 'review',
      priority: 'medium',
      storyPoints: 13,
      businessValue: 7,
      effort: 15,
      project: 'infrastructure',
      assignee: {
        id: '7',
        name: 'Luis Morales',
        avatar: '/api/placeholder/32/32'
      },
      reporter: {
        id: '8',
        name: 'Emma Thompson',
        avatar: '/api/placeholder/32/32'
      },
      labels: ['database', 'migration', 'infrastructure'],
      createdAt: '2024-01-05T14:30:00Z',
      updatedAt: '2024-01-21T11:45:00Z',
      sprint: 'Sprint 11',
      dependencies: [],
      linkedItems: ['4'],
      comments: 23,
      watchers: 15,
      attachments: 8,
      acceptanceCriteria: [
        { id: 'ac12', description: 'Datos migrados sin pérdida', completed: true },
        { id: 'ac13', description: 'Performance mejorada en 30%', completed: true },
        { id: 'ac14', description: 'Tests de integración pasan', completed: false }
      ],
      customFields: {
        downtime: '2 hours',
        rollbackPlan: 'documented'
      }
    }
  ];

  const filteredItems = useMemo(() => {
    let filtered = backlogItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.labels.some(label => label.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
      const matchesProject = selectedProject === 'all' || item.project === selectedProject;

      return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesProject;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'storyPoints':
          aValue = a.storyPoints;
          bValue = b.storyPoints;
          break;
        case 'businessValue':
          aValue = a.businessValue;
          bValue = b.businessValue;
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updated':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [backlogItems, searchTerm, selectedType, selectedStatus, selectedPriority, selectedProject, sortBy, sortOrder]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-electric-blue/20 text-electric-blue border-electric-blue/30';
      case 'bug': return 'bg-electric-red/20 text-electric-red border-electric-red/30';
      case 'improvement': return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'task': return 'bg-electric-purple/20 text-electric-purple border-electric-purple/30';
      case 'epic': return 'bg-electric-orange/20 text-electric-orange border-electric-orange/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-gray-100 text-gray-600 border-gray-300';
      case 'ready': return 'bg-electric-blue/20 text-electric-blue border-electric-blue/30';
      case 'in-progress': return 'bg-electric-yellow/20 text-electric-yellow border-electric-yellow/30';
      case 'review': return 'bg-electric-purple/20 text-electric-purple border-electric-purple/30';
      case 'done': return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'archived': return 'bg-gray-100 text-gray-400 border-gray-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const calculateScore = (item: BacklogItem) => {
    return Math.round((item.businessValue * item.storyPoints) / Math.max(item.effort, 1));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const bulkUpdateItems = (field: string, value: any) => {
    // Implementation for bulk updates would go here
    console.log('Bulk update:', { field, value, items: selectedItems });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Product Backlog
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Gestión inteligente de historias de usuario y tareas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Historia
          </button>

          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {(['list', 'board', 'detailed'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-electric-blue text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {mode === 'list' && 'Lista'}
                {mode === 'board' && 'Tablero'}
                {mode === 'detailed' && 'Detallado'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar historias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">Todos los Tipos</option>
            <option value="feature">Feature</option>
            <option value="bug">Bug</option>
            <option value="improvement">Mejora</option>
            <option value="task">Tarea</option>
            <option value="epic">Epic</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">Todos los Estados</option>
            <option value="new">Nuevo</option>
            <option value="ready">Listo</option>
            <option value="in-progress">En Progreso</option>
            <option value="review">En Revisión</option>
            <option value="done">Terminado</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">Todas las Prioridades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span>Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
              >
                <option value="priority">Prioridad</option>
                <option value="storyPoints">Story Points</option>
                <option value="businessValue">Valor de Negocio</option>
                <option value="created">Fecha Creación</option>
                <option value="updated">Última Actualización</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </button>
            </div>

            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  {selectedItems.length} seleccionados
                </span>
                <button
                  onClick={() => bulkUpdateItems('status', 'ready')}
                  className="px-2 py-1 bg-electric-blue/20 text-electric-blue rounded text-xs hover:bg-electric-blue/30"
                >
                  Marcar Listo
                </button>
                <button
                  onClick={() => setSelectedItems([])}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300">
            {filteredItems.length} de {backlogItems.length} historias
          </div>
        </div>
      </div>

      {/* Backlog Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Historias</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredItems.length}</p>
            </div>
            <Star className="w-8 h-8 text-electric-blue" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {filteredItems.filter(i => i.status === 'done').length} completadas
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Story Points</p>
              <p className="text-2xl font-bold text-electric-blue">
                {filteredItems.reduce((sum, item) => sum + item.storyPoints, 0)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-electric-blue" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.round(filteredItems.reduce((sum, item) => sum + item.storyPoints, 0) / Math.max(filteredItems.length, 1))} promedio
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Valor de Negocio</p>
              <p className="text-2xl font-bold text-electric-green">
                {filteredItems.reduce((sum, item) => sum + item.businessValue, 0)}
              </p>
            </div>
            <User className="w-8 h-8 text-electric-green" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.round(filteredItems.reduce((sum, item) => sum + item.businessValue, 0) / Math.max(filteredItems.length, 1))} promedio
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">ROI Score</p>
              <p className="text-2xl font-bold text-electric-purple">
                {Math.round(filteredItems.reduce((sum, item) => sum + calculateScore(item), 0) / Math.max(filteredItems.length, 1))}
              </p>
            </div>
            <Tag className="w-8 h-8 text-electric-purple" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Valor/Esfuerzo promedio
          </p>
        </div>
      </div>

      {/* Backlog Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {viewMode === 'list' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(filteredItems.map(item => item.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Historia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Asignado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actividad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredItems.map(item => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedItems.includes(item.id) ? 'bg-electric-blue/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="font-medium text-gray-900 dark:text-white hover:text-electric-blue transition-colors text-left"
                        >
                          {item.title}
                        </button>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </p>
                        {item.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.labels.slice(0, 3).map(label => (
                              <span
                                key={label}
                                className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                              >
                                {label}
                              </span>
                            ))}
                            {item.labels.length > 3 && (
                              <span className="text-xs text-gray-400">+{item.labels.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded border ${getTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {item.storyPoints}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.businessValue}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          (ROI: {calculateScore(item)})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.assignee ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={item.assignee.avatar}
                            alt={item.assignee.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {item.assignee.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {item.comments > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {item.comments}
                          </span>
                        )}
                        {item.linkedItems.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Link className="w-3 h-3" />
                            {item.linkedItems.length}
                          </span>
                        )}
                        {item.watchers > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.watchers}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-gray-400 hover:text-electric-blue transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-electric-red transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === 'board' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {(['new', 'ready', 'in-progress', 'review', 'done'] as const).map(status => {
                const statusItems = filteredItems.filter(item => item.status === status);
                return (
                  <div key={status} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                        {status}
                      </h4>
                      <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                        {statusItems.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {statusItems.map(item => (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-electric-blue transition-colors"
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className={`px-2 py-1 text-xs rounded border ${getTypeColor(item.type)}`}>
                              {item.type}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                          </div>
                          <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                            {item.title}
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-electric-blue">
                              {item.storyPoints} pts
                            </span>
                            {item.assignee && (
                              <img
                                src={item.assignee.avatar}
                                alt={item.assignee.name}
                                className="w-5 h-5 rounded-full"
                                title={item.assignee.name}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'detailed' && (
          <div className="p-6 space-y-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs rounded border ${getTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {item.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-electric-blue transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-electric-red transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Story Points:</span>
                      <span className="font-medium">{item.storyPoints}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Valor de Negocio:</span>
                      <span className="font-medium">{item.businessValue}/10</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Esfuerzo:</span>
                      <span className="font-medium">{item.effort}/10</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">ROI Score:</span>
                      <span className="font-medium text-electric-blue">{calculateScore(item)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Asignado:</span>
                      {item.assignee ? (
                        <div className="flex items-center gap-2 mt-1">
                          <img
                            src={item.assignee.avatar}
                            alt={item.assignee.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm">{item.assignee.name}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 mt-1">Sin asignar</p>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Reporter:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <img
                          src={item.reporter.avatar}
                          alt={item.reporter.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm">{item.reporter.name}</span>
                      </div>
                    </div>
                    {item.dueDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Fecha Límite:</span>
                        <span>{formatDate(item.dueDate)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Actividad:</span>
                      <div className="flex items-center gap-3">
                        {item.comments > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {item.comments}
                          </span>
                        )}
                        {item.watchers > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.watchers}
                          </span>
                        )}
                        {item.linkedItems.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Link className="w-3 h-3" />
                            {item.linkedItems.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <p>Creado: {formatDate(item.createdAt)}</p>
                      <p>Actualizado: {formatDate(item.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {item.labels.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">
                      Etiquetas:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.labels.map(label => (
                        <span
                          key={label}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.acceptanceCriteria.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">
                      Criterios de Aceptación:
                    </span>
                    <div className="space-y-2">
                      {item.acceptanceCriteria.map(criterion => (
                        <div key={criterion.id} className="flex items-start gap-2">
                          <div className={`w-4 h-4 rounded border-2 mt-0.5 flex items-center justify-center ${
                            criterion.completed 
                              ? 'bg-electric-green border-electric-green text-white' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {criterion.completed && <span className="text-xs">✓</span>}
                          </div>
                          <span className={`text-sm ${
                            criterion.completed 
                              ? 'text-gray-500 dark:text-gray-400 line-through' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {criterion.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs rounded border ${getTypeColor(selectedItem.type)}`}>
                      {selectedItem.type}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(selectedItem.status)}`}>
                      {selectedItem.status}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(selectedItem.priority)}`}>
                      {selectedItem.priority}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedItem.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Descripción
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedItem.description}
                    </p>
                  </div>

                  {selectedItem.acceptanceCriteria.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Criterios de Aceptación ({selectedItem.acceptanceCriteria.filter(c => c.completed).length}/{selectedItem.acceptanceCriteria.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedItem.acceptanceCriteria.map(criterion => (
                          <div key={criterion.id} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                            <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center ${
                              criterion.completed 
                                ? 'bg-electric-green border-electric-green text-white' 
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {criterion.completed && <span className="text-xs">✓</span>}
                            </div>
                            <span className={`${
                              criterion.completed 
                                ? 'text-gray-500 dark:text-gray-400 line-through' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {criterion.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Detalles
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Story Points:</span>
                        <span className="font-medium">{selectedItem.storyPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor de Negocio:</span>
                        <span className="font-medium">{selectedItem.businessValue}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Esfuerzo:</span>
                        <span className="font-medium">{selectedItem.effort}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ROI Score:</span>
                        <span className="font-medium text-electric-blue">{calculateScore(selectedItem)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sprint:</span>
                        <span className="font-medium">{selectedItem.sprint || 'Sin asignar'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Personas
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Asignado:</span>
                        {selectedItem.assignee ? (
                          <div className="flex items-center gap-2 mt-1">
                            <img
                              src={selectedItem.assignee.avatar}
                              alt={selectedItem.assignee.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-sm">{selectedItem.assignee.name}</span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 mt-1">Sin asignar</p>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Reporter:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <img
                            src={selectedItem.reporter.avatar}
                            alt={selectedItem.reporter.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm">{selectedItem.reporter.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Fechas
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Creado:</span>
                        <span>{formatDate(selectedItem.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Actualizado:</span>
                        <span>{formatDate(selectedItem.updatedAt)}</span>
                      </div>
                      {selectedItem.dueDate && (
                        <div className="flex justify-between">
                          <span>Fecha Límite:</span>
                          <span>{formatDate(selectedItem.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedItem.labels.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Etiquetas
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedItem.labels.map(label => (
                          <span
                            key={label}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {selectedItem.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {selectedItem.watchers}
                      </span>
                      {selectedItem.linkedItems.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Link className="w-4 h-4" />
                          {selectedItem.linkedItems.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backlog;