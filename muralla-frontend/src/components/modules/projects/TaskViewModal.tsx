import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, CalendarIcon, UserIcon, CheckIcon, PencilIcon, ChatBubbleLeftIcon, TrashIcon, ClockIcon, PaperAirplaneIcon, FolderIcon, Link2 } from '@heroicons/react/24/outline';
import { formatDateDDMMYYYY, getRelativeTime, isOverdue, isToday } from '../../../utils/dateUtils';
import type { Project as APIProject } from '../../../services/projectsService';
import { useTaskStatus } from '../../../hooks/useTaskStatus';
import { RelationshipManager } from '../../relationships/RelationshipManager';
import { MentionInput } from '../../common/MentionInput';
import { CollaborativeTextEditor } from '../../common/CollaborativeTextEditor';
import { AuthService } from '../../../services/authService';
import tasksService from '../../../services/tasksService';
import { useWebSocket } from '../../../contexts/WebSocketContext';

interface User {
  id: string;
  name: string;
  initials: string;
  color: string;
  email: string;
}

type Status = 'Limite' | 'Postergado' | 'Revisar' | 'En progreso' | 'Empezar' | 'Nuevo' | 'Listo';

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  timestamp: string;
  taskId?: string;
  subtaskId?: string;
}

interface Subtask {
  id: string;
  name: string;
  status: Status;
  inheritsAssignee: boolean;
  inheritsDueDate: boolean;
  assigneeIds: string[];
  dueDate?: string | null;
  order: number;
  comments?: Comment[];
}

interface Task {
  id: string;
  name: string;
  status: Status;
  assigneeIds: string[];
  dueDate?: string | null;
  expanded?: boolean;
  subtasks: Subtask[];
  order: number;
  projectId?: string;
  projectName?: string;
  comments?: Comment[];
  // Intelligent status fields
  title: string;
  createdAt: string;
  dueDateModifiedAt?: string;
  statusModifiedByUser: boolean;
  wasEnProgreso: boolean;
}

interface TaskViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  users: User[];
  projects: APIProject[];
}

const UserAvatar: React.FC<{ user: User; size?: 'sm' | 'md' | 'lg' }> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base'
  };
  
  return (
    <div 
      className={`${sizeClasses[size]} ${user.color} rounded-full flex items-center justify-center text-white font-medium shadow-sm`}
      title={user.name}
    >
      {user.initials}
    </div>
  );
};

const getStatusColor = (status: Status) => {
  switch (status) {
    case 'En progreso': return 'bg-electric-blue/20 text-electric-cyan dark:bg-electric-blue/10 dark:text-electric-cyan';
    case 'Listo': return 'bg-electric-green/20 text-green-800 dark:bg-electric-green/10 dark:text-electric-green';
    case 'Limite': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'Postergado': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'Revisar': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Empezar': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'Nuevo': return 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-300';
  }
};

const getDueDateColor = (dueDate?: string | null) => {
  if (!dueDate) return 'text-gray-400';
  if (isOverdue(dueDate)) return 'text-red-600';
  if (isToday(dueDate)) return 'text-amber-600';
  return 'text-gray-700 dark:text-gray-300';
};

const formatDueDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'Sin fecha límite';
  return getRelativeTime(dateStr) || dateStr;
};

export const TaskViewModal: React.FC<TaskViewModalProps> = ({
  isOpen,
  onClose,
  task,
  users,
  projects
}) => {
  const { broadcastDataChange } = useWebSocket();
  const [editingTaskName, setEditingTaskName] = useState(false);
  const [taskName, setTaskName] = useState(task.name);
  const [editingSubtask, setEditingSubtask] = useState<string | null>(null);
  const [subtaskNames, setSubtaskNames] = useState<{[key: string]: string}>({});
  const [newComment, setNewComment] = useState('');
  const [activeCommentSection, setActiveCommentSection] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>(task.comments || []);
  const [subtaskComments, setSubtaskComments] = useState<{[key: string]: Comment[]}>({});
  const [taskStatus, setTaskStatus] = useState(task.status);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [taskDueDate, setTaskDueDate] = useState(task.dueDate || '');
  const [editingAssignees, setEditingAssignees] = useState(false);
  const [taskAssigneeIds, setTaskAssigneeIds] = useState<string[]>(task.assigneeIds);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [taskProjectId, setTaskProjectId] = useState(task.projectId || '');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showCompletedSubtasks, setShowCompletedSubtasks] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  // Load current user for collaborative editing
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          setCurrentUser({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim() || user.email
          });
        }
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    };

    loadCurrentUser();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowStatusDropdown(false);
        setShowAssigneeDropdown(false);
        setShowProjectDropdown(false);
        setEditingAssignees(false);
        setEditingProject(false);
      }
    };

    if (showStatusDropdown || showAssigneeDropdown || showProjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showStatusDropdown, showAssigneeDropdown, showProjectDropdown]);

  if (!isOpen) return null;

  const assignedUsers = users.filter(user => taskAssigneeIds.includes(user.id));
  const project = projects.find(p => p.id === taskProjectId);
  const completedSubtasks = task.subtasks.filter(st => st.status === 'Listo').length;
  const totalSubtasks = task.subtasks.length;
  
  // Filter subtasks based on completion status
  const activeSubtasks = task.subtasks.filter(st => st.status !== 'Listo');
  const completedSubtasksList = task.subtasks.filter(st => st.status === 'Listo');
  
  // Lazy load completed subtasks - only process when needed
  const visibleSubtasks = React.useMemo(() => {
    if (showCompletedSubtasks) {
      // Return all subtasks when showing completed ones
      return task.subtasks;
    } else {
      // Only return active subtasks to avoid processing completed ones
      return activeSubtasks;
    }
  }, [task.subtasks, showCompletedSubtasks, activeSubtasks]);

  const handleTaskNameSave = () => {
    // In real app, this would call an API to update the task
    console.log('Updating task name:', taskName);
    setEditingTaskName(false);
  };

  const handleSubtaskNameSave = (subtaskId: string) => {
    // In real app, this would call an API to update the subtask
    console.log('Updating subtask name:', subtaskNames[subtaskId]);
    setEditingSubtask(null);
  };

  const toggleTaskStatus = () => {
    // In real app, this would call an API to update task status
    const newStatus = taskStatus === 'Listo' ? 'En progreso' : 'Listo';
    setTaskStatus(newStatus);
    console.log('Toggling task status to:', newStatus);
  };

  const handleStatusChange = (newStatus: Status) => {
    // In real app, this would call an API to update task status
    setTaskStatus(newStatus);
    console.log('Changing task status to:', newStatus);
  };

  const handleDueDateSave = () => {
    // In real app, this would call an API to update due date
    console.log('Updating due date:', taskDueDate);
    setEditingDueDate(false);
  };

  const handleAssigneeSave = async () => {
    try {
      console.log('Updating assignees:', taskAssigneeIds);
      await tasksService.updateTaskAssignees(task.id, taskAssigneeIds);
      broadcastDataChange?.('task', task.id, { assigneeIds: taskAssigneeIds });
    } catch (err) {
      console.error('Failed to persist assignees:', err);
    } finally {
      setEditingAssignees(false);
      setShowAssigneeDropdown(false);
    }
  };

  const toggleAssignee = (userId: string) => {
    setTaskAssigneeIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleProjectSave = async () => {
    try {
      console.log('Updating project:', taskProjectId);
      await tasksService.updateTask(task.id, { projectId: taskProjectId });
      broadcastDataChange?.('task', task.id, { projectId: taskProjectId });
    } catch (err) {
      console.error('Failed to update project:', err);
    } finally {
      setEditingProject(false);
      setShowProjectDropdown(false);
    }
  };

  const toggleSubtaskStatus = (subtaskId: string, currentStatus: Status) => {
    // In real app, this would call an API to update subtask status
    const newStatus = currentStatus === 'Listo' ? 'En progreso' : 'Listo';
    console.log('Toggling subtask status to:', newStatus);
  };

  const addComment = (taskId?: string, subtaskId?: string) => {
    if (!newComment.trim() || !currentUser) return;
    
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      text: newComment,
      authorId: currentUser.id,
      authorName: currentUser.name,
      timestamp: new Date().toISOString(),
      taskId,
      subtaskId
    };

    if (subtaskId) {
      setSubtaskComments(prev => ({
        ...prev,
        [subtaskId]: [...(prev[subtaskId] || []), comment]
      }));
    } else {
      setComments(prev => [...prev, comment]);
    }

    setNewComment('');
    setActiveCommentSection(null);
  };

  const deleteComment = (commentId: string, subtaskId?: string) => {
    if (subtaskId) {
      setSubtaskComments(prev => ({
        ...prev,
        [subtaskId]: (prev[subtaskId] || []).filter(comment => comment.id !== commentId)
      }));
    } else {
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {editingTaskName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 text-gray-900 dark:text-white focus:outline-none flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTaskNameSave();
                        if (e.key === 'Escape') setEditingTaskName(false);
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleTaskNameSave}
                      className="p-1 text-green-600 hover:text-green-700"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {taskName}
                    </h2>
                    <button
                      onClick={() => setEditingTaskName(true)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button
                  onClick={toggleTaskStatus}
                  className={`p-2 rounded-full transition-colors ${
                    taskStatus === 'Listo' 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-500 dark:hover:bg-gray-600'
                  }`}
                  title={taskStatus === 'Listo' ? 'Marcar como en progreso' : 'Marcar como completada'}
                >
                  <CheckIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${getStatusColor(taskStatus)}`}
                  >
                    {taskStatus}
                    <svg className="w-4 h-4 ml-1 inline" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {showStatusDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[150px]">
                      {(['En progreso', 'Listo'] as Status[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            handleStatusChange(status);
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                            status === taskStatus ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                          }`}
                        >
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getStatusColor(status).split(' ')[0]}`}></span>
                          {status}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {editingDueDate ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="px-2 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleDueDateSave();
                          if (e.key === 'Escape') setEditingDueDate(false);
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleDueDateSave}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingDueDate(true)}
                      className={`hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors group ${getDueDateColor(taskDueDate)}`}
                    >
                      {taskDueDate ? formatDueDate(taskDueDate) : 'Sin fecha límite'}
                      <PencilIcon className="w-3 h-3 ml-1 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Task details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Información de la Tarea
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Due Date */}
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha límite</p>
                      {editingDueDate ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                            className="px-2 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleDueDateSave();
                              if (e.key === 'Escape') setEditingDueDate(false);
                            }}
                          />
                          <button
                            onClick={handleDueDateSave}
                            className="p-1 text-green-600 hover:text-green-700"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingDueDate(true)}
                          className={`text-sm hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded transition-colors group ${getDueDateColor(taskDueDate)}`}
                        >
                          {taskDueDate ? formatDueDate(taskDueDate) : 'Sin fecha límite'}
                          <PencilIcon className="w-3 h-3 ml-1 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Assignees */}
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Asignados</p>
                      <div className="relative" ref={assigneeDropdownRef}>
                        {editingAssignees ? (
                          <div className="mt-2">
                            <button
                              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                              className="flex items-center space-x-2 px-3 py-2 border border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                              <span className="text-sm">Seleccionar usuarios</span>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                            {showAssigneeDropdown && (
                              <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                {users.map((user) => (
                                  <label key={user.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={taskAssigneeIds.includes(user.id)}
                                      onChange={() => toggleAssignee(user.id)}
                                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                                    />
                                    <UserAvatar user={user} size="sm" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={handleAssigneeSave}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => {
                                  setEditingAssignees(false);
                                  setShowAssigneeDropdown(false);
                                  setTaskAssigneeIds(task.assigneeIds);
                                }}
                                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                              >
                                Cancelar
                              </button>
                            </div>
                            {assignedUsers.length > 0 && (
                              <div className="flex items-center space-x-2 mt-2">
                                <div className="flex -space-x-1">
                                  {assignedUsers.slice(0, 3).map(user => (
                                    <UserAvatar key={user.id} user={user} size="sm" />
                                  ))}
                                  {assignedUsers.length > 3 && (
                                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                      +{assignedUsers.length - 3}
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {assignedUsers.map(u => u.name).join(', ')}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingAssignees(true)}
                            className="flex items-center space-x-2 mt-1 hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded transition-colors group"
                          >
                            {assignedUsers.length === 0 ? (
                              <span className="text-sm text-gray-500">Sin asignar</span>
                            ) : (
                              <>
                                <div className="flex -space-x-1">
                                  {assignedUsers.slice(0, 3).map(user => (
                                    <UserAvatar key={user.id} user={user} size="sm" />
                                  ))}
                                  {assignedUsers.length > 3 && (
                                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                      +{assignedUsers.length - 3}
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {assignedUsers.map(u => u.name).join(', ')}
                                </div>
                              </>
                            )}
                            <PencilIcon className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  {totalSubtasks > 0 && (
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-electric-green h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {completedSubtasks}/{totalSubtasks}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Subtasks */}
              {task.subtasks.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Subtareas ({completedSubtasks}/{totalSubtasks})
                      </h3>
                      {completedSubtasksList.length > 0 && (
                        <button
                          onClick={() => setShowCompletedSubtasks(!showCompletedSubtasks)}
                          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          <CheckIcon className="w-4 h-4" />
                          {showCompletedSubtasks ? 'Ocultar' : 'Mostrar'} completadas ({completedSubtasksList.length})
                        </button>
                      )}
                    </div>
                    {!showCompletedSubtasks && completedSubtasksList.length > 0 && (
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-400 text-center">
                        {completedSubtasksList.length} subtarea{completedSubtasksList.length !== 1 ? 's' : ''} completada{completedSubtasksList.length !== 1 ? 's' : ''} oculta{completedSubtasksList.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {visibleSubtasks.map(subtask => {
                      // Lazy load expensive operations only for visible subtasks
                      const subtaskAssignees = users.filter(user => subtask.assigneeIds.includes(user.id));
                      const isEditingThis = editingSubtask === subtask.id;
                      const currentSubtaskName = subtaskNames[subtask.id] || subtask.name;
                      // Only load comments if this subtask's comment section is active or if it's not a completed task
                      const subtaskCommentsList = (activeCommentSection === subtask.id || subtask.status !== 'Listo') 
                        ? (subtaskComments[subtask.id] || [])
                        : [];
                      
                      return (
                        <div key={subtask.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => toggleSubtaskStatus(subtask.id, subtask.status)}
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    subtask.status === 'Listo' 
                                      ? 'bg-electric-green border-electric-green hover:bg-green-600' 
                                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                  }`}
                                >
                                  {subtask.status === 'Listo' && (
                                    <CheckIcon className="w-2.5 h-2.5 text-white" />
                                  )}
                                </button>
                                
                                {isEditingThis ? (
                                  <div className="flex items-center gap-2 flex-1">
                                    <input
                                      type="text"
                                      value={currentSubtaskName}
                                      onChange={(e) => setSubtaskNames(prev => ({ ...prev, [subtask.id]: e.target.value }))}
                                      className="font-medium bg-transparent border-b border-blue-500 text-gray-900 dark:text-white focus:outline-none flex-1"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSubtaskNameSave(subtask.id);
                                        if (e.key === 'Escape') setEditingSubtask(null);
                                      }}
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleSubtaskNameSave(subtask.id)}
                                      className="p-1 text-green-600 hover:text-green-700"
                                    >
                                      <CheckIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group flex-1">
                                    <span className={`font-medium ${
                                      subtask.status === 'Listo' 
                                        ? 'text-gray-500 dark:text-gray-400 line-through' 
                                        : 'text-gray-900 dark:text-white'
                                    }`}>
                                      {currentSubtaskName}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditingSubtask(subtask.id);
                                        setSubtaskNames(prev => ({ ...prev, [subtask.id]: subtask.name }));
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <PencilIcon className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between mt-2 ml-7">
                                <div className="flex items-center space-x-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subtask.status)}`}>
                                    {subtask.status}
                                  </span>
                                  {subtask.dueDate && (
                                    <span className={`text-xs ${getDueDateColor(subtask.dueDate)}`}>
                                      {formatDueDate(subtask.dueDate)}
                                    </span>
                                  )}
                                  {subtaskAssignees.length > 0 && (
                                    <div className="flex -space-x-1">
                                      {subtaskAssignees.slice(0, 2).map(user => (
                                        <UserAvatar key={user.id} user={user} size="sm" />
                                      ))}
                                      {subtaskAssignees.length > 2 && (
                                        <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                          +{subtaskAssignees.length - 2}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <button
                                  onClick={() => setActiveCommentSection(activeCommentSection === subtask.id ? null : subtask.id)}
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                  <ChatBubbleLeftIcon className="w-4 h-4" />
                                  {subtaskCommentsList.length > 0 && <span>({subtaskCommentsList.length})</span>}
                                </button>
                              </div>

                              {/* Subtask Comments */}
                              {activeCommentSection === subtask.id && (
                                <div className="mt-3 ml-7 space-y-3">
                                  {/* Existing Comments */}
                                  {subtaskCommentsList.map(comment => (
                                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 group">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {comment.authorName}
                                          </span>
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatTimestamp(comment.timestamp)}
                                          </span>
                                        </div>
                                        {currentUser && comment.authorId === currentUser.id && (
                                          <button
                                            onClick={() => deleteComment(comment.id, subtask.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-all"
                                            title="Eliminar comentario"
                                          >
                                            <TrashIcon className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                                    </div>
                                  ))}
                                  
                                  {/* Add Comment */}
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={newComment}
                                      onChange={(e) => setNewComment(e.target.value)}
                                      placeholder="Agregar comentario..."
                                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') addComment(task.id, subtask.id);
                                      }}
                                    />
                                    <button
                                      onClick={() => addComment(task.id, subtask.id)}
                                      disabled={!newComment.trim()}
                                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <PaperAirplaneIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Universal Relationship Management */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Link2 className="w-5 h-5" />
                      Relaciones
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Sistema Universal
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <RelationshipManager
                    entityType="Task"
                    entityId={task.id}
                    compact={true}
                    onRelationshipCreated={(relationship) => {
                      console.log('Task relationship created:', relationship);
                      // Refresh task data to show new relationships
                    }}
                    onRelationshipUpdated={(relationship) => {
                      console.log('Task relationship updated:', relationship);
                    }}
                    onRelationshipDeleted={(relationshipId) => {
                      console.log('Task relationship deleted:', relationshipId);
                    }}
                  />
                </div>
              </div>

              {/* Main Task Comments */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Comentarios ({comments.length})
                    </h3>
                    <button
                      onClick={() => setActiveCommentSection(activeCommentSection === 'main' ? null : 'main')}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      {activeCommentSection === 'main' ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>
                
                {activeCommentSection === 'main' && (
                  <div className="p-4 space-y-4">
                    {/* Existing Comments */}
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No hay comentarios aún. ¡Sé el primero en comentar!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {comments.map(comment => (
                          <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 group">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-medium">
                                  {comment.authorName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {comment.authorName}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTimestamp(comment.timestamp)}
                                </span>
                              </div>
                              {currentUser && comment.authorId === currentUser.id && (
                                <button
                                  onClick={() => deleteComment(comment.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-all"
                                  title="Eliminar comentario"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add Comment */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {currentUser ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 flex gap-2">
                        {currentUser ? (
                          <CollaborativeTextEditor
                            value={newComment}
                            onChange={setNewComment}
                            placeholder="Escribe un comentario... Usa @ para mencionar usuarios, productos, proyectos..."
                            className="flex-1 text-sm"
                            currentUser={currentUser}
                            documentId={`task-comment-${task.id}`}
                          onMentionCreated={async (mention) => {
                            // Create relationship when entity is mentioned in comment
                            try {
                              await fetch('/entity-relationships', {
                                method: 'POST',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  ...AuthService.getAuthHeaders(),
                                },
                                body: JSON.stringify({
                                  relationshipType: 'mentioned_in',
                                  sourceType: mention.entityType,
                                  sourceId: mention.entityId,
                                  targetType: 'Task',
                                  targetId: task.id,
                                  metadata: {
                                    mentionText: mention.text,
                                    context: 'task_comment'
                                  },
                                  tags: ['mention', 'comment']
                                })
                              });
                            } catch (error) {
                              console.error('Failed to create mention relationship:', error);
                            }
                          }}
                        />
                        ) : (
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe un comentario..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') addComment(task.id);
                            }}
                          />
                        )}
                        <button
                          onClick={() => addComment(task.id)}
                          disabled={!newComment.trim()}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <PaperAirplaneIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Metadata */}
            <div className="space-y-4">
              {/* Task ID */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID de Tarea</h4>
                <p className="text-sm font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                  {task.id}
                </p>
              </div>

              {/* Project Details */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proyecto</h4>
                <div className="relative" ref={projectDropdownRef}>
                  {editingProject ? (
                    <div>
                      <button
                        onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                        className="flex items-center justify-between w-full px-3 py-2 border border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <div className="flex items-center space-x-2">
                          <FolderIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{project ? project.name : 'Seleccionar proyecto'}</span>
                        </div>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {showProjectDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                          <button
                            onClick={() => {
                              setTaskProjectId('');
                              setShowProjectDropdown(false);
                            }}
                            className="w-full flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                          >
                            <span className="text-sm text-gray-500">Sin proyecto</span>
                          </button>
                          {projects.map((proj) => (
                            <button
                              key={proj.id}
                              onClick={() => {
                                setTaskProjectId(proj.id);
                                setShowProjectDropdown(false);
                              }}
                              className={`w-full flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left ${
                                taskProjectId === proj.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <FolderIcon className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{proj.name}</p>
                                {proj.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{proj.description}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={handleProjectSave}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setEditingProject(false);
                            setShowProjectDropdown(false);
                            setTaskProjectId(task.projectId || '');
                          }}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingProject(true)}
                      className="flex items-center justify-between w-full hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded transition-colors group"
                    >
                      <div className="flex items-center space-x-2">
                        <FolderIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {project ? project.name : 'Sin proyecto'}
                        </span>
                      </div>
                      <PencilIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>
              </div>

              {/* Team Members */}
              {assignedUsers.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Equipo Asignado</h4>
                  <div className="space-y-2">
                    {assignedUsers.map(user => (
                      <div key={user.id} className="flex items-center space-x-3">
                        <UserAvatar user={user} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Task Statistics */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Estadísticas</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total subtareas:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{totalSubtasks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Completadas:</span>
                    <span className="font-medium text-electric-green">{completedSubtasks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Pendientes:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{totalSubtasks - completedSubtasks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progreso:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-blue"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
