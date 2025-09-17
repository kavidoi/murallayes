import React from 'react'
import { useTranslation } from 'react-i18next'
import { TaskItem } from './TaskItem'
import type { TaskV2, TaskAssignee } from '../../types/tasks'
import type { User as APIUser } from '../../../../../types'

interface TaskListProps {
  tasks: TaskV2[]
  users: APIUser[]
  loading: boolean
  selectedTasks: string[]
  onTaskSelect: (taskId: string, selected: boolean) => void
  onTaskStatusChange: (taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE') => void
  onTaskAssigneesChange: (taskId: string, assignees: TaskAssignee[]) => void
  onTaskEdit: (task: TaskV2) => void
  onTaskDelete: (taskId: string) => void
  actionLoading: string | null
  className?: string
}

const EmptyState = () => {
  const { t } = useTranslation()
  
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600">
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
        {t('tasksV2.empty.title')}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {t('tasksV2.empty.description')}
      </p>
    </div>
  )
}

const LoadingState = () => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 
                         dark:border-neutral-700 rounded-lg p-4">
            <div className="flex items-start space-x-4">
              <div className="w-4 h-4 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4"></div>
                  <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TaskList({
  tasks,
  users,
  loading,
  selectedTasks,
  onTaskSelect,
  onTaskStatusChange,
  onTaskAssigneesChange,
  onTaskEdit,
  onTaskDelete,
  actionLoading,
  className = ''
}: TaskListProps) {
  const { t } = useTranslation()

  if (loading) {
    return <LoadingState />
  }

  if (tasks.length === 0) {
    return <EmptyState />
  }

  // Group tasks by status for better organization
  const tasksByStatus = tasks.reduce((acc, task) => {
    const status = task.status
    if (!acc[status]) acc[status] = []
    acc[status].push(task)
    return acc
  }, {} as Record<string, TaskV2[]>)

  const statusOrder = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']
  const statusLabels = {
    TODO: 'Por hacer',
    IN_PROGRESS: 'En progreso',
    REVIEW: 'En revisión',
    DONE: 'Completadas'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {statusOrder.map(status => {
        const statusTasks = tasksByStatus[status] || []
        if (statusTasks.length === 0) return null

        return (
          <div key={status} className="space-y-3">
            {/* Status header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                {statusLabels[status as keyof typeof statusLabels]} ({statusTasks.length})
              </h3>
              <div className="h-px bg-neutral-200 dark:bg-neutral-700 flex-1 ml-4"></div>
            </div>

            {/* Tasks in this status */}
            <div className="space-y-3">
              {statusTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  users={users}
                  selected={selectedTasks.includes(task.id)}
                  onSelect={(selected) => onTaskSelect(task.id, selected)}
                  onStatusChange={(newStatus) => onTaskStatusChange(task.id, newStatus)}
                  onAssigneesChange={(assignees) => onTaskAssigneesChange(task.id, assignees)}
                  onEdit={() => onTaskEdit(task)}
                  onDelete={() => onTaskDelete(task.id)}
                  loading={actionLoading === task.id}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}