import React, { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DndContext } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
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

// Convert API Task (subtask payload) to local Subtask
const convertAPISubtaskToSubtask = (st: APITask, indexFallback: number): Subtask => {
  const toYMD = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : null)
  const subAssigneeIds = (st.assignees && st.assignees.length > 0)
    ? st.assignees.map(a => a.userId)
    : (st.assigneeId ? [st.assigneeId] : [])
  const subDue = toYMD(st.dueDate)
  return {
    id: st.id,
    name: st.title,
    status: convertAPIStatusToStatus(st.status),
    inheritsAssignee: subAssigneeIds.length === 0,
    inheritsDueDate: !subDue,
    assigneeIds: subAssigneeIds,
    dueDate: subDue,
    order: typeof (st as any).orderIndex === 'number' ? (st as any).orderIndex : indexFallback,
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
});

const convertAPIStatusToStatus = (apiStatus: APIStatus): Status => {
  switch (apiStatus) {
    case 'PENDING':
      return 'New';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'DONE':
      return 'Completed';
    default:
      return 'New';
  }
};

const convertStatusToAPIStatus = (status: Status): APIStatus => {
  switch (status) {
    case 'New':
      return 'PENDING';
    case 'In Progress':
      return 'IN_PROGRESS';
    case 'Completed':
      return 'DONE';
    case 'Overdue':
      return 'IN_PROGRESS'; // Overdue tasks are still in progress
    default:
      return 'PENDING';
  }
};

const convertAPITaskToTask = (apiTask: APITask, fallbackOrder: number, project?: APIProject): Task => {
  const assigneeIds = (apiTask.assignees && apiTask.assignees.length > 0)
    ? apiTask.assignees.map(a => a.userId)
    : (apiTask.assigneeId ? [apiTask.assigneeId] : [])

  const toYMD = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : null)

  const subtasks: Subtask[] = (apiTask.subtasks ?? []).map((st, idx) => {
    const subAssigneeIds = (st.assignees && st.assignees.length > 0)
      ? st.assignees.map(a => a.userId)
      : (st.assigneeId ? [st.assigneeId] : [])
    const subDue = toYMD(st.dueDate)
    return {
      id: st.id,
      name: st.title,
      status: convertAPIStatusToStatus(st.status),
      inheritsAssignee: subAssigneeIds.length === 0,
      inheritsDueDate: !subDue,
      assigneeIds: subAssigneeIds,
      dueDate: subDue,
      order: typeof (st as any).orderIndex === 'number' ? (st as any).orderIndex : idx,
    }
  })

  return {
    id: apiTask.id,
    name: apiTask.title,
    status: convertAPIStatusToStatus(apiTask.status),
    assigneeIds,
    dueDate: toYMD(apiTask.dueDate),
    expanded: false,
    subtasks,
    order: typeof apiTask.orderIndex === 'number' ? apiTask.orderIndex : fallbackOrder,
    projectId: apiTask.projectId ?? project?.id,
    projectName: apiTask.project?.name ?? project?.name,
  }
};

// ——— UI helpers ———
const statusPillClasses: Record<Status, string> = {
  'New': 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100',
  'In Progress': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Completed': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Overdue': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
}

const statusDotClasses: Record<Status, string> = {
  'New': 'bg-neutral-400 dark:bg-neutral-300',
  'In Progress': 'bg-amber-500',
  'Completed': 'bg-emerald-500',
  'Overdue': 'bg-rose-500',
}

function formatDate(date?: string | null, t?: (k: string) => string) {
  if (!date) return t ? t('common.noDate') : 'No date'
  const d = new Date(date)
  if (isNaN(d.getTime())) return t ? t('common.noDate') : 'No date'
  
  // Check if it matches a preset
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)
  const twoWeeks = new Date(today)
  twoWeeks.setDate(today.getDate() + 14)
  
  const dateStr = date
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  const nextWeekStr = nextWeek.toISOString().split('T')[0]
  const twoWeeksStr = twoWeeks.toISOString().split('T')[0]
  
  if (dateStr === todayStr) return 'Tonight'
  if (dateStr === tomorrowStr) return 'Tomorrow'
  if (dateStr === nextWeekStr) return 'Next Week'
  if (dateStr === twoWeeksStr) return 'Two Weeks'
  
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function getDueTone(date?: string | null, isCompleted?: boolean) {
  if (!date) return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100'
  if (isCompleted) return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100'
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const d = new Date(date)
  const diffDays = Math.ceil((d.getTime() - startOfToday.getTime()) / (1000*60*60*24))
  if (diffDays < 0) return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
  if (diffDays <= 7) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100'
}

// ——— Derived status helpers ———
function isDateOverdue(date?: string | null) {
  if (!date) return false
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d = new Date(date)
  return !isNaN(d.getTime()) && d.getTime() < startOfToday.getTime()
}

function displayStatusFrom(status: Status, dueDate?: string | null): Status {
  if (status === 'Completed') return status
  return isDateOverdue(dueDate) ? 'Overdue' : status
}

function Avatar({ user, size = 28 }: { user?: User; size?: number }) {
  const style: React.CSSProperties = { width: size, height: size }
  if (!user) return <div style={style} className="rounded-full bg-neutral-200 dark:bg-neutral-700" />
  return (
    <div style={style} className={`rounded-full ${user.color} text-white flex items-center justify-center text-[10px] font-semibold`}>
      {user.initials}
    </div>
  )
}

// Advanced date presets
type DatePreset = 'tonight' | 'tomorrow' | 'next-week' | 'two-weeks' | 'custom'

const getDateFromPreset = (preset: DatePreset): string | null => {
  const now = new Date()
  switch (preset) {
    case 'tonight':
      return now.toISOString().split('T')[0]
    case 'tomorrow':
      const tomorrow = new Date(now)
      tomorrow.setDate(now.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    case 'next-week':
      const nextWeek = new Date(now)
      nextWeek.setDate(now.getDate() + 7)
      return nextWeek.toISOString().split('T')[0]
    case 'two-weeks':
      const twoWeeks = new Date(now)
      twoWeeks.setDate(now.getDate() + 14)
      return twoWeeks.toISOString().split('T')[0]
    default:
      return null
  }
}

const getPresetLabel = (preset: DatePreset): string => {
  switch (preset) {
    case 'tonight': return 'Tonight'
    case 'tomorrow': return 'Tomorrow'
    case 'next-week': return 'Next Week'
    case 'two-weeks': return 'Two Weeks'
    case 'custom': return 'Custom Date'
    default: return 'Custom Date'
  }
}

function MultiAssigneeSelect({ users, values, onChange, disabled, unassignedLabel }: {
  users: User[]
  values: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
  unassignedLabel: string
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const toggleUser = (userId: string) => {
    if (values.includes(userId)) {
      onChange(values.filter(id => id !== userId))
    } else {
      onChange([...values, userId])
    }
  }
  
  const selectedUsers = users.filter(u => values.includes(u.id))
  
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        className="inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full text-left"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
        disabled={disabled}
      >
        <div className="flex -space-x-1">
          {selectedUsers.length === 0 ? (
            <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          ) : (
            selectedUsers.slice(0, 3).map(user => (
              <Avatar key={user.id} user={user} size={24} />
            ))
          )}
          {selectedUsers.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-neutral-400 text-white flex items-center justify-center text-xs font-semibold">
              +{selectedUsers.length - 3}
            </div>
          )}
        </div>
        <span className="text-sm text-neutral-700 dark:text-neutral-200 flex-1">
          {selectedUsers.length === 0 ? unassignedLabel : `${selectedUsers.length} assigned`}
        </span>
        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg z-50">
          <div className="p-2 space-y-1">
            {users.map(user => (
              <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <Avatar user={user} size={20} />
                <span className="text-sm">{user.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AdvancedDatePicker({ value, onChange, onBlur }: {
  value: string | null
  onChange: (date: string | null) => void
  onBlur: () => void
}) {
  const [selectedPreset, setSelectedPreset] = React.useState<DatePreset>('custom')
  const [customDate, setCustomDate] = React.useState(value || '')
  
  const presets: DatePreset[] = ['tonight', 'tomorrow', 'next-week', 'two-weeks', 'custom']
  
  const handlePresetChange = (preset: DatePreset) => {
    setSelectedPreset(preset)
    if (preset !== 'custom') {
      const date = getDateFromPreset(preset)
      onChange(date)
      onBlur()
    }
  }
  
  const handleCustomDateChange = (date: string) => {
    setCustomDate(date)
    onChange(date || null)
  }
  
  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg p-3 min-w-48">
      <div className="space-y-2">
        {presets.map(preset => (
          <button
            key={preset}
            className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
              selectedPreset === preset ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''
            }`}
            onClick={() => handlePresetChange(preset)}
          >
            {getPresetLabel(preset)}
          </button>
        ))}
      </div>
      {selectedPreset === 'custom' && (
        <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <input
            type="date"
            className="input py-1 text-sm w-full"
            value={customDate}
            onChange={(e) => handleCustomDateChange(e.target.value)}
            onBlur={onBlur}
            autoFocus
          />
        </div>
      )}
    </div>
  )
}

function StatusSelect({ value, onChange, t }:{ value: Status; onChange: (s: Status)=>void; t: (k: string) => string }){
  // Overdue is auto-derived from due date; do not allow selecting it directly
  const options: Status[] = ['New','In Progress','Completed']
  const coercedValue = value === 'Overdue' ? 'In Progress' : value
  return (
    <select className="input py-1 pr-8 text-sm" value={coercedValue} onChange={(e)=>onChange(e.target.value as Status)}>
      {options.map(o=> <option key={o} value={o}>{t(`status.${o}`)}</option>)}
    </select>
  )
}

export default function TasksList(){
  const { t: tr } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [defaultProject, setDefaultProject] = useState<APIProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch users, tasks, and default project in parallel
        const [apiUsers, apiTasks, project] = await Promise.all([
          usersService.getActiveUsers(),
          tasksService.getAllTasks(),
          projectsService.getOrCreateDefaultProject()
        ])
        
        // Convert API data to component format
        const convertedUsers = apiUsers.map((user, index) => convertAPIUserToUser(user, index))
        const convertedTasks = apiTasks.map((task, index) => convertAPITaskToTask(task, index, project))
        
        setUsers(convertedUsers)
        setTasks(convertedTasks)
        setDefaultProject(project)
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load tasks and users. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // inline-edit states for pill/chip UX
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [editingAssignee, setEditingAssignee] = useState<string | null>(null)
  const [editingDue, setEditingDue] = useState<string | null>(null)
  
  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setEditingStatus(null)
      setEditingAssignee(null)
      setEditingDue(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Filters
  type FilterState = { noDate: boolean; oneAssigned: boolean; status: 'All' | Status; assignee: 'All' | 'Unassigned' | string; search: string }
  const [filters, setFilters] = useState<FilterState>({ noDate: false, oneAssigned: false, status: 'All', assignee: 'All', search: '' })

  const filteredTasks = useMemo(() => {
    let list = tasks.slice()
    if (filters.noDate) list = list.filter(t => !t.dueDate)
    if (filters.oneAssigned) list = list.filter(t => t.assigneeIds.length === 1)
    if (filters.status !== 'All') list = list.filter(t => displayStatusFrom(t.status, t.dueDate) === filters.status)
    if (filters.assignee === 'Unassigned') list = list.filter(t => t.assigneeIds.length === 0)
    else if (filters.assignee !== 'All') list = list.filter(t => t.assigneeIds.includes(filters.assignee))
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      list = list.filter(t => t.name.toLowerCase().includes(q))
    }
    return list
  }, [tasks, filters])

  const userById = useMemo(()=>Object.fromEntries(users.map(u=>[u.id,u])),[users])

  const addTask = async () => {
    try {
      if (!defaultProject) {
        setError('No project available. Please try refreshing the page.')
        return
      }
      
      const newTaskData = {
        title: tr('pages.tasks.newTask'),
        description: '',
        status: 'PENDING' as APIStatus,
        projectId: defaultProject.id,
      }
      
      const apiTask = await tasksService.createTask(newTaskData)
      const newTask = convertAPITaskToTask(apiTask, tasks.length, defaultProject)
      newTask.expanded = true
      
      setTasks(prev => [newTask, ...prev])
    } catch (err) {
      console.error('Error adding task:', err)
      setError('Failed to create task. Please try again.')
    }
  }

  const addSubtask = async (taskId: string) => {
    try {
      const parent = tasks.find(t => t.id === taskId)
      const projId = parent?.projectId ?? defaultProject?.id
      if (!projId) {
        setError('No project available. Please try refreshing the page.')
        return
      }
      const apiSub = await tasksService.createSubtask(taskId, {
        title: tr('pages.tasks.newSubtask'),
        status: 'PENDING' as APIStatus,
        projectId: projId,
      })
      const newSub = convertAPISubtaskToSubtask(apiSub, parent ? parent.subtasks.length : 0)
      setTasks(prev => prev.map(t => t.id===taskId ? {
        ...t,
        expanded: true,
        subtasks: [...t.subtasks, newSub]
      } : t))
    } catch (err) {
      console.error('Error adding subtask:', err)
      setError('Failed to create subtask. Please try again.')
    }
  }

  const updateTask = async (taskId: string, patch: Partial<Task>) => {
    // Optimistically update the UI
    setTasks(prev => prev.map(t => t.id===taskId ? { ...t, ...patch } : t))
    
    try {
      const promises: Promise<any>[] = []
      const apiPatch: any = {}
      if (patch.name) apiPatch.title = patch.name
      if (patch.status) apiPatch.status = convertStatusToAPIStatus(patch.status)

      if (Object.keys(apiPatch).length > 0) {
        promises.push(tasksService.updateTask(taskId, apiPatch))
      }
      if (patch.assigneeIds !== undefined) {
        promises.push(tasksService.updateTaskAssignees(taskId, patch.assigneeIds))
      }

      await Promise.all(promises)
    } catch (err) {
      console.error('Error updating task:', err)
      setError('Failed to update task. Please try again.')
      // TODO: Consider reverting optimistic update if necessary
    }
  }

  const updateSubtask = async (taskId: string, subId: string, patch: Partial<Subtask>) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id===taskId ? ({
      ...t,
      subtasks: t.subtasks.map(s => s.id===subId ? { ...s, ...patch } : s)
    }) : t))
    try {
      const promises: Promise<any>[] = []
      const apiPatch: any = {}
      if (patch.name) apiPatch.title = patch.name
      if (patch.status) apiPatch.status = convertStatusToAPIStatus(patch.status)
      if (Object.keys(apiPatch).length > 0) {
        promises.push(tasksService.updateSubtask(subId, apiPatch))
      }
      if (patch.assigneeIds !== undefined) {
        promises.push(tasksService.updateTaskAssignees(subId, patch.assigneeIds))
      }
      await Promise.all(promises)
    } catch (err) {
      console.error('Error updating subtask:', err)
      setError('Failed to update subtask. Please try again.')
    }
  }

  const removeSubtask = async (taskId: string, subId: string) => {
    // Optimistic remove
    setTasks(prev => prev.map(t => t.id===taskId ? { ...t, subtasks: t.subtasks.filter(s=>s.id!==subId) } : t))
    try {
      await tasksService.deleteTask(subId)
    } catch (err) {
      console.error('Error removing subtask:', err)
      setError('Failed to remove subtask. Please try again.')
    }
  }

  const sectionHeader = (name: string, newLabel: string) => (
    <div className="flex items-center justify-between px-2 py-3">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{name}</h2>
      <button className="btn-outline text-xs" onClick={addTask}>
        <span className="mr-1">＋</span> {newLabel}
      </button>
    </div>
  )

  // ——— DnD helpers ———
  const taskItemIds = useMemo(() => filteredTasks
    .slice()
    .sort((a,b)=>a.order-b.order)
    .map(t=>`task-${t.id}`), [filteredTasks])

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const a = String(active.id)
    const o = String(over.id)
    if (a.startsWith('task-') && o.startsWith('task-')) {
      const aid = a.replace('task-', '')
      const oid = o.replace('task-', '')
      const ordered = tasks.slice().sort((x,y)=>x.order-y.order)
      const oldIndex = ordered.findIndex(t=>t.id===aid)
      const newIndex = ordered.findIndex(t=>t.id===oid)
      const moved = arrayMove(ordered, oldIndex, newIndex).map((t: Task, i: number)=>({ ...t, order: i }))
      setTasks(moved)
      // Persist reorder to backend (optimistic)
      tasksService.reorderTasks(moved.map((t: Task) => t.id)).catch(err => {
        console.error('Error reordering tasks:', err)
      })
      return
    }
    if (a.startsWith('sub-') && o.startsWith('sub-')) {
      const parse = (id: string) => {
        const [, tid, sid] = id.split('-')
        return { tid, sid }
      }
      const { tid: ta, sid: sa } = parse(a)
      const { tid: to, sid: so } = parse(o)
      if (ta !== to) return // cross-parent moves not supported in v1
      // Compute new subtask order from current state, update optimistically, then persist
      const parent = tasks.find(t => t.id === ta)
      if (!parent) return
      const orderedSubs = parent.subtasks.slice().sort((x,y)=>x.order-y.order)
      const oldIndex = orderedSubs.findIndex(s=>s.id===sa)
      const newIndex = orderedSubs.findIndex(s=>s.id===so)
      const moved = arrayMove(orderedSubs, oldIndex, newIndex).map((s: Subtask, i: number)=>({ ...s, order: i }))
      setTasks(prev => prev.map(t => t.id===ta ? ({ ...t, subtasks: moved }) : t))
      tasksService.reorderSubtasks(ta, moved.map(s => s.id)).catch(err => {
        console.error('Error reordering subtasks:', err)
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{tr('pages.tasks.title')}</h1>
            <p className="text-neutral-500 dark:text-neutral-400">{tr('pages.tasks.subtitle')}</p>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-neutral-600 dark:text-neutral-400">Loading tasks...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{tr('pages.tasks.title')}</h1>
            <p className="text-neutral-500 dark:text-neutral-400">{tr('pages.tasks.subtitle')}</p>
          </div>
        </div>
        <div className="card p-6">
          <div className="text-center space-y-4">
            <div className="text-red-600 dark:text-red-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button 
              className="btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{tr('pages.tasks.title')}</h1>
          <p className="text-neutral-500 dark:text-neutral-400">{tr('pages.tasks.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline" onClick={addTask}>{tr('actions.new')}</button>
          <button className="btn-primary">{tr('actions.import')}</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {sectionHeader(tr('pages.tasks.sectionAll'), tr('pages.tasks.newTask'))}
        {/* Faux sub-navigation */}
        <div className="px-3 pb-2 text-sm text-neutral-600 dark:text-neutral-300 flex items-center gap-4">
          <button className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium">{tr('pages.tasks.subnavAll')}</button>
          <span className="text-neutral-400">•</span>
          <button className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">{tr('pages.tasks.subnavTimeline')}</button>
          <button className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">{tr('pages.tasks.subnavByStatus')}</button>
          <button className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">{tr('pages.tasks.subnavMore')}</button>
        </div>
        {/* Filters */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Filters:</span>
            <button
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs transition-colors ${
                filters.noDate
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                  : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setFilters(prev => ({ ...prev, noDate: !prev.noDate }))}
            >
              {tr('common.noDate')}
              {filters.noDate && (
                <svg className="w-3 h-3 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
            <button
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs transition-colors ${
                filters.oneAssigned
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                  : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setFilters(prev => ({ ...prev, oneAssigned: !prev.oneAssigned }))}
            >
              1 assigned
              {filters.oneAssigned && (
                <svg className="w-3 h-3 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
            {/* Status filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">Status:</span>
              <select
                className="input py-1 text-xs"
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              >
                {(['All','New','In Progress','Completed','Overdue'] as const).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {/* Assignee filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">Assignee:</span>
              <select
                className="input py-1 text-xs"
                value={filters.assignee}
                onChange={e => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
              >
                <option value="All">All</option>
                <option value="Unassigned">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            {/* Search */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">Search:</span>
              <input
                type="text"
                className="input py-1 text-xs"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            {(filters.noDate || filters.oneAssigned || filters.status !== 'All' || filters.assignee !== 'All' || filters.search.trim()) && (
              <div className="ml-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>
                  Showing {filteredTasks.length} of {tasks.length}
                </span>
                <button
                  className="underline hover:text-neutral-700 dark:hover:text-neutral-300"
                  onClick={() => setFilters({ noDate: false, oneAssigned: false, status: 'All', assignee: 'All', search: '' })}
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="max-h-[65vh] overflow-auto">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <div className="col-span-4">{tr('pages.tasks.columns.name')}</div>
              <div className="col-span-2">{tr('pages.tasks.columns.dueDate')}</div>
              <div className="col-span-2">{tr('pages.tasks.columns.status')}</div>
              <div className="col-span-2">{tr('pages.tasks.columns.assignee')}</div>
              <div className="col-span-1">{tr('pages.tasks.columns.project')}</div>
              <div className="col-span-1 text-right"> </div>
            </div>
          </div>
          <DndContext onDragEnd={onDragEnd}>
          <SortableContext items={taskItemIds} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {filteredTasks.slice().sort((a,b)=>a.order-b.order).map((t) => (
            <div key={t.id} className="">
              {/* Parent row */}
              <SortableTaskRow id={`task-${t.id}`}>
              {({attributes, listeners}) => (
              <div className="px-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-150">
                <div className="grid grid-cols-12 gap-2 items-center px-2 py-3">
                  <div className="col-span-4 flex items-center gap-2">
                    <button
                      className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      onClick={()=>updateTask(t.id, { expanded: !t.expanded })}
                      aria-label={t.expanded ? tr('tooltips.collapse') : tr('tooltips.expand')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-transform ${t.expanded ? 'rotate-90' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-grab active:cursor-grabbing"
                      aria-label={tr('tooltips.dragTask')}
                      {...attributes}
                      {...listeners}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-neutral-400">
                        <path d="M10 6a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM10 12a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM10 18a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                    <input
                      className="input py-1 text-sm flex-1 truncate font-medium"
                      value={t.name}
                      onChange={(e)=>updateTask(t.id,{ name: e.target.value })}
                      title={t.name}
                      placeholder="Task name..."
                    />
                  </div>
                  <div className="col-span-2">
                    {editingDue === `task:${t.id}` ? (
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <AdvancedDatePicker
                          value={t.dueDate ?? null}
                          onChange={(date) => updateTask(t.id, { dueDate: date })}
                          onBlur={() => setEditingDue(null)}
                        />
                      </div>
                    ) : (
                      <button
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDueTone(t.dueDate, t.status==='Completed')}`}
                        onClick={(e)=>{ e.stopPropagation(); setEditingDue(`task:${t.id}`) }}
                      >
                        {formatDate(t.dueDate, tr)}
                      </button>
                    )}
                  </div>
                  <div className="col-span-2">
                    {editingStatus === `task:${t.id}` ? (
                      <StatusSelect value={t.status} onChange={(s)=>{ updateTask(t.id,{ status: s }); setEditingStatus(null) }} t={tr} />
                    ) : (
                      (()=>{
                        const ds = displayStatusFrom(t.status, t.dueDate)
                        const isAutoOverdue = ds === 'Overdue' && t.status !== 'Completed'
                        return (
                          <button
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusPillClasses[ds]} ${isAutoOverdue? 'cursor-default' : ''}`}
                            onClick={()=>{ if(!isAutoOverdue) setEditingStatus(`task:${t.id}`) }}
                            title={isAutoOverdue ? tr('tooltips.autoOverdue') : tr('tooltips.editStatus')}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDotClasses[ds]}`}></span>
                            {tr(`status.${ds}`)}
                          </button>
                        )
                      })()
                    )}
                  </div>
                  <div className="col-span-2">
                    {editingAssignee === `task:${t.id}` ? (
                      <MultiAssigneeSelect
                        users={users}
                        values={t.assigneeIds}
                        onChange={(ids) => { updateTask(t.id, { assigneeIds: ids }); setEditingAssignee(null) }}
                        unassignedLabel={tr('common.unassigned')}
                      />
                    ) : (
                      <button
                        className="inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full text-left"
                        onClick={(e)=>{ e.stopPropagation(); setEditingAssignee(`task:${t.id}`) }}
                      >
                        <div className="flex -space-x-1">
                          {t.assigneeIds.length === 0 ? (
                            <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                          ) : (
                            t.assigneeIds.slice(0, 3).map(id => (
                              <Avatar key={id} user={userById[id]} size={24} />
                            ))
                          )}
                          {t.assigneeIds.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-neutral-400 text-white flex items-center justify-center text-xs font-semibold">
                              +{t.assigneeIds.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-neutral-700 dark:text-neutral-200">
                          {t.assigneeIds.length === 0 ? tr('common.unassigned') : `${t.assigneeIds.length} assigned`}
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="col-span-1">
                    {t.projectName && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {t.projectName}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 text-right">
                    <button className="btn-outline text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" onClick={()=>addSubtask(t.id)}>{tr('actions.addSubtask')}</button>
                  </div>
                </div>
              </div>
              )}
              </SortableTaskRow>

              {/* Subtasks */}
              {t.expanded && (
                <div className="bg-neutral-50 dark:bg-neutral-900/20">
                  <SortableContext items={t.subtasks.slice().sort((a,b)=>a.order-b.order).map(s=>`sub-${t.id}-${s.id}`)} strategy={verticalListSortingStrategy}>
                  {t.subtasks.slice().sort((a,b)=>a.order-b.order).map((s) => {
                    const effectiveAssigneeIds = s.inheritsAssignee ? t.assigneeIds : s.assigneeIds
                    const effectiveDueDate = s.inheritsDueDate ? (t.dueDate ?? null) : (s.dueDate ?? null)
                    return (
                      <SortableSubtaskRow key={s.id} id={`sub-${t.id}-${s.id}`}>
                      {({attributes, listeners}) => (
                      <div className="px-2 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/30 transition-colors duration-150">
                        <div className="grid grid-cols-12 gap-2 items-center px-2 py-2">
                          <div className="col-span-4 flex items-center gap-2 pl-6">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-neutral-400">
                              <path fillRule="evenodd" d="M19.5 4.5a.75.75 0 01.75.75v13.5a.75.75 0 01-1.5 0V5.25a.75.75 0 01.75-.75zM4.5 12a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H5.25A.75.75 0 014.5 12z" clipRule="evenodd" />
                            </svg>
                            <button
                              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-grab active:cursor-grabbing"
                              aria-label={tr('tooltips.dragSubtask')}
                              {...attributes}
                              {...listeners}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-neutral-400">
                                <path d="M10 6a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM10 12a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM10 18a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </button>
                            <input
                              className="input py-1 text-sm flex-1"
                              value={s.name}
                              onChange={(e)=>updateSubtask(t.id, s.id, { name: e.target.value })}
                              placeholder="Subtask name..."
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center">
                              {editingDue === `sub:${t.id}:${s.id}` && !s.inheritsDueDate ? (
                                <div className="relative" onClick={(e) => e.stopPropagation()}>
                                  <AdvancedDatePicker
                                    value={effectiveDueDate}
                                    onChange={(date) => updateSubtask(t.id, s.id, { dueDate: date, inheritsDueDate: false })}
                                    onBlur={() => setEditingDue(null)}
                                  />
                                </div>
                              ) : (
                              <button
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getDueTone(effectiveDueDate, s.status==='Completed')} ${s.inheritsDueDate ? 'opacity-60' : ''}`}
                                  onClick={(e)=>{
                                    e.stopPropagation()
                                    if (s.inheritsDueDate) {
                                      updateSubtask(t.id, s.id, { inheritsDueDate: false, dueDate: effectiveDueDate })
                                    }
                                    setEditingDue(`sub:${t.id}:${s.id}`)
                                  }}
                                  title={s.inheritsDueDate ? tr('tooltips.customizeDueDate') : tr('tooltips.editDueDate')}
                                >
                                  {formatDate(effectiveDueDate, tr)}
                                </button>
                              )}
                            </div>
                            {/* Toggle hidden by request; click chip to convert to Custom */}
                          </div>
                          <div className="col-span-2">
                            {editingStatus === `sub:${t.id}:${s.id}` ? (
                              <StatusSelect value={s.status} onChange={(st)=>{ updateSubtask(t.id,s.id,{ status: st }); setEditingStatus(null) }} t={tr} />
                            ) : (
                              (()=>{
                                const ds = displayStatusFrom(s.status, effectiveDueDate)
                                const isAutoOverdue = ds === 'Overdue' && s.status !== 'Completed'
                                return (
                                  <button
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusPillClasses[ds]} ${isAutoOverdue? 'cursor-default' : ''}`}
                                    onClick={()=>{ if(!isAutoOverdue) setEditingStatus(`sub:${t.id}:${s.id}`) }}
                                    title={isAutoOverdue ? tr('tooltips.autoOverdue') : tr('tooltips.editStatus')}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusDotClasses[ds]}`}></span>
                                    {tr(`status.${ds}`)}
                                  </button>
                                )
                              })()
                            )}
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center gap-2">
                              {editingAssignee === `sub:${t.id}:${s.id}` && !s.inheritsAssignee ? (
                                <MultiAssigneeSelect
                                  users={users}
                                  values={effectiveAssigneeIds}
                                  onChange={(ids) => { updateSubtask(t.id, s.id, { assigneeIds: ids, inheritsAssignee: false }); setEditingAssignee(null) }}
                                  disabled={s.inheritsAssignee}
                                  unassignedLabel={tr('common.unassigned')}
                                />
                              ) : (
                                <button
                                  className={`inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full text-left ${s.inheritsAssignee ? 'opacity-60' : ''}`}
                                  onClick={(e)=>{
                                    e.stopPropagation()
                                    if (s.inheritsAssignee) {
                                      updateSubtask(t.id, s.id, { inheritsAssignee: false, assigneeIds: effectiveAssigneeIds })
                                    }
                                    setEditingAssignee(`sub:${t.id}:${s.id}`)
                                  }}
                                  title={s.inheritsAssignee ? tr('tooltips.customizeAssignee') : tr('tooltips.setAssignee')}
                                >
                                  <div className="flex -space-x-1">
                                    {effectiveAssigneeIds.length === 0 ? (
                                      <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                                    ) : (
                                      effectiveAssigneeIds.slice(0, 3).map(id => (
                                        <Avatar key={id} user={userById[id]} size={20} />
                                      ))
                                    )}
                                    {effectiveAssigneeIds.length > 3 && (
                                      <div className="w-5 h-5 rounded-full bg-neutral-400 text-white flex items-center justify-center text-xs font-semibold">
                                        +{effectiveAssigneeIds.length - 3}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-sm text-neutral-700 dark:text-neutral-200">
                                    {effectiveAssigneeIds.length === 0 ? tr('common.unassigned') : `${effectiveAssigneeIds.length} assigned`}
                                  </span>
                                </button>
                              )}
                            </div>
                            {/* Toggle hidden by request; click chip to convert to Custom */}
                          </div>
                          <div className="col-span-1"></div>
                          <div className="col-span-1 text-right">
                            <button className="text-neutral-500 hover:text-rose-500 text-xs transition-colors" onClick={()=>removeSubtask(t.id, s.id)}>{tr('actions.remove')}</button>
                          </div>
                        </div>
                      </div>
                      )}
                      </SortableSubtaskRow>
                    )
                  })}
                  </SortableContext>
                </div>
              )}
            </div>
          ))}
          </div>
          </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  )
}

// ——— Sortable row wrappers ———
function SortableTaskRow({ id, children }:{ id: string; children: (p:{attributes: any; listeners: any})=>React.ReactNode }){
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return <div ref={setNodeRef} style={style}>{children({attributes, listeners})}</div>
}

function SortableSubtaskRow({ id, children }:{ id: string; children: (p:{attributes: any; listeners: any})=>React.ReactNode }){
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return <div ref={setNodeRef} style={style}>{children({attributes, listeners})}</div>
}
