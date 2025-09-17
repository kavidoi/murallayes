import React from 'react'
import { useTranslation } from 'react-i18next'
import { InlineAssigneeSelector } from '../AssigneeSelector/InlineAssigneeSelector'
import type { TaskV2, TaskAssignee } from '../../types/tasks'
import type { User as APIUser } from '../../../../../types'

interface TaskItemProps {
  task: TaskV2
  selected: boolean
  users: APIUser[]
  onSelect: (selected: boolean) => void
  onStatusChange: (status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE') => void
  onAssigneesChange: (assignees: TaskAssignee[]) => void
  onEdit: () => void
  onDelete: () => void
  loading: boolean
}

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

function StatusBadge({ status, onClick }: { status: TaskV2['status'], onClick: () => void }) {
  const statusConfig = {
    TODO: { color: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300', label: 'Por hacer' },
    IN_PROGRESS: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', label: 'En progreso' },
    REVIEW: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', label: 'Revisión' },
    DONE: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', label: 'Completada' }
  }

  const config = statusConfig[status]

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                  hover:opacity-80 transition-opacity ${config.color}`}
    >
      {config.label}
    </button>
  )
}

function PriorityBadge({ priority }: { priority: TaskV2['priority'] }) {
  const priorityConfig = {
    LOW: { color: 'text-neutral-500', symbol: '○' },
    MEDIUM: { color: 'text-blue-500', symbol: '●' },
    HIGH: { color: 'text-orange-500', symbol: '●' },
    URGENT: { color: 'text-red-500', symbol: '●' }
  }

  const config = priorityConfig[priority]

  return (
    <span className={`text-sm font-medium ${config.color}`} title={priority}>
      {config.symbol}
    </span>
  )
}


function formatDueDate(dueDate: string): { text: string, isOverdue: boolean, className: string } {
  const date = new Date(dueDate)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const isOverdue = taskDate < today
  const isToday = taskDate.getTime() === today.getTime()
  const isTomorrow = taskDate.getTime() === today.getTime() + 24 * 60 * 60 * 1000
  
  let text: string
  let className: string
  
  if (isToday) {
    text = 'Hoy'
    className = 'text-orange-600 dark:text-orange-400'
  } else if (isTomorrow) {
    text = 'Mañana'
    className = 'text-blue-600 dark:text-blue-400'
  } else if (isOverdue) {
    text = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    className = 'text-red-600 dark:text-red-400'
  } else {
    text = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    className = 'text-neutral-600 dark:text-neutral-400'
  }
  
  return { text, isOverdue, className }
}

export function TaskItem({ 
  task, 
  selected, 
  users,
  onSelect, 
  onStatusChange, 
  onAssigneesChange,
  onEdit, 
  onDelete, 
  loading 
}: TaskItemProps) {
  const { t } = useTranslation()

  const dueDateInfo = task.dueDate ? formatDueDate(task.dueDate) : null

  return (
    <div className={`group relative bg-white dark:bg-neutral-800 border border-neutral-200 
                     dark:border-neutral-700 rounded-lg p-4 hover:shadow-md 
                     transition-all duration-200 ${selected ? 'ring-2 ring-blue-500' : ''}
                     ${loading ? 'opacity-50' : ''}`}>
      
      {/* Selection checkbox */}
      <div className="absolute top-4 left-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-neutral-100 border-neutral-300 rounded 
                     focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-neutral-800 
                     focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
        />
      </div>

      {/* Main content */}
      <div className="ml-8">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Title and priority */}
            <div className="flex items-center space-x-2 mb-1">
              <PriorityBadge priority={task.priority} />
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                {task.title}
              </h3>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 mb-2">
                {task.description}
              </p>
            )}

            {/* Meta information */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Project */}
                {task.projectName && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {task.projectName}
                  </span>
                )}

                {/* Due date */}
                {dueDateInfo && (
                  <span className={`text-xs font-medium ${dueDateInfo.className}`}>
                    {dueDateInfo.isOverdue && '⚠️ '}
                    {dueDateInfo.text}
                  </span>
                )}
              </div>

              {/* Assignees */}
              <InlineAssigneeSelector
                users={users}
                assignees={task.assignees}
                onAssigneesChange={onAssigneesChange}
                loading={loading}
                maxVisible={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              disabled={loading}
              className="p-1.5 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 
                         transition-colors"
              title="Editar tarea"
            >
              <EditIcon />
            </button>
            <button
              onClick={onDelete}
              disabled={loading}
              className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 
                         transition-colors"
              title="Eliminar tarea"
            >
              <DeleteIcon />
            </button>
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-3 flex items-center justify-between">
          <StatusBadge 
            status={task.status} 
            onClick={() => {
              // Cycle through statuses
              const nextStatus = {
                TODO: 'IN_PROGRESS',
                IN_PROGRESS: 'REVIEW',
                REVIEW: 'DONE',
                DONE: 'TODO'
              }[task.status] as TaskV2['status']
              onStatusChange(nextStatus)
            }}
          />

          {/* Overdue indicator */}
          {task.isOverdue && task.status !== 'DONE' && (
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
              Vencida
            </span>
          )}
        </div>
      </div>
    </div>
  )
}