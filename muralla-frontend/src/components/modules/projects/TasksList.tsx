import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { tasksService } from '../../../services/tasksService'
import { projectsService, type Project as APIProject } from '../../../services/projectsService'
import { usersService } from '../../../services/usersService'
import { exportTasks, type ExportFormat } from '../../../utils/exportUtils'
import DatePicker from '../../ui/DatePicker'
import { formatDateDDMMYYYY, isoToDDMMYYYY, dateToISO, isOverdue, isToday, getRelativeTime } from '../../../utils/dateUtils'
import { TaskEditModal } from './TaskEditModal'
import { EditingIndicator } from '../../common/EditingIndicator'
import { useWebSocket } from '../../../contexts/WebSocketContext'

// ——— Types ———
interface User {
  id: string
  name: string
  initials: string
  color: string // Tailwind bg-* color class
  email: string
}

type Status = 'New' | 'In Progress' | 'Completed' | 'Overdue'
type APIStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'

interface Subtask {
  id: string
  name: string
  status: Status
  inheritsAssignee: boolean
  inheritsDueDate: boolean
  assigneeIds: string[]
  dueDate?: string | null // DD/MM/YYYY format
  order: number
}

interface Task {
  id: string
  name: string
  status: Status
  assigneeIds: string[]
  dueDate?: string | null // DD/MM/YYYY format
  expanded?: boolean
  subtasks: Subtask[]
  order: number
  projectId?: string
  projectName?: string
}

// ——— Helper functions ———
const getColorForUser = (index: number): string => {
  const colors = [
    'bg-electric-blue', 'bg-emerald-500', 'bg-electric-purple', 
    'bg-electric-yellow', 'bg-electric-cyan', 'bg-violet-500', 
    'bg-rose-500', 'bg-indigo-500', 'bg-electric-green', 'bg-electric-orange'
  ];
  return colors[index % colors.length];
};

// Task expanded state persistence
const EXPANDED_TASKS_KEY = 'muralla-expanded-tasks'
const TASK_SORT_KEY = 'muralla-task-sort'
const MANUAL_ORDER_KEY = 'muralla-manual-task-order'

type SortOption = 'manual' | 'name' | 'dueDate' | 'status' | 'project' | 'dateCreated'
type SortDirection = 'asc' | 'desc'

interface SortConfig {
  option: SortOption
  direction: SortDirection
}

const getExpandedStates = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(EXPANDED_TASKS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

const setExpandedState = (taskId: string, expanded: boolean) => {
  try {
    const states = getExpandedStates()
    if (expanded) {
      states[taskId] = true
    } else {
      delete states[taskId] // Only store expanded=true to save space
    }
    localStorage.setItem(EXPANDED_TASKS_KEY, JSON.stringify(states))
  } catch {
    // Ignore localStorage errors
  }
}

const getSortConfig = (): SortConfig => {
  try {
    const stored = localStorage.getItem(TASK_SORT_KEY)
    return stored ? JSON.parse(stored) : { option: 'manual', direction: 'asc' }
  } catch {
    return { option: 'manual', direction: 'asc' }
  }
}

const setSortConfig = (config: SortConfig) => {
  try {
    localStorage.setItem(TASK_SORT_KEY, JSON.stringify(config))
  } catch {
    // Ignore localStorage errors
  }
}

const getManualOrder = (): Record<string, number> => {
  try {
    const stored = localStorage.getItem(MANUAL_ORDER_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

const setManualOrder = (order: Record<string, number>) => {
  try {
    localStorage.setItem(MANUAL_ORDER_KEY, JSON.stringify(order))
  } catch {
    // Ignore localStorage errors
  }
}

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const convertAPIUserToUser = (apiUser: APIUser, index: number): User => ({
  id: apiUser.id,
  name: `${apiUser.firstName} ${apiUser.lastName}`,
  initials: getInitials(apiUser.firstName, apiUser.lastName),
  color: getColorForUser(index),
  email: apiUser.email,
});

const convertAPIStatusToStatus = (apiStatus: APIStatus, dueDate?: string): Status => {
  if (apiStatus === 'DONE') return 'Completed';
  if (dueDate && new Date(dueDate) < new Date() && apiStatus !== 'DONE' as APIStatus) return 'Overdue';
  if (apiStatus === 'IN_PROGRESS' || apiStatus === 'REVIEW') return 'In Progress';
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
      return 'TODO';
  }
};

// Convert API Task to local Task
const convertAPITaskToTask = (apiTask: APITask, _users: User[], projects: APIProject[]): Task => {
  // Convert ISO date to DD/MM/YYYY format
  const taskAssigneeIds = (apiTask.assignees && apiTask.assignees.length > 0)
    ? apiTask.assignees.map(a => a.userId)
    : (apiTask.assigneeId ? [apiTask.assigneeId] : [])
  const taskDue = isoToDDMMYYYY(apiTask.dueDate)
  const project = projects.find(p => p.id === apiTask.projectId)
  
  const hasSubtasks = (apiTask.subtasks || []).length > 0
  const expandedStates = getExpandedStates()
  const isExpanded = hasSubtasks ? (expandedStates[apiTask.id] !== undefined ? expandedStates[apiTask.id] : true) : false
  
  return {
    id: apiTask.id,
    name: apiTask.title,
    status: convertAPIStatusToStatus(apiTask.status, taskDue || undefined),
    assigneeIds: taskAssigneeIds,
    dueDate: taskDue,
    expanded: isExpanded,
    subtasks: (apiTask.subtasks || []).map((st, idx) => {
      const subAssigneeIds = (st.assignees && st.assignees.length > 0)
        ? st.assignees.map(a => a.userId)
        : (st.assigneeId ? [st.assigneeId] : [])
      const subDue = isoToDDMMYYYY(st.dueDate)
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
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null)
  const availableUsers = users.filter(user => user.email !== 'contacto@murallacafe.cl')
  const selectedUsers = availableUsers.filter(u => selectedUserIds.includes(u.id))
  
  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter(id => id !== userId))
    } else {
      onSelectionChange([...selectedUserIds, userId])
    }
  }
  
  const getDropdownPosition = () => {
    if (!buttonRef) return { top: 0, left: 0 }
    const rect = buttonRef.getBoundingClientRect()
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 200 // Align dropdown to right of button
    }
  }

  return (
    <div className="relative">
      <button
        ref={setButtonRef}
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
          <div 
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-48 max-h-64 overflow-y-auto"
            style={getDropdownPosition()}
          >
            {availableUsers.map(user => (
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
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null)
  
  const getStatusColor = (s: Status) => {
    switch (s) {
      case 'New': return 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-300'
      case 'In Progress': return 'bg-electric-blue/20 text-electric-cyan dark:bg-electric-blue/10 dark:text-electric-cyan'
      case 'Completed': return 'bg-electric-green/20 text-green-800 dark:bg-electric-green/10 dark:text-electric-green'
      case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-300'
    }
  }
  
  const selectableStatuses: Status[] = ['New', 'In Progress', 'Completed']
  
  const getDropdownPosition = () => {
    if (!buttonRef) return { top: 0, left: 0 }
    const rect = buttonRef.getBoundingClientRect()
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 140 // Align dropdown to right of button
    }
  }
  
  return (
    <div className="relative">
      <button
        ref={setButtonRef}
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
          <div 
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-1 min-w-32"
            style={getDropdownPosition()}
          >
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
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null)
  const { t } = useTranslation()
  
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  
  // Calculate this Friday (end of current week)
  const thisWeek = new Date(today)
  const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7 // Friday is day 5, if today is Friday use next Friday
  thisWeek.setDate(today.getDate() + daysUntilFriday)
  
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)
  const twoWeeks = new Date(today)
  twoWeeks.setDate(today.getDate() + 14)
  
  const presets = [
    { label: t('pages.tasks.dueDates.tonight'), value: formatDateDDMMYYYY(today) },
    { label: t('pages.tasks.dueDates.tomorrow'), value: formatDateDDMMYYYY(tomorrow) },
    { label: t('pages.tasks.dueDates.thisWeek'), value: formatDateDDMMYYYY(thisWeek) },
    { label: t('pages.tasks.dueDates.nextWeek'), value: formatDateDDMMYYYY(nextWeek) },
    { label: t('pages.tasks.dueDates.twoWeeks'), value: formatDateDDMMYYYY(twoWeeks) },
  ]
  
  const getDueDateColor = () => {
    if (!dueDate) return 'text-gray-400'
    if (isOverdue(dueDate)) return 'text-red-600' // Overdue
    if (isToday(dueDate)) return 'text-amber-600' // Due today
    return 'text-gray-700 dark:text-gray-300'
  }
  
  const formatDueDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return t('pages.tasks.dueDates.noDate')
    return getRelativeTime(dateStr) || dateStr
  }
  
  const getDropdownPosition = () => {
    if (!buttonRef) return { top: 0, left: 0 }
    const rect = buttonRef.getBoundingClientRect()
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 280 // More space for DatePicker
    }
  }
  
  return (
    <div className="relative">
      <button
        ref={setButtonRef}
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
          <div 
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-80"
            style={getDropdownPosition()}
          >
            <div className="space-y-1 mb-3">
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
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <DatePicker
                value={dueDate || ''}
                onChange={(date) => {
                  onChange(date)
                  setIsOpen(false)
                }}
                placeholder="Seleccionar fecha"
                className="text-sm"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Project selector
const ProjectSelector: React.FC<{
  projectId?: string
  projects: APIProject[]
  onChange: (projectId: string) => void
}> = ({ projectId, projects, onChange }) => {
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const selectedProject = projects.find(p => p.id === projectId)

  const getDropdownPosition = () => {
    if (!buttonRef) return { top: 0, left: 0 }
    const rect = buttonRef.getBoundingClientRect()
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 200
    }
  }

  const dropdownPosition = getDropdownPosition()

  return (
    <div className="relative">
      <button
        ref={setButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-w-[80px]"
      >
        <span className="truncate text-left flex-1">
          {selectedProject?.name || 'Sin proyecto'}
        </span>
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed z-50 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              minWidth: '200px'
            }}
          >
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => {
                  onChange(project.id)
                  setIsOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
              >
                <span className="truncate">{project.name}</span>
              </button>
            ))}
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
  // Removed unused isLoading state
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

// Optimized sortable task row with memoization
const SortableTaskRow: React.FC<{
  task: Task
  users: User[]
  projects: APIProject[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onSubtaskUpdate: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void
  onAddSubtask: (taskId: string) => void
  onDeleteSubtask: (subtaskId: string) => void
  onDeleteTask?: (taskId: string) => void
  onEditTask?: (task: Task) => void
  isUserEditing: (resource: string, resourceId: string) => boolean
  getEditingUsers: (resource: string, resourceId: string) => any[]
  isSubtask?: boolean
}> = React.memo(({ task, users, projects, onTaskUpdate, onSubtaskUpdate, onAddSubtask, onDeleteSubtask, onDeleteTask, onEditTask, isUserEditing, getEditingUsers, isSubtask = false }) => {
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
      const newExpanded = !task.expanded
      setExpandedState(task.id, newExpanded)
      onTaskUpdate(task.id, { expanded: newExpanded })
    }
  }

  // Check if this task is being edited by other users
  const isBeingEdited = isUserEditing('task', task.id)
  const editingUsers = getEditingUsers('task', task.id)
  
  return (
    <div ref={setNodeRef} style={style} className={isSubtask ? 'ml-6' : ''}>
      <div className={`grid grid-cols-12 gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isSubtask ? 'bg-gray-50/50 dark:bg-gray-800/25' : 'bg-white dark:bg-gray-800'} ${isBeingEdited ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
        {/* Drag handle + Expand/Collapse + Name */}
        <div className="col-span-4 flex items-center space-x-2">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
            ⋮⋮
          </div>
          
          {!isSubtask && task.subtasks.length > 0 && (
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
        <div className="col-span-1 flex items-center">
          <StatusSelector
            status={task.status}
            onChange={(status) => onTaskUpdate(task.id, { status })}
          />
        </div>
        
        {/* Assignees */}
        <div className="col-span-1 flex items-center">
          <AssigneeSelector
            selectedUserIds={task.assigneeIds}
            users={users}
            onSelectionChange={(assigneeIds) => onTaskUpdate(task.id, { assigneeIds })}
          />
        </div>
        
        {/* Project */}
        <div className="col-span-2 flex items-center">
          <ProjectSelector
            projectId={task.projectId}
            projects={projects}
            onChange={(projectId) => onTaskUpdate(task.id, { projectId })}
          />
        </div>
        
        {/* Actions */}
        <div className="col-span-2 flex items-center space-x-1">
          {/* Collaboration indicator */}
          {isBeingEdited && (
            <div className="mr-2">
              <EditingIndicator 
                users={editingUsers}
                showNames={false}
                className="text-xs"
              />
            </div>
          )}
          
          {!isSubtask && onEditTask && (
            <button
              onClick={() => onEditTask(task)}
              disabled={isBeingEdited}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                isBeingEdited 
                  ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border-blue-200 hover:border-blue-300 dark:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
              title={isBeingEdited ? 'Siendo editado por otro usuario' : 'Editar tarea'}
            >
              Editar
            </button>
          )}
          
          {!isSubtask && (
            <button
              onClick={() => onAddSubtask(task.id)}
              className="px-2 py-1 text-xs text-electric-cyan hover:text-electric-blue dark:text-electric-cyan dark:hover:text-electric-blue rounded border border-electric-cyan/30 hover:border-electric-cyan/50 dark:border-electric-cyan/30 dark:hover:border-electric-cyan/50 hover:bg-electric-cyan/10 dark:hover:bg-electric-cyan/10 transition-colors"
              title={t('pages.tasks.actions.addSubtask')}
            >
              + Subtarea
            </button>
          )}
          {isSubtask && (
            <button
              onClick={() => onDeleteSubtask(task.id)}
              className="px-2 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded border border-red-200 hover:border-red-300 dark:border-red-600 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title={t('pages.tasks.actions.deleteSubtask')}
            >
              Eliminar
            </button>
          )}
          {!isSubtask && (
            <button
              onClick={() => onDeleteTask?.(task.id)}
              className="px-2 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded border border-red-200 hover:border-red-300 dark:border-red-600 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Eliminar tarea"
            >
              Eliminar
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
              projects={projects}
              onTaskUpdate={(subtaskId, updates) => {
                onSubtaskUpdate(task.id, subtaskId, updates as Partial<Subtask>)
              }}
              onSubtaskUpdate={onSubtaskUpdate}
              onAddSubtask={onAddSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              isUserEditing={isUserEditing}
              getEditingUsers={getEditingUsers}
              isSubtask={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.name === nextProps.task.name &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.dueDate === nextProps.task.dueDate &&
    prevProps.task.expanded === nextProps.task.expanded &&
    JSON.stringify(prevProps.task.assigneeIds) === JSON.stringify(nextProps.task.assigneeIds) &&
    JSON.stringify(prevProps.task.subtasks) === JSON.stringify(nextProps.task.subtasks) &&
    prevProps.users.length === nextProps.users.length &&
    prevProps.projects.length === nextProps.projects.length
  )
})

// Main TasksList component
const TasksList: React.FC = () => {
  const { t } = useTranslation()
  const { isUserEditing, getEditingUsers } = useWebSocket()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<APIProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [, setSavingItems] = useState<Set<string>>(new Set())
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem('expandedTasks') || '[]'))
  )

  // Real-time collaboration state
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu && !(event.target as Element).closest('.export-menu')) {
        setShowExportMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  // Debouncing refs to prevent rapid API calls
  const updateTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All')
  const [assigneeFilter, setAssigneeFilter] = useState<string | 'All' | 'Unassigned'>('All')
  const [noDateFilter, setNoDateFilter] = useState(false)
  const [oneAssignedFilter, setOneAssignedFilter] = useState(false)
  
  // Sorting
  const [sortConfig, setSortConfigState] = useState<SortConfig>(() => getSortConfig())
  const [manualOrder, setManualOrderState] = useState<Record<string, number>>(() => getManualOrder())
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Optimized data loading with caching
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh || tasks.length === 0) {
        setLoading(true)
      }
      
      const [tasksData, usersData, projectsData] = await Promise.all([
        tasksService.getAllTasks(),
        usersService.getActiveUsers(),
        projectsService.getAllProjects()
      ])
      
      const mappedUsers = usersData.map(convertAPIUserToUser)
      const mappedTasks = tasksData.map(task => convertAPITaskToTask(task, mappedUsers, projectsData))
      
      setUsers(mappedUsers)
      setTasks(mappedTasks)
      setProjects(projectsData)
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
    
    // Cleanup timeouts on unmount
    return () => {
      updateTimeouts.current.forEach(timeout => clearTimeout(timeout))
      updateTimeouts.current.clear()
    }
  }, [loadData])
  
  // Helper functions for sorting
  const handleSortChange = useCallback((option: SortOption) => {
    const newDirection: SortDirection = sortConfig.option === option && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    const newConfig: SortConfig = { option, direction: newDirection }
    setSortConfigState(newConfig)
    setSortConfig(newConfig)
  }, [sortConfig])

  const updateManualOrder = useCallback((newOrder: Record<string, number>) => {
    setManualOrderState(newOrder)
    setManualOrder(newOrder)
  }, [])

  // Export handlers
  const handleExport = useCallback(async (format: ExportFormat) => {
    setExporting(true)
    setShowExportMenu(false)
    
    try {
      exportTasks(tasks, projects, users, format)
      setError(`Tasks exported successfully as ${format.toUpperCase()}`)
      setTimeout(() => setError(null), 3000)
    } catch (err) {
      console.error('Export failed:', err)
      setError('Failed to export tasks')
      setTimeout(() => setError(null), 3000)
    } finally {
      setExporting(false)
    }
  }, [tasks, projects, users])

  const sortTasks = useCallback((tasksToSort: Task[]) => {
    const sorted = [...tasksToSort]
    
    switch (sortConfig.option) {
      case 'manual':
        return sorted.sort((a, b) => {
          const orderA = manualOrder[a.id] ?? a.order ?? 0
          const orderB = manualOrder[b.id] ?? b.order ?? 0
          return orderA - orderB
        })
      
      case 'name':
        return sorted.sort((a, b) => {
          const result = a.name.localeCompare(b.name)
          return sortConfig.direction === 'asc' ? result : -result
        })
      
      case 'dueDate':
        return sorted.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return sortConfig.direction === 'asc' ? 1 : -1
          if (!b.dueDate) return sortConfig.direction === 'asc' ? -1 : 1
          
          const dateA = new Date(a.dueDate.split('/').reverse().join('-'))
          const dateB = new Date(b.dueDate.split('/').reverse().join('-'))
          const result = dateA.getTime() - dateB.getTime()
          return sortConfig.direction === 'asc' ? result : -result
        })
      
      case 'status':
        return sorted.sort((a, b) => {
          const statusOrder = { 'New': 0, 'In Progress': 1, 'Completed': 2, 'Overdue': 3 }
          const result = statusOrder[a.status] - statusOrder[b.status]
          return sortConfig.direction === 'asc' ? result : -result
        })
      
      case 'project':
        return sorted.sort((a, b) => {
          const projectA = a.projectName || ''
          const projectB = b.projectName || ''
          const result = projectA.localeCompare(projectB)
          return sortConfig.direction === 'asc' ? result : -result
        })
      
      case 'dateCreated':
        return sorted.sort((a, b) => {
          // Use task order as proxy for creation date since we don't have actual creation date
          const result = (a.order ?? 0) - (b.order ?? 0)
          return sortConfig.direction === 'asc' ? result : -result
        })
      
      default:
        return sorted
    }
  }, [sortConfig, manualOrder])

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
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
    })
    
    return sortTasks(filtered)
  }, [tasks, searchTerm, statusFilter, assigneeFilter, noDateFilter, oneAssignedFilter, sortTasks])
  
  // Optimized task operations with debouncing for name updates
  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Store original state for rollback
    const originalTasks = tasks
    
    try {
      // Optimistic update - immediate UI response
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          const updatedTask = { ...task, ...updates }
          // When projectId is updated, also update projectName for immediate UI feedback
          if ('projectId' in updates && updates.projectId) {
            const project = projects.find(p => p.id === updates.projectId)
            updatedTask.projectName = project?.name || 'Unknown Project'
          }
          return updatedTask
        }
        return task
      }))
      
      // Skip API calls for temporary tasks (they don't exist in the backend yet)
      if (taskId.startsWith('temp-')) {
        return
      }
      
      // Clear existing timeout for this task
      const existingTimeout = updateTimeouts.current.get(taskId)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }
      
      // API call with debouncing for name updates
      const apiUpdates: any = {}
      if ('name' in updates) apiUpdates.title = updates.name
      if ('status' in updates) apiUpdates.status = convertStatusToAPIStatus(updates.status!)
      if ('assigneeIds' in updates) {
        await tasksService.updateTaskAssignees(taskId, updates.assigneeIds!)
        return
      }
      if ('dueDate' in updates) apiUpdates.dueDate = dateToISO(updates.dueDate)
      if ('projectId' in updates) apiUpdates.projectId = updates.projectId
      
      if (Object.keys(apiUpdates).length > 0) {
        // Debounce name updates (500ms) but send others immediately
        // Project changes should be immediate to show visual feedback
        const delay = ('name' in updates && !('projectId' in updates)) ? 500 : 0
        
        const timeoutId = setTimeout(async () => {
          try {
            await tasksService.updateTask(taskId, apiUpdates)
            updateTimeouts.current.delete(taskId)
          } catch (err) {
            console.error('Failed to update task:', err)
            setTasks(originalTasks)
            setError('Failed to update task. Please try again.')
            setTimeout(() => setError(null), 3000)
          }
        }, delay)
        
        updateTimeouts.current.set(taskId, timeoutId)
      }
    } catch (err) {
      console.error('Failed to update task:', err)
      // Rollback to original state instead of full reload
      setTasks(originalTasks)
      setError('Failed to update task. Please try again.')
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000)
    }
  }, [tasks, projects])
  
  const handleSubtaskUpdate = useCallback(async (parentTaskId: string, subtaskId: string, updates: Partial<Subtask>) => {
    const originalTasks = tasks
    
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
      
      // Skip API calls for temporary subtasks
      if (subtaskId.startsWith('temp-')) {
        return
      }
      
      // API call
      const apiUpdates: any = {}
      if ('name' in updates) apiUpdates.title = updates.name
      if ('status' in updates) apiUpdates.status = convertStatusToAPIStatus(updates.status!)
      if ('assigneeIds' in updates) {
        await tasksService.updateTaskAssignees(subtaskId, updates.assigneeIds!)
        return
      }
      if ('dueDate' in updates) apiUpdates.dueDate = dateToISO(updates.dueDate)
      
      if (Object.keys(apiUpdates).length > 0) {
        await tasksService.updateSubtask(subtaskId, apiUpdates)
      }
    } catch (err) {
      console.error('Failed to update subtask:', err)
      setTasks(originalTasks)
      setError('Failed to update subtask. Please try again.')
      setTimeout(() => setError(null), 3000)
    }
  }, [tasks])
  
  const handleAddTask = useCallback(async () => {
    // Create temporary task for immediate UI feedback
    const tempId = `temp-${Date.now()}`
    const tempTask: Task = {
      id: tempId,
      name: '',
      status: 'New',
      assigneeIds: [],
      dueDate: null,
      expanded: false,
      subtasks: [],
      order: tasks.length,
      projectId: projects[0]?.id,
      projectName: projects[0]?.name || 'Default'
    }
    
    try {
      setSaving(true)
      setSavingItems(prev => new Set(prev.add(tempId)))
      
      // Optimistic UI update
      setTasks(prev => [tempTask, ...prev])
      
      const defaultProject = await projectsService.getOrCreateDefaultProject()
      const newTask = await tasksService.createTask({
        title: '',
        status: 'PENDING',
        projectId: defaultProject.id
      })
      
      // Replace temp task with real task
      setTasks(prev => prev.map(task => 
        task.id === tempId 
          ? convertAPITaskToTask(newTask, users, projects)
          : task
      ))
    } catch (err) {
      console.error('Failed to add task:', err)
      // Remove temp task on error
      setTasks(prev => prev.filter(task => task.id !== tempId))
      setError('Failed to add task')
      setTimeout(() => setError(null), 3000)
    } finally {
      setSaving(false)
      setSavingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
    }
  }, [tasks, projects, users])
  
  const handleAddSubtask = useCallback(async (parentTaskId: string) => {
    const tempId = `temp-${Date.now()}`
    const tempSubtask: Subtask = {
      id: tempId,
      name: '',
      status: 'New',
      inheritsAssignee: true,
      inheritsDueDate: true,
      assigneeIds: [],
      dueDate: null,
      order: 0
    }
    
    try {
      // Optimistic UI update
      setTasks(prev => prev.map(task => 
        task.id === parentTaskId 
          ? { ...task, subtasks: [...task.subtasks, tempSubtask], expanded: true }
          : task
      ))
      
      const newSubtask = await tasksService.createSubtask(parentTaskId, {
        title: '',
        status: 'PENDING',
        projectId: ''
      })
      
      // Replace temp subtask with real subtask
      setTasks(prev => prev.map(task => 
        task.id === parentTaskId 
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask => 
                subtask.id === tempId
                  ? {
                      id: newSubtask.id,
                      name: newSubtask.title,
                      status: convertAPIStatusToStatus(newSubtask.status),
                      inheritsAssignee: !newSubtask.assigneeId,
                      inheritsDueDate: !newSubtask.dueDate,
                      assigneeIds: newSubtask.assigneeId ? [newSubtask.assigneeId] : [],
                      dueDate: isoToDDMMYYYY(newSubtask.dueDate),
                      order: newSubtask.orderIndex ?? 0
                    }
                  : subtask
              )
            }
          : task
      ))
    } catch (err) {
      console.error('Failed to add subtask:', err)
      // Remove temp subtask on error
      setTasks(prev => prev.map(task => 
        task.id === parentTaskId 
          ? { ...task, subtasks: task.subtasks.filter(subtask => subtask.id !== tempId) }
          : task
      ))
    }
  }, [])
  
  const handleDeleteSubtask = useCallback(async (subtaskId: string) => {
    const originalTasks = tasks
    
    try {
      // Optimistic removal
      setTasks(prev => prev.map(task => ({
        ...task,
        subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId)
      })))
      
      await tasksService.deleteTask(subtaskId)
    } catch (err) {
      console.error('Failed to delete subtask:', err)
      setTasks(originalTasks)
      setError('Failed to delete subtask')
      setTimeout(() => setError(null), 3000)
    }
  }, [tasks])

  // Task editing handlers for collaboration
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  }, []);

  const handleSaveTaskFromModal = useCallback(async (updatedTask: Task) => {
    try {
      // Update local state first for immediate UI feedback
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
      
      // Call the existing handleTaskUpdate to sync with backend
      await handleTaskUpdate(updatedTask.id, updatedTask);
    } catch (error) {
      console.error('Error saving task from modal:', error);
      throw error;
    }
  }, [handleTaskUpdate]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (window.confirm('¿Confirmas la eliminación de esta tarea?\n\nEsta acción es permanente y eliminará:\n• La tarea y toda su información\n• Todas las subtareas asociadas\n• El historial de actividad\n\n¿Deseas continuar?')) {
      const originalTasks = tasks
      
      try {
        // Optimistic removal
        setTasks(prev => prev.filter(task => task.id !== taskId))
        
        await tasksService.deleteTask(taskId)
      } catch (err) {
        console.error('Failed to delete task:', err)
        setTasks(originalTasks)
        setError('Failed to delete task')
        setTimeout(() => setError(null), 3000)
      }
    }
  }, [tasks])
  
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) return
    
    // Only allow manual reordering when sort is set to manual
    if (sortConfig.option !== 'manual') {
      setError('Switch to manual sorting to reorder tasks')
      setTimeout(() => setError(null), 3000)
      return
    }
    
    const oldIndex = filteredTasks.findIndex(task => task.id === active.id)
    const newIndex = filteredTasks.findIndex(task => task.id === over.id)
    
    if (oldIndex === -1 || newIndex === -1) return
    
    const originalTasks = tasks
    const originalManualOrder = manualOrder
    
    try {
      // Optimistic update
      const newTasks = arrayMove(filteredTasks, oldIndex, newIndex)
      
      // Update manual order mapping
      const newManualOrder = { ...manualOrder }
      newTasks.forEach((task, index) => {
        newManualOrder[task.id] = index
      })
      
      setTasks(prev => {
        const otherTasks = prev.filter(t => !filteredTasks.find(ft => ft.id === t.id))
        return [...otherTasks, ...newTasks]
      })
      
      updateManualOrder(newManualOrder)
      
      // Update order on backend
      await tasksService.reorderTasks(newTasks.map(t => t.id))
    } catch (err) {
      console.error('Failed to reorder tasks:', err)
      setTasks(originalTasks)
      updateManualOrder(originalManualOrder)
      setError('Failed to reorder tasks')
      setTimeout(() => setError(null), 3000)
    }
  }, [filteredTasks, tasks, sortConfig.option, manualOrder, updateManualOrder])
  
  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('All')
    setAssigneeFilter('All')
    setNoDateFilter(false)
    setOneAssignedFilter(false)
  }
  
  // Task Loading Skeleton
  const TaskSkeleton = () => (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="col-span-4 flex items-center space-x-2">
        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
      </div>
      <div className="col-span-2 flex items-center">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
      </div>
      <div className="col-span-1 flex items-center">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
      </div>
      <div className="col-span-1 flex items-center">
        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
      <div className="col-span-2 flex items-center">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
      </div>
      <div className="col-span-2 flex items-center space-x-1">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="">
        <div className="container mx-auto px-4 py-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-64 animate-pulse"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
            </div>
          </div>
          
          {/* Filters Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-4">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-3 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
            </div>
          </div>
          
          {/* Tasks Table Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Headers Skeleton */}
            <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="col-span-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="col-span-1 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="col-span-1 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
            
            {/* Task Rows Skeleton */}
            {Array.from({ length: 5 }).map((_, i) => (
              <TaskSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => loadData()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="">
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
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creando...
                </>
              ) : (
                t('pages.tasks.newTask')
              )}
            </button>
            
            {/* Export Menu */}
            <div className="relative export-menu">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Exportando...
                  </>
                ) : (
                  <>
                    📥 Exportar
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      📄 JSON (Completo)
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      📊 CSV (Tabla)
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      📈 Excel (Hoja de cálculo)
                    </button>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {tasks.length} tareas • {tasks.reduce((sum, task) => sum + (task.subtasks?.length || 0), 0)} subtareas
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <button
              className="btn-secondary"
              disabled
            >
              {t('actions.import')}
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Search */}
            <div className="col-span-1 lg:col-span-2">
              <input
                type="text"
                placeholder={t('pages.tasks.searchTasks')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full text-sm"
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort dropdown */}
              <select
                value={sortConfig.option}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="input text-sm min-w-36"
              >
                <option value="manual">Orden Manual</option>
                <option value="name">Nombre</option>
                <option value="dueDate">Fecha Límite</option>
                <option value="status">Estado</option>
                <option value="project">Proyecto</option>
                <option value="dateCreated">Fecha Creación</option>
              </select>
              
              {/* Sort direction indicator */}
              {sortConfig.option !== 'manual' && (
                <button
                  onClick={() => handleSortChange(sortConfig.option)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
                  title={`Ordenar ${sortConfig.direction === 'asc' ? 'descendente' : 'ascendente'}`}
                >
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </button>
              )}
              
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Status | 'All')}
                className="input text-sm min-w-28"
              >
                <option value="All">Todos</option>
                <option value="New">Nuevo</option>
                <option value="In Progress">En Progreso</option>
                <option value="Completed">Completado</option>
                <option value="Overdue">Vencido</option>
              </select>
              
              {/* Assignee filter */}
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="input text-sm min-w-32"
              >
                <option value="All">Todos</option>
                <option value="Unassigned">Sin asignar</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            
            {/* Toggles and Reset */}
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={noDateFilter}
                    onChange={(e) => setNoDateFilter(e.target.checked)}
                    className="rounded border-gray-300 text-sm"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sin fecha</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={oneAssignedFilter}
                    onChange={(e) => setOneAssignedFilter(e.target.checked)}
                    className="rounded border-gray-300 text-sm"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">1 asignado</span>
                </label>
              </div>
              
              <button
                onClick={resetFilters}
                className="text-sm text-electric-cyan hover:text-electric-blue dark:text-electric-cyan dark:hover:text-electric-blue px-2 py-1 rounded hover:bg-electric-cyan/10 dark:hover:bg-electric-cyan/10 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
        
        {/* Error Toast */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-in">
            {error}
          </div>
        )}
        
        {/* Tasks table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Headers */}
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 text-sm sticky top-0">
            <div className="col-span-4">{t('pages.tasks.columns.name')}</div>
            <div className="col-span-2">{t('pages.tasks.columns.dueDate')}</div>
            <div className="col-span-1">{t('pages.tasks.columns.status')}</div>
            <div className="col-span-1">{t('pages.tasks.columns.assignee')}</div>
            <div className="col-span-2">{t('pages.tasks.columns.project')}</div>
            <div className="col-span-2">{t('pages.tasks.columns.actions')}</div>
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
                <div className="pb-32">
                  {filteredTasks.map(task => (
                    <SortableTaskRow
                      key={task.id}
                      task={task}
                      users={users}
                      projects={projects}
                      onTaskUpdate={handleTaskUpdate}
                      onSubtaskUpdate={handleSubtaskUpdate}
                      onAddSubtask={handleAddSubtask}
                      onDeleteSubtask={handleDeleteSubtask}
                      onDeleteTask={handleDeleteTask}
                      onEditTask={handleEditTask}
                      isUserEditing={isUserEditing}
                      getEditingUsers={getEditingUsers}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Real-time Collaborative Task Edit Modal */}
      {showEditModal && editingTask && (
        <TaskEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTaskFromModal}
          task={editingTask}
          users={users}
          projects={projects}
        />
      )}
    </div>
  )
}

export default TasksList