import React from 'react'
import { useTranslation } from 'react-i18next'
import type { TaskFilters, TaskAssignee } from '../../types/tasks'
import type { Project as APIProject } from '../../../../../services/projectsService'
import type { User as APIUser } from '../../../../../types'

interface FilterBarProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  projects: APIProject[]
  users: APIUser[]
  className?: string
}

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

export function FilterBar({ filters, onFiltersChange, projects, users, className = '' }: FilterBarProps) {
  const { t } = useTranslation()

  const updateFilter = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      assignee: 'all',
      project: 'all',
      overdue: false,
      priority: 'all'
    })
  }

  const hasActiveFilters = filters.status !== 'all' || 
                          filters.assignee !== 'all' || 
                          filters.project !== 'all' ||
                          filters.overdue ||
                          filters.priority !== 'all' ||
                          filters.search.trim() !== ''

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Status Filter */}
      <div className="relative">
        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="appearance-none bg-white dark:bg-neutral-800 border border-neutral-200 
                     dark:border-neutral-600 rounded-lg px-3 py-2 pr-8 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     dark:text-white"
        >
          <option value="all">{t('tasksV2.filters.status.all')}</option>
          <option value="TODO">{t('tasksV2.filters.status.todo')}</option>
          <option value="IN_PROGRESS">{t('tasksV2.filters.status.inProgress')}</option>
          <option value="REVIEW">{t('tasksV2.filters.status.review')}</option>
          <option value="DONE">{t('tasksV2.filters.status.done')}</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <ChevronDownIcon />
        </div>
      </div>

      {/* Assignee Filter */}
      <div className="relative">
        <select
          value={filters.assignee}
          onChange={(e) => updateFilter('assignee', e.target.value)}
          className="appearance-none bg-white dark:bg-neutral-800 border border-neutral-200 
                     dark:border-neutral-600 rounded-lg px-3 py-2 pr-8 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     dark:text-white"
        >
          <option value="all">{t('tasksV2.filters.assignee.all')}</option>
          <option value="unassigned">{t('tasksV2.filters.assignee.unassigned')}</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <ChevronDownIcon />
        </div>
      </div>

      {/* Project Filter */}
      <div className="relative">
        <select
          value={filters.project}
          onChange={(e) => updateFilter('project', e.target.value)}
          className="appearance-none bg-white dark:bg-neutral-800 border border-neutral-200 
                     dark:border-neutral-600 rounded-lg px-3 py-2 pr-8 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     dark:text-white"
        >
          <option value="all">{t('tasksV2.filters.project.all')}</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <ChevronDownIcon />
        </div>
      </div>

      {/* Priority Filter */}
      <div className="relative">
        <select
          value={filters.priority}
          onChange={(e) => updateFilter('priority', e.target.value)}
          className="appearance-none bg-white dark:bg-neutral-800 border border-neutral-200 
                     dark:border-neutral-600 rounded-lg px-3 py-2 pr-8 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     dark:text-white"
        >
          <option value="all">{t('tasksV2.filters.priority.all')}</option>
          <option value="URGENT">{t('tasksV2.filters.priority.urgent')}</option>
          <option value="HIGH">{t('tasksV2.filters.priority.high')}</option>
          <option value="MEDIUM">{t('tasksV2.filters.priority.medium')}</option>
          <option value="LOW">{t('tasksV2.filters.priority.low')}</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <ChevronDownIcon />
        </div>
      </div>

      {/* Overdue Toggle */}
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={filters.overdue}
          onChange={(e) => updateFilter('overdue', e.target.checked)}
          className="sr-only"
        />
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
          ${filters.overdue 
            ? 'bg-red-500 border-red-500 text-white' 
            : 'border-neutral-300 dark:border-neutral-600'
          }`}>
          {filters.overdue && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
          {t('tasksV2.filters.overdue')}
        </span>
      </label>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 
                     dark:hover:text-blue-300 transition-colors"
        >
          {t('tasksV2.filters.clearAll')}
        </button>
      )}
    </div>
  )
}