import React, { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTasks } from './hooks/useTasks'
import { useTaskActions } from './hooks/useTaskActions'
import { SearchInput } from './components/TaskFilters/SearchInput'
import { FilterBar } from './components/TaskFilters/FilterBar'
import { TaskList } from './components/TaskList/TaskList'
import { QuickCreate } from './components/TaskCreate/QuickCreate'
import type { TaskFilters, TaskV2, TaskAssignee } from './types/tasks'

export function TasksV2() {
  const { t } = useTranslation()

  // Data hooks
  const { tasks, loading, error, projects, users, refreshTasks, getFilteredTasks } = useTasks()
  const taskActions = useTaskActions(refreshTasks)

  // Local state
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: 'all',
    assignee: 'all',
    project: 'all',
    overdue: false,
    priority: 'all'
  })
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Filtered tasks
  const filteredTasks = useMemo(() => 
    getFilteredTasks(filters), 
    [getFilteredTasks, filters]
  )

  // Task selection handlers
  const handleTaskSelect = useCallback((taskId: string, selected: boolean) => {
    setSelectedTasks(prev => 
      selected 
        ? [...prev, taskId]
        : prev.filter(id => id !== taskId)
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedTasks(filteredTasks.map(task => task.id))
  }, [filteredTasks])

  const handleDeselectAll = useCallback(() => {
    setSelectedTasks([])
  }, [])

  // Task action handlers
  const handleTaskStatusChange = useCallback(async (taskId: string, status: TaskV2['status']) => {
    await taskActions.updateTaskStatus(taskId, status)
  }, [taskActions])

  const handleTaskEdit = useCallback((task: TaskV2) => {
    // TODO: Open task edit modal
    console.log('Edit task:', task)
  }, [])

  const handleTaskDelete = useCallback(async (taskId: string) => {
    if (window.confirm(t('tasksV2.confirmDelete'))) {
      await taskActions.deleteTask(taskId)
      setSelectedTasks(prev => prev.filter(id => id !== taskId))
    }
  }, [taskActions, t])

  const handleTaskAssigneesChange = useCallback(async (taskId: string, assignees: TaskAssignee[]) => {
    const assigneeIds = assignees.map(a => a.id)
    await taskActions.updateTaskAssignees(taskId, assigneeIds)
  }, [taskActions])

  const handleQuickCreate = useCallback(async (data: any) => {
    const newTask = await taskActions.createTask(data)
    return !!newTask
  }, [taskActions])

  // Bulk actions
  const handleBulkStatusChange = useCallback(async (status: TaskV2['status']) => {
    if (selectedTasks.length === 0) return
    
    const success = await taskActions.bulkUpdateStatus(selectedTasks, status)
    if (success) {
      setSelectedTasks([])
      setShowBulkActions(false)
    }
  }, [selectedTasks, taskActions])

  const handleBulkDelete = useCallback(async () => {
    if (selectedTasks.length === 0) return
    
    const confirmMessage = t('tasksV2.confirmBulkDelete', { count: selectedTasks.length })
    if (!window.confirm(confirmMessage)) return
    
    const success = await taskActions.bulkDelete(selectedTasks)
    if (success) {
      setSelectedTasks([])
      setShowBulkActions(false)
    }
  }, [selectedTasks, taskActions, t])

  // Toggle bulk actions visibility
  React.useEffect(() => {
    setShowBulkActions(selectedTasks.length > 0)
  }, [selectedTasks.length])

  // Error handling
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                       rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-400 font-medium">
            {t('common.error')}
          </h3>
          <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
          <button
            onClick={() => refreshTasks()}
            className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-800 
                       dark:hover:text-red-200 underline"
          >
            {t('common.actions.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          {t('tasksV2.title')}
        </h1>
        <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
          {t('tasksV2.subtitle')}
        </p>
      </div>

      {/* Quick create */}
      <div className="mb-6">
        <QuickCreate
          projects={projects}
          users={users}
          onCreate={handleQuickCreate}
          loading={taskActions.isLoading()}
        />
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          value={filters.search}
          onChange={(search) => setFilters(prev => ({ ...prev, search }))}
          className="max-w-md"
        />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          projects={projects}
          users={users}
        />
      </div>

      {/* Bulk actions bar */}
      {showBulkActions && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 
                       dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {t('tasksV2.selectedCount', { count: selectedTasks.length })}
              </span>
              <button
                onClick={handleDeselectAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 
                           dark:hover:text-blue-200 underline"
              >
                {t('common.actions.deselectAll')}
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {/* Bulk status changes */}
              <button
                onClick={() => handleBulkStatusChange('IN_PROGRESS')}
                disabled={taskActions.isLoading()}
                className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                           text-white px-3 py-1 rounded-md transition-colors"
              >
                {t('tasksV2.bulkActions.markInProgress')}
              </button>
              <button
                onClick={() => handleBulkStatusChange('DONE')}
                disabled={taskActions.isLoading()}
                className="text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-400 
                           text-white px-3 py-1 rounded-md transition-colors"
              >
                {t('tasksV2.bulkActions.markDone')}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={taskActions.isLoading()}
                className="text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 
                           text-white px-3 py-1 rounded-md transition-colors"
              >
                {t('tasksV2.bulkActions.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task count and actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {loading ? (
            t('common.loading')
          ) : (
            <>
              {t('tasksV2.taskCount', { 
                count: filteredTasks.length, 
                total: tasks.length 
              })}
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSelectAll}
            disabled={filteredTasks.length === 0}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 
                       dark:hover:text-blue-200 disabled:opacity-50 underline"
          >
            {t('common.actions.selectAll')}
          </button>
          <button
            onClick={() => refreshTasks()}
            disabled={loading}
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 
                       dark:hover:text-neutral-200 disabled:opacity-50 underline"
          >
            {t('common.actions.refresh')}
          </button>
        </div>
      </div>

      {/* Task list */}
      <TaskList
        tasks={filteredTasks}
        users={users}
        loading={loading}
        selectedTasks={selectedTasks}
        onTaskSelect={handleTaskSelect}
        onTaskStatusChange={handleTaskStatusChange}
        onTaskAssigneesChange={handleTaskAssigneesChange}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
        actionLoading={taskActions.actionLoading}
      />

      {/* Action error display */}
      {taskActions.actionError && (
        <div className="fixed bottom-4 right-4 bg-red-50 dark:bg-red-900/20 border 
                       border-red-200 dark:border-red-800 rounded-lg p-4 max-w-sm">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-400 font-medium">
                {t('common.error')}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {taskActions.actionError}
              </p>
            </div>
            <button
              onClick={taskActions.clearError}
              className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 
                         dark:hover:text-red-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TasksV2