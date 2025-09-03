import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon, 
  UserIcon, 
  CalendarIcon,
  TagIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  StarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  EllipsisHorizontalIcon,
  PlayIcon,
  PauseIcon,
  Squares2X2Icon,
  EyeIcon,
  PencilIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { tasksService, type Task as ServiceTask } from '../../../services/tasksService';

// Extended interface for UI-specific properties
interface UITask extends ServiceTask {
  tags: string[];
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  comments: number;
  attachments: number;
  estimatedHours?: number;
  actualHours?: number;
  completedAt?: string;
  assignedBy?: {
    id: string;
    name: string;
    avatar: string;
  };
}

const MisTareas: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'updated' | 'created'>('dueDate');
  const [viewMode, setViewMode] = useState<'expanded' | 'compact'>('expanded');
  const [tasks, setTasks] = useState<UITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform service task to UI task with mock UI-specific properties
  const transformToUITask = (serviceTask: ServiceTask): UITask => {
    // Map service status to UI status
    const statusMap = {
      'TODO': 'todo',
      'PENDING': 'todo',
      'IN_PROGRESS': 'in_progress', 
      'REVIEW': 'review',
      'DONE': 'completed'
    } as const;

    // Map service priority to UI priority
    const priorityMap = {
      'LOW': 'low',
      'MEDIUM': 'medium',
      'HIGH': 'high',
      'URGENT': 'urgent'
    } as const;

    return {
      ...serviceTask,
      status: (statusMap as any)[serviceTask.status] || 'todo',
      priority: (priorityMap as any)[serviceTask.priority] || 'medium',
      tags: ['backend', 'frontend', 'api'].slice(0, Math.floor(Math.random() * 3) + 1), // Mock tags
      subtasks: serviceTask.subtasks?.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        completed: subtask.status === 'DONE'
      })) || [],
      comments: Math.floor(Math.random() * 10),
      attachments: Math.floor(Math.random() * 5),
      estimatedHours: Math.floor(Math.random() * 16) + 4,
      actualHours: Math.floor(Math.random() * 12),
      completedAt: serviceTask.status === 'DONE' ? serviceTask.updatedAt : null
    } as any;
  };

  // Load tasks from service
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const serviceTasks = await tasksService.getMyTasks();
        const uiTasks = serviceTasks.map(transformToUITask);
        setTasks(uiTasks);
      } catch (err) {
        console.error('Failed to load tasks:', err);
        setError('Failed to load tasks. Using mock data.');
        // Fall back to mock data
        setTasks(getMockTasks());
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Mock data fallback - simplified for development
  const getMockTasks = (): UITask[] => [];

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder] - priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder];
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy]);

  const getStatusConfig = (status: UITask['status']) => {
    const statusConfigs = {
      todo: { 
        label: 'Por Hacer', 
        color: 'text-gray-600 dark:text-gray-300', 
        bg: 'bg-gray-100 dark:bg-gray-700',
        icon: ClockIcon 
      },
      in_progress: { 
        label: 'En Progreso', 
        color: 'text-electric-blue', 
        bg: 'bg-electric-blue/10',
        icon: PlayIcon 
      },
      review: { 
        label: 'En Revisión', 
        color: 'text-electric-yellow', 
        bg: 'bg-electric-yellow/10',
        icon: EyeIcon 
      },
      completed: { 
        label: 'Completada', 
        color: 'text-electric-green', 
        bg: 'bg-electric-green/10',
        icon: CheckCircleIcon 
      }
    };
    return statusConfigs[status];
  };

  const getPriorityConfig = (priority: UITask['priority']) => {
    const configs = {
      low: { label: 'Baja', color: 'text-gray-500', bg: 'bg-gray-100' },
      medium: { label: 'Media', color: 'text-electric-blue', bg: 'bg-electric-blue/10' },
      high: { label: 'Alta', color: 'text-electric-orange', bg: 'bg-electric-orange/10' },
      urgent: { label: 'Urgente', color: 'text-electric-red', bg: 'bg-electric-red/10' }
    };
    return configs[priority];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`;
    if (diffDays <= 7) return `En ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getSubtaskProgress = (subtasks: UITask['subtasks']) => {
    if (subtasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = subtasks.filter(st => st.completed).length;
    const total = subtasks.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  const handleStatusChange = async (taskId: string, newStatus: UITask['status']) => {
    // Map UI status back to service status
    const statusMapping = {
      'todo': 'TODO',
      'in_progress': 'IN_PROGRESS',
      'review': 'REVIEW',
      'completed': 'DONE'
    } as const;

    try {
      const serviceStatus = statusMapping[newStatus];
      await tasksService.updateTask(taskId, { status: serviceStatus });
      
      // Update local state optimistically
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
          : task
      ));
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Here you could show a toast notification or error message
    }
  };

  const TaskCard: React.FC<{ task: UITask }> = ({ task }) => {
    const statusKey = task.status === 'TODO' ? 'todo' : 
                     task.status === 'IN_PROGRESS' ? 'in_progress' : 
                     task.status === 'REVIEW' ? 'review' : 'completed';
    const statusConfig = getStatusConfig(statusKey);
    const priorityConfig = getPriorityConfig(task.priority);
    const StatusIcon = statusConfig.icon;
    const subtaskProgress = getSubtaskProgress(task.subtasks);
    
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
                {statusConfig.label}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.color} ${priorityConfig.bg}`}>
                {priorityConfig.label}
              </span>
              {isOverdue && (
                <span className="px-2 py-1 rounded-full text-xs font-medium text-electric-red bg-electric-red/10 flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-3 h-3" />
                  Atrasada
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {task.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {task.description}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <StarIcon className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <EllipsisHorizontalIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Project and Assignment Info */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-electric-blue"></div>
            <span className="text-gray-600 dark:text-gray-300">{task.project?.name || 'Sin proyecto'}</span>
          </div>
          {task.assignedBy && (
            <div className="flex items-center gap-2">
              <UserPlusIcon className="w-4 h-4 text-gray-400" />
              <img src={task.assignedBy.avatar || '/api/placeholder/16/16'} alt={task.assignedBy.name} className="w-4 h-4 rounded-full" />
              <span className="text-gray-600 dark:text-gray-300">Asignada por {task.assignedBy.name}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <TagIcon className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Subtasks Progress */}
        {task.subtasks.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Squares2X2Icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Subtareas ({subtaskProgress.completed}/{subtaskProgress.total})
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {subtaskProgress.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-electric-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${subtaskProgress.percentage}%` }}
              ></div>
            </div>
            <div className="mt-2 space-y-1">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    subtask.completed 
                      ? 'bg-electric-green border-electric-green' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {subtask.completed && <CheckCircleIcon className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`${subtask.completed ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Tracking */}
        {(task.estimatedHours || task.actualHours) && (
          <div className="flex items-center gap-4 mb-4 text-sm">
            {task.estimatedHours && (
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  Estimado: {task.estimatedHours}h
                </span>
              </div>
            )}
            {task.actualHours && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-300">
                  Real: {task.actualHours}h
                </span>
                {task.estimatedHours && (
                  <span className={`text-xs ${
                    task.actualHours > task.estimatedHours 
                      ? 'text-electric-red' 
                      : 'text-electric-green'
                  }`}>
                    ({task.actualHours > task.estimatedHours ? '+' : ''}{task.actualHours - task.estimatedHours}h)
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {task.dueDate && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span className={isOverdue ? 'text-electric-red font-medium' : ''}>
                  {formatDate(task.dueDate)}
                </span>
              </div>
            )}
            {task.comments > 0 && (
              <div className="flex items-center gap-2">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>{task.comments}</span>
              </div>
            )}
            {task.attachments > 0 && (
              <div className="flex items-center gap-2">
                <PaperClipIcon className="w-4 h-4" />
                <span>{task.attachments}</span>
              </div>
            )}
            {task.completedAt && (
              <span>Completada el {formatDate(task.completedAt)}</span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {task.status !== 'completed' && (
              <>
                {task.status === 'todo' && (
                  <button
                    onClick={() => handleStatusChange(task.id, 'in_progress')}
                    className="px-3 py-1 bg-electric-blue text-white rounded-md text-xs font-medium hover:bg-electric-blue/90 transition-colors flex items-center gap-1"
                  >
                    <PlayIcon className="w-3 h-3" />
                    Iniciar
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(task.id, 'review')}
                      className="px-3 py-1 bg-electric-yellow text-white rounded-md text-xs font-medium hover:bg-electric-yellow/90 transition-colors flex items-center gap-1"
                    >
                      <EyeIcon className="w-3 h-3" />
                      A Revisión
                    </button>
                    <button
                      onClick={() => handleStatusChange(task.id, 'completed')}
                      className="px-3 py-1 bg-electric-green text-white rounded-md text-xs font-medium hover:bg-electric-green/90 transition-colors flex items-center gap-1"
                    >
                      <CheckCircleIcon className="w-3 h-3" />
                      Completar
                    </button>
                  </>
                )}
                {task.status === 'review' && (
                  <button
                    onClick={() => handleStatusChange(task.id, 'completed')}
                    className="px-3 py-1 bg-electric-green text-white rounded-md text-xs font-medium hover:bg-electric-green/90 transition-colors flex items-center gap-1"
                  >
                    <CheckCircleIcon className="w-3 h-3" />
                    Completar
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mis Tareas
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Vista expandida de todas tus tareas asignadas con información detallada
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
            </div>
            <Squares2X2Icon className="w-8 h-8 text-electric-blue" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">En Progreso</p>
              <p className="text-2xl font-bold text-electric-blue">
                {tasks.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <PlayIcon className="w-8 h-8 text-electric-blue" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Por Revisar</p>
              <p className="text-2xl font-bold text-electric-yellow">
                {tasks.filter(t => t.status === 'review').length}
              </p>
            </div>
            <EyeIcon className="w-8 h-8 text-electric-yellow" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completadas</p>
              <p className="text-2xl font-bold text-electric-green">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-electric-green" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tareas por título, descripción o etiquetas..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-electric-blue focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="todo">Por hacer</option>
              <option value="in_progress">En progreso</option>
              <option value="review">En revisión</option>
              <option value="completed">Completadas</option>
            </select>

            <select
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-electric-blue focus:border-transparent"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">Todas las prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>

            <select
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-electric-blue focus:border-transparent"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="dueDate">Fecha límite</option>
              <option value="priority">Prioridad</option>
              <option value="updated">Última actualización</option>
              <option value="created">Fecha de creación</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Mostrando {filteredAndSortedTasks.length} de {tasks.length} tareas
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
          <p className="ml-3 text-gray-600 dark:text-gray-300">Cargando tareas...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-electric-red/10 border border-electric-red/20 rounded-lg p-4 mb-6">
          <p className="text-electric-red text-sm">{error}</p>
        </div>
      )}

      {/* Tasks List */}
      {!loading && (
        <div className="space-y-6">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Squares2X2Icon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No se encontraron tareas
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No tienes tareas asignadas en este momento'
              }
            </p>
          </div>
        ) : (
          filteredAndSortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
        </div>
      )}
    </div>
  );
};

export default MisTareas;