import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AssigneeSelector } from '../AssigneeSelector'
import type { CreateTaskV2Data, TaskAssignee } from '../../types/tasks'
import type { Project as APIProject } from '../../../../../services/projectsService'
import type { User as APIUser } from '../../../../../types'

interface QuickCreateProps {
  projects: APIProject[]
  users: APIUser[]
  defaultProjectId?: string
  onCreate: (data: CreateTaskV2Data) => Promise<boolean>
  loading: boolean
  className?: string
}

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

export function QuickCreate({ 
  projects, 
  users,
  defaultProjectId, 
  onCreate, 
  loading, 
  className = '' 
}: QuickCreateProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || '')
  const [assignees, setAssignees] = useState<TaskAssignee[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !projectId) return

    const success = await onCreate({
      title: title.trim(),
      projectId,
      assigneeIds: assignees.map(a => a.id)
    })

    if (success) {
      setTitle('')
      setAssignees([])
      setIsExpanded(false)
    }
  }

  const handleCancel = () => {
    setTitle('')
    setAssignees([])
    setIsExpanded(false)
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`w-full flex items-center justify-center space-x-2 p-3 border-2 
                   border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg 
                   text-neutral-600 dark:text-neutral-400 hover:border-blue-400 
                   hover:text-blue-600 dark:hover:text-blue-400 transition-colors 
                   ${className}`}
      >
        <PlusIcon />
        <span className="text-sm font-medium">
          {t('tasksV2.quickCreate.placeholder')}
        </span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`bg-white dark:bg-neutral-800 border 
                                              border-neutral-200 dark:border-neutral-700 
                                              rounded-lg p-4 space-y-3 ${className}`}>
      {/* Task title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('tasksV2.quickCreate.titlePlaceholder')}
        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 
                   rounded-md text-sm placeholder-neutral-500 dark:placeholder-neutral-400
                   bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        autoFocus
        disabled={loading}
      />

      {/* Project and assignee selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project selection */}
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            {t('tasksV2.quickCreate.project')}
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 
                       rounded-md text-sm bg-white dark:bg-neutral-700 text-neutral-900 
                       dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:border-blue-500"
            disabled={loading}
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee selection */}
        <AssigneeSelector
          users={users}
          selectedAssignees={assignees}
          onAssigneesChange={setAssignees}
          disabled={loading}
          size="sm"
          maxAssignees={3}
          placeholder={t('tasksV2.assignee.selectPlaceholder')}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 
                     hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors
                     disabled:opacity-50"
        >
          {t('common.actions.cancel')}
        </button>
        <button
          type="submit"
          disabled={!title.trim() || !projectId || loading}
          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 
                     hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-md 
                     transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <SpinnerIcon />
              <span>{t('common.actions.creating')}</span>
            </>
          ) : (
            <>
              <PlusIcon />
              <span>{t('common.actions.create')}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}