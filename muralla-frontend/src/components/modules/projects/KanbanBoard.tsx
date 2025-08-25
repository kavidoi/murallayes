import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatCard } from '../../ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { tasksService, type Task as APITask } from '../../../services/tasksService';
import { usersService } from '../../../services/usersService';
import { projectsService, type Project as APIProject } from '../../../services/projectsService';
import { User } from '../../../services/authService';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignees: User[];
  labels: Label[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  estimatedHours: number;
  actualHours?: number;
  project: string;
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
  cycleTime?: number; // in days
  timeInStatus?: { [key: string]: number }; // time spent in each status
  blockedReason?: string;
  isBlocked?: boolean;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: User;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface Comment {
  id: string;
  text: string;
  author: User;
  createdAt: string;
}

interface Column {
  id: string;
  title: string;
  status: Task['status'];
  color: string;
  limit?: number;
}

// Conversion functions
const convertAPITaskToKanbanTask = (apiTask: APITask, allUsers: User[], projects: APIProject[]): Task => {
  const assignees = apiTask.assignees?.map(assignee => {
    const user = allUsers.find(u => u.id === assignee.userId);
    return user || {
      id: assignee.userId,
      name: `${assignee.user?.firstName || ''} ${assignee.user?.lastName || ''}`.trim(),
      avatar: `${assignee.user?.firstName?.charAt(0) || ''}${assignee.user?.lastName?.charAt(0) || ''}`,
      email: assignee.user?.email || ''
    };
  }) || [];

  const project = projects.find(p => p.id === apiTask.projectId);

  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description || '',
    status: apiTask.status,
    priority: apiTask.priority,
    assignees,
    labels: [], // You might want to add labels from API if available
    dueDate: apiTask.dueDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedHours: 0, // Add if available in API
    actualHours: 0, // Add if available in API
    project: project?.name || 'Unknown Project',
    subtasks: (apiTask.subtasks || []).map(subtask => ({
      id: subtask.id,
      title: subtask.title,
      completed: subtask.status === 'DONE',
      assignee: subtask.assignee ? {
        id: subtask.assignee.id,
        name: `${subtask.assignee.firstName} ${subtask.assignee.lastName}`,
        avatar: `${subtask.assignee.firstName.charAt(0)}${subtask.assignee.lastName.charAt(0)}`,
        email: subtask.assignee.email
      } : undefined
    })),
    attachments: [], // Add if available in API
    comments: [], // Add if available in API
    cycleTime: 0, // Calculate if needed
    timeInStatus: {}, // Add if available in API
    isBlocked: false // Add if available in API
  };
};

const KanbanBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<APIProject[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [filterProject, setFilterProject] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [quickActionTask, setQuickActionTask] = useState<string | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [boardView, setBoardView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [showFilters, setShowFilters] = useState(false);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    user: User;
    action: string;
    task: string;
    timestamp: string;
  }>>([]);
  const [showActivity, setShowActivity] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const columns: Column[] = [
    { id: 'TODO', title: 'To Do', status: 'TODO', color: 'bg-electric-blue/10 dark:bg-electric-blue/5', limit: 8 },
    { id: 'IN_PROGRESS', title: 'In Progress', status: 'IN_PROGRESS', color: 'bg-electric-yellow/10 dark:bg-electric-yellow/5', limit: 5 },
    { id: 'REVIEW', title: 'Review', status: 'REVIEW', color: 'bg-electric-purple/10 dark:bg-electric-purple/5', limit: 3 },
    { id: 'DONE', title: 'Done', status: 'DONE', color: 'bg-electric-green/10 dark:bg-electric-green/5', limit: undefined }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'n':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowTaskModal(true);
          }
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            document.getElementById('search-input')?.focus();
          }
          break;
        case 'escape':
          setShowTaskModal(false);
          setSelectedTask(null);
          setSelectedTasks(new Set());
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Load data from API
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [tasksData, usersData, projectsData] = await Promise.all([
        tasksService.getAllTasks(),
        usersService.getActiveUsers(),
        projectsService.getAllProjects()
      ]);
      
      // Convert API users to local user format
      const convertedUsers: User[] = usersData.map((apiUser, index) => ({
        id: apiUser.id,
        name: `${apiUser.firstName} ${apiUser.lastName}`,
        avatar: `${apiUser.firstName.charAt(0)}${apiUser.lastName.charAt(0)}`,
        email: apiUser.email
      }));
      
      const convertedTasks = tasksData.map(task => convertAPITaskToKanbanTask(task, convertedUsers, projectsData));
      
      setTasks(convertedTasks);
      setUsers(convertedUsers);
      setProjects(projectsData);
      setActiveUsers(convertedUsers.slice(0, 4)); // Show first 4 as active
      
    } catch (err) {
      console.error('Failed to load kanban data:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-electric-red text-white';
      case 'HIGH': return 'bg-electric-red/20 text-electric-red';
      case 'MEDIUM': return 'bg-electric-yellow/20 text-electric-yellow';
      case 'LOW': return 'bg-electric-green/20 text-electric-green';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '🔥';
      case 'HIGH': return '⬆️';
      case 'MEDIUM': return '➡️';
      case 'LOW': return '⬇️';
      default: return '';
    }
  };

  const getTasksForColumn = (status: Task['status']) => {
    return tasks.filter(task => {
      const statusMatch = task.status === status;
      const projectMatch = filterProject === 'all' || task.project === filterProject;
      const assigneeMatch = filterAssignee === 'all' || task.assignees.some(a => a.id === filterAssignee);
      const searchMatch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      return statusMatch && projectMatch && assigneeMatch && searchMatch;
    });
  };

  // Bulk operations
  const handleBulkStatusChange = useCallback(async (newStatus: Task['status']) => {
    const taskIds = Array.from(selectedTasks);
    try {
      // Optimistic update
      setTasks(prev => prev.map(task => 
        selectedTasks.has(task.id) 
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
          : task
      ));
      setSelectedTasks(new Set());
      setShowBulkActions(false);

      // Update all tasks via API
      await Promise.all(
        taskIds.map(taskId => tasksService.updateTask(taskId, { status: newStatus }))
      );
      console.log(`${taskIds.length} tasks updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating task statuses:', error);
      // Reload data to ensure consistency
      loadData();
      setError('Failed to update task statuses');
    }
  }, [selectedTasks, loadData]);

  const handleTaskSelection = useCallback((taskId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      setSelectedTasks(prev => {
        const newSet = new Set(prev);
        if (newSet.has(taskId)) {
          newSet.delete(taskId);
        } else {
          newSet.add(taskId);
        }
        return newSet;
      });
    }
  }, []);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDraggedOver(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = async (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (draggedTask) {
      try {
        // Optimistic update
        setTasks(prev => prev.map(task => 
          task.id === draggedTask.id 
            ? { ...task, status, updatedAt: new Date().toISOString() }
            : task
        ));
        setDraggedTask(null);
        setDraggedOver(null);

        // Update via API
        await tasksService.updateTask(draggedTask.id, { status });
        console.log(`Tarea "${draggedTask.title}" movida a ${status}`);
      } catch (error) {
        console.error('Error updating task status:', error);
        // Revert optimistic update
        setTasks(prev => prev.map(task => 
          task.id === draggedTask.id 
            ? { ...task, status: draggedTask.status }
            : task
        ));
        setError('Failed to update task status');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Vencido hace ${Math.abs(diffDays)} días`;
    if (diffDays === 0) return 'Vence hoy';
    if (diffDays === 1) return 'Vence mañana';
    return `Vence en ${diffDays} días`;
  };

  const getCompletedSubtasks = (subtasks: Subtask[]) => {
    return subtasks.filter(st => st.completed).length;
  };

  const calculateProgress = (subtasks: Subtask[]) => {
    if (subtasks.length === 0) return 0;
    return (getCompletedSubtasks(subtasks) / subtasks.length) * 100;
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Board Intelligence - Calculate advanced metrics
  const calculateCycleTime = (task: Task): number => {
    const created = new Date(task.createdAt);
    const updated = new Date(task.updatedAt);
    return Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getBottlenecks = (): { columnId: string; severity: 'low' | 'medium' | 'high' }[] => {
    return columns.map(column => {
      const columnTasks = getTasksForColumn(column.status);
      const avgTimeInColumn = columnTasks.reduce((acc, task) => {
        return acc + calculateCycleTime(task);
      }, 0) / (columnTasks.length || 1);
      
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (avgTimeInColumn > 7) severity = 'high';
      else if (avgTimeInColumn > 3) severity = 'medium';
      
      return { columnId: column.id, severity };
    });
  };

  const bottlenecks = getBottlenecks();

  // Calculate metrics
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const overdueTasks = tasks.filter(t => t.dueDate && isOverdue(t.dueDate)).length;
  const blockedTasks = tasks.filter(t => t.isBlocked).length;
  const avgCycleTime = tasks.filter(t => t.status === 'DONE').reduce((acc, task) => {
    return acc + calculateCycleTime(task);
  }, 0) / (doneTasks || 1);

  // Progress Ring Component
  const ProgressRing = ({ progress, size = 40, strokeWidth = 3 }: { progress: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;
    
    return (
      <div className="relative inline-block">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset="0"
            strokeLinecap="round"
            className="text-electric-blue transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    );
  };

  // Loading Skeleton Component
  const TaskSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse">
        <div className="flex justify-between items-start mb-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex -space-x-1">
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-6" style={{ minWidth: '1200px' }}>
            {[...Array(5)].map((_, colIndex) => (
              <div key={colIndex} className="flex-1 min-w-80 rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                <div className="animate-pulse mb-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, taskIndex) => (
                    <TaskSkeleton key={taskIndex} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" ref={boardRef}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📋 Tablero Kanban</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestión visual de tareas y flujo de trabajo
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[
                { key: 'kanban', icon: '📋', label: 'Kanban' },
                { key: 'list', icon: '📝', label: 'Lista' },
                { key: 'calendar', icon: '📅', label: 'Calendario' }
              ].map(view => (
                <button
                  key={view.key}
                  onClick={() => setBoardView(view.key as any)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    boardView === view.key
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={view.label}
                >
                  {view.icon}
                </button>
              ))}
            </div>

            {/* Active Users */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {activeUsers.slice(0, 4).map((user, index) => (
                  <div
                    key={user.id}
                    className="relative w-8 h-8 rounded-full bg-electric-blue text-white flex items-center justify-center text-sm font-medium border-2 border-white dark:border-gray-800"
                    title={`${user.name} está activo`}
                  >
                    {user.avatar}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-electric-green rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                ))}
                {activeUsers.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center text-sm font-medium border-2 border-white dark:border-gray-800">
                    +{activeUsers.length - 4}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowActivity(!showActivity)}
                className="btn-outline flex items-center gap-2 relative"
                title="Actividad reciente"
              >
                📊 Actividad
                {recentActivity.length > 0 && (
                  <span className="w-2 h-2 bg-electric-blue rounded-full"></span>
                )}
              </button>
            </div>

            <button 
              onClick={() => setShowTaskModal(true)}
              className="btn-electric flex items-center gap-2"
              title="Nueva Tarea (Ctrl+N)"
            >
              ➕ Nueva Tarea
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <input
              id="search-input"
              type="text"
              placeholder="Buscar tareas... (Ctrl+F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-outline flex items-center gap-2 ${showFilters ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            >
              🔧 Filtros
              {(filterProject !== 'all' || filterAssignee !== 'all') && (
                <span className="w-2 h-2 bg-electric-blue rounded-full"></span>
              )}
            </button>

            {selectedTasks.size > 0 && (
              <div className="flex items-center gap-2 bg-electric-blue/10 dark:bg-electric-blue/5 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-electric-blue">
                  {selectedTasks.size} seleccionadas
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="btn-sm bg-electric-blue text-white hover:bg-electric-blue/90"
                >
                  Acciones
                </button>
                <button
                  onClick={() => setSelectedTasks(new Set())}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions Dropdown */}
        {showBulkActions && selectedTasks.size > 0 && (
          <div className="bulk-actions-dropdown absolute z-10 right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="py-1">
              <button
                onClick={() => handleBulkStatusChange('TODO')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Mover a To Do
              </button>
              <button
                onClick={() => handleBulkStatusChange('IN_PROGRESS')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Mover a En Progreso
              </button>
              <button
                onClick={() => handleBulkStatusChange('REVIEW')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Mover a Revisión
              </button>
              <button
                onClick={() => handleBulkStatusChange('DONE')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Mover a Terminado
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Tareas"
          value={totalTasks}
          subtitle={`${doneTasks} completadas`}
          color="electric-blue"
        />
        <StatCard
          title="En Progreso"
          value={inProgressTasks}
          subtitle="tareas activas"
          color="electric-yellow"
        />
        <StatCard
          title="Completadas"
          value={doneTasks}
          subtitle={`${Math.round((doneTasks / totalTasks) * 100)}% del total`}
          color="electric-green"
        />
        <StatCard
          title="Vencidas"
          value={overdueTasks}
          subtitle="requieren atención"
          color="electric-red"
        />
        <StatCard
          title="Bloqueadas"
          value={blockedTasks}
          subtitle="necesitan resolución"
          color="electric-purple"
        />
        <StatCard
          title="Tiempo Ciclo"
          value={`${Math.round(avgCycleTime)}d`}
          subtitle="promedio"
          color="electric-cyan"
        />
      </div>

      {/* Intelligence Insights */}
      {(bottlenecks.some(b => b.severity !== 'low') || blockedTasks > 0) && (
        <Card className="border-l-4 border-l-electric-yellow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🧠</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Insights del Tablero</h3>
                <div className="space-y-2">
                  {bottlenecks.filter(b => b.severity !== 'low').map(bottleneck => {
                    const column = columns.find(c => c.id === bottleneck.columnId);
                    return (
                      <div key={bottleneck.columnId} className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${
                          bottleneck.severity === 'high' ? 'bg-electric-red' : 'bg-electric-yellow'
                        }`}></span>
                        <span className="text-gray-700 dark:text-gray-300">
                          Posible cuello de botella en <strong>{column?.title}</strong> 
                          {bottleneck.severity === 'high' && ' - Requiere atención urgente'}
                        </span>
                      </div>
                    );
                  })}
                  {blockedTasks > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-electric-red"></span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {blockedTasks} tarea{blockedTasks > 1 ? 's' : ''} bloqueada{blockedTasks > 1 ? 's' : ''} necesita{blockedTasks === 1 ? '' : 'n'} resolución
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proyecto
                </label>
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="input transition-colors"
                >
                  <option value="all">Todos los proyectos</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.name}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Asignado a
                </label>
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="input transition-colors"
                >
                  <option value="all">Todos los usuarios</option>
                  {users.filter(user => user.email !== 'admin@murallacafe.cl').map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterProject('all');
                    setFilterAssignee('all');
                    setSearchQuery('');
                  }}
                  className="btn-outline flex items-center gap-2"
                >
                  🔄 Limpiar
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="kanban-board flex gap-6 pb-6" style={{ minWidth: '1200px' }}>
          {columns.map((column) => {
            const columnTasks = getTasksForColumn(column.status);
            const isOverLimit = column.limit && columnTasks.length > column.limit;
            const isDragTarget = draggedOver === column.id;
            
            return (
              <div
                key={column.id}
                className={`kanban-column flex-1 min-w-80 rounded-lg transition-all duration-200 ${column.color} p-4 ${
                  isDragTarget 
                    ? 'column-drag-over' 
                    : draggedTask ? 'opacity-50' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {column.title}
                    </h3>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      isOverLimit 
                        ? 'bg-electric-red/20 text-electric-red' 
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {columnTasks.length}
                      {column.limit && ` / ${column.limit}`}
                    </span>
                    {/* Bottleneck Indicator */}
                    {(() => {
                      const bottleneck = bottlenecks.find(b => b.columnId === column.id);
                      if (bottleneck?.severity === 'high') {
                        return <span className="ml-2 text-electric-red text-sm" title="Cuello de botella detectado">🔥</span>;
                      }
                      if (bottleneck?.severity === 'medium') {
                        return <span className="ml-2 text-electric-yellow text-sm" title="Posible cuello de botella">⚠️</span>;
                      }
                      return null;
                    })()}
                  </div>
                  {isOverLimit && (
                    <span className="text-electric-red text-sm">⚠️</span>
                  )}
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                      <div className="text-4xl mb-2">🎯</div>
                      <p className="text-sm">No hay tareas aquí</p>
                      <p className="text-xs">Arrastra una tarea o crea una nueva</p>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const isSelected = selectedTasks.has(task.id);
                      const progress = calculateProgress(task.subtasks);
                      
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onClick={(e) => {
                            handleTaskSelection(task.id, e);
                            if (!e.ctrlKey && !e.metaKey) {
                              setSelectedTask(task);
                              setShowTaskModal(true);
                            }
                          }}
                          onMouseEnter={() => setQuickActionTask(task.id)}
                          onMouseLeave={() => setQuickActionTask(null)}
                          className={`task-card group relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border-2 cursor-pointer ${
                            isSelected 
                              ? 'border-electric-blue bg-electric-blue/5 dark:bg-electric-blue/10' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          } ${draggedTask?.id === task.id ? 'task-card-dragging' : ''}`}
                        >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                          {task.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ml-2 ${getPriorityColor(task.priority)}`}>
                          {getPriorityIcon(task.priority)}
                        </span>
                      </div>

                      {/* Labels */}
                      {task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {task.labels.map((label) => (
                            <span
                              key={label.id}
                              className={`px-2 py-1 text-xs rounded ${label.color}`}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      )}

                          {/* Quick Actions */}
                          {quickActionTask === task.id && (
                            <div className="quick-actions absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Quick assign logic
                                }}
                                className="quick-action-btn w-6 h-6 bg-electric-blue text-white rounded text-xs hover:bg-electric-blue/90 transition-colors"
                                title="Asignar rápido"
                              >
                                👤
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Quick priority toggle
                                }}
                                className="quick-action-btn w-6 h-6 bg-electric-yellow text-white rounded text-xs hover:bg-electric-yellow/90 transition-colors"
                                title="Cambiar prioridad"
                              >
                                ⚡
                              </button>
                            </div>
                          )}

                          {/* Selection Indicator */}
                          {isSelected && (
                            <div className="absolute top-2 left-2">
                              <div className="w-4 h-4 bg-electric-blue rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            </div>
                          )}

                      {/* Progress Ring */}
                      {task.subtasks.length > 0 && (
                        <div className="mb-2 flex items-center gap-3">
                          <ProgressRing progress={progress} size={32} />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Subtareas</span>
                              <span>{getCompletedSubtasks(task.subtasks)} / {task.subtasks.length}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {progress === 100 ? '¡Completado!' : `${Math.round(progress)}% completado`}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Due Date & Time Indicators */}
                      <div className="space-y-1 mb-2">
                        {task.dueDate && (
                          <div className={`text-xs ${
                            isOverdue(task.dueDate) 
                              ? 'text-electric-red' 
                              : 'text-gray-500'
                          }`}>
                            📅 {formatDate(task.dueDate)}
                          </div>
                        )}
                        {task.cycleTime && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            ⏱️ {task.cycleTime} días en ciclo
                          </div>
                        )}
                        {task.isBlocked && (
                          <div className="text-xs text-electric-red flex items-center gap-1">
                            🚫 Bloqueada {task.blockedReason && `- ${task.blockedReason}`}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        {/* Assignees */}
                        <div className="flex -space-x-2">
                          {task.assignees.slice(0, 3).map((assignee) => (
                            <div
                              key={assignee.id}
                              className="w-6 h-6 rounded-full bg-electric-blue text-white flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800"
                              title={assignee.name}
                            >
                              {assignee.avatar}
                            </div>
                          ))}
                          {task.assignees.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800">
                              +{task.assignees.length - 3}
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center text-xs text-gray-500">
                          {task.comments.length > 0 && (
                            <span className="mr-2">💬 {task.comments.length}</span>
                          )}
                          {task.attachments.length > 0 && (
                            <span>📎 {task.attachments.length}</span>
                          )}
                        </div>
                      </div>
                    </div>
                      );
                    })
                  )}
                </div>

                {/* Add Task Button */}
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="w-full mt-3 p-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  ➕ Agregar tarea
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedTask ? 'Editar Tarea' : 'Nueva Tarea'}
              </h3>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedTask(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {selectedTask ? (
              /* Task Details View */
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedTask.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedTask.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado
                    </label>
                    <select className="input">
                      <option value={selectedTask.status}>{selectedTask.status}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prioridad
                    </label>
                    <select className="input">
                      <option value={selectedTask.priority}>{selectedTask.priority}</option>
                    </select>
                  </div>
                </div>

                {/* Subtasks */}
                {selectedTask.subtasks.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                      Subtareas ({getCompletedSubtasks(selectedTask.subtasks)} / {selectedTask.subtasks.length})
                    </h5>
                    <div className="space-y-2">
                      {selectedTask.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <input 
                            type="checkbox" 
                            checked={subtask.completed}
                            className="mr-3 text-electric-blue rounded"
                            readOnly
                          />
                          <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {subtask.title}
                          </span>
                          {subtask.assignee && (
                            <span className="text-xs text-gray-500">{subtask.assignee.name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                {selectedTask.comments.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                      Comentarios
                    </h5>
                    <div className="space-y-3">
                      {selectedTask.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="w-8 h-8 rounded-full bg-electric-blue text-white flex items-center justify-center text-sm font-medium mr-3">
                            {comment.author.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="font-medium text-gray-900 dark:text-white text-sm">{comment.author.name}</span>
                              <span className="ml-2 text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="btn-electric flex-1">
                    Guardar Cambios
                  </button>
                  <button 
                    onClick={() => {
                      setShowTaskModal(false);
                      setSelectedTask(null);
                    }}
                    className="btn-outline"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              /* New Task Form */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Título *
                  </label>
                  <input type="text" className="input" placeholder="Título de la tarea" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea className="input h-20 resize-none" placeholder="Describe la tarea..."></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Proyecto
                    </label>
                    <select className="input">
                      {projects.map(project => (
                        <option key={project.id} value={project.name}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prioridad
                    </label>
                    <select className="input">
                      <option value="LOW">Baja</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha límite
                    </label>
                    <input type="date" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Horas estimadas
                    </label>
                    <input type="number" className="input" placeholder="8" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn-electric flex-1">
                    Crear Tarea
                  </button>
                  <button 
                    onClick={() => setShowTaskModal(false)}
                    className="btn-outline"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Sidebar */}
      {showActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50">
          <div className="activity-sidebar bg-white dark:bg-gray-800 h-full w-80 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actividad Reciente</h3>
              <button
                onClick={() => setShowActivity(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-4 max-h-full overflow-y-auto">
              {/* Active Users Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Usuarios Activos ({activeUsers.length})
                </h4>
                <div className="space-y-2">
                  {activeUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-electric-blue text-white flex items-center justify-center text-sm font-medium">
                          {user.avatar}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-electric-green rounded-full border-2 border-white dark:border-gray-800"></div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-gray-500">Activo ahora</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Actividad Reciente
                </h4>
                <div className="space-y-3">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-electric-purple text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {activity.user.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{activity.user.name}</span>
                          {' '}{activity.action}{' '}
                          <span className="font-medium">{activity.task}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-electric-blue/10 dark:bg-electric-blue/5 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estadísticas del Día
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-lg font-semibold text-electric-blue">{tasks.filter(t => t.status === 'DONE').length}</div>
                    <div className="text-gray-500">Completadas</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-electric-yellow">{inProgressTasks}</div>
                    <div className="text-gray-500">En Progreso</div>
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

export default KanbanBoard;