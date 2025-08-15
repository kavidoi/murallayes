import React, { useMemo, useState } from 'react'
import { DndContext } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ——— Types ———
interface User {
  id: string
  name: string
  initials: string
  color: string // Tailwind bg-* color class
}

type Status = 'New' | 'In Progress' | 'Completed' | 'Overdue'

interface Subtask {
  id: string
  name: string
  status: Status
  inheritsAssignee: boolean
  inheritsDueDate: boolean
  assigneeId?: string | null
  dueDate?: string | null // YYYY-MM-DD
  order: number
}

interface Task {
  id: string
  name: string
  status: Status
  assigneeId?: string | null
  dueDate?: string | null
  expanded?: boolean
  subtasks: Subtask[]
  order: number
}

// ——— Mock data (local state for now) ———
const initialUsers: User[] = [
  { id: 'u1', name: 'Alex Hao', initials: 'AH', color: 'bg-blue-500' },
  { id: 'u2', name: 'Won Chung', initials: 'WC', color: 'bg-emerald-500' },
  { id: 'u3', name: 'Bella Singh', initials: 'BS', color: 'bg-fuchsia-500' },
  { id: 'u4', name: 'Ben Lang', initials: 'BL', color: 'bg-amber-500' },
  { id: 'u5', name: 'Nicole Wu', initials: 'NW', color: 'bg-cyan-500' },
]

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

function formatDate(date?: string | null) {
  if (!date) return 'No date'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'No date'
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

function AssigneeSelect({ users, value, onChange, disabled }:{ users: User[]; value?: string | null; onChange: (v: string | null) => void; disabled?: boolean }){
  return (
    <select
      className="input py-1 pr-8 text-sm"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
    >
      <option value="">Unassigned</option>
      {users.map(u => (
        <option key={u.id} value={u.id}>{u.name}</option>
      ))}
    </select>
  )
}

function StatusSelect({ value, onChange }:{ value: Status; onChange: (s: Status)=>void }){
  // Overdue is auto-derived from due date; do not allow selecting it directly
  const options: Status[] = ['New','In Progress','Completed']
  const coercedValue = value === 'Overdue' ? 'In Progress' : value
  return (
    <select className="input py-1 pr-8 text-sm" value={coercedValue} onChange={(e)=>onChange(e.target.value as Status)}>
      {options.map(o=> <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function InheritToggle({ value, onChange, ariaLabel }: { value: boolean; onChange: (v: boolean) => void; ariaLabel?: string }){
  return (
    <div className="mt-1 inline-flex rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700" role="tablist" aria-label={ariaLabel}>
      <button
        type="button"
        className={`px-2 py-0.5 text-[11px] transition-colors ${value ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100' : 'bg-transparent text-neutral-500 dark:text-neutral-400'}`}
        onClick={()=>!value && onChange(true)}
        aria-selected={value}
        role="tab"
      >
        Inherited
      </button>
      <div className="w-px bg-neutral-200 dark:bg-neutral-700" />
      <button
        type="button"
        className={`px-2 py-0.5 text-[11px] transition-colors ${!value ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100' : 'bg-transparent text-neutral-500 dark:text-neutral-400'}`}
        onClick={()=>value && onChange(false)}
        aria-selected={!value}
        role="tab"
      >
        Custom
      </button>
    </div>
  )
}

export default function TasksList(){
  const [users] = useState<User[]>(initialUsers)
  const [tasks, setTasks] = useState<Task[]>([{
    id: 't1',
    name: 'Bug bash 2025',
    status: 'In Progress',
    assigneeId: 'u1',
    dueDate: '2025-09-15',
    expanded: true,
    order: 0,
    subtasks: [
      { id: 's1', name: 'UI refresh for login screen', status: 'New', inheritsAssignee: true, inheritsDueDate: false, dueDate: '2025-09-01', order: 0 },
      { id: 's2', name: 'Improve copy + paste on mobile', status: 'Completed', inheritsAssignee: false, inheritsDueDate: true, assigneeId: 'u3', order: 1 },
      { id: 's3', name: 'Update workspace setting icons', status: 'In Progress', inheritsAssignee: false, inheritsDueDate: false, assigneeId: 'u4', dueDate: '2025-09-10', order: 2 },
    ],
  },{
    id: 't2',
    name: 'Marketing improvements',
    status: 'In Progress',
    assigneeId: 'u2',
    dueDate: '2025-09-30',
    expanded: true,
    order: 1,
    subtasks: [
      { id: 's4', name: 'Revamp user onboarding emails', status: 'In Progress', inheritsAssignee: true, inheritsDueDate: true, order: 0 },
      { id: 's5', name: 'Homepage cleanup', status: 'In Progress', inheritsAssignee: false, inheritsDueDate: false, assigneeId: 'u3', dueDate: '2025-09-12', order: 1 },
      { id: 's6', name: 'Analyze onboarding email results', status: 'Completed', inheritsAssignee: false, inheritsDueDate: true, assigneeId: 'u5', order: 2 },
    ],
  }])

  // inline-edit states for pill/chip UX
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [editingAssignee, setEditingAssignee] = useState<string | null>(null)
  const [editingDue, setEditingDue] = useState<string | null>(null)

  const userById = useMemo(()=>Object.fromEntries(users.map(u=>[u.id,u])),[users])

  const addTask = () => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      name: 'New task',
      status: 'New',
      assigneeId: null,
      dueDate: null,
      expanded: true,
      order: tasks.length,
      subtasks: [],
    }
    setTasks(prev => [newTask, ...prev])
  }

  const addSubtask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id===taskId ? {
      ...t,
      subtasks: [...t.subtasks, { id: `s${Date.now()}`, name: 'New sub-item', status:'New', inheritsAssignee: true, inheritsDueDate: true, order: t.subtasks.length }]
    } : t))
  }

  const updateTask = (taskId: string, patch: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id===taskId ? { ...t, ...patch } : t))
  }

  const updateSubtask = (taskId: string, subId: string, patch: Partial<Subtask>) => {
    setTasks(prev => prev.map(t => t.id===taskId ? {
      ...t,
      subtasks: t.subtasks.map(s => s.id===subId ? { ...s, ...patch } : s)
    } : t))
  }

  const removeSubtask = (taskId: string, subId: string) => {
    setTasks(prev => prev.map(t => t.id===taskId ? { ...t, subtasks: t.subtasks.filter(s=>s.id!==subId) } : t))
  }

  const sectionHeader = (name: string) => (
    <div className="flex items-center justify-between px-2 py-3">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{name}</h2>
      <button className="btn-outline text-xs" onClick={addTask}>
        <span className="mr-1">＋</span> New Task
      </button>
    </div>
  )

  // ——— DnD helpers ———
  const taskItemIds = useMemo(() => tasks
    .slice()
    .sort((a,b)=>a.order-b.order)
    .map(t=>`task-${t.id}`), [tasks])

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
      setTasks(prev => prev.map(t => {
        if (t.id !== ta) return t
        const orderedSubs = t.subtasks.slice().sort((x,y)=>x.order-y.order)
        const oldIndex = orderedSubs.findIndex(s=>s.id===sa)
        const newIndex = orderedSubs.findIndex(s=>s.id===so)
        const moved = arrayMove(orderedSubs, oldIndex, newIndex).map((s: Subtask, i: number)=>({ ...s, order: i }))
        return { ...t, subtasks: moved }
      }))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">🌱 Tasks</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Plan, track, and ship. Subtasks can inherit assignee and due date from their parent.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline" onClick={addTask}>New</button>
          <button className="btn-primary">Import</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {sectionHeader('All Tasks')}
        {/* Faux sub-navigation */}
        <div className="px-3 pb-2 text-sm text-neutral-600 dark:text-neutral-300 flex items-center gap-4">
          <button className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium">All Tasks</button>
          <span className="text-neutral-400">•</span>
          <button className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">Timeline</button>
          <button className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">By Status</button>
          <button className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">3 more…</button>
        </div>
        <div className="max-h-[65vh] overflow-auto">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <div className="col-span-5">Name</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Assignee</div>
              <div className="col-span-1 text-right"> </div>
            </div>
          </div>
          <DndContext onDragEnd={onDragEnd}>
          <SortableContext items={taskItemIds} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {tasks.slice().sort((a,b)=>a.order-b.order).map((t) => (
            <div key={t.id} className="">
              {/* Parent row */}
              <SortableTaskRow id={`task-${t.id}`}>
              {({attributes, listeners}) => (
              <div className="px-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 odd:bg-neutral-50/40 dark:odd:bg-neutral-800/20">
                <div className="grid grid-cols-12 gap-2 items-center px-2 py-2">
                  <div className="col-span-5 flex items-center gap-2">
                    <button
                      className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      onClick={()=>updateTask(t.id, { expanded: !t.expanded })}
                      aria-label={t.expanded ? 'Collapse' : 'Expand'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-transform ${t.expanded ? 'rotate-90' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-grab active:cursor-grabbing"
                      aria-label="Drag task"
                      {...attributes}
                      {...listeners}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-neutral-400">
                        <path d="M10 6a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM10 12a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM10 18a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                    <input
                      className="input py-1 text-sm flex-1 truncate"
                      value={t.name}
                      onChange={(e)=>updateTask(t.id,{ name: e.target.value })}
                      title={t.name}
                    />
                  </div>
                  <div className="col-span-2">
                    {editingDue === `task:${t.id}` ? (
                      <input
                        type="date"
                        className="input py-1 text-sm"
                        value={t.dueDate ?? ''}
                        onChange={(e)=>updateTask(t.id,{ dueDate: e.target.value || null })}
                        onBlur={()=>setEditingDue(null)}
                        autoFocus
                      />
                    ) : (
                      <button
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDueTone(t.dueDate, t.status==='Completed')}`}
                        onClick={()=>setEditingDue(`task:${t.id}`)}
                      >
                        {formatDate(t.dueDate)}
                      </button>
                    )}
                  </div>
                  <div className="col-span-2">
                    {editingStatus === `task:${t.id}` ? (
                      <StatusSelect value={t.status} onChange={(s)=>{ updateTask(t.id,{ status: s }); setEditingStatus(null) }} />
                    ) : (
                      (()=>{
                        const ds = displayStatusFrom(t.status, t.dueDate)
                        const isAutoOverdue = ds === 'Overdue' && t.status !== 'Completed'
                        return (
                          <button
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusPillClasses[ds]} ${isAutoOverdue? 'cursor-default' : ''}`}
                            onClick={()=>{ if(!isAutoOverdue) setEditingStatus(`task:${t.id}`) }}
                            title={isAutoOverdue ? 'Status is auto-set to Overdue based on due date' : 'Click to edit status'}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDotClasses[ds]}`}></span>
                            {ds}
                          </button>
                        )
                      })()
                    )}
                  </div>
                  <div className="col-span-2">
                    {editingAssignee === `task:${t.id}` ? (
                      <AssigneeSelect
                        users={users}
                        value={t.assigneeId ?? ''}
                        onChange={(v)=>{ updateTask(t.id,{ assigneeId: v }); setEditingAssignee(null) }}
                      />
                    ) : (
                      <button
                        className="inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full text-left"
                        onClick={()=>setEditingAssignee(`task:${t.id}`)}
                      >
                        <Avatar user={t.assigneeId ? userById[t.assigneeId] : undefined} />
                        <span className="text-sm text-neutral-700 dark:text-neutral-200">
                          {t.assigneeId ? userById[t.assigneeId].name : 'Unassigned'}
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="col-span-1 text-right">
                    <button className="btn-outline text-xs" onClick={()=>addSubtask(t.id)}>+ Subtask</button>
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
                    return (
                      <SortableSubtaskRow key={s.id} id={`sub-${t.id}-${s.id}`}>
                      {({attributes, listeners}) => (
                      <div className="px-2">
                        <div className="grid grid-cols-12 gap-2 items-center px-2 py-2">
                          <div className="col-span-5 flex items-center gap-2 pl-6">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-neutral-400">
                              <path fillRule="evenodd" d="M19.5 4.5a.75.75 0 01.75.75v13.5a.75.75 0 01-1.5 0V5.25a.75.75 0 01.75-.75zM4.5 12a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H5.25A.75.75 0 014.5 12z" clipRule="evenodd" />
                            </svg>
                            <button
                              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-grab active:cursor-grabbing"
                              aria-label="Drag subtask"
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
                          <div className="col-span-2">
                            <div className="flex items-center">
                              {editingDue === `sub:${t.id}:${s.id}` && !s.inheritsDueDate ? (
                                <input
                                  type="date"
                                  className="input py-1 text-sm"
                                  value={effectiveDueDate ?? ''}
                                  onChange={(e)=>updateSubtask(t.id, s.id, { dueDate: e.target.value || null, inheritsDueDate: false })}
                                  onBlur={()=>setEditingDue(null)}
                                  autoFocus
                                />
                              ) : (
                                <button
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getDueTone(effectiveDueDate, s.status==='Completed')} ${s.inheritsDueDate ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  onClick={()=>{ if (!s.inheritsDueDate) setEditingDue(`sub:${t.id}:${s.id}`) }}
                                  title={s.inheritsDueDate ? 'Inherited from parent task' : 'Click to edit due date'}
                                >
                                  {formatDate(effectiveDueDate)}
                                </button>
                              )}
                            </div>
                            <InheritToggle
                              ariaLabel="Due date inheritance"
                              value={s.inheritsDueDate}
                              onChange={(toInherited)=>{
                                if (toInherited) {
                                  updateSubtask(t.id, s.id, { inheritsDueDate: true, dueDate: null })
                                } else {
                                  updateSubtask(t.id, s.id, { inheritsDueDate: false, dueDate: effectiveDueDate ?? null })
                                }
                              }}
                            />
                          </div>
                          <div className="col-span-2">
                            {editingStatus === `sub:${t.id}:${s.id}` ? (
                              <StatusSelect value={s.status} onChange={(st)=>{ updateSubtask(t.id,s.id,{ status: st }); setEditingStatus(null) }} />
                            ) : (
                              (()=>{
                                const ds = displayStatusFrom(s.status, effectiveDueDate)
                                const isAutoOverdue = ds === 'Overdue' && s.status !== 'Completed'
                                return (
                                  <button
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusPillClasses[ds]} ${isAutoOverdue? 'cursor-default' : ''}`}
                                    onClick={()=>{ if(!isAutoOverdue) setEditingStatus(`sub:${t.id}:${s.id}`) }}
                                    title={isAutoOverdue ? 'Status is auto-set to Overdue based on due date' : 'Click to edit status'}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusDotClasses[ds]}`}></span>
                                    {ds}
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
                                />
                              ) : (
                                <button
                                  className={`inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full text-left ${s.inheritsAssignee ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  onClick={()=>{ if (!s.inheritsAssignee) setEditingAssignee(`sub:${t.id}:${s.id}`) }}
                                  disabled={s.inheritsAssignee}
                                  title={s.inheritsAssignee ? 'Inherited from parent task' : 'Click to set assignee'}
                                >
                                  <Avatar user={effectiveAssigneeId ? userById[effectiveAssigneeId] : undefined} />
                                  <span className="text-sm text-neutral-700 dark:text-neutral-200">
                                    {effectiveAssigneeId ? userById[effectiveAssigneeId].name : 'Unassigned'}
                                  </span>
                                </button>
                              )}
                            </div>
                            <InheritToggle
                              ariaLabel="Assignee inheritance"
                              value={s.inheritsAssignee}
                              onChange={(toInherited)=>{
                                if (toInherited) {
                                  updateSubtask(t.id, s.id, { inheritsAssignee: true, assigneeId: null })
                                } else {
                                  updateSubtask(t.id, s.id, { inheritsAssignee: false, assigneeId: effectiveAssigneeId ?? null })
                                }
                              }}
                            />
                          </div>
                          <div className="col-span-1 text-right">
                            <button className="text-neutral-500 hover:text-rose-500 text-xs" onClick={()=>removeSubtask(t.id, s.id)}>Remove</button>
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
