import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { MobileTask, TaskStatus } from '../../types';
import { isOverdue, isToday, getRelativeTime } from '../../utils/dateUtils';

interface TaskCardProps {
  task: MobileTask;
  onTaskUpdate: (taskId: string, updates: Partial<MobileTask>) => void;
  onToggleExpanded?: (taskId: string) => void;
  onEditTask?: (task: MobileTask) => void;
  isSubtask?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onTaskUpdate,
  onToggleExpanded,
  onEditTask,
  isSubtask = false
}) => {
  const getStatusColor = () => {
    switch (task.status) {
      case 'TODO': return 'status-new';
      case 'IN_PROGRESS': return 'status-progress';
      case 'DONE': return 'status-completed';
      case 'REVIEW': return 'status-progress';
      default: return 'status-new';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getDueDateColor = () => {
    if (!task.dueDate) return 'text-gray-400';
    if (isOverdue(task.dueDate)) return 'text-red-600';
    if (isToday(task.dueDate)) return 'text-amber-600';
    return 'text-gray-600';
  };

  const formatDueDate = () => {
    if (!task.dueDate) return 'Sin fecha';
    const relative = getRelativeTime(task.dueDate);
    return relative || task.dueDate;
  };

  const handleStatusChange = (status: TaskStatus) => {
    onTaskUpdate(task.id, { status });
  };

  const handleTitleChange = (title: string) => {
    onTaskUpdate(task.id, { title });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`task-card ${isSubtask ? 'ml-6 bg-gray-50' : ''}`}
    >
      {/* Main Task Content */}
      <div className="flex items-start gap-3">
        {/* Priority Indicator */}
        <div className={`w-1 h-16 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0`} />
        
        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Expand/Collapse Button */}
              {!isSubtask && task.subtasks.length > 0 && (
                <button
                  onClick={() => onToggleExpanded?.(task.id)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {task.expanded ? (
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              )}
              
              {/* Task Title */}
              <input
                type="text"
                value={task.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="flex-1 text-base font-medium bg-transparent border-none outline-none focus:bg-white focus:border focus:border-electric-blue focus:rounded-md focus:px-2 focus:py-1 transition-all"
                placeholder="Nombre de la tarea"
              />
            </div>
            
            {/* Edit Button */}
            <button
              onClick={() => onEditTask?.(task)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          {/* Status and Due Date Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Status Badge */}
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className={`status-badge ${getStatusColor()} border-none outline-none cursor-pointer`}
              >
                <option value="TODO">Nuevo</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="DONE">Completado</option>
              </select>
              
              {/* Project Name */}
              {task.projectName && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                  {task.projectName}
                </span>
              )}
            </div>
            
            {/* Due Date */}
            <span className={`text-xs font-medium ${getDueDateColor()}`}>
              {formatDueDate()}
            </span>
          </div>

          {/* Assignees Row */}
          {task.assignees.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Asignado a:</span>
              <div className="flex -space-x-1">
                {task.assignees.slice(0, 3).map((assignee) => (
                  <div
                    key={assignee.id}
                    className="w-6 h-6 bg-electric-blue rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                    title={assignee.firstName && assignee.lastName ? `${assignee.firstName} ${assignee.lastName}` : assignee.username || assignee.email}
                  >
                    {assignee.firstName && assignee.lastName 
                      ? `${assignee.firstName[0]}${assignee.lastName[0]}`.toUpperCase()
                      : (assignee.username?.[0] || assignee.email[0]).toUpperCase()
                    }
                  </div>
                ))}
                {task.assignees.length > 3 && (
                  <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtasks Count */}
          {!isSubtask && task.subtasks.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              {task.subtasks.filter(st => st.status === 'DONE').length} de {task.subtasks.length} subtareas completadas
            </div>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {!isSubtask && task.expanded && task.subtasks.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 space-y-2"
        >
          {task.subtasks.map((subtask) => (
            <TaskCard
              key={subtask.id}
              task={subtask}
              onTaskUpdate={onTaskUpdate}
              onEditTask={onEditTask}
              isSubtask={true}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default TaskCard;
