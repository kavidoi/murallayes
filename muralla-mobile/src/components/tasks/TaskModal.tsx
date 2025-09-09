import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import type { MobileTask, TaskStatus, Project } from '../../types';
import { tasksService } from '../../services/tasksService';
import { projectsService } from '../../services/projectsService';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSaved: (task: MobileTask) => void;
  task?: MobileTask | null; // null for new task, MobileTask for editing
  projectId?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onTaskSaved,
  task,
  projectId
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    dueDate: '',
    projectId: projectId || '',
  });
  
  const [subtasks, setSubtasks] = useState<Array<{ title: string; tempId: string }>>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await projectsService.getAllProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        projectId: task.projectId,
      });
      
      // Load existing subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        setSubtasks(task.subtasks.map(subtask => ({
          title: subtask.title,
          tempId: subtask.id
        })));
      } else {
        setSubtasks([]);
      }
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        status: 'PENDING' as TaskStatus,
        priority: 'MEDIUM',
        dueDate: '',
        projectId: projectId || '',
      });
      setSubtasks([]);
    }
    setNewSubtask('');
  }, [task?.id, projectId, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks(prev => [
        ...prev,
        { title: newSubtask.trim(), tempId: `temp-${Date.now()}` }
      ]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (tempId: string) => {
    setSubtasks(prev => prev.filter(st => st.tempId !== tempId));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      return;
    }

    setSaving(true);
    try {
      let savedTask: MobileTask;

      if (task) {
        // Update existing task
        const updateData = {
          title: formData.title,
          description: formData.description,
          status: (formData.status === 'TODO' ? 'PENDING' : formData.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'DONE') as 'PENDING' | 'IN_PROGRESS' | 'DONE',
          priority: formData.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
          dueDate: formData.dueDate || undefined,
          projectId: formData.projectId,
        };

        await tasksService.updateTask(task.id, updateData);
        
        // Handle subtasks separately if needed
        // For now, we'll just return the updated task
        savedTask = {
          ...task,
          title: updateData.title,
          description: updateData.description,
          status: formData.status,
          priority: formData.priority,
          dueDate: updateData.dueDate,
          projectId: updateData.projectId,
          subtasks: subtasks.map(st => ({
            id: st.tempId.startsWith('temp-') ? `new-${Date.now()}-${Math.random()}` : st.tempId,
            title: st.title,
            status: 'TODO' as TaskStatus,
            priority: 'MEDIUM',
            parentId: task.id,
            projectId: formData.projectId,
            assignees: [],
            subtasks: [],
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        };
      } else {
        // Create new task
        const newTaskData = {
          title: formData.title,
          description: formData.description,
          status: formData.status.toUpperCase() as 'PENDING' | 'IN_PROGRESS' | 'DONE',
          priority: formData.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
          dueDate: formData.dueDate || null,
          projectId: formData.projectId,
        };

        const createdTask = await tasksService.createTask(newTaskData);
        
        savedTask = {
          id: createdTask.id,
          title: createdTask.title,
          description: createdTask.description,
          status: createdTask.status,
          priority: createdTask.priority,
          dueDate: createdTask.dueDate,
          projectId: createdTask.projectId,
          assignees: (createdTask.assignees || []).map(assignee => assignee.user),
          order: 0,
          subtasks: subtasks.map(st => ({
            id: `new-${Date.now()}-${Math.random()}`,
            title: st.title,
            status: 'TODO' as TaskStatus,
            priority: 'MEDIUM',
            parentId: createdTask.id,
            projectId: formData.projectId,
            assignees: [],
            subtasks: [],
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
          createdAt: createdTask.createdAt,
          updatedAt: createdTask.updatedAt,
        };
      }

      onTaskSaved(savedTask);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: '100%', scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: '100%', scale: 0.95 }}
          className="relative w-full max-w-lg mx-4 bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {task ? 'Editar Tarea' : 'Nueva Tarea'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  placeholder="Ingresa el título de la tarea"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-transparent resize-none"
                  placeholder="Descripción opcional"
                />
              </div>

              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proyecto
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => handleInputChange('projectId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                >
                  <option value="">Seleccionar proyecto</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status and Priority Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-transparent ${getStatusColor(formData.status)}`}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-transparent ${getPriorityColor(formData.priority)}`}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                />
              </div>

              {/* Subtasks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtareas
                </label>
                
                {/* Existing subtasks */}
                {subtasks.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {subtasks.map((subtask) => (
                      <div key={subtask.tempId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className="flex-1 text-sm">{subtask.title}</span>
                        <button
                          onClick={() => removeSubtask(subtask.tempId)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new subtask */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                    placeholder="Nueva subtarea"
                  />
                  <button
                    onClick={addSubtask}
                    disabled={!newSubtask.trim()}
                    className="px-3 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                loading={saving}
                disabled={!formData.title.trim() || saving}
              >
                {task ? 'Actualizar' : 'Crear'} Tarea
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskModal;
