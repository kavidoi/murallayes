import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { MobileTask, TaskStatus, User, Project } from '../../types';
import { tasksService, type Task as APITask } from '../../services/tasksService';
import { projectsService } from '../../services/projectsService';
import { isoToDDMMYYYY } from '../../utils/dateUtils';

interface MobileTasksListProps {
  className?: string;
}

const MobileTasksList: React.FC<MobileTasksListProps> = ({ className = '' }) => {
  const [tasks, setTasks] = useState<MobileTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MobileTask | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Convert API Task to Mobile Task
  const convertAPITaskToMobileTask = (apiTask: APITask, projects: Project[]): MobileTask => {
    const project = projects.find(p => p.id === apiTask.projectId);
    const taskDueDate = isoToDDMMYYYY(apiTask.dueDate);
    
    // Convert status
    let status: TaskStatus = 'TODO';
    if (apiTask.status === 'DONE') status = 'DONE';
    else if (apiTask.status === 'IN_PROGRESS' || apiTask.status === 'REVIEW') status = 'IN_PROGRESS';
    else if (apiTask.status === 'TODO') status = 'TODO';

    // Get assignees
    const assignees: User[] = [];
    if (apiTask.assignees && apiTask.assignees.length > 0) {
      assignees.push(...apiTask.assignees.map(a => a.user));
    } else if (apiTask.assignee) {
      assignees.push(apiTask.assignee);
    }

    return {
      id: apiTask.id,
      title: apiTask.title,
      description: apiTask.description,
      status,
      priority: apiTask.priority,
      projectId: apiTask.projectId,
      projectName: project?.name,
      assignees,
      dueDate: taskDueDate,
      subtasks: [],
      order: apiTask.orderIndex,
      createdAt: apiTask.createdAt,
      updatedAt: apiTask.updatedAt,
    };
  };

  // Load data
  const loadTasks = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const [tasksData, projectsData] = await Promise.all([
        tasksService.getAllTasks(),
        projectsService.getAllProjects()
      ]);

      setProjects(projectsData);
      const mobileTasks = tasksData.map(task => convertAPITaskToMobileTask(task, projectsData));
      setTasks(mobileTasks);
      setError(null);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Error al cargar las tareas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Handle task updates
  const handleTaskUpdate = async (taskId: string, updates: Partial<MobileTask>) => {
    // Optimistic update
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updates };
      }
      // Check subtasks
      if (task.subtasks.some(st => st.id === taskId)) {
        return {
          ...task,
          subtasks: task.subtasks.map(st => 
            st.id === taskId ? { ...st, ...updates } : st
          )
        };
      }
      return task;
    }));

    try {
      // API update
      const apiUpdates: any = {};
      if ('title' in updates) apiUpdates.title = updates.title;
      if ('status' in updates) {
        switch (updates.status) {
          case 'IN_PROGRESS': apiUpdates.status = 'IN_PROGRESS'; break;
          case 'DONE': apiUpdates.status = 'DONE'; break;
          default: apiUpdates.status = 'TODO'; break;
        }
      }

      if (Object.keys(apiUpdates).length > 0) {
        await tasksService.updateTask(taskId, apiUpdates);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      // Revert optimistic update
      loadTasks(false);
    }
  };


  // Handle add task
  const handleAddTask = async () => {
    try {
      const defaultProject = await projectsService.getOrCreateDefaultProject();
      const newTask = await tasksService.createTask({
        title: 'Nueva tarea',
        status: 'PENDING',
        projectId: defaultProject.id
      });
      
      const mobileTask = convertAPITaskToMobileTask(newTask, projects);
      setTasks(prev => [mobileTask, ...prev]);
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Error al crear la tarea');
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'All' && task.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [tasks, searchTerm, statusFilter]);

  // Modal handlers
  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: MobileTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleTaskSaved = (savedTask: MobileTask) => {
    if (editingTask) {
      // Update existing task
      setTasks(prev => prev.map(task => 
        task.id === savedTask.id ? savedTask : task
      ));
    } else {
      // Add new task
      setTasks(prev => [savedTask, ...prev]);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleToggleExpanded = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, expanded: !task.expanded }
        : task
    ));
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-500">Cargando tareas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => loadTasks()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="safe-top bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
            <p className="text-sm text-gray-500">
              {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FunnelIcon className="w-6 h-6" />
            </button>
            <Button onClick={handleCreateTask} size="sm">
              <PlusIcon className="w-4 h-4 mr-1" />
              Nueva
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'All')}
                  className="input-field text-sm"
                >
                  <option value="All">Todos los estados</option>
                  <option value="New">Nuevo</option>
                  <option value="In Progress">En Progreso</option>
                  <option value="Completed">Completado</option>
                  <option value="Overdue">Vencido</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {/* Pull to refresh indicator */}
        {refreshing && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tareas</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm || statusFilter !== 'All' 
                ? 'No se encontraron tareas con los filtros aplicados'
                : 'Crea tu primera tarea para comenzar'
              }
            </p>
            {(!searchTerm && statusFilter === 'All') && (
              <Button onClick={handleAddTask}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Crear primera tarea
              </Button>
            )}
          </div>
        ) : (
          <div className="px-4 py-2 space-y-1">
            <AnimatePresence>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskUpdate={handleTaskUpdate}
                  onToggleExpanded={handleToggleExpanded}
                  onEditTask={handleEditTask}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Safe bottom padding */}
      <div className="safe-bottom" />

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskSaved={handleTaskSaved}
        task={editingTask}
      />
    </div>
  );
};

export default MobileTasksList;
