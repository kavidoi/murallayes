import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { tasksService, type Task as APITask } from '../../../services/tasksService'
import { usersService, type User as APIUser } from '../../../services/usersService'
import { projectsService, type Project as APIProject } from '../../../services/projectsService'

// ——— Types ———
interface User {
  id: string
  name: string
  initials: string
  color: string // Tailwind bg-* color class
}

type Status = 'New' | 'In Progress' | 'Completed' | 'Overdue'
type APIStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE'

interface Subtask {
  id: string
  name: string
  status: Status
  inheritsAssignee: boolean
  inheritsDueDate: boolean
  assigneeIds: string[]
  dueDate?: string | null // YYYY-MM-DD
  order: number
}

interface Task {
  id: string
  name: string
  status: Status
  assigneeIds: string[]
  dueDate?: string | null
  expanded?: boolean
  subtasks: Subtask[]
  order: number
  projectId?: string
  projectName?: string
}

// ——— Helper functions ———
const getColorForUser = (index: number): string => {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-fuchsia-500', 
    'bg-amber-500', 'bg-cyan-500', 'bg-purple-500', 
    'bg-rose-500', 'bg-indigo-500', 'bg-green-500', 'bg-orange-500'
  ];
  return colors[index % colors.length];
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const convertAPIUserToUser = (apiUser: APIUser, index: number): User => ({
  id: apiUser.id,
  name: `${apiUser.firstName} ${apiUser.lastName}`,
  initials: getInitials(apiUser.firstName, apiUser.lastName),
  color: getColorForUser(index),
});

const convertAPIStatusToStatus = (apiStatus: APIStatus, dueDate?: string): Status => {
  if (apiStatus === 'DONE') return 'Completed';
  if (dueDate && new Date(dueDate) < new Date() && apiStatus !== 'DONE' as APIStatus) return 'Overdue';
  if (apiStatus === 'IN_PROGRESS') return 'In Progress';
  return 'New';
};

const convertStatusToAPIStatus = (status: Status): APIStatus => {
  switch (status) {
    case 'In Progress':
      return 'IN_PROGRESS';
    case 'Completed':
      return 'DONE';
    case 'New':
    case 'Overdue':
    default:
      return 'PENDING';
  }
};

// Convert API Task to local Task
const convertAPITaskToTask = (apiTask: APITask, _users: User[], projects: APIProject[]): Task => {
  const toYMD = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : null)
  const taskAssigneeIds = (apiTask.assignees && apiTask.assignees.length > 0)
    ? apiTask.assignees.map(a => a.userId)
    : (apiTask.assigneeId ? [apiTask.assigneeId] : [])
  const taskDue = toYMD(apiTask.dueDate)
  const project = projects.find(p => p.id === apiTask.projectId)
  
  return {
    id: apiTask.id,
    name: apiTask.title,
    status: convertAPIStatusToStatus(apiTask.status, taskDue || undefined),
    assigneeIds: taskAssigneeIds,
    dueDate: taskDue,
    expanded: false,
    subtasks: (apiTask.subtasks || []).map((st, idx) => {
      const subAssigneeIds = (st.assignees && st.assignees.length > 0)
        ? st.assignees.map(a => a.userId)
        : (st.assigneeId ? [st.assigneeId] : [])
      const subDue = toYMD(st.dueDate)
      return {
        id: st.id,
        name: st.title,
        status: convertAPIStatusToStatus(st.status, subDue || undefined),
        inheritsAssignee: subAssigneeIds.length === 0,
        inheritsDueDate: !subDue,
        assigneeIds: subAssigneeIds,
        dueDate: subDue,
        order: st.orderIndex ?? idx,
      }
    }).sort((a, b) => a.order - b.order),
    order: apiTask.orderIndex ?? 0,
    projectId: apiTask.projectId,
    projectName: project?.name || 'Unknown Project',
  }
}

// ——— Components ———

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

// Multi-assignee selector
const AssigneeSelector: React.FC<{
  selectedUserIds: string[]
  users: User[]
  onSelectionChange: (userIds: string[]) => void
  disabled?: boolean
}> = ({ selectedUserIds, users, onSelectionChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectedUsers = users.filter(u => selectedUserIds.includes(u.id))
  
  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter(id => id !== userId))
    } else {
      onSelectionChange([...selectedUserIds, userId])
    }
  }
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center space-x-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
      >
        {selectedUsers.length === 0 ? (
          <div className="w-6 h-6 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400">
            <span className="text-xs">+</span>
          </div>
        ) : (
          <div className="flex -space-x-1">
            {selectedUsers.slice(0, 3).map(user => (
              <UserAvatar key={user.id} user={user} size="sm" />
            ))}
            {selectedUsers.length > 3 && (
              <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                +{selectedUsers.length - 3}
              </div>
            )}
          </div>
        )}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-48 max-h-64 overflow-y-auto">
            {users.map(user => (
              <label key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                  className="rounded border-gray-300"
                />
                <UserAvatar user={user} size="sm" />
                <span className="text-sm">{user.name}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Status selector
const StatusSelector: React.FC<{
  status: Status
  onChange: (status: Status) => void
  disabled?: boolean
}> = ({ status, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const getStatusColor = (s: Status) => {
    switch (s) {
      case 'New': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200'
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200'
      case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const selectableStatuses: Status[] = ['New', 'In Progress', 'Completed']
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)} disabled:opacity-50`}
      >
        {status}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-6 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 min-w-32">
            {selectableStatuses.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-2 py-1 rounded text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 ${getStatusColor(s)}`}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Due date selector with presets
const DueDateSelector: React.FC<{
  dueDate?: string | null
  onChange: (date: string | null) => void
  disabled?: boolean
}> = ({ dueDate, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()
  
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)
  const twoWeeks = new Date(today)
  twoWeeks.setDate(today.getDate() + 14)
  
  const presets = [
    { label: t('pages.tasks.dueDates.tonight'), value: today.toISOString().slice(0, 10) },
    { label: t('pages.tasks.dueDates.tomorrow'), value: tomorrow.toISOString().slice(0, 10) },
    { label: t('pages.tasks.dueDates.nextWeek'), value: nextWeek.toISOString().slice(0, 10) },
    { label: t('pages.tasks.dueDates.twoWeeks'), value: twoWeeks.toISOString().slice(0, 10) },
  ]
  
  const getDueDateColor = () => {
    if (!dueDate) return 'text-gray-400'
    const due = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'text-red-600' // Overdue
    if (diffDays <= 1) return 'text-amber-600' // Due today/tomorrow
    return 'text-gray-700 dark:text-gray-300'
  }
  
  const formatDueDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return t('pages.tasks.dueDates.noDate')
    const date = new Date(dateStr)
    return date.toLocaleDateString()
  }
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`px-2 py-1 rounded text-xs ${getDueDateColor()} hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50`}
      >
        {formatDueDate(dueDate)}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-6 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-48">
            <div className="space-y-1 mb-2">
              {presets.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onChange(preset.value)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  setIsOpen(false)
                }}
                className="w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600"
              >
                {t('pages.tasks.dueDates.clearDate')}
              </button>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
              <input
                type="date"
                value={dueDate || ''}
                onChange={(e) => {
                  onChange(e.target.value || null)
                  setIsOpen(false)
                }}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Inline text editor
const InlineTextEditor: React.FC<{
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  disabled?: boolean
}> = ({ value, onChange, onBlur, placeholder, className, disabled }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  
  const handleStart = () => {
    if (!disabled) {
      setIsEditing(true)
      setEditValue(value)
    }
  }
  
  const handleSave = () => {
    onChange(editValue.trim() || value)
    setIsEditing(false)
    onBlur?.()
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(value)
      setIsEditing(false)
    }
  }
  
  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 ${className}`}
        autoFocus
      />
    )
  }
  
  return (
    <span
      onClick={handleStart}
      className={`cursor-text hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-1 py-0.5 ${disabled ? 'cursor-default' : ''} ${className}`}
    >
      {value || placeholder}
    </span>
  )
}

// Sortable task row
const SortableTaskRow: React.FC<{
  task: Task
  users: User[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onSubtaskUpdate: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void
  onAddSubtask: (taskId: string) => void
  onDeleteSubtask: (subtaskId: string) => void
  isSubtask?: boolean
}> = ({ task, users, onTaskUpdate, onSubtaskUpdate, onAddSubtask, onDeleteSubtask, isSubtask = false }) => {
  const { t } = useTranslation()
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  
  const toggleExpanded = () => {
    if (task.subtasks.length > 0) {
      onTaskUpdate(task.id, { expanded: !task.expanded })
    }
  }
  
  return (
    <div ref={setNodeRef} style={style} className={isSubtask ? 'ml-6' : ''}>
      <div className={`grid grid-cols-12 gap-4 p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isSubtask ? 'bg-gray-50/50 dark:bg-gray-800/25' : 'bg-white dark:bg-gray-900'}`}>
        {/* Drag handle + Expand/Collapse + Name */}
        <div className="col-span-4 flex items-center space-x-2">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
            ⋮⋮
          </div>
          
          {!isSubtask && (
            <button
              onClick={toggleExpanded}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <svg className={`w-4 h-4 transition-transform ${task.expanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          <div className="flex-1">
            <InlineTextEditor
              value={task.name}
              onChange={(name) => onTaskUpdate(task.id, { name })}
              placeholder="Task name"
              className={isSubtask ? 'text-sm text-gray-600 dark:text-gray-400' : 'font-medium'}
            />
          </div>
        </div>
        
        {/* Due Date */}
        <div className="col-span-2 flex items-center">
          <DueDateSelector
            dueDate={task.dueDate}
            onChange={(dueDate) => onTaskUpdate(task.id, { dueDate })}
          />
        </div>
        
        {/* Status */}
        <div className="col-span-2 flex items-center">
          <StatusSelector
            status={task.status}
            onChange={(status) => onTaskUpdate(task.id, { status })}
          />
        </div>
        
        {/* Assignees */}
        <div className="col-span-2 flex items-center">
          <AssigneeSelector
            selectedUserIds={task.assigneeIds}
            users={users}
            onSelectionChange={(assigneeIds) => onTaskUpdate(task.id, { assigneeIds })}
          />
        </div>
        
        {/* Project */}
        <div className="col-span-1 flex items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {task.projectName}
          </span>
        </div>
        
        {/* Actions */}
        <div className="col-span-1 flex items-center space-x-1">
          {!isSubtask && (
            <button
              onClick={() => onAddSubtask(task.id)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              title={t('pages.tasks.actions.addSubtask')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          {isSubtask && (
            <button
              onClick={() => onDeleteSubtask(task.id)}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
              title={t('pages.tasks.actions.deleteSubtask')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Subtasks */}
      {task.expanded && task.subtasks.length > 0 && (
        <div>
          {task.subtasks.map(subtask => (
            <SortableTaskRow
              key={subtask.id}
              task={{
                ...subtask,
                projectId: task.projectId,
                projectName: task.projectName,
                expanded: false,
                subtasks: []
              }}
              users={users}
              onTaskUpdate={(subtaskId, updates) => {
                onSubtaskUpdate(task.id, subtaskId, updates as Partial<Subtask>)
              }}
              onSubtaskUpdate={onSubtaskUpdate}
              onAddSubtask={onAddSubtask}
              onDeleteSubtask={onDeleteSubtask}
              isSubtask={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Main TasksList component
const TasksList: React.FC = () => {
  const { t } = useTranslation()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All')
  const [assigneeFilter, setAssigneeFilter] = useState<string | 'All' | 'Unassigned'>('All')
  const [noDateFilter, setNoDateFilter] = useState(false)
  const [oneAssignedFilter, setOneAssignedFilter] = useState(false)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [tasksData, usersData, projectsData] = await Promise.all([
        tasksService.getAllTasks(),
        usersService.getActiveUsers(),
        projectsService.getAllProjects()
      ])
      
      const mappedUsers = usersData.map(convertAPIUserToUser)
      const mappedTasks = tasksData.map(task => convertAPITaskToTask(task, mappedUsers, projectsData))
      
      setUsers(mappedUsers)
      setTasks(mappedTasks)
      setError(null)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    loadData()
  }, [loadData])
  
  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchTerm && !task.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      // Status filter
      if (statusFilter !== 'All' && task.status !== statusFilter) {
        return false
      }
      
      // Assignee filter
      if (assigneeFilter === 'Unassigned' && task.assigneeIds.length > 0) {
        return false
      } else if (assigneeFilter !== 'All' && assigneeFilter !== 'Unassigned') {
        if (!task.assigneeIds.includes(assigneeFilter)) {
          return false
        }
      }
      
      // No date filter
      if (noDateFilter && task.dueDate) {
        return false
      }
      
      // One assigned filter
      if (oneAssignedFilter && task.assigneeIds.length !== 1) {
        return false
      }
      
      return true
    }).sort((a, b) => a.order - b.order)
  }, [tasks, searchTerm, statusFilter, assigneeFilter, noDateFilter, oneAssignedFilter])
  
  // Task operations
  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ))
      
      // API call
      const apiUpdates: any = {}
      if ('name' in updates) apiUpdates.title = updates.name
      if ('status' in updates) apiUpdates.status = convertStatusToAPIStatus(updates.status!)
      if ('assigneeIds' in updates) {
        await tasksService.updateTaskAssignees(taskId, updates.assigneeIds!)
        return // updateTaskAssignees returns the full updated task
      }
      if ('dueDate' in updates) apiUpdates.dueDate = updates.dueDate
      
      if (Object.keys(apiUpdates).length > 0) {
        await tasksService.updateTask(taskId, apiUpdates)
      }
    } catch (err) {
      console.error('Failed to update task:', err)
      // Revert optimistic update
      loadData()
    }
  }, [loadData])
  
  const handleSubtaskUpdate = useCallback(async (parentTaskId: string, subtaskId: string, updates: Partial<Subtask>) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(task => 
        task.id === parentTaskId 
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
              )
            }
          : task
      ))
      
      // API call
      const apiUpdates: any = {}
      if ('name' in updates) apiUpdates.title = updates.name
      if ('status' in updates) apiUpdates.status = convertStatusToAPIStatus(updates.status!)
      if ('assigneeIds' in updates) {
        await tasksService.updateTaskAssignees(subtaskId, updates.assigneeIds!)
        return
      }
      if ('dueDate' in updates) apiUpdates.dueDate = updates.dueDate
      
      if (Object.keys(apiUpdates).length > 0) {
        await tasksService.updateSubtask(subtaskId, apiUpdates)
      }
    } catch (err) {
      console.error('Failed to update subtask:', err)
      loadData()
    }
  }, [loadData])
  
  const handleAddTask = useCallback(async () => {
    try {
      const defaultProject = await projectsService.getOrCreateDefaultProject()
      await tasksService.createTask({
        title: 'New Task',
        status: 'PENDING',
        projectId: defaultProject.id
      })
      
      // Refresh data to get the new task with proper ordering
      loadData()
    } catch (err) {
      console.error('Failed to add task:', err)
      setError('Failed to add task')
    }
  }, [loadData])
  
  const handleAddSubtask = useCallback(async (parentTaskId: string) => {
    try {
      await tasksService.createSubtask(parentTaskId, {
        title: 'New Subtask',
        status: 'PENDING',
        projectId: '' // Will be inherited from parent
      })
      
      // Refresh data
      loadData()
    } catch (err) {
      console.error('Failed to add subtask:', err)
    }
  }, [loadData])
  
  const handleDeleteSubtask = useCallback(async (subtaskId: string) => {
    try {
      await tasksService.deleteTask(subtaskId)
      loadData()
    } catch (err) {
      console.error('Failed to delete subtask:', err)
    }
  }, [loadData])
  
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) return
    
    const oldIndex = filteredTasks.findIndex(task => task.id === active.id)
    const newIndex = filteredTasks.findIndex(task => task.id === over.id)
    
    if (oldIndex === -1 || newIndex === -1) return
    
    // Optimistic update
    const newTasks = arrayMove(filteredTasks, oldIndex, newIndex)
    setTasks(prev => {
      const otherTasks = prev.filter(t => !filteredTasks.find(ft => ft.id === t.id))
      return [...otherTasks, ...newTasks]
    })
    
    try {
      // Update order on backend
      await tasksService.reorderTasks(newTasks.map(t => t.id))
    } catch (err) {
      console.error('Failed to reorder tasks:', err)
      // Revert on error
      loadData()
    }
  }, [filteredTasks, loadData])
  
  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('All')
    setAssigneeFilter('All')
    setNoDateFilter(false)
    setOneAssignedFilter(false)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('pages.tasks.loadingTasks')}</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('pages.tasks.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('pages.tasks.subtitle')}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleAddTask}
              className="btn-primary"
            >
              {t('pages.tasks.newTask')}
            </button>
            <button
              className="btn-secondary"
              disabled
            >
              {t('actions.import')}
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder={t('pages.tasks.searchTasks')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full"
              />
            </div>
            
            {/* Toggles */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={noDateFilter}
                  onChange={(e) => setNoDateFilter(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{t('pages.tasks.filters.noDate')}</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={oneAssignedFilter}
                  onChange={(e) => setOneAssignedFilter(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{t('pages.tasks.filters.oneAssigned')}</span>
              </label>
            </div>
            
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | 'All')}
              className="input min-w-32"
            >
              <option value="All">{t('pages.tasks.filters.allStatus')}</option>
              <option value="New">{t('status.New')}</option>
              <option value="In Progress">{t('status.In Progress')}</option>
              <option value="Completed">{t('status.Completed')}</option>
              <option value="Overdue">{t('status.Overdue')}</option>
            </select>
            
            {/* Assignee filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="input min-w-40"
            >
              <option value="All">{t('pages.tasks.filters.allAssignees')}</option>
              <option value="Unassigned">{t('pages.tasks.filters.unassigned')}</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            
            {/* Reset */}
            <button
              onClick={resetFilters}
              className="btn-secondary"
            >
              {t('pages.tasks.filters.reset')}
            </button>
          </div>
        </div>
        
        {/* Tasks table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Headers */}
          <div className="grid grid-cols-12 gap-4 p-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 text-sm sticky top-0">
            <div className="col-span-4">{t('pages.tasks.columns.name')}</div>
            <div className="col-span-2">{t('pages.tasks.columns.dueDate')}</div>
            <div className="col-span-2">{t('pages.tasks.columns.status')}</div>
            <div className="col-span-2">{t('pages.tasks.columns.assignee')}</div>
            <div className="col-span-1">{t('pages.tasks.columns.project')}</div>
            <div className="col-span-1">{t('pages.tasks.columns.actions')}</div>
          </div>
          
          {/* Task rows */}
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">{t('pages.tasks.noTasksFound')}</p>
              <p className="text-sm">{t('pages.tasks.createFirstTask')}</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div>
                  {filteredTasks.map(task => (
                    <SortableTaskRow
                      key={task.id}
                      task={task}
                      users={users}
                      onTaskUpdate={handleTaskUpdate}
                      onSubtaskUpdate={handleSubtaskUpdate}
                      onAddSubtask={handleAddSubtask}
                      onDeleteSubtask={handleDeleteSubtask}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  )
}

export default TasksList