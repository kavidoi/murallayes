import React, { useMemo, useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
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
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

interface Subtask {
  id: string
  name: string
  status: Status
  inheritsAssignee: boolean
  inheritsDueDate: boolean
  assigneeId?: string | null
  dueDate?: string | null // YYYY-MM-DD
  dueTime?: string | null // HH:MM format
  order: number
}

interface Task {
  id: string
  name: string
  status: Status
  priority: Priority
  assigneeId?: string | null
  dueDate?: string | null
  dueTime?: string | null // HH:MM format
  expanded?: boolean
  subtasks: Subtask[]
  order: number
  // Multi-assignee support (only userId needed for avatar/name lookup)
  assignees?: { userId: string }[]
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

const convertAPITaskToTask = (apiTask: APITask, order: number): Task => ({
  id: apiTask.id,
  name: apiTask.title,
  status: convertAPIStatusToStatus(apiTask.status),
  priority: apiTask.priority || 'MEDIUM',
  assigneeId: apiTask.assigneeId || null,
  dueDate: apiTask.dueDate ? apiTask.dueDate.split('T')[0] : null,
  dueTime: apiTask.dueTime || null,
  expanded: false,
  subtasks: [], // Simplificado: sin subtareas por ahora
  order: order, // Usar order proporcionado
  // Map assignees to user IDs for the multi-assignee display
  assignees: apiTask.assignees || [],
})

const convertAPISubtaskToSubtask = (apiSubtask: APITask, order: number): Subtask => ({
  id: apiSubtask.id,
  name: apiSubtask.title,
  status: convertAPIStatusToStatus(apiSubtask.status),
  inheritsAssignee: !apiSubtask.assigneeId, // If no assignee set, inherit from parent
  inheritsDueDate: !apiSubtask.dueDate, // If no due date set, inherit from parent
  assigneeId: apiSubtask.assigneeId || null,
  dueDate: apiSubtask.dueDate ? apiSubtask.dueDate.split('T')[0] : null,
  dueTime: apiSubtask.dueTime || null,
  order: apiSubtask.orderIndex || order,
});

// ——— Date helpers ———
const formatYMD = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const parseLocalDate = (ymd: string): Date => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
const getTodayDate = (): string => {
  return formatYMD(new Date())
}
const addDaysLocal = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return formatYMD(d)
}

// ——— Priority helpers ———
const getPriorityEmoji = (priority: Priority): string => {
  switch (priority) {
    case 'LOW':
      return '🟢'; // Green circle
    case 'MEDIUM':
      return '🟡'; // Yellow circle
    case 'HIGH':
      return '🟠'; // Orange circle
    case 'URGENT':
      return '🔴'; // Red circle
    default:
      return '🟡';
  }
};

const getPriorityLabel = (priority: Priority): string => {
  switch (priority) {
    case 'LOW':
      return 'Low';
    case 'MEDIUM':
      return 'Medium';
    case 'HIGH':
      return 'High';
    case 'URGENT':
      return 'Urgent';
    default:
      return 'Medium';
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

function formatDate(date?: string | null, time?: string | null, t?: (k: string) => string) {
  if (!date) return t ? t('common.noDate') : 'No date'
  const d = parseLocalDate(date)
  if (isNaN(d.getTime())) return t ? t('common.noDate') : 'No date'
  
  let formattedDate = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  
  if (time) {
    formattedDate += ` ${time}`
  }
  
  return formattedDate
}

function getDueTone(date?: string | null, isCompleted?: boolean) {
  if (!date) return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100'
  if (isCompleted) return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100'
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const d = parseLocalDate(date)
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
  const d = parseLocalDate(date)
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

function AssigneeSelect({ users, value, onChange, disabled, unassignedLabel }:{ users: User[]; value?: string | null; onChange: (v: string | null) => void; disabled?: boolean; unassignedLabel: string }){
  return (
    <select
      className="input py-1 pr-8 text-sm"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
    >
      <option value="">{unassignedLabel}</option>
      {users.map(u => (
        <option key={u.id} value={u.id}>{u.name}</option>
      ))}
    </select>
  )
}

function MultiAssigneeSelect({ 
  users, 
  selectedUserIds, 
  onChange, 
  onClose 
}: { 
  users: User[]; 
  selectedUserIds: string[]; 
  onChange: (userIds: string[]) => void; 
  onClose: () => void;
}) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedUserIds)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const toggleUser = (userId: string) => {
    setTempSelected(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSave = () => {
    onChange(tempSelected)
    onClose()
  }

  return (
    <div ref={containerRef} className="absolute top-0 left-0 z-50 bg-white dark:bg-neutral-800 border rounded-lg shadow-lg p-3 min-w-64">
      <div className="mb-2">
        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Asignar a:</h4>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {users.map(user => (
          <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 p-1 rounded">
            <input
              type="checkbox"
              checked={tempSelected.includes(user.id)}
              onChange={() => toggleUser(user.id)}
              className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            <Avatar user={user} size={24} />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">{user.name}</span>
          </label>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-600">
        <span className="text-xs text-neutral-500">
          {tempSelected.length} seleccionado{tempSelected.length !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <button
            className="text-xs text-neutral-500 hover:text-neutral-700"
            onClick={() => setTempSelected([])}
          >
            Limpiar
          </button>
          <button
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            onClick={handleSave}
          >
            Aplicar
          </button>
        </div>
      </div>
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

// ——— Advanced Date Time Picker ———
function DateTimePicker({ 
  date, 
  time, 
  onDateChange, 
  onTimeChange, 
  onClose,
  autoFocus = false 
}: { 
  date?: string | null; 
  time?: string | null; 
  onDateChange: (date: string | null) => void; 
  onTimeChange: (time: string | null) => void; 
  onClose: () => void;
  autoFocus?: boolean;
}) {
  const [tempDate, setTempDate] = useState(date || getTodayDate())
  const [tempTime, setTempTime] = useState(time || '')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleDateSelect = (selectedDate: string) => {
    setTempDate(selectedDate)
    onDateChange(selectedDate)
  }

  const handleTimeChange = (selectedTime: string) => {
    setTempTime(selectedTime)
    onTimeChange(selectedTime || null)
  }

  const handleClear = () => {
    onDateChange(null)
    onTimeChange(null)
    onClose()
  }

  const quickDateOptions = [
    { label: 'Hoy', value: getTodayDate() },
    { label: 'Mañana', value: addDaysLocal(1) },
    { label: 'En 1 semana', value: addDaysLocal(7) },
  ]

  return (
    <div>
      <div className="flex gap-1 p-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-lg min-w-64">
        <div className="flex-1">
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
            Fecha
          </label>
          <div className="space-y-2">
            <input
              type="date"
              className="input py-1 text-sm w-full"
              value={tempDate}
              onChange={(e) => handleDateSelect(e.target.value)}
              autoFocus={autoFocus}
            />
            <div className="flex gap-1">
              {quickDateOptions.map((option) => (
                <button
                  key={option.label}
                  className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600"
                  onClick={() => handleDateSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="w-20">
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
            Hora
          </label>
          <input
            type="time"
            className="input py-1 text-sm w-full"
            value={tempTime}
            onChange={(e) => handleTimeChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex justify-between mt-2 px-2">
        <button
          className="text-xs text-neutral-500 hover:text-red-500"
          onClick={handleClear}
        >
          Limpiar
        </button>
        <button
          className="text-xs text-blue-600 hover:text-blue-800"
          onClick={onClose}
        >
          Listo
        </button>
      </div>
    </div>
  )
}

function MultiAssigneeSelect({ 
  users, 
  selectedUserIds, 
  onChange, 
  onClose 
}: { 
  users: User[]; 
  selectedUserIds: string[]; 
  onChange: (userIds: string[]) => void; 
  onClose: () => void;
}) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedUserIds)

  const toggleUser = (userId: string) => {
    setTempSelected(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSave = () => {
    onChange(tempSelected)
    onClose()
  }

  return (
    <div>
      <div className="mb-2">
        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Asignar a:</h4>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {users.map(user => (
          <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 p-1 rounded">
            <input
              type="checkbox"
              checked={tempSelected.includes(user.id)}
              onChange={() => toggleUser(user.id)}
              className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            <Avatar user={user} size={24} />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">{user.name}</span>
          </label>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-600">
        <span className="text-xs text-neutral-500">
          {tempSelected.length} seleccionado{tempSelected.length !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <button
            className="text-xs text-neutral-500 hover:text-neutral-700"
            onClick={() => setTempSelected([])}
          >
            Limpiar
          </button>
          <button
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            onClick={handleSave}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}

// Generic Popover using a Portal
function Popover({ target, onClose, children }: { target: HTMLElement; onClose: () => void; children: React.ReactNode }) {
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (target) {
      const rect = target.getBoundingClientRect()
      setPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
    }
  }, [target])

  const portalRoot = document.getElementById('portal-root')
  if (!portalRoot || !position) return null

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      className="absolute z-50"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {children}
    </div>,
    portalRoot
  )
}

// ...

function TasksList(){
  // ...

  const [popoverTarget, setPopoverTarget] = useState<{ id: string; element: HTMLElement } | null>(null)

  // ...

  return (
    <div className="space-y-6 animate-fade-in">
      // ...

      {popoverTarget && popoverTarget.id.startsWith('datepicker-') && (
        <Popover target={popoverTarget.element} onClose={() => setPopoverTarget(null)}>
          <DateTimePicker
            date={tasks.find(t => `datepicker-${t.id}` === popoverTarget.id)?.dueDate}
            time={tasks.find(t => `datepicker-${t.id}` === popoverTarget.id)?.dueTime}
            onDateChange={(d) => updateTask(popoverTarget.id.replace('datepicker-', ''), { dueDate: d })}
            onTimeChange={(time) => updateTask(popoverTarget.id.replace('datepicker-', ''), { dueTime: time })}
            onClose={() => setPopoverTarget(null)}
            autoFocus
          />
        </Popover>
      )}

      {popoverTarget && popoverTarget.id.startsWith('assignee-') && (
        <Popover target={popoverTarget.element} onClose={() => setPopoverTarget(null)}>
          <MultiAssigneeSelect
            users={users}
            selectedUserIds={tasks.find(t => `assignee-${t.id}` === popoverTarget.id)?.assignees?.map(a => a.userId) || []}
            onChange={(userIds) => updateTaskAssignees(popoverTarget.id.replace('assignee-', ''), userIds)}
            onClose={() => setPopoverTarget(null)}
          />
        </Popover>
      )}
                          <>
                            <div className="flex -space-x-1">
                              {t.assignees.slice(0, 3).map((assignee: { userId: string }) => (
                                <Avatar key={assignee.userId} user={userById[assignee.userId]} size={20} />
                              ))}
                              {t.assignees.length > 3 && (
                                <div className="w-5 h-5 bg-neutral-300 dark:bg-neutral-600 rounded-full flex items-center justify-center text-xs">
                                  +{t.assignees.length - 3}
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-neutral-700 dark:text-neutral-200 ml-1">
                              {t.assignees.length === 1 
                                ? userById[t.assignees[0].userId]?.name || 'Usuario'
                                : `${t.assignees.length} personas`
                              }
                            </span>
                          </>
                        ) : (
                          <>
                            <Avatar user={undefined} size={20} />
                            <span className="text-sm text-neutral-700 dark:text-neutral-200">
                              {tr('common.unassigned')}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="col-span-1 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button className="btn-outline text-xs px-2 py-1" onClick={()=>addSubtask(t.id)} title={tr('actions.addSubtask')}>+sub</button>
                      <button 
                        className="text-neutral-500 hover:text-rose-500 text-xs p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800" 
                        onClick={()=>removeTask(t.id)}
                        title={tr('actions.remove')}
                        aria-label={tr('actions.remove')}
                      >
                        ✕
                      </button>
                    </div>
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
                    const effectiveAssigneeId = s.inheritsAssignee ? (t.assigneeId ?? null) : (s.assigneeId ?? null)
                    const effectiveDueDate = s.inheritsDueDate ? (t.dueDate ?? null) : (s.dueDate ?? null)
                    const effectiveDueTime = s.inheritsDueDate ? (t.dueTime ?? null) : (s.dueTime ?? null)
                    return (
                      <SortableSubtaskRow key={s.id} id={`sub-${t.id}-${s.id}`}>
                      {({attributes, listeners}) => (
                      <div
                        className={`px-2 relative ${(showAdvancedDatePicker === `sub:${t.id}:${s.id}` || editingAssignee === `sub:${t.id}:${s.id}`) ? 'z-40' : ''}`}
                      >
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
                            />
                          </div>
                          <div className="col-span-1">
                            {/* Empty priority column for subtasks to maintain alignment */}
                          </div>
                          <div className="col-span-2 relative">
                            <div className="flex items-center">
                              {showAdvancedDatePicker === `sub:${t.id}:${s.id}` && !s.inheritsDueDate ? (
                                <div className="absolute top-0 left-0 z-50">
                                  <DateTimePicker
                                    date={effectiveDueDate}
                                    time={effectiveDueTime}
                                    onDateChange={(date) => updateSubtask(t.id, s.id, { dueDate: date, inheritsDueDate: false })}
                                    onTimeChange={(time) => updateSubtask(t.id, s.id, { dueTime: time, inheritsDueDate: false })}
                                    onClose={() => setShowAdvancedDatePicker(null)}
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <button
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getDueTone(effectiveDueDate, s.status==='Completed')} ${s.inheritsDueDate ? 'opacity-60' : ''}`}
                                  onClick={()=>{
                                    if (s.inheritsDueDate) {
                                      updateSubtask(t.id, s.id, { inheritsDueDate: false, dueDate: effectiveDueDate ?? null, dueTime: effectiveDueTime ?? null })
                                    }
                                    setShowAdvancedDatePicker(`sub:${t.id}:${s.id}`)
                                  }}
                                  title={s.inheritsDueDate ? tr('tooltips.customizeDueDate') : tr('tooltips.editDueDate')}
                                >
                                  {formatDate(effectiveDueDate, effectiveDueTime, tr)}
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
                                <AssigneeSelect
                                  users={users}
                                  value={effectiveAssigneeId}
                                  onChange={(v)=>{ updateSubtask(t.id, s.id, { assigneeId: v, inheritsAssignee: false }); setEditingAssignee(null) }}
                                  disabled={s.inheritsAssignee}
                                  unassignedLabel={tr('common.unassigned')}
                                />
                              ) : (
                                <button
                                  className={`inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full text-left ${s.inheritsAssignee ? 'opacity-60' : ''}`}
                                  onClick={()=>{
                                    if (s.inheritsAssignee) {
                                      updateSubtask(t.id, s.id, { inheritsAssignee: false, assigneeId: effectiveAssigneeId ?? null })
                                    }
                                    setEditingAssignee(`sub:${t.id}:${s.id}`)
                                  }}
                                  title={s.inheritsAssignee ? tr('tooltips.customizeAssignee') : tr('tooltips.setAssignee')}
                                >
                                  <Avatar user={effectiveAssigneeId ? userById[effectiveAssigneeId] : undefined} />
                                  <span className="text-sm text-neutral-700 dark:text-neutral-200">
                                    {effectiveAssigneeId ? userById[effectiveAssigneeId].name : tr('common.unassigned')}
                                  </span>
                                </button>
                              )}
                            </div>
                            {/* Toggle hidden by request; click chip to convert to Custom */}
                          </div>
                          <div className="col-span-1 text-right">
                            <button 
                              className="text-neutral-500 hover:text-rose-500 text-xs p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800" 
                              onClick={()=>removeSubtask(t.id, s.id)}
                              title={tr('actions.remove')}
                              aria-label={tr('actions.remove')}
                            >
                              ✕
                            </button>
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
