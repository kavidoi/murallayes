import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useEditingStatus } from '../../../hooks/useEditingStatus';
import { useConflictResolution } from '../../../hooks/useConflictResolution';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { ConflictResolutionModal } from '../../common/ConflictResolutionModal';
import { EditingIndicator } from '../../common/EditingIndicator';
import DatePicker from '../../ui/DatePicker';
import { formatDateDDMMYYYY, isoToDDMMYYYY, dateToISO } from '../../../utils/dateUtils';
import { User } from '../../../services/authService';

interface Project {
  id: string;
  name: string;
}

type Status = 'New' | 'In Progress' | 'Completed' | 'Overdue';

interface Task {
  id: string;
  name: string;
  status: Status;
  assigneeIds: string[];
  dueDate?: string | null; // DD/MM/YYYY format
  expanded?: boolean;
  subtasks: any[];
  order: number;
  projectId?: string;
  projectName?: string;
}

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => Promise<void>;
  task: Task;
  users: User[];
  projects: Project[];
  version?: string;
}

// User Avatar Component
const UserAvatar: React.FC<{ user: User; size?: 'sm' | 'md' }> = ({ user, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  return (
    <div 
      className={`${sizeClasses} ${user.color} rounded-full flex items-center justify-center text-white font-medium shadow-sm`}
      title={user.name}
    >
      {user.initials}
    </div>
  );
};

// Multi-assignee selector for modal
const AssigneeSelector: React.FC<{
  selectedUserIds: string[]
  users: User[]
  onSelectionChange: (userIds: string[]) => void
  disabled?: boolean
}> = ({ selectedUserIds, users, onSelectionChange, disabled }) => {
  const availableUsers = users.filter(user => user.email !== 'admin@murallacafe.cl')
  const selectedUsers = availableUsers.filter(u => selectedUserIds.includes(u.id))
  
  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter(id => id !== userId))
    } else {
      onSelectionChange([...selectedUserIds, userId])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedUsers.map(user => (
          <div key={user.id} className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
            <UserAvatar user={user} size="sm" />
            <span className="text-sm font-medium">{user.name}</span>
            <button
              onClick={() => toggleUser(user.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={disabled}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
        <div className="p-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asignar usuarios:</p>
          <div className="space-y-1">
            {availableUsers.map(user => (
              <label key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                  disabled={disabled}
                  className="rounded border-gray-300"
                />
                <UserAvatar user={user} size="sm" />
                <span className="text-sm">{user.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  users,
  projects,
  version: initialVersion
}) => {
  const { t } = useTranslation();
  const { broadcastDataChange } = useWebSocket();
  
  // Local editing state
  const [formData, setFormData] = useState<Task>(task);
  const [originalData] = useState<Task>(task); // Keep original for conflict detection
  const [currentVersion, setCurrentVersion] = useState(initialVersion || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Real-time collaboration hooks
  const {
    isEditing,
    startEditing,
    stopEditing,
    refreshEditingStatus,
    otherUsersEditing,
    isOthersEditing,
  } = useEditingStatus({
    resource: 'task',
    resourceId: task.id,
    autoStart: true,
  });

  const {
    currentConflict,
    isConflictModalOpen,
    checkForConflicts,
    handleConflictResolve,
    handleConflictClose,
  } = useConflictResolution({
    onConflictResolved: async (resolvedData) => {
      // Apply resolved changes and save
      const updatedTask = {
        ...formData,
        ...resolvedData.resolvedFields,
      };
      setFormData(updatedTask);
      await handleSave(updatedTask, true); // Skip conflict check since we just resolved
    },
    onConflictIgnored: () => {
      // User chose to ignore conflict, stop editing
      stopEditing();
      onClose();
    }
  });

  // Field labels for conflict resolution
  const fieldLabels = {
    name: 'Nombre de la Tarea',
    status: 'Estado',
    assigneeIds: 'Usuarios Asignados',
    dueDate: 'Fecha de Vencimiento',
    projectId: 'Proyecto',
  };

  // Update form data and broadcast changes
  const handleInputChange = (field: keyof Task, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Broadcast data change to detect conflicts
      broadcastDataChange('task', task.id, updated, currentVersion);
      
      // Refresh editing status to show we're still active
      refreshEditingStatus();
      
      return updated;
    });
  };

  // Status options and colors
  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'New': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const statusOptions: Status[] = ['New', 'In Progress', 'Completed'];

  // Save handler
  const handleSave = async (taskData: Task = formData, skipConflictCheck = false) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Check for conflicts before saving (unless we just resolved them)
      if (!skipConflictCheck) {
        const hasConflicts = await checkForConflicts(
          'task',
          task.id,
          originalData,
          taskData,
          fieldLabels
        );

        if (hasConflicts) {
          setIsSaving(false);
          return; // Conflict resolution modal will handle the rest
        }
      }

      // Save the task
      await onSave(taskData);
      
      // Stop editing status
      stopEditing();
      
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      setSaveError('Error al guardar la tarea. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    stopEditing();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Editar Tarea
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {task.name}
                  </p>
                </div>
                
                {/* Real-time collaboration status */}
                {isOthersEditing && (
                  <div className="ml-4">
                    <EditingIndicator 
                      users={otherUsersEditing}
                      className="bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-700"
                    />
                  </div>
                )}
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Conflict Warning */}
            {isOthersEditing && (
              <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Cuidado: Edición Simultánea
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {otherUsersEditing.length === 1 
                        ? `${otherUsersEditing[0].name || otherUsersEditing[0].email} también está editando esta tarea.`
                        : `${otherUsersEditing.length} personas están editando esta tarea.`
                      } Los cambios pueden entrar en conflicto.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Error */}
            {saveError && (
              <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700">
                <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
              </div>
            )}

            {/* Form Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-6">
                {/* Task Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la Tarea
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Nombre de la tarea"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as Status)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Project */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Proyecto
                    </label>
                    <select
                      value={formData.projectId || ''}
                      onChange={(e) => handleInputChange('projectId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Sin proyecto</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Vencimiento
                  </label>
                  <DatePicker
                    value={formData.dueDate || ''}
                    onChange={(date) => handleInputChange('dueDate', date)}
                    placeholder="Seleccionar fecha de vencimiento"
                    className="w-full"
                  />
                </div>

                {/* Assignees */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Usuarios Asignados
                  </label>
                  <AssigneeSelector
                    selectedUserIds={formData.assigneeIds}
                    users={users}
                    onSelectionChange={(assigneeIds) => handleInputChange('assigneeIds', assigneeIds)}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? 'Editando...' : 'Listo para guardar'}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isSaving
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      <AnimatePresence>
        {isConflictModalOpen && currentConflict && (
          <ConflictResolutionModal
            isOpen={isConflictModalOpen}
            onClose={handleConflictClose}
            onResolve={handleConflictResolve}
            resourceName={currentConflict.resourceName}
            conflicts={currentConflict.conflicts}
            currentUser="Tú"
            conflictingUser={currentConflict.conflictingUser.name || currentConflict.conflictingUser.email}
          />
        )}
      </AnimatePresence>
    </>
  );
};